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
  const LETTER_TEXT = `Quiero que sepas algo, aunque a veces no encuentre la forma exacta de decirlo: te amo mucho más de lo que imaginas.

Sé que no siempre hago las cosas bien. Que hay días en los que me equivoco, en los que no digo lo correcto o no actúo como debería. Pero también sé que cada día intento ser mejor, no por obligación, sino porque quiero merecer lo que tú me das.

Antes pensaba que nadie cambiaba de verdad por amor. Que era una de esas frases bonitas. Tú me hiciste entender que sí se puede cambiar por alguien, cuando esa persona realmente importa. Y tú importas, más de lo que las palabras pueden explicar.

Han pasado cosas buenas y cosas difíciles entre nosotros, pero si me preguntas si ha valido la pena, la respuesta siempre va a ser sí. Conocerte ha sido, lo mejor que me ha pasado.

Desde el primer día que hablamos no he podido dejar de pensar en ti. Ha pasado el tiempo y sigue siendo igual: pienso en ti todos los días, en algún momento o todo el día pero siempre estas en mi mente.

Quiero que sepas también que nunca podría odiarte. Puede que algún día dudes de eso, así que quiero dejarlo escrito aquí, para que lo recuerdes siempre que lo necesites: jamás podría sentir eso por ti.

Cada mensaje tuyo mejora mi día, incluso cuando es solo un "hola". Desde el momento en que sé que voy a verte, ya soy feliz. Soy feliz cuando estoy contigo, y también cuando nos despedimos, porque sé que voy a volver a verte pronto.

Eres una persona increíble, y creo que a veces no te das cuenta de todo lo que eres. Eres linda, amorosa, divertida, atenta, observadora, sensible. Eres hermosa, de una forma que no depende de nada externo. Y eres resiliente: siempre encuentras la manera de salir adelante, pase lo que pase. Eso es algo que admiro profundamente en ti.

A veces te miro y siento que tienes pequeñas estrellitas iluminándote a tu alrededor.

Te amo muchísimo. Y quiero que sepas que siempre va a ser así.`;

  let opened = false;
  envelope.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    envelope.classList.add('open');
    setTimeout(() => {
      paper.classList.add('open');
      typeWriter(typedTarget, LETTER_TEXT);
    }, 450);
  });

  function typeWriter(el, text) {
    let i = 0;
    el.textContent = '';
    const speed = 14; // ms por caracter
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
    speed: 350,
    glare: true,
    'max-glare': 0.25,
    scale: 1.02,
  });
})();
