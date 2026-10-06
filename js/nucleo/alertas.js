// js/nucleo/alertas.js
'use strict';
/* Alertas y recomendaciones de montaje, ordenadas por gravedad. Función pura, sin DOM. */
(function () {
  const { CONST, DATOS, fmt, fmtT, buscar } = Torque;

  /* ───────────── Alertas y recomendaciones ───────────── */
  const ORDEN = { peligro: 0, aviso: 1, ok: 2, info: 3 };      /* los chequeos que cumplen van antes que los consejos generales */

  function construirAlertas(r, e) {
    const A = [];
    const add = function (id, nivel, titulo, texto) { A.push({ id: id, nivel: nivel, titulo: titulo, texto: texto }); };
    const D = r.rosca.D, b = r.barrido, c = r.cabeza, m = r.material;
    const refTxt = r.clase.ref === 'Sp' ? 'proof load (Sp)' : 'Rp0,2';
    const refCorto = r.clase.ref === 'Sp' ? 'Sp' : 'Rp0,2';
    const mmD = function (x) { return fmt(x, 1) + ' mm (' + fmt(x / D, 2) + '·D)'; };

    /* 1. Barrido de rosca */
    if (b.estado === 'peligro') {
      add('barrido', 'peligro', 'Riesgo de barrido de rosca en el alojamiento',
        'Con ' + mmD(b.Le) + ' de engrane, los hilos fallan por corte antes de que el tornillo llegue a su carga de rotura (capacidad de barrido ' +
        fmt(b.Fstrip / 1000, 1) + ' kN contra ' + fmt(r.Fbolt_ult / 1000, 1) + ' kN del tornillo). Longitud mínima de roscado recomendada: ' + mmD(b.Le_rec) +
        '. Si no hay espacio, usá un inserto roscado (tipo helicoidal) o un tornillo de menor clase.');
    } else if (b.estado === 'aviso') {
      add('barrido', 'aviso', 'Engrane por debajo de la regla práctica',
        'Los ' + mmD(b.Le) + ' alcanzan para que el tornillo rompa antes que el hilo (mínimo analítico ' + mmD(b.Le_analitica) + '), pero para ' + m.nombre +
        ' se recomienda ≥ ' + fmt(m.regla, 2) + '·D. Longitud de roscado recomendada: ' + mmD(b.Le_rec) + '.');
    } else {
      add('barrido', 'ok', 'Engrane de rosca suficiente',
        'Los ' + mmD(b.Le) + ' superan la longitud recomendada (' + mmD(b.Le_rec) + '): ante una sobrecarga rompe el tornillo antes que los hilos del alojamiento.');
    }

    /* 2. Torque reducido por el alojamiento */
    if (r.limitante === 'rosca') {
      add('limite_rosca', 'peligro', 'Torque reducido por la resistencia de los hilos del alojamiento',
        'El torque se limitó a ' + fmtT(r.torque.nom) + ' N·m (' + fmt(r.pctAplicada, 0) + ' % de ' + refCorto + ' en lugar de ' + fmt(r.entrada.pct, 0) +
        ' %; sin esta limitación serían ' + fmtT(r.torque.objetivo) + ' N·m). Para llegar a la precarga objetivo hacen falta ' + mmD(b.Le_rec) + ' de engrane o un inserto roscado.');
    } else if (r.limitante === 'cabeza') {
      const conArandela = (!r.entrada.arandela && c.AbArandela * c.pG >= r.Fobj * (1 - CONST.TOL));
      add('limite_cabeza', 'peligro', 'Torque reducido por aplastamiento bajo la cabeza',
        'La presión bajo la cabeza superaría el límite del material (' + fmt(c.pG, 0) + ' MPa) y el apoyo se deformaría. El torque se limitó a ' + fmtT(r.torque.nom) +
        ' N·m en lugar de ' + fmtT(r.torque.objetivo) + ' N·m.' + (conArandela ? ' Con una arandela plana de acero endurecido (Ø ≈ 1,9·D) se puede aplicar el torque objetivo.' :
        ' Usá arandela de acero endurecido de mayor diámetro o una pieza de apoyo más resistente.'));
    }

    /* 3. Presión bajo la cabeza */
    if (c.estado === 'aviso' && r.limitante !== 'cabeza') {
      add('cabeza', 'aviso', 'Presión bajo la cabeza cerca del límite',
        'Con el torque nominal la presión es ' + fmt(c.pNom, 0) + ' MPa, pero con la fricción más baja del rango llega a ' + fmt(c.pMax, 0) + ' MPa (límite orientativo ' + fmt(c.pG, 0) +
        ' MPa). Riesgo de deformación del apoyo' + (r.entrada.arandela ? '.' : ': usá arandela de acero endurecido.'));
    } else if (c.estado === 'ok' && !r.limitante) {
      add('cabeza', 'ok', 'Presión bajo la cabeza admisible',
        fmt(c.pNom, 0) + ' MPa con el torque nominal (máx. ' + fmt(c.pMax, 0) + ' MPa con la fricción más baja), por debajo del límite orientativo de ' + fmt(c.pG, 0) + ' MPa.');
    }
    if (!r.entrada.arandela && (m.tipo === 'aluminio' || m.tipo === 'plastico' || m.tipo === 'bronce') && c.estado === 'ok' && !r.limitante) {
      add('arandela', 'info', 'Conviene usar arandela', 'Sobre ' + m.nombre + ' una arandela plana de acero reparte la presión (área de apoyo ≈ ' +
        fmt(c.AbArandela / c.Ab, 1) + ' veces mayor) y evita el embutido de la cabeza con el tiempo.');
    }

    /* 4. Dispersión de la fricción → precarga real */
    const pmax = r.precarga.pctRealMax, pmin = r.precarga.pctRealMin;
    if (pmax > 100 + 1e-6) {
      add('dispersion', 'peligro', 'La dispersión de fricción puede llevar la precarga por encima del ' + refTxt,
        'Con el torque nominal y la fricción más baja del rango (K = ' + fmt(r.lub.Kmin, 2) + '), la precarga real llega a ' + fmt(r.precarga.realMax / 1000, 1) + ' kN = ' + fmt(pmax, 0) +
        ' % de ' + refCorto + ': el tornillo puede plastificar. Bajá la precarga objetivo, usá una llave con menor dispersión o apretá por ángulo / control de fluencia.');
    } else if (pmax >= 90) {
      add('dispersion', 'info', 'Margen estrecho frente al ' + refTxt,
        'Con el torque nominal la precarga real queda entre ' + fmt(pmin, 0) + ' % y ' + fmt(pmax, 0) + ' % de ' + refCorto + ' según la fricción (K de ' + fmt(r.lub.Kmin, 2) + ' a ' +
        fmt(r.lub.Kmax, 2) + '). Es la razón de usar ≈ 75 % como objetivo: el extremo alto no supera el límite elástico.');
    } else {
      add('dispersion', 'ok', 'Precarga real dentro de lo admisible',
        'Con el torque nominal la precarga real queda entre ' + fmt(pmin, 0) + ' % y ' + fmt(pmax, 0) + ' % de ' + refCorto + ' al variar la fricción.');
    }

    /* 5. Condición de lubricación */
    if (r.lub.inoxSeca) {
      const lubAS = buscar(DATOS.lubricaciones, 'antiengrane');
      const tAS = lubAS.K * (D / 1000) * r.Fapl;
      add('inox_seco', 'aviso', 'Riesgo de gripado (galling) en acero inoxidable sin lubricar',
        'Inoxidable contra inoxidable en seco se suelda en frío y puede trabar el tornillo. Lubricá con antiengrane: con K ≈ ' + fmt(lubAS.K, 2) + ' el torque para la misma precarga baja a ' +
        fmtT(tAS) + ' N·m (' + fmtT(tAS * CONST.NM_LBFFT) + ' lbf·ft). Apretá despacio, sin llave de impacto.');
    } else if (r.lub.K < 0.17 && r.lub.id !== 'loctite') {
      const fSeca = CONST.K_REF_SECA / r.lub.K;
      add('lubricado', 'aviso', 'No uses el torque de tablas de rosca seca',
        'Con esta lubricación la fricción es menor: aplicar el torque de rosca seca (K = ' + fmt(CONST.K_REF_SECA, 2) + ') daría una precarga ' + fmt((fSeca - 1) * 100, 0) + ' % mayor, es decir ' +
        fmt(r.entrada.pct * fSeca, 0) + ' % de ' + refCorto + (r.entrada.pct * fSeca > 100 ? ' (por encima del límite elástico).' : '.'));
    }
    if (r.lub.id === 'loctite') {
      add('loctite', 'info', 'Fijador de roscas', 'Aplicalo con la rosca limpia y desengrasada, respetá el tiempo de curado y no lo combines con aceite ni antiengrane. El K es aproximado: confirmalo con la ficha técnica del producto.');
    }
    if (r.lub.id === 'galvanizada') {
      add('galv', 'aviso', 'Galvanizado en caliente: fricción alta y dispersa', 'Verificá que la tuerca o el agujero roscado estén repasados para el espesor de zinc; si la rosca está seca o sobrecargada de zinc puede gripar antes de alcanzar la precarga.');
    }

    /* 6. Nivel de precarga elegido */
    if (r.entrada.pct > 90) {
      add('pct_alto', 'aviso', 'Precarga mayor al 90 %', 'Sólo para uniones permanentes: el tornillo queda muy cerca del límite elástico y no conviene reutilizarlo. Apretá con control por ángulo o con una llave de baja dispersión.');
    } else if (r.entrada.pct < 40) {
      add('pct_bajo', 'aviso', 'Precarga baja', 'Con menos del 40 % de ' + refCorto + ' la unión puede aflojarse por vibración o perder fricción de contacto.');
    }

    /* 7. Material del alojamiento y combinaciones */
    if (m.tipo === 'plastico') {
      add('plastico', 'aviso', 'Plástico: relajación y fluencia lenta', 'El plástico pierde precarga con el tiempo, la temperatura y la humedad, y no tolera una rosca cortada de gran paso. Preferí insertos metálicos (moldeados o por ultrasonido), tornillos autorroscantes para plástico y limitadores de torque.');
    } else if (m.tipo === 'fundicion' && m.id === 'fundicion_gris') {
      add('fundicion', 'info', 'Fundición gris: material frágil', 'Resiste bien la compresión pero no los picos de torque ni los golpes: apretá de forma continua, sin llave de impacto.');
    }
    if (m.tipo === 'aluminio' && r.clase.familia === 'acero' && !(r.lub.id === 'antiengrane' || r.lub.id === 'cincada' || r.lub.id === 'galvanizada')) {
      add('galvanico', 'aviso', 'Acero en aluminio: corrosión galvánica y gripado', 'Un tornillo de acero sin recubrimiento en una rosca de aluminio se traba con el tiempo. Usá cincado, antiengrane o inserto de acero inoxidable.');
    }

    /* 8. Fuera del alcance de la tabla de propiedades */
    if (r.clase.fueraAlcance) {
      add('alcance', 'aviso', 'Diámetro fuera del alcance de la norma del tornillo', 'Las propiedades tabuladas de ' + r.clase.nombre + ' valen hasta ' +
        (e.sistema === 'unificada' ? fmt(r.clase.alcance / CONST.IN_MM, 1) + ' pulgadas' : fmt(r.clase.alcance, 0) + ' mm') + '. Para este diámetro las propiedades deben acordarse con el fabricante.');
    }

    /* 9. Montaje */
    add('montaje', 'info', 'Recomendaciones de montaje', 'Apretá en 2 o 3 pasadas (≈ 30 %, 70 % y 100 % del torque) y en cruz si hay varios tornillos. Usá una llave calibrada (±4 %) con movimiento continuo. ' +
      'El asentamiento de las superficies hace perder entre 5 % y 10 % de precarga: reapretá después de la primera carga en juntas críticas.');

    const clave = function (a) { return a.id === 'montaje' ? 9 : ORDEN[a.nivel]; };               /* el consejo de montaje va siempre al final */
    A.sort(function (x, y) { return clave(x) - clave(y); });
    return A;
  }
  Torque.construirAlertas = construirAlertas;
})();
