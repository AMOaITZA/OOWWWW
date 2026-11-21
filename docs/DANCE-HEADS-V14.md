# Mandíbulas completas al bailar

El compositor cortaba todas las cabezas en la fila 24 del sprite original.
En los recursos reales, la mandíbula de Leo con traje de boda llega a la fila
26 y la del segundo conjunto a la 27. Itza también conserva su barbilla y
contorno por debajo de la fila 23. El recorte eliminaba esos píxeles al bailar.

`game/character-head.js` mide el límite anatómico de cada personaje, conjunto
y dirección. Conserva el rostro y su contorno completos, y solo prolonga el
cuello dentro de una franja estrecha; las mangas y los brazos del atuendo de
caminata quedan fuera. No se escala ni se dibuja una cara sustitutiva.

El cabello largo se compone en una capa separada para conservar los colores
personalizados y dejar visibles los brazos de las poses nuevas. Los cuerpos
del atlas de baile y la secuencia de ocho poses se conservan.

## Comprobación

- **6 pruebas unitarias** aprobadas: las cuatro del baile y dos nuevas de
  conservación de mandíbula/contorno y exclusión de ropa antigua.
- **1 prueba de navegador** aprobada: observa los lienzos que realmente recibe
  `drawImage` y compara píxeles nativos de barbilla y contorno en **240 variantes
  únicas** de personaje, conjunto, pelo, lentes y pose. Conservan color y alfa.
- **48 composiciones** capturadas con el compositor real, sin errores:
  [matriz V14](qa-dance-v14/dance-poses.png) y
  [resultado](qa-dance-v14/result.json).
- [GIF de dos vueltas](qa-dance-v14/partner-dance.gif).

La [matriz anterior](qa-dance-v13/dance-poses.png) permite comparar el recorte.
Las capturas V14 se repiten con Vite activo mediante:

```sh
ART_CAPTURE_DIR=docs/qa-dance-v14 node scripts/capture-dance-v13.mjs
```

La prueba nativa de píxeles está en `tests/dance-heads-v14.test.js` y la del
compositor del navegador en `tests/e2e/dance-heads-v14.spec.js`.
