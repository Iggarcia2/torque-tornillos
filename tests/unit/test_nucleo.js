// tests/unit/test_nucleo.js
'use strict';
/* Verificación del núcleo de cálculo contra: (1) áreas resistentes publicadas (ISO 898-1 / ASME B1.1),
   (2) torques de tablas de uso común (75 % del proof load, K = 0,20), (3) casos hechos a mano,
   (4) barrido de todas las combinaciones, (5) entradas inválidas / basura. */
const T = require('../lib/cargar.js').crear(['nucleo'], 'Torque');   // todos los módulos sin DOM, en el orden de index.html
const { DATOS, CONST } = T;
let ok = 0, fail = 0;
function chk(nombre, cond, extra) { if (cond) ok++; else { fail++; console.log('FALLA  ' + nombre + (extra !== undefined ? '  → ' + extra : '')); } }
function cerca(nombre, val, esp, tolRel) { const e = Math.abs(val - esp) / Math.abs(esp); chk(nombre, e <= tolRel, 'obtenido ' + val + ' esperado ' + esp + ' (err ' + (e * 100).toFixed(3) + ' %)'); }

const get = (lista, id) => lista.find(x => x.id === id);
const baseM = { sistema: 'metrica', D_mm: 10, P_mm: 1.5, claseId: '8.8', materialId: 'acero_s235', Le_mm: 15, arandela: false, lubId: 'seca', pct: 75 };

/* ── 1. Áreas resistentes publicadas (mm²) ── */
const AS_M_GRUESA = { M3: 5.03, M4: 8.78, M5: 14.2, M6: 20.1, M8: 36.6, M10: 58.0, M12: 84.3, M14: 115, M16: 157, M18: 192, M20: 245, M22: 303,
  M24: 353, M27: 459, M30: 561, M33: 694, M36: 817, M39: 976 };
for (const [id, a] of Object.entries(AS_M_GRUESA)) {
  const t = get(DATOS.roscas.metrica.gruesa, id); const g = T.geometriaRosca('metrica', t.D_mm, t.P_mm);
  cerca('As ' + id, g.As, a, 0.006);
}
const AS_M_FINA = { 'M8x1': 39.2, 'M10x1.25': 61.2, 'M12x1.5': 88.1, 'M14x1.5': 125, 'M16x1.5': 167, 'M18x1.5': 216, 'M20x1.5': 272, 'M22x1.5': 333,
  'M24x2': 384, 'M27x2': 496, 'M30x2': 621, 'M33x2': 761, 'M36x3': 865, 'M39x3': 1030, 'M10x1': 64.5, 'M12x1.25': 92.1 };
for (const [id, a] of Object.entries(AS_M_FINA)) {
  const t = get(DATOS.roscas.metrica.fina, id); chk('existe ' + id, !!t); if (!t) continue;
  cerca('As ' + id, T.geometriaRosca('metrica', t.D_mm, t.P_mm).As, a, 0.006);
}
const AS_UN_IN2 = { // ASME B1.1, in²
  '1/4-20UNC': 0.0318, '5/16-18UNC': 0.0524, '3/8-16UNC': 0.0775, '7/16-14UNC': 0.1063, '1/2-13UNC': 0.1419, '9/16-12UNC': 0.182, '5/8-11UNC': 0.226,
  '3/4-10UNC': 0.334, '7/8-9UNC': 0.462, '1-8UNC': 0.606, '1-1/8-7UNC': 0.763, '1-1/4-7UNC': 0.969, '1-3/8-6UNC': 1.155, '1-1/2-6UNC': 1.405,
  '1/4-28UNF': 0.0364, '5/16-24UNF': 0.058, '3/8-24UNF': 0.0878, '7/16-20UNF': 0.1187, '1/2-20UNF': 0.1599, '9/16-18UNF': 0.203, '5/8-18UNF': 0.256,
  '3/4-16UNF': 0.373, '7/8-14UNF': 0.509, '1-12UNF': 0.663, '1-1/8-12UNF': 0.856, '1-1/4-12UNF': 1.073, '1-3/8-12UNF': 1.315, '1-1/2-12UNF': 1.581 };
