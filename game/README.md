# OOWWWW — juego RPG (beta)

El sitio clásico permanece en `/` y el videojuego en `/game.html`.
El desarrollo está en la rama `feat/game-phase-0`, asociada al Pull Request
n.º 1. No se fusiona con `main` sin aprobación explícita.

## Características actuales

- Mundo de 120 × 80 casillas (16 píxeles por casilla), cámara de 480 × 270,
  paseo por teclado, ratón y pantalla táctil, con búsqueda de rutas A*.
- Once lugares: las nueve experiencias clásicas, armario y **Castillo de nuestra boda**.
  Además, tres puntos interactivos: una pareja de gatitos y dos bancas.
  El mapa muestra **14 destinos**.
- Itza y Leo conservan sus atuendos seleccionados y la posición guardada.
  El armario conserva tres identificadores: original, alternativa y boda.
  Los tres conjuntos ya tienen recursos reales y están disponibles para ambos
  personajes. Los segundos conjuntos se guardan con el mismo id `alternativo`.
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
32 KB. El archivo ya está versionado; **no hay que descargar ni ensamblar
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
- Las bancas incorporan aproximación y levantamiento de 0,38 s y una nueva
  pareja sentada de dos celdas 80 × 64. El recorte visible 75 × 59 se dibuja
  a 1×; las cabezas tienen una escala comparable a la de pie. Los gatos
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

El look 1 de ambos, los trajes de caminar de boda y las secuencias de llegada,
votos, beso, abrazo y celebración se generaron de nuevo siguiendo la pareja
sentada de boda que se tomó como referencia. El look 2 y las poses sentadas V2
ya usan ese estilo y se mantienen. Se retiró la banca pequeña anterior y los
personajes provisionales dibujados por código.

El atlas y las hojas individuales contienen los mismos píxeles nuevos; si el
atlas falla, se cargan los PNG individuales. Se mantienen los identificadores
de atuendo y las partidas. Véanse [personajes V3](../docs/CHARACTERS-V3.md) y
[validación y capturas](../docs/QA-CHARACTERS-V3.md).
