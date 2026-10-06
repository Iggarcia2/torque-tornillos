// js/arranque.js
'use strict';
/* Arranque: se carga al final, cuando todos los módulos ya están definidos. Si algo falla antes de la marca de abajo,
   js/guarda.js muestra el aviso en pantalla. */
Torque.UI.iniciar();
window.__TORQUE_LISTO__ = true;                              // lo lee js/guarda.js
