# OOWWWW — juego RPG (beta)

El sitio clásico permanece en `/` y el videojuego en `/game.html`.
El desarrollo está en la rama `feat/game-phase-0`, asociada al Pull Request
n.º 1. No se fusiona con `main` sin aprobación explícita.

## Características actuales

- En el lago, Itza lanza y recoge la caña con las manos visibles. En Hawái,
  los mechones siguen sus hombros y su cabeza durante las ocho poses del baile.
- En la cocina se preparan macarrones con queso, crema de calabaza y pastel
  de fresa. Al servir puedes llevar los dos platos al comedor. En **Semillas**
  también hay lirios, rosas rosas y peonías para el jardín y la casita.
  [Guía y capturas de esta actualización](../docs/DETALLES-V16.md).
- **Actividades V15**: cocina y huerto en **Nuestra casita → Más en casa**,
  tres islas con regalos en **Muelle de los viajes → Pasear en barca**, y
  una **Canon digital retro negra** para tomar fotos y abrir el álbum desde
  el mundo y las actividades. Las flores del huerto decoran la casita.
  Guía y detalles en [ACTIVITIES-V15.md](../docs/ACTIVITIES-V15.md).
- Mundo de 120 × 112 casillas (16 píxeles por casilla), con costa y mar al sur, cámara adaptable a la pantalla,
  paseo por teclado, ratón y pantalla táctil, con búsqueda de rutas A*.
- Catorce lugares: las nueve experiencias clásicas, armario, **Castillo de nuestra boda**,
  **Nuestro rinconcito secreto**, **La grabadora de Leo** y **Nuestra casita**.
  Además, gatitos, bancas, pesca, tesoros y los accesos al mirador y a Hawái.
  El rincón secreto aparece en el mapa después de visitarlo por primera vez.
- Itza y Leo conservan sus atuendos seleccionados y la posición guardada.
  El armario conserva tres identificadores: original, alternativa y boda.
  Los tres conjuntos ya tienen recursos reales y están disponibles para ambos
  personajes. Los segundos conjuntos se guardan con el mismo id `alternativo`.
- El look 1 de Itza lleva chamarra de cuero negra y mezclilla azul. Leo lleva
  rompevientos rojo con franja hueso del hombro a la muñeca, pantalón negro y
  tenis blancos. Las bancas conservan por separado la ropa de cada personaje.
- Los diez destinos ordinarios tienen arquitectura propia: casa, correo,
  galería-invernadero, librería, café musical, cine, reloj, gazebo, capilla y
  boutique. El terreno tiene caminos claros, flores y senderos de piedra.
- Globo de frases de Leo que se recoloca para no tapar la pareja ni los gatos.
- Reproductor de audio local persistente, controles y catálogo de canciones.

## El castillo de boda

Está en `game/data/places.json` como `boda`, situado en [105, 51]
con acceso por [105, 54]. La entrada es transitable y se comprueba
automáticamente desde el punto de inicio.

Selecciona **Castillo de nuestra boda** en el mapa y camina hasta él;
cuando lleguen, toca de nuevo el edificio para entrar.
También es posible caminar y pulsar sobre la fachada.

La experiencia `game/experiences/boda.js` incluye seis capítulos:
llegada, votos, el gran sí, abrazo, celebración y recuerdo final.
Las imágenes de cada capítulo son sprites de la pareja con animación.
Puedes avanzar/retroceder, repetir la escena, pulsar **Sí, quiero**
durante los votos o elegir **Reproducir historia** para avanzar
automáticamente por todos los capítulos. La música seleccionada antes
permanece en el reproductor existente, sin empezar a reproducir
automáticamente.

### Recursos gráficos

El atlas de boda conserva 19 regiones de decoración y personajes actualizados:

`assets/game/wedding/atlas.png` — **720 × 342 píxeles**, aproximadamente
73 KB. El archivo ya está versionado; **no hay que descargar ni ensamblar
partes adicionales**. El juego recorta las regiones en
`game/wedding-assets.js`, convierte bordes a alfa 0/255 y las renderiza
sin suavizado.

