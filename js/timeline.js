/* =====================================================================
   TIMELINE.JS — revela cada hito con un IntersectionObserver
   (independiente de AOS para que la línea del tiempo se sienta
   secuencial: cada tarjeta aparece cuando su punto entra en pantalla)
===================================================================== */
(function timelineReveal() {
  const items = document.querySelectorAll('.t-item');
  if (!items.length) return;

  items.forEach((item) => item.classList.add('fade-up'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  items.forEach((item) => observer.observe(item));
})();