for (const [id, a] of Object.entries(AS_UN_IN2)) {
  const t = get(DATOS.roscas.unificada.UNC, id) || get(DATOS.roscas.unificada.UNF, id); chk('existe ' + id, !!t); if (!t) continue;
  cerca('As ' + id, T.geometriaRosca('unificada', t.D_mm, t.P_mm).As / 645.16, a, 0.006);
}
chk('cantidad de roscas', DATOS.roscas.metrica.gruesa.length === 18 && DATOS.roscas.metrica.fina.length === 17 && DATOS.roscas.unificada.UNC.length === 14 && DATOS.roscas.unificada.UNF.length === 14);
{ const ids = [].concat(DATOS.roscas.metrica.gruesa, DATOS.roscas.metrica.fina, DATOS.roscas.unificada.UNC, DATOS.roscas.unificada.UNF).map(x => x.id);
  chk('ids de rosca únicos', new Set(ids).size === ids.length); }

/* ── 2. Propiedades de clase ── */
{
  const p = (id, D) => T.propsClase(get(DATOS.clases, id), D);
  chk('8.8 d<=16', p('8.8', 16).Sp === 580 && p('8.8', 16).Rm === 800 && p('8.8', 16).Rp === 640);
  chk('8.8 d>16', p('8.8', 20).Sp === 600 && p('8.8', 20).Rm === 830 && p('8.8', 20).Rp === 660);
  chk('10.9', p('10.9', 12).Sp === 830 && p('10.9', 12).Rm === 1040 && p('10.9', 12).Rp === 940);
  chk('12.9', p('12.9', 12).Sp === 970 && p('12.9', 12).Rm === 1220 && p('12.9', 12).Rp === 1100);
  chk('4.6', p('4.6', 12).Sp === 225 && p('4.6', 12).Rm === 400 && p('4.6', 12).Rp === 240);
  chk('A2-70', p('A2-70', 12).Rp === 450 && p('A2-70', 12).Sp === null && p('A2-70', 30).fueraAlcance === true && p('A2-70', 24).fueraAlcance === false);
  const k = 6.894757293;
  chk('SAE5 <=1in', Math.abs(p('SAE5', 25.4).Sp - 85 * k) < 1e-6 && Math.abs(p('SAE5', 25.4).Rm - 120 * k) < 1e-6);
  chk('SAE5 >1in', Math.abs(p('SAE5', 28.575).Sp - 74 * k) < 1e-6);
  chk('SAE2 <=3/4', Math.abs(p('SAE2', 0.75 * 25.4).Sp - 55 * k) < 1e-6);
  chk('SAE2 >3/4', Math.abs(p('SAE2', 0.875 * 25.4).Sp - 33 * k) < 1e-6);
  chk('SAE8', Math.abs(p('SAE8', 38.1).Sp - 120 * k) < 1e-6 && p('SAE8', 38.1).fueraAlcance === false && p('SAE8', 40).fueraAlcance === true);
}

