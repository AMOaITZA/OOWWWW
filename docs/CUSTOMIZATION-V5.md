# OOWWWW — cabello de Itza, árboles y día/noche V5

Esta revisión añade cuatro colores de cabello solo para Itza, cuatro especies
de árboles y un control de iluminación manual o automático. Parte de `b9bbdae`
y conserva la rama de trabajo `feat/game-phase-0`.

## Cabello

En **Armario → Itza** aparecen **Negro**, **Café**, **Rosa pastel** y **Rubio
claro**. La vista previa permite observar frente, lado, espalda y caminata.
Al seleccionar a Leo no aparece el selector de cabello.

El color se guarda independientemente del conjunto y se conserva en los tres
atuendos, caminatas, bancas y seis capítulos de boda. El negro devuelve el arte
original. Se mantiene la piel, los lentes, la ropa, la gorra, la flor y el velo;
Leo conserva su apariencia.

Las variantes se producen con máscaras en coordenadas nativas y se almacenan
en caché por imagen, perfil y color. No se tiñe el personaje completo ni se
modifican los PNG base. Las máscaras también se aplican a los PNG independientes
si el atlas de boda no carga. La preferencia `outfits.itza.hair` conserva los
IDs `negro`, `cafe`, `rosa` y `rubio`. Partidas antiguas usan negro.

## Árboles

Se mezclan cerezos rosados, jacarandas lavanda, robles y abedules con cuatro
árboles altos anteriores. Se renuevan trece de las diecisiete posiciones, sin
moverlas ni cambiar accesos o colisiones. Los PNG tienen celdas de 64 × 112,
transparencia binaria, escala nativa y una paleta compartida de hasta 48 colores,
validada por separado del presupuesto base de 192 colores.

Consulta los [recursos de árboles](TREES-V5.md) y su
[trazabilidad](TREES-V5-GENERATION.json).

## Iluminación

- **Día** y **Noche** mantienen la elección manual hasta seleccionar otro modo.
- **Automático**, el modo inicial, alterna cinco minutos de día y cinco de
  noche. Volver a Automático comienza un nuevo día de cinco minutos.
- El modo y el inicio del ciclo se guardan. Al volver de una pestaña oculta o
  recargar se calcula la fase con el tiempo real transcurrido.

La noche usa una sombra azul, faroles cálidos y luciérnagas discretas. El cambio
es gradual, o inmediato con movimiento reducido. Solo afecta al canvas del
mundo: controles y experiencias mantienen su propia presentación.

`game/day-night.js` separa el reloj del dibujo. Cada fase dura 300.000 ms. No se
guarda un cambio por fotograma ni se altera la posición de los personajes.

## Validación

Se verifican píxeles de cabello, zonas protegidas, guardado, atuendos, poses,
ceremonia, PNG de árboles y rutas. El reloj se prueba en los límites de cinco
y diez minutos sin esperar esos minutos en tiempo real.

El informe y las capturas están en [QA V5](QA-CUSTOMIZATION-V5.md).
No se modifica `main`, no se fusiona el PR y no se despliega el sitio.
