// js/ui/resultados.js
'use strict';
/* Panel de resultados: pinta el resultado o el error, arma el resumen y lo copia al portapapeles. */
(function () {
  const { fmt, fmtT } = Torque;
  const { $, el, add, ETQ_ESTADO, par, tarjetaPrecarga, tarjetaBarrido, tarjetaCabeza, tarjetaAlertas, tablaDetalle } = Torque.UI;

  function pintarError(errores) {
    const cont = $('res'); cont.replaceChildren();
    const c = el('div', 'error'); c.setAttribute('role', 'alert');
    add(c, el('h2', null, 'Revisá los datos ingresados'));
    const ul = el('ul'); errores.forEach(function (m) { ul.appendChild(el('li', null, m)); }); c.appendChild(ul);
    cont.appendChild(c);
    const b = $('barra'); b.className = 'barra err'; b.replaceChildren(); b.appendChild(el('b', null, 'Revisá los datos'));
  }
  function resumenTexto(r) {
    const ref = r.clase.ref === 'Sp' ? 'Sp' : 'Rp0,2', D = r.rosca.D;
    const t = $('tamano'), nombreRosca = t.value === '__otro__' ? 'D = ' + fmt(D, 2) + ' mm, paso ' + fmt(r.rosca.P, 2) + ' mm' : t.options[t.selectedIndex].textContent;
    const L = [];
    L.push('TORQUE DE APRIETE · ' + nombreRosca + ' · ' + r.clase.nombre);
    L.push('Alojamiento: ' + r.material.nombre + ' · engrane ' + fmt(r.barrido.Le, 1) + ' mm (' + fmt(r.barrido.Le / D, 2) + '·D)' + (r.entrada.arandela ? ' · con arandela' : ''));
    L.push('Rosca: ' + r.lub.nombre + ' · K = ' + fmt(r.lub.K, 2) + ' (' + fmt(r.lub.Kmin, 2) + ' – ' + fmt(r.lub.Kmax, 2) + ')');
    L.push('Precarga: ' + fmt(r.Fapl / 1000, 2) + ' kN = ' + fmt(r.pctAplicada, 0) + ' % de ' + ref + (r.limitante ? ' (objetivo ' + fmt(r.entrada.pct, 0) + ' %, reducido por el alojamiento)' : ''));
    L.push('TORQUE RECOMENDADO: ' + fmtT(r.torque.nom) + ' N·m = ' + fmtT(r.conv.nom.lbfft) + ' lbf·ft = ' + fmtT(r.conv.nom.kgfm) + ' kgf·m');
    L.push('Rango (K bajo – K alto): ' + fmtT(r.torque.min) + ' – ' + fmtT(r.torque.max) + ' N·m');
    L.push('Barrido de rosca: ' + ETQ_ESTADO[r.barrido.estado] + ' · engrane recomendado ≥ ' + fmt(r.barrido.Le_rec, 1) + ' mm (' + fmt(r.barrido.Le_rec / D, 2) + '·D)');
    r.alertas.filter(function (a) { return a.nivel === 'peligro' || a.nivel === 'aviso'; }).forEach(function (a) { L.push('! ' + a.titulo); });
    L.push('Estimación con T = K·D·Fi; verificar en uniones críticas.');
    return L.join('\n');
  }
  function copiar(texto, estado, area) {
    area.hidden = true;
    const ok = function () { estado.textContent = 'Resumen copiado al portapapeles.'; };
    const manual = function () {
      area.hidden = false; area.value = texto; area.focus(); area.select();
      let hecho = false;
      try { hecho = document.execCommand('copy'); } catch (e) { hecho = false; }
      estado.textContent = hecho ? 'Resumen copiado al portapapeles.' : 'No se pudo copiar automáticamente: el texto quedó seleccionado, copialo con Ctrl+C.';
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, manual);
    else manual();
  }
  function pintar(r) {
    const cont = $('res'); cont.replaceChildren();
    const refTxt = r.clase.ref === 'Sp' ? 'Sp' : 'Rp0,2';

    const hero = el('div', 'hero');
    add(hero, el('div', 'hero-lbl', 'Torque de apriete recomendado'));
    add(hero, add(el('div', 'hero-val'), el('span', 'n', fmtT(r.torque.nom)), el('span', 'u', 'N·m')));
    add(hero, add(el('div', 'hero-alt'), par(fmtT(r.conv.nom.lbfft), 'lbf·ft'), par(fmtT(r.conv.nom.kgfm), 'kgf·m')));
    add(hero, el('div', 'hero-sub', 'Precarga ' + fmt(r.Fapl / 1000, 2) + ' kN · ' + fmt(r.pctAplicada, 0) + ' % de ' + refTxt + ' · K = ' + fmt(r.lub.K, 2)));
    if (r.limitante) {
      add(hero, el('div', 'hero-badge pe', (r.limitante === 'rosca' ? 'Reducido por la resistencia de la rosca del alojamiento' : 'Reducido por la presión bajo la cabeza') +
        ': ' + fmtT(r.torque.nom) + ' N·m en lugar de ' + fmtT(r.torque.objetivo) + ' N·m.'));
    } else if (r.barrido.estado === 'peligro') {
      add(hero, el('div', 'hero-badge pe', 'Riesgo de barrido de rosca: ver la verificación.'));
    }
    cont.appendChild(hero);

    const trio = el('div', 'trio');
    [['Mínimo', r.torque.min, r.conv.min, 'K = ' + fmt(r.lub.Kmin, 2), ''], ['Nominal', r.torque.nom, r.conv.nom, 'K = ' + fmt(r.lub.K, 2), ' nom'], ['Máximo', r.torque.max, r.conv.max, 'K = ' + fmt(r.lub.Kmax, 2), '']].forEach(function (x) {
      const m = el('div', 'mini' + x[4]);
      const b = el('b', null, fmtT(x[1])); b.appendChild(document.createTextNode(' ')); b.appendChild(el('small', null, 'N·m'));
      add(m, el('span', 't', x[0]), b, el('span', 's', fmtT(x[2].lbfft) + ' lbf·ft'), el('i', null, x[3]));
      trio.appendChild(m);
    });
    cont.appendChild(trio);

    cont.appendChild(tarjetaAlertas(r));
    cont.appendChild(tarjetaBarrido(r));
    cont.appendChild(tarjetaCabeza(r));
    cont.appendChild(tarjetaPrecarga(r));

    const det = el('details', 'card det'); det.appendChild(el('summary', null, 'Detalle del cálculo')); det.appendChild(tablaDetalle(r));
    cont.appendChild(det);

    const acc = el('div', 'card'), fila = el('div', 'acciones');
    const btn = el('button', 'btn', 'Copiar resumen'); btn.type = 'button';
    const est = el('span', 'estado'); est.setAttribute('role', 'status');
    const area = el('textarea', 'copia'); area.readOnly = true; area.hidden = true; area.setAttribute('aria-label', 'Resumen para copiar');
    btn.addEventListener('click', function () { copiar(resumenTexto(r), est, area); });
    add(fila, btn, est); add(acc, fila, area);
    cont.appendChild(acc);

    const barra = $('barra'); barra.className = 'barra'; barra.replaceChildren();
    const izq = el('div'); add(izq, el('small', null, 'Torque nominal'), el('br'));
    const num = el('b', null, fmtT(r.torque.nom) + ' N·m'); izq.appendChild(num);
    const der = el('div'); der.style.textAlign = 'right';
    add(der, el('small', null, fmtT(r.conv.nom.lbfft) + ' lbf·ft'), el('br'));
    const a = el('a', null, 'Ver resultados ↑'); a.href = '#res'; der.appendChild(a);
    add(barra, izq, der);
  }
  Object.assign(Torque.UI, { pintarError, pintar });
})();