El atlas reúne los dos trajes de caminar (192 × 144 por personaje);
cinco secuencias de ceremonia; celebración reconstruida sin el
artefacto original; poses de banca; fachada del castillo, techo
reconstruido, arco, flores, emblema, banco, toldo, enredaderas,
camino de pétalos, corazones y destellos. Los recursos originales se
procesaron desde las imágenes del usuario sin modificar el modo clásico.
La revisión V3 reemplaza todas las regiones de personajes de ese atlas por
el mismo estilo de las nuevas poses sentadas y añade siete hojas individuales
para carga de contingencia. No se conserva arte anterior de personajes como respaldo.

## Probar en Windows / VS Code

```powershell
git switch feat/game-phase-0
git pull --ff-only origin feat/game-phase-0
npm install
npm run dev
```

Abre `http://localhost:5173/game.html`.

Para comprobar la compilación y el funcionamiento:

```powershell
npm test
npm run art:check
npm run build
npm run test:e2e
```

Las pruebas de boda validan que el atlas existe y contiene las 19
regiones; comprueban el techo, las poses de celebración, la colisión
del castillo, la ruta desde el inicio, los botones de la ceremonia y
que Vite realmente sirve el PNG. Las imágenes base del mundo tienen
un presupuesto gráfico validado de hasta 192 colores combinados.

### Despliegue

Para el sitio estático en Render, el comando de construcción es
`npm install && npm run build`; el directorio publicado es `dist`.
Este trabajo **no despliega** ni modifica la rama `main`.

**Derechos de audio:** la carpeta `assets/game/audio` contiene
grabaciones comerciales aportadas por el usuario. No se deben
distribuir públicamente mediante GitHub/Render sin autorización de
los titulares. La ceremonia no agrega grabaciones ni reproduce música
sin interacción del visitante.


## Revisión de continuidad visual e interacción

- El castillo del mapa usa ahora una ilustración completa de 336 × 224;
  su silueta visible es aproximadamente 1,35 veces más ancha. La cámara se
  eleva al acercarse para encuadrar las torres y la pareja. La boda usa un
  jardín ilustrado independiente, sin duplicar esa fachada sobre el fondo.
- Las poses de boda comparten escala 2× y anclaje de pies/centro medido por
  frame. Votos, beso y abrazo terminan en una pose sostenida. Hay fundido
  entre capítulos, repetición completa y respeto de movimiento reducido.
- Las bancas incorporan aproximación y levantamiento de 0,38 s. El asiento de
  52 píxeles visibles y las figuras se dibujan a 1×. Cada personaje tiene tres
  hojas sentadas de 64 × 48: las nueve combinaciones conservan la ropa elegida.
  Las cabezas tienen una escala comparable a la de pie. Los gatos
  tienen anticipación, reacción y cuatro frames visibles de destellos.
- Los globos permanecen en el área del juego y conservan las frases originales.
  Los cambios de ruta a mitad de paso regresan al centro de la casilla.
- Pulsa **E** cerca de una entrada para abrirla, además del clic/toque habitual.
  Las flechas de los controles de volumen/progreso no mueven a la pareja.
- Los diálogos contienen el foco, admiten Escape, restauran el control anterior
  y reinician el scroll. El reproductor se minimiza temporalmente durante
  una experiencia y vuelve al cerrar; el audio sigue montado y nunca se inicia
  al entrar al mundo.
- Press Start 2P, Silkscreen (400/700) y VT323 se sirven localmente desde
  `assets/game/fonts/`, con sus licencias SIL OFL. El juego ya no depende de
  Google Fonts para mostrar su tipografía. El modo clásico conserva su código.

Consulta la [guía visual](../docs/ART-DIRECTION.md), el
[inventario y prompts](../docs/ART-INVENTORY.md) y el
[informe de pruebas y capturas](../docs/QA-POLISH.md).


## Recursos visuales V2

Se crearon e integraron siete PNG: dos hojas de segundos conjuntos, pareja
sentada cotidiana, pareja sentada de boda, castillo completo, arco floral y
fondo cinematográfico. Los originales y el sitio clásico siguen presentes.
Los personajes V3 traen la iluminación integrada en su arte. La paleta de piel
de referencia se mantiene y se comprueba en las caras de los fotogramas reales.

- [Inventario V2 y proceso de generación](../docs/ART-RESOURCES-V2.md)
- [Pruebas y comparación visual V2](../docs/QA-ART-V2.md)
- `npm run art:check` valida dimensiones, cuadrículas, alfa y recursos instalados.
- `node scripts/capture-art.mjs` toma capturas reales con Vite ya en ejecución.
  Usa `BASELINE_URL` para comparar una revisión anterior servida por separado.