/* ── 3. Torques contra tablas de uso común (75 % Sp, K = 0,20) y cálculo a mano ── */
{
  const r = T.calcular(baseM);
  chk('M10 8.8 ok', r.ok);
  cerca('M10 8.8 As', r.rosca.As, 57.99, 0.001);
  cerca('M10 8.8 Fobj [N]', r.Fobj, 0.75 * 580 * r.rosca.As, 1e-12);
  cerca('M10 8.8 T nom [N·m] (hecho a mano 50,4)', r.torque.nom, 0.2 * 0.010 * 0.75 * 580 * 57.99, 0.001);
  cerca('M10 8.8 T min', r.torque.min, 0.15 * 0.010 * r.Fobj, 1e-12);
  cerca('M10 8.8 T max', r.torque.max, 0.25 * 0.010 * r.Fobj, 1e-12);
  cerca('M10 8.8 lbf·ft', r.conv.nom.lbfft, r.torque.nom * 0.7375621493, 1e-9);
  cerca('M10 8.8 kgf·m', r.conv.nom.kgfm, r.torque.nom * 0.1019716213, 1e-9);
  chk('M10 8.8 sin limitación', r.limitante === null && r.pctAplicada > 74.999 && r.pctAplicada < 75.001);
  cerca('M10 8.8 precarga real máx = 100 % Sp (K 0,15–0,25 al 75 %)', r.precarga.pctRealMax, 100, 1e-9);
  cerca('M10 8.8 precarga real mín', r.precarga.pctRealMin, 60, 1e-9);

  const m3 = T.calcular({ ...baseM, D_mm: 3, P_mm: 0.5, Le_mm: 4.5 });
  cerca('M3 8.8 T [N·m] (≈1,3)', m3.torque.nom, 0.2 * 0.003 * 0.75 * 580 * m3.rosca.As, 1e-9);
  chk('M3 ≈ 1,3 N·m', m3.torque.nom > 1.25 && m3.torque.nom < 1.40, m3.torque.nom);

  const m12 = T.calcular({ ...baseM, D_mm: 12, P_mm: 1.75, claseId: '10.9', lubId: 'aceitada', Le_mm: 18, arandela: true });
  cerca('M12 10.9 aceitada con arandela [hecho a mano 94,4]', m12.torque.nom, 0.15 * 0.012 * 0.75 * 830 * 84.27, 0.002);
  const m12s = T.calcular({ ...baseM, D_mm: 12, P_mm: 1.75, claseId: '10.9', lubId: 'aceitada', Le_mm: 18 });
  chk('M12 10.9 sobre S235 sin arandela: limita la presión bajo cabeza (520 > 490 MPa)', m12s.limitante === 'cabeza' && m12s.alertas.some(x => x.id === 'limite_cabeza'), m12s.limitante);
  cerca('  …y el torque limitado = K·D·pG·Ab', m12s.torque.nom, 0.15 * 0.012 * 490 * m12s.cabeza.Ab, 1e-9);

  const m20 = T.calcular({ ...baseM, D_mm: 20, P_mm: 2.5, Le_mm: 30 });
  cerca('M20 8.8 (d>16, Sp 600) ≈ 441 N·m', m20.torque.nom, 0.2 * 0.020 * 0.75 * 600 * 244.8, 0.003);

  const mk = (id, claseId, lubId) => { const t = get(DATOS.roscas.unificada.UNC, id); return T.calcular({ sistema: 'unificada', D_mm: t.D_mm, P_mm: t.P_mm, claseId, materialId: 'acero_s355', Le_mm: 2 * t.D_mm, lubId: lubId || 'seca', pct: 75 }); };
  cerca('1/2-13 SAE5 seco ≈ 75 lbf·ft (tabla)', mk('1/2-13UNC', 'SAE5').conv.nom.lbfft, 75.4, 0.01);
  cerca('1/2-13 SAE8 seco ≈ 106 lbf·ft (tabla)', mk('1/2-13UNC', 'SAE8').conv.nom.lbfft, 106.4, 0.01);
  cerca('3/8-16 SAE5 seco ≈ 31 lbf·ft (tabla)', mk('3/8-16UNC', 'SAE5').conv.nom.lbfft, 0.2 * 0.375 * 0.75 * 85000 * 0.0775 / 12, 0.003);
  cerca('3/4-10 SAE8 seco ≈ 376 lbf·ft (hecho a mano)', mk('3/4-10UNC', 'SAE8').conv.nom.lbfft, 0.2 * 0.75 * 0.75 * 120000 * 0.334 / 12, 0.004);
  cerca('1/2-13 SAE5 aceitado', mk('1/2-13UNC', 'SAE5', 'aceitada').conv.nom.lbfft, 75.4 * 0.75, 0.01);
  cerca('1-8 SAE5 (> 1 in usa tramo 1 in: Sp 85)', mk('1-8UNC', 'SAE5').conv.nom.lbfft, 0.2 * 1 * 0.75 * 85000 * 0.606 / 12, 0.004);
  cerca('1-1/8-7 SAE5 (Sp 74)', mk('1-1/8-7UNC', 'SAE5').conv.nom.lbfft, 0.2 * 1.125 * 0.75 * 74000 * 0.763 / 12, 0.006);

  const inox = T.calcular({ ...baseM, claseId: 'A2-70', lubId: 'antiengrane', Le_mm: 15 });
  cerca('A2-70 M10 antiengrane (75 % de Rp0,2=450)', inox.torque.nom, 0.13 * 0.010 * 0.75 * 450 * 57.99, 0.001);
  chk('A2-70 referencia Rp', inox.clase.ref === 'Rp' && inox.refMPa === 450);
  const inoxSeco = T.calcular({ ...baseM, claseId: 'A2-70', lubId: 'seca', Le_mm: 15 });
  cerca('A2-70 seco usa K 0,30', inoxSeco.torque.nom, 0.30 * 0.010 * 0.75 * 450 * 57.99, 0.001);
  chk('A2-70 seco avisa gripado', inoxSeco.alertas.some(a => a.id === 'inox_seco'));
  chk('acero seco no avisa gripado', !r.alertas.some(a => a.id === 'inox_seco'));
}

