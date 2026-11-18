# V9 · transiciones, pétalos, luces y agua

La revisión se ejecuta sobre el juego real en Chromium, con movimiento normal
y con la preferencia de reducir movimiento. Las capturas muestran el canvas
y las ventanas reales; no se han compuesto ilustraciones para simular efectos.

## Validación completa

- `npm test`: **170/170 aprobadas**.
- `npm run test:e2e`: **73/73 aprobadas**, Chromium, dos workers. Incluye los
  once casos V9 y las regresiones anteriores de experiencias, personalización,
  bancas, boda, música, pantalla completa y página clásica.
- `npm run art:check`: **73 PNG**, recursos obligatorios presentes; dimensiones,
  transparencia, anclajes y paletas aprobados. El estanque tiene 48 colores.
- `npm run build`: aprobado. Permanecen los avisos heredados de los scripts
  de la página clásica.
- **11/11 casos V9 aprobados también en la versión compilada**, servida por
  Vite preview: siete de ambiente y cuatro de transiciones.

Las cuatro pruebas de transiciones verifican entrada con movimiento normal,
foco y controles disponibles inmediatamente al cerrar, capa de salida inerte
sin identificadores duplicados, reapertura rápida, cambio al mapa, preferencia
de movimiento reducido y detención inmediata de la caminata del probador.

Las pruebas unitarias comprueban también que las ondas no pinten piedras o
nenúfares, que todos los píxeles reales de agua queden fuera de rutas, los
límites y descarte de partículas, y la reutilización del halo y gradientes.

## Pruebas enfocadas de ambiente

**7/7 pruebas de navegador aprobadas** en `tests/e2e/ambience-v9.spec.js`.

| Comprobación | Evidencia |
| --- | --- |
| El agua tiene movimiento real | Cambian los píxeles de un recorte interior del estanque entre dos instantes. El recorte excluye a los personajes. |
| Caen pétalos junto a los cerezos | Hay partículas visibles y cambia el recorte de la copa; no se usa el parpadeo del personaje como prueba de animación. |
| Las farolas tienen brillo local animado | Cambia el recorte alrededor de una farola mientras el modo Noche permanece seleccionado. |
| Reducir movimiento conserva una vista estática | El recorte del agua y el reloj ambiental permanecen idénticos; pétalos y ondas móviles quedan en cero. Cambiar la preferencia en vivo reanuda suavemente el movimiento. |
| Las ventanas pausan el ambiente | El reloj no avanza detrás de Ayuda o Mapa. Se simula también el evento de visibilidad oculta; al volver no se recupera de golpe todo el tiempo transcurrido. |
| El estanque no se puede atravesar | Un toque real desde celular termina en una orilla transitable. El giro a horizontal conserva la pantalla completa y los controles. |
| Una partida antigua sigue funcionando | Una posición guardada dentro del nuevo estanque se mueve a una orilla cercana; conserva los lugares visitados y el pelo elegido. |

Los límites comprobados son 50 pétalos preparados para todo el mundo y siete
ondas simultáneas como máximo. La máscara del agua se prepara una vez a partir
de los píxeles del recurso; los segmentos de las ondas se recortan al agua,
excluyendo piedras, juncos y nenúfares. Los efectos se dibujan dentro del ciclo
existente del juego y se descartan fuera de la cámara.

## Capturas y grabación

- Estanque de día: [computadora](qa-ambience-v9/pond-day-desktop.png),
  [celular vertical](qa-ambience-v9/pond-phone.png) y
  [horizontal](qa-ambience-v9/pond-landscape.png).
- [Cerezo y pétalos](qa-ambience-v9/cherry-petals-desktop.png).
- [Estanque de noche](qa-ambience-v9/pond-night-desktop.png) y
  [farola nocturna](qa-ambience-v9/lantern-night-desktop.png).
- [Entrada de una experiencia](qa-ambience-v9/experience-entry.png) y
  [salida visual](qa-ambience-v9/experience-exit.png).
- [Grabación del juego: agua, transiciones y noche](qa-ambience-v9/ambience-preview.webm).
- [Medidas y contadores de las capturas](qa-ambience-v9/metrics.json).

El estanque está en el jardín al sur de la casa de Carta, antes del camino
vertical central. Es decoración del mundo; no añade una experiencia nueva.

## Reproducción

Con Vite iniciado, ejecutar:

```sh
node scripts/capture-ambience-v9.mjs
```

Se pueden indicar `ART_CAPTURE_URL`, `ART_CAPTURE_DIR`, `ART_CHROMIUM_PATH`
y `ART_FFMPEG_PATH`. La grabación empaqueta fotogramas del navegador con el
FFmpeg del sistema; no necesita descargar el ejecutable adicional de Playwright.

La validación utilizó el Chromium del sistema con configuraciones temporales de
Playwright. Para la versión compilada se ejecutó primero `npm run build` y se
sirvió `npm run preview -- --port 5184`, usando esa URL como `baseURL` de los
once casos V9. No se modificó la selección habitual del navegador del proyecto.

Las vistas móviles emulan un dispositivo táctil de 390 × 844 y su orientación
horizontal de 844 × 390. Esta revisión no sustituye una prueba en teléfonos
físicos. La comprobación de visibilidad oculta simula el evento y su propiedad
para verificar la pausa del juego sin depender de la política de pestañas del
navegador sin interfaz.
