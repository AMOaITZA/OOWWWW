import songs from './data/songs.json';

const SAVE_KEY='oowwww-music-track-v1';

// Solo se emplea el reproductor oficial de YouTube; nunca se extrae el audio.
export function youtubeEmbedUrl(videoId){
  if(!/^[a-zA-Z0-9_-]{11}$/.test(videoId))throw Error('ID de YouTube inválido');
  return 'https://www.youtube-nocookie.com/embed/'+videoId+'?playsinline=1&rel=0';
}
export function createMusicPlayer(){
  const dock=document.getElementById('music-dock');
  const slot=document.getElementById('music-video');
  const heading=document.getElementById('music-track-title');
  const artist=document.getElementById('music-track-artist');
  const counter=document.getElementById('music-track-number');
  const link=document.getElementById('music-youtube-link');
  const button=document.getElementById('music-button');
  const closeButton=document.getElementById('music-close');
  const previousButton=document.getElementById('music-prev');
  const nextButton=document.getElementById('music-next');
  let index=0;

  // Se recuerda la canción, no se reproduce automáticamente al recargar.
  try {
    const saved=localStorage.getItem(SAVE_KEY);
    const found=songs.findIndex(song=>song.videoId===saved);
    if(found>=0)index=found;
  } catch {}

  function show(){
    const song=songs[index];
    heading.textContent=song.title;
    artist.textContent=song.artist;
    counter.textContent=(index+1)+' / '+songs.length;
    link.href='https://www.youtube.com/watch?v='+song.videoId;
    const frame=document.createElement('iframe');
    frame.title='YouTube: '+song.title+' — '+song.artist;
    frame.src=youtubeEmbedUrl(song.videoId);
    frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen=true;
    frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.loading='eager';
    slot.replaceChildren(frame);
    dock.hidden=false;
    button.setAttribute('aria-expanded','true');
    try {localStorage.setItem(SAVE_KEY,song.videoId);} catch {}
  }
  function close(){
    // Retirar el iframe detiene la reproducción: nunca queda audio oculto.
    slot.replaceChildren();
    dock.hidden=true;
    button.setAttribute('aria-expanded','false');
    button.focus();
  }
  function select(videoId){
    const found=songs.findIndex(song=>song.videoId===videoId);
    if(found<0)return false;
    index=found;
    show();
    return true;
  }
  button.addEventListener('click',()=>{
    if(dock.hidden)show();
    else closeButton.focus();
  });
  closeButton.addEventListener('click',close);
  previousButton.addEventListener('click',()=>{index=(index-1+songs.length)%songs.length;show();});
  nextButton.addEventListener('click',()=>{index=(index+1)%songs.length;show();});
  return {select,show,close,isOpen:()=>!dock.hidden,selected:()=>songs[index]};
}