/* ── 4. Barrido de rosca: casos a mano ── */
{
  /* M10 8.8 en aluminio 6061 (Rm 290): Le_req_int = 800·57.99/(0,8·0,6·290·0,875π·10) = 12,12 mm; externo 6,12 mm */
  const a = T.calcular({ ...baseM, materialId: 'aluminio_6061', Le_mm: 8 });
  cerca('Le_req int (Al) hecho a mano', a.barrido.Le_req_int, 800 * a.rosca.As / (0.8 * 0.6 * 290 * 0.875 * Math.PI * 10), 1e-6);
  cerca('Le_req int ≈ 12,12', a.barrido.Le_req_int, 12.12, 0.002);
  cerca('Le_req ext ≈ 6,12', a.barrido.Le_req_ext, 6.12, 0.003);
  chk('Le_rec = regla 2·D = 20 mm', a.barrido.Le_rec === 20, a.barrido.Le_rec);
  chk('8 mm en Al → peligro', a.barrido.estado === 'peligro');
  cerca('Fstrip a 8 mm [N]', a.barrido.Fstrip, 8 * 0.8 * 0.6 * 290 * 0.875 * Math.PI * 10, 1e-6);
  chk('limitada por la rosca', a.limitante === 'rosca');
  cerca('T limitada ≈ 40,8 N·m', a.torque.nom, 0.2 * 0.010 * (a.barrido.Fstrip / 1.5), 1e-9);
  cerca('T limitada hecha a mano', a.torque.nom, 40.82, 0.002);
  cerca('T objetivo sin limitar', a.torque.objetivo, 50.45, 0.002);
  chk('alerta barrido peligro + límite', a.alertas.some(x => x.id === 'barrido' && x.nivel === 'peligro') && a.alertas.some(x => x.id === 'limite_rosca'));
  chk('texto de alerta menciona longitud mínima', a.alertas.find(x => x.id === 'barrido').texto.includes('20,0 mm'));

  const b = T.calcular({ ...baseM, materialId: 'aluminio_6061', Le_mm: 15, arandela: true });   /* 1,5·D: ≥ analítico (12,12) pero < 2·D */
  chk('15 mm en Al → aviso (regla 2·D)', b.barrido.estado === 'aviso' && b.limitante === null, b.barrido.estado + '/' + b.limitante);
  const c = T.calcular({ ...baseM, materialId: 'aluminio_6061', Le_mm: 20, arandela: true });
  chk('20 mm en Al → ok', c.barrido.estado === 'ok' && c.limitante === null);
  const d = T.calcular({ ...baseM, materialId: 'acero_s235', Le_mm: 10 });
  chk('acero S235, 1·D, 8.8 → ok (analítico ≈ 9,8 mm)', d.barrido.estado === 'ok', d.barrido.Le_analitica + ' ' + d.barrido.estado);
  const e = T.calcular({ ...baseM, materialId: 'acero_s235', Le_mm: 9 });
  chk('acero S235, 0,9·D → peligro', e.barrido.estado === 'peligro');
  const p = T.calcular({ ...baseM, materialId: 'plastico', Le_mm: 30 });
  chk('plástico sin refuerzo: peligro y limitado', p.barrido.estado === 'peligro' && p.limitante !== null && p.alertas.some(x => x.id === 'plastico'));
  chk('plástico Le_rec > 4·D', p.barrido.Le_rec > 40, p.barrido.Le_rec);
  const f = T.calcular({ ...baseM, materialId: 'personalizado', rmMaterial_MPa: 290, Le_mm: 8 });
  cerca('material personalizado = Al 6061 (barrido)', f.barrido.Le_req_int, a.barrido.Le_req_int, 1e-12);
  chk('personalizado: pG = 1,3·Rm', Math.abs(f.material.pG - 377) < 1e-9);
}