## Personajes V3: estilo unificado

En V3, el look 1 de ambos, los trajes de caminar de boda y las secuencias de llegada,
votos, beso, abrazo y celebración se generaron de nuevo siguiendo la pareja
sentada de boda que se tomó como referencia. El look 2 mantiene ese estilo.
Se retiró la banca pequeña anterior y los
personajes provisionales dibujados por código.

El atlas y las hojas individuales contienen los mismos píxeles nuevos; si el
atlas falla, se cargan los PNG individuales. Se mantienen los identificadores
de atuendo y las partidas. Véanse [personajes V3](../docs/CHARACTERS-V3.md) y
[validación y capturas](../docs/QA-CHARACTERS-V3.md).

## Vestuario, bancas y mundo V4

V4 precisa la ropa principal y sustituye la pareja cotidiana sentada con ropa
fija por seis hojas independientes. El look verde y cualquier combinación se
conservan al sentarse. La banca pequeña se dibuja aparte y no cambia la partida.
Los edificios completos reemplazan las fachadas genéricas en los diez destinos;
sus puntos de llegada siguen conectados por caminos transitables.

Consulta [recursos V4](../docs/WORLD-V4.md),
[trazabilidad](../docs/WORLD-V4-GENERATION.json) y
[comparativas y pruebas V4](../docs/QA-WORLD-V4.md).

## Personalización V5

En Armario → Itza puedes elegir cabello negro, café, rosa pastel o rubio claro.
Se guarda y se conserva al caminar, sentarse y en la boda, con cualquiera de
sus tres atuendos. El color del pelo de Leo se mantiene.

El mundo mezcla cerezos, jacarandas, robles, abedules y árboles altos. Arriba
aparecen Día, Noche y Automático: los modos manuales permanecen fijos y el
automático alterna cinco minutos de día y cinco de noche. Volver al automático
inicia un nuevo día. El estado se conserva al recargar.

Consulta [personalización V5](../docs/CUSTOMIZATION-V5.md) y
[pruebas y capturas](../docs/QA-CUSTOMIZATION-V5.md).

## Ampliación V6

Los mechones de perfil de Itza conservan ahora el color elegido en los tres
conjuntos. En Armario puedes elegir **Con lentes / Sin lentes** para Itza y Leo
por separado. Los árboles se dibujan al doble del tamaño nativo de sus PNG.

Leo tiene una vocecita sintética «mimimimi» que acompaña sus frases. El botón
**Voz: sí/no** está dentro de Música y conserva la preferencia. El rincón
escondido tiene ocho preguntas cariñosas, con progreso guardado.

La grabadora está preparada para tus mensajes personales. Coloca MP3 en
`assets/game/voice-notes/`, con nombres `mensaje-01.mp3`, `mensaje-02.mp3`, etc.
No hay que editar código ni JSON. Reinicia Vite después de añadirlos.
Consulta las [instrucciones de audios](../docs/VOICE-NOTES.md),
la [ampliación V6](../docs/EXPANSION-V6.md) y sus
[pruebas y capturas](../docs/QA-EXPANSION-V6.md).

## Ventanas ilustradas V7

Las trece experiencias tienen ahora una cabecera ilustrada y un interior
propio: carta en papel cálido, álbum de polaroids, tarjetas de razones,
tocadiscos, televisión CRT, reloj, postales y probador, entre otros. El cierre
permanece visible y al reabrir se vuelve al inicio del contenido.

También se corrigen los mechones de novia de frente y bajo el velo por detrás,
con y sin lentes. Textos, fotos, canciones, recuerdos y partidas se conservan.
Consulta [ventanas V7](../docs/EXPERIENCES-V7.md) y
[pruebas y las trece vistas](../docs/QA-EXPERIENCES-V7.md).

## Apariencia y pantalla completa V8

El mundo ocupa la pantalla completa, con cámara adaptable y controles flotantes
para computadora y celular. Conserva la escala uniforme del pixel art y el
control por toques al girar el teléfono. Los globos de Leo evitan los controles.

Se corrigen los mechones que quedaban negros en los conjuntos cotidianos y
se restaura el rostro sin lentes conservando sus rasgos originales, en lugar
de escalar un parche sobre la cara. Consulta [los cambios V8](../docs/APPEARANCE-VIEWPORT-V8.md)
y [sus pruebas y capturas](../docs/QA-V8.md).

