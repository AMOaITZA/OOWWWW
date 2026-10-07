/* =====================================================================
   TV-CAROUSEL.JS — La tele con marco: PLAY → estática/glitch → carrusel
   · Los recuerdos (GIF + texto) viven en el arreglo MEMORIES de abajo.
   · Detecta solo dónde está la pantalla transparente de tu marco PNG.
   Debe cargarse DESPUÉS de app.js y después de Swiper.
===================================================================== */
(function tvCarousel() {

  /* ✏️ TUS RECUERDOS — agrega, quita o reordena aquí (ya no hay tarjetas en el HTML) */
  const MEMORIES = [
  { icon: "fa-solid fa-crown", text: "Las princesas, tuu princesa favoritaa tiana",
    gif: "https://i.pinimg.com/originals/b5/94/62/b59462b846804e1b74867da52bc9fa18.gif" },
  { icon: "fa-solid fa-cat", text: "Los gatos, tuu cowii",
    gif: "https://i.pinimg.com/originals/73/0d/75/730d75ed729397068c7a89fa7476e305.gif" },
  { icon: "fa-solid fa-feather", text: "Los poemas, eres mi poeta favorita",
    gif: "https://i.pinimg.com/originals/35/a4/9f/35a49f984ff49587e862a97678cd8ffe.gif" },
  { icon: "fa-solid fa-book", text: "Los libros, pq siempree estas buscando leer algo nuevo",
    gif: "https://i.pinimg.com/originals/88/19/3c/88193c414f5a372fba4b796d4188f399.gif" },
  { icon: "fa-solid fa-flask", text: "La química, tee encanta y te hubiera gustado estudiarla, aparte de que eres muy buena",
    gif: "https://i.pinimg.com/originals/53/68/e0/5368e02b992a6a4a5f5d45990d51fe73.gif" },
  { icon: "fa-solid fa-landmark", text: "Los museos,por tuu increible interes en el artee",
    gif: "https://i.pinimg.com/originals/95/6b/42/956b42ff1e70e4a535d4bc888f9cbb6a.gif" },
  { icon: "fa-solid fa-ghost", text: "Five Nights at Freddy's, por que te gustaa mucho y por la carta que te dii de fnaf",
    gif: "https://i.pinimg.com/originals/09/44/c5/0944c5d6f9196a783d0c93a46b35e45d.gif" },
  { icon: "fa-solid fa-sun", text: "El sol, por tus pequitas",
    gif: "https://i.pinimg.com/originals/eb/b9/46/ebb946e99e5ff654fdaf45112ddac4c7.gif" },
  { icon: "fa-solid fa-star", text: "Las estrellas, porque tu nombre me hace pensar en ellas",
    gif: "https://i.pinimg.com/originals/5c/1f/e7/5c1fe720f60d9fb0dc6e9ce24d75d456.gif" },
  { icon: "fa-solid fa-pen-fancy", text: "Los tatuajes, porque siempre te has querido hacer uno",
    gif: "https://i.pinimg.com/originals/23/01/20/2301201caa9227c7f71995e76f0a6b9d.gif" },
  { icon: "fa-solid fa-hands-holding", text: "Los abrazos, porque siempre que me siento mal imagino un abrazo tuyo y me hacen sentir bien",
    gif: "https://i.pinimg.com/originals/23/4e/7d/234e7d7988a0718f9f93c183bd580f1b.gif" },
  { icon: "fa-solid fa-cube", text: "Roblox, por todas las veces que hemos jugado juntos",
    gif: "https://i.pinimg.com/originals/ee/c5/b7/eec5b749993595ef9eb118c1b4e2a187.gif" },
  { icon: "fa-solid fa-fish", text: "Ponyo, es una de esas peliculas que se quedaron en nuestros recuerdos una de tantaas",
    gif: "https://i.pinimg.com/originals/26/99/36/269936f9802ac996efb7ef73931000de.gif" },
  { icon: "fa-solid fa-heart", text: "Takopi, una de las series que mas nos gustoo",
    gif: "https://i.pinimg.com/originals/54/68/95/5468950bef5f4fa34d0ec229e6a2f0e5.gif" },
  { icon: "fa-solid fa-cubes", text: "Minecraft, por nuestraa temporada de jugar jajaja",
    gif: "https://i.pinimg.com/originals/6e/85/f7/6e85f7e0111ac569249afb790efff78f.gif" },
  { icon: "fa-solid fa-masks-theater", text: "Jax, pq dices que te identificas con él",
    gif: "https://i.pinimg.com/originals/a4/f5/99/a4f59923c92743588f9b9ec5fa9bc4bb.gif" },
  { icon: "fa-solid fa-umbrella-beach", text: "Hawái, porque siempre dices que quieres ir",
    gif: "https://i.pinimg.com/originals/06/cb/a8/06cba8401060eb4c5c011097add56fca.gif" },
  { icon: "fa-solid fa-music", text: "Michael Jackson, porque bailabas como él jajaja",
    gif: "https://i.pinimg.com/originals/65/e8/87/65e887ab53b62db9b9ac5fe7b3206583.gif" },
  { icon: "fa-solid fa-shapes", text: "Playmobil, tus juguetes favoritos",
    gif: "https://i.pinimg.com/originals/69/6c/ad/696cad7d49b8cfcb25e4725d579098fa.gif" },
  { icon: "fa-solid fa-moon", text: "Las noches, porque siempre pienso en ti cuando llegan",
    gif: "https://i.pinimg.com/originals/1a/4e/a5/1a4ea50c266ca383edca5a61c8f89508.gif" },
  { icon: "fa-solid fa-clapperboard", text: "Las peliculas, cada que veo una me imagino viendola contigoo",
    gif: "https://i.pinimg.com/originals/c1/17/dc/c117dcce4c730c9e6dae1dce2ce76cb6.gif" },
  ];

  /* ✏️ AJUSTES */
  const REDUCED       = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STATIC_TOTAL  = REDUCED ? 250 : 2200; // ms de estática (incluye el glitch final)
  const GLITCH_MS     = REDUCED ? 0   : 450;  // ms finales donde la estática se rompe
  const OFF_MS        = REDUCED ? 0   : 450;  // duración del apagado
  const PLAY_SOUND    = true;                 // sonido mua.mp3 al dar play
  const SOUND_STOP_MS = 1500;                 // se corta a los 1.5 s (como lo tenías)

  const tv       = document.getElementById('tvSet');
  const screen   = document.getElementById('tvScreen');
  const frame    = document.getElementById('tvFrame');
  const wrapper  = document.getElementById('tvWrapper');
  const playBtn  = document.getElementById('tvPlay');
  const powerBtn = document.getElementById('tvPower');
  const sound    = document.getElementById('muaSound');
  if (!tv || !screen || !wrapper) return;
  if (typeof Swiper === 'undefined') {
    console.warn('[tv-carousel] Swiper no está cargado (revisa el <script> del CDN).');
    return;
  }

  /* ---------- 1. Posición de la pantalla dentro del marco ---------- */

  // Busca el hueco transparente más grande que NO toque los bordes de la imagen.
  function findHole(px, W, H) {
    const N = W * H, clear = new Uint8Array(N), seen = new Uint8Array(N), queue = new Int32Array(N);
    for (let i = 0; i < N; i++) clear[i] = px[i * 4 + 3] < 60 ? 1 : 0;
    let best = null;
    for (let s = 0; s < N; s++) {
      if (!clear[s] || seen[s]) continue;
      let head = 0, tail = 0, area = 0, minX = W, maxX = 0, minY = H, maxY = 0, touches = false;
      queue[tail++] = s; seen[s] = 1;
      while (head < tail) {
        const p = queue[head++], x = p % W, y = (p / W) | 0;
        area++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touches = true;
        let q;
        if (x > 0)     { q = p - 1; if (clear[q] && !seen[q]) { seen[q] = 1; queue[tail++] = q; } }
        if (x < W - 1) { q = p + 1; if (clear[q] && !seen[q]) { seen[q] = 1; queue[tail++] = q; } }
        if (y > 0)     { q = p - W; if (clear[q] && !seen[q]) { seen[q] = 1; queue[tail++] = q; } }
        if (y < H - 1) { q = p + W; if (clear[q] && !seen[q]) { seen[q] = 1; queue[tail++] = q; } }
      }
      if (!touches && (!best || area > best.area)) best = { area, minX, maxX, minY, maxY };
    }
    if (!best || best.area < N * 0.04) return null;
    const pad = 0.004; // la pantalla se mete un poquito debajo del marco para que no queden rendijas
    const left = Math.max(0, best.minX / W - pad), top = Math.max(0, best.minY / H - pad);
    const right = Math.min(1, (best.maxX + 1) / W + pad), bottom = Math.min(1, (best.maxY + 1) / H + pad);
    return { left, top, w: right - left, h: bottom - top };
  }

  function applyScreen(b) {
    tv.style.setProperty('--scr-left', (b.left * 100).toFixed(3) + '%');
    tv.style.setProperty('--scr-top',  (b.top  * 100).toFixed(3) + '%');
    tv.style.setProperty('--scr-w',    (b.w    * 100).toFixed(3) + '%');
    tv.style.setProperty('--scr-h',    (b.h    * 100).toFixed(3) + '%');
  }

  function calibrate() {
    if (frame.naturalWidth && frame.naturalHeight) tv.style.setProperty('--tv-ratio', (frame.naturalWidth / frame.naturalHeight).toFixed(4));
    // Manual: <div id="tvSet" data-screen="12,10,76,72">  (izquierda, arriba, ancho, alto en %)
    if (tv.dataset.screen) {
      const [l, t, w, h] = tv.dataset.screen.split(',').map(Number);
      if ([l, t, w, h].every(Number.isFinite)) return applyScreen({ left: l / 100, top: t / 100, w: w / 100, h: h / 100 });
    }
    try {
      const W = 480, H = Math.max(1, Math.round(W * frame.naturalHeight / frame.naturalWidth));
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(frame, 0, 0, W, H);
      const box = findHole(ctx.getImageData(0, 0, W, H).data, W, H);
      if (box) applyScreen(box);
      else console.warn('[tv-carousel] No encontré la pantalla transparente en el marco; uso valores por defecto. Puedes fijarla a mano con data-screen en #tvSet.');
    } catch (err) {
      // pasa si abres el archivo con file:// (el canvas queda bloqueado). Con servidor local / GitHub Pages funciona.
      console.warn('[tv-carousel] No pude leer el marco (¿abierto con file://?). Uso valores por defecto o data-screen.', err);
    }
    if (swiper) swiper.update();
  }

  /* ---------- 2. Slides (los GIF cargan solo el actual y sus vecinos) ---------- */
  MEMORIES.forEach((m) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide tv-slide';

    const img = document.createElement('img');
    img.className = 'tv-gif';
    img.alt = '';
    img.draggable = false;
    img.dataset.src = m.gif;

    const caption = document.createElement('div');
    caption.className = 'tv-caption';
    const icon = document.createElement('i');
    icon.className = m.icon || 'fa-solid fa-heart';
    const text = document.createElement('span');
    text.textContent = m.text || '';
    caption.append(icon, text);

    slide.append(img, caption);
    wrapper.appendChild(slide);
  });

  function loadAround(i) {
    const slides = wrapper.children;
    [i - 1, i, i + 1].forEach((k) => {
      const idx = (k + slides.length) % slides.length; // también precarga del último al primero
      const img = slides[idx] && slides[idx].querySelector('img');
      if (img && !img.src) img.src = img.dataset.src;
    });
  }

  /* ---------- 3. Swiper ---------- */
  const swiper = new Swiper('#tvSwiper', {
    slidesPerView: 1,
    speed: 550,
    rewind: true,                         // del último vuelve al primero
    grabCursor: true,
    keyboard: { enabled: false },         // se activa cuando la tele está encendida
    mousewheel: { forceToAxis: true },    // el scroll vertical sigue moviendo la página
    navigation: { prevEl: '.tv-prev', nextEl: '.tv-next' },
    pagination: {
      el: '.tv-counter',
      type: 'custom',
      renderCustom: (s, current, total) =>
        String(current).padStart(2, '0') + '  /  ' + String(total).padStart(2, '0'),
    },
    on: { slideChange: (s) => loadAround(s.realIndex) },
  });

  /* ---------- 4. Estados: idle → booting → glitch → on → off → idle ---------- */
  let phase = 'idle';
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const setPhase = (p) => { phase = p; tv.dataset.tv = p; };

  function play() {
    if (phase !== 'idle') return;
    clearTimers();
    loadAround(0);                         // el GIF 1 y 2 cargan mientras dura la estática
    swiper.slideTo(0, 0);
    setPhase('booting');

    if (PLAY_SOUND && sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
      clearTimeout(sound._stopTimer);
      sound._stopTimer = setTimeout(() => sound.pause(), SOUND_STOP_MS);
    }

    later(() => setPhase('glitch'), Math.max(STATIC_TOTAL - GLITCH_MS, 0));
    later(() => {
      setPhase('on');
      tv.classList.add('is-ready');
      swiper.update();
      swiper.keyboard.enable();
    }, STATIC_TOTAL);
  }

  function powerOff() {
    if (phase !== 'on') return;
    clearTimers();
    swiper.keyboard.disable();
    setPhase('off');
    if (sound) sound.pause();
    later(() => {
      tv.classList.remove('is-ready');
      swiper.slideTo(0, 0);
      setPhase('idle');
    }, OFF_MS);
  }

  /* ---------- 5. Eventos ---------- */
  screen.addEventListener('click', () => { if (phase === 'idle') play(); }); // clic en cualquier parte de la pantalla
  playBtn && playBtn.addEventListener('click', (e) => { e.stopPropagation(); play(); });
  powerBtn && powerBtn.addEventListener('click', powerOff);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') powerOff(); });

  /* ---------- 6. Arranque: calibrar la pantalla con tu marco ---------- */
  if (frame) {
    frame.addEventListener('error', () => tv.classList.add('no-frame'));
    if (frame.complete) {
      if (frame.naturalWidth) calibrate(); else tv.classList.add('no-frame');
    } else {
      frame.addEventListener('load', calibrate);
    }
  } else {
    tv.classList.add('no-frame');
  }

  setPhase('idle');
})();