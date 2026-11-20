# Tu video en la televisión

1. Copia tu archivo a **`assets/game/home/videos/nuestro-video.mp4`**.
2. Reinicia `npm run dev`. Si usas una versión compilada, ejecuta de nuevo
   `npm run build` antes de publicarla.
3. Abre **Nuestra casita → Ver la tele → Controles de la tele** y pulsa **Reproducir video**.

El formato recomendado es MP4 con video H.264 y audio AAC. Se admite también
`nuestro-video.webm`, con preferencia por el MP4 cuando existen los dos.
El nombre y las minúsculas deben coincidir exactamente.

La imagen aparece dentro de la pantalla de la tele, conservando su proporción.
Los controles permiten reproducir, pausar, cambiar volumen, silenciar, avanzar
y abrir el mismo video en un tamaño mayor con controles nativos. El archivo se
solicita después de pulsar Reproducir; no se descarga ni se reproduce al entrar.

El video pausa la música y la voz de Leo mediante el controlador principal.
Al cambiar de actividad, ocultar la pestaña o cerrar la ventana, se pausa y
libera su fuente. Guarda posición, volumen y silencio en la partida existente.
Con movimiento reducido, un video iniciado expresamente sigue funcionando;
los adornos del cuarto permanecen quietos.

Cuando aún no hay archivo, la tele muestra su escena de corazones y un mensaje
amable. No hace peticiones a un video inexistente. El catálogo se construye a
partir de los archivos realmente instalados, sin modificar código o JSON.
