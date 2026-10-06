// tests/correr_todo.js
'use strict';
/* Corre toda la verificación y termina con código distinto de 0 si algo falla (nada se omite en silencio):
     node tests/correr_todo.js          unitarias + contraste con la implementación independiente en Python
     node tests/correr_todo.js --e2e    suma la prueba de pantalla (Chromium con Playwright) */
const { spawnSync } = require('child_process'), path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const e2e = process.argv.includes('--e2e');

function ejecutar(nombre, cmd, args) {
  console.log('\n== ' + nombre + ' ==');
  const r = spawnSync(cmd, args, { cwd: RAIZ, stdio: 'inherit' });
  if (r.error) { console.log('No se pudo ejecutar «' + cmd + '»: ' + r.error.message); return false; }
  return r.status === 0;
}
function pythonDisponible() {
  for (const c of ['python3', 'python']) { const r = spawnSync(c, ['--version'], { stdio: 'ignore' }); if (!r.error && r.status === 0) return c; }
  return null;
}

const py = pythonDisponible();
const resultados = [
  ['Unitarias del cálculo', ejecutar('Unitarias del cálculo (tablas publicadas, casos a mano, 1,1 millones de combinaciones, entradas inválidas)', process.execPath, ['tests/unit/test_nucleo.js'])],
  ['Generar casos de referencia', ejecutar('Casos de referencia', process.execPath, ['tests/ref/gen_casos.js'])],
  ['Contraste con Python', py ? ejecutar('Contraste con la implementación independiente (' + py + ')', py, ['tests/ref/ref.py']) : (console.log('\n== Contraste con Python ==\nNo hay Python 3 instalado: este paso NO se pudo correr.'), false)],
];
if (e2e) resultados.push(['Prueba de pantalla', ejecutar('Prueba de pantalla (Chromium)', process.execPath, ['tests/e2e/pantalla.js'])]);

console.log('\n── Resumen ──');
resultados.forEach(x => console.log((x[1] ? 'OK     ' : 'FALLA  ') + x[0]));
if (!e2e) console.log('(la prueba de pantalla no se corrió: usá --e2e)');
process.exit(resultados.every(x => x[1]) ? 0 : 1);
