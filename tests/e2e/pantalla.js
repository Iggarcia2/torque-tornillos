// tests/e2e/pantalla.js
'use strict';
/* Prueba de interfaz en Chromium real: sin errores de consola, sin pedidos de red, resultados coherentes con el núcleo,
   entradas inválidas sin NaN, copiar resumen, aviso del guarda de carga (archivo faltante, estilos faltantes, error de arranque),
   política de seguridad estricta por http, y capturas (escritorio, celular, modo oscuro) en tests/e2e/salida/.
   Requisitos: npm install && npx playwright install chromium */
const fs = require('fs'), path = require('path'), http = require('http');
let chromium;
try { chromium = require('playwright').chromium; } catch (e) { try { chromium = require('/opt/npm-tools/node_modules/playwright').chromium; } catch (e2) { console.error('Falta playwright: npm install && npx playwright install chromium'); process.exit(2); } }
const RAIZ = path.resolve(__dirname, '..', '..');
const T = require('../lib/cargar.js').crear(['nucleo'], 'Torque');
const ARCHIVO = 'file://' + path.join(RAIZ, 'index.html');
const OUT = path.resolve(__dirname, 'salida');
fs.mkdirSync(OUT, { recursive: true });
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src data:; base-uri 'none'; form-action 'none'";
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const servidor = http.createServer((q, s) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { s.writeHead(404); return s.end('no existe'); }
  s.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', 'content-security-policy': CSP });
  fs.createReadStream(f).pipe(s);
});
let ok = 0, fail = 0;
const chk = (n, c, x) => { if (c) ok++; else { fail++; console.log('FALLA  ' + n + (x !== undefined ? '  → ' + x : '')); } };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const consola = [], errores = [], pedidos = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errores.push(e.message));
  page.on('request', r => pedidos.push(r.url()));
  await page.goto(ARCHIVO);
  await page.waitForSelector('.hero');

  const txt = async sel => (await page.locator(sel).first().innerText()).trim();
  const heroN = async () => (await page.locator('.hero-val .n').count()) ? txt('.hero-val .n') : 'ERROR: ' + (await txt('.error')).replace(/\n/g, ' ');
  const todo = () => page.locator('body').innerText();

  /* 1. Estado inicial: M10 8.8, S235, seca, 75 % */
  chk('hero inicial = 50,5', (await heroN()) === T.fmtT(0.2 * 0.010 * 0.75 * 580 * 57.99), await heroN());
  chk('unidad N·m y lbf·ft visibles', (await txt('.hero-val .u')) === 'N·m' && (await txt('.hero-alt')).includes('lbf·ft'));
  chk('trio mín/nom/máx', (await page.locator('.mini').count()) === 3);
  const t0 = await todo();
  chk('sin NaN/undefined en pantalla', !/NaN|undefined|Infinity/.test(t0));
  chk('guía técnica presente', t0.includes('Guía técnica') && t0.includes('T = K · D · Fi'));
  chk('tabla de K con 6 condiciones', (await page.locator('#guia table').first().locator('tbody tr').count()) === 6);
  chk('opciones de tamaño métrico gruesa', (await page.locator('#tamano option').count()) === 18 + 1);
  chk('datos del tornillo (As)', (await txt('#datosTornillo')).includes('58,0 mm²'), await txt('#datosTornillo'));
  await page.screenshot({ path: OUT + '/1_escritorio.png', fullPage: true });

  /* 2. Cambio de lubricación y precarga */
  await page.selectOption('#lub', 'antiengrane');
  const nAS = await heroN();
  chk('antiengrane baja el torque', parseFloat(nAS.replace(',', '.')) < 35, nAS);
  chk('alerta de no usar torque en seco', (await todo()).includes('No uses el torque de tablas de rosca seca'));
  await page.selectOption('#lub', 'seca');
  await page.click('#chipsPct button:nth-child(3)');
  chk('chip 90 % → número y slider', (await page.inputValue('#pctNum')) === '90' && (await page.inputValue('#pctRng')) === '90');
  chk('90 % seco → alerta peligro dispersión', (await page.locator('.al.peligro').count()) >= 1);
  await page.fill('#pctNum', '75');
  chk('volver a 75 %', (await heroN()) === '50,5');

  /* 3. Aluminio con poco engrane → barrido y torque reducido */
  await page.selectOption('#material', 'aluminio_6061');
  await page.check('#arandela');
  await page.fill('#le', '8');
  const reducido = await txt('.hero-badge');
  chk('aluminio 8 mm: badge de torque reducido', /Reducido por la resistencia de la rosca/.test(reducido), reducido);
  chk('aluminio 8 mm: valor 40,8', (await heroN()) === '40,8', await heroN());
  chk('alerta de barrido con longitud mínima 20,0 mm', (await todo()).includes('Riesgo de barrido de rosca') && (await todo()).includes('20,0 mm'));
  chk('hint de longitud recomendada', (await txt('#leHint')).includes('recomendado ≥ 20,0 mm'), await txt('#leHint'));
  await page.screenshot({ path: OUT + '/2_aluminio_barrido.png', fullPage: true });
  await page.click('#chipsLe button:nth-child(5)');       // 3 × D
  chk('chip 3 × D → 30 mm y sin riesgo', (await page.inputValue('#le')) === '30' && (await page.locator('.hero-badge').count()) === 0);
  chk('estado barrido CUMPLE', (await page.locator('.card:has-text("Verificación al barrido") .badge').innerText()) === 'CUMPLE');

  /* 4. Unificada: 1/2" UNC SAE 5 */
  await page.selectOption('#material', 'acero_s235');
  await page.selectOption('#sistema', 'unificada');
  chk('tamaño más cercano a M10 = 3/8"', (await page.inputValue('#tamano')) === '3/8-16UNC', await page.inputValue('#tamano'));
  await page.selectOption('#tamano', '1/2-13UNC');
  chk('serie UNC por defecto', (await page.inputValue('#serie')) === 'UNC');
  chk('clase SAE5 por defecto', (await page.inputValue('#clase')) === 'SAE5');
  chk('tamaño elegido 1/2"', (await page.inputValue('#tamano')) === '1/2-13UNC', await page.inputValue('#tamano'));
  chk('unidad de engrane se respeta si el usuario ya la tocó (mm)', (await page.inputValue('#leUnidad')) === 'mm');
  const lbf = await txt('.hero-alt');
  chk('1/2-13 SAE5 ≈ 75,4 lbf·ft', lbf.includes('75,4'), lbf);
  await page.selectOption('#serie', 'UNF');
  chk('conserva el diámetro al pasar a UNF', (await page.inputValue('#tamano')) === '1/2-20UNF', await page.inputValue('#tamano'));
  chk('lista UNF', (await page.locator('#tamano option').count()) === 14 + 1);
  await page.selectOption('#sistema', 'metrica');
  chk('vuelve a métrica: clase 8.8 y M12 (≈12,7 mm)', (await page.inputValue('#clase')) === '8.8' && (await page.inputValue('#tamano')) === 'M12', await page.inputValue('#tamano'));

  /* 5. Tamaño personalizado */
  await page.selectOption('#tamano', '__otro__');
  chk('campos personalizados visibles', await page.locator('#personal').isVisible());
  await page.fill('#pD', '10'); await page.fill('#pP', '1,5');
  await page.fill('#le', '15');
  await page.selectOption('#leUnidad', 'mm');
  chk('personalizado M10×1,5 = 50,5 N·m', (await heroN()) === '50,5', await heroN());
  await page.fill('#pP', '8');
  chk('paso absurdo → error visible', await page.locator('.error').isVisible() && (await txt('.error')).includes('paso'), await txt('.error'));
  chk('sin NaN con error', !/NaN|undefined/.test(await todo()));
  chk('barra móvil indica error', (await txt('#barra')).includes('Revisá'));
  await page.fill('#pP', '1.5');                          // punto decimal también
  chk('punto decimal aceptado', (await heroN()) === '50,5');
  await page.fill('#pD', 'abc');
  chk('texto en diámetro → error', await page.locator('.error').isVisible() && (await page.getAttribute('#pD', 'aria-invalid')) === 'true');
  await page.fill('#pD', '10');

  /* 6. Entradas inválidas */
  for (const [id, valor] of [['#le', ''], ['#le', '-5'], ['#le', '1e9'], ['#pctNum', '0'], ['#pctNum', '150'], ['#pctNum', 'abc']]) {
    const antes = await page.inputValue(id);
    await page.fill(id, valor);
    const hayError = await page.locator('.error').isVisible();
    const limpio = !/NaN|undefined|Infinity/.test(await todo());
    chk('entrada inválida ' + id + '=' + JSON.stringify(valor) + ' → error claro y sin NaN', hayError && limpio);
    await page.fill(id, antes);
  }
  chk('se recupera tras corregir', (await heroN()) === '50,5' && !(await page.locator('.error').isVisible()));

  /* 7. Material personalizado */
  await page.selectOption('#material', 'personalizado');
  chk('campo Rm visible', await page.locator('#campoRm').isVisible());
  await page.fill('#rmMat', '290'); await page.fill('#le', '8'); await page.check('#arandela');
  chk('Rm personalizado = Al 6061 → 40,8', (await heroN()) === '40,8', await heroN());
  await page.fill('#rmMat', '-1');
  chk('Rm inválido → error', await page.locator('.error').isVisible());
  await page.selectOption('#material', 'acero_s235'); await page.fill('#le', '15');

  /* 8. Inoxidable seco → gripado */
  await page.selectOption('#clase', 'A2-70');
  chk('inox seco: aviso de gripado y K 0,30', (await todo()).includes('gripado') && (await txt('#kInfo')).includes('0,30'));
  chk('etiqueta de precarga con Rp0,2', (await txt('#lblPct')).includes('Rp0,2'));
  await page.selectOption('#clase', '8.8');

  /* 9. Copiar resumen */
  await page.click('.btn');
  await page.waitForTimeout(200);
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  chk('copiar resumen: contenido', copiado.includes('TORQUE RECOMENDADO: 50,5 N·m') && copiado.includes('lbf·ft') && copiado.includes('D = 10,00 mm'), copiado.slice(0, 200));
  chk('mensaje de copiado', (await txt('.estado')).includes('copiado'));

  /* 10. Teclado / accesibilidad básica */
  const sinEtiqueta = await page.evaluate(() => [...document.querySelectorAll('input,select,textarea')].filter(n => !n.hidden && !n.closest('[hidden]') && !(n.labels && n.labels.length) && !n.getAttribute('aria-label')).map(n => n.id));
  chk('todos los controles tienen etiqueta', sinEtiqueta.length === 0, sinEtiqueta.join(','));

  /* 11. Red y consola */
  chk('sin errores de página', errores.length === 0, errores.join(' | '));
  chk('sin errores/avisos de consola', consola.length === 0, consola.join(' | '));
  chk('sin pedidos externos', pedidos.every(u => u.startsWith('file://') || u.startsWith('data:')), pedidos.filter(u => !u.startsWith('file://')).join(','));

  /* 11b. Por http con política de seguridad estricta (sin scripts ni estilos en línea) y avisos del guarda de carga */
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const URL = 'http://127.0.0.1:' + servidor.address().port + '/index.html';
  const abrir = async (preparar) => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 } }), p = await c.newPage(), msgs = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(m.text()); });
    p.on('pageerror', e => msgs.push('pageerror: ' + e.message));
    if (preparar) await preparar(p);
    await p.goto(URL); await p.waitForTimeout(400);
    const aviso = await p.locator('[role=alert]').count() ? (await p.locator('[role=alert]').first().innerText()) : null;
    const listo = await p.evaluate(() => window.__TORQUE_LISTO__ === true);
    const hero = await p.locator('.hero-val .n').count();
    await c.close();
    return { msgs, aviso, listo, hero };
  };
  let r = await abrir();
  chk('http + CSP estricta: arranca, sin avisos ni violaciones de la política', r.listo && r.hero === 1 && r.aviso === null && r.msgs.length === 0, JSON.stringify(r));
  r = await abrir(p => p.route('**/js/nucleo/calculo.js', rt => rt.abort()));
  chk('guarda: script faltante → aviso con el nombre del archivo', r.aviso && r.aviso.includes('js/nucleo/calculo.js') && !r.listo, JSON.stringify(r.aviso));
  r = await abrir(p => p.route('**/css/estilos.css', rt => rt.fulfill({ status: 404, body: 'no' })));
  chk('guarda: estilos con 404 → aviso con el nombre del archivo', r.aviso && r.aviso.includes('css/estilos.css') && r.aviso.includes('no se aplicaron'), JSON.stringify(r.aviso));
  r = await abrir(p => p.route('**/css/estilos.css', rt => rt.abort()));
  chk('guarda: estilos que no descargan → aviso con el nombre del archivo', r.aviso && r.aviso.includes('css/estilos.css') && r.aviso.includes('no se aplicaron'), JSON.stringify(r.aviso));
  r = await abrir(p => p.route('**/css/estilos.css', rt => rt.fulfill({ status: 200, contentType: 'text/css', body: '/* vacío */' })));
  chk('guarda: estilos vacíos (200) → aviso de que no se aplicaron', r.aviso && r.aviso.includes('css/estilos.css') && r.aviso.includes('no se aplicaron'), JSON.stringify(r.aviso));
  r = await abrir(p => p.route('**/js/ui/eventos.js', rt => rt.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("falla de prueba");' })));
  chk('guarda: error al iniciar → aviso con el mensaje', r.aviso && r.aviso.includes('falla de prueba') && !r.listo, JSON.stringify(r.aviso));
  r = await abrir(p => p.route('**/js/arranque.js', rt => rt.fulfill({ status: 200, contentType: 'text/javascript', body: '/* vacío */' })));
  chk('guarda: arranque que no termina (archivo vacío) → «no terminó de iniciar»', r.aviso && r.aviso.includes('no terminó de iniciar') && !r.listo, JSON.stringify(r.aviso));
  servidor.close();

  /* 12. Capturas celular y oscuro */
  await page.reload(); await page.waitForSelector('.hero');
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pm = await m.newPage(); await pm.goto(ARCHIVO); await pm.waitForSelector('.hero');
  await pm.screenshot({ path: OUT + '/3_celular_arriba.png' });
  await pm.screenshot({ path: OUT + '/3_celular_completo.png', fullPage: true });
  await pm.evaluate(() => document.getElementById('res').scrollIntoView());
  await pm.screenshot({ path: OUT + '/3_celular_resultados.png' });
  const anchoDoc = await pm.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  chk('celular: sin scroll horizontal', anchoDoc[0] <= anchoDoc[1] + 1, anchoDoc.join('/'));
  await m.close();
  const d = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  const pd = await d.newPage(); await pd.goto(ARCHIVO); await pd.waitForSelector('.hero');
  await pd.selectOption('#material', 'aluminio_fundido'); await pd.fill('#le', '12');
  await pd.screenshot({ path: OUT + '/4_oscuro.png', fullPage: true });
  await d.close();

  await browser.close();
  console.log('\nverificaciones OK: ' + ok + '   FALLAS: ' + fail);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
