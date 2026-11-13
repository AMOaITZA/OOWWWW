import files from './data/audio.json' with {type:'json'};

const TRACK_KEY='oowwww-audio-track-v1';
const VOLUME_KEY='oowwww-audio-volume-v1';

export function parseTrackFilename(filename){
  if(typeof filename!=='string'||!/\.mp3$/i.test(filename))throw Error('Nombre de audio inválido');
  const name=filename.replace(/\.mp3$/i,'').replace(/ - Spotimate\.app$/i,'');
  const split=name.lastIndexOf(' - ');
  return {
    filename,
    title:split>=0?name.slice(0,split):name,
    artist:split>=0?name.slice(split+3):''
  };
}
export const tracks=files.map(parseTrackFilename);
export function trackUrl(filename){
  if(!files.includes(filename))throw Error('Audio fuera del catálogo');
  return '/assets/game/audio/'+encodeURIComponent(filename);
}
const timeLabel=seconds=>{
  if(!Number.isFinite(seconds)||seconds<0)return '0:00';
  const value=Math.floor(seconds);
  return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');
};

// La etiqueta audio existe fuera de las experiencias y no se reinicia al abrirlas.
export function createMusicPlayer({openPlaylist=()=>{}}={}){
  const $=id=>document.getElementById(id);
  const dock=$('music-dock'),audio=$('music-audio');
  const title=$('music-track-title'),artist=$('music-track-artist');
  const number=$('music-track-number'),status=$('music-status');
  const musicButton=$('music-button'),hideButton=$('music-close');
  const playButton=$('music-play'),stopButton=$('music-stop');
  const prevButton=$('music-prev'),nextButton=$('music-next');
  const listButton=$('music-list'),seek=$('music-seek');
  const volume=$('music-volume'),clock=$('music-time');
  let index=0;

  try{
    const stored=localStorage.getItem(TRACK_KEY);
    const found=tracks.findIndex(track=>track.filename===stored);
    if(found>=0)index=found;
  }catch{}
  let startingVolume=.75;
  try{
    const saved=localStorage.getItem(VOLUME_KEY);
    if(saved!==null && Number.isFinite(Number(saved)) && Number(saved)>=0 && Number(saved)<=1)
      startingVolume=Number(saved);
  }catch{}
  audio.volume=startingVolume;
  volume.value=String(Math.round(startingVolume*100));

  function syncTrack(){
    const track=tracks[index];
    title.textContent=track.title;
    artist.textContent=track.artist;
    number.textContent=(index+1)+' / '+tracks.length;
  }
  function syncPlayback(){
    const playing=!audio.paused&&!audio.ended;
    playButton.textContent=playing?'Pausar':'Reproducir';
    playButton.setAttribute('aria-label',playing?'Pausar música':'Reproducir música');
    musicButton.textContent=playing?'Música ♪':'Música';
    clock.textContent=timeLabel(audio.currentTime)+' / '+timeLabel(audio.duration);
    const duration=audio.duration;
    seek.disabled=!(Number.isFinite(duration)&&duration>0);
    seek.value=seek.disabled?'0':String(Math.round(audio.currentTime/duration*1000));
  }
  function show(){
    // A song can finish or be selected inside a modal. Keep its controls out
    // of the way until the dialog releases the background; audio is untouched.
    if(dock.inert){dock.dataset.reopenAfterDialog='true';return;}
    dock.hidden=false;
    musicButton.setAttribute('aria-expanded','true');
  }
  function hide(){
    dock.hidden=true;
    delete dock.dataset.reopenAfterDialog;
    musicButton.setAttribute('aria-expanded','false');
    musicButton.focus();
  }
  function play(){
    if(!audio.getAttribute('src'))audio.src=trackUrl(tracks[index].filename);
    status.textContent='Cargando audio…';
    try{
      const promise=audio.play();
      promise?.catch?.(error=>{
        if(error.name==='AbortError')return;
        status.textContent='No se pudo iniciar. Pulsa Reproducir otra vez.';
        syncPlayback();
      });
    }catch{
      status.textContent='El navegador no pudo iniciar la reproducción.';
    }
  }
  function setTrack(next,{autoplay=true,reveal=true}={}){
    index=(next+tracks.length)%tracks.length;
    audio.pause();
    audio.src=trackUrl(tracks[index].filename);
    syncTrack();
    syncPlayback();
    status.textContent='Canción seleccionada';
    try{localStorage.setItem(TRACK_KEY,tracks[index].filename);}catch{}
    if(reveal)show();
    if(autoplay)play();
  }
  function select(filename){
    const found=tracks.findIndex(track=>track.filename===filename);
    if(found<0)return false;
    setTrack(found);
    return true;
  }

  musicButton.addEventListener('click',()=>dock.hidden?show():hide());
  dock.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();hide();}
  });
  hideButton.addEventListener('click',hide);
  playButton.addEventListener('click',()=>audio.paused?play():audio.pause());
  stopButton.addEventListener('click',()=>{
    audio.pause();
    if(Number.isFinite(audio.duration))audio.currentTime=0;
    status.textContent='Reproducción detenida';
    syncPlayback();
  });
  prevButton.addEventListener('click',()=>setTrack(index-1));
  nextButton.addEventListener('click',()=>setTrack(index+1));
  listButton.addEventListener('click',()=>{hide();openPlaylist();});
  seek.addEventListener('input',()=>{
    if(Number.isFinite(audio.duration)&&audio.duration>0)
      audio.currentTime=Number(seek.value)/1000*audio.duration;
  });
  volume.addEventListener('input',()=>{
    audio.volume=Number(volume.value)/100;
    try{localStorage.setItem(VOLUME_KEY,String(audio.volume));}catch{}
  });
  audio.addEventListener('play',()=>{status.textContent='Reproduciendo';syncPlayback();});
  audio.addEventListener('playing',()=>{status.textContent='Reproduciendo';syncPlayback();});
  audio.addEventListener('pause',syncPlayback);
  audio.addEventListener('timeupdate',syncPlayback);
  audio.addEventListener('durationchange',syncPlayback);
  audio.addEventListener('loadedmetadata',syncPlayback);
  audio.addEventListener('waiting',()=>{status.textContent='Cargando audio…';});
  audio.addEventListener('error',()=>{status.textContent='No se pudo cargar este MP3.';syncPlayback();});
  audio.addEventListener('ended',()=>setTrack(index+1,{reveal:false}));
  syncTrack();
  syncPlayback();
  status.textContent='Elige una canción o pulsa Reproducir';
  return {select,show,hide,isOpen:()=>!dock.hidden,selected:()=>tracks[index]};
}
