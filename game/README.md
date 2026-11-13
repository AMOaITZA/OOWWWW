# OOWWWW — recursos de mapa y personajes

El clásico se conserva en `/`, y el RPG en `/game.html`.
Todo este trabajo se hace en `feat/game-phase-0`. El PR sigue en borrador.

## Paquete de arte preparado

Las once ilustraciones de edificios y piezas enviadas originalmente como JPEG
se han convertido a PNG, eliminando el tablero cuadriculado, con alfa 0/255,
proporción conservada y una paleta común de **48 colores** junto con el
suelo y los dos personajes existentes.

**IMPORTANTE:** usa el paquete completo más reciente, no mezcles su suelo con
los `look-01.png` de un paquete anterior sin pasar `npm run art:check`,
pues cada versión puede usar una paleta distinta.

### Archivos del paquete

```text
assets/game/world/ground.png             1920 x 1280
assets/game/characters/leo/look-01.png   192 x 144
assets/game/characters/itza/look-01.png  192 x 144
assets/game/objects/house.png            144 x 85
assets/game/objects/letter.png           144 x 85
assets/game/objects/gallery.png          144 x 85
assets/game/objects/book.png             144 x 85
assets/game/objects/playlist.png         144 x 85
assets/game/objects/tv.png               144 x 85
assets/game/objects/clock.png            144 x 85
assets/game/objects/places.png           144 x 85
assets/game/objects/final.png            144 x 85
assets/game/objects/roof.png             152 x 34
assets/game/objects/awning.png           40 x 24
```

Se adaptó el motor para **no estirar** las fachadas. La colisión de cada edificio
ocupa nueve celdas de ancho; techo y toldo son objetos separados.

**Pendientes:** `wardrobe.png`, `tree.png`, `rock.png`, `bench.png`,
`lamp.png` y los segundos conjuntos `look-02.png` de Itza y Leo.
Mientras falten, el motor usa sus dibujos provisionales.

## Instrucciones de instalación

Descarga el ZIP de recursos que se entrega junto a esta revisión.

1. Extrae el ZIP.
2. Abre tu proyecto local `OOWWWW`.
3. Copia la carpeta `assets` del ZIP dentro de tu carpeta `OOWWWW`,
   **combinándola** con la carpeta existente. No borres las fotos clásicas.
4. En PowerShell dentro de OOWWWW:

```powershell
git switch feat/game-phase-0
git pull origin feat/game-phase-0
npm install
npm run art:check
npm test
npm run dev
```

Abre `http://localhost:5173/game.html` y prueba caminar, abrir casas y el Armario.

## Subir los nuevos PNG a GitHub

Después de copiar los recursos en el proyecto local:

```powershell
git status
git add assets/game
git commit -m "feat(art): add pixel-art buildings and characters"
git push origin feat/game-phase-0
```

**No uses `git add -A` si tienes otros archivos no relacionados**. Solo
necesitamos subir `assets/game`.

Cuando termine el push, el PR de esta rama recibirá los PNG y GitHub Actions
repetirá todas las pruebas.

## Revisión visual

Los JPEG entregados ya traían la cuadrícula gris pintada, no transparencia real.
Una segmentación automática nunca garantiza contornos perfectos: revisa sobre
fondo oscuro las macetas, escalones y esquinas de cada edificio, y comprueba los
píxeles de ojos, manos y pies de ambos personajes. Si hiciera falta, retocaremos
esos detalles manualmente.

El contador, las 104 razones, la carta, las ocho fotos, los 21 recuerdos, Spotify
y demás experiencias no se modifican al incorporar los PNG. Los GIF externos
continúan dependiendo del sitio que los aloja.

## Agregar nuevos recursos

Las rutas viven en `game/data/assets.json`. El código central del juego no
incluye nombres concretos de archivos de ropa ni del suelo.

- `wardrobe.png`: 144 x 85 píxeles, transparente.
- `tree.png`: 48 x 84.
- `rock.png`, `bench.png`, `lamp.png`: 48 x 47.
- `look-02.png` por cada personaje: hoja completa 192 x 144;
  6 columnas x 3 filas, cada frame 32 x 48.

