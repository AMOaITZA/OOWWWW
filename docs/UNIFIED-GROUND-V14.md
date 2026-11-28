# Un solo suelo del pueblo al mar

El corte horizontal se producía porque el juego pintaba un suelo de pueblo de
1920 × 1280 y, debajo, otra ilustración de costa con diferente verde, textura y
escala. Además, el camino central terminaba en seco en ese límite.

Ahora hay una única ilustración **`ground-unified.png`, de 1920 × 1792**. Se
editó con `image_gen` la composición completa para usar el mismo césped, luz y
detalle en todo el mapa. Una bifurcación natural conecta el camino del pueblo
con los accesos a la playa. La costa conserva su posición, al igual que el
cruce central y las superficies transitables; los edificios y personajes siguen
siendo los recursos independientes del juego.

El empaquetado técnico solo normaliza la cuadrícula nativa, el alfa opaco y la
paleta de 192 colores. No se aplicaron desenfoques ni mezclas de colores por
algoritmo para ocultar la junta.

| Vista | Evidencia |
| --- | --- |
| Corte anterior en el arte | [Antes](qa-unified-ground-v14/before-seam-native.png) |
| Suelo continuo y caminos conectados | [Después](qa-unified-ground-v14/after-seam-native.png) |
| Juego de día en el antiguo límite | [Captura real](qa-unified-ground-v14/world-seam-day.png) |
| Juego de noche | [Captura real](qa-unified-ground-v14/world-seam-night.png) |
| Celular | [Captura real](qa-unified-ground-v14/world-seam-phone.png) |

Las tres capturas reales terminaron sin errores JavaScript ni recursos fallidos.
La revisión focalizada aprobó **34 pruebas unitarias**, incluidas tres que
comprueban opacidad/paleta, conservación del cruce y litoral, y continuidad de
color alrededor de la antigua fila 1280. La diferencia de color media entre
las filas 1278 y 1282 del césped pasó de 35,79 a 1,00 en distancia RGB.

- [Mediciones y recortes nativos](qa-unified-ground-v14/terrain-measurements.json).
- [Resultado del juego real](qa-unified-ground-v14/result.json).
- [Procedencia y empaquetado](UNIFIED-GROUND-V14-GENERATION.json).

Para repetir las vistas con Vite activo:
`node scripts/capture-ground-v14.mjs`. Admite `ART_CAPTURE_URL`,
`ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`. La revisión móvil es emulada.
