# Torque de apriete de tornillos

Calculadora web para estimar el torque de apriete de un tornillo en un alojamiento: `T = K · D · Fi` (equivalente simplificado de VDI 2230), con verificación al barrido de rosca y a la presión bajo la cabeza, alertas de montaje y resultado en N·m, lbf·ft y kgf·m. Es un sitio estático: no hay servidor, no usa librerías externas ni CDN, y todo corre en el navegador.

**Versión 1.1.0.** Misma funcionalidad que la 1.0.0 (archivo único, guardado en `versiones/`); cambió solo la organización del código y se agregó el aviso de carga fallida.

## Cómo usarlo

- **Desde el disco:** abrir `index.html` con doble clic (la carpeta tiene que estar completa: `css/` y `js/` junto a `index.html`).
- **En GitHub Pages:** `https://<usuario>.github.io/<repositorio>/`

Si falta un archivo, no se aplican los estilos o falla el arranque, aparece un aviso rojo arriba de la pantalla (lo muestra `js/guarda.js`). No uses resultados mientras esté ese aviso.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Marcado de la página y **orden de carga** de los scripts (única fuente de verdad del orden). |
| `css/estilos.css` | Estilos (tema claro y oscuro automáticos). |
| `js/guarda.js` | Aviso de carga fallida. Se carga primero. |
| `js/datos/` | Tablas: roscas (métricas y unificadas), clases de resistencia, materiales del alojamiento, coeficientes K. |
| `js/nucleo/` | Cálculo sin DOM: constantes, formato de números, geometría, validación de la entrada, barrido de rosca, apoyo bajo la cabeza, cálculo principal y alertas. |
| `js/ui/` | Interfaz: ayudas de DOM, formulario, tarjetas, panel de resultados, guía técnica y controlador. |
| `js/arranque.js` | Arranque; se carga último. |
| `versiones/` | `torque-apriete_v1.html`: versión 1.0.0 en un solo archivo. No se modifica. |
| `tests/` | Pruebas (ver abajo). |

Los scripts son clásicos (no módulos ES): comparten el espacio de nombres `Torque` y por eso la app también abre por `file://`. Cada archivo empieza con su ruta y `'use strict'`. Para agregar un módulo: crear el archivo y sumar su `<script src>` en `index.html` en el lugar que corresponda; las pruebas toman el orden desde ahí.

## Pruebas

Requisitos: Node 18 o más nuevo y Python 3 (sin paquetes). La prueba de pantalla necesita además `npm install` (Playwright) y Chromium.

```
node tests/correr_todo.js          # unitarias + contraste con la implementación independiente (unos 15 s)
npm install && npx playwright install chromium
node tests/correr_todo.js --e2e    # suma la prueba de pantalla (file://, http con política de seguridad estricta, aviso de carga)
```

- `tests/unit/test_nucleo.js`: áreas resistentes contra tablas publicadas (ISO 898-1 y ASME B1.1), torques contra valores de tablas de uso común, casos de barrido hechos a mano, 1,1 millones de combinaciones sin NaN, entradas inválidas.
- `tests/ref/`: segunda implementación del modelo en Python, escrita aparte con sus propias tablas, comparada contra el JavaScript en 1.500 casos.
- `tests/e2e/pantalla.js`: interfaz en Chromium (sin errores de consola, sin pedidos externos, entradas inválidas, copiar resumen, aviso del guarda con archivo o estilos faltantes). Deja capturas en `tests/e2e/salida/`.

## Publicar en GitHub Pages

1. Crear un repositorio en GitHub y subir **el contenido de esta carpeta**, de modo que `index.html` quede en la raíz del repositorio. Son 35 archivos: entran en una sola subida del cargador web.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, carpeta `/ (root)` → Save**.
3. Esperar uno o dos minutos; la dirección aparece en la misma pantalla.

## Reglas del proyecto

- `index.html` es el archivo principal y su nombre no cambia. Cada versión nueva lleva una etiqueta de git (`v1.1.0`, `v1.2.0`…); `versiones/` guarda solo los HTML únicos anteriores.
- Una sola fuente de verdad: el orden de carga está en `index.html`; las tablas, en `js/datos/`; las constantes del modelo, en `js/nucleo/constantes.js`. La guía técnica de la pantalla se arma leyendo esas mismas tablas.
- Todo texto que se vuelca en la página entra con `textContent` (no hay `innerHTML` ni estilos o scripts en línea): el sitio funciona con una política de seguridad estricta (`script-src 'self'; style-src 'self'`), y la prueba de pantalla lo verifica.
- Registro de sesiones: `estado.json` (tareas y versión vigente) y `progreso.md`.

## Alcance y límites

- Estima la precarga de montaje. No incluye la carga de servicio, la relación de rigideces de la unión ni la fatiga; tampoco la pérdida de precarga por asentamiento (5 % a 10 % típico), temperatura o fluencia lenta.
- Los coeficientes K son valores típicos de la bibliografía; la dispersión real es de ±25 % o más. En uniones críticas verificar con VDI 2230 completo y ensayos torque-tensión sobre los componentes reales.
- Constantes de criterio de ingeniería, no de una norma, que conviene cotejar con las propias antes de un trabajo real: resistencia al corte de los hilos 0,6·Rm, factor de reparto de carga 0,8, factor de seguridad 1,5 frente al barrido, presiones límite bajo la cabeza (orden de magnitud de las tablas de VDI 2230) y engranes prácticos por material.
- Geometría de rosca con perfil básico (sin tolerancias). Propiedades de clase tabuladas hasta M39 (acero), M24 (inoxidable) y 1-1/2" (SAE); fuera de ese rango la app avisa.
- Precarga referida al proof load Sp (acero) o al Rp0,2 (inoxidable, donde la norma no define Sp).
