/* =====================================================================
   AJUSTES.JS — Libro de razones (paginado automático) y beso del final
===================================================================== */

/* ---------- LIBRO DE RAZONES ---------- */
(function () {
  const source = document.getElementById('reasonsGrid');
  const spread = document.getElementById('bookSpread');
  if (!source || !spread) return;

  const reasons = [...source.querySelectorAll('.r-chip p')].map((p) => p.textContent.trim());
  const lists = [...spread.querySelectorAll('.book-list')];
  const nums = [...spread.querySelectorAll('.book-pageno')];
  const prev = document.getElementById('bookPrev');
  const next = document.getElementById('bookNext');
  const counter = document.getElementById('bookCounter');
  const mobileQuery = window.matchMedia('(max-width: 759px)');

  let pages = [];      // cada página = arreglo de razones
  let perSpread = 2;   // páginas visibles a la vez
  let spreadIndex = 0;

  const makeItem = (text) => {
    const d = document.createElement('div');
    d.className = 'book-reason';
    d.innerHTML = '<i class="fa-solid fa-heart"></i><span></span>';
    d.lastChild.textContent = text;
    return d;
  };

  // Reparte las razones midiendo en la propia página: nunca se salen del libro
  function paginate() {
    const probe = lists[0];
    if (!probe.clientHeight) return false;      // aún no es visible
    perSpread = mobileQuery.matches ? 1 : 2;
    pages = [];
    let current = [];
    probe.innerHTML = '';
    reasons.forEach((text) => {
      const el = makeItem(text);
      probe.appendChild(el);
      if (probe.scrollHeight > probe.clientHeight + 1 && current.length) {
        probe.removeChild(el);
        pages.push(current);
        current = [];
        probe.innerHTML = '';
        probe.appendChild(el);
      }
      current.push(text);
    });
    if (current.length) pages.push(current);
    probe.innerHTML = '';
    return true;
  }

  function render(animate) {
    const totalSpreads = Math.max(1, Math.ceil(pages.length / perSpread));
    spreadIndex = Math.min(Math.max(spreadIndex, 0), totalSpreads - 1);
    lists.forEach((list, i) => {
      list.innerHTML = '';
      const pageNo = spreadIndex * perSpread + i;
      const items = pages[pageNo] || [];
      items.forEach((t) => list.appendChild(makeItem(t)));
      nums[i].textContent = items.length ? pageNo + 1 : '';
    });
    const first = spreadIndex * perSpread + 1;
    const last = Math.min(first + perSpread - 1, pages.length);
    counter.textContent = (first === last ? 'Página ' + first : 'Páginas ' + first + '–' + last) + ' de ' + pages.length;
    prev.disabled = spreadIndex === 0;
    next.disabled = spreadIndex >= totalSpreads - 1;
    if (animate) {
      spread.classList.remove('flip');
      void spread.offsetWidth;
      spread.classList.add('flip');
    }
  }

  function build() {
    const firstPage = spreadIndex * perSpread;   // conserva dónde ibas al cambiar de tamaño
    if (!paginate()) return;
    spreadIndex = Math.floor(firstPage / perSpread);
    render(false);
  }

  const go = (d) => { spreadIndex += d; render(true); };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  // deslizar con el dedo en el celular
  let startX = null;
  spread.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  spread.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  // Se arma cuando la experiencia ya es visible y las fuentes están cargadas
  const ready = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());
  window.addEventListener('experience:entered', () => ready().then(() => requestAnimationFrame(build)));
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 150); });
})();

/* ---------- FINAL: pareja mirándose → beso cada vez que le pican ---------- */
(function () {
  const art = document.getElementById('goArt');
  const btn = document.getElementById('btnFinal');
  if (!art || !btn) return;
  let timer;
  btn.addEventListener('click', () => {
    art.classList.remove('is-kissing');
    void art.offsetWidth;                 // reinicia la animación en cada clic
    art.classList.add('is-kissing');
    clearTimeout(timer);
    timer = setTimeout(() => art.classList.remove('is-kissing'), 1800);
  });
})();
