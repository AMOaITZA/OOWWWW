# OOWWWW — videojuego RPG (fases 0, 1 y 2)

## Estado de la implementación

El sitio clásico se conserva exactamente en `/` y el videojuego nuevo funciona en `/game.html`. No se ha modificado ni una sola palabra de la carta, de las razones, ni de los recuerdos del sitio original.

**Funcionando en la rama de desarrollo:**
- Canvas 2D de 480×270 píxeles, mundo lógico de 1920×1280 y tiles de 16 px.
- Cámara centrada, clic/toque para caminar usando A*, colisiones y controles WASD/flechas.
- Diez puntos de interés: Inicio, Carta, Galería, Razones, Playlist, Recuerdos, Contador, Lugares, Final y Armario.
- Experiencias independientes DOM con ciclo `mount/unmount`: ninguna obliga a abandonar el mapa.
- Carta de 1918 caracteres, 104 razones paginadas, 8 fotos con visor, playlist Spotify, tele con los 21 GIF y sus textos, contador en tiempo real, 3 lugares y final conservados del original.
- Pareja con un solo reloj de animación y capas para cuerpo, cabello posterior/anterior, ropa, calzado y accesorios, con espejo al caminar a la izquierda.
- Catálogos JSON SEPARADOS y un armario con selección, vista previa, quitar prendas y guardado versionado en `localStorage` bajo `oowwww-game-v1`.
- Objetos con colisión independiente de imagen, orden de profundidad y edificios con base, techo y toldo en sprites independientes.
- Gráficos de respaldo dibujados por el motor si todavía no hay PNG.

## Arranque local

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173/game.html`. `http://localhost:5173/` sigue mostrando el sitio clásico.

Pruebas y compilación:

```bash
npm test
npm run art:check
npm run build
npm run preview
```

Una acción de GitHub ejecuta las pruebas y build en cada cambio de la rama `feat/game-phase-0` y en el pull request.

## Recursos gráficos

Las rutas exactas de los archivos se declaran en `game/data/assets.json`, y cada prenda se declara en `game/data/catalog-leo.json` o `game/data/catalog-itza.json`. No hay rutas concretas de prendas codificadas en la lógica.

Sube primero **solo estos tres archivos**:

| Ruta | Resolución y requisitos |
| --- | --- |
| `assets/game/world/ground.png` | 1920×1280, suelo ilustrado completo sin obstáculos físicos horneados |
| `assets/game/characters/leo/base.png` | 192×144, PNG transparente, 6 columnas × 3 filas |
| `assets/game/characters/itza/base.png` | 192×144, PNG transparente, 6 columnas × 3 filas |

Cada frame mide 32×48 px. Las tres filas son **frente, derecha y espalda**, las columnas 0 y 1 son quieto y 2 a 5 son caminar. La vista izquierda se refleja a partir de derecha. Todas las capas de cada personaje deberán coincidir perfectamente con el cuerpo base.

Luego produce la prueba vertical: cabello anterior/posterior + una prenda, todos sus frames y direcciones. Comprobarlos en el armario antes de producir otras prendas.

Objetos de ejemplo que el manifiesto ya acepta: `assets/game/objects/house.png` (pared/base sin techo), `roof.png`, `awning.png`, `tree.png`, `bench.png`, `rock.png`, `lamp.png`, `letter.png`, `gallery.png`, `book.png`, `playlist.png`, `tv.png`, `clock.png`, `places.png`, `final.png`, `wardrobe.png`. Puedes subirlos poco a poco: cada recurso ausente utiliza un respaldo.

Todos los PNG deben emplear píxeles sin suavizado ni bordes semitransparentes, y la paleta combinada de los recursos del juego no puede superar 48 colores. Ejecuta `npm run art:check` cuando agregues archivos. El validador comprueba dimensiones, alfa y número de colores; la alineación de manos, coherencia entre frames y adecuación estética **se revisan visualmente**, no quedan demostradas por la herramienta.

## Cómo agregar una prenda

1. Sube la hoja de PNG de 192×144 a la carpeta del personaje correspondiente.
2. Abre **solo el catálogo JSON** del personaje.
3. Añade un objeto con `id`, `name`, `sprite` (o `front`/`back` si es cabello) y opcionalmente `color` de respaldo.
4. Comprueba `npm run art:check`, abre Armario y elige la prenda. No es necesario modificar `game/pair.js` ni `game/main.js`.

El armario admite valores nulos para quitar prendas. La ropa elegida persiste al cerrar, caminar, recargar y volver a abrir el juego.

## Estructura

- `game/main.js`: bucle, cámara, entrada de usuario y estado.
- `game/world.js`: cuadrícula, A* y colisiones.
- `game/places.js`: decoraciones, edificios, techos, profundidad.
- `game/pair.js`: dos personajes, reloj y capas.
- `game/wardrobe.js`: selección de prendas por personaje.
- `game/assets.js`: carga, validación dimensional y memoria caché de sprites.
- `game/experiences/host.js`: apertura/cierre y ciclo de vida.
- `game/experiences/*.js`: una experiencia por módulo.
- `game/data/content.json`: textos y enlaces migrados del sitio clásico sin reescribirlos.
- `game/data/decor.json`, `places.json`: posiciones y puntos de llegada.
- `game/save.js`: persistencia local.

## Publicar

Render estático: construir con `npm install && npm run build` y publicar `dist`. El `vite.config.js` copia íntegramente `assets/` y `js/` al directorio final para preservar medios del sitio clásico y los sprites opcionales referenciados por JSON.

## Verificación manual pendiente

1. Probar en escritorio y móvil que entrar en `/game.html` muestra el mundo y que `/` sigue funcionando.
2. Hacer clic en un edificio, esperar a que lleguen Itza y Leo, volver a tocar y abrir la ventana sin perder posición.
3. Abrir y cerrar las diez experiencias; comprobar los 21 GIF externos y el iframe Spotify, que dependen de servicios externos.
4. Cambiar prendas en Armario, salir, moverse, recargar y confirmar que se conservan.
5. Probar colisiones cerca de árboles, edificios, bancos y bordes.
6. Probar zoom entero en escritorio, adaptación en móvil y `prefers-reduced-motion`.

## Limitaciones

El diseño final del mapa, sprites y ropa sigue pendiente de las ilustraciones y de la prueba vertical. Los PNG actuales del sitio son solo referencia. Los GIF de Pinterest pueden dejar de funcionar por causas externas. La paleta y la geometría del mapa tendrán que ajustarse con los sprites finales. Ninguna prueba automática sustituye una inspección visual.

El repositorio es público y contiene imágenes y textos personales. Conviene revisar la decisión de privacidad antes de realizar una publicación definitiva.
