/* =====================================================================
   APP.JS — orquesta todo: preloader, entrada, smooth scroll, contador,
   scroll progress, menú lateral, back-to-top y reveals con GSAP/AOS.
===================================================================== */

/* ---------- 1. PRELOADER ---------- */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const bar = preloader.querySelector('.preloader-bar span');
  gsap.to(bar, { width: '100%', duration: 1.3, ease: 'power2.out' });
  setTimeout(() => {
    gsap.to(preloader, {
      opacity: 0, duration: 0.5, onComplete: () => (preloader.style.display = 'none'),
    });
  }, 1550);
});

/* ---------- 2. TYPED.JS en la pantalla inicial ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const typedEl = document.querySelector('[data-typed]');
  if (typedEl && typeof Typed !== 'undefined') {
    const strings = JSON.parse(typedEl.dataset.strings);
    new Typed(typedEl, {
      strings,
      typeSpeed: 40,
      backSpeed: 16,
      backDelay: 2000,
      loop: true,
      smartBackspace: true,
    });
  }
});

/* ---------- 3. BOTÓN ENTRAR → inicia la experiencia ---------- */
let lenis;
let pendingSongPlay = false; // 🎵 bandera por si el usuario entra antes de que YouTube esté listo

document.getElementById('btnEnter').addEventListener('click', () => {
  const gate = document.getElementById('gate');
  const experience = document.getElementById('experience');

  // 🎵 arranca la canción justo en el clic (gesto de usuario = permitido)
  if (ytReady && ytPlayerInstance) {
    ytPlayerInstance.playVideo();
  } else {
    pendingSongPlay = true; // se reproducirá en cuanto el player esté listo
  }

  gsap.to(gate, {
    opacity: 0,
    duration: 0.7,
    ease: 'power2.inOut',
    onComplete: () => {
      gate.style.display = 'none';
      experience.classList.add('visible');
      window.dispatchEvent(new Event('experience:entered'));
      initSmoothScroll();
      initScrollReveals();
      if (typeof AOS !== 'undefined') AOS.init({ duration: 700, once: true, offset: 60 });
    },
  });
});

/* ---------- 4. LENIS — smooth scroll ---------- */
function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 0.9, smoothWheel: true });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  if (typeof gsap !== 'undefined' && gsap.ticker) {
    gsap.ticker.add((time) => lenis.raf(time * 1000));
  }
}

/* ---------- 5. GSAP ScrollTrigger — reveals suaves por sección ---------- */
function initScrollReveals() {
  if (typeof gsap === 'undefined' || !gsap.registerPlugin) return;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.section').forEach((section) => {
    const heading = section.querySelectorAll('.section-title, .hero-title, .final-title');
    if (!heading.length) return;
    gsap.from(heading, {
      y: 32, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 78%' },
    });
  });

  // lluvia de corazones cuando llega la sección final
  ScrollTrigger.create({
    trigger: '#final',
    start: 'top 60%',
    once: true,
    onEnter: () => launchHeartRain(),
  });
}

/* ---------- 6. CONTADOR EN TIEMPO REAL ---------- */
// ✏️ El día que empezamos a hablar
const START_DATE = new Date('2025-04-03T00:00:00');

function updateCounter() {
  const now = new Date();
  let diffMs = now - START_DATE;
  if (diffMs < 0) diffMs = 0;

  const totalSeconds = Math.floor(diffMs / 1000);
  const years = Math.floor(totalSeconds / (365.25 * 24 * 3600));
  const afterYears = totalSeconds - years * 365.25 * 24 * 3600;
  const months = Math.floor(afterYears / (30.44 * 24 * 3600));
  const afterMonths = afterYears - months * 30.44 * 24 * 3600;
  const days = Math.floor(afterMonths / (24 * 3600));
  const afterDays = afterMonths - days * 24 * 3600;
  const hours = Math.floor(afterDays / 3600);
  const minutes = Math.floor((afterDays % 3600) / 60);
  const seconds = Math.floor(afterDays % 60);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('cYears', years);
  set('cMonths', months);
  set('cDays', days);
  set('cHours', hours);
  set('cMinutes', minutes);
  set('cSeconds', seconds);
}
setInterval(updateCounter, 1000);
updateCounter();

/* ---------- 7. SCROLL PROGRESS BAR ---------- */
const progressBar = document.getElementById('scrollProgressBar');
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = progress + '%';
  if (backToTop) backToTop.classList.toggle('visible', scrollTop > 600);

  // resalta el link activo del menú lateral
  document.querySelectorAll('.section').forEach((section) => {
    const rect = section.getBoundingClientRect();
    const link = document.querySelector(`.side-nav-list a[href="#${section.id}"]`);
    if (!link) return;
    link.classList.toggle('active', rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5);
  });
}, { passive: true });

backToTop && backToTop.addEventListener('click', () => {
  if (lenis) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------- 8. MENÚ LATERAL (móvil) ---------- */
const sideNavToggle = document.getElementById('sideNavToggle');
const sideNavList = document.getElementById('sideNavList');
sideNavToggle && sideNavToggle.addEventListener('click', () => sideNavList.classList.toggle('open'));
document.querySelectorAll('.side-nav-list a').forEach((a) => {
  a.addEventListener('click', () => sideNavList.classList.remove('open'));
});

/* ---------- 9. BOTÓN FINAL: pequeño mensaje sorpresa ---------- */
document.getElementById('btnFinal').addEventListener('click', function () {
  this.querySelector('span').textContent = 'Te amo';
  launchHeartRain();
});

/* ---------- 10. GIF + SONIDO EN MOODBOARD (uno distinto por tarjeta) ---------- */
/* ---------- 10. GIF + SONIDO EN MOODBOARD (uno distinto por tarjeta) ---------- */
(function muaEffect() {
  const popup = document.getElementById('muaPopup');
  const gifImg = document.getElementById('muaGifImg');
  const sound = document.getElementById('muaSound');
  if (!popup || !gifImg || !sound) return;

  document.querySelectorAll('[data-mua]').forEach((card) => {
    card.addEventListener('click', () => {
      gifImg.src = card.dataset.muaGif || 'assets/gifs/mua.gif';
      
      // Reiniciamos y reproducimos el sonido
      sound.currentTime = 0;
      sound.play().catch(() => {});
      
      popup.classList.add('show');
      
      // 1. Temporizador del GIF: Lo oculta a los 2.5 segundos (2500 ms)
      clearTimeout(popup._hideTimer);
      popup._hideTimer = setTimeout(() => {
        popup.classList.remove('show');
      }, 2500);

      // 2. Temporizador del SONIDO: Lo pausa a los 1.5 segundos (1500 ms)
      clearTimeout(sound._stopTimer);
      sound._stopTimer = setTimeout(() => {
        sound.pause();
      }, 1500);
      
    });
  });
})();

document.getElementById('btnEnter').addEventListener('click', () => {
     const gate = document.getElementById('gate');
     const experience = document.getElementById('experience');
     const song = document.getElementById('entradaSong');

     // 🎵 llamada directa y síncrona = funciona en todos los navegadores
     song.play().catch(() => console.warn('No se pudo reproducir la canción'));

     gsap.to(gate, {
       opacity: 0,
       duration: 0.7,
       ease: 'power2.inOut',
       onComplete: () => {
         gate.style.display = 'none';
         experience.classList.add('visible');
         window.dispatchEvent(new Event('experience:entered'));
         initSmoothScroll();
         initScrollReveals();
         if (typeof AOS !== 'undefined') AOS.init({ duration: 700, once: true, offset: 60 });
       },
     });
   });