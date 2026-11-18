# Pesca, Ponyo y nuestra casita

## Una colección para Ponyo

Abre **Mapa → Pesca · Lago de los peluches**, o toca el estanque para acercarte
a la orilla. Cuando llegues, vuelve a tocar el agua o pulsa E para abrir la
pesca.

Pulsa **Lanzar la caña**, espera el pique y pulsa **¡Sacar!**. También funcionan
Enter y la barra espaciadora sobre el botón. Si se escapa, puedes intentarlo
otra vez. Con movimiento reducido no hay límite de tiempo para sacar la captura.

Cada captura es uno de los cinco peluches: Freddy, Bonnie, Chica, Foxy o Golden
Freddy. Sus rarezas influyen en el orden. Los personajes que faltan tienen
prioridad, de modo que cinco capturas exitosas completan la misión. Después
puedes seguir pescando y conseguir repetidos.

Al completar la colección, **Ponyo aparece junto a Los gatitos** y se añade
**Ponyo · Acariciar** al mapa. Al visitarlo o pulsar E cerca, Leo dice:

> ponyo ponyo que divertida es

La frase usa también su vocecita si está activada. Se deja terminar antes de
una frase aleatoria. Ponyo muestra una pose contenta y un corazón al acariciarlo.
Su dibujo se creó a partir de las fotos compartidas: gris con manchas crema y
ojitos verdes dorados. La colección y el desbloqueo se conservan al recargar.

## Nuestra casita

**Nuestra casita** es un destino nuevo del mapa, al suroeste del camino central.
Tiene exterior propio e interior con cama, comedor, sofá y televisión. Dentro
se puede elegir:

- **Comer juntos:** la pareja se sienta a la mesa, con comida y vapor suave.
- **Dormir juntos:** se acuestan bajo la manta, con ojos cerrados y «zzz».
- **Ver la tele:** se sientan en el sofá y la pantalla muestra una escena animada.

Las tres acciones cambian el dibujo real, muestran una frase de Leo y conservan
los atuendos, colores de pelo y lentes elegidos. Se guarda la última actividad.
Ponyo también tiene un rincón en la casa después de completar la colección.

El interior cabe completo en celular horizontal; el resto de la ventana puede
desplazarse. Las animaciones se detienen al cerrar y respetan movimiento reducido.

## Recursos y partida

Los cinco peluches son iconos pixel art originales definidos en SVG y exportados
a PNG transparente de 64 × 64. Los SVG y el empaquetador están incluidos. Ponyo
tiene dos poses de 32 × 32; la casa usa exterior de 160 × 128 e interior de
480 × 270. Véanse las procedencias de [peluches](PLUSHES-V10-GENERATION.json),
[Ponyo](PONYO-V10-GENERATION.json) y [casita](HOME-V10-GENERATION.json).

La pesca se guarda en `save.fishing` y la casa en `save.home`, dentro de la
partida existente. El desbloqueo se deriva de la colección completa; no depende
de un indicador independiente que pudiera quedar desincronizado. No se elimina
el progreso anterior ni se cambian los atuendos al entrar en la casa.

Consulta [las pruebas y capturas finales](QA-FINALE-V10.md).
