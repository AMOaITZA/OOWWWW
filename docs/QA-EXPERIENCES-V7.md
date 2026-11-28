# OOWWWW — QA de ventanas y cabello V7

Esta entrega parte de `78860a3` y combina el rediseño de las trece experiencias
con la corrección de los mechones de novia que seguían negros. Se trabaja
exclusivamente en `feat/game-phase-0`.

## Ejecución

| Comprobación | Resultado |
| --- | --- |
| `npm test` | **150/150 aprobadas**. |
| `npm run art:check` | **72 PNG**, 0 ausencias; 185 colores base y 48 de árboles; aprobado. |
| `npm run build` | **Aprobado**, ambas entradas y recursos completos. |
| `npm run test:e2e` | **54/54 aprobadas**, Chromium, escritorio, móvil y horizontal. |
| Navegador específico V7 | **3/3 aprobadas**, trece destinos en cada uno de tres tamaños. |
| Capturas de experiencias | **26**: las trece ventanas en escritorio y móvil, sin errores JavaScript. |
| Evidencia del pelo | Comparación antes/después y cuatro vistas reales del armario con novia rubia. |
| Build de producción móvil | **13 experiencias abiertas**, 12 banners nuevos con respuesta 200, carta literal intacta, cierre visible y ningún error JavaScript. |

Los casos específicos recorren las 39 combinaciones de lugar y viewport:
1440 × 1000, 375 × 812 y 812 × 375. Verifican la ilustración realmente cargada,
límites del panel y cuerpo, ausencia de desbordamiento horizontal, cierre fijo
tras desplazar el cuerpo, Escape, foco devuelto al mundo y reapertura arriba.
Durante la revisión se corrigió una regresión real: el scroll se restablece
después de mostrar el diálogo, evitando que el navegador recupere el offset
anterior de un contenedor oculto.

Las pruebas existentes mantienen las comprobaciones de contenido literal,
fotos y leyendas, razones y orden, catálogo musical, recuerdos, contador,
atuendos, lentes, voz, descubrimiento, grabadora y capítulos de boda. Las nuevas
regresiones de pelo comprueban coordenadas concretas de los mechones reportados
en todos los fotogramas, además de las zonas protegidas de cara y vestuario.

## Las trece ventanas

Estas capturas muestran la primera vista del panel real. El contenido largo
continúa en su área de desplazamiento interior; el cierre queda fuera de ella.

| Experiencia | Escritorio | Móvil |
| --- | --- | --- |
| Inicio | [Ver](qa-experiences-v7/inicio-desktop.png) | [Ver](qa-experiences-v7/inicio-mobile.png) |
| Carta | [Ver](qa-experiences-v7/carta-desktop.png) | [Ver](qa-experiences-v7/carta-mobile.png) |
| Galería | [Ver](qa-experiences-v7/galeria-desktop.png) | [Ver](qa-experiences-v7/galeria-mobile.png) |
| Razones | [Ver](qa-experiences-v7/razones-desktop.png) | [Ver](qa-experiences-v7/razones-mobile.png) |
| Playlist | [Ver](qa-experiences-v7/playlist-desktop.png) | [Ver](qa-experiences-v7/playlist-mobile.png) |
| Recuerdos | [Ver](qa-experiences-v7/recuerdos-desktop.png) | [Ver](qa-experiences-v7/recuerdos-mobile.png) |
| Contador | [Ver](qa-experiences-v7/contador-desktop.png) | [Ver](qa-experiences-v7/contador-mobile.png) |
| Lugares | [Ver](qa-experiences-v7/lugares-desktop.png) | [Ver](qa-experiences-v7/lugares-mobile.png) |
| Final | [Ver](qa-experiences-v7/final-desktop.png) | [Ver](qa-experiences-v7/final-mobile.png) |
| Armario | [Ver](qa-experiences-v7/armario-desktop.png) | [Ver](qa-experiences-v7/armario-mobile.png) |
| Boda | [Ver](qa-experiences-v7/boda-desktop.png) | [Ver](qa-experiences-v7/boda-mobile.png) |
| Rincón secreto | [Ver](qa-experiences-v7/secreto-desktop.png) | [Ver](qa-experiences-v7/secreto-mobile.png) |
| Grabadora | [Ver](qa-experiences-v7/grabadora-desktop.png) | [Ver](qa-experiences-v7/grabadora-mobile.png) |

## Pelo de novia

- [Comparación antes/después ampliada, tres colores y ambos estados de lentes](qa-experiences-v7/hair-bride-before-after.png).
- [Frente con lentes](qa-experiences-v7/hair-bride-front-glasses.png).
- [Espalda con lentes](qa-experiences-v7/hair-bride-back-glasses.png).
- [Frente sin lentes](qa-experiences-v7/hair-bride-front-no-glasses.png).
- [Espalda sin lentes](qa-experiences-v7/hair-bride-back-no-glasses.png).

Son **31 imágenes** de evidencia en total, sin retoques. La comparación ampliada
usa el mismo código de máscaras sobre los mismos recursos originales, con la
versión anterior tomada desde Git. Las otras treinta son capturas de la app.

Para repetirlas con Vite en ejecución:

```bash
node scripts/capture-experiences-v7.mjs
node scripts/capture-hair-v7.mjs
```

La ejecución usa Chromium instalado, mediante una configuración temporal que
conserva los tests del proyecto; no modifica su configuración versionada.
El proceso de captura permite ajustar servidor, salida y navegador mediante
`ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`.

## Alcance

Consulta [los cambios V7](EXPERIENCES-V7.md) y la
[trazabilidad de ilustraciones](EXPERIENCE-ART-V7-GENERATION.json).
Se mantienen el modo clásico, los recursos personales, las partidas y todos
los sistemas previos. Móvil está emulado. Los avisos heredados de Vite sobre
scripts y referencias clásicas permanecen; la compilación termina bien.
`main` no se modifica, el PR sigue en borrador y no hay despliegue.
