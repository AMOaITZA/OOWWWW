# Canon digital y álbum de recuerdos (V15)

La cámara portátil está disponible en la barra del mundo y en las actividades con escena. Su cuerpo es una Canon digital retro negra, dibujada como un recurso original en pixel art (`assets/game/camera/canon-retro.svg`), con lente, flash y correa.

## Tomar una foto

1. Abre **Cámara** en el lugar que quieras recordar.
2. Escoge **Tal como estamos** para conservar exactamente la escena, o un **Retrato juntos** de frente o de lado. Los retratos usan los conjuntos, cabello y lentes actuales de Itza y Leo.
3. Pulsa **Tomar foto**. Se captura el canvas del juego sin botones ni ventanas de interfaz. La foto PNG lleva una pequeña fecha y “Itza & Leo”.
4. Abre **Ver nuestro álbum** para ampliar, descargar el PNG o eliminar una foto.

La vista de la cámara ocupa la pantalla completa; Escape vuelve a la misma actividad. No cambia la música. En celular y al girar el dispositivo se adapta el visor y los controles. En movimiento reducido se omite el destello y la actualización continua del visor.

## Almacenamiento

- Fotos binarias en IndexedDB `oowwww-retratos-v1`, almacén `photos`. Cada registro guarda `id`, `blob` PNG, `title`, `pose`, `createdAt`, `width` y `height`.
- `save.camera` solo conserva `{shots,lastPhotoAt}`. No hay imágenes en localStorage.
- Máximo 60 fotos: al llenarse se pide descargar o eliminar alguna, sin borrar recuerdos automáticamente.
- Si el navegador impide usar IndexedDB o se llena su cuota, la foto permanece durante la sesión y la interfaz explica que se debe descargar antes de salir.
- El álbum es propio de ese navegador y origen. No modifica las fotografías originales de la galería del juego.

## Integración

`createCamera({save,onChange,getScene,onAlbum,getOutfits,getCharacterImage,assetImage})` devuelve `open`/`show`, `close`, `isOpen`, `attach`, `mountControl`, `listPhotos`, `getPhoto`, `deletePhoto`, `downloadPhoto` y `dispose`.

`getScene()` devuelve `{canvas,title,container}`. El contenedor es `#experience` para una actividad abierta y `#game-screen` para el mundo. El visor queda dentro del diálogo activo y deja sus elementos anteriores temporalmente inertes; al cerrar restaura foco e interacción. `attach(parent,{getScene})` devuelve una función de limpieza.

`game/experiences/album.js` exporta el `mount` convencional y consume `api.camera`. Su escena es `album` y usa el modo inmersivo del host.

## Verificación propia

`node --test tests/camera-v15.test.js`: cinco pruebas de metadatos, nombres de descarga, blobs de sesión, orden/límite de álbum y rechazo de fotos vacías. Los flujos reales de captura persistente, retrato, descarga, reapertura, teclado y celular se cubren en la integración V15.
