# Cocinar juntos — V15

La cocina se abre desde «Más en casa» en la casita. Es una escena completa con una cocina pixel art generada para el juego, personajes personalizados, isla de preparación, ingredientes, mezcla, vapor y platos compartidos.

Hay tres recetas: panqueques con fresas, pasta de domingo y galletitas de chocolate. Cada una requiere sus tres ingredientes, cuatro vueltas de mezcla, tres pasos a fuego lento y servir. Las acciones son manuales y sin límite de tiempo: funcionan igual con teclado, pantalla táctil y movimiento reducido. La receta en curso y las veces que cocinaron cada plato se guardan; completar otro plato conserva las recetas anteriores. «Volver a nuestra casita» mantiene el contexto.

El recetario permite elegir una receta. Los controles tienen áreas de al menos 44 píxeles. Al completar un paso, el foco pasa a la próxima acción disponible. El movimiento reducido conserva el resultado de cada acción sin exigir animaciones, y ocultar o cerrar la escena detiene su ciclo de dibujo.

Los rostros, cabello, lentes y conjuntos proceden de los sprites personalizados actuales. La cocina no dibuja ojos ni elimina partes de la cabeza. El frente de la isla oculta únicamente la base de los personajes; sus manos y utensilios se componen después sobre la mesa. Las mangas de Leo respetan el rojo, verde o traje del conjunto elegido.

`game/cooking.js` contiene la normalización y el progreso independiente de la interfaz. Rechaza ingredientes ajenos o repetidos, pasos fuera de orden y recompensas duplicadas al servir. `tests/cooking-v15.test.js`: tres casos pasan.

Recurso: `assets/game/cooking/kitchen.png`, 640 × 400, opaco, 192 colores. Se generó con `image_gen.imagegen`; `scripts/prepare-cooking-v15.mjs` realiza muestreo al píxel más cercano y limita su paleta. La procedencia se conserva en `COOKING-V15-GENERATION.json`.

## Revisión visual

`scripts/capture-cooking-v15.mjs` recorrió una receta completa en escritorio 1440 × 900, teléfono 390 × 844 y horizontal 844 × 390, con Itza de boda, cabello rosa sin lentes y Leo con el conjunto verde sin lentes. Las diez capturas en `docs/qa-cooking-v15` muestran preparación, mezcla y platos servidos, más el lienzo nativo. No se registraron errores de página. Los botones visibles midieron al menos 44 píxeles y quedaron dentro de cada pantalla.

Se ajustó la escena 80 píxeles hacia arriba en teléfono y 45 en horizontal para mantener las manos, el recipiente y los platos por encima de los controles. Las tres vistas finales se inspeccionaron visualmente.
