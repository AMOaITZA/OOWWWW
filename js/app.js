/* =====================================================================
   APP.JS — orquesta todo: preloader, entrada, smooth scroll, contador,
   scroll progress, menú lateral, back-to-top y reveals con GSAP/AOS.
===================================================================== */

/* ---------- 1. PRELOADER ---------- */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const bar = preloader.querySelector('.preloader-bar span');
  gsap.to(bar, { width: '100%', duration: 1.6, ease: 'power2.out' });
  setTimeout(() => {
    gsap.to(preloader, {
      opacity: 0, duration: 0.6, onComplete: () => (preloader.style.display = 'none'),
    });
  }, 1900);
});

/* ---------- 2. TYPED.JS en la pantalla inicial ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const typedEl = document.querySelector('[data-typed]');
  if (typedEl && typeof Typed !== 'undefined') {
    const strings = JSON.parse(typedEl.dataset.strings);
    new Typed(typedEl, {
      strings,
      typeSpeed: 45,
      backSpeed: 20,
      backDelay: 2200,
      loop: true,
      smartBackspace: true,
    });
  }
});

/* ---------- 3. BOTÓN ENTRAR → inicia la experiencia ---------- */
let lenis;
document.getElementById('btnEnter').addEventListener('click', () => {
  const gate = document.getElementById('gate');
  const experience = document.getElementById('experience');

  gsap.to(gate, {
    opacity: 0,
    duration: 0.9,
    ease: 'power2.inOut',
    onComplete: () => {
      gate.style.display = 'none';
      experience.classList.add('visible');
      window.dispatchEvent(new Event('experience:entered'));
      initSmoothScroll();
      initScrollReveals();
      if (typeof AOS !== 'undefined') AOS.init({ duration: 900, once: true, offset: 60 });
    },
  });
});

/* ---------- 4. LENIS — smooth scroll ---------- */
function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
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
      y: 40, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 75%' },
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
// ✏️ CAMBIAR: la fecha de inicio de la relación
const START_DATE = new Date('2022-02-14T00:00:00');

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
});

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
