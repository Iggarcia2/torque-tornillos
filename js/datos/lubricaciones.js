// js/datos/lubricaciones.js
'use strict';
/* Condiciones de lubricación y acabado: coeficiente de torque K. */
(function () {
  const { DATOS } = Torque;

  /* Coeficiente de torque K (T = K·D·Fi). K, Kmin, Kmax son valores típicos de la bibliografía
     (Bickford, Shigley, Machinery's Handbook); la dispersión real depende de rugosidad, recubrimiento y velocidad. */
  DATOS.lubricaciones = [
    { id: 'seca', nombre: 'Seca, sin lubricar (acero negro / pavonado)', K: 0.20, Kmin: 0.15, Kmax: 0.25,
      inox: { K: 0.30, Kmin: 0.24, Kmax: 0.36 },
      desc: 'Rosca limpia y seca. Es la condición de las tablas de torque más difundidas.' },
    { id: 'aceitada', nombre: 'Aceitada (aceite mineral en rosca y cabeza)', K: 0.15, Kmin: 0.12, Kmax: 0.18,
      desc: 'Una película de aceite en rosca y apoyo de la cabeza.' },
    { id: 'cincada', nombre: 'Cincada (zincado electrolítico)', K: 0.20, Kmin: 0.15, Kmax: 0.25,
      desc: 'Recubrimiento de zinc de espesor normal, sin lubricante adicional.' },
    { id: 'galvanizada', nombre: 'Galvanizada en caliente', K: 0.25, Kmin: 0.20, Kmax: 0.30,
      desc: 'Capa de zinc gruesa y rugosa: más fricción y más dispersión que el cincado.' },
    { id: 'antiengrane', nombre: 'Con compuesto antiengrane (anti-seize)', K: 0.13, Kmin: 0.10, Kmax: 0.16,
      desc: 'Pasta de cobre, níquel o MoS₂ en la rosca y bajo la cabeza.' },
    { id: 'loctite', nombre: 'Con Loctite / fijador de roscas', K: 0.18, Kmin: 0.14, Kmax: 0.22,
      desc: 'Fijador anaeróbico de resistencia media o alta aplicado en la rosca.' }
  ];
})();
