# Árboles ornamentales V5

El mundo mezcla cuatro especies nuevas con los árboles altos anteriores:
cerezo rosado, jacaranda lavanda, roble verde y abedul claro. Trece de los
diecisiete árboles reciben una especie; cuatro conservan su recurso original.
Las posiciones, colisiones y entradas de edificios permanecen iguales.

Los recursos completos están en `assets/game/trees/{cerezo,jacaranda,roble,abedul}.png`.
Cada celda mide 64 × 112, con un ancho visible máximo de 60 píxeles y raíces
ancladas en la fila 110. Se representan a escala nativa, sin estirar copas ni
troncos. Las siluetas más redondeadas y las alturas distintas aportan variedad
junto a los árboles altos.

El atlas fuente se generó con `image_gen.imagegen`, con cuatro columnas y
fondo transparente. `scripts/prepare-trees-v5.mjs` recorta cada columna,
normaliza el tamaño con muestreo vecino más próximo, aplica alfa 0/255 a partir
del umbral 200 y elimina los píxeles saturados de borde que no pertenecen al
arte. Los cuatro PNG comparten una paleta de hasta 48 colores. Este presupuesto
ornamental se comprueba por separado y no amplía el máximo de 192 colores de
la capa base del escenario.

La [trazabilidad](TREES-V5-GENERATION.json) registra la fuente generada,
recortes y huellas finales. La fuente de resolución grande queda intacta en la
sesión; los PNG nativos necesarios para el juego están en el repositorio.

El renderer usa `objectImage('tree-'+species)` y conserva el árbol anterior
como contingencia si falta una especie. `tests/trees.test.js` comprueba
transparencia, márgenes, pies, paleta, siluetas distintas, distribución de
especies, escala de dibujo y rutas transitables.
