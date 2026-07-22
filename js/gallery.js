/* =====================================================================
   GALLERY.JS — masonry hover + lightbox
===================================================================== */
(function galleryInit() {
  const items = document.querySelectorAll('.m-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');
  if (!lightbox) return;

  items.forEach((item) => {
    item.addEventListener('click', () => {
      lightboxImg.src = item.dataset.full;
      lightboxCaption.textContent = item.dataset.caption || '';
      lightbox.classList.add('active');
    });
  });

  function close() { lightbox.classList.remove('active'); }
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

