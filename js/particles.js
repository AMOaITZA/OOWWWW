/* =====================================================================
   PARTICLES.JS — estrellas del gate + partículas flotantes de fondo
   (canvas ligero hecho a mano, sin depender de librerías externas
   para que funcione siempre, aunque el CDN de tsparticles falle)
===================================================================== */

// ---------- 1. Starfield del gate (pantalla inicial) ----------
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ✏️ CAMBIAR: cantidad de estrellas
  const STAR_COUNT = 140;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.15 + 0.02,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach((s) => {
      s.phase += s.twinkleSpeed;
      const alpha = 0.4 + Math.sin(s.phase) * 0.4;
      ctx.beginPath();
      ctx.fillStyle = `rgba(248,247,255,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ---------- 2. Partículas flotantes de fondo (toda la experiencia) ----------
(function initFloatingParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.body.scrollHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ✏️ CAMBIAR: cantidad y color de partículas
  const COUNT = 60;
  const colors = ['#BFA2FF', '#F8C8DC', '#F8F7FF'];
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.6,
      vy: -(Math.random() * 0.25 + 0.05),
      vx: (Math.random() - 0.5) * 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.15,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.y += p.vy;
      p.x += p.vx;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();

  // recalcular altura cuando cambie el contenido (tras entrar a la experiencia)
  window.addEventListener('experience:entered', () => setTimeout(resize, 500));
})();

// ---------- 3. Lluvia de corazones (sección final) ----------
function launchHeartRain() {
  const canvas = document.getElementById('heartsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const section = canvas.closest('.final-section');
  let w = canvas.width = section.offsetWidth;
  let h = canvas.height = section.offsetHeight;

  let hearts = [];
  for (let i = 0; i < 40; i++) {
    hearts.push({
      x: Math.random() * w,
      y: -Math.random() * h,
      size: Math.random() * 14 + 8,
      speed: Math.random() * 1.2 + 0.6,
      sway: Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? '#F8C8DC' : '#BFA2FF',
    });
  }

  function heart(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 20, size / 20);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, 0, -8, -6, -10, -1);
    ctx.bezierCurveTo(-12, 6, -4, 10, 0, 16);
    ctx.bezierCurveTo(4, 10, 12, 6, 10, -1);
    ctx.bezierCurveTo(8, -6, 0, 0, 0, 4);
    ctx.fill();
    ctx.restore();
  }

  let frame = 0;
  const MAX_FRAMES = 60 * 12; // ~12s de lluvia
  function draw() {
    if (frame++ > MAX_FRAMES) { ctx.clearRect(0, 0, w, h); return; }
    ctx.clearRect(0, 0, w, h);
    hearts.forEach((p) => {
      p.phase += 0.02;
      p.y += p.speed;
      p.x += Math.sin(p.phase) * p.sway * 0.3;
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      heart(ctx, p.x, p.y, p.size, p.color);
    });
    requestAnimationFrame(draw);
  }
  draw();
}
