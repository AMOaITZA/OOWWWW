# OOWWWW — QA de personajes V3

> Informe histórico. Las correcciones posteriores de ropa, bancas y mundo y
> sus pruebas actuales están en [QA V4](QA-WORLD-V4.md).

Esta entrega responde a la sustitución de todos los personajes anteriores del
look 1 y de boda por el estilo de la pareja sentada nueva elegida por el usuario.
Se trabaja exclusivamente en `feat/game-phase-0`, desde `c781c9c`.

## Entrega comprobada

Se generaron **nueve hojas nuevas**: los dos look 1, los dos conjuntos de caminar
de boda y cinco secuencias de la pareja (reposo/llegada, votos, beso, abrazo y
celebración). Son 72 fotogramas individuales de caminar/reposo y 14 fotogramas
de pareja. Las poses sentadas y el look 2 V2 ya eran la referencia aceptada.

El atlas conserva las decoraciones y reemplaza todas sus regiones de personas.
Las comparaciones RGBA prueban que cada región de personajes contiene el mismo
arte que el PNG nuevo independiente. Se eliminan la banca miniatura anterior,
su ruta de respaldo, los generadores de figuras antiguas y la LUT aplicada al
arte anterior. El historial Git conserva versiones previas; no se reescribe.

Los archivos y contratos están en [Personajes V3](CHARACTERS-V3.md).
[La trazabilidad](CHARACTERS-V3-GENERATION.json) registra las fuentes generadas,
huellas de sustitución, archivos finales y regiones reemplazadas. Las fuentes
de mayor resolución permanecen en la sesión, mientras que el repositorio
contiene todos los PNG nativos que utiliza el juego.

## Ejecución real

| Comando | Resultado |
| --- | --- |
| `npm test` | **73/73 aprobadas**. |
| `npm run art:check` | **Aprobado**, 38 PNG presentes, 0 ausencias, 146 colores del escenario; paletas de personajes comprobadas por separado. |
| `npm run build` | **Aprobado**, con ambas entradas y assets completos. |
| `npm run test:e2e` | **33/33 aprobadas**, Chromium. |

Las pruebas comprueban las seis hojas de caminar de Leo e Itza, las secuencias
de ceremonia, piel de referencia en las caras, pies alineados, márgenes,
alfa binaria, gestos distintos y coincidencia del atlas con los PNG individuales.
También comprueban que las huellas de los personajes retirados ya no aparecen
en las regiones correspondientes.

La navegación real del navegador verifica selección del look 1 y boda de ambos,
tres vistas, animación de caminar visible en canvas, selección independiente y
guardado. Se fuerza además un fallo del atlas: se cargan los siete PNG nuevos
independientes con respuesta 200, sin personajes antiguos de sustitución, y
se recorren los seis capítulos. Se mantienen el recorrido previo de contenidos,
música sin autoplay, bancas, gatos, globos, foco, reapertura y movimiento reducido.

También se abrió el build de producción en móvil con el atlas bloqueado: las
siete hojas individuales respondieron 200 y la ceremonia llegó a «Para recordar»
sin errores JavaScript.

El atlas RGBA nuevo se comprime sin pérdida a **74.594 bytes**, dentro del
presupuesto anterior de 100 KB. El empaquetador utiliza filtro PNG 0 y DEFLATE
normal a nivel 9; esta optimización no cambia píxeles ni transparencia.

Se toman capturas reales de escritorio (1440×1000) y móvil emulado (375×812),
además de los controles existentes en orientación horizontal (812×375).
El proceso de captura terminó sin errores de JavaScript. No se infiere
perfección visual solamente por los resultados de las pruebas.

## Comparación de los conjuntos

| Conjunto | Antes | Después |
| --- | --- | --- |
| Look 1 en escritorio | [Antes](qa-characters-v3/before-look1-desktop.png) | [Después](qa-characters-v3/after-look1-desktop.png) |
| Look 1 en móvil | [Antes](qa-characters-v3/before-look1-mobile.png) | [Después](qa-characters-v3/after-look1-mobile.png) |
| Boda en escritorio | [Antes](qa-characters-v3/before-wedding-look-desktop.png) | [Después](qa-characters-v3/after-wedding-look-desktop.png) |
| Boda en móvil | [Antes](qa-characters-v3/before-wedding-look-mobile.png) | [Después](qa-characters-v3/after-wedding-look-mobile.png) |
| Panel de boda móvil | [Antes](qa-characters-v3/before-ceremony-mobile.png) | [Después](qa-characters-v3/after-ceremony-mobile.png) |

## Los seis capítulos

Las capturas usan movimiento reducido para inspeccionar la pose final relevante
del beso/votos/abrazo, sin depender de un fotograma intermedio del fundido. Las
pruebas de navegador también activan caminatas y reproducción normal.

| Capítulo | Antes, escritorio | Después, escritorio | Después, móvil |
| --- | --- | --- | --- |
| Llegada | [Antes](qa-characters-v3/before-chapter-1-desktop.png) | [Después](qa-characters-v3/after-chapter-1-desktop.png) | [Móvil](qa-characters-v3/after-chapter-1-mobile.png) |
| Votos | [Antes](qa-characters-v3/before-chapter-2-desktop.png) | [Después](qa-characters-v3/after-chapter-2-desktop.png) | [Móvil](qa-characters-v3/after-chapter-2-mobile.png) |
| Beso | [Antes](qa-characters-v3/before-chapter-3-desktop.png) | [Después](qa-characters-v3/after-chapter-3-desktop.png) | [Móvil](qa-characters-v3/after-chapter-3-mobile.png) |
| Abrazo | [Antes](qa-characters-v3/before-chapter-4-desktop.png) | [Después](qa-characters-v3/after-chapter-4-desktop.png) | [Móvil](qa-characters-v3/after-chapter-4-mobile.png) |
| Celebración | [Antes](qa-characters-v3/before-chapter-5-desktop.png) | [Después](qa-characters-v3/after-chapter-5-desktop.png) | [Móvil](qa-characters-v3/after-chapter-5-mobile.png) |
| Recuerdo final | [Antes](qa-characters-v3/before-chapter-6-desktop.png) | [Después](qa-characters-v3/after-chapter-6-desktop.png) | [Móvil](qa-characters-v3/after-chapter-6-mobile.png) |

Para repetirlas, inicia ambas revisiones por separado y ejecuta:

```bash
BASELINE_URL=http://127.0.0.1:5195 node scripts/capture-characters-v3.mjs
```

`ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH` permiten ajustar el
servidor actual, el directorio de salida y el Chromium instalado. La comparación
parte de la misma posición y vestuario, sin retocar ninguna captura.

## Alcance y límites

La unificación cubre todos los recursos activos de personajes del RPG indicados
en esta entrega. No cambia las fotos y las ilustraciones personales del modo
clásico. Se mantienen el mapa, castillo, fondo, historias, frases, música y
partidas. No hay recursos de personajes pendientes.

Las decoraciones heredadas del atlas conservan parte de su alfa intermedia;
no son las animaciones nuevas, que tienen transparencia binaria. El chequeo
informa también de la reserva de toldo clásico vacía. Persisten los avisos de
build de los scripts tradicionales del sitio clásico, sin reescribirlo.
Móvil está emulado y audio automatizado simulado; no se certifican dispositivos
físicos. `main` no se modifica, el PR no se fusiona y no se despliega en Render.
