// js/datos/roscas.js
'use strict';
/* Tabla de roscas: métricas ISO 261 (gruesa y fina) y unificadas ASME B1.1 (UNC y UNF). */
(function () {
  const { CONST, DATOS } = Torque;

  function etqP(p) { return String(p).replace('.', ','); }

  /* Roscas métricas ISO 261 (D en mm, paso P en mm) */
  const M_GRUESA = [[3, 0.5], [4, 0.7], [5, 0.8], [6, 1], [8, 1.25], [10, 1.5], [12, 1.75], [14, 2], [16, 2], [18, 2.5],
    [20, 2.5], [22, 2.5], [24, 3], [27, 3], [30, 3.5], [33, 3.5], [36, 4], [39, 4]];
  const M_FINA = [[6, 0.75], [8, 1], [10, 1.25], [10, 1], [12, 1.5], [12, 1.25], [14, 1.5], [16, 1.5], [18, 1.5], [20, 1.5],
    [22, 1.5], [24, 2], [27, 2], [30, 2], [33, 2], [36, 3], [39, 3]];
  /* Roscas unificadas ASME B1.1: [etiqueta, diámetro en pulgadas, hilos por pulgada] */
  const UNC = [['1/4', 0.25, 20], ['5/16', 0.3125, 18], ['3/8', 0.375, 16], ['7/16', 0.4375, 14], ['1/2', 0.5, 13],
    ['9/16', 0.5625, 12], ['5/8', 0.625, 11], ['3/4', 0.75, 10], ['7/8', 0.875, 9], ['1', 1, 8], ['1-1/8', 1.125, 7],
    ['1-1/4', 1.25, 7], ['1-3/8', 1.375, 6], ['1-1/2', 1.5, 6]];
  const UNF = [['1/4', 0.25, 28], ['5/16', 0.3125, 24], ['3/8', 0.375, 24], ['7/16', 0.4375, 20], ['1/2', 0.5, 20],
    ['9/16', 0.5625, 18], ['5/8', 0.625, 18], ['3/4', 0.75, 16], ['7/8', 0.875, 14], ['1', 1, 12], ['1-1/8', 1.125, 12],
    ['1-1/4', 1.25, 12], ['1-3/8', 1.375, 12], ['1-1/2', 1.5, 12]];

  function metricas(lista, serie) {
    return lista.map(function (t) {
      return { id: 'M' + t[0] + (serie === 'fina' ? 'x' + t[1] : ''), etiqueta: 'M' + t[0] + ' × ' + etqP(t[1]),
               sistema: 'metrica', D_mm: t[0], P_mm: t[1] };
    });
  }
  function unificadas(lista, serie) {
    return lista.map(function (t) {
      return { id: t[0] + '-' + t[2] + serie, etiqueta: t[0] + '" – ' + t[2] + ' ' + serie, sistema: 'unificada',
               D_mm: t[1] * CONST.IN_MM, P_mm: CONST.IN_MM / t[2], D_in: t[1], tpi: t[2] };
    });
  }
  DATOS.roscas = {
    metrica: { gruesa: metricas(M_GRUESA, 'gruesa'), fina: metricas(M_FINA, 'fina') },
    unificada: { UNC: unificadas(UNC, 'UNC'), UNF: unificadas(UNF, 'UNF') }
  };
})();
