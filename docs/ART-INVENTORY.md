# Inventario gráfico comprobado

Auditoría del contenido de `feat/game-phase-0`, sin regenerar ni modificar los
PNG. Los tamaños se leyeron de los archivos; el atlas está versionado como PNG
real de **32.374 bytes**. La clasificación «adecuado» significa compatible con
el contrato gráfico y preservado, no una certificación estética exhaustiva.

## Recursos del videojuego

| Archivo | Dimensiones reales | Estado | Observación / decisión |
| --- | --- | --- | --- |
| `assets/game/characters/itza/look-01.png` | 192 × 144 | Adecuado | 18 frames 32 × 48, línea de pies estable en y=48 y alfa binaria. Se conserva la identidad. |
| `assets/game/characters/leo/look-01.png` | 192 × 144 | Adecuado | 18 frames 32 × 48, línea de pies estable en y=48 y alfa binaria. Se conserva la identidad. |
| `assets/game/moments/bench-seat-wide.png` | 56 × 40 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/moments/cat-duo-happy.png` | 80 × 64 | Adecuado | Pareja de gatos en una imagen, dibujo a 40 × 32; sin fondo opaco. Conservar escala y rasgos. |
| `assets/game/moments/cat-duo-idle.png` | 80 × 64 | Adecuado | Pareja de gatos en una imagen, dibujo a 40 × 32; sin fondo opaco. Conservar escala y rasgos. |
| `assets/game/moments/pair-bench-sit-sheet.png` | 128 × 48 | Adecuado | 2 frames 64 × 48. Validar el anclaje sobre la banca al usarlo, no estirar. |
| `assets/game/moments/pet-sparkles-sheet.png` | 96 × 16 | Mejorable | 6 celdas 16 × 16; las últimas dos están vacías. El render usa solo las cuatro visibles y respeta la secuencia breve de reacción. |
| `assets/game/objects/awning.png` | 40 × 24 | Defectuoso / reserva | 40 × 24 completamente transparente. No es un toldo visible; no bloquea el juego y no se presenta como arte terminado. |
| `assets/game/objects/bench.png` | 48 × 47 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/book.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/clock.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/final.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/gallery.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/house.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/lamp.png` | 48 × 47 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/letter.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/places.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/playlist.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/rock.png` | 48 × 47 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/roof.png` | 152 × 34 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/tree.png` | 48 × 84 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/tv.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/objects/wardrobe.png` | 144 × 85 | Adecuado | Dimensiones correctas; alfa binaria y contenido visible. Se conserva. |
| `assets/game/wedding/atlas.png` | 720 × 342 | Mejorable | 19 regiones presentes; 58.707 píxeles con alfa intermedia. Normalización en cliente; bordes con tramado heredado. Se conserva, sin afirmar limpieza perfecta. |
| `assets/game/world/ground.png` | 1920 × 1280 | Adecuado | Suelo opaco, 30 colores propios; se conserva. |

El mundo, objetos y personajes originales combinan **156 colores opacos**.
Los cinco PNG de momentos también se validan ahora: antes `art:check` no los
incluía. El atlas recibe una revisión de tamaño, alfa y las 19 regiones.
Los recursos obligatorios ausentes y los frames de personajes vacíos producen
error; los dos atuendos alternativos siguen siendo opcionales.

## Regiones del atlas de boda

Las coordenadas corresponden al PNG original de 720 × 342. Los nombres son
las claves reales usadas por el juego; el contrato está en
`game/wedding-assets.js`.

| Clave | x, y | Ancho × alto | Frames |
| --- | --- | --- | --- |
| castle | 0, 0 | 264 × 154 | 1 |
| itza-walk | 264, 0 | 192 × 144 | 18 de 32 × 48 |
| leo-walk | 456, 0 | 192 × 144 | 18 de 32 × 48 |
| roof | 0, 154 | 280 × 86 | 1 |
| arch | 280, 154 | 64 × 86 | 1 |
| bench | 344, 154 | 68 × 68 | 1 |
| vows | 412, 154 | 256 × 48 | 4 de 64 × 48 |
| idle | 0, 240 | 128 × 48 | 2 de 64 × 48 |
| kiss | 128, 240 | 192 × 48 | 3 de 64 × 48 |
| hug | 320, 240 | 128 × 48 | 2 de 64 × 48 |
| wedding-bench | 448, 240 | 128 × 48 | 2 de 64 × 48 |
| flower | 576, 240 | 32 × 40 | 1 |
| emblem | 608, 240 | 24 × 24 | 1 |
| vines | 632, 240 | 40 × 40 | 1 |
| petalPath | 672, 240 | 48 × 48 | 1 |
| celebrate | 0, 288 | 192 × 48 | 3 de 64 × 48 |
| awning | 192, 288 | 56 × 38 | 1 |
| hearts | 248, 288 | 96 × 16 | 6 de 16 × 16 |
| sparkles | 344, 288 | 96 × 16 | 6 de 16 × 16 |

Los 36 frames de caminar de boda conservan la línea de pies en y=48 tras
normalizar alfa. El cabello/velo de Itza toca y=0 en cinco frames de espalda;
no se modifica la escala para igualar el borde superior con los otros frames.

## Ausencias opcionales y recursos pendientes

No falta ningún archivo obligatorio del juego actual. Estos dos archivos
**no existen** y no se generan en esta revisión:

- `assets/game/characters/leo/look-02.png`
- `assets/game/characters/itza/look-02.png`

