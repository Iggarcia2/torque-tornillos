// js/ui/dom.js
'use strict';
/* Ayudas para construir el DOM: todo texto entra con textContent (nunca innerHTML), más el estado de la pantalla. */
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const NS = 'http://www.w3.org/2000/svg';
  const S = { leTocado: false, ultimo: null, D: NaN, unidadLe: 'mm' };
  function el(tag, cls, texto) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texto !== undefined && texto !== null) n.textContent = texto;
    return n;
  }
  function add(padre) { for (let i = 1; i < arguments.length; i++) { if (arguments[i]) padre.appendChild(arguments[i]); } return padre; }
  function opcion(valor, texto) { const o = document.createElement('option'); o.value = valor; o.textContent = texto; return o; }
  function svgEl(tag, attrs) { const n = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }
  function icono(nivel) {
    const s = svgEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
    if (nivel === 'ok') { add(s, svgEl('circle', { cx: 12, cy: 12, r: 9 }), svgEl('path', { d: 'M8 12.5l2.7 2.7L16 9.5' })); }
    else if (nivel === 'aviso') { add(s, svgEl('path', { d: 'M12 3.5l9.5 16.5h-19z' }), svgEl('path', { d: 'M12 10v4.5M12 17.4h.01' })); }
    else if (nivel === 'peligro') { add(s, svgEl('path', { d: 'M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z' }), svgEl('path', { d: 'M12 7.5v5.5M12 16.4h.01' })); }
    else { add(s, svgEl('circle', { cx: 12, cy: 12, r: 9 }), svgEl('path', { d: 'M12 11v5.5M12 7.8h.01' })); }
    return s;
  }
  function leer(txt) {
    const t = String(txt === undefined || txt === null ? '' : txt).trim();
    if (!/^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return NaN;
    return parseFloat(t.replace(',', '.'));
  }
  function coma(x) { return String(x).replace('.', ','); }
  function recortar(x, dec) { return coma(parseFloat(x.toFixed(dec))); }
  const ETQ_ESTADO = { ok: 'CUMPLE', aviso: 'ATENCIÓN', peligro: 'NO CUMPLE', info: 'INFO' };
  function pos(x, max) { return Math.max(0, Math.min(100, x / max * 100)); }
  /* centra la etiqueta sobre su marca, pero la alinea al borde si está cerca de un extremo para que no se corte */
  function alinear(e, p) { e.style.left = p + '%'; e.style.transform = p > 72 ? 'translateX(-100%)' : (p < 14 ? 'translateX(0)' : 'translateX(-50%)'); }
  Object.assign(Torque.UI, { $, S, el, add, opcion, icono, leer, coma, recortar, ETQ_ESTADO, pos, alinear });
})();