/* ── 5. Presión bajo cabeza y arandela ── */
{
  const a = T.calcular({ ...baseM, materialId: 'plastico_gf', Le_mm: 40 });
  chk('plástico: cabeza limita sin arandela', a.limitante === 'cabeza' || a.limitante === 'rosca');
  const sinA = T.calcular({ ...baseM, materialId: 'aluminio_fundido', Le_mm: 40, arandela: false, claseId: '12.9' });
  const conA = T.calcular({ ...baseM, materialId: 'aluminio_fundido', Le_mm: 40, arandela: true, claseId: '12.9' });
  chk('arandela aumenta el área de apoyo', conA.cabeza.Ab > 2.5 * sinA.cabeza.Ab);
  chk('arandela no baja el torque admisible', conA.torque.nom >= sinA.torque.nom - 1e-9);
  cerca('Ab sin arandela = π/4·D²(1,45²−1,1²)', sinA.cabeza.Ab, Math.PI / 4 * 100 * (1.45 * 1.45 - 1.1 * 1.1), 1e-12);
  cerca('Ab con arandela = π/4·D²(1,9²−1,1²)', conA.cabeza.Ab, Math.PI / 4 * 100 * (1.9 * 1.9 - 1.1 * 1.1), 1e-12);
  chk('12.9 en aluminio fundido sin arandela: alerta de límite por cabeza', sinA.alertas.some(x => x.id === 'limite_cabeza') && sinA.limitante === 'cabeza', sinA.limitante);
  chk('con arandela se levanta el límite de cabeza', conA.limitante !== 'cabeza');
}

/* ── 6. Lubricación ── */
{
  const base = T.calcular(baseM);
  const ord = DATOS.lubricaciones.map(l => T.calcular({ ...baseM, lubId: l.id }));
  ord.forEach((r, i) => chk('K de ' + DATOS.lubricaciones[i].id, r.ok && Math.abs(r.torque.nom - DATOS.lubricaciones[i].K * 0.010 * r.Fobj) < 1e-9));
  chk('antiengrane da menos torque que seco', ord[4].torque.nom < ord[0].torque.nom * 0.7);
  chk('antiengrane avisa de no usar torque en seco', ord[4].alertas.some(x => x.id === 'lubricado'));
  chk('seca no avisa', !base.alertas.some(x => x.id === 'lubricado'));
  const hi = T.calcular({ ...baseM, pct: 90 });
  chk('90 % exacto no dispara el aviso de >90 %', !hi.alertas.some(x => x.id === 'pct_alto'));
  const hi95 = T.calcular({ ...baseM, pct: 95 });
  chk('95 % seco → dispersión peligro y aviso de precarga alta', hi95.alertas.some(x => x.id === 'dispersion' && x.nivel === 'peligro') && hi95.alertas.some(x => x.id === 'pct_alto'));
  chk('90 % seco → dispersión peligro (120 %)', hi.alertas.some(x => x.id === 'dispersion' && x.nivel === 'peligro'));
  const lo = T.calcular({ ...baseM, pct: 30 });
  chk('30 % → precarga baja', lo.alertas.some(x => x.id === 'pct_bajo'));
  cerca('T proporcional al % (sin límites)', hi.torque.nom / base.torque.nom, 90 / 75, 1e-12);
}

