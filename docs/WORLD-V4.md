# OOWWWW — vestuario, bancas y arquitectura V4

Esta revisión corrige el vestuario principal según la descripción del usuario,
la banca demasiado grande y la pérdida del atuendo al sentarse. Además, da a
los diez destinos ordinarios edificios distintos y renueva el terreno del mundo.
Los lugares, los contenidos personales, el castillo y la ceremonia se mantienen.

## Vestuario principal

- **Itza:** chamarra de cuero negra y pantalón largo de mezclilla azul. Conserva
  pelo largo, lentes y los tonos de piel de referencia.
- **Leo:** chamarra roja tipo rompevientos con una franja color hueso continua
  por el exterior de cada manga, del hombro a la muñeca; pantalón negro y tenis
  blancos. Conserva el peinado, lentes y tonos de piel.

Las hojas permanecen en `assets/game/characters/{leo,itza}/look-01.png`, a
192 × 144, con 18 fotogramas de 32 × 48 y las mismas direcciones y claves de
partida. Los otros conjuntos y las animaciones de boda no se sustituyen.

## Bancas con atuendos independientes

La banca del mundo ya no usa una ilustración conjunta con ropa fija del look 1.
Cada personaje tiene tres hojas sentadas independientes:

`assets/game/moments/seated/{leo,itza}-{principal,alternativo,boda}.png`

Cada archivo tiene dos celdas de 32 × 48 en una hoja de 64 × 48. No contiene una
banca: se dibuja el asiento por separado y encima las dos figuras. Así se puede
sentar cualquier combinación de atuendos, incluidos Leo con sudadera verde e
Itza de novia, sin que una selección reemplace la de la otra persona.

El renderer consulta el atuendo actual al dibujar y usa la pose correspondiente;
no cambia los identificadores guardados. Se elimina el PNG antiguo
`pair-bench-sit-v2.png` y su entrada del manifiesto, que fijaban la ropa de la
pareja en las bancas del mapa. La pose
formal de la ceremonia es independiente y sigue usando ropa de boda en su
contexto narrativo.

`bench-seat-v4.png` ocupa una celda nativa de 56 × 32. La geometría recorta su
alfa real y no la estira al tamaño anterior de 78 × 56. Las figuras sentadas se
representan a su tamaño nativo; asiento, pies, burbuja, zona de toque y colisión
se revisan junto con la transición de sentarse y levantarse.

## Arquitecturas de los destinos

Los recursos completos se encuentran en `assets/game/architecture/`, todos con
celdas de 160 × 128 y transparencia real. Cada edificio incluye su propio techo,
fachada, puerta y escalones; no se superpone el tejado genérico anterior.

| Destino | Dirección de arquitectura |
| --- | --- |
| Inicio | Casita acogedora de piedra crema, tejado rosado y flores. |
| Carta | Pequeña oficina de correos de ladrillo, toldo y buzón. |
| Galería | Galería-invernadero de vidrio con ventanales y vegetación. |
| Razones | Librería de madera con escaparates y tejado verde. |
| Playlist | Café musical con toldo y un detalle de disco. |
| Recuerdos | Cine pequeño con fachada art déco y marquesina de estrella. |
| Contador | Pabellón con torre de reloj. |
| Lugares | Gazebo de viaje con tablero de mapa. |
| Final | Capilla/jardín romántico con ventana ornamental y flores. |
| Armario | Boutique con madera, cortinas y escaparates de ropa. |

Se mantienen los puntos de llegada y los destinos originales. El encuadre se
ajusta al acercarse para mostrar el edificio y la pareja; las zonas de clic y
colisiones acompañan a las siluetas completas, sin crear nuevos lugares.

## Terreno

`assets/game/world/ground-v4.png` es una capa opaca de 1920 × 1280. Mantiene la
organización de los caminos principales y usa piedra clara, bordes suaves,
vegetación y flores pequeñas con una paleta cálida. Las construcciones siguen
siendo sprites separados: el terreno no incluye casas ni personajes duplicados.

## Comprobaciones de esta revisión

El chequeo de arte incluye las seis hojas sentadas, la nueva banca, las diez
arquitecturas y el terreno. Comprueba dimensiones, alfa, contenido visible,
cuadrículas y presupuesto de color. Las pruebas de recursos exigen fachadas
visualmente distintas y atuendos sentados separados por personaje.

Las pruebas de navegador observan las llamadas reales a `drawImage` del canvas
para verificar las nueve combinaciones de vestuario, tamaños del banco y de las
figuras, guardado y entrada táctil. También comprueban la carga y el dibujo de
los diez edificios completos y que no se pinte el tejado genérico sobre ellos.
Los conteos de ejecución y las capturas finales se recogen en el
[informe de QA](QA-WORLD-V4.md) del conjunto integrado.

La validación específica de V4 aprobó las 31 pruebas de recursos y las 11
pruebas de navegador, incluidas las nueve combinaciones de atuendos. El chequeo
de arte encontró 53 PNG y ninguna ausencia; la paleta del escenario tiene 185
colores, dentro del límite original de 192. El tamaño del banco se compara con
las figuras caminando dibujadas en el canvas: ancho máximo de 1,75 figuras y
altura inferior a tres cuartos de una figura.
