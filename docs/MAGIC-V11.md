# Sonidos, tesoros y casita V11

## Efectos de sonido

El mundo tiene pisadas diferentes en hierba y piedra, maullidos al acariciar
a los gatitos o a Ponyo, agua junto al estanque y al pescar, grillos nocturnos
y una campanilla al descubrir un tesoro. Son sonidos originales sintetizados
con buffers de audio, sin descargas ni archivos de terceros.

En **Música → Efectos del mundo** se pueden silenciar y ajustar su volumen.
La preferencia se guarda por separado de la música y la voz de Leo. El sonido
necesita primero un gesto de entrada; los ambientes se pausan al abrir ventanas
o esconder la pestaña. Reproducir el video de la tele da prioridad a su audio.
Las fuentes tienen límites, pausas entre repeticiones y entradas/salidas suaves.

## Secretos y sombras

Hay dos cofres y una carta escondidos. Tócalos o pulsa E cerca para acercarte
y leer sus mensajes, guardar sus recuerdos y ver el progreso de hallazgos.
Solo aparecen como destinos del mapa después de descubrirlos. Se pueden
volver a visitar y escuchar la frase con la voz de Leo.

De noche pasa brevemente una estrella fugaz cada 45 segundos del tiempo activo
del mundo. El efecto es pequeño, evita la pareja y respeta movimiento reducido;
no tiene un bucle independiente ni avanza detrás de las ventanas.

Las estructuras proyectan ahora su silueta real sobre el suelo, con una sombra
de contacto bajo la base. La dirección de luz es compartida, la intensidad
nocturna es menor y las máscaras se conservan en caché. Las sombras no cambian
las zonas de clic ni las colisiones.

## Caras y cuerpos sentados

Se eliminan los restos del puente y las monturas que se estaban interpretando
como una nariz, y se corrige la frontera del lente derecho de Itza que la
máscara clasificaba como cabello. Los ojos tienen pupilas coherentes a tamaño
nativo; cejas, labios, contornos, alfa, pelo y ropa se conservan alrededor del
campo medido de los lentes. La corrección cubre ambos personajes y los tres
conjuntos, al caminar, sentarse y en las poses de boda.

En el comedor se usan cuerpos sentados de perfil mirando hacia la mesa. Para
la tele se usan cuerpos sentados de espaldas, con torso y piernas, en lugar
de recortar solamente las cabezas. Se componen con las cabezas y el cabello
personalizados reales para conservar todos los atuendos, colores y lentes.
Se corrigió también el espacio transparente de la espalda del conjunto con
gorra. La revisión visual incluye 120 variantes de personajes y poses.

## Tu video

Guarda tu archivo como **`assets/game/home/videos/nuestro-video.mp4`**.
Después reinicia `npm run dev` y abre **Nuestra casita → Ver la tele →
Reproducir video**. Para una versión compilada hay que volver a ejecutar
`npm run build` después de añadirlo. Se recomienda MP4 H.264 con audio AAC;
también se admite `nuestro-video.webm`.

El mismo video se dibuja dentro de la pantalla de la tele y puede abrirse en
grande. Tiene controles de reproducción, volumen, silencio y avance. No se
solicita un archivo ausente ni se reproduce automáticamente al entrar. Cambiar
de actividad, esconder la pestaña o cerrar la casa pausa y libera el video.

La comprobación utilizó un clip original temporal en desarrollo y en una
compilación real: se verificaron 40 cuadros dibujados, cambios en los píxeles de
la tele, guardado, controles y limpieza. El clip se retiró y la compilación se
regeneró sin él. Consulta [las instrucciones del video](HOME-VIDEO.md).

## Validación

Consulta [las pruebas y comparaciones V11](QA-MAGIC-V11.md), la
[procedencia de los cofres y la carta](HIDDEN-SECRETS-V11-GENERATION.json)
y [la de los cuerpos sentados](HOME-BODIES-V11-GENERATION.json).
