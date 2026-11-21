import {tracks} from './music.js';
import './scene-music.css';

// Compact controls for the same persistent player used in the village.
export function mountSceneMusic(root,player){
  if(!player?.getState)return ()=>{};
  const holder=document.createElement('div');holder.className='scene-music';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='scene-music-toggle';
  toggle.textContent='♫ Música';toggle.setAttribute('aria-expanded','false');
  const panel=document.createElement('section');panel.className='scene-music-panel';panel.hidden=true;
  panel.setAttribute('aria-label','Música de la isla');
  const heading=document.createElement('div');heading.className='scene-music-heading';
  const title=document.createElement('strong');title.textContent='La música de nuestro baile';
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Cerrar música de la isla');
  heading.append(title,close);
  const label=document.createElement('label');label.textContent='Nuestra canción';
  const select=document.createElement('select');select.setAttribute('aria-label','Canción para bailar');
  for(const track of tracks){const option=document.createElement('option');option.value=track.filename;
    option.textContent=track.title+(track.artist?' · '+track.artist:'');select.append(option);}
  label.append(select);
  const actions=document.createElement('div');actions.className='scene-music-actions';
  function button(text,name,run){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',name);b.addEventListener('click',run);actions.append(b);return b;}
  button('‹','Canción anterior en la isla',()=>player.previous());
  const play=button('Reproducir','Reproducir música en la isla',()=>player.getState().playing?player.pause():player.play());
  button('›','Siguiente canción en la isla',()=>player.next());
  const volumeLabel=document.createElement('label');volumeLabel.textContent='Volumen';
  const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='100';volume.setAttribute('aria-label','Volumen de música en la isla');volumeLabel.append(volume);
  const status=document.createElement('p');status.className='scene-music-status';status.setAttribute('role','status');
  const hint=document.createElement('p');hint.className='scene-music-hint';hint.textContent='Elige una canción y luego regálame un baile.';
  panel.append(heading,label,actions,volumeLabel,status,hint);holder.append(toggle,panel);root.append(holder);
  function setOpen(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)select.focus({preventScroll:true});else toggle.focus({preventScroll:true});}
  toggle.addEventListener('click',()=>setOpen(panel.hidden));close.addEventListener('click',()=>setOpen(false));
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);}});
  select.addEventListener('change',()=>player.choose(select.value));
  volume.addEventListener('input',()=>player.setVolume(Number(volume.value)/100));
  const unsubscribe=player.subscribe(state=>{
    select.value=state.track.filename;volume.value=String(Math.round(state.volume*100));
    play.textContent=state.playing?'Pausar':'Reproducir';play.setAttribute('aria-label',state.playing?'Pausar música en la isla':'Reproducir música en la isla');
    toggle.textContent=state.playing?'♫ Música · sonando':'♫ Música';
    const text=!state.playing&&/^No se pudo|^El navegador no pudo/.test(state.status)
      ?state.status:(state.playing?'Sonando: ':'Lista: ')+state.track.title;
    if(status.textContent!==text)status.textContent=text;
  });
  return ()=>{unsubscribe();holder.remove();};
}
