# OOWWWW — árboles y destinos V6

Los árboles se dibujan al doble de su tamaño nativo, sin cambiar las posiciones
ni las colisiones de sus troncos. Las cuatro especies nuevas de 64 × 112 usan
celdas de dibujo de 128 × 224; los árboles altos anteriores de 48 × 84 se
dibujan a 96 × 168. Su copa visible depende de los márgenes transparentes.

`game/tree-layout.js` mide el alfa real y alinea las raíces opacas con el suelo.
El escalado entero conserva píxeles nítidos. Las pruebas comprueban que las
copas completas no ocultan a la pareja en las llegadas de los edificios,
incluida la entrada del castillo. No se mueve ninguno de los diecisiete árboles.

Se añaden dos destinos ilustrados:

- `architecture/secreto.png`: arco de hiedra y flores, banco íntimo y atril.
- `architecture/grabadora.png`: estudio de madera, flores y emblema de cassette.

Ambos PNG completos tienen celdas de 160 × 128, transparencia binaria y la
misma línea de escalones en la fila 119. Comparten una paleta de hasta 128
colores. El generador y las huellas de los archivos se registran en
[DESTINATIONS-V6-GENERATION.json](DESTINATIONS-V6-GENERATION.json). El archivo
fuente permanece intacto; `scripts/prepare-destinations-v6.mjs` realiza recorte,
empaquetado, muestreo uniforme y normalización técnica del alfa.
