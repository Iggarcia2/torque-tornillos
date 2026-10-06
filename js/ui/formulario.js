// js/ui/formulario.js
'use strict';
/* Formulario: listas desplegables dependientes, lectura de la entrada y textos informativos junto a los campos. */
(function () {
  const { DATOS, CONST, fmt, buscar, clasesPara, geometriaRosca, propsClase, coefK } = Torque;
  const { $, S, el, add, opcion, leer, recortar } = Torque.UI;

  function listaTamanos(sis, serie) { return (DATOS.roscas[sis] && DATOS.roscas[sis][serie]) || []; }
  function buscarTamano(sis, serie, id) { return buscar(listaTamanos(sis, serie), id); }
  function poblarSerie() {
    const sel = $('serie'), sis = $('sistema').value;
    sel.replaceChildren();
    if (sis === 'metrica') add(sel, opcion('gruesa', 'Gruesa'), opcion('fina', 'Fina'));
    else add(sel, opcion('UNC', 'UNC (gruesa)'), opcion('UNF', 'UNF (fina)'));
  }
  function poblarTamano(DprevMm) {
    const sel = $('tamano'), sis = $('sistema').value, serie = $('serie').value;
    const lista = listaTamanos(sis, serie);
    sel.replaceChildren();
    lista.forEach(function (t) { sel.appendChild(opcion(t.id, t.etiqueta)); });
    sel.appendChild(opcion('__otro__', 'Otro… (ingresar diámetro y paso)'));
    const objetivo = (typeof DprevMm === 'number' && isFinite(DprevMm)) ? DprevMm : (sis === 'metrica' ? 10 : 12.7);
    let mejor = lista[0], dif = Infinity;
    lista.forEach(function (t) { const d = Math.abs(t.D_mm - objetivo); if (d < dif - 1e-9) { dif = d; mejor = t; } });
    if (mejor) sel.value = mejor.id;
    alternarPersonal();
  }
  function poblarClase() {
    const sel = $('clase'), sis = $('sistema').value, previa = sel.value;
    sel.replaceChildren();
    const lista = clasesPara(sis);
    lista.forEach(function (c) { sel.appendChild(opcion(c.id, c.nombre)); });
    sel.value = lista.some(function (c) { return c.id === previa; }) ? previa : (sis === 'metrica' ? '8.8' : 'SAE5');
  }
  function poblarMaterial() {
    const sel = $('material'); sel.replaceChildren();
    const grupos = [['acero', 'Aceros'], ['fundicion', 'Fundiciones'], ['aluminio', 'Aluminio'], ['bronce', 'Bronce'], ['plastico', 'Plásticos técnicos'], ['personalizado', 'Otro']];
    grupos.forEach(function (g) {
      const og = document.createElement('optgroup'); og.label = g[1];
      DATOS.materiales.filter(function (m) { return m.tipo === g[0]; }).forEach(function (m) { og.appendChild(opcion(m.id, m.nombre)); });
      sel.appendChild(og);
    });
    sel.value = 'acero_s235';
  }
  function poblarLub() {
    const sel = $('lub'); sel.replaceChildren();
    DATOS.lubricaciones.forEach(function (l) { sel.appendChild(opcion(l.id, l.nombre)); });
    sel.value = 'seca';
  }
  function alternarPersonal() {
    const personal = $('tamano').value === '__otro__', sis = $('sistema').value;
    $('personal').hidden = !personal;
    if (personal) {
      $('lblD').textContent = sis === 'metrica' ? 'Diámetro nominal D (mm)' : 'Diámetro nominal D (pulgadas)';
      $('lblP').textContent = sis === 'metrica' ? 'Paso P (mm)' : 'Hilos por pulgada n';
      if ($('pD').value === '') { $('pD').value = sis === 'metrica' ? '10' : '0,5'; $('pP').value = sis === 'metrica' ? '1,5' : '13'; }
    }
  }
  function leerRosca() {
    const sis = $('sistema').value, tam = $('tamano').value;
    if (tam === '__otro__') {
      const D = leer($('pD').value), P = leer($('pP').value);
      if (sis === 'unificada') return { sistema: sis, D_mm: D * CONST.IN_MM, P_mm: P > 0 ? CONST.IN_MM / P : NaN };
      return { sistema: sis, D_mm: D, P_mm: P };
    }
    const t = buscarTamano(sis, $('serie').value, tam);
    return t ? { sistema: sis, D_mm: t.D_mm, P_mm: t.P_mm } : { sistema: sis, D_mm: NaN, P_mm: NaN };
  }
  function leerEntrada() {
    const r = leerRosca();
    let Le = leer($('le').value);
    if ($('leUnidad').value === 'in') Le *= CONST.IN_MM;
    return { sistema: r.sistema, D_mm: r.D_mm, P_mm: r.P_mm, claseId: $('clase').value, materialId: $('material').value, rmMaterial_MPa: leer($('rmMat').value),
             Le_mm: Le, arandela: $('arandela').checked, lubId: $('lub').value, pct: leer($('pctNum').value) };
  }
  function ponerLeDefecto() {
    if (S.leTocado) return;
    const D = leerRosca().D_mm;
    if (!(D > 0)) return;
    const mm = Math.round(1.5 * D * 2) / 2;
    $('le').value = $('leUnidad').value === 'in' ? recortar(mm / CONST.IN_MM, 2) : recortar(mm, 1);
  }
  function actualizarDatosTornillo() {
    const dl = $('datosTornillo'); dl.replaceChildren();
    const ent = leerRosca(), clase = buscar(DATOS.clases, $('clase').value);
    if (!clase || !(ent.D_mm >= CONST.D_MIN) || !(ent.P_mm >= CONST.P_MIN) || ent.P_mm / ent.D_mm > CONST.PD_MAX || ent.P_mm / ent.D_mm < CONST.PD_MIN) return;
    const g = geometriaRosca(ent.sistema, ent.D_mm, ent.P_mm), p = propsClase(clase, ent.D_mm);
    const item = function (k, v) { add(dl, add(el('div'), el('dt', null, k), el('dd', null, v))); };
    if (ent.sistema === 'unificada') item('Hilos por pulgada', fmt(CONST.IN_MM / ent.P_mm, 0));
    else item('Paso P', fmt(ent.P_mm, 2) + ' mm');
    item('Área resistente As', fmt(g.As, 1) + ' mm²');
    item('Ø primitivo d₂', fmt(g.d2, 2) + ' mm');
    item(clase.ref === 'Sp' ? 'Proof Sp' : 'Rp0,2', fmt(clase.ref === 'Sp' ? p.Sp : p.Rp, 0) + ' MPa');
    if (clase.ref === 'Sp') item('Fluencia Rp0,2', fmt(p.Rp, 0) + ' MPa');
    item('Rotura Rm', fmt(p.Rm, 0) + ' MPa');
  }
  function actualizarK() {
    const lub = buscar(DATOS.lubricaciones, $('lub').value), clase = buscar(DATOS.clases, $('clase').value);
    const info = $('kInfo'); info.replaceChildren();
    if (!lub) return;
    const k = coefK(lub, clase ? clase.familia : 'acero');
    add(info, document.createTextNode('K nominal '), el('b', null, fmt(k.K, 2)), document.createTextNode(' · rango '), el('b', null, fmt(k.Kmin, 2) + ' – ' + fmt(k.Kmax, 2)),
      document.createTextNode('. ' + lub.desc + (k.inoxSeca ? ' En inoxidable sin lubricar la fricción sube (K ≈ 0,30) y hay riesgo de gripado.' : '')));
  }
  function actualizarEtiquetaPct() {
    const clase = buscar(DATOS.clases, $('clase').value);
    $('lblPct').textContent = clase && clase.ref === 'Rp' ? 'Precarga objetivo (% del límite convencional Rp0,2)' : 'Precarga objetivo (% del proof load Sp)';
    $('pctHint').textContent = '60 % a 75 %: uniones desmontables o reutilizables · 80 % a 90 %: uniones permanentes.';
  }
  function marcarChipsPct() {
    const v = leer($('pctNum').value);
    Array.prototype.forEach.call($('chipsPct').children, function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.v) === v)); });
  }
  function marcarInvalidos() {
    [['le', true], ['pctNum', true], ['pD', !$('personal').hidden], ['pP', !$('personal').hidden], ['rmMat', !$('campoRm').hidden]].forEach(function (p) {
      const n = $(p[0]); n.setAttribute('aria-invalid', String(p[1] && isNaN(leer(n.value))));
    });
  }
  function actualizarHintLe(r, ent) {
    const hint = $('leHint'), D = ent.D_mm;
    if (!(ent.Le_mm > 0) || !(D > 0)) { hint.textContent = ''; return; }
    let t = '= ' + fmt(ent.Le_mm / D, 2) + ' × D';
    if (r && r.ok) {
      const rec = r.barrido.Le_rec;
      t += ' · recomendado ≥ ' + fmt(rec, 1) + ' mm (' + fmt(rec / D, 2) + ' × D)';
      if ($('leUnidad').value === 'in') t += ' = ' + fmt(rec / CONST.IN_MM, 3) + ' pulg';
    }
    hint.textContent = t;
  }
  Object.assign(Torque.UI, { poblarSerie, poblarTamano, poblarClase, poblarMaterial, poblarLub, alternarPersonal, leerRosca, leerEntrada, ponerLeDefecto, actualizarDatosTornillo, actualizarK, actualizarEtiquetaPct, marcarChipsPct, marcarInvalidos, actualizarHintLe });
})();
