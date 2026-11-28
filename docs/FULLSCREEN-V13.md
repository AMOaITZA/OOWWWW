# Experiencias como escenas del juego

El host ocupa toda la pantalla. Se quitaron el margen exterior, el marco de
papel, el fondo que oscurecía el mundo y el desenfoque. **Volver** permanece
visible junto a la zona segura del dispositivo; Escape conserva el regreso por
teclado y el foco vuelve al juego.

Las experiencias de lectura usan una cabecera breve y desplazamiento interior.
La casita, la boda y la pesca presentan el escenario completo con sus controles
flotantes. Hawái tiene su propio HUD sobre la isla. El mapa también ocupa todo
el espacio, con destinos accesibles sin un marco de ventana.

En la casita, una cámara calcula la escala uniforme y el encuadre según comer,
dormir o ver la tele. En celular queda suelo bajo los controles para conservar
visibles los dos cuerpos. El video mantiene un desplegable **Controles de la
tele**, y los peluches de pesca se consultan desde **Mis peluches**.

La transición de entrada es un fundido corto de la escena real. Cerrar libera
inmediatamente el módulo y sus controles; no se mueve el contenido a una capa
de salida ni se duplican imágenes animadas, canvas o medios. Movimiento reducido
omite el fundido.

## Verificación

Tres pruebas de navegador aprobaron los límites de pantalla completa, ausencia
de borde y sombra exterior, regreso y restauración del foco, encuadre de las tres
actividades de la casa, controles de al menos 44 px, giro del teléfono y capítulos
de la boda. La comprobación móvil es emulada.

Se capturaron doce vistas reales, sin errores JavaScript ni recursos fallidos:

| Experiencia | Escritorio | Celular | Horizontal |
| --- | --- | --- | --- |
| Comer | [Vista](qa-fullscreen-v13/home-eat-desktop.png) | [Vista](qa-fullscreen-v13/home-eat-phone.png) | [Vista](qa-fullscreen-v13/home-eat-landscape.png) |
| Ver la tele | [Vista](qa-fullscreen-v13/home-tv-desktop.png) | [Vista](qa-fullscreen-v13/home-tv-phone.png) | [Vista](qa-fullscreen-v13/home-tv-landscape.png) |
| Dormir | [Vista](qa-fullscreen-v13/home-sleep-desktop.png) | [Vista](qa-fullscreen-v13/home-sleep-phone.png) | [Vista](qa-fullscreen-v13/home-sleep-landscape.png) |

También se revisaron [la carta](qa-fullscreen-v13/letter-desktop.png),
[la boda](qa-fullscreen-v13/wedding-phone.png) y
[la pesca](qa-fullscreen-v13/fishing-phone.png).
El [resultado de capturas](qa-fullscreen-v13/result.json) registra los recursos
y errores observados.

Para repetir las vistas, con Vite activo:
`node scripts/capture-fullscreen-v13.mjs`. El script admite `ART_CAPTURE_URL`,
`ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH`. Las pruebas están en
`tests/e2e/fullscreen-v13.spec.js`.
