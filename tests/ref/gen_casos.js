// tests/ref/gen_casos.js
/* Genera casos pseudoaleatorios (ids de alto nivel) con las salidas del núcleo JS, para compararlos con ref.py */
const T = require('../lib/cargar.js').crear(['nucleo'], 'Torque');
const { DATOS } = T;
let s = 987654321; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)];
const roscas = [].concat(DATOS.roscas.metrica.gruesa, DATOS.roscas.metrica.fina, DATOS.roscas.unificada.UNC, DATOS.roscas.unificada.UNF);
const casos = [];
for (let i = 0; i < 1500; i++) {
  const t = pick(roscas), cl = pick(T.clasesPara(t.sistema)), mat = pick(DATOS.materiales), lub = pick(DATOS.lubricaciones);
  const fLe = pick([0.6, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4]), pct = pick([30, 50, 60, 75, 80, 90, 100]), ar = rnd() < 0.5, rm = pick([120, 250, 600]);
  const e = { sistema: t.sistema, D_mm: t.D_mm, P_mm: t.P_mm, claseId: cl.id, materialId: mat.id, rmMaterial_MPa: rm, Le_mm: fLe * t.D_mm, arandela: ar, lubId: lub.id, pct };
  const r = T.calcular(e);
  casos.push({ rosca: t.id, serie: DATOS.roscas.metrica.gruesa.includes(t) ? 'gruesa' : DATOS.roscas.metrica.fina.includes(t) ? 'fina' : DATOS.roscas.unificada.UNC.includes(t) ? 'UNC' : 'UNF',
    claseId: cl.id, materialId: mat.id, rm, fLe, pct, arandela: ar, lubId: lub.id,
    js: { As: r.rosca.As, Fobj: r.Fobj, Fapl: r.Fapl, Tmin: r.torque.min, Tnom: r.torque.nom, Tmax: r.torque.max, Tobj: r.torque.objetivo, Lereq: r.barrido.Le_analitica, Lerec: r.barrido.Le_rec,
          Fstrip: r.barrido.Fstrip, estBarrido: r.barrido.estado, limitante: r.limitante, Ab: r.cabeza.Ab, pctMax: r.precarga.pctRealMax } });
}
require('fs').writeFileSync(__dirname + '/casos.json', JSON.stringify(casos));
console.log('casos:', casos.length);
