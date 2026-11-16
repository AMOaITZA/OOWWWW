# OOWWWW — unificación de Leo e Itza, V3

> Documento de la entrega V3. [V4](WORLD-V4.md) precisa el look 1 y reemplaza
> la pareja cotidiana sentada por poses independientes para cada atuendo.

Esta revisión sustituye el arte anterior del look 1, los trajes de caminar de
boda y las secuencias de la ceremonia por el estilo chibi limpio de la nueva
pareja sentada que el usuario señaló como referencia. Se mantienen sus rasgos
reconocibles: pelo corto oscuro y lentes de Leo; pelo largo oscuro, lentes y
flor/velo de Itza cuando viste de novia. La piel usa la paleta de referencia.

## Recursos de personajes

| Uso | Archivo | Contrato |
| --- | --- | --- |
| Look 1 de Leo | `assets/game/characters/leo/look-01.png` | 192 × 144, 6 × 3 celdas de 32 × 48; conserva el vestuario guinda y oscuro. |
| Look 1 de Itza | `assets/game/characters/itza/look-01.png` | 192 × 144, misma cuadrícula; conserva su top oscuro y falda de mezclilla. |
| Leo caminando de boda | `assets/game/wedding/characters/leo-walk.png` | 192 × 144, 18 fotogramas; traje formal y lentes. |
| Itza caminando de boda | `assets/game/wedding/characters/itza-walk.png` | 192 × 144, 18 fotogramas; vestido, pelo largo, lentes y velo/flor. |
| Reposo de la pareja | `assets/game/wedding/characters/idle.png` | 128 × 48, dos celdas de 64 × 48. |
| Votos | `assets/game/wedding/characters/vows.png` | 256 × 48, cuatro celdas de 64 × 48. |
| Beso | `assets/game/wedding/characters/kiss.png` | 192 × 48, tres celdas de 64 × 48. |
| Abrazo | `assets/game/wedding/characters/hug.png` | 128 × 48, dos celdas de 64 × 48. |
| Celebración | `assets/game/wedding/characters/celebrate.png` | 192 × 48, tres celdas de 64 × 48. |

Las hojas de caminar conservan filas de frente, perfil derecho y espalda; el
perfil izquierdo se refleja al renderizar. Las dos primeras columnas son reposo
y las cuatro siguientes forman el ciclo de caminar. El look 2 y las nuevas
poses sentadas cotidiana y de boda de la revisión V2 ya tenían el estilo
solicitado y se conservan.

## Sustitución del arte anterior

Los archivos del look 1 se reemplazan en su ruta habitual. El atlas de boda
mantiene sus dimensiones 720 × 342 y las 19 regiones para conservar las rutas y
las decoraciones, pero **sus regiones de personajes contienen ahora los mismos
píxeles nuevos de los PNG individuales**. No queda una segunda versión visual
antigua escondida en esas regiones.

Se retiran la banca miniatura anterior y su referencia de respaldo. También se
eliminan los generadores de figuras de contingencia que pintaban ropa formal
sobre otros personajes. Si el atlas no se puede cargar, el juego solicita los
PNG nuevos independientes; sigue usando a los mismos personajes del nuevo
estilo y muestra el estado de respaldo correspondiente.

Los identificadores de guardado `principal`, `alternativo` y `boda` no cambian.
Las partidas y elecciones anteriores siguen resolviendo los conjuntos nuevos.
No se modifican las fotografías, cartas, frases ni demás contenido personal.

## Coherencia técnica

- PNG con transparencia real y alfa binaria en las hojas de personajes.
- Paleta limitada por hoja; el presupuesto del escenario se comprueba aparte.
- Piel de referencia: `#C78768`, `#926759` y `#D3B2A0`, sin aclaración global.
- Celdas completas, márgenes laterales/superiores y pies alineados entre frames.
- Anclajes de ceremonia en `game/data/character-frames.json`, medidos sobre el
  contenido visible y comprobados contra los píxeles reales de cada secuencia.
- Render sin suavizado; la escala de la pareja conserva la continuidad de la
  ceremonia, los controles y los seis capítulos existentes.

## Comprobaciones específicas

Las pruebas de arte comprueban los seis conjuntos de caminar de Leo e Itza,
las cinco nuevas secuencias, los colores de piel presentes en las caras, la
cuadrícula, la transparencia y los gestos distintos. Comparan cada región de
personajes del atlas con su PNG nuevo y rechazan las huellas de las regiones
retiradas, para que la sustitución sea efectiva.

Las pruebas de navegador recorren el look 1 y el de boda de ambos personajes:
tres direcciones, caminata visible, selección independiente y persistencia.
Otra prueba fuerza el fallo del atlas y verifica que se cargan los siete PNG
nuevos, que la fuente declarada es `standalone` y que los seis capítulos siguen
abriendo con esos recursos.

Estas comprobaciones técnicas complementan la revisión de capturas reales;
no sustituyen la evaluación visual de caras, postura, proporciones y estilo.
Los resultados finales y capturas de esta entrega se documentan en el informe
de QA correspondiente.
