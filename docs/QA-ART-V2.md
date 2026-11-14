# OOWWWW — comprobación de recursos visuales V2

> **Informe histórico V2.** El look 1 y las animaciones de boda se sustituyeron
> después por [los personajes V3](CHARACTERS-V3.md); su estado y capturas actuales
> están en [QA V3](QA-CHARACTERS-V3.md).

Revisión sobre `feat/game-phase-0` a partir de
`371141632a2617e15ebfbf3f1ad506cdc57a4841`. Se conserva el PR #1 en borrador.
Los siete PNG nuevos están descritos en [Recursos V2](ART-RESOURCES-V2.md).

## Qué se corrigió y se comprobó

- Ambos segundos conjuntos son hojas reales 192 × 144 de 18 fotogramas:
  direcciones distintas, caminata, alineación de pies, transparencia real y
  selección independiente persistente en el armario.
- La iluminación levanta pelo, ropa y sombras concretas sin aclarar piel.
  Se comprueban los píxeles de piel originales y los tonos cálidos del atlas.
- La pareja de banca se recorta por el alfa visible y se representa a 1×,
  evitando el marco transparente y la banca duplicada. Aproximación y
  levantamiento conservan posición guardada y un anclaje facial coherente.
- El castillo completo tiene puerta, escalones y torres en una sola pieza;
  se actualizaron colisión, camino de contacto, área de clic y encuadre. El
  mapa general refleja la cámara real; todos los destinos siguen accesibles.
- La boda utiliza un jardín 480 × 270 sin personajes incluidos. Arco,
  protagonistas y partículas son capas independientes. Las seis escenas
  conservan texto, controles, regreso, reproducción y movimiento reducido.
- El final de boda usa una nueva pose formal sentada de dos fotogramas,
  centrada y con pies alineados al mismo suelo que las otras poses.
- Se conservan originales y respaldos. Ningún PNG original, fotografía, carta,
  recuerdo, frase personal, grabación ni código del sitio clásico fue sustituido.

## Resultados de ejecución

| Comando | Resultado real |
| --- | --- |
| `npm test` | **59/59 aprobadas**. |
| `npm run art:check` | **Aprobado**: 32 PNG, 0 ausencias, 19 regiones originales del atlas y 156 colores del mundo original. |
| `npm run build` | **Aprobado**: ambas entradas y assets estáticos en `dist`. |
| `npm run test:e2e` | **31/31 aprobadas**, Chromium. |

Las e2e incluyen atuendos reales y guardado, mapa, teclado, pantalla táctil,
bancas, gatos, música persistente sin autoplay, globos, experiencias originales,
los seis capítulos, «Sí, quiero», repetición y reapertura. Se revisan pantallas
375 × 812, 812 × 375 y 1440 × 1000, movimiento reducido y la contingencia de
atlas ausente. La prueba de contingencia permite los nuevos archivos instalados
y sigue rechazando solicitudes especulativas a los viejos PNG que no existen.

Se abrió adicionalmente el **build de producción** con Vite preview en pantalla
móvil: fondo ilustrado activo, paso por seis capítulos hasta «Para recordar»,
cierre y retorno al mundo; cero errores de JavaScript y cero fallos de recursos
locales en ese recorrido. Las capturas directas del navegador tampoco registraron
errores de página.

El build conserva los avisos heredados de ocho scripts clásicos sin
`type="module"`; el plugin existente los copia como scripts tradicionales.
No se reescribe el modo clásico. Las limitaciones de sus CDN externos quedan
documentadas en [la revisión anterior](QA-POLISH.md). La reproducción de audio
se simula en las e2e y móvil se emula: no se certifican altavoces ni dispositivos
físicos.

## Capturas reales antes y después

La versión anterior se sirvió desde el commit base en otro puerto; la nueva,
desde el árbol de trabajo. Las imágenes son capturas directas, sin retoque.
Se eligieron posiciones de llegada equivalentes: el nuevo acceso al castillo
está más cerca y utiliza un encuadre elevado para mostrar el edificio completo.

| Escena | Antes | Después |
| --- | --- | --- |
| Castillo, escritorio | [Antes](qa-art/before-castle-desktop.png) | [Después](qa-art/after-castle-desktop.png) |
| Castillo, móvil | [Antes](qa-art/before-castle-mobile.png) | [Después](qa-art/after-castle-mobile.png) |
| Banca, escritorio | [Antes](qa-art/before-bench-desktop.png) | [Después](qa-art/after-bench-desktop.png) |
| Banca, móvil | [Antes](qa-art/before-bench-mobile.png) | [Después](qa-art/after-bench-mobile.png) |
| Boda, escritorio | [Antes](qa-art/before-wedding-desktop.png) | [Después](qa-art/after-wedding-desktop.png) |
| Boda, móvil | [Antes](qa-art/before-wedding-mobile.png) | [Después](qa-art/after-wedding-mobile.png) |

Otros usos reales de los recursos:

- [Ambos segundos conjuntos en el mundo](qa-art/after-alternates-desktop.png).
- [Armario con tres conjuntos reales](qa-art/after-wardrobe-desktop.png).
- [Armario en móvil](qa-art/after-wardrobe-mobile.png).

Se revisaron además las seis escenas en escritorio y móvil:

| Capítulo | Escritorio | Móvil |
| --- | --- | --- |
| Llegada | [Captura](qa-art/chapter-1-desktop.png) | [Captura](qa-art/chapter-1-mobile.png) |
| Votos | [Captura](qa-art/chapter-2-desktop.png) | [Captura](qa-art/chapter-2-mobile.png) |
| Gran sí | [Captura](qa-art/chapter-3-desktop.png) | [Captura](qa-art/chapter-3-mobile.png) |
| Abrazo | [Captura](qa-art/chapter-4-desktop.png) | [Captura](qa-art/chapter-4-mobile.png) |
| Celebración | [Captura](qa-art/chapter-5-desktop.png) | [Captura](qa-art/chapter-5-mobile.png) |
| Recuerdo final | [Captura](qa-art/chapter-6-desktop.png) | [Captura](qa-art/chapter-6-mobile.png) |

Para repetir capturas, inicia Vite y ejecuta `node scripts/capture-art.mjs`.
`ART_CAPTURE_URL`, `BASELINE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH` permiten
seleccionar servidor, comparación, destino y Chromium local. La configuración
por omisión usa el navegador de Playwright y `docs/qa-art` como salida.

## Límites reales

No hay recursos nuevos faltantes: los siete archivos ya existen, se validan y
se cargan. Las poses heredadas de votos/beso/abrazo/celebración conservan parte
del tramado y las pequeñas diferencias anatómicas del atlas original. Se mejoró
su iluminación y presentación, sin afirmar una regeneración completa de esas
secuencias. El toldo clásico transparente sigue siendo una reserva heredada.
No se declara perfección artística solamente porque las pruebas sean verdes.

No se modificó `main`, no se fusionó el PR y no se desplegó en Render.