El armario los identifica como no disponibles y evita pedirlos al servidor.
Se conservan los identificadores `alternativo` para partidas antiguas; si
no hay imagen se dibuja el original disponible, sin borrar la preferencia
antigua. El original y la ropa de boda sí tienen imágenes reales.

No hace falta generar un toldo nuevo para completar las experiencias: el PNG
transparente `objects/awning.png` es un remanente sin dibujo, mientras que el
atlas ya contiene un toldo de boda real. Si se decide añadir un toldo clásico,
debe conservar exactamente 40 × 24, PNG alfa, una sola imagen frontal y
composición compatible con la puerta de los edificios. Esta decisión artística
es opcional, no una dependencia de navegación o narrativa.

### Prompts para los atuendos opcionales

Se incluyen especificaciones reproducibles, no afirmaciones de generación.
Para ambos: adjuntar la hoja `look-01.png` correspondiente como referencia;
exportar una hoja PNG de **192 × 144 píxeles reales**, sin reescalado final;
**6 columnas × 3 filas**, cada celda **32 × 48**; filas frente, derecha,
espalda; columnas reposo A, reposo B, paso A, paso B, paso C, paso D. Mantener
la línea de pies en y=47 de cada celda y todos los rasgos de identidad.

**Leo — `assets/game/characters/leo/look-02.png`:**

> Crea una hoja de sprites pixel art para el RPG romántico OOWWWW usando la
> hoja original adjunta de Leo como referencia exacta de cara, pelo corto
> oscuro, lentes, tono de piel, silueta y escala. Cambia solamente el atuendo
> a suéter beige cálido, pantalón de mezclilla azul apagado y tenis oscuros.
> Respeta 192×144 píxeles, 18 celdas 32×48 en cuadrícula 6×3: fila 1 de frente,
> fila 2 mirando a la derecha, fila 3 de espalda; columnas 1–2 reposo suave,
> columnas 3–6 ciclo de caminar A–D. Cada cabeza y cada pie alineados a las
> mismas coordenadas de la referencia; nada de cambio de tamaño entre poses.
> Contorno marrón casi negro, sombras de un tono, luz crema, detalle económico.
> Píxeles nítidos, alfa exclusivamente 0/255, fondo transparente real; sin
> tablero pintado, texto, guías, marcos, antialiasing ni píxeles de otra celda.

**Itza — `assets/game/characters/itza/look-02.png`:**

> Crea una hoja de sprites pixel art para el RPG romántico OOWWWW usando la
> hoja original adjunta de Itza como referencia exacta de pelo largo oscuro,
> lentes, cara, pecas si son visibles en la referencia, tono de piel y escala.
> Cambia solamente el atuendo a una blusa rosa empolvado y falda azul apagado,
> zapatos oscuros pequeños, conservando la silueta reconocible de Itza. PNG
> 192×144 píxeles reales, cuadrícula 6×3 de celdas 32×48: frente, derecha,
> espalda; dos reposos y cuatro pasos por fila. Pies en la misma línea y cara
> en el mismo lugar en las 18 poses, movimiento discreto de cabello y manos.
> Contorno marrón oscuro, luz crema y sombra de un tono compatible con la
> referencia. Píxeles nítidos y alfa binaria, fondo transparente real, sin
> tablero, texto, guías, degradados, antialiasing, recortes ni poses faltantes.

Validar dimensiones, cuadrícula y transparencia con `npm run art:check`, y
revisar las 18 poses en el armario y en el mapa antes de dar por válido un PNG.

## Contenido original preservado

El resto de imágenes y fotografías del sitio clásico no se sustituye ni se
somete a la paleta limitada del juego. Inventario de dimensiones reales:

| Archivo | Dimensiones | Estado |
| --- | --- | --- |
| `assets/bg-room.jpg` | 735 × 490 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Barriochino1.jpeg` | 640 × 480 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Barriochino2.jpeg` | 640 × 480 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Cafédegatos.jpeg` | 828 × 1171 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Conocisteamimamá.jpeg` | 590 × 1280 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Dibujitos.jpeg` | 720 × 1560 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Encuentralasdiferencias.jpeg` | 739 × 1600 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Fotorara.jpeg` | 899 × 1599 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Maincraft1.jpeg` | 828 × 375 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Maincraft2.jpeg` | 1600 × 1200 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Primerasalida.jpeg` | 828 × 1289 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/Primerasalida2.jpeg` | 640 × 480 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/bautizo.jpeg` | 1600 × 1200 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/gatos.jpeg` | 1278 × 1280 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/gatos_ojos_abiertos.png` | 1034 × 649 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/gatos_ojos_cerrados.png` | 1034 × 649 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/itza.jpeg` | 739 × 1600 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/libro_sin_fondo.png` | 846 × 667 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/noviapedida.jpeg` | 828 × 1327 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/pareja_beso.png` | 872 × 752 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/pareja_mirandose.png` | 732 × 665 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/pareja_ojos_abiertos.png` | 766 × 665 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/pareja_ojos_cerrados.png` | 766 × 665 | Adecuado como contenido original; conservado sin edición. |
| `assets/images/ray.png` | 373 × 670 | Adecuado como contenido original; conservado sin edición. |

Audio y vídeo existentes se conservan sin incorporar grabaciones nuevas. La
comprobación de derechos no se deduce de la existencia de un archivo; esta
revisión no publica ni despliega el contenido multimedia.
