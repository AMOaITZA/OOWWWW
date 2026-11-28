# QA V11: sonidos, secretos, rostros y nuestra casita

La suite completa pasó **89 de 89 pruebas de navegador** en Chromium, incluidas
las **6 de 6 pruebas de integración específicas de V11**. También aprobaron
las **207 pruebas unitarias**, la revisión de **84 PNG** (dimensiones, alfa,
anclajes y paletas) y `npm run build` sin el video temporal de comprobación.
Las capturas finales no registraron errores de JavaScript ni respuestas fallidas
de recursos locales: [resultado de las capturas](qa-magic-v11/after-result.json).
La comprobación se hizo en escritorio y con dispositivos móviles emulados; no
equivale a una prueba en teléfonos físicos.

## Flujos comprobados

| Flujo | Comprobación |
| --- | --- |
| Pisadas y gatos | Caminar con el teclado y acariciar un gato crean fuentes reales de Web Audio. El silencio impide nuevos efectos; el volumen y la preferencia sobreviven a una recarga. |
| Agua y grillos | Junto al lago por la noche hay dos bucles, que se detienen al abrir una ventana y al recibir `visibilitychange` con la página oculta. Al volver se reanudan dos, sin acumular capas. La ocultación se simuló mediante la propiedad y el evento del navegador. |
| Tres secretos | Se recorren las rutas reales del mapa hasta los dos cofres y la carta, se abren con `E`, aparecen sus mensajes y avanza la colección de 1/3 a 3/3. Los tres hallazgos permanecen tras recargar. |
| Casita en móvil | Comer y ver la tele conservan el pelo rubio y los lentes quitados. La escena cabe en el área visible al girar a 844 × 390. Sin archivo instalado, la tele no solicita videos, no llama a `play()` y muestra su estado de espera. |
| Estrella fugaz | El efecto aparece brevemente en el reloj nocturno; no aparece de día ni con movimiento reducido. Las capturas congelan el reloj durante el cuadro activo para no perder un efecto tan breve. |
| Cuerpo sentado | El compuesto real de Itza con conjunto alternativo, pelo rosa y sin lentes tiene un torso opaco y oscuro bajo el cabello al ver la tele. Se comprueba el actor antes de pintarlo sobre el cuarto, para que el fondo no oculte un agujero. |

Estas pruebas están en [magic-v11.spec.js](../tests/e2e/magic-v11.spec.js).
La instrumentación de sonido observa `AudioBufferSourceNode.start()` y los
bucles activos; no sustituye una valoración auditiva con altavoces o auriculares.

La integración también permitió corregir tres defectos concretos: las pisadas
perdían su distancia acumulada al terminar cada casilla de teclado, el borde del
minimapa desplazaba la casilla elegida y el torso de Itza con gorra dejaba ver el
cojín por una franja transparente al sentarse frente a la tele.

## Comparación visual

La referencia «antes» se capturó con el código original `10a9408`. Las imágenes
«después» muestran el juego integrado. La revisión visual incluyó los rostros
nativos ampliados, el apoyo de los cuerpos en las sillas y el sofá, las ventanas
de hallazgos, el panel de sonido y las sombras de día y noche.

| Vista | Antes | Después |
| --- | --- | --- |
| Rostros con y sin lentes, todos los conjuntos y colores | [Matriz original](qa-magic-v11/before-faces-all-looks.png) | [Matriz corregida](qa-magic-v11/after-faces-all-looks.png) |
| Comer juntos, escritorio | [Antes](qa-magic-v11/before-home-eat-desktop.png) | [Después](qa-magic-v11/after-home-eat-desktop.png) |
| Ver la tele, escritorio | [Antes](qa-magic-v11/before-home-tv-desktop.png) | [Después](qa-magic-v11/after-home-tv-desktop.png) |
| Comer juntos, móvil | [Antes](qa-magic-v11/before-home-eat-phone.png) | [Después](qa-magic-v11/after-home-eat-phone.png) |
| Ver la tele, móvil | [Antes](qa-magic-v11/before-home-tv-phone.png) | [Después](qa-magic-v11/after-home-tv-phone.png) |
| Ver la tele, móvil horizontal | [Antes](qa-magic-v11/before-home-tv-landscape.png) | [Después](qa-magic-v11/after-home-tv-landscape.png) |

