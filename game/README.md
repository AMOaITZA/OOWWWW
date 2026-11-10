# OOWWWW — prueba de movimiento con sprites completos

## Estado

El sitio clásico permanece en `/` y el juego se abre en `/game.html`.

El mapa, A*, las diez experiencias y el guardado siguen operativos.
El Armario ahora **solo permite dos looks completos por personaje**. No se requieren
archivos independientes para cabello, lentes, chamarra, pantalones o calzado.

## Recursos mínimos para probar el movimiento hoy

Descarga el paquete de recursos preparado con las tres imágenes originales.
Copia su carpeta `assets/` sobre la carpeta `assets/` del repositorio (sin borrar
los recursos preexistentes del sitio clásico).

Los tres PNG son:

```
assets/game/world/ground.png            1920×1280 (suelo)
assets/game/characters/itza/look-01.png 192×144 (primer atuendo completo)
assets/game/characters/leo/look-01.png  192×144 (primer atuendo completo)
```

**Solo con esos tres recursos se puede jugar y caminar.** El código carga los tres
automáticamente porque sus rutas ya figuran en `game/data/assets.json`.
No hay que modificar JavaScript después de copiarlos.

Las hojas tienen 6 columnas × 3 filas, con frames de 32×48. Columnas:
0–1 quieto; 2–5 caminar. Filas: frente, derecha y espalda. Izquierda se
obtiene espejando derecha.

## Segundo atuendo, para cuando esté listo

Únicamente añade:

```
assets/game/characters/itza/look-02.png 192×144
assets/game/characters/leo/look-02.png  192×144
```

El botón «Segundo conjunto» estará disponible para el personaje correspondiente
cuando exista su PNG válido. Cada look es un solo archivo de 18 frames.
La selección se guarda en `localStorage` con la clave `oowwww-game-v1`, sin
alterar las posiciones ni la ropa ya guardada del sitio.

Ambos personajes pueden usar looks distintos.

## Arranque en Windows / PowerShell

```powershell
git switch feat/game-phase-0
git pull origin feat/game-phase-0
npm install
npm run art:check
npm run dev
```

Abrir `http://localhost:5173/game.html` y pulsar Entrar.

- Clic o toque en el terreno: caminar hacia allí siguiendo un camino libre.
- Tocar un edificio: caminar hacia su entrada; otro toque para abrirlo.
- WASD o flechas: desplazamiento con teclado.
- «Mapa»: seleccionar destinos sin teletransportación.
- «Armario»: ver Itza o Leo por delante, de lado o de espaldas, reproducir caminata y elegir entre dos conjuntos completos.

## Pruebas

```bash
npm test
npm run art:check
npm run build
npm run test:e2e
```

`art:check` comprueba tamaño de hojas y suelo, alfa totalmente opaco/transparente
y paleta combinada de hasta 48 colores. La alineación de manos, el efecto de
caminar juntos y la precisión del pixel art todavía requieren revisión visual.

## Importante

Los JPEG suministrados eran imágenes de referencia, no sprites utilizables
directamente. Los PNG preparados son conversiones técnicas de prueba.
Se ha eliminado el fondo blanco de los personajes, normalizado el tamaño y reducido
su paleta de colores. Si aparecen bordes extraños por la compresión JPEG original
habrá que corregirlos manualmente, sin generar otra hoja por cada prenda.

La ruta de inicio del mundo y la disposición actual de casas y árboles son
provisionales y se adaptarán a la composición final del mapa.
El suelo es solo una imagen: los obstáculos se definen por separado en el código.
