// js/nucleo/barrido.js
'use strict';
/* Verificación al barrido de rosca (corte de los hilos). Función pura, sin DOM. */
(function () {
  const { CONST } = Torque;

  /* p: { g: geometría de la rosca, prop: propiedades de la clase, RmM: Rm del alojamiento [MPa], Le: engrane [mm],
          regla: engrane práctico del material [múltiplos de D], Fbolt_ult: rotura del tornillo [N] } */
  function verificarBarrido(p) {
    const g = p.g, prop = p.prop, RmM = p.RmM, Le = p.Le, Fbolt_ult = p.Fbolt_ult;
    const aInt = Math.PI * g.D * (0.5 + CONST.G_D2 * CONST.TAN30);                          /* mm²/mm: hilo interior, cilindro en D  (=0,875·π·D)  */
    const aExt = Math.PI * g.D1 * (0.5 + (CONST.G_D1 - CONST.G_D2) * CONST.TAN30);           /* mm²/mm: hilo exterior, cilindro en D1 (=0,75·π·D1)  */
    const cInt = CONST.C_DIST * CONST.ALFA_CORTE * RmM * aInt;                               /* N/mm de engrane: corte del alojamiento */
    const cExt = CONST.C_DIST * CONST.ALFA_CORTE * prop.Rm * aExt;                          /* N/mm de engrane: corte del tornillo    */
    const Fstrip_int = cInt * Le, Fstrip_ext = cExt * Le;
    const Fstrip = Math.min(Fstrip_int, Fstrip_ext);
    const Le_req_int = Fbolt_ult / cInt, Le_req_ext = Fbolt_ult / cExt;
    const Le_analitica = Math.max(Le_req_int, Le_req_ext);
    const Le_regla = p.regla * g.D;
    const Le_rec = Math.ceil(Math.max(Le_analitica, Le_regla) * 2 - 1e-9) / 2;               /* se redondea hacia arriba a 0,5 mm */
    let estado = 'ok';
    if (Le < Le_analitica - CONST.TOL) estado = 'peligro';
    else if (Le < Le_regla - CONST.TOL) estado = 'aviso';
    return { Fstrip_int: Fstrip_int, Fstrip_ext: Fstrip_ext, Fstrip: Fstrip, razon: Fstrip / Fbolt_ult, Le: Le,
             Le_req_int: Le_req_int, Le_req_ext: Le_req_ext, Le_analitica: Le_analitica, Le_regla: Le_regla, Le_rec: Le_rec,
             estado: estado, Fadm: Fstrip / CONST.SF_BARRIDO };
  }
  Torque.verificarBarrido = verificarBarrido;
})();
