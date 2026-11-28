# OOWWWW — QA de vestuario, bancas y mundo V4

La revisión corrige el look 1, reduce las bancas y conserva la ropa elegida al
sentarse. Los diez edificios ordinarios tienen arquitectura propia y el mundo
usa un terreno nuevo con flores y caminos claros. Se trabaja sobre
`effc211` exclusivamente en `feat/game-phase-0`.

Itza lleva chamarra de cuero negra y mezclilla azul. Leo lleva rompevientos rojo
con franja hueso del hombro a la muñeca, pantalón negro y tenis blancos. Las dos
hojas conservan sus 18 fotogramas y el estilo chibi de la entrega anterior.

La pareja cotidiana con ropa fija se elimina del manifiesto y del repositorio.
Se instalan seis hojas sentadas: tres conjuntos por personaje, con dos poses
cada uno. El asiento independiente tiene 52 píxeles visibles de ancho y se
dibuja a escala nativa, igual que las figuras. El final formal de la ceremonia
conserva su recurso propio de boda.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| `npm test` | **94/94 aprobadas**. |
| `npm run art:check` | **Aprobado**: 53 PNG, 0 ausencias y 185 colores del escenario, dentro del máximo de 192. |
| `npm run build` | **Aprobado**, con ambas entradas y los recursos completos. |
| `npm run test:e2e` | **44/44 aprobadas** en Chromium; escritorio, móvil y horizontal. |
| Capturas comparativas | **30 capturas reales**, sin errores JavaScript. |
| Build de producción en móvil | Terreno, diez arquitecturas, seis hojas sentadas y banca: **18 respuestas 200**, sin errores JavaScript. |

Las pruebas de recursos comprueban transparencia binaria, cuadrículas, figuras
completas, pies alineados, paleta de piel y diez fachadas distintas. Las pruebas
de bancas cubren las nueve combinaciones, cambios independientes de atuendo,
ausencia de sustituciones con ropa fija, transición de 0,38 s y guardado.

El navegador observa las llamadas reales a `drawImage` para comprobar la ropa
sentada y la proporción respecto a las figuras caminando. Verifica también el
uso táctil y la carga y representación de los diez edificios, sin superponer
el tejado genérico. Las once llegadas conservan rutas transitables y la cámara
encuadra los letreros, edificios y zapatos de ambos personajes.

La comprobación del build móvil usa Leo con sudadera verde e Itza de novia en
la banca. La partida conserva esos dos identificadores y su posición original
al sentarse. La revisión visual incluye también look 1, boda y otras mezclas.

## Ropa y bancas

Las dos versiones parten de la misma posición y selección de ropa. La columna
anterior muestra el fallo de ropa fija incluso al elegir otros conjuntos.

| Escena | Antes | Después |
| --- | --- | --- |
| Look 1 de pie y tamaño de banca | [Antes](qa-world-v4/before-standing-desktop.png) | [Después](qa-world-v4/after-standing-desktop.png) |
| Look 1 sentado | [Antes](qa-world-v4/before-bench-look1-desktop.png) | [Después](qa-world-v4/after-bench-look1-desktop.png) |
| Leo verde e Itza de novia | [Antes](qa-world-v4/before-bench-green-bridal-desktop.png) | [Después](qa-world-v4/after-bench-green-bridal-desktop.png) |
| Ambos de boda | [Antes](qa-world-v4/before-bench-wedding-desktop.png) | [Después](qa-world-v4/after-bench-wedding-desktop.png) |
| Banca táctil, móvil 375 × 812 | [Antes](qa-world-v4/before-bench-mobile.png) | [Después](qa-world-v4/after-bench-mobile.png) |

## Diez edificios y terreno

Las capturas son del canvas real, a la llegada de cada destino. Incluyen el
terreno, los senderos, las figuras y sus etiquetas sin editar los píxeles.

| Destino | Antes | Después |
| --- | --- | --- |
| Inicio: casa con flores | [Antes](qa-world-v4/before-inicio-desktop.png) | [Después](qa-world-v4/after-inicio-desktop.png) |
| Carta: correo de ladrillo | [Antes](qa-world-v4/before-carta-desktop.png) | [Después](qa-world-v4/after-carta-desktop.png) |
| Galería: invernadero | [Antes](qa-world-v4/before-galeria-desktop.png) | [Después](qa-world-v4/after-galeria-desktop.png) |
| Razones: librería de madera | [Antes](qa-world-v4/before-razones-desktop.png) | [Después](qa-world-v4/after-razones-desktop.png) |
| Playlist: café musical | [Antes](qa-world-v4/before-playlist-desktop.png) | [Después](qa-world-v4/after-playlist-desktop.png) |
| Recuerdos: cine art déco | [Antes](qa-world-v4/before-recuerdos-desktop.png) | [Después](qa-world-v4/after-recuerdos-desktop.png) |
| Contador: torre de reloj | [Antes](qa-world-v4/before-contador-desktop.png) | [Después](qa-world-v4/after-contador-desktop.png) |
| Lugares: gazebo con mapa | [Antes](qa-world-v4/before-lugares-desktop.png) | [Después](qa-world-v4/after-lugares-desktop.png) |
| Final: pequeña capilla | [Antes](qa-world-v4/before-final-desktop.png) | [Después](qa-world-v4/after-final-desktop.png) |
| Armario: boutique | [Antes](qa-world-v4/before-armario-desktop.png) | [Después](qa-world-v4/after-armario-desktop.png) |

Para repetirlas, sirve la revisión anterior en otro puerto y ejecuta:

```bash
BASELINE_URL=http://127.0.0.1:5196 node scripts/capture-world-v4.mjs
```

`ART_CAPTURE_URL`, `ART_CAPTURE_DIR` y `ART_CHROMIUM_PATH` permiten ajustar el
servidor actual, la salida y el navegador. El proceso usa Chromium, escritorio
1440 × 1000 y móvil emulado 375 × 812.

## Alcance

Los [contratos de recursos](WORLD-V4.md) y la
[trazabilidad de generación](WORLD-V4-GENERATION.json) describen los 20 PNG
instalados o sustituidos. No se cambian textos, fotos, audio, puntos de llegada,
identificadores de atuendo ni partidas. El castillo y las secuencias de boda
renovadas en V3 conservan su arte.

Persisten los avisos de Vite de los scripts y referencias clásicas heredadas;
el build termina correctamente. Móvil está emulado y las pruebas automatizadas
de audio usan la simulación existente. Esta revisión no modifica `main`, no
fusiona el PR y no realiza despliegue.
