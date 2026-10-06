// js/nucleo/apoyo.js
'use strict';
/* Presión de apoyo bajo la cabeza del tornillo. Funciones puras, sin DOM. */
(function () {
  const { CONST } = Torque;

  /* Geometría del apoyo y precarga máxima que admite el alojamiento. pG: presión límite del material [MPa] */
  function geometriaApoyo(g, arandela, pG) {
    const dw = (arandela ? CONST.DW_ARANDELA : CONST.DW_CABEZA) * g.D;
    const dh = CONST.DH_AGUJERO * g.D;
    const Ab = Math.PI / 4 * (dw * dw - dh * dh);
    const AbArandela = Math.PI / 4 * Math.pow(CONST.DW_ARANDELA * g.D, 2) - Math.PI / 4 * dh * dh;
    return { dw: dw, dh: dh, Ab: Ab, AbArandela: AbArandela, Fadm: pG * Ab };
  }

  /* Presión con la precarga aplicada y con la máxima real (fricción más baja del rango) */
  function presionApoyo(ap, pG, Fapl, FrealMax) {
    const pNom = Fapl / ap.Ab, pMax = FrealMax / ap.Ab;
    let estado = 'ok';
    if (pNom > pG * (1 + CONST.TOL)) estado = 'peligro';
    else if (pMax > pG * (1 + CONST.TOL)) estado = 'aviso';
    return { pNom: pNom, pMax: pMax, estado: estado };
  }
  Torque.apoyo = { geometria: geometriaApoyo, presion: presionApoyo };
})();
