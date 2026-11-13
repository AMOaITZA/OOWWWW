# OOWWWW — juego RPG (beta)

El sitio clásico permanece en `/` y el videojuego en `/game.html`.
El desarrollo está en la rama `feat/game-phase-0`, asociada al Pull Request
n.º 1. No se fusiona con `main` sin aprobación explícita.

## Características actuales

- Mundo de 120 × 80 casillas (16 píxeles por casilla), cámara de 480 × 270,
  paseo por teclado, ratón y pantalla táctil, con búsqueda de rutas A*.
- Once lugares: las nueve experiencias clásicas, armario y **Castillo de nuestra boda**.
  Además, tres puntos interactivos: los dos gatitos y dos bancas.
  El mapa muestra **14 destinos**.
- Itza y Leo conservan sus atuendos seleccionados y la posición guardada.
  Tienen tres opciones en el armario: original, alternativa opcional y boda.
  Las imágenes `look-02.png` son opcionales y pueden seguir pendientes.
- Globo de frases de Leo que se recoloca para no tapar la pareja ni los gatos.
- Reproductor de audio local persistente, controles y catálogo de canciones.

## El castillo de boda

Está en `game/data/places.json` como `boda`, situado en [105, 51]
con acceso por [105, 56]. La entrada es transitable y se comprueba
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

**Los 19 sprites definitivos** se encuentran en un solo PNG indexado:

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
