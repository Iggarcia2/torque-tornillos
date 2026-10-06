// js/datos/clases.js
'use strict';
/* Clases de resistencia del tornillo (ISO 898-1, ISO 3506-1, SAE J429). */
(function () {
  const { CONST, DATOS } = Torque;

  /* Clases de resistencia. Propiedades mínimas: ISO 898-1:2013 (acero), ISO 3506-1 (inoxidable), SAE J429.
     tramos: se usa el primero con D ≤ hasta (mm). ref: valor sobre el que se aplica el % de precarga. */
  const KSI = CONST.KSI_MPA, IN = CONST.IN_MM;
  DATOS.clases = [
    { id: '4.6', nombre: '4.6', sistema: 'metrica', familia: 'acero', ref: 'Sp', alcance: 39, tramos: [{ hasta: 39, Rm: 400, Rp: 240, Sp: 225 }] },
    { id: '5.8', nombre: '5.8', sistema: 'metrica', familia: 'acero', ref: 'Sp', alcance: 39, tramos: [{ hasta: 39, Rm: 520, Rp: 420, Sp: 380 }] },
    { id: '8.8', nombre: '8.8', sistema: 'metrica', familia: 'acero', ref: 'Sp', alcance: 39,
      tramos: [{ hasta: 16, Rm: 800, Rp: 640, Sp: 580 }, { hasta: 39, Rm: 830, Rp: 660, Sp: 600 }] },
    { id: '10.9', nombre: '10.9', sistema: 'metrica', familia: 'acero', ref: 'Sp', alcance: 39, tramos: [{ hasta: 39, Rm: 1040, Rp: 940, Sp: 830 }] },
    { id: '12.9', nombre: '12.9', sistema: 'metrica', familia: 'acero', ref: 'Sp', alcance: 39, tramos: [{ hasta: 39, Rm: 1220, Rp: 1100, Sp: 970 }] },
    { id: 'A2-70', nombre: 'Inoxidable A2-70 (AISI 304)', sistema: 'metrica', familia: 'inox', ref: 'Rp', alcance: 24, tramos: [{ hasta: 24, Rm: 700, Rp: 450, Sp: null }] },
    { id: 'A2-80', nombre: 'Inoxidable A2-80 (AISI 304)', sistema: 'metrica', familia: 'inox', ref: 'Rp', alcance: 24, tramos: [{ hasta: 24, Rm: 800, Rp: 600, Sp: null }] },
    { id: 'A4-70', nombre: 'Inoxidable A4-70 (AISI 316)', sistema: 'metrica', familia: 'inox', ref: 'Rp', alcance: 24, tramos: [{ hasta: 24, Rm: 700, Rp: 450, Sp: null }] },
    { id: 'A4-80', nombre: 'Inoxidable A4-80 (AISI 316)', sistema: 'metrica', familia: 'inox', ref: 'Rp', alcance: 24, tramos: [{ hasta: 24, Rm: 800, Rp: 600, Sp: null }] },
    { id: 'SAE2', nombre: 'SAE Grado 2', sistema: 'unificada', familia: 'acero', ref: 'Sp', alcance: 1.5 * IN,
      tramos: [{ hasta: 0.75 * IN, Rm: 74 * KSI, Rp: 57 * KSI, Sp: 55 * KSI }, { hasta: 1.5 * IN, Rm: 60 * KSI, Rp: 36 * KSI, Sp: 33 * KSI }] },
    { id: 'SAE5', nombre: 'SAE Grado 5', sistema: 'unificada', familia: 'acero', ref: 'Sp', alcance: 1.5 * IN,
      tramos: [{ hasta: 1 * IN, Rm: 120 * KSI, Rp: 92 * KSI, Sp: 85 * KSI }, { hasta: 1.5 * IN, Rm: 105 * KSI, Rp: 81 * KSI, Sp: 74 * KSI }] },
    { id: 'SAE8', nombre: 'SAE Grado 8', sistema: 'unificada', familia: 'acero', ref: 'Sp', alcance: 1.5 * IN,
      tramos: [{ hasta: 1.5 * IN, Rm: 150 * KSI, Rp: 130 * KSI, Sp: 120 * KSI }] }
  ];
})();
