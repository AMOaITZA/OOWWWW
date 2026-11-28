# Verificación V12: viajes, mirador, sofá y audio

- **221/221 pruebas unitarias** aprobadas.
- **98 casos de navegador verificados**: la suite completa aprobó 97 y el caso
  restante aprobó al repetirlo con su observador corregido. El observador ahora
  distingue la solicitud JavaScript `?url` de Vite de una solicitud de video;
  comprueba que no hay carga de medios ni reproducción al abrir la tele.
- **4/4 recorridos aprobados también en la compilación de producción**: video
  personal, Hawái completo, mirador y navegación táctil con rotación.
- **88 PNG** aprobados por `npm run art:check`: presencia, dimensiones, alfa,
  anclajes y paletas. `npm run build` aprobado con el video personal instalado.

Se utilizó Chromium de sistema con Playwright. Los tamaños de teléfono y la
entrada táctil son emulados; esta revisión no se realizó en teléfonos físicos.

## Recorridos

| Flujo | Resultado comprobado |
| --- | --- |
| Accesos del pueblo | El mapa muestra Hawái y la orilla. Una ruta real desde 30,25 llega a 76,42 y abre la isla con E. Ambos accesos tienen rutas transitables y sus letreros no se pisan. |
| Hawái | La pareja camina a la pista, baila, compra las tres bebidas y acaricia a la jirafa. Se guardan las conchitas y acciones; al regresar permanece la posición del pueblo. Los controles esperan a que termine la caminata. |
| Mirador | Sentarse habilita los fuegos y deseos. El espectáculo silencioso termina a los 18 segundos y se puede detener. Aparecen estrellas fugaces y reflejos. Levantarse termina los efectos y los recuerdos sobreviven a una recarga. |
| Celular | Un toque mueve a la pareja en la isla; la cámara la sigue. La rotación entre 390 × 844 y 844 × 390 conserva controles y geometría, sin desbordamiento horizontal y con botones de al menos 44 px. |
| Movimiento reducido y cierre | Los fuegos se presentan como una composición estática. Ocultar la pestaña pausa las escenas. Después de salir no se siguen dibujando ni se conservan sus manejadores. |
| Sofá | Los cuerpos se apoyan en el asiento con piernas cruzadas completas. Se revisaron 120 variantes. Las pruebas comparan las piernas opacas de ambos actores con el lienzo final en los tres conjuntos. |
| Sonido | Caminar mueve realmente a la pareja sin crear fuentes de audio. Acariciar un gato sí produce un maullido; siguen funcionando volumen, silencio, agua y grillos. |
| Video personal | El archivo de `d260463` conserva sus bytes. No se reproduce al entrar; al pulsar Reproducir avanza el video y se dibujan cuadros dentro de la tele, incluso con movimiento reducido. Cambiar de actividad o cerrar libera el medio. Este recorrido pasó en desarrollo y producción. |

## Capturas del juego real

| Vista | Evidencia |
| --- | --- |
| Isla completa | [Hawái](qa-travel-v12/hawai-map-desktop.png) |
| Baile | [En la pista](qa-travel-v12/hawai-dance-desktop.png) |
| Bebidas | [Puesto](qa-travel-v12/hawai-bar-desktop.png), [menú](qa-travel-v12/hawai-drinks-menu.png) |
| Jirafa | [Escritorio](qa-travel-v12/hawai-giraffe-desktop.png), [celular](qa-travel-v12/hawai-giraffe-phone.png) |
| Isla en horizontal | [844 × 390](qa-travel-v12/hawai-landscape.png) |
| Lago y fuegos | [Escena](qa-travel-v12/lake-fireworks-scene.png), [escritorio](qa-travel-v12/lake-fireworks-desktop.png) |
| Mirador en móvil | [Vertical](qa-travel-v12/lake-fireworks-phone.png), [horizontal](qa-travel-v12/lake-fireworks-landscape.png) |
| Sofá | [Comparación y variantes](SOFA-V12.md) |

Las once capturas de viajes terminaron sin errores JavaScript ni recursos
fallidos: [resultado](qa-travel-v12/travel-result.json). Usan los recorridos
reales y las acciones para obtener los recuerdos, sin insertar un progreso
ganado. Para reproducir el cuadro de fuegos en las capturas se usa movimiento
reducido; las pruebas de navegador comprueban también la animación activa.

## Repetir

```sh
npm test
npm run art:check
npm run build
npm run test:e2e
```

Los recorridos nuevos están en `travel-v12.spec.js`, `sofa-v12.spec.js`,
`lakeside-component-v12.spec.js` y `personal-video-v12.spec.js`. La prueba del
video personal se omite expresamente si no hay ningún archivo instalado; el
estado vacío tiene cobertura independiente.

Con Vite activo, `node scripts/capture-travel-v12.mjs` y
`node scripts/capture-sofa-v12.mjs` repiten las capturas. Admiten
`ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`.

Para comprobar una compilación se puede servir `dist` con `npm run preview`
y apuntar Playwright a ese servidor. En esta revisión se ejecutaron
`travel-v12.spec.js` y `personal-video-v12.spec.js` contra Vite preview en
el puerto 5186, con un único trabajador. No se creó ni se sustituyó ningún
video para esas comprobaciones.
