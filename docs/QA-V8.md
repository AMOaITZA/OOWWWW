# V8 · apariencia y mundo a pantalla completa

La revisión usa el juego real en Chromium y compara las vistas con las capturas anteriores. No cambia la página clásica ni publica `main`.

## Pantalla y controles

| Vista | Pantalla CSS | Canvas lógico | Escala uniforme | Desbordamiento de página |
| --- | --- | --- | --- | --- |
| Computadora | 1440 × 900 | 480 × 300 | 3× | 0 px |
| Celular vertical | 390 × 844 | 195 × 422 | 2× | 0 px |
| Celular pequeño | 320 × 568 | 160 × 284 | 2× | 0 px |
| Celular horizontal | 844 × 390 | 422 × 195 | 2× | 0 px |
| Tableta | 1024 × 768 | 342 × 256 | 3× | 0 px |

La tableta dibuja 1026 px de ancho y recorta los últimos 2 px para mantener píxeles cuadrados. La cámara muestra otra proporción del mundo al girar el teléfono; los personajes conservan su tamaño y posición en el mapa.

`tests/e2e/quality-v8.spec.js` comprueba que el mundo cubra los cuatro bordes, que ambos ejes usen la misma escala entera y que el canvas conserve el suavizado desactivado. Los botones de ayuda, mapa, música y hora tienen al menos 44 × 44 px y se comprueba que su centro reciba el toque, además de abrir/cerrar las ventanas reales.

La navegación de prueba usa toques reales sobre el canvas, verifica la llegada al mosaico esperado, gira el teléfono y vuelve a caminar sin teletransportar la pareja. Dos casos adicionales sientan a la pareja y verifican que el globo de Leo no se recorte ni se superponga a los controles en vertical y horizontal. También miden los límites opacos de los dos personajes a partir de sus dibujos reales para confirmar que sus cabezas y cuerpos quedan dentro de la pantalla y fuera del HUD. La cámara sigue la pose sentada sin cambiar la posición guardada del punto de llegada.

## Personajes

La matriz del probador contiene **72 vistas reales**: tres conjuntos × cuatro colores × con/sin lentes × frente/lado/espalda. Las pruebas de interfaz recorren esa misma matriz y verifican que las elecciones de Itza se guarden sin modificar el conjunto de Leo. Las pruebas de píxeles de apariencia cubren también los fotogramas de caminata y las poses de banca/boda.

El conjunto alternativo conserva su gorra negra. El cabello bajo ella sigue el color elegido. Quitar los lentes conserva los píxeles del cabello coloreado y los rasgos de la cara fuera de los lentes.

## Validación final

- `npm test`: **159/159 aprobadas**.
- `npm run test:e2e`: **62/62 aprobadas**, Chromium, dos workers. Incluye los ocho casos V8, las trece experiencias en tres tamaños y las regresiones anteriores de movimiento, boda, música, personalización y página clásica.
- `npm run art:check`: **72 PNG**, recursos obligatorios presentes; dimensiones, alfa, anclajes y paletas aprobados.
- `npm run build`: aprobado. Permanecen los avisos heredados de los scripts de la página clásica.
- Versión compilada en Vite preview: armario, tres cambios de apariencia, mapa y rotación aprobados en computadora y celular; **cero errores JavaScript y cero respuestas locales fallidas**. El recorrido transfirió aproximadamente **1,34 MB de recursos**; ningún MP3 se descargó antes de reproducir música.

Se corrigieron dos fallos detectados en la revisión: un canvas que conservaba un tamaño intermedio después de girar el teléfono y las cabezas sentadas demasiado próximas al HUD en horizontal. La prueba de rotación verifica la llegada al destino tras cada toque; las de banca miden los dibujos opacos reales y su separación de los controles.

La captura final produjo las cinco vistas del mundo y la matriz de 72 apariencias sin errores de JavaScript. Las capturas anteriores corresponden a `f8602bb`.

## Evidencia visual

- [Antes: computadora](qa-v8/before-desktop-world.png), [celular](qa-v8/before-phone-world.png) y [apariencia](qa-v8/before-appearance.png).
- [Después: computadora](qa-v8/desktop-world.png), [celular vertical](qa-v8/phone-world.png), [celular pequeño](qa-v8/small-phone-world.png), [horizontal](qa-v8/phone-landscape-world.png) y [tableta](qa-v8/tablet-world.png).
- [Celular de noche](qa-v8/phone-night.png).
- [Diálogo junto a la banca en vertical](qa-v8/phone-speech.png) y [en horizontal](qa-v8/phone-landscape-speech.png).
- [Ayuda en celular](qa-v8/phone-experience.png) y [en horizontal](qa-v8/phone-landscape-experience.png).
- [Matriz de Itza: conjuntos, colores y lentes](qa-v8/itza-all-looks-colors-glasses.png).
- [Todos los fotogramas de caminata con lentes](qa-v8/itza-all-animation-frames-glasses.png) y [sin lentes](qa-v8/itza-all-animation-frames-no-glasses.png).
- [Colores en las poses sentadas](qa-v8/itza-all-seated-frames.png) y [Leo y la ceremonia](qa-v8/leo-and-ceremony-frames.png).
- [Probador completo](qa-v8/wardrobe-desktop.png).
- Versión compilada: [probador en celular](qa-v8/production-phone-wardrobe.png), [computadora](qa-v8/production-desktop-wardrobe.png) y [resultado de la comprobación](qa-v8/production-smoke.json).
- [Medidas de cada captura](qa-v8/metrics.json).

Para regenerar, iniciar Vite y ejecutar `node scripts/capture-quality-v8.mjs`. Se puede cambiar la URL con `ART_CAPTURE_URL` y la carpeta con `ART_CAPTURE_DIR`.

`node scripts/capture-appearance-v8.mjs` genera las hojas de todos los fotogramas.
Para comprobar la versión compilada, ejecutar `npm run build`, iniciar
`npm run preview -- --port 5184` y después `node scripts/verify-production-v8.mjs`.
La URL de preview se puede cambiar con `ART_PREVIEW_URL`. En esta revisión se
utilizó el Chromium del sistema mediante una configuración temporal de Playwright;
la configuración versionada del proyecto conserva su selección habitual.

## Posibles mejoras posteriores

Estas propuestas quedan pendientes de la decisión del usuario:

1. Un joystick discreto y un botón de interacción en celular para complementar los toques sobre el mapa.
2. Transiciones breves al entrar en los lugares y pequeños movimientos ambientales para dar más vida al mundo.
3. Una guía de recuerdos descubiertos con pistas suaves para el rincón secreto, sin revelar sus respuestas.
4. Integrar los audios personales y añadir exportación/importación del progreso para conservarlo al cambiar de dispositivo.

Las pruebas de navegador emulan tamaños y entrada táctil; una pasada en un iPhone y un Android reales permitiría confirmar las barras del navegador, el audio y el rendimiento de esos dispositivos.