La matriz frontal compara el arte de caminata y las animaciones de banca. Las
poses nuevas de la casita se revisan por separado con sus cuerpos completos:
[Itza personalizada](qa-magic-v11/itza-all-personalized-seated-v11.png) y
[Leo personalizado](qa-magic-v11/leo-all-personalized-seated-v11.png).
En el conjunto alternativo de Itza la parte negra de arriba es su gorra; el
cabello inferior sí cambia de color.

Más evidencia:

- Hallazgos: [cofre del cerezo](qa-magic-v11/after-finding-cofre-cerezo.png),
  [cofre de la luna](qa-magic-v11/after-finding-cofre-luna.png) y
  [carta del bosque](qa-magic-v11/after-finding-carta-bosque.png).
- Sombras: [día](qa-magic-v11/after-structure-shadows-day.png) y
  [noche](qa-magic-v11/after-structure-shadows-night.png).
- Sonido: [controles en móvil](qa-magic-v11/after-sound-controls-phone.png).
- Estrella fugaz: [mundo completo](qa-magic-v11/after-shooting-star.png) y
  [detalle del cuadro activo](qa-magic-v11/after-shooting-star-detail.png).

## Video real en la pantalla de la tele

Además del estado vacío, se instaló temporalmente un MP4 real de prueba y se
comprobó la reproducción tanto con Vite como con la compilación de producción.
Se pintaron 40 cuadros de video en el lienzo del cuarto y sus píxeles cambiaron.
Se verificaron el inicio manual, la posición guardada, volumen 37 %, silencio y
la liberación del video al cambiar de actividad o cerrar. Ambos recorridos
terminaron sin errores ni recursos fallidos, y el archivo temporal fue retirado.

- [Resultado con Vite](qa-home-video-v11/result.json) y
  [captura del video dentro de la tele](qa-home-video-v11/video-in-the-tv.png).
- [Resultado de producción](qa-home-video-v11/production/result.json) y
  [captura de producción](qa-home-video-v11/production/video-in-the-tv.png).

El video personal se añadirá como
`assets/game/home/videos/nuestro-video.mp4`; después hay que reiniciar Vite o
volver a compilar. En la casita se inicia con **Ver la tele → Reproducir video**.
El formato recomendado es H.264/AAC. Los detalles y la alternativa WebM están
en [HOME-VIDEO.md](HOME-VIDEO.md). El repositorio no incluye un video personal
ni conserva el archivo temporal usado para esta prueba.

La comprobación de producción se puede repetir con
`HOME_VIDEO_BUILD=1 node scripts/verify-home-video-v11.mjs` y FFmpeg instalado.
El script crea su propio clip temporal, compila, comprueba el reproductor,
retira el clip y vuelve a compilar. Si ya existe un video personal en alguna
de las dos rutas admitidas, se detiene antes de escribir archivos.

## Repetir la comprobación

Con las dependencias y Chromium de Playwright instalados:

```sh
npm run test:e2e -- magic-v11.spec.js --workers=1
npm run dev -- --host 0.0.0.0
```

Con el servidor de desarrollo ya activo, en otra terminal:

```sh
node scripts/capture-magic-v11.mjs
```

El capturador admite `ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y
`ART_CHROMIUM_PATH` para elegir servidor, carpeta y ejecutable. En este entorno
se utilizó Chromium de sistema en `/usr/bin/chromium` y la configuración local
de Playwright apuntó a ese mismo ejecutable.

Para repetir el «antes», hay que servir un checkout independiente de `10a9408`
con Vite. Desde el checkout actual se ejecuta el capturador con
`ART_CAPTURE_PHASE=before` y `ART_CAPTURE_URL` apuntando expresamente a ese
servidor original. El modo «antes» exige esa URL y carga los módulos `/game/`
del servidor indicado; no depende de copias temporales de código. No se debe
etiquetar como referencia original una captura del servidor actual.
