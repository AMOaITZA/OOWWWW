# OOWWWW — QA de personalización V5

Esta entrega añade el cabello negro, café, **rosa pastel** y **rubio claro**
solo para Itza, cuatro especies de árboles y un selector de Día/Noche/Automático.
Parte de `b9bbdae` en `feat/game-phase-0`. Los tonos claros incluyen la última
corrección del usuario.

## Resultados

| Comprobación | Resultado |
| --- | --- |
| `npm test` | **114/114 aprobadas**. |
| `npm run art:check` | **57 PNG**, ninguna ausencia, 185 colores base y 48 del conjunto de árboles; aprobado. |
| `npm run build` | **Aprobado**, ambas entradas y recursos completos. |
| `npm run test:e2e` | **47/47 aprobadas**, Chromium, escritorio, móvil y horizontal. |
| Pruebas específicas V5 en navegador | **3/3 aprobadas**. |
| Capturas reales | **12**, sin errores JavaScript. |
| Build móvil, atlas de boda bloqueado | Cuatro árboles y siete hojas independientes con respuesta **200**; seis capítulos con cabello rubio claro, modo noche y ninguna excepción JavaScript. |

Las pruebas de cabello recorren 54 fotogramas de caminar, seis sentados y 16
de pareja en la ceremonia. Comprueban variación visible, tonos claros,
transparencia, piel de referencia y conservación de zonas protegidas de lentes,
ropa, gorra y Leo. Negro devuelve la imagen original y mantiene todos sus bytes.

El navegador observa y compara los píxeles RGBA de las imágenes realmente
dibujadas. Comprueba las cuatro selecciones del armario, la ausencia del selector
al elegir a Leo, guardado y recarga, tres atuendos caminando y sentados y los seis
capítulos de boda. Las comparaciones de ceremonia se hacen contra cada PNG
original, además de verificar el color seleccionado.

El reloj se prueba justo antes y después de 300.000 y 600.000 ms. Las opciones
manuales permanecen fijas durante intervalos mayores y al recargar. Volver a
Automático inicia un día nuevo. Se comprueba también que cambiar la iluminación
no altere la posición de los personajes.

Los árboles conservan las diecisiete posiciones, con trece árboles de cuatro
especies nuevas y cuatro altos anteriores. Las pruebas cubren siluetas distintas,
alfa binaria, márgenes, raíces alineadas, presupuesto de color y accesos a todos
los lugares.

## Capturas

| Vista | Captura |
| --- | --- |
| Negro, look 1 | [Armario](qa-customization-v5/hair-black-main-desktop.png) |
| Rosa pastel, look 1 | [Armario](qa-customization-v5/hair-pink-main-desktop.png) |
| Café, look alternativo | [Armario](qa-customization-v5/hair-brown-alternate-desktop.png) |
| Rubio claro, boda | [Armario](qa-customization-v5/hair-blonde-wedding-desktop.png) |
| Mundo de día y árboles | [Día](qa-customization-v5/world-day-desktop.png) |
| Mundo de noche | [Noche](qa-customization-v5/world-night-desktop.png) |
| Rosa pastel en banca | [Banca](qa-customization-v5/bench-pink-desktop.png) |
| Rubio claro en el beso | [Beso](qa-customization-v5/wedding-blonde-kiss-desktop.png) |
| Rubio claro en el final sentado | [Final](qa-customization-v5/wedding-blonde-seated-desktop.png) |
| Armario en móvil | [Móvil](qa-customization-v5/hair-pink-mobile.png) |
| Mundo de día en móvil | [Móvil](qa-customization-v5/world-day-mobile.png) |
| Banca nocturna en móvil | [Móvil](qa-customization-v5/bench-night-mobile.png) |

Se usó Chromium con escritorio 1440 × 1000 y móvil emulado 375 × 812. Las
capturas usan movimiento reducido para fijar las poses relevantes. No se han
retocado. Para repetirlas con Vite en ejecución:

```bash
node scripts/capture-customization-v5.mjs
```

`ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH` permiten ajustar
servidor, salida y ejecutable. La ejecución de navegador de esta entrega usa el
Chromium instalado mediante una configuración temporal que conserva las pruebas
del proyecto; no modifica su configuración versionada.

## Alcance

La [documentación V5](CUSTOMIZATION-V5.md) explica el uso y el guardado. Los
[árboles](TREES-V5.md) tienen su [trazabilidad](TREES-V5-GENERATION.json).
Los archivos de contenido clásico, fotos, cartas, frases, audio, arquitectura,
atuendos y atlas base no se modifican.

Persisten los avisos de Vite de scripts y referencias clásicas heredadas; la
compilación termina correctamente. Móvil está emulado y las pruebas existentes
de audio usan su simulación. No se modifica `main`, no se fusiona el PR y no se
despliega el sitio.
