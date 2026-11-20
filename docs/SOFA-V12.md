# Sofá V12: sentados sobre el asiento

La pareja estaba dibujada demasiado arriba, encima de los cojines decorativos.
Además, el rectángulo usado para restaurar el frente del sofá empezaba en la
fila 187 y tapaba casi todo el cuerpo inferior. La pose trasera tenía las
piernas demasiado rectas para comunicar que estaban sentados.

Ahora Leo e Itza se sientan juntos con las piernas cruzadas sobre el asiento.
Se generó un atlas propio de dos poses por cada uno de los seis atuendos; el
comedor conserva su recurso anterior. El cabello y la cabeza siguen siendo los
personalizados del juego. El frente del sofá se restaura desde la fila 211,
debajo de los cuerpos completos, y una pequeña sombra de contacto los apoya
en el asiento. El video y sus controles no cambian.

| Vista | Referencia anterior | Resultado |
| --- | --- | --- |
| Boda en el sofá | [V11](qa-magic-v11/after-home-tv-desktop.png) | [Detalle V12](qa-sofa-v12/sofa-detail-boda.png) |
| Conjunto principal | — | [Detalle](qa-sofa-v12/sofa-detail-principal.png) |
| Conjunto alternativo | — | [Detalle](qa-sofa-v12/sofa-detail-alternativo.png) |
| Casita móvil | [V11](qa-magic-v11/after-home-tv-phone.png) | [V12](qa-sofa-v12/phone-boda.png) |

La revisión propia de esta corrección aprobó **2 pruebas unitarias y 3 de
navegador**. La prueba de navegador compara los píxeles opacos de las piernas
de ambos actores contra el lienzo final en los tres conjuntos: todos siguen
visibles después de dibujar los muebles. También se capturaron seis escenas
reales de escritorio/móvil, tres detalles del sofá y las 120 variantes de
cuerpos personalizados, sin errores JavaScript ni recursos fallidos.

- [Matriz de Itza](qa-sofa-v12/itza-all-personalized-seated-v11.png).
- [Matriz de Leo](qa-sofa-v12/leo-all-personalized-seated-v11.png).
- [Resultado de escenas](qa-sofa-v12/result.json).
- [Procedencia del atlas](SOFA-V12-GENERATION.json).

Para repetir las escenas: `node scripts/capture-sofa-v12.mjs`, con Vite activo.
Para repetir la matriz completa del renderer compartido:
`ART_CAPTURE_DIR=docs/qa-sofa-v12 node scripts/capture-face-quality-v11.mjs`.
Las capturas usan Chromium de sistema o `ART_CHROMIUM_PATH`, y admiten
`ART_CAPTURE_URL` y `ART_CAPTURE_DIR`. Son pruebas móviles emuladas.
