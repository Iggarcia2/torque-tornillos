// js/nucleo/calculo.js
'use strict';
/* Cálculo principal: precarga objetivo, límites del alojamiento, torque mín / nominal / máx y chequeo final de números. */
(function () {
  const { CONST, validar, geometriaRosca, propsClase, coefK, convTorque, verificarBarrido, apoyo } = Torque;

  function calcular(e) {
    const val = validar(e);
    if (!val.ok) return val;
    const v = val.v, sis = v.sis, D = v.D, P = v.P, Le = v.Le, pct = v.pct, clase = v.clase, matBase = v.matBase, lub = v.lub, RmM = v.RmM, pG = v.pG;

    /* ---- Tornillo ---- */
    const g = geometriaRosca(sis, D, P);
    const prop = propsClase(clase, D);
    const refMPa = clase.ref === 'Sp' ? prop.Sp : prop.Rp;
    const Fref = refMPa * g.As;                 /* N: proof load (acero) o Rp0,2·As (inoxidable) */
    const Fobj = pct / 100 * Fref;              /* N: precarga objetivo                         */
    const Fbolt_ult = prop.Rm * g.As;           /* N: carga de rotura del tornillo              */

    /* ---- Fricción, barrido de rosca y apoyo bajo la cabeza ---- */
    const k = coefK(lub, clase.familia);
    const regla = matBase.regla;
    const barrido = verificarBarrido({ g: g, prop: prop, RmM: RmM, Le: Le, regla: regla, Fbolt_ult: Fbolt_ult });
    const ap = apoyo.geometria(g, v.arandela, pG);

    /* ---- Precarga aplicada y torques ---- */
    const Fapl = Math.min(Fobj, barrido.Fadm, ap.Fadm);
    let limitante = null;
    if (Fapl < Fobj * (1 - CONST.TOL)) limitante = barrido.Fadm <= ap.Fadm ? 'rosca' : 'cabeza';
    const Dm = g.D / 1000;                                         /* m */
    const T = {
      objetivo: k.K * Dm * Fobj,                                   /* N·m con la precarga objetivo, sin limitar */
      min: k.Kmin * Dm * Fapl, nom: k.K * Dm * Fapl, max: k.Kmax * Dm * Fapl
    };
    const Freal_min = Fapl * k.K / k.Kmax, Freal_max = Fapl * k.K / k.Kmin;   /* con T nominal y K en los extremos */
    const pr = apoyo.presion(ap, pG, Fapl, Freal_max);

    const r = {
      ok: true,
      entrada: { sistema: sis, D_mm: D, P_mm: P, Le_mm: Le, pct: pct, arandela: v.arandela },
      rosca: g, clase: { id: clase.id, nombre: clase.nombre, familia: clase.familia, ref: clase.ref, Rm: prop.Rm, Rp: prop.Rp, Sp: prop.Sp,
                         fueraAlcance: prop.fueraAlcance, alcance: clase.alcance },
      refMPa: refMPa, Fref: Fref, Fobj: Fobj, Fbolt_ult: Fbolt_ult,
      lub: { id: lub.id, nombre: lub.nombre, K: k.K, Kmin: k.Kmin, Kmax: k.Kmax, inoxSeca: k.inoxSeca },
      material: { id: matBase.id, nombre: matBase.nombre, tipo: matBase.tipo, Rm: RmM, pG: pG, regla: regla },
      barrido: barrido,
      cabeza: { dw: ap.dw, dh: ap.dh, Ab: ap.Ab, AbArandela: ap.AbArandela, pG: pG, pNom: pr.pNom, pMax: pr.pMax, estado: pr.estado, Fadm: ap.Fadm },
      Fapl: Fapl, limitante: limitante, pctAplicada: Fapl / Fref * 100,
      torque: T, conv: { min: convTorque(T.min), nom: convTorque(T.nom), max: convTorque(T.max), objetivo: convTorque(T.objetivo) },
      precarga: { nom: Fapl, realMin: Freal_min, realMax: Freal_max, pctRealMin: Freal_min / Fref * 100, pctRealMax: Freal_max / Fref * 100 }
    };
    r.alertas = Torque.construirAlertas(r, e);

    /* Guarda final: ningún número del resultado puede ser NaN o infinito */
    const malos = [];
    (function revisar(o, ruta) {
      if (typeof o === 'number') { if (!isFinite(o)) malos.push(ruta); }
      else if (o && typeof o === 'object' && !Array.isArray(o)) { Object.keys(o).forEach(function (kk) { revisar(o[kk], ruta + '.' + kk); }); }
    })(r, 'r');
    if (malos.length) return { ok: false, errores: ['El cálculo produjo un valor no válido (' + malos[0] + '). Revisá los datos ingresados.'] };
    return r;
  }
  Torque.calcular = calcular;
})();
