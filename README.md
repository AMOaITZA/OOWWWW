# 💌 Love Page — una experiencia interactiva

Una página web hecha para una sola persona: cada sección es un recuerdo, una razón, una foto. Funciona directamente abriendo `index.html`, sin necesidad de instalar nada — todas las librerías (GSAP, Lenis, AOS, Typed.js, Vanilla-Tilt) se cargan por CDN.

## 🚀 Cómo verla (opción rápida, recomendada)

1. Descomprime la carpeta `love-page`.
2. Abre `index.html` con doble clic, **o** mejor aún, sírvela con un servidor local para que las rutas de imágenes/música funcionen sin restricciones del navegador:

   ```bash
   cd love-page
   npx serve .
   # o
   python3 -m http.server 8080
   ```
3. Entra a `http://localhost:8080` (o la URL que te indique la terminal).

## 🛠️ Opción avanzada: con Vite y npm

Si prefieres el flujo profesional con Vite (bundling, hot-reload, dependencias locales en vez de CDN):

```bash
npm create vite@latest love-page-vite -- --template vanilla
cd love-page-vite
npm install
npm install gsap
npm install @studio-freight/lenis
npm install aos
npm install typed.js
npm install vanilla-tilt
npm install @tsparticles/engine @tsparticles/slim
npm install lottie-web
npm install @fortawesome/fontawesome-free
```

Luego copia el contenido de `css/`, `js/`, `assets/` y `index.html` dentro del proyecto generado por Vite, y cambia los `<script src="https://unpkg.com/...">` por `import` normales (ej. `import gsap from "gsap"`).

`package.json` en esta carpeta ya lista todas las dependencias por si quieres correr `npm install` directamente aquí.

## ✏️ Qué editar (y dónde)

| Qué quieres cambiar | Archivo | Qué buscar |
|---|---|---|
| Nombre de la persona | `index.html` | `<h1 class="gate-title">` |
| Fecha de inicio de la historia | `index.html` y `js/app.js` | `preloader-date` / `const START_DATE` |
| Texto de la carta | `js/transitions.js` | `const LETTER_TEXT` |
| Fotos (hero, galería) | `assets/images/` | reemplaza `hero-photo.jpg`, `g1.jpg`...`g6.jpg` (mismos nombres) |
| Recuerdos / timeline | `index.html` | bloque `<div class="timeline" id="timelineList">` |
| Razones por las que la amas | `index.html` | bloque `<div class="reasons-grid">` |
| Canciones (playlist visual) | `index.html` | bloque `<ul class="playlist-list">` |
| Música real del reproductor | `assets/music/` + `js/music.js` | array `TRACKS` |
| Embed de Spotify (opcional) | `index.html` | `<div id="spotifyEmbed">` |
| Cosas que te recuerdan a ella/él | `index.html` | bloque `<div class="moodboard-grid">` |
| Lugares importantes | `index.html` | bloque `<div class="places-grid">` |
| Objetos de la caja de recuerdos | `index.html` | bloque `<div class="scrapbook-grid">`, atributo `data-story` |
| Mensaje final | `index.html` | sección `<section class="final-section">` |
| Colores de toda la página | `css/style.css` | bloque `:root { ... }` al inicio |
| Cantidad de estrellas/partículas | `js/particles.js` | `STAR_COUNT`, `COUNT` |

## 🖼️ Sobre las imágenes y música

- No incluí fotos ni canciones reales — son placeholders. Si falta una imagen, la sección muestra automáticamente un fondo degradado con un ícono (no se rompe el diseño).
- Coloca tus fotos en `assets/images/` respetando los nombres usados en `index.html`, o cambia las rutas directamente.
- Coloca tus canciones (`.mp3`) en `assets/music/` y edítalas en `js/music.js`.

## 📁 Estructura

```
love-page/
├── index.html
├── css/
│   ├── style.css        → layout y tokens de diseño (colores, tipografía)
│   ├── animations.css   → keyframes y transiciones puras
│   └── responsive.css   → tablet y móvil
├── js/
│   ├── app.js            → orquestador: preloader, entrada, scroll, contador
│   ├── music.js          → mini reproductor flotante
│   ├── particles.js      → starfield + partículas + lluvia de corazones
│   ├── cursor.js          → cursor personalizado con efecto magnético
│   ├── gallery.js         → masonry + lightbox + caja de recuerdos
│   ├── timeline.js        → revelado secuencial de la línea del tiempo
│   └── transitions.js     → sobre animado + tilt 3D
├── assets/
│   ├── images/  videos/  music/  icons/
└── package.json
```

## 🎨 Sistema de diseño

- **Fondo:** `#0B0B14` — **Morado:** `#6E56CF` — **Lavanda:** `#BFA2FF` — **Rosa pastel:** `#F8C8DC` — **Blanco cálido:** `#F8F7FF` — **Gris:** `#B9B8C5`
- **Display:** Cormorant Garamond (itálica) para títulos — **Body:** Manrope — **Utility:** Space Grotesk para números y etiquetas.
- Glassmorphism, aurora animada de fondo, cursor magnético, y una lluvia de corazones al llegar al final.

Hecho con cuidado. Solo falta que le pongas tus fotos, tu música y tus palabras.
