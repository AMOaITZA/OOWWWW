# OOWWWW — guía visual de continuidad

Esta guía parte de los PNG reales del juego. No sustituye a Leo, Itza ni las
fotografías, cartas y recuerdos originales. El mundo sigue siendo un paseo
íntimo, cálido y fantástico, sin elementos de combate o ambientación medieval
genérica.

## Escala y perspectiva

- Lienzo lógico: 480 × 270; mapa: 1920 × 1280; casilla: 16 × 16.
- Cada personaje ocupa una celda de 32 × 48. Seis columnas y tres filas:
  frente, lado derecho (reflejado para izquierda), espalda. Columnas 0–1:
  reposo; 2–5: caminata. Los pies comparten la línea inferior de la celda.
  No ajustar la altura por el cabello, los brazos o el vestido de cada frame.
- Mantener la identidad: pelo corto oscuro y chamarra guinda de Leo; pelo
  largo oscuro y vestuario original de Itza; lentes y rasgos de ambos.
  La ropa de boda cambia el atuendo, conserva las caras.
- La pareja sentada usa celdas 64 × 48 con el mismo anclaje en el suelo.
  La banca del mundo mide 56 × 40. Los gatos se dibujan a 40 × 32 desde
  un PNG de 80 × 64. La escala debe evaluarse en el mapa junto a la pareja.
- Las lámparas usan el PNG 48 × 47 a escala uniforme 2× (96 × 94),
  anclando la base visible al suelo; no alargar solo su altura.
- Los edificios clásicos son 144 × 85, con techo independiente 152 × 34.
  El castillo utiliza fachada 264 × 154 y techo 280 × 86: los elementos
  se componen con anclajes definidos, sin deformarlos para rellenar huecos.
- Perspectiva frontal con una vista superior discreta del suelo. El orden
  de profundidad depende de los pies/base, no del borde superior del dibujo.
  Conservar libres las llegadas indicadas en los datos de lugares y momentos.

## Color y detalle

El mapa actual combina 156 colores opacos, con presupuesto de 192; las
secuencias de recuerdos y boda tienen sus propias paletas. No aplicar el
presupuesto del terreno a las fotografías.

| Función | Colores de referencia |
| --- | --- |
| Contorno cálido | `#2E1F18`, pelo `#1B120E` |
| Crema/luz | `#FFF1DC`, `#F3D9B1` |
| Rosa | `#B5656F`, rosa empolvado de boda `#CF8CA1` |
| Dorado | `#F2C46D`, `#EEC68D` |
| Verde suave | `#527B56`, `#669274` |
| Azul apagado | `#607D91` |

Conservar bordes de píxel deliberados, contornos oscuros cálidos y sombras
cortas en la base. Evitar resplandores grandes que tapen los rostros, ruido
extra en sprites pequeños y degradados con cientos de colores. Las flores,
pétalos y destellos acompañan la escena, sin competir con los personajes.

## Render y movimiento

`imageSmoothingEnabled=false` en cada canvas; `image-rendering: pixelated`
en su representación. Dibujar en coordenadas enteras. Las escalas de
cámara y transición deben ser moderadas; el movimiento no debe alterar las
proporciones del sprite. El armario usa la misma cadencia de caminata de
130 ms por frame que el paseo.

Mantener todas las acciones con un anclaje estable: llegar a la banca,
sentarse, reposar y levantarse. Para acariciar, acercamiento, reacción y
regreso al reposo. Las partículas terminan su ciclo y se limpian al cerrar
la escena. No desplazar el dibujo de la pareja para resolver una colisión;
resolver la ruta o el anclaje correspondiente.

## Transparencia y revisión de nuevos recursos

Los PNG del mundo usan alfa binaria. El atlas de boda heredado contiene
alfa intermedia; el cliente la normaliza a 0/255 con umbral 128 antes de
dibujar. No convertir repetidamente ese atlas ni regenerarlo para una
corrección de escala o composición que se pueda resolver en el render.

Una exportación nueva debe tener transparencia real, sin tablero pintado,
sin fondos JPEG, sin píxeles de otra celda y sin cortes en caras/pies. Rechazar
una hoja cuyas celdas estén vacías o cuyo tamaño no coincida con su contrato.
La comprobación automatizada detecta dimensiones, ausencia de archivos,
regiones vacías y alfa; no demuestra por sí sola que la imagen sea correcta.

Revisar capturas de escritorio y móvil al tamaño de juego, además de las
hojas de sprites. Mirar caras, sombras, bancas, gatos, globos y las seis
poses de boda. No declarar definitiva una ilustración sin revisar su uso
junto a los recursos originales.


## Tipografía

Press Start 2P identifica títulos, Silkscreen los controles y VT323 la lectura.
Se incluyen los cuatro TTF usados (Silkscreen tiene pesos 400 y 700), sin
cambiar las familias originales. Se sirven desde `assets/game/fonts/` y se
conservan las tres licencias SIL Open Font License junto a los archivos.
