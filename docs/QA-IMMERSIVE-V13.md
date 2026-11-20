# V13: escenas completas, costa y baile

## Validación final

- **235/235 pruebas unitarias** aprobadas.
- **7/7 recorridos aprobados en la compilación de producción**, servida con
  Vite preview: tres de presentación a pantalla completa, tres de costa/puerto/
  baile y uno con el video personal instalado.
- **92 PNG** aprobados por presencia, dimensiones, alfa, anclajes y paletas.
  `npm run build` aprobado con el video personal intacto.
- Los tres recorridos de integración propios de V13 aprobaron también con
  Vite. Comprueban una ruta real desde el pueblo, el mismo lienzo al ver los
  fuegos, ocho cuerpos distintos por personaje durante el baile y rotación.

La evidencia incluye 39 imágenes PNG y un GIF entre las carpetas de costa,
baile, pantallas completas, Hawái e integración. Los resultados registraron
cero errores JavaScript y cero recursos fallidos. El compositor de baile se
revisó en 48 combinaciones de poses y personalización.

## Integración comprobada

La revisión se realiza con Chromium y la entrada táctil emulada de Playwright.
Los recorridos están en
[immersive-v13.spec.js](../tests/e2e/immersive-v13.spec.js).

| Recorrido | Comprobaciones |
| --- | --- |
| Pueblo → orilla | Se camina desde la posición inicial del pueblo hasta la manta de la costa mediante el mapa. El mar pertenece a la extensión sur y el minimapa conserva su geometría. |
| Sentarse y mirar el cielo | La cámara cambia de vista dentro del mismo `#world`; no se abre una experiencia ni se crea otro lienzo. Se comprueban fuegos, estrella fugaz, deseos guardados y regreso a la posición de la orilla. |
| Puerto → Hawái | La terminal tiene una interacción en el mundo. El botón para subir al barco abre el mapa de la isla. Al volver se conservan las coordenadas del puerto. |
| Baile | Se observan ocho poses reales dibujadas para cada personaje y ocho resultados diferentes en la región del cuerpo. La animación conserva conjuntos, cabello y lentes. |
| Actividades y progreso | Se compran los tres jugos, se acaricia a la jirafa y se guardan conchitas y acciones. Al salir dejan de dibujarse los personajes de la isla. |
| Móvil | La costa y la isla cubren la pantalla en 390 × 844 y 844 × 390. Los controles visibles tienen al menos 44 px, no hay desplazamiento horizontal y un toque real mueve a la pareja en la isla. |

Las pruebas móviles son emuladas y no equivalen a una revisión en teléfonos
físicos. El movimiento reducido mantiene los fuegos decorativos estáticos.

## Evidencia visual

| Vista | Captura |
| --- | --- |
| Terminal y barco en el mundo | [Puerto](qa-immersive-v13/harbor-physical-desktop.png) |
| Manta junto al agua | [Costa](qa-immersive-v13/coast-blanket-desktop.png) |
| Fuegos en el mismo mundo | [Escritorio](qa-immersive-v13/coast-fireworks-desktop.png), [celular](qa-immersive-v13/coast-fireworks-phone.png), [horizontal](qa-immersive-v13/coast-fireworks-landscape.png) |
| Hawái a pantalla completa | [Isla](qa-immersive-v13/hawai-fullscreen-desktop.png) |
| Ocho poses consecutivas de baile | [Tira de cuadros](qa-immersive-v13/dance-eight-frames.png), [fases y archivos](qa-immersive-v13/dance-frames.json) |
| Jirafa e interfaz móvil | [Vertical](qa-immersive-v13/hawai-jirafa-phone.png), [horizontal](qa-immersive-v13/hawai-jirafa-landscape.png) |

Las capturas usan las acciones reales y posiciones de llegada ordinarias.
No introducen una colección ganada ni reproducen el video personal. Los fuegos
estáticos se obtienen activando movimiento reducido; para los cuadros del baile
se congela el reloj del navegador en cada pose de la animación real. La tira
dispone los recortes de pantalla sin alterar su contenido.

## Repetir

```sh
npm run test:e2e -- immersive-v13.spec.js --workers=1
```

Con Vite activo:

```sh
node scripts/capture-immersive-v13.mjs
```

El capturador admite `ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y
`ART_CHROMIUM_PATH`. Los resultados finales de las capturas se guardan en
[result.json](qa-immersive-v13/result.json).

Para revisar el resto de la presentación y la animación:

- [Casita, boda, pesca y lectura](FULLSCREEN-V13.md).
- [Baile con poses nativas](qa-dance-v13/dance-poses.png) y
  [animación de dos vueltas](qa-dance-v13/partner-dance.gif).
- [Costa en el mundo y en ambas orientaciones](qa-coast-v13/result.json).
- [Hawái a pantalla completa](qa-hawaii-scene-v13/result.json).

La comprobación de producción ejecutó `fullscreen-v13.spec.js`,
`immersive-v13.spec.js` y `personal-video-v12.spec.js` contra el puerto 5187,
con Chromium de sistema y un trabajador. No se creó ni se sustituyó un video
para realizarla.
