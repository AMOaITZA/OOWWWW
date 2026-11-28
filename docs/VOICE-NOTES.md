# Audios personales para la grabadora

Guarda tus archivos en **`assets/game/voice-notes/`** con estos nombres:

```text
mensaje-01.mp3
mensaje-02.mp3
mensaje-03.mp3
```

Continúa hasta `mensaje-99.mp3` si quieres. Usa MP3, minúsculas y siempre dos
dígitos. Puedes dejar números sin usar; solo se muestran los archivos que
existen, en orden. No hace falta editar JSON ni JavaScript.

Después de copiarlos, arranca o reinicia `npm run dev` y visita **La grabadora de
Leo** desde el mapa. Para publicarlos, incluye los archivos en la rama de
despliegue y reconstruye con `npm run build`.

La grabadora permite elegir, reproducir, pausar, volver al inicio, cambiar
volumen y buscar una posición. Elegir un mensaje o entrar al lugar no empieza
la reproducción. Al reproducir se pausa la música; al cerrar se detiene el
mensaje y se recuerda la selección, el volumen y la posición. La música no se
reanuda automáticamente.

La carpeta está vacía en esta entrega. El catálogo se crea con los MP3 realmente
instalados y no hace peticiones a nombres ausentes. El audio del visitante no se
graba ni se sube a ningún servicio.