/* ── 7. Barrido de todas las combinaciones: sin NaN, invariantes ── */
{
  let n = 0, mal = 0;
  const roscas = [].concat(DATOS.roscas.metrica.gruesa, DATOS.roscas.metrica.fina, DATOS.roscas.unificada.UNC, DATOS.roscas.unificada.UNF);
  for (const t of roscas) for (const cl of T.clasesPara(t.sistema)) for (const mat of DATOS.materiales) for (const lub of DATOS.lubricaciones)
    for (const fLe of [0.5, 1, 1.5, 2, 3, 5]) for (const pct of [30, 75, 90, 100]) for (const ar of [false, true]) {
      const r = T.calcular({ sistema: t.sistema, D_mm: t.D_mm, P_mm: t.P_mm, claseId: cl.id, materialId: mat.id, rmMaterial_MPa: 300, Le_mm: fLe * t.D_mm, arandela: ar, lubId: lub.id, pct });
      n++;
      let bien = r.ok === true;
      if (bien) {
        bien = r.torque.min <= r.torque.nom && r.torque.nom <= r.torque.max && r.torque.nom > 0 && r.Fapl <= r.Fobj * (1 + 1e-12) && r.Fapl > 0 &&
          r.precarga.realMin <= r.Fapl * (1 + 1e-12) && r.precarga.realMax >= r.Fapl * (1 - 1e-12) &&
          r.barrido.Le_rec >= r.barrido.Le_analitica - 1e-9 && r.barrido.Le_rec >= r.material.regla * r.rosca.D - 1e-9 &&
          r.alertas.length >= 3 && r.alertas.every((a, i, arr) => a.texto && a.titulo && !/undefined|NaN|Infinity/.test(a.texto + a.titulo) && (i === 0 || ({ peligro: 0, aviso: 1, ok: 2, info: 3 }[arr[i - 1].nivel] <= { peligro: 0, aviso: 1, ok: 2, info: 3 }[a.nivel] || a.id === 'montaje')) && (a.id !== 'montaje' || i === arr.length - 1)) &&
          (r.barrido.estado !== 'peligro' || r.alertas.some(a => a.id === 'barrido' && a.nivel === 'peligro')) &&
          (r.limitante === null || r.pctAplicada < r.entrada.pct) &&
          (r.limitante !== null || Math.abs(r.pctAplicada - pct) < 1e-9);
      }
      if (!bien) { mal++; if (mal < 5) console.log('  combinación mal:', t.id, cl.id, mat.id, lub.id, fLe, pct, ar); }
    }
  chk('barrido de ' + n + ' combinaciones', mal === 0, mal + ' malas');
  console.log('combinaciones evaluadas: ' + n);
}

