# OOWWWW — QA de ampliación V6

La revisión responde a los mechones de perfil que quedaban negros y añade
lentes opcionales, árboles más grandes, una vocecita para Leo, el rincón
escondido de preguntas y la grabadora de mensajes personales. Parte de
`71ca275` exclusivamente en `feat/game-phase-0`.

## Ejecución

| Comprobación | Resultado |
| --- | --- |
| `npm test` | **145/145 aprobadas**. |
| `npm run art:check` | **Aprobado**: 60 PNG, 0 ausencias, 185 colores base y 48 de árboles. |
| `npm run build` | **Aprobado**, ambas entradas y recursos completos. |
| `npm run test:e2e` | **51/51 aprobadas**, Chromium, escritorio/móvil/horizontal. |
| Casos específicos V6 en navegador | **4/4 aprobados**. |
| Capturas reales | **12**, sin errores JavaScript. |
| Build de producción móvil | Secreto y grabadora abiertos; ojos sin lentes y dos arquitecturas responden **200** en ambas páginas; sin errores ni desbordamiento. |
| Dos MP3 reales temporales | Reproducción, pausa, búsqueda, volumen, cierre, guardado y recuperación aprobados; los archivos se retiraron. |

La configuración temporal del navegador selecciona el Chromium instalado y
conserva las pruebas y configuración del proyecto. No se modifica la
configuración versionada. Las capturas usan movimiento reducido para fijar las
poses y son del renderer real, sin retoques.

## Comprobaciones relevantes

Las máscaras de pelo cubren los mechones laterales de los tres conjuntos,
conservando gorra, cara y ropa. Las pruebas revisan todas las direcciones y
fotogramas. Las caras sin lentes usan parches de ojos naturales generados;
se comprueban frente, perfil, espalda, poses sentadas y secuencias compartidas.
La preferencia es independiente por personaje y persiste al recargar. El arte
predeterminado con lentes permanece intacto. Se incluyen regresiones para las
líneas inferiores de montura de Leo de boda y de perfil alternativo.

Los árboles se dibujan a escala entera 2× con raíces medidas desde su alfa.
Se verifica que no tapen a la pareja en ninguna llegada, incluida la entrada
del castillo, y que todas las rutas permanezcan transitables.

El rincón no figura en el mapa antes de descubrirlo; después queda disponible.
Las ocho preguntas guardan elecciones y navegación. El navegador completa el
recorrido y comprueba la respuesta «Noo, el de tus ojos.», el final y el mapa.

La voz se verifica con osciladores Web Audio reales después de una interacción.
Silenciarla impide nuevas ráfagas y la preferencia se conserva. Las pruebas
unitarias cubren duración, cancelación de frases anteriores, pestaña oculta y
ausencia de soporte de audio, sin impedir el diálogo.

La grabadora vacía no asigna `src`, no reproduce ni pide MP3 inexistentes.
Una prueba adicional generó dos MP3 válidos de cuatro segundos con FFmpeg:
Vite los detectó, elegirlos no reprodujo, el botón de reproducción pausó la
música, y se verificaron pausa, búsqueda, volumen 0,31, reinicio, liberación
del recurso al cerrar y recuperación sin autoplay. El resultado terminó con
`errors: []`. Ambos MP3 se eliminaron; la carpeta final solo contiene README.

## Capturas

| Escena | Captura |
| --- | --- |
| Perfil alternativo café | [Ver](qa-expansion-v6/hair-alternate-brown-profile.png) |
| Perfil alternativo rosa pastel | [Ver](qa-expansion-v6/hair-alternate-pink-profile.png) |
| Perfil alternativo rubio claro | [Ver](qa-expansion-v6/hair-alternate-blonde-profile.png) |
| Perfil de boda rubio claro | [Ver](qa-expansion-v6/hair-wedding-blonde-profile.png) |
| Itza sin lentes | [Ver](qa-expansion-v6/itza-no-glasses-desktop.png) |
| Leo sin lentes | [Ver](qa-expansion-v6/leo-no-glasses-desktop.png) |
| Árboles al norte de Inicio | [Ver](qa-expansion-v6/trees-inicio-desktop.png) |
| Árboles y entrada del castillo | [Ver](qa-expansion-v6/trees-castle-desktop.png) |
| Rincón secreto, escritorio | [Ver](qa-expansion-v6/secret-desktop.png) |
| Rincón secreto, móvil | [Ver](qa-expansion-v6/secret-mobile.png) |
| Grabadora, escritorio | [Ver](qa-expansion-v6/recorder-desktop.png) |
| Grabadora, móvil | [Ver](qa-expansion-v6/recorder-mobile.png) |

La vista de árboles de Inicio usa la posición `[30,8]`, al norte de la casa,
para encuadrar copas completas. Las otras vistas usan sus puntos de llegada.
Escritorio: 1440 × 1000; móvil emulado: 375 × 812.

Para repetir capturas con Vite en ejecución:

```bash
node scripts/capture-expansion-v6.mjs
```

La prueba de MP3 es reproducible con `node scripts/verify-voice-notes.mjs` y
requiere FFmpeg y Chromium. Usa comprobación previa para no sobrescribir
mensajes personales y `finally` para retirar únicamente sus dos archivos de
prueba. No es necesaria para añadir tus propios audios.

## Entrega

Consulta [la ampliación](EXPANSION-V6.md),
[la carpeta y nombres de audios](VOICE-NOTES.md),
[recursos del mundo](WORLD-V6.md) y
[trazabilidad de ojos sin lentes](EYES-V6-GENERATION.json).

Persisten los avisos clásicos heredados de Vite; la compilación termina bien.
Móvil está emulado y las pruebas anteriores de música usan su simulación; la
comprobación adicional de mensajes personales sí usa dos MP3 reales. No se
modifican fotos, cartas, frases originales ni música. `main` permanece intacto,
el PR sigue en borrador y esta revisión no despliega el sitio.
