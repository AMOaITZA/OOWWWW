# Final V10 · peluches, Ponyo y nuestra casita

La revisión utiliza el juego real en Chromium y conserva las opciones de ropa,
cabello y lentes. La misión se completa mediante los botones de pesca: no se
inserta una colección completa para probar el desbloqueo de Ponyo.

## Validación final

- `npm test`: **184/184 aprobadas**.
- **80 casos de navegador verificados**. La ejecución completa aprobó 77;
  tres comprobaciones antiguas de cantidad de destinos se actualizaron para
  incluir la pesca y aprobaron al repetirlas. Ahora comprueban también que
  Pesca exista y Ponyo siga oculto antes de ganar la misión. No requirieron
  cambios del juego.
- **3/3 recorridos V10 aprobados también en la versión compilada**, servida por
  Vite preview: colección completa y Ponyo, las tres actividades con los
  atuendos elegidos, y navegación y acciones mediante toques y rotación.
- **4/4 pruebas de componente de pesca aprobadas**, incluidas en los 80 casos:
  pique perdido y reintento, teclado, movimiento reducido y limpieza al cerrar.
- `npm run art:check`: **81 PNG**, recursos presentes, dimensiones, alfa y
  paletas aprobados. `npm run build`: aprobado; conserva los avisos heredados
  de los scripts de la página clásica.

Las pruebas unitarias incluyen la colección y sus límites, cinco hallazgos
distintos, guardado y recuperación, bloqueo de Ponyo hasta completar la misión,
su frase exacta y duración, pausa, rutas a los catorce destinos y estados de la
casita. El estanque continúa bloqueando el agua: un toque desde lejos lleva
ahora a la orilla de pesca, donde otro toque o E abre la actividad.

## Recorrido de integración

`tests/e2e/finale-v10.spec.js` tiene **tres casos aprobados** en la ejecución
enfocada. Comprueban:

1. Ponyo no aparece como destino antes de completar la misión. Se juegan cinco
   capturas reales, se obtienen los cinco peluches distintos y se cargan sus PNG.
   Después de recargar, la colección sigue completa. Se camina desde el lago
   hasta Ponyo usando el mapa y al acariciarlo aparece exactamente
   **«ponyo ponyo que divertida es»** en el globo de Leo.
2. Comer, dormir y ver la tele producen tres imágenes distintas del interior.
   Se inspeccionan también las fuentes reales de `drawImage`: Itza usa sus
   variantes de novia rubia sin lentes, caminando y sentada; Leo conserva su
   segundo conjunto sin lentes. La selección de actividad se mantiene al
   cerrar y reabrir la casa.
3. En un celular emulado se pesca con toques reales, se camina hasta la casita,
   se usan las tres actividades y se gira a horizontal. El cierre permanece
   accesible y no hay desbordamiento horizontal. El canvas conserva su relación
   16:9 y cabe entero en el contenido visible en una pantalla de 844 × 390.

La prueba de celular se repitió después de compactar el interior en pantallas
bajas y volvió a aprobarse. Las **15 capturas finales** se generaron después
de ese ajuste, con cero errores JavaScript y cero recursos del juego fallidos.

El recorrido completo de colección utiliza la preferencia de movimiento
reducido: espera el pique real de 1,5 segundos y permite pulsar Sacar sin
fecha límite. La variante con ventana de 2,8 segundos, la pérdida del pique,
el reintento, el teclado y la limpieza de los temporizadores se comprueban
por separado en `fishing-component-v10.spec.js`.

Las rarezas determinan el orden de los hallazgos. Mientras falten peluches,
se elige uno de los que faltan; así cinco capturas exitosas permiten terminar
la misión sin una espera aleatoria ilimitada. Después pueden salir repetidos.

## Evidencia visual

- Pesca: [inicio](qa-finale-v10/fishing-desktop-start.png),
  [pique](qa-finale-v10/fishing-desktop-bite.png),
  [primer hallazgo](qa-finale-v10/fishing-desktop-first-plush.png) y
  [misión completa](qa-finale-v10/fishing-desktop-complete.png).
- Los cinco peluches: [colección en computadora](qa-finale-v10/fishing-desktop-collection.png)
  y [colección en celular](qa-finale-v10/fishing-phone-collection.png).
- [Ponyo junto a los gatitos y la frase de Leo](qa-finale-v10/ponyo-desktop.png).
- Comer: [computadora](qa-finale-v10/home-eat-desktop.png) y
  [celular](qa-finale-v10/home-eat-phone.png).
- Dormir: [computadora](qa-finale-v10/home-sleep-desktop.png) y
  [celular](qa-finale-v10/home-sleep-phone.png).
- Televisión: [computadora](qa-finale-v10/home-tv-desktop.png),
  [celular vertical](qa-finale-v10/home-tv-phone.png) y
  [horizontal](qa-finale-v10/home-tv-landscape.png).
- [Estado de la misión obtenida durante la captura y errores de recursos](qa-finale-v10/result.json).

Ponyo tiene un lugar junto a los otros gatos después de completar la misión y
también aparece en el rincón de la casita. La visita exterior mantiene libres
los tres gatos, los personajes y el globo de diálogo. Las escenas de la casa
usan el interior ilustrado real, con los personajes colocados en las sillas,
las almohadas o el sofá.

## Reproducción

Con Vite iniciado:

```sh
node scripts/capture-finale-v10.mjs
```

Se pueden cambiar `ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`.
La captura de misión juega los cinco hallazgos y conserva ese estado real para
las imágenes posteriores. El móvil emula entrada táctil en 390 × 844 y
844 × 390; no se ha probado esta revisión en teléfonos físicos.

La comprobación compilada utiliza `npm run build` y Vite preview en el puerto
5184 como `baseURL` de `finale-v10.spec.js`. Esta revisión usa el Chromium del
sistema mediante una configuración temporal, sin cambiar la configuración
habitual versionada del proyecto.