## Jardín animado V9

Los lugares tienen transiciones breves al abrir y cerrar. Caen pétalos cerca
de cerezos y jacarandas, hay un estanque con ondas junto al jardín de la carta,
y las farolas y luciérnagas dan vida a la noche. Los efectos se pausan con las
ventanas abiertas y respetan la preferencia de reducir movimiento.

Consulta [los detalles V9](../docs/AMBIENCE-V9.md),
[las pruebas y capturas](../docs/QA-AMBIENCE-V9.md) y
[la procedencia del estanque](../docs/POND-V9-GENERATION.json).

## Pesca, Ponyo y casita V10

En el mapa aparece **Pesca · Lago de los peluches**. Consigue a Freddy, Bonnie,
Chica, Foxy y Golden Freddy para desbloquear a Ponyo junto a Los gatitos.
Al acariciarlo, Leo dice «ponyo ponyo que divertida es».

**Nuestra casita** permite comer juntos, dormir bajo la manta y ver la tele,
con los atuendos actuales. La colección, Ponyo y la última actividad de la
casa se conservan en la partida. Consulta [la guía V10](../docs/FINALE-V10.md)
y [las pruebas y capturas](../docs/QA-FINALE-V10.md).

## Sonidos y secretos V11

En Música puedes ajustar los efectos de pisadas, maullidos, agua y grillos.
Hay dos cofres y una carta escondidos, y estrellas fugaces por la noche.
Las estructuras tienen sombras de contacto y proyección sobre el suelo.

Se corrigen las caras sin lentes y los cuerpos sentados del comedor y el sofá.
La tele está preparada para `assets/game/home/videos/nuestro-video.mp4`:
añade el archivo, reinicia Vite y pulsa Reproducir en Ver la tele.

Consulta [los cambios V11](../docs/MAGIC-V11.md),
[las pruebas y comparaciones](../docs/QA-MAGIC-V11.md) y
[las instrucciones del video](../docs/HOME-VIDEO.md).
## Hawái, mirador y sofá V12

En **Mapa** están **Viaje a Hawái** y **Orilla de los deseos**. Camina hasta
el letrero y pulsa **E** para entrar. Hawái es otra isla para caminar, bailar,
comprar jugos con conchitas y acariciar una jirafa. En el mirador pueden
sentarse juntos, ver fuegos artificiales silenciosos y pedir deseos.

Las pisadas se eliminaron. El sofá usa cuerpos sentados con piernas cruzadas
completas; conserva ropa, cabello y lentes. El video personal ya instalado se
reproduce desde **Nuestra casita → Ver la tele → Reproducir video**.

Consulta [la guía V12](../docs/TRAVEL-V12.md) y
[las pruebas y capturas](../docs/QA-TRAVEL-V12.md).

## Mundo continuo V13

Todas las experiencias ocupan la pantalla completa. La casita, la boda, la
pesca y Hawái se presentan como escenarios con controles sobre el juego.
La cámara de la casa encuadra cada actividad según el tamaño de pantalla.

El mapa se extiende al sur con playa y mar. En **Mapa → Orilla de los deseos**
podemos sentarnos, ver fuegos artificiales y pedir deseos en el mismo lienzo
del mundo. En **Mapa → Viaje a Hawái** llegamos a una terminal con muelle y
barco: pulsa **E** y después **Subir al barco · Hawái**.

El baile usa ocho poses propias por conjunto, con pasos cruzados, brazos
levantados y giros. El video sigue en su carpeta y se inicia desde **Ver la
tele → Controles de la tele → Reproducir video**.

Consulta [la guía V13](../docs/IMMERSIVE-V13.md) y
[las pruebas y capturas](../docs/QA-IMMERSIVE-V13.md).

## Detalles visuales V14

El sillón mira hacia la TV, con su respaldo en primer plano. Las ocho poses
del baile conservan ahora la mandíbula completa en todos los conjuntos.
En Hawái, **♫ Música** controla el mismo reproductor y las 37 canciones del
pueblo, sin salir de la isla.

Itza pesca desde la orilla con sus atuendos y una caña conectada a sus manos.
El peluche sale del agua y sube hasta ella. El mundo usa una sola superficie
de terreno para eliminar el corte entre el pueblo y la costa.

Consulta [la guía V14](../docs/POLISH-V14.md) y
[la verificación con capturas](../docs/QA-POLISH-V14.md).
