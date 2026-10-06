// js/nucleo/formato.js
'use strict';
/* Formato de números para mostrar: coma decimal y punto de miles. Sin DOM. */
(function () {
  function fmt(x, dec) {
    if (typeof x !== 'number' || !isFinite(x)) return '—';
    const d = dec === undefined ? 2 : dec;
    const s = Math.abs(x).toFixed(d);
    const partes = s.split('.');
    const ent = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const neg = x < 0 && parseFloat(s) !== 0;
    return (neg ? '−' : '') + ent + (partes[1] ? ',' + partes[1] : '');
  }
  /* Torque: más decimales cuando el valor es chico */
  function fmtT(x) {
    if (typeof x !== 'number' || !isFinite(x)) return '—';
    const a = Math.abs(x);
    return fmt(x, a < 10 ? 2 : (a < 100 ? 1 : 0));
  }
  Object.assign(Torque, { fmt: fmt, fmtT: fmtT });
})();
