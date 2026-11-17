# OOWWWW — ventanas ilustradas y cabello de novia V7

Esta revisión renueva las ventanas de los trece lugares. Cada experiencia
combina su propia ilustración, paleta, marcos y composición interior, con los
textos y recuerdos originales. También corrige los mechones de novia señalados
por el usuario, tanto de frente como debajo del velo al mirar de espaldas.

## Las ventanas

La cabecera ilustrada contiene el título y la categoría originales. El cierre
permanece visible mientras se desplaza únicamente el contenido interior; al
volver a entrar se empieza arriba. Escape, foco contenido/restaurado y controles
táctiles siguen funcionando. El panel adapta su altura a escritorio, móvil y
orientación horizontal, y respeta movimiento reducido.

| Lugar | Presentación |
| --- | --- |
| Inicio | Jardín acogedor y retrato de la pareja enmarcado. |
| Carta | Escritorio de cartas, papel cálido y sello de corazón. |
| Galería | Álbum de polaroids, fotos numeradas y visor navegable. |
| Razones | Libro ilustrado y ocho tarjetas numeradas por página. |
| Playlist | Café musical, tocadiscos y estantería de canciones con buscador. |
| Recuerdos | Habitación nostálgica y gabinete de televisión CRT. |
| Contador | Reloj de sobremesa y seis cifras enmarcadas. |
| Lugares | Mapas, postales y tarjetas de viaje. |
| Final | Jardín romántico, escena de la pareja y ticket de despedida. |
| Armario | Boutique, espejo del probador y opciones claras de atuendo y apariencia. |
| Boda | Jardín cinematográfico existente, marco y controles renovados. |
| Rincón secreto | Claro de bosque y tarjetas de preguntas en tonos salvia. |
| Grabadora | Estudio de mensajes y cassette con controles claros. |

La galería conserva sus ocho fotografías y leyendas y añade navegación de la
foto ampliada, con retorno al álbum y al foco original. Las 104 razones, las
37 canciones, los 21 recuerdos, la fecha del contador, las cartas y las acciones
personales se conservan. La televisión presenta una alternativa decorativa si
un GIF externo falla, manteniendo el texto del recuerdo.

Los doce banners nuevos están en `assets/game/experiences/`, a 384 × 128,
opacos y con un máximo de 192 colores cada uno. Se cargan al abrir su ventana.
Boda reutiliza su jardín ilustrado. Todos los PNG finales ya están incluidos:
no se necesita generar imágenes ni ejecutar el empaquetador para jugar.

Las fuentes, recortes y huellas se registran en
[EXPERIENCE-ART-V7-GENERATION.json](EXPERIENCE-ART-V7-GENERATION.json).

## Cabello de novia

Se trazaron por fila los píxeles del flequillo derecho, el mechón junto al
cuello, la franja bajo el velo y el borde trasero del perfil. Las regresiones
comprueban esas zonas en los seis fotogramas y en café, rosa pastel y rubio
claro, con conservación de piel, flor, velo, vestido y lentes.

La comparación antes/después usa la revisión `78860a3` y los mismos PNG base.
Incluye frente y espalda, con y sin lentes. Las hojas originales no se retocan;
se corrige la máscara de color usada al dibujar.

## Ver y probar

```bash
git switch feat/game-phase-0
git pull --ff-only origin feat/game-phase-0
npm install
npm run dev
```

Abre la dirección local de Vite terminada en `/game.html`. Los modos día/noche,
voz de Leo, rincón de preguntas y grabadora con MP3 futuros siguen disponibles.
Los nombres para tus audios continúan en [VOICE-NOTES.md](VOICE-NOTES.md).

Consulta [pruebas y todas las capturas V7](QA-EXPERIENCES-V7.md).
El trabajo sigue en `feat/game-phase-0`; no modifica `main` ni despliega el sitio.
