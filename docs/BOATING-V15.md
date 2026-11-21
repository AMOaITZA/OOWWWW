# Las islas de nuestros recuerdos

En el **Muelle de los viajes**, elige **Pasear en barca**. El viaje a Hawái sigue disponible en el mismo embarcadero.

La barca navega por un archipiélago completo, con tres islas ilustradas y sus propios muelles. Toca el agua para remar, usa las flechas o WASD, o elige Cerezo, Estrellas, Jardín y Muelle con los botones. Las rutas rodean tierra firme; el casco tiene un margen de seguridad respecto de las orillas.

Al llegar a cada isla aparece **Abrir el regalo**. También funciona E con el mapa enfocado. Cada regalo contiene un mensaje de Leo y se conserva en el progreso. Volver a una isla permite releerlo. La colección tiene tres regalos; visitar de nuevo no los duplica.

El mapa emplea una cámara con escala de píxeles entera. En teléfono se recorta el entorno y sigue la barca; los personajes conservan su tamaño y su proporción. La pareja lleva los conjuntos, colores de cabello y lentes seleccionados. Las vistas de espalda y frente usan cuerpos sentados completos; el borde del casco oculta la parte baja de forma natural. Los remos giran alrededor de sus apoyos y el agua responde con una pequeña estela. La preferencia de movimiento reducido elimina el balanceo, la estela y los detalles ambientales, manteniendo la navegación disponible.

La partida guarda únicamente `boating: {visits, found}`. La posición del pueblo nunca se sustituye con coordenadas de este mapa. Al salir se cancelan la animación, los observadores y todos los controles de teclado.

## Recursos

- `assets/game/boating/archipelago.png`: mapa opaco de 768 × 512, 192 colores.
- `assets/game/boating/boats.png`: tres cascos con orientación norte, sur y este; 384 × 128, celdas de 128 × 128, transparencia binaria y 128 colores. Oeste refleja el casco este.
- `scripts/prepare-boating-v15.mjs`: empaquetado técnico con muestreo al píxel y paleta limitada; no redibuja los recursos.
- `BOATING-V15-GENERATION.json`: procedencia y hashes SHA-256.

## Verificación

`node --test tests/boating-v15.test.js`: cinco comprobaciones aprobadas sobre persistencia, regalos únicos, requisito de cercanía, rutas de agua entre todos los destinos y escalado de pantalla.

Capturas con los controles reales en Chromium: escritorio 1440 × 900, teléfono 390 × 844, horizontal 844 × 390 y teléfono de 320 × 740. Se navegó a la isla del cerezo y se abrió el regalo; no hubo errores de JavaScript. La partida conservó `boating.found: ['cerezo']`. En 320 px, los cuatro destinos miden 70 × 44 y quedan dentro de la pantalla; el mensaje termina en y593 y el botón empieza en y612. Evidencia en `qa-boating-v15/`.
