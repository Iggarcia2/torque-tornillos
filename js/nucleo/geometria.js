// js/nucleo/geometria.js
'use strict';
/* Geometría de la rosca, propiedades del tornillo y búsquedas en las tablas. Funciones puras, sin DOM. */
(function () {
  const { CONST, DATOS } = Torque;

  function buscar(lista, id) { for (let i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return null; }
  function clasesPara(sis) { return DATOS.clases.filter(function (c) { return c.sistema === sis; }); }

  /* Geometría de la rosca (perfil básico) y área resistente a tracción As */
  function geometriaRosca(sis, D, P) {
    const ds = D - (sis === 'unificada' ? CONST.G_DS_UN : CONST.G_DS_M) * P;
    return { D: D, P: P, d2: D - CONST.G_D2 * P, d3: D - CONST.G_D3 * P, D1: D - CONST.G_D1 * P, ds: ds, As: Math.PI / 4 * ds * ds };
  }

  /* Propiedades mínimas de la clase para el diámetro D (mm) */
  function propsClase(clase, D) {
    let t = clase.tramos[clase.tramos.length - 1];
    for (let i = 0; i < clase.tramos.length; i++) {
      if (D <= clase.tramos[i].hasta + 1e-6) { t = clase.tramos[i]; break; }
    }
    return { Rm: t.Rm, Rp: t.Rp, Sp: t.Sp, fueraAlcance: D > clase.alcance + 1e-6 };
  }

  /* K efectivo según lubricación y familia del tornillo */
  function coefK(lub, familia) {
    if (lub.inox && familia === 'inox') return { K: lub.inox.K, Kmin: lub.inox.Kmin, Kmax: lub.inox.Kmax, inoxSeca: true };
    return { K: lub.K, Kmin: lub.Kmin, Kmax: lub.Kmax, inoxSeca: false };
  }

  function convTorque(T) { return { Nm: T, lbfft: T * CONST.NM_LBFFT, kgfm: T * CONST.NM_KGFM }; }
  Object.assign(Torque, { buscar: buscar, clasesPara: clasesPara, geometriaRosca: geometriaRosca, propsClase: propsClase, coefK: coefK, convTorque: convTorque });
})();
