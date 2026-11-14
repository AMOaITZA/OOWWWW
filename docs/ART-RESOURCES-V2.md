# OOWWWW — recursos visuales V2

Se generaron e integraron **siete PNG reales**, usando las referencias aportadas
por el usuario y los sprites existentes de Leo e Itza. El trabajo se limita a
`feat/game-phase-0`; los primeros conjuntos, el atlas, las fotos, cartas,
recuerdos, frases y grabaciones originales se mantienen sin reemplazarlos.

## Archivos creados

| Recurso | Archivo | Dimensiones reales | Contrato |
| --- | --- | --- | --- |
| Segundo conjunto de Leo | `assets/game/characters/leo/look-02.png` | 192 × 144 | 6 columnas × 3 filas; 18 celdas 32 × 48; reposo A/B y cuatro pasos; frente, derecha y espalda. Sudadera verde salvia, pantalón gris y tenis claros inspirados en la foto del parque. |
| Segundo conjunto de Itza | `assets/game/characters/itza/look-02.png` | 192 × 144 | Mismo contrato; sudadera oscura, jeans azules y gorra negra hacia atrás, conservando pelo largo y lentes. |
| Pareja sentada cotidiana | `assets/game/moments/pair-bench-sit-v2.png` | 160 × 64 | Dos celdas 80 × 64. Pareja y banca incluidas; dos gestos suaves. |
| Castillo completo | `assets/game/wedding/castle-v2.png` | 336 × 224 | Una pieza con torres, tejados, fachada, puerta y escalones; alfa real, sin techo duplicado. |
| Jardín al atardecer | `assets/game/wedding/cinematic-background.png` | 480 × 270 | Fondo 16:9 opaco; arquitectura lejana, terraza, cielo cálido y jardines. No contiene personajes, altar ni UI. |
| Arco floral | `assets/game/wedding/arch-v2.png` | 80 × 96 | Pieza transparente independiente, centro libre; render proporcional 2×. |
| Pareja sentada de boda | `assets/game/wedding/pair-bench-v2.png` | 128 × 48 | Dos celdas 64 × 48; trajes formales, vestido y banca clara con flores. Cierra el sexto capítulo con gesto lento. |

Los dos `look-02.png` ya están habilitados en el armario y durante la exploración.
Se conserva el identificador guardado `alternativo`: las partidas existentes no
necesitan una migración ni pierden preferencias.

## Generación y preparación

Las imágenes se crearon mediante `image_gen.imagegen`, no son dibujos
provisionales por código. La generación tomó los sprites originales como
referencia de caras, pelo, lentes y proporciones; la fotografía del parque
aportó la dirección del segundo vestuario. Para el castillo y jardín se usaron
crema, rosa empolvado, salvia, dorado y contornos cálidos.

Los originales de generación, de mayor resolución, se conservan en la carpeta
de imágenes generadas de la sesión. El repositorio contiene los PNG nativos
utilizados por el juego. [ART-GENERATION.json](ART-GENERATION.json) registra las
huellas SHA-256 de las fuentes y los archivos entregados; no se afirma que las
fuentes de mayor resolución se hayan subido al repositorio.

`scripts/prepare-generated-art.mjs` realiza la preparación solicitada:

1. Divide las hojas por sus celdas y mide el contenido alfa de cada fotograma.
2. Recorta márgenes, aplica escala uniforme y muestreo por vecino más cercano.
3. Centra cada sprite y fija la misma línea de pies, sin estiramientos por eje.
4. Normaliza la transparencia a 0/255 y limita la paleta por recurso.
5. Ajusta los tonos cálidos de piel de los recursos nuevos a la paleta de
   referencia: `#C78768`, `#926759` y `#D3B2A0`.

El script recibe las siete fuentes como argumentos en este orden: fondo, Leo,
Itza, castillo, pareja cotidiana, arco y pareja de boda. Los dos últimos son
opcionales para volver a preparar entregas parciales; no se vuelven a generar
imágenes al ejecutar el script. El informe de preparación se escribe por
omisión en `work/generated-art-build.json`, configurable con `ART_BUILD_LOG`.

## Iluminación y piel

`game/palette.js` levanta tonos concretos de cabello, vestimenta y sombra del
atlas. No usa una aclaración global de la imagen. Los tres RGB originales de
piel permanecen idénticos, al igual que los colores no incluidos en la LUT.
Las pruebas recorren los píxeles reales de las dos hojas originales y los tonos
cálidos del atlas para comprobarlo. Los PNG originales tampoco se modifican:
la iluminación se aplica una vez al cargarlos en canvas.

## Proporciones de las bancas

El recurso antiguo tenía cabezas de aproximadamente 13 px, frente a 26–27 px
en las figuras de pie. La geometría nueva mide alfa y tamaño visible; no toma
el marco transparente de la celda como si fuera el personaje.

La pareja cotidiana nueva ocupa **75 × 59 px visibles por fotograma**, dibujados
a **1×**, dentro de sus celdas 80 × 64. La banca vacía se obtiene de un recorte
real de 39 × 28 a 2×: 78 × 56 visibles. Al sentarse se oculta esa banca vacía,
pues la nueva pose ya incluye su propio asiento. Se conserva la aproximación
y el levantamiento y se alinea el centro de las cabezas en la transición.
La colisión y el área de toque se amplían junto con la representación.

En la boda, la pose sentada tiene dos celdas 64 × 48 y se dibuja a 2×, con pies
y centro comprobados por fotograma, igual que las otras secuencias. El antiguo
recurso `wedding-bench` permanece disponible como respaldo si falla el nuevo.

## Castillo y profundidad

El nuevo archivo tiene margen transparente: su silueta visible es de **256 ×
204**, aproximadamente **1,35×** el ancho visible de la composición anterior.
La llegada pasa de `[105,56]` a `[105,54]`. Se ajustan el camino de contacto,
rosales, pétalos, cámara y colisión; el mapa general usa el mismo encuadre real.
La zona sólida incluye espacio para la pareja, cuyo centro no representa todo
su ancho. Todos los destinos conservan rutas válidas.

El jardín de la ceremonia incluye solamente arquitectura lejana. Se dibujan
encima el arco independiente, la pareja animada y los efectos. No se vuelve a
pintar el castillo del mapa sobre el paisaje. Los seis capítulos conservan sus
textos y controles, con fundidos, movimiento moderado y respeto del movimiento
reducido. La ceremonia no solicita reproducción de audio.

## Límites que permanecen

No falta ninguno de los siete recursos de esta entrega. Las poses originales
heredadas de votos, beso, abrazo y celebración siguen procediendo del atlas:
conservan su tramado de origen y pequeñas diferencias de silueta. Se mejoró su
iluminación y continuidad, sin afirmar que se hayan redibujado todas esas poses.
La reserva clásica `objects/awning.png` sigue siendo transparente y no interviene
en el nuevo castillo. Móvil se revisó con emulación táctil, no en teléfonos físicos.
