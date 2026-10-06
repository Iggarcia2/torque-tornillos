// js/nucleo/validacion.js
'use strict';
/* Validación de la entrada. Nada llega al cálculo sin pasar por acá: tipos, rangos, NaN e Infinity. */
(function () {
  const { CONST, DATOS, fmt, buscar } = Torque;

  function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : NaN; }

  /* Devuelve { ok: false, errores: [...] } o { ok: true, v: {valores ya validados y las filas de las tablas elegidas} } */
  function validar(e) {
    const errores = [];
    if (!e || typeof e !== 'object') return { ok: false, errores: ['No se recibieron datos de entrada.'] };

    const sis = e.sistema === 'unificada' ? 'unificada' : (e.sistema === 'metrica' ? 'metrica' : null);
    if (!sis) errores.push('Elegí el sistema de roscas (métrica o unificada).');
    const D = num(e.D_mm), P = num(e.P_mm), Le = num(e.Le_mm), pct = num(e.pct);

    if (isNaN(D) || D < CONST.D_MIN || D > CONST.D_MAX) errores.push('El diámetro nominal debe estar entre ' + fmt(CONST.D_MIN, 1) + ' y ' + fmt(CONST.D_MAX, 0) + ' mm.');
    if (isNaN(P) || P < CONST.P_MIN || P > CONST.P_MAX) errores.push('El paso de rosca debe estar entre ' + fmt(CONST.P_MIN, 1) + ' y ' + fmt(CONST.P_MAX, 0) + ' mm.');
    if (!isNaN(D) && !isNaN(P) && D > 0 && (P / D < CONST.PD_MIN || P / D > CONST.PD_MAX)) errores.push('La relación paso/diámetro no corresponde a una rosca real: revisá D y el paso.');
    if (isNaN(Le) || Le <= 0) errores.push('La longitud de engrane debe ser un número mayor que 0.');
    else if (!isNaN(D) && Le > CONST.LE_MAX_D * D) errores.push('La longitud de engrane supera ' + CONST.LE_MAX_D + ' veces el diámetro: revisá el valor y la unidad (mm o pulgadas).');
    if (isNaN(pct) || pct < CONST.PCT_MIN || pct > CONST.PCT_MAX) errores.push('La precarga objetivo debe estar entre ' + CONST.PCT_MIN + ' % y ' + CONST.PCT_MAX + ' %.');

    const clase = buscar(DATOS.clases, e.claseId);
    if (!clase) errores.push('Elegí la clase de resistencia del tornillo.');
    else if (sis && clase.sistema !== sis) errores.push('La clase de resistencia elegida no corresponde al sistema de rosca.');
    const matBase = buscar(DATOS.materiales, e.materialId);
    if (!matBase) errores.push('Elegí el material del alojamiento.');
    const lub = buscar(DATOS.lubricaciones, e.lubId);
    if (!lub) errores.push('Elegí la condición de lubricación.');

    let RmM = NaN, pG = NaN;
    if (matBase) {
      if (matBase.id === 'personalizado') {
        RmM = num(e.rmMaterial_MPa);
        if (isNaN(RmM) || RmM < CONST.RM_MIN || RmM > CONST.RM_MAX) errores.push('La resistencia a tracción del material debe estar entre ' + CONST.RM_MIN + ' y ' + CONST.RM_MAX + ' MPa.');
        pG = 1.3 * RmM;
      } else { RmM = matBase.Rm; pG = matBase.pG; }
    }
    if (errores.length) return { ok: false, errores: errores };
    return { ok: true, v: { sis: sis, D: D, P: P, Le: Le, pct: pct, clase: clase, matBase: matBase, lub: lub, RmM: RmM, pG: pG, arandela: !!e.arandela } };
  }
  Torque.validar = validar;
})();
