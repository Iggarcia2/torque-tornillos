// js/datos/materiales.js
'use strict';
/* Materiales del alojamiento (rosca interior). */
(function () {
  const { DATOS } = Torque;

  /* Materiales del alojamiento. Rm: resistencia a tracción de diseño (MPa). pG: presión límite bajo cabeza
     (MPa, orden de magnitud de las tablas de VDI 2230; orientativa). regla: engrane mínimo práctico en múltiplos de D. */
  DATOS.materiales = [
    { id: 'acero_s235', nombre: 'Acero estructural S235 / A36', tipo: 'acero', Rm: 360, pG: 490, regla: 1.0 },
    { id: 'acero_s355', nombre: 'Acero estructural S355', tipo: 'acero', Rm: 470, pG: 710, regla: 1.0 },
    { id: 'fundicion_gris', nombre: 'Fundición gris EN-GJL-250', tipo: 'fundicion', Rm: 250, pG: 900, regla: 1.5 },
    { id: 'fundicion_nodular', nombre: 'Fundición nodular EN-GJS-500-7', tipo: 'fundicion', Rm: 500, pG: 700, regla: 1.25 },
    { id: 'aluminio_6061', nombre: 'Aluminio forjado 6061-T6', tipo: 'aluminio', Rm: 290, pG: 350, regla: 2.0 },
    { id: 'aluminio_fundido', nombre: 'Aluminio fundido AlSi7Mg (A356-T6)', tipo: 'aluminio', Rm: 230, pG: 250, regla: 2.0 },
    { id: 'bronce', nombre: 'Bronce fundido CuSn10', tipo: 'bronce', Rm: 270, pG: 280, regla: 1.5 },
    { id: 'plastico_gf', nombre: 'Plástico técnico con fibra de vidrio (PA66-GF30)', tipo: 'plastico', Rm: 100, pG: 100, regla: 2.5 },
    { id: 'plastico', nombre: 'Plástico técnico sin refuerzo (PA6 / POM)', tipo: 'plastico', Rm: 50, pG: 60, regla: 3.0 },
    { id: 'personalizado', nombre: 'Otro material (ingresar Rm)', tipo: 'personalizado', Rm: null, pG: null, regla: 1.5 }
  ];
})();
