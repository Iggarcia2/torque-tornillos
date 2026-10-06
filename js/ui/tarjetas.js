// js/ui/tarjetas.js
'use strict';
/* Tarjetas de resultados: precarga, barrido de rosca, presión bajo la cabeza, alertas y tabla de detalle. */
(function () {
  const { CONST, fmt, fmtT } = Torque;
  const { el, add, icono, ETQ_ESTADO, pos, alinear } = Torque.UI;

  function par(valor, unidad) { const s = el('span'); add(s, el('b', null, valor), document.createTextNode(' ' + unidad)); return s; }
  function kv(contenedor, k, v, peq) {
    const d = el('div'); add(d, el('div', 'k', k)); const vv = el('div', 'v', v);
    if (peq) { vv.appendChild(document.createTextNode(' ')); vv.appendChild(el('small', null, peq)); }
    add(d, vv); contenedor.appendChild(d);
  }
  function cabeza(titulo, estado) { const h = el('div', 'ch', titulo); if (estado) h.appendChild(el('span', 'badge s-' + estado, ETQ_ESTADO[estado])); return h; }
  function tarjetaPrecarga(r) {
    const c = el('div', 'card'); c.appendChild(cabeza('Precarga estimada'));
    const g = el('div', 'kv');
    const ref = r.clase.ref === 'Sp' ? 'Sp' : 'Rp0,2';
    kv(g, 'Precarga con el torque nominal', fmt(r.Fapl / 1000, 2) + ' kN', fmt(r.Fapl * CONST.N_LBF, 0) + ' lbf');
    kv(g, 'Nivel alcanzado', fmt(r.pctAplicada, 0) + ' % de ' + ref);
    kv(g, 'Rango real por dispersión de K', fmt(r.precarga.realMin / 1000, 1) + ' – ' + fmt(r.precarga.realMax / 1000, 1) + ' kN', fmt(r.precarga.pctRealMin, 0) + ' – ' + fmt(r.precarga.pctRealMax, 0) + ' %');
    kv(g, '100 % = ' + ref + ' · As', fmt(r.Fref / 1000, 1) + ' kN');
    c.appendChild(g);
    const MAX = 125, esc = el('div', 'escala');
    const zona = function (a, b, cls) { const z = el('div', 'z ' + cls); z.style.left = pos(a, MAX) + '%'; z.style.width = pos(b - a, MAX) + '%'; return z; };
    add(esc, zona(0, 90, 'z-a'), zona(90, 100, 'z-w'), zona(100, MAX, 'z-r'));
    const marca = function (v, cls, txt) {
      const m = el('div', 'marca ' + cls); m.style.left = pos(v, MAX) + '%'; esc.appendChild(m);
      if (txt) { const e = el('div', 'etq ' + cls, txt); alinear(e, pos(v, MAX)); esc.appendChild(e); }
    };
    esc.style.overflow = 'visible';
    marca(r.precarga.pctRealMin, 'fino', '');
    marca(r.pctAplicada, 'nom', fmt(r.pctAplicada, 0) + ' %');
    marca(r.precarga.pctRealMax, 'fino', '');
    c.appendChild(esc);
    const ej = el('div', 'ejes');
    [[0, '0 %', '0'], [100 / MAX * 100, '100 %', '-50%'], [100, MAX + ' %', '-100%']].forEach(function (t) {
      const s = el('span', null, t[1]); s.style.left = t[0] + '%'; s.style.transform = 'translateX(' + t[2] + ')'; ej.appendChild(s);
    });
    c.appendChild(ej);
    c.appendChild(el('p', 'leyenda', '100 % = ' + ref + ' · As. Marca azul: precarga con el torque nominal. Marcas finas: precarga real si la fricción es la más alta o la más baja del rango. Por encima de 100 % el tornillo empieza a plastificar.'));
    return c;
  }
  function tarjetaBarrido(r) {
    const b = r.barrido, D = r.rosca.D;
    const c = el('div', 'card'); c.appendChild(cabeza('Verificación al barrido de rosca', b.estado));
    const g = el('div', 'kv');
    kv(g, 'Engrane disponible', fmt(b.Le, 1) + ' mm', fmt(b.Le / D, 2) + '·D');
    kv(g, 'Mínimo analítico', fmt(b.Le_analitica, 1) + ' mm', fmt(b.Le_analitica / D, 2) + '·D');
    kv(g, 'Longitud recomendada', fmt(b.Le_rec, 1) + ' mm', fmt(b.Le_rec / D, 2) + '·D');
    kv(g, 'Barrido de hilos / rotura del tornillo', fmt(b.Fstrip / 1000, 1) + ' / ' + fmt(r.Fbolt_ult / 1000, 1) + ' kN');
    c.appendChild(g);
    const max = Math.max(b.Le, b.Le_rec, b.Le_analitica) * 1.12;
    const t = el('div', 'tira');
    const rel = el('div', 'rel ' + b.estado); rel.style.width = pos(b.Le, max) + '%'; t.appendChild(rel);
    const marca = function (v, cls, txt) {
      const m = el('div', 'marca ' + cls); m.style.left = pos(v, max) + '%'; t.appendChild(m);
      const e = el('div', 'etq', txt); alinear(e, pos(v, max)); if (cls === 'lim') { e.style.top = 'auto'; e.style.bottom = '-1.35rem'; } t.appendChild(e);
    };
    marca(b.Le_rec, 'nom', 'recomendado ' + fmt(b.Le_rec, 1) + ' mm');
    marca(b.Le_analitica, 'lim', 'mínimo ' + fmt(b.Le_analitica, 1) + ' mm');
    t.style.marginBottom = '1.9rem';
    c.appendChild(t);
    c.appendChild(el('p', 'leyenda', 'Barra: engrane disponible. El mínimo analítico es la longitud con la que el tornillo rompe antes de que se barran los hilos (material: ' + r.material.nombre +
      ', Rm ' + fmt(r.material.Rm, 0) + ' MPa). La recomendada además respeta la regla práctica de ' + fmt(r.material.regla, 2) + '·D para este material.'));
    return c;
  }
  function tarjetaCabeza(r) {
    const h = r.cabeza;
    const c = el('div', 'card'); c.appendChild(cabeza('Presión bajo la cabeza', h.estado === 'peligro' ? 'peligro' : (h.estado === 'aviso' || r.limitante === 'cabeza' ? 'aviso' : 'ok')));
    const g = el('div', 'kv');
    kv(g, 'Presión con torque nominal', fmt(h.pNom, 0) + ' MPa', 'máx. ' + fmt(h.pMax, 0) + ' MPa');
    kv(g, 'Límite orientativo del material', fmt(h.pG, 0) + ' MPa');
    kv(g, 'Área de apoyo', fmt(h.Ab, 0) + ' mm²', r.entrada.arandela ? 'con arandela' : 'cabeza sola');
    c.appendChild(g);
    return c;
  }
  function tarjetaAlertas(r) {
    const c = el('div', 'card'); c.appendChild(cabeza('Alertas y recomendaciones'));
    const ul = el('ul', 'alertas');
    r.alertas.forEach(function (a) {
      const li = el('li', 'al ' + a.nivel); li.appendChild(icono(a.nivel));
      add(li, add(el('div'), el('h3', null, a.titulo), el('p', null, a.texto)));
      ul.appendChild(li);
    });
    c.appendChild(ul);
    return c;
  }
  function tablaDetalle(r) {
    const f = [];
    const D = r.rosca.D, b = r.barrido, h = r.cabeza;
    const row = function (n, v, u) { f.push([n, v, u || '']); };
    row('Diámetro nominal D', fmt(D, 3), 'mm'); row('Paso P', fmt(r.rosca.P, 3), 'mm'); row('Ø primitivo d₂', fmt(r.rosca.d2, 3), 'mm');
    row('Ø núcleo del tornillo d₃', fmt(r.rosca.d3, 3), 'mm'); row('Ø de tensión dₛ', fmt(r.rosca.ds, 3), 'mm'); row('Área resistente Aₛ', fmt(r.rosca.As, 2), 'mm²');
    row('Clase', r.clase.nombre); row('Rm / Rp0,2', fmt(r.clase.Rm, 0) + ' / ' + fmt(r.clase.Rp, 0), 'MPa');
    row(r.clase.ref === 'Sp' ? 'Proof Sp (referencia 100 %)' : 'Rp0,2 (referencia 100 %)', fmt(r.refMPa, 0), 'MPa');
    row('Carga de referencia = ref · Aₛ', fmt(r.Fref / 1000, 3), 'kN'); row('Precarga objetivo Fi', fmt(r.Fobj / 1000, 3), 'kN');
    row('K mín / nominal / máx', fmt(r.lub.Kmin, 2) + ' / ' + fmt(r.lub.K, 2) + ' / ' + fmt(r.lub.Kmax, 2));
    row('Torque con la precarga objetivo (K nominal)', fmtT(r.torque.objetivo), 'N·m');
    row('Fuerza de rotura del tornillo Rm·Aₛ', fmt(r.Fbolt_ult / 1000, 3), 'kN');
    row('Barrido del hilo del alojamiento', fmt(b.Fstrip_int / 1000, 3), 'kN'); row('Barrido del hilo del tornillo', fmt(b.Fstrip_ext / 1000, 3), 'kN');
    row('Engrane mínimo (alojamiento / tornillo)', fmt(b.Le_req_int, 2) + ' / ' + fmt(b.Le_req_ext, 2), 'mm');
    row('Regla práctica del material', fmt(b.Le_regla, 2), 'mm'); row('Precarga admisible por barrido (÷ ' + fmt(CONST.SF_BARRIDO, 1) + ')', fmt(b.Fadm / 1000, 3), 'kN');
    row('Ø apoyo de cabeza / agujero', fmt(h.dw, 2) + ' / ' + fmt(h.dh, 2), 'mm'); row('Precarga admisible por presión bajo cabeza', fmt(h.Fadm / 1000, 3), 'kN');
    row('Precarga aplicada Fapl = mín(Fi, límites)', fmt(r.Fapl / 1000, 3), 'kN');
    row('Torque mín / nominal / máx', fmtT(r.torque.min) + ' / ' + fmtT(r.torque.nom) + ' / ' + fmtT(r.torque.max), 'N·m');
    const wrap = el('div', 'scroll'), t = el('table', 'tabla');
    const thead = el('thead'), trh = el('tr');
    ['Magnitud', 'Valor', 'Unidad'].forEach(function (x, i) { trh.appendChild(el('th', i === 1 ? 'n' : null, x)); });
    thead.appendChild(trh); t.appendChild(thead);
    const tb = el('tbody');
    f.forEach(function (x) { const tr = el('tr'); add(tr, el('td', null, x[0]), el('td', 'n', x[1]), el('td', null, x[2])); tb.appendChild(tr); });
    t.appendChild(tb); wrap.appendChild(t);
    return wrap;
  }
  Object.assign(Torque.UI, { par, tarjetaPrecarga, tarjetaBarrido, tarjetaCabeza, tarjetaAlertas, tablaDetalle });
})();
