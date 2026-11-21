# Verificación de las actividades V15

## Resultado general

- **262/262 pruebas unitarias**, **125/125 pruebas de navegador** en la suite completa.
- Después del último ajuste de encuadre de la cocina, **8/8 flujos V15**
  repetidos y **12/12 casos en producción** aprobados. La regresión final
  termina una receta a 320 px y comprueba que los platos siguen visibles
  después del mensaje de Leo y al girar a horizontal.
- **99 PNG** aprobados por dimensiones, alfa, anclajes y paletas;
  compilación aprobada.
- Video personal y cinco PNG de peluches sin cambios respecto a V14.

## Flujos comprobados

Las **8 pruebas específicas de V15** pasan en Chromium. Se ejercitan los
controles reales de las escenas y sus datos guardados, sin introducir recetas,
flores ni regalos ya ganados.

| Actividad | Comprobación |
| --- | --- |
| Canon y álbum | La foto natural conserva los píxeles de la escena en el instante de captura. Un retrato personalizado produce otra imagen. Dos PNG se guardan en IndexedDB y sobreviven a la recarga; la descarga conserva exactamente los bytes del archivo guardado. Eliminar una foto conserva la otra. |
| Cocina | Una receta completa pasa por tres ingredientes, cuatro mezclas, tres pasos de cocción y servir. Se cuenta una vez y permanece en el recetario al volver y recargar. |
| Huerto | Una semilla se planta, se riega, crece y se recoge. Una flor desbloquea un florero que aparece en la casita y continúa seleccionado después de recargar. |
| Jardín del pueblo | Se llega desde la casita por la ruta real del mapa y se abre la escena del jardín. La llegada permanece transitable. |
| Barca | Se navega a las tres islas, se abren sus regalos y se releen sus cartas. Los tres descubrimientos sobreviven a volver al pueblo y recargar. |
| Celular | Cocina, cámara, jardín y barca funcionan por toque a 320 px y después de girar a horizontal. Los controles quedan dentro de pantalla y la cocina mantiene visible la superficie donde preparan la receta. |
| Pesca | La misma pose de boda con cabello negro y lentes conserva el cuerpo completo cuando expira el intento. Las cinco especies ya obtenidas y la posición de llegada permanecen guardadas. |

La posición y la personalización del pueblo se comprueban después de las
actividades. El álbum se prueba con PNG reales del lienzo; no se sustituye
por archivos de muestra.

En la revisión se corrigieron dos problemas de integración: un nombre local
ocultaba el controlador de la cámara al tocar el mundo, y la barca debía
actualizar el botón para releer cartas también con movimiento reducido.
La suite conserva la regresión de ambos recorridos.

## Evidencia visual

El capturador recorre escritorio (1440 × 900), celular (390 × 844), celular
compacto (320 × 740) y horizontal (844 × 390). Cocina una receta, toma y guarda
un retrato, abre el álbum, cultiva una flor para la casa y navega hasta un regalo.
También reproduce el intento de pesca expirado de la captura del usuario.
Las cuatro capturas de cocina se renovaron tras ajustar el encuadre;
el [resultado de esa revisión](qa-activities-v15/result-cooking.json)
registra cero errores y cero recursos fallidos.
Las **30 capturas** terminaron sin errores JavaScript ni recursos fallidos:
[resultado completo](qa-activities-v15/result.json).

- [Cocina en celular](qa-activities-v15/cooking-shared-phone.png).
- [Canon negra y retrato](qa-activities-v15/canon-camera-phone.png).
- [Álbum en escritorio](qa-activities-v15/memory-album-desktop.png).
- [Huerto en celular](qa-activities-v15/garden-grown-phone.png).
- [Florero en la casita](qa-activities-v15/home-grown-vase-desktop.png).
- [Barca en celular compacto](qa-activities-v15/boating-departure-compact-phone.png).
- [Regalo de la isla en horizontal](qa-activities-v15/island-keepsake-landscape.png).
- [Pesca de boda corregida](qa-activities-v15/fishing-missed-wedding-desktop.png).

Las comprobaciones móviles usan emulación de Chromium; no se realizaron en
teléfonos físicos. Los detalles y capturas adicionales están en las guías
de [pesca](FISHING-V15.md), [cocina](COOKING-V15.md),
[jardín](GARDEN-V15.md), [barca](BOATING-V15.md) y [cámara](CAMERA-V15.md).

## Repetir

```sh
npm test
npm run art:check
npm run build
npx playwright test tests/e2e/activities-v15.spec.js
```

Con Vite activo, `node scripts/capture-activities-v15.mjs` repite las capturas.
Admite `ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`.
