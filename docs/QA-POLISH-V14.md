# Verificación V14

## Comprobaciones

- **241/241 pruebas unitarias** aprobadas.
- **117/117 pruebas de navegador** aprobadas en una ejecución completa.
- **94 PNG** aprobados por dimensiones, alfa, anclajes y paletas.
  Compilación aprobada con el video personal instalado.
- **5/5 recorridos específicos** de música, terreno y pesca aprobados.
- **9/9 casos aprobados también en la compilación de producción**: música de
  Hawái, terreno continuo, pesca personalizada y rotación, los tres conjuntos
  en el sofá volteado y el video personal.
- La revisión del baile comprobó **240 variantes** de cara, conjunto, pelo
  y lentes en las ocho poses reales.

Las comprobaciones usan Chromium y dispositivos móviles emulados; no se
realizaron en teléfonos físicos. El video personal y los cinco PNG de peluches
se compararon con el estado anterior y permanecen intactos.

| Flujo | Evidencia comprobada |
| --- | --- |
| Sofá | Tres conjuntos en escritorio, celular y horizontal. Cabezas y espalda superior visibles detrás de un respaldo orientado hacia la TV. |
| Baile | Los píxeles medidos de mandíbula se conservan en todas las poses y opciones. No se sustituye el rostro. |
| Música | Una selección real reproduce un MP3 en el mismo elemento de audio del pueblo. Pausa, volumen, canción y continuidad al volver funcionan. La isla permanece abierta al cerrar sus controles. |
| Pesca | Itza está presente con su conjunto, cabello y lentes. El peluche obtenido con los botones reales recorre distintas posiciones desde el agua hasta la caña. Captura, guardado y limpieza funcionan. |
| Rotación | El cuerpo de Itza permanece dentro de la pantalla y sin intersecar los paneles de estado, acción y misión en ambas orientaciones. |
| Terreno | El lienzo del mundo carga una sola imagen de 1920 × 1792; no dibuja la antigua costa por separado. El color y la textura se revisan alrededor de la antigua unión con iluminación de día y noche. |

## Capturas

- [Sofá y orientaciones](SOFA-TURN-V14.md).
- [Caras y poses del baile](DANCE-HEADS-V14.md).
- [Terreno antes y después](UNIFIED-GROUND-V14.md).
- Itza pescando: [escritorio](qa-polish-v14/fishing-caught-desktop.png),
  [celular](qa-polish-v14/fishing-caught-phone.png) y
  [horizontal](qa-polish-v14/fishing-caught-landscape.png).
- Secuencia real: [lanzar](qa-polish-v14/fishing-sequence-01-casting.png),
  [esperar](qa-polish-v14/fishing-sequence-02-waiting.png),
  [tirar](qa-polish-v14/fishing-sequence-03-reeling.png) y
  [levantar](qa-polish-v14/fishing-sequence-04-caught.png).
- Música en la isla: [escritorio](qa-polish-v14/island-music-desktop.png) y
  [celular](qa-polish-v14/island-music-phone.png).

Las doce capturas de pesca y música terminaron sin errores JavaScript ni
recursos fallidos: [resultado](qa-polish-v14/result.json). Los cuatro cuadros
de la secuencia congelan el reloj del navegador sobre la animación real; no
introducen una captura ganada. El resto usa el modo de movimiento reducido
para hacer reproducibles las poses finales. No se capturó el video personal.

## Repetir

```sh
npm test
npm run art:check
npm run build
npm run test:e2e
```

Con Vite activo, `node scripts/capture-polish-v14.mjs` repite las capturas de
pesca y música. Los demás capturadores específicos figuran en sus guías.
Admiten `ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`.

La comprobación de producción usó Vite preview en el puerto 5188 con
`island-music-v14.spec.js`, `polish-v14.spec.js`, `sofa-v12.spec.js` y
`personal-video-v12.spec.js`. El video ya instalado se probó con su inicio
manual; ningún archivo de usuario fue reemplazado.
