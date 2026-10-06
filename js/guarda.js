// js/guarda.js
'use strict';
/* Guarda de carga. Es el primer script: si un archivo (script o estilos) no se descarga, o si algo falla mientras la
   aplicación arranca, muestra un aviso claro arriba de la pantalla en lugar de dejar una página a medias que parece
   funcionar. arranque.js (el último script) marca la aplicación como lista.
   No depende de ningún otro archivo ni del CSS; todo el texto se inserta con textContent (sin HTML). */
(function () {
  const fallos = [];
  let caja = null;

  function mostrar() {
    const padre = document.body || document.documentElement;
    if (!caja) {
      caja = document.createElement('div');
      caja.setAttribute('role', 'alert');
      caja.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:10px 14px;background:#7f1d1d;color:#fff;' +
        'font:13px/1.45 system-ui,sans-serif;border-bottom:2px solid #fca5a5;max-height:50vh;overflow:auto';
      padre.appendChild(caja);
    }
    caja.textContent = '';
    const t = document.createElement('strong');
    t.textContent = 'La calculadora no pudo iniciar correctamente. No uses los resultados hasta resolverlo.';
    caja.appendChild(t);
    fallos.forEach(function (f) { const d = document.createElement('div'); d.textContent = '· ' + f; caja.appendChild(d); });
    const p = document.createElement('div');
    p.textContent = 'Revisá que la carpeta del proyecto esté completa (index.html junto a css/ y js/) y recargá la página con Ctrl+F5.';
    caja.appendChild(p);
  }

  function anotar(texto) { if (fallos.indexOf(texto) < 0) fallos.push(texto); mostrar(); }

  // Fase de captura: los errores de descarga de un <script> no burbujean hasta window.
  window.addEventListener('error', function (ev) {
    if (window.__TORQUE_LISTO__) return;                                  // solo vigila la carga inicial
    const el = ev.target;
    if (el && el !== window && el.tagName === 'SCRIPT') {
      anotar('No se pudo cargar el archivo ' + (el.getAttribute('src') || '(sin ruta)') + '.');
    } else if (el === window) {
      const donde = ev.filename ? ' [' + String(ev.filename).split('/').slice(-2).join('/') + ':' + ev.lineno + ']' : '';
      anotar('Error al iniciar: ' + (ev.message || 'desconocido') + donde);
    }
  }, true);

  window.addEventListener('unhandledrejection', function (ev) {
    if (!window.__TORQUE_LISTO__) anotar('Error al iniciar: ' + String(ev.reason && ev.reason.message || ev.reason));
  });

  window.addEventListener('load', function () {
    if (!window.__TORQUE_LISTO__ && !fallos.length) anotar('La aplicación no terminó de iniciar.');
    // Los estilos están en <head> y se piden antes de que corra este script, así que su error de descarga no se puede escuchar:
    // se comprueba el resultado. css/estilos.css define --ac en :root; si no está, no se aplicó (archivo faltante, 404, vacío o tipo MIME erróneo)
    if (!window.getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()) {
      anotar('Los estilos (css/estilos.css) no se aplicaron: la página se vería sin formato.');
    }
  });
})();
