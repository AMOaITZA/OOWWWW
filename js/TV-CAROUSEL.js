/* =====================================================================
   TV-CAROUSEL.JS — Clic en tarjeta → TV antigua (estática) → carrusel
   Fase 1: encendido + estática + glitch (~2.2 s)
   Fase 2: carrusel horizontal Swiper con TODAS las tarjetas
   Debe cargarse DESPUÉS de app.js (usa la variable global `lenis`).
===================================================================== */
(function tvCarousel() {
  const modal    = document.getElementById('tvModal');
  const wrapper  = document.getElementById('tvWrapper');
  const closeBtn = document.getElementById('tvClose');
  const sound    = document.getElementById('muaSound');
  const cards    = Array.from(document.querySelectorAll('#moodboardGrid .mb-card[data-mua]'));

  if (!modal || !wrapper || !cards.length) return;
  if (typeof Swiper === 'undefined') {
    console.warn('[tv-carousel] Swiper no está cargado (revisa el <script> del CDN).');
    return;
  }

  /* ✏️ AJUSTES */
  const REDUCED       = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STATIC_TOTAL  = REDUCED ? 250 : 2200; // ms totales de la fase de estática (incluye el glitch)
  const GLITCH_MS     = REDUCED ? 0   : 450;  // ms finales: la estática se rompe y aparece el contenido
  const CLOSE_MS      = REDUCED ? 0   : 450;  // duración de la animación de apagado
  const PLAY_SOUND    = true;                 // sonido mua.mp3 al abrir
  const SOUND_STOP_MS = 1500;                 // cortar el sonido a los 1.5 s (como lo tenías)

  /* ---------- 1. Construir los slides a partir de tus tarjetas ---------- */
  cards.forEach((card) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide tv-slide';

    const img = document.createElement('img');
    img.className = 'tv-gif';
    img.alt = '';
    img.loading = 'lazy';
    img.draggable = false;
    img.src = card.dataset.muaGif || '';

    const caption = document.createElement('div');
    caption.className = 'tv-caption';
    const icon = document.createElement('i');
    icon.className = (card.querySelector('i') || {}).className || 'fa-solid fa-heart';
    const text = document.createElement('span');
    text.textContent = (card.querySelector('span') || {}).textContent || '';
    caption.append(icon, text);

    slide.append(img, caption);
    wrapper.appendChild(slide);
  });

  /* ---------- 2. Estado ---------- */
  let swiper = null;
  let isOpen = false;
  let lastTrigger = null;
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const setPhase = (p) => { modal.dataset.tv = p; };

  function initSwiper() {
    swiper = new Swiper('#tvSwiper', {
      slidesPerView: 1,
      speed: 550,
      rewind: true,              // del último vuelve al primero
      grabCursor: true,
      keyboard: { enabled: true },
      mousewheel: { forceToAxis: true },
      navigation: { prevEl: '.tv-prev', nextEl: '.tv-next' },
      pagination: {
        el: '.tv-counter',
        type: 'custom',
        renderCustom: (s, current, total) =>
          String(current).padStart(2, '0') + '  /  ' + String(total).padStart(2, '0'),
      },
    });
  }

  /* ---------- 3. Abrir: fase 1 (TV) → fase 2 (carrusel) ---------- */
  function open(index, trigger) {
    if (isOpen) return;
    isOpen = true;
    lastTrigger = trigger || null;
    clearTimers();

    // precarga el GIF del clic para que esté listo cuando termine la estática
    const pre = new Image();
    pre.src = cards[index].dataset.muaGif || '';

    // bloquear scroll de la página (incluye Lenis)
    document.documentElement.style.overflow = 'hidden';
    if (typeof lenis !== 'undefined' && lenis && lenis.stop) lenis.stop();

    modal.classList.remove('is-ready');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    void modal.offsetWidth; // reflow: ya tiene tamaño → Swiper puede medir

    if (!swiper) initSwiper();
    swiper.update();
    swiper.slideTo(index, 0);

    requestAnimationFrame(() => {
      modal.classList.add('is-visible');
      setPhase('booting');
    });

    if (PLAY_SOUND && sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
      clearTimeout(sound._stopTimer);
      sound._stopTimer = setTimeout(() => sound.pause(), SOUND_STOP_MS);
    }

    later(() => setPhase('glitch'), Math.max(STATIC_TOTAL - GLITCH_MS, 0));
    later(() => { setPhase('on'); modal.classList.add('is-ready'); closeBtn.focus({ preventScroll: true }); }, STATIC_TOTAL);
  }

  /* ---------- 4. Cerrar (apagado de TV) ---------- */
  function close() {
    if (!isOpen) return;
    isOpen = false;
    clearTimers();
    setPhase('off');
    if (sound) sound.pause();

    later(() => {
      modal.classList.remove('is-open', 'is-visible', 'is-ready');
      modal.setAttribute('aria-hidden', 'true');
      setPhase('');
      document.documentElement.style.overflow = '';
      if (typeof lenis !== 'undefined' && lenis && lenis.start) lenis.start();
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    }, CLOSE_MS);
  }

  /* ---------- 5. Eventos ---------- */
  cards.forEach((card, i) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', () => open(i, card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, card); }
    });
  });

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); }); // clic en el fondo
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });
})();