# Jardín animado y transiciones V9

Esta entrega implementa la segunda propuesta elegida: transiciones breves y
detalles animados en el mundo.

## Al visitar los lugares

Las trece experiencias aparecen con una entrada de 220 ms: el papel sube unos
pocos píxeles y la cabecera y el contenido entran con una separación breve.
Al cerrar, el papel desaparece en 160 ms. El foco, los controles, el audio y la
limpieza de cada experiencia se liberan inmediatamente; la salida visual no
retrasa el regreso al mapa.

La salida reutiliza el papel real en una capa decorativa inerte, sin clonar
identificadores, audio ni canvas. Reabrir, abrir el mapa, girar la pantalla,
ocultar la pestaña o cambiar la preferencia de movimiento cancela esa capa
antes de reutilizar la ventana.

## Pétalos, agua y luces

- Los cerezos dejan caer pétalos rosados y las jacarandas, pétalos lavanda.
  Nacen cerca de las copas y caen despacio con una pequeña deriva lateral.
- El jardín tiene un nuevo estanque debajo y a la derecha del lugar de la
  carta. Su dibujo incluye piedras cálidas, juncos y nenúfares. Las ondas se
  dibujan únicamente en los píxeles de agua del recurso original.
- Las farolas nocturnas tienen un brillo cálido que varía lentamente. Las
  luciérnagas se desplazan unos pocos píxeles, con un pequeño grupo cerca del
  estanque. El cielo no parpadea.

El estanque ocupa 144 × 96 píxeles lógicos en el origen (728, 422). El mapa
general lo muestra y las rutas rodean su orilla. Si una partida anterior
estaba guardada dentro de esa zona, se conserva el progreso y se traslada la
pareja a una orilla cercana.

## Movimiento y coste

Los efectos comparten el bucle del juego y un reloj que avanza solo mientras
el mundo está visible. Se pausan detrás del mapa y las experiencias, y cuando
la pestaña se oculta; no acumulan tiempo que luego deban recuperar.

El presupuesto global permite hasta 50 pétalos y siete ondas; solo se dibujan
los que entran en cámara. El mundo actual prepara 46 pétalos repartidos entre
sus árboles floridos. La máscara del agua y el halo de las farolas se calculan
una sola vez; no se leen imágenes ni se crean gradientes radiales cada frame.
El PNG nuevo pesa aproximadamente 6 KB y tiene 48 colores y transparencia real.

Con «reducir movimiento», las ventanas cambian inmediatamente, no caen pétalos
ni se animan las ondas y las luces mantienen un aspecto estable. El modo de
día y noche y su ciclo de cinco minutos siguen utilizando el reloj real.

Consulta [las pruebas y capturas](QA-AMBIENCE-V9.md) y la
[procedencia del estanque](POND-V9-GENERATION.json).
