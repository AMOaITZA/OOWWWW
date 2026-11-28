# OOWWWW — ampliación V6

Esta revisión corrige los mechones de perfil señalados en las capturas del
usuario y añade lentes opcionales, árboles grandes, la vocecita de Leo, un
rincón de preguntas y una grabadora para mensajes personales.

## Personajes

La máscara de pelo incluye los mechones laterales que quedaban negros en el
atuendo alternativo y de boda. Conserva la gorra, ropa y rasgos de la cara.
Negro, café, rosa pastel y rubio claro siguen disponibles solo para Itza.

En Armario, cada personaje tiene **Con lentes / Sin lentes**. Las preferencias
son independientes y se guardan con los atuendos. Se usan en caminar, poses
sentadas y las secuencias compartidas de boda. El arte original sigue siendo
el predeterminado con lentes. Los ojos sin lentes proceden de arte generado,
empaquetado en un PNG de 72 × 16; los parches restauran ojos y puente de la nariz.

Los valores `outfits.itza.glasses` y `outfits.leo.glasses` son booleanos;
ausencia significa `true`. El atlas y las hojas base conservan sus píxeles.

## Mundo y descubrimiento

Todos los árboles usan escala entera **2×** respecto al PNG: las especies
nuevas se dibujan a 128 × 224 y los árboles altos anteriores a 96 × 168. La
geometría mide el alfa y ancla las raíces al suelo. Las colisiones del tronco y
los puntos de llegada permanecen transitables.

Hay dos arquitecturas completas nuevas. El rincón secreto está entre los
árboles del noroeste y se puede abrir al acercarse como cualquier edificio.
Su nombre y su destino en el mapa aparecen después de visitarlo por primera
vez. La grabadora sí aparece desde el principio. El contador de lugares no
revela el secreto antes de descubrirlo.

## Preguntas de Leo

El rincón tiene ocho preguntas con opciones. Las respuestas son cariñosas,
sin puntuación ni penalización: «¿Cuál es el color favorito de Leo?» revela
«Noo, el de tus ojos.» y la pregunta por el aroma revela «Noo, el tuyo…».
Se puede volver, repetir la frase, llegar al final y reiniciar. Las elecciones
y la pregunta actual se guardan; reabrir no reproduce voz automáticamente.

## Vocecita

Cada frase nueva de Leo en el mundo y las respuestas del rincón activan una
ráfaga breve de sílabas sintéticas tipo «mimimimi». Web Audio se desbloquea
solo con una interacción; no hay grabación de la voz real ni servicio externo.
El efecto dura menos de un segundo, sustituye la ráfaga anterior y se detiene
al abrir un diálogo u ocultar la pestaña. **Voz: sí/no**, dentro de Música,
permite silenciarlo y conserva la elección.

## Grabadora

La grabadora reconoce los MP3 realmente presentes en
`assets/game/voice-notes/`, llamados `mensaje-01.mp3` a `mensaje-99.mp3`.
La carpeta queda preparada y vacía, con estado sin mensajes y sin peticiones a
archivos inexistentes. Basta copiar los archivos y reiniciar Vite o reconstruir
el sitio; no hay que editar JSON.

Permite seleccionar, reproducir, pausar, volver al inicio, buscar y ajustar
volumen. Solo el botón de reproducir inicia audio. Se pausa la música mientras
habla el mensaje; al cerrar se libera el recurso y se conserva posición,
selección y volumen. La música no se reanuda por sí sola.

Consulta [nombres y carpeta de los audios](VOICE-NOTES.md),
[recursos del mundo](WORLD-V6.md),
[origen de las caras sin lentes](EYES-V6-GENERATION.json) y
[validación y capturas](QA-EXPANSION-V6.md).

Todo se desarrolla en `feat/game-phase-0`. No se modifica `main`, no se fusiona
el PR y no se despliega el sitio.