/* ── 8. Entradas inválidas y basura: nunca lanza, nunca devuelve ok con NaN ── */
{
  const bad = [undefined, null, 0, 'x', [], {}, { ...baseM, D_mm: NaN }, { ...baseM, D_mm: -5 }, { ...baseM, D_mm: 0 }, { ...baseM, D_mm: Infinity }, { ...baseM, D_mm: '10' },
    { ...baseM, P_mm: 0 }, { ...baseM, P_mm: -1 }, { ...baseM, P_mm: 50 }, { ...baseM, P_mm: 0.01 }, { ...baseM, Le_mm: 0 }, { ...baseM, Le_mm: -3 }, { ...baseM, Le_mm: NaN },
    { ...baseM, Le_mm: 1e9 }, { ...baseM, pct: 0 }, { ...baseM, pct: 101 }, { ...baseM, pct: -10 }, { ...baseM, pct: NaN }, { ...baseM, claseId: 'xx' }, { ...baseM, claseId: 'SAE5' },
    { ...baseM, materialId: '<img src=x onerror=alert(1)>' }, { ...baseM, lubId: undefined }, { ...baseM, sistema: 'imperial' }, { ...baseM, materialId: 'personalizado' },
    { ...baseM, materialId: 'personalizado', rmMaterial_MPa: -5 }, { ...baseM, materialId: 'personalizado', rmMaterial_MPa: 1e6 }, { ...baseM, D_mm: 1.5 }, { ...baseM, D_mm: 101 },
    { ...baseM, P_mm: 4 }];
  let lanzo = 0, falsoOk = 0;
  for (const b of bad) {
    try { const r = T.calcular(b); if (r.ok) falsoOk++; else if (!Array.isArray(r.errores) || !r.errores.length) falsoOk++; } catch (ex) { lanzo++; console.log('lanzó con', JSON.stringify(b), ex.message); }
  }
  chk('entradas inválidas no lanzan', lanzo === 0);
  chk('entradas inválidas se rechazan con mensaje', falsoOk === 0, falsoOk + ' aceptadas');
  /* fuzz */
  let s = 12345; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const vals = [NaN, Infinity, -Infinity, 0, -1, 1e-9, 1e12, 10, 0.5, 75, '5', null, undefined, true, {}, []];
  const claves = ['D_mm', 'P_mm', 'Le_mm', 'pct', 'rmMaterial_MPa', 'arandela'];
  let fz = 0;
  for (let i = 0; i < 3000; i++) {
    const e = { ...baseM, materialId: rnd() < 0.2 ? 'personalizado' : baseM.materialId };
    const nk = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < nk; j++) e[claves[Math.floor(rnd() * claves.length)]] = vals[Math.floor(rnd() * vals.length)];
    try {
      const r = T.calcular(e);
      if (r.ok) {
        let raro = false;
        (function rec(o) { if (typeof o === 'number') { if (!isFinite(o)) raro = true; } else if (typeof o === 'string') { if (/undefined|NaN|Infinity/.test(o)) raro = true; }
          else if (Array.isArray(o)) o.forEach(rec); else if (o && typeof o === 'object') Object.keys(o).forEach(k => rec(o[k])); })(r);
        if (raro) { fz++; if (fz < 4) console.log('  fuzz con valor raro:', JSON.stringify(e)); }
      } else if (!Array.isArray(r.errores) || !r.errores.length) { fz++; }
    } catch (ex) { fz++; console.log('  fuzz lanzó', JSON.stringify(e), ex.message); }
  }
  chk('fuzz de 3000 entradas', fz === 0, fz + ' problemas');
}

/* ── 9. Formato ── */
{
  chk('fmt miles/decimales', T.fmt(1234.567, 1) === '1.234,6' && T.fmt(0.5, 2) === '0,50' && T.fmt(-3.25, 1) === '−3,3' || T.fmt(-3.25, 1) === '−3,2', T.fmt(-3.25, 1));
  chk('fmt no finito', T.fmt(NaN) === '—' && T.fmt(Infinity) === '—' && T.fmt('a') === '—');
  chk('fmt cero negativo', T.fmt(-0.0001, 1) === '0,0');
  chk('fmtT', T.fmtT(5.678) === '5,68' && T.fmtT(50.45) === '50,5' && T.fmtT(441.3) === '441');
}

console.log('\nverificaciones OK: ' + ok + '   FALLAS: ' + fail);
process.exit(fail ? 1 : 0);
