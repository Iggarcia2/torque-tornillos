// js/ui/eventos.js
'use strict';
/* Controlador: ciclo leer → calcular → pintar y conexión de los eventos del formulario. */
(function () {
  const { CONST, calcular } = Torque;
  const { $, S, el, leer, coma, recortar, poblarSerie, poblarTamano, poblarClase, poblarMaterial, poblarLub, alternarPersonal, leerRosca, leerEntrada, ponerLeDefecto, actualizarDatosTornillo, actualizarK, actualizarEtiquetaPct, marcarChipsPct, marcarInvalidos, actualizarHintLe, pintarError, pintar, armarGuia } = Torque.UI;

  function render() {
    const ent = leerEntrada();
    if (ent.D_mm > 0) S.D = ent.D_mm;
    actualizarDatosTornillo(); marcarInvalidos(); marcarChipsPct();
    const r = calcular(ent);
    S.ultimo = r;
    actualizarHintLe(r, ent);
    if (!r.ok) { pintarError(r.errores); return; }
    pintar(r);
  }
  function iniciar() {
    poblarSerie(); poblarTamano(); poblarClase(); poblarMaterial(); poblarLub();
    [1, 1.5, 2, 2.5, 3].forEach(function (k) {
      const b = el('button', 'chip', coma(k) + ' × D'); b.type = 'button';
      b.addEventListener('click', function () {
        const D = leerRosca().D_mm; if (!(D > 0)) return;
        S.leTocado = true;
        $('le').value = $('leUnidad').value === 'in' ? recortar(k * D / CONST.IN_MM, 3) : recortar(k * D, 1);
        render();
      });
      $('chipsLe').appendChild(b);
    });
    [[60, 'Desmontable 60 %'], [75, 'Reutilizable 75 %'], [90, 'Permanente 90 %']].forEach(function (x) {
      const b = el('button', 'chip', x[1]); b.type = 'button'; b.dataset.v = String(x[0]); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { $('pctNum').value = String(x[0]); $('pctRng').value = String(x[0]); render(); });
      $('chipsPct').appendChild(b);
    });
    ponerLeDefecto(); actualizarK(); actualizarEtiquetaPct(); armarGuia();

    $('sistema').addEventListener('change', function () {
      poblarSerie(); poblarTamano(S.D); poblarClase();
      if (!S.leTocado) { S.unidadLe = $('sistema').value === 'unificada' ? 'in' : 'mm'; $('leUnidad').value = S.unidadLe; }
      ponerLeDefecto(); actualizarK(); actualizarEtiquetaPct(); render();
    });
    $('serie').addEventListener('change', function () { poblarTamano(S.D); ponerLeDefecto(); render(); });
    $('tamano').addEventListener('change', function () { alternarPersonal(); ponerLeDefecto(); render(); });
    ['pD', 'pP'].forEach(function (id) { $(id).addEventListener('input', function () { ponerLeDefecto(); render(); }); });
    $('clase').addEventListener('change', function () { actualizarK(); actualizarEtiquetaPct(); render(); });
    $('material').addEventListener('change', function () { $('campoRm').hidden = $('material').value !== 'personalizado'; render(); });
    $('rmMat').addEventListener('input', render);
    $('le').addEventListener('input', function () { S.leTocado = true; render(); });
    $('leUnidad').addEventListener('change', function () {
      const v = leer($('le').value), desde = S.unidadLe, hacia = $('leUnidad').value;
      if (desde === hacia) return;                                     /* sin cambio real de unidad: no convertir */
      S.unidadLe = hacia;
      if (v > 0) $('le').value = hacia === 'in' ? recortar(v / CONST.IN_MM, 3) : recortar(v * CONST.IN_MM, 1);
      render();
    });
    $('arandela').addEventListener('change', render);
    $('lub').addEventListener('change', function () { actualizarK(); render(); });
    $('pctRng').addEventListener('input', function () { $('pctNum').value = $('pctRng').value; render(); });
    $('pctNum').addEventListener('input', function () { const v = leer($('pctNum').value); if (v >= CONST.PCT_MIN && v <= CONST.PCT_MAX) $('pctRng').value = String(Math.round(v)); render(); });
    render();
  }
  Object.assign(Torque.UI, { iniciar });
})();
