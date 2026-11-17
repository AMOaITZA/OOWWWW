# Apariencia y pantalla completa V8

## Problemas corregidos

Quitar los lentes de Itza sustituía una franja rectangular de la cara por un
parche escalado. Eso alteraba las cejas, el puente de la nariz y el sombreado.
Ahora se restauran las bandas de cada lente por separado, con ojos del recurso
existente a su tamaño nativo. Se conservan los píxeles originales de piel y los
rasgos que no forman parte de la montura.

Las máscaras de cabello de los conjuntos cotidianos omitían mechones junto a
la cara y bajo la gorra. Además, el filtro conservaba todos los píxeles casi
negros, incluso dentro del cabello. Se completan las zonas de cabello y se
tiñen sus sombras interiores. El contorno exterior y la gorra siguen siendo
oscuros. La ropa, piel, flor y velo no cambian de color. La elección de negro,
café, rosa pastel o rubio claro sigue siendo exclusiva de Itza y se guarda.

Estas correcciones se aplican a las hojas de caminata, los personajes sentados
y las poses compartidas de la boda. Los PNG base conservan su resolución y
sus animaciones; las variantes se componen y almacenan en caché al usarlas.

## Mundo de borde a borde

El área del mundo ocupa la ventana. La cámara adapta su ancho y alto lógicos
a la relación de aspecto disponible; deja de depender de un rectángulo fijo
de 480 × 270 centrado en una página marrón.

Cada píxel del mundo utiliza el mismo número entero de píxeles CSS en ambos
ejes: 2 en pantallas pequeñas, 3 en medianas y 4 en grandes. Se recortan hasta
unos pocos píxeles del borde para cubrir tamaños indivisibles, sin estirar los
personajes. El buffer está acotado por las dimensiones del mundo. No se
multiplica por la densidad de pantalla del teléfono.

Los controles flotan sobre el mapa, respetan las zonas seguras del dispositivo
y tienen áreas de toque de al menos 44 px. En horizontal se compactan en una
fila. El mapa general muestra el tamaño real de la cámara. Los toques se
convierten utilizando el buffer actual, también después de cambiar el tamaño
de la ventana o girar el teléfono. Los globos de Leo evitan los controles.
Un observador del marco vuelve a medir su tamaño después de que termine la
rotación, evitando que quede un canvas con las dimensiones intermedias. La
cámara sigue también la pose visible al sentarse, para dejar las cabezas
fuera de los controles en pantallas bajas.

El mundo conserva su último fotograma mientras hay una experiencia o mapa
abierto, evitando redibujarlo por detrás. El ciclo de día y noche sigue
utilizando el reloj real. El título puede desplazarse internamente en pantallas
bajas, para mantener accesible el botón Entrar.

## Cómo ver esta versión

Los cambios están en `feat/game-phase-0`, en la entrada `/game.html`.
Después de actualizar esa rama, inicia `npm run dev` y abre la dirección que
indique Vite seguida de `/game.html`. El modo clásico está en `/`.

Si Git indica que hay cambios locales que impedirían actualizar, guárdalos
en un commit o en un stash antes de volver a hacer pull. No hace falta borrar
tu carpeta ni tu partida. Las opciones de cabello, lentes y ropa siguen en
el almacenamiento local del navegador.

Consulta [la validación y las capturas](QA-V8.md). Las mejoras adicionales
propuestas allí quedan pendientes de la decisión del usuario.
