/* =====================================================================
   CURSOR.JS — cursor personalizado con efecto magnético en botones
===================================================================== */
(function () {
  if (window.matchMedia('(hover: none)').matches) return; // skip en táctil

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  // el anillo sigue con un pequeño retraso (lerp) para sensación fluida
  function animateRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // efecto hover + magnético sobre elementos interactivos
  const interactive = 'a, button, .m-item, .r-card, .s-item, [data-tilt]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) ring.classList.add('hovered');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) ring.classList.remove('hovered');
  });

  document.querySelectorAll('.btn-enter, .btn-final, .player-toggle').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0,0)';
    });
  });
})();
