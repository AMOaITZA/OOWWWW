# El sillón mirando hacia la tele

El sillón ahora abre hacia arriba, en dirección a la televisión. Su respaldo
tapizado se ve desde atrás en el borde inferior del asiento, detrás de Itza y
Leo. Sus cabezas y la parte alta de la espalda quedan completas; las piernas
quedan ocultas de forma natural por el respaldo.

Se editó el arte con `image_gen` y se empaquetó únicamente la región del mueble
en un parche nativo de 124 × 84 píxeles. Usa los colores de la habitación
original y no cambia ningún píxel fuera de esa región. El archivo original del
interior se conserva intacto. Los conjuntos, el cabello y los lentes siguen
siendo los personalizados del juego; el video y sus controles se conservan.

## Comprobación

Pasaron **3 pruebas unitarias y 3 de navegador**. El navegador compara todos los
píxeles opacos de la cabeza y la parte alta de la espalda con el resultado final
en los tres conjuntos; el respaldo no los tapa. También comprueba que las
rodillas quedan detrás del respaldo. Se revisaron visualmente las capturas
reales del juego en escritorio, celular vertical y horizontal.

- [Sillón de espaldas](qa-sofa-turn-v14/detail-principal.png).
- [Boda](qa-sofa-turn-v14/detail-boda.png).
- [Celular](qa-sofa-turn-v14/phone-boda.png).
- [Horizontal](qa-sofa-turn-v14/landscape-principal.png).
- [Doce capturas sin errores ni recursos fallidos](qa-sofa-turn-v14/result.json).
- [Procedencia y región del parche](SOFA-TURN-V14-GENERATION.json).

Las capturas usan dispositivos emulados. Se pueden repetir con Vite activo:

```sh
node scripts/capture-sofa-turn-v14.mjs
```

Se admiten `ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`. No se
reprodujo ni se capturó el video personal durante esta comprobación.
