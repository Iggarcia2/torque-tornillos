// js/nucleo/constantes.js
'use strict';
/* Espacio de nombres único del proyecto (Torque) y constantes del modelo. Se carga primero entre los módulos.
   Unidades internas: mm · N · MPa. Los demás archivos agregan sus funciones y tablas a Torque. */
const Torque = { CONST: null, DATOS: {}, UI: {} };

Torque.CONST = {
  IN_MM: 25.4,
  KSI_MPA: 6.894757293,
  NM_LBFFT: 0.7375621493,
  NM_KGFM: 0.1019716213,
  N_LBF: 0.2248089431,
  /* Perfil básico de rosca ISO 68-1 (60°) */
  G_D2: 0.649519,        /* d2 = D − 0,649519·P   (diámetro primitivo)            */
  G_D3: 1.226869,        /* d3 = D − 1,226869·P   (núcleo de la rosca exterior)   */
  G_D1: 1.082532,        /* D1 = D − 1,082532·P   (núcleo de la rosca interior)   */
  G_DS_M: 0.938194,      /* ds = D − 0,938194·P   (métrica, ISO 898-1: (d2+d3)/2) */
  G_DS_UN: 0.9743,       /* ds = D − 0,9743·P     (unificada, ASME B1.1)          */
  TAN30: 0.5773502692,
  /* Barrido de rosca */
  ALFA_CORTE: 0.6,       /* resistencia al corte = 0,6·Rm                          */
  C_DIST: 0.8,           /* área de corte efectiva (reparto no uniforme + tolerancias) */
  SF_BARRIDO: 1.5,       /* factor de seguridad de la precarga frente al barrido   */
  /* Presión bajo cabeza */
  DW_CABEZA: 1.45,       /* diámetro de apoyo de cabeza hexagonal / Allen ≈ 1,45·D */
  DW_ARANDELA: 1.9,      /* diámetro exterior de arandela plana ≈ 1,9·D            */
  DH_AGUJERO: 1.1,       /* agujero pasante medio ≈ 1,1·D                           */
  /* Referencia de torque en seco para comparar */
  K_REF_SECA: 0.20,
  /* Límites de validación */
  PCT_MIN: 10, PCT_MAX: 100,
  D_MIN: 1.6, D_MAX: 100, P_MIN: 0.2, P_MAX: 9, PD_MIN: 0.02, PD_MAX: 0.3,
  LE_MAX_D: 30, RM_MIN: 10, RM_MAX: 3000,
  TOL: 1e-9
};
