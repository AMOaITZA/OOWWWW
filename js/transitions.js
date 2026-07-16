/* =====================================================================
   TRANSITIONS.JS — sobre que se abre, tilt 3D, y micro-transiciones
===================================================================== */

/* ---------- Sobre de la carta ---------- */
(function envelopeInit() {
  const envelope = document.getElementById('envelope');
  const paper = document.getElementById('letterPaper');
  const typedTarget = document.getElementById('letterTyped');
  if (!envelope) return;

  // ✏️ CAMBIAR: el texto completo de tu carta aquí
  const LETTER_TEXT = `Hay días en los que quiero decirte todo y no encuentro por dónde empezar.

Así que empecé por aquí: por un lugar pequeño, hecho con calma, para guardar las cosas que no siempre digo en voz alta.

Gracias por quedarte en los días fáciles y también en los difíciles. Gracias por hacer de lo cotidiano algo que se siente, de alguna forma, especial.

Esto es solo una parte de lo que siento. El resto te lo sigo diciendo cada día.`;

  let opened = false;
  envelope.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    envelope.classList.add('open');
    setTimeout(() => {
      paper.classList.add('open');
      typeWriter(typedTarget, LETTER_TEXT);
    }, 500);
  });

  function typeWriter(el, text) {
    let i = 0;
    el.textContent = '';
    const speed = 22; // ms por caracter
    function step() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(step, speed);
      }
    }
    step();
  }
})();

/* ---------- Vanilla-Tilt para tarjetas 3D ---------- */
(function tiltInit() {
  if (typeof VanillaTilt === 'undefined') return;
  const els = document.querySelectorAll('[data-tilt]');
  if (!els.length) return;
  VanillaTilt.init(els, {
    max: 10,
    speed: 400,
    glare: true,
    'max-glare': 0.25,
    scale: 1.02,
  });
})();
