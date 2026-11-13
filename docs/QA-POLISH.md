# Revisión técnica y artística de OOWWWW

Trabajo sobre `feat/game-phase-0`, partiendo de
`d350f4f24c5951cef34da7a0ca5fe58129ca6486`, para el PR #1.
`main` sigue en `57cc5955b0b0ac6a3d3678a690d184b5831758c5`.
No se fusiona ni se despliega esta revisión.

## Diagnóstico y correcciones

| Problema comprobado | Solución |
| --- | --- |
| Coronación duplicaba las torres de la fachada | Composición común: fachada inferior y coronación recortada por su contenido real, respetando proporción. |
| Arco, flores, bancas y lámparas deformados | Escala proporcional; lámpara 2× uniforme; bancas del mundo a tamaño nativo. |
| Variación de escala y repetición brusca del beso/abrazo | Pareja de ceremonia a 2×, anclajes de pies/centro por frame y pose final sostenida. |
| Repetir conservaba el tiempo de reproducción continua | Reinicio de escena y temporizador; pausa coherente y suspensión en pestaña oculta. |
| Paso instantáneo desde la llegada a la pose sentada | Aproximación/levantamiento de 0,38 s, sin modificar la posición lógica guardada. |
| Árbol ocultaba a Itza al llegar al castillo | Árbol trasladado de [107,58] a [113,58]. |
| Destellos de gatos incluían dos frames vacíos | Se usan los cuatro visibles, con anticipación y retorno al reposo. |
| Globo podía salir del juego | Límites del canvas, tamaño adaptado y punta orientada hacia Leo; obstáculos de pareja, gatos, bancas y estado. |
| Rerutas durante un paso podían cortar esquinas | Reunir la ruta con el centro de la casilla antes de girar. |
| El armario intentaba pedir los dos PNG opcionales ausentes | Inventario estático de hojas instaladas; botones deshabilitados, conteo real y original como respaldo de partidas antiguas. |
| Foco escapaba a controles ocultos; flechas del volumen movían el mundo | Fondo inerte, foco circular y restaurado, Escape; entradas/formularios protegidos. |
| Reproductor tapaba paneles móviles | Minimización temporal sin desmontar ni reiniciar el audio; restauración al salir. |
| Encabezado de experiencia heredaba 25 px | Jerarquía tipográfica específica, objetivos táctiles de 44 px y controles de boda en dos columnas en móvil. |
| Tipografía del juego dependía de Google Fonts | Mismas familias servidas localmente; licencias SIL OFL incluidas. |
| El borde alteraba la proporción visual del canvas de boda | Proporción intrínseca del lienzo comprobada en escritorio, vertical y horizontal. |

El sitio clásico, cartas, 104 razones, ocho fotos y sus textos, 21 recuerdos,
catálogo musical y claves de guardado se conservan. Ningún PNG de arte original
ha sido editado o regenerado. No se incorporó audio nuevo.

## Resultados reales

Entorno Linux, Node y Chromium de Playwright; dependencias instaladas con
`npm ci`. La caché y el navegador se instalaron dentro del workspace:
`PLAYWRIGHT_BROWSERS_PATH=/workspace/work/pw-browsers`.

| Comando | Resultado |
| --- | --- |
| `npm test` | **40/40 aprobadas**. Contenido, rutas, colisiones, llegada, animación, alfa/anclajes de los frames reales, recursos y partidas. |
| `npm run art:check` | **Aprobado**: 25 PNG existentes, 19 regiones del atlas, 156 colores del mundo; dos atuendos opcionales ausentes informados. |
| `npm run build` | **Aprobado**. Vite genera ambas entradas y conserva los assets estáticos. |
| `npm run test:e2e` | **31/31 aprobadas** en Chromium. |

Las e2e comprueban entrada, navegación sin teletransporte, experiencias originales,
armario real, música sin autoplay, ambos atuendos de boda, bancas, gatos, globo,
control de foco, teclas de volumen, seis capítulos, «Sí, quiero», repetición,
reproducción continua, regreso y reapertura. También comprueban modo de
movimiento reducido, ausencia deliberada del atlas con respaldo identificado,
texto largo en pantalla táctil y proporción/overflow en **375×812, 812×375 y
1440×1000**. No se sustituyen las hojas de personajes por imágenes sintéticas.

Revisión adicional de `vite preview`: `/game.html` abre, carga sus tres familias
locales y muestra ayuda sin errores propios ni recursos locales fallidos. `/`
conserva sus secciones. Vite sigue avisando de ocho scripts clásicos sin
`type="module"`; se copian como scripts tradicionales por el plugin existente.
La verificación visual completa del modo clásico tiene un límite: el Chromium
del entorno rechazó certificados de sus CDN externos y el arranque clásico
informó `gsap is not defined`. Es una dependencia externa heredada; `index.html`,
`js/` y `css/` no se modificaron. No se afirma una prueba completa de sus
animaciones ni de servicios externos (Spotify/GIF).

Las pruebas de música automatizadas simulan reproducción para verificar estado,
continuidad y consentimiento; no certifican el sonido de cada MP3 ni prueban
altavoces físicos. La revisión móvil es con emulación táctil, no un teléfono real.

## Comparación visual

Capturas PNG directas de Chromium, sin retoque. La versión inicial se sirvió
por separado desde el commit base; la final usa también las fuentes locales,
por eso hay una diferencia tipográfica intencional donde la inicial dependía
una descarga externa que falló en este entorno. Las frases espontáneas y el
fotograma capturado pueden variar.

| Escena | Antes | Después |
| --- | --- | --- |
| Boda en escritorio | [Antes](qa/before-wedding-desktop.png) | [Después](qa/after-wedding-desktop.png) |
| Boda en móvil | [Antes](qa/before-wedding-mobile.png) | [Después](qa/after-wedding-mobile.png) |
| Llegada al castillo | [Antes](qa/before-castle-desktop.png) | [Después](qa/after-castle-desktop.png) |
| Castillo en móvil | [Antes](qa/before-castle-mobile.png) | [Después](qa/after-castle-mobile.png) |
| Banca | [Antes](qa/before-bench-desktop.png) | [Después](qa/after-bench-desktop.png) |
| Banca en móvil | [Antes](qa/before-bench-mobile.png) | [Después](qa/after-bench-mobile.png) |
| Gatos | [Antes](qa/before-cats-desktop.png) | [Después](qa/after-cats-desktop.png) |
| Gatos en móvil | [Antes](qa/before-cats-mobile.png) | [Después](qa/after-cats-mobile.png) |

Se revisaron además los seis capítulos de boda en capturas de canvas: llegada,
votos, beso, abrazo, celebración y final. Se comprueba composición y continuidad,
no se declara perfección artística por el resultado de las pruebas.

## Límites artísticos pendientes

- El atlas de boda sigue teniendo tramado derivado de JPEG y 58.707 píxeles de
  alfa intermedia; el render aplica umbral 128. Persiste una diferencia de
  densidad de detalle respecto al mapa original y pequeñas diferencias de
  silueta entre poses. Requeriría retoque artístico de origen para uniformarlo.
- Los dos `look-02.png` son opcionales y no existen. Hay especificaciones y
  prompts exactos en [el inventario](ART-INVENTORY.md); ningún recurso obligatorio
  está pendiente y no se afirma haber generado esos conjuntos.
- `objects/awning.png` es una reserva transparente heredada, documentada como
  defectuosa. No se presenta como toldo terminado ni impide una experiencia.
- La pose sentada es una ilustración compartida ya existente, con su vestuario
  dibujado; no se ha creado una variante de banca para cada atuendo.
