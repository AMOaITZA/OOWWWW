# Mensajes de Leo

Copia aquí tus grabaciones en formato MP3 y nómbralas:

```text
mensaje-01.mp3
mensaje-02.mp3
mensaje-03.mp3
```

Se admiten `mensaje-01.mp3` hasta `mensaje-99.mp3`, en minúsculas y con dos
dígitos. Puedes poner uno, varios o todos; no hay que crear archivos vacíos ni
editar listas. Se ordenan por número y aparecen como «Mensaje 01», «Mensaje 02».

Arranca o reinicia `npm run dev` para verlos localmente. Para el sitio publicado
debes incluir los MP3 en la rama que se despliegue y volver a ejecutar el build.
El juego descubre los archivos al construir; copiar un archivo a un `dist` ya
construido no actualiza el catálogo.

No hay grabaciones de ejemplo: la grabadora permanece vacía hasta añadir las
tuyas. No se graba ni se envía audio desde el navegador.
