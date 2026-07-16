/* =====================================================================
   MUSIC.JS — mini reproductor flotante
   ✏️ CAMBIAR: agrega tus archivos .mp3 en assets/music/ y edita la lista
===================================================================== */
const TRACKS = [
  { title: 'Perfect — Ed Sheeran', src: 'assets/music/track-1.mp3' },
  { title: 'Cuéntame — The Marías', src: 'assets/music/track-2.mp3' },
  { title: 'Golden Hour — JVKE', src: 'assets/music/track-3.mp3' },
];

(function musicPlayer() {
  const audio = document.getElementById('audioEl');
  const toggle = document.getElementById('playerToggle');
  const panel = document.getElementById('playerPanel');
  const playBtn = document.getElementById('playerPlay');
  const prevBtn = document.getElementById('playerPrev');
  const nextBtn = document.getElementById('playerNext');
  const muteBtn = document.getElementById('playerMute');
  const seek = document.getElementById('playerSeek');
  const volume = document.getElementById('playerVolume');
  const trackLabel = document.getElementById('playerTrack');

  if (!audio) return;

  let current = 0;
  let isPlaying = false;

  function loadTrack(i) {
    current = (i + TRACKS.length) % TRACKS.length;
    audio.src = TRACKS[current].src;
    trackLabel.textContent = TRACKS[current].title;
  }
  loadTrack(0);
  audio.volume = 0.5;

  toggle.addEventListener('click', () => panel.classList.toggle('open'));

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
    } else {
      // el navegador puede bloquear autoplay sin archivo real; se maneja con catch
      audio.play().catch(() => console.warn('Agrega un archivo mp3 válido en assets/music/'));
    }
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  });
  audio.addEventListener('pause', () => {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  });

  prevBtn.addEventListener('click', () => { loadTrack(current - 1); if (isPlaying) audio.play(); });
  nextBtn.addEventListener('click', () => { loadTrack(current + 1); if (isPlaying) audio.play(); });
  audio.addEventListener('ended', () => { loadTrack(current + 1); audio.play(); });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) seek.value = (audio.currentTime / audio.duration) * 100;
  });
  seek.addEventListener('input', () => {
    if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
  });

  volume.addEventListener('input', () => { audio.volume = volume.value; audio.muted = false; });
  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
  });
})();