El validador de arte se ejecuta con `npm run art:check` y comprueba tamaños,
alfa limpio y un máximo de 48 colores en el conjunto de imágenes cargadas.

Para Render: sitio estático, build `npm install && npm run build`, publicar `dist`.

## Reproductor de audio local (rama beta)

El catálogo `game/data/audio.json` incluye los **37 nombres exactos** de archivos
MP3 de `assets/game/audio/`. No se han renombrado ni duplicado. El nombre
visible se genera retirando el sufijo ` - Spotimate.app` y separando título
y artista por el último ` - ` del nombre. Las rutas se codifican para admitir
espacios, acentos y caracteres especiales.

La casa Playlist permite buscar cualquier canción por título o artista.
El reproductor tiene reproducir/pausar, anterior/siguiente, progreso,
volumen, detener, minimizar y abrir la lista desde cualquier parte del juego.
El elemento `<audio>` permanece montado al entrar y salir de las experiencias.
Minimizar oculta controles **sin detener** la música. Al terminar una
pista se intenta pasar a la siguiente.

La reproducción requiere una interacción del usuario y no empieza sola
al entrar al juego. El catálogo y el volumen se recuerdan en `localStorage`
como `oowwww-audio-track-v1` y `oowwww-audio-volume-v1`.

**Derechos y publicación:** los MP3 del usuario incluyen grabaciones
comerciales. No deben alojarse o distribuirse públicamente en Render o
GitHub sin autorización de los titulares de los derechos. Este cambio
modifica sólo el código de la rama beta y no agrega nuevos MP3. Para
una publicación pública se recomienda música original o autorizada.

**Volumen de archivos:** aproximadamente 324 MB. Vite copia
`assets/` a `dist/` para el despliegue estático y las URLs de audio
deben admitir solicitudes HTTP Range para permitir saltos de posición.


## Los gatitos y las bancas (beta)

Los cinco sprites pixel art enviados por el usuario se convirtieron de JPEG
con tablero de fondo pintado a PNG transparentes y de dimensiones nativas:

- `assets/game/moments/cat-duo-idle.png` — 80×64
- `assets/game/moments/cat-duo-happy.png` — 80×64
- `assets/game/moments/pet-sparkles-sheet.png` — 96×16 (6 × 16×16)
- `assets/game/moments/pair-bench-sit-sheet.png` — 128×48 (2 × 64×48)
- `assets/game/moments/bench-seat-wide.png` — 56×40

El lugar **Los gatitos** se encuentra en la celda [68, 47], cerca del
sendero central; se puede acariciar tocándolos, haciendo clic o pulsando
**E** cuando Itza y Leo se acercan. Los gatos cambian al sprite feliz
durante la caricia, y aparecen estrellitas/corazones animados.

También se puede tomar asiento en las dos bancas originales de
`game/data/decor.json`, en [24, 31] y [76, 47]. El sprite de
Itza y Leo sentados ocupa 2 fotogramas, se levanta al pulsar **E** de nuevo
o al moverse, y vuelve a la animación de caminar.

El mapa general incluye tres destinos adicionales (10 lugares originales
+ gatos + dos bancas). La cuenta de lugares visitados sigue reflejando solo
las 10 experiencias originales. No se cambió el modo clásico.

Leo pronuncia aleatoriamente frases cortas mediante una burbuja sobre los
personajes, con pausas entre una y otra. Las frases están en
`game/moments.js` y se pueden editar sin regenerar imágenes.

Las pruebas automáticas de esta incorporación verifican los cinco PNG,
las posiciones caminables, la colisión de los gatos y la interacción por
teclado y el mapa, incluidos los dispositivos móviles.

**Pendiente de otra fase:** armonizar los sprites originales del mundo
para que su paleta combinada cumpla el límite histórico configurado de
48 colores. La paleta actual tiene 156; no se redujo ni se alteró la
regla para aprobar artificialmente este cambio.
