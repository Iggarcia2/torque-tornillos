// js/ui/guia.js
'use strict';
/* Guía técnica al pie de la página: fórmulas y tablas leídas de las mismas tablas de datos del cálculo. */
(function () {
  const { DATOS, CONST, fmt } = Torque;
  const { $, el } = Torque.UI;

  function tabla(cabeceras, filas, numericas) {
    const wrap = el('div', 'scroll'), t = el('table', 'tabla'), th = el('thead'), trh = el('tr');
    cabeceras.forEach(function (c, i) { trh.appendChild(el('th', numericas.indexOf(i) >= 0 ? 'n' : null, c)); });
    th.appendChild(trh); t.appendChild(th);
    const tb = el('tbody');
    filas.forEach(function (f) { const tr = el('tr'); f.forEach(function (v, i) { tr.appendChild(el('td', numericas.indexOf(i) >= 0 ? 'n' : null, v)); }); tb.appendChild(tr); });
    t.appendChild(tb); wrap.appendChild(t); return wrap;
  }
  function armarGuia() {
    const g = $('guia'); g.replaceChildren();
    const h2 = el('h2', null, 'Guía técnica: fórmulas y coeficientes'); h2.id = 'hg'; g.appendChild(h2);
    const p = function (t) { g.appendChild(el('p', null, t)); };
    const f = function (t) { g.appendChild(el('div', 'f', t)); };
    const h3 = function (t) { g.appendChild(el('h3', null, t)); };
    const li = function (items) { const ul = el('ul'); items.forEach(function (t) { ul.appendChild(el('li', null, t)); }); g.appendChild(ul); };

    h3('1. Torque y precarga');
    p('El torque de apriete se estima con la relación de factor de tuerca (nut factor), que resume en un solo coeficiente la fricción en la rosca, la fricción bajo la cabeza y la geometría del paso:');
    f('T = K · D · Fi');
    f('Fi = (η / 100) · Sp · As');
    p('T es el torque [N·m], D el diámetro nominal [m], Fi la precarga [N], η la precarga objetivo en porcentaje (por defecto 75 %), Sp la tensión de carga de prueba (proof load) de la clase y As el área resistente a tracción. En acero inoxidable, donde la norma no define Sp, se usa el límite convencional Rp0,2.');
    f('As = π/4 · (D − 0,9382 · P)²      métrica, ISO 898-1');
    f('As = π/4 · (D − 0,9743 / n)²      UNC / UNF, ASME B1.1 (n = hilos por pulgada)');
    p('Relación con VDI 2230: el mismo torque se obtiene con T = Fi · [0,16·P + 0,58·d₂·μG + (Dkm/2)·μK], donde μG es la fricción en la rosca, μK la fricción bajo la cabeza y Dkm el diámetro medio de apoyo. Para una métrica normal eso equivale a K ≈ 0,02 + 0,52·μG + 0,64·μK, es decir K ≈ 0,20 con μ ≈ 0,15.');
    p('Rango Mínimo / Nominal / Máximo: son los torques que logran la misma precarga objetivo si la fricción real fuera la más baja o la más alta del rango de K de la condición elegida. Se recomienda ajustar la llave al nominal. Con la llave en el nominal, la precarga real oscila entre Fi·K/Kmáx y Fi·K/Kmín, valor que la app compara con el 100 % del Sp.');

    h3('2. Coeficiente de fricción K asumido por condición');
    g.appendChild(tabla(['Condición', 'K nominal', 'Rango K', 'Observación'],
      DATOS.lubricaciones.map(function (l) { return [l.nombre, fmt(l.K, 2), fmt(l.Kmin, 2) + ' – ' + fmt(l.Kmax, 2), l.desc + (l.inox ? ' Acero inoxidable sin lubricar: K ≈ ' + fmt(l.inox.K, 2) + ' (' + fmt(l.inox.Kmin, 2) + ' – ' + fmt(l.inox.Kmax, 2) + ') y riesgo de gripado.' : '')]; }), [1, 2]));
    p('Son valores típicos de la bibliografía (Bickford, Shigley, Machinery\'s Handbook). La dispersión real de K en una obra es de ±25 % o más, y depende de la rugosidad, del recubrimiento, de la velocidad de apriete y de si la rosca se reutiliza. Cuando la unión es crítica conviene medir K con un ensayo de torque-tensión.');

    h3('3. Resistencias del tornillo');
    const filas = [];
    DATOS.clases.forEach(function (c) {
      let prev = 0;
      c.tramos.forEach(function (t) {
        const un = c.sistema === 'unificada';
        const conv = function (x) { return un ? fmt(x / CONST.IN_MM, 3).replace(/0+$/, '').replace(/,$/, '') + ' pulg' : fmt(x, 0) + ' mm'; };
        const rango = prev === 0 ? 'D ≤ ' + conv(t.hasta) : conv(prev) + ' < D ≤ ' + conv(t.hasta);
        filas.push([c.nombre, rango, t.Sp === null ? '—' : fmt(t.Sp, 0), fmt(t.Rp, 0), fmt(t.Rm, 0)]);
        prev = t.hasta;
      });
    });
    g.appendChild(tabla(['Clase', 'Rango de diámetro', 'Sp [MPa]', 'Rp0,2 [MPa]', 'Rm [MPa]'], filas, [2, 3, 4]));
    p('Valores mínimos de ISO 898-1:2013 (clases 4.6 a 12.9), ISO 3506-1 (inoxidables) y SAE J429 (grados 2, 5 y 8, convertidos de ksi a MPa).');

    h3('4. Verificación al barrido de rosca');
    p('Se compara la capacidad de corte de los hilos con la carga de rotura del tornillo Rm·As. La resistencia al corte se toma como 0,6·Rm del material y se reduce con un factor C = 0,8 por reparto no uniforme de la carga entre hilos y por tolerancias:');
    f('F_barrido,alojamiento = C · 0,6 · Rm,mat · (0,875 · π · D) · Le');
    f('F_barrido,tornillo    = C · 0,6 · Rm,tor · (0,75 · π · D1) · Le');
    f('Le,mín = Rm,tor · As / [C · 0,6 · Rm,mat · 0,875 · π · D]');
    p('Le,recomendada es el mayor entre Le,mín (o el equivalente para el hilo del tornillo) y la regla práctica del material, redondeado hacia arriba a 0,5 mm. Si el engrane disponible es menor que Le,mín, la app indica riesgo de barrido y limita la precarga a F_barrido / 1,5, con el torque correspondiente.');
    g.appendChild(tabla(['Material del alojamiento', 'Rm [MPa]', 'Presión límite pG [MPa]', 'Engrane práctico mín.'],
      DATOS.materiales.filter(function (m) { return m.Rm !== null; }).map(function (m) { return [m.nombre, fmt(m.Rm, 0), fmt(m.pG, 0), fmt(m.regla, 2) + ' · D']; }), [1, 2, 3]));

    h3('5. Presión bajo la cabeza');
    f('p = F / Ab      Ab = π/4 · (dw² − dh²)');
    p('Con dw = 1,45·D (cabeza hexagonal o Allen), dw = 1,9·D con arandela plana y dh = 1,1·D (agujero pasante medio). Si p supera el límite del material del alojamiento (valores orientativos del orden de los de VDI 2230), la app reduce la precarga y recomienda arandela de acero endurecido. Si la cabeza apoya sobre otra pieza, cambiá el material para evaluar esa pieza.');

    h3('6. Alcance y límites del modelo');
    li(['Calcula la precarga de montaje; no incluye la carga de servicio, la relación de rigideces ni la fatiga de la unión.',
        'El criterio del porcentaje de Sp tiene en cuenta de forma aproximada la torsión residual del apriete; VDI 2230 la trata con una tensión equivalente.',
        'No considera la pérdida de precarga por asentamiento (5 % a 10 % típico), temperatura ni fluencia lenta, salvo la advertencia en plásticos.',
        'Para tornillos de más de 39 mm, uniones críticas o de seguridad, usar VDI 2230 completo y ensayos sobre los componentes reales.']);
  }
  Object.assign(Torque.UI, { armarGuia });
})();
