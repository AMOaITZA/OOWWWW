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

## Música de YouTube (beta)

La casa Playlist incluye una lista de 24 videos proporcionados por el usuario.
Elegir una canción abre un reproductor oficial de YouTube fijo y visible que
permanece montado al cerrar experiencias o usar el mapa. El botón **Música**
permite abrir el último video seleccionado. Los botones Anterior/Siguiente
cambian el video. **Cerrar** destruye el iframe y detiene la reproducción.

- La reproducción **no comienza automáticamente**; se pulsa Play en YouTube.
- El video permanece visible y tiene al menos 200×200 px, incluso en móvil.
- Si el titular impide la inserción, se puede usar «Abrir video en YouTube».
- Los navegadores pueden interrumpir videos al cambiar de pestaña o bloquear
  ciertas reproducciones. No se descargan ni se separan las pistas de audio.
- No se necesita API key ni Spotify. La selección (no la reproducción) se recuerda
  en `localStorage` como `oowwww-music-track-v1`.
- No se añade contenido musical al repositorio; se utilizan incrustaciones oficiales.

Archivos: `game/data/songs.json`, `game/music.js`, `game/experiences/playlist.js`.
