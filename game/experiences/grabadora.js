import {node,labeledButton} from './dom.js';
import {voiceNotes,createVoiceNotePlayer,voiceNoteTime} from '../voice-notes.js';
import './grabadora.css';

export function mount(root,_data,api){
  const shell=node('section','voice-recorder');shell.setAttribute('aria-label','Grabadora de mensajes de Leo');
  const intro=node('p','recorder-intro','Un pedacito de mi voz, para que me tengas cerquita.');
  const cassette=node('div','recorder-cassette');cassette.setAttribute('aria-hidden','true');
  cassette.append(node('span','cassette-love','DE LEO, PARA ITZA'),node('span','cassette-reel reel-left'),node('span','cassette-reel reel-right'),node('span','cassette-window'),node('span','cassette-bottom'));
  const title=node('h3','recorder-track-title','Mi voz para ti');
  const status=node('p','recorder-status',voiceNotes.length?'Elige un mensaje y pulsa Reproducir.':'Pronto habrá mensajes de Leo para ti.');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const audio=node('audio');audio.preload='none';audio.className='voice-note-audio';
  const player=createVoiceNotePlayer({audio,saved:api.save.voiceNotes,
    onChange:state=>{api.save.voiceNotes=state;api.onProgressChange?.();},
    onPlay:()=>api.onVoiceNotePlay?.(),
    onError:()=>{status.textContent='No se pudo reproducir este mensaje. Inténtalo otra vez.';sync();}});
  const controls=node('div','recorder-controls');
  const play=labeledButton('Reproducir',async()=>{
    if(!audio.paused){player.pause();return;}
    status.textContent='Preparando tu mensaje…';await player.play();sync();
  },'recorder-button');
  const restart=labeledButton('Volver al inicio',()=>{player.restart();status.textContent='El mensaje está listo para empezar de nuevo.';sync();},'recorder-button');
  controls.append(play,restart);
  const progress=node('input','recorder-progress');progress.type='range';progress.min='0';progress.max='1000';progress.value='0';progress.setAttribute('aria-label','Progreso del mensaje');
  const clock=node('span','recorder-clock','0:00 / 0:00');
  const progressRow=node('div','recorder-progress-row');progressRow.append(progress,clock);
  const volumeLabel=node('label','recorder-volume','Volumen '),volume=node('input');
  volume.type='range';volume.min='0';volume.max='100';volume.value=String(Math.round(player.getState().volume*100));volume.setAttribute('aria-label','Volumen de los mensajes');volumeLabel.append(volume);
  const count=node('p','recorder-count',voiceNotes.length+' '+(voiceNotes.length===1?'mensaje para ti':'mensajes para ti'));
  const list=node('div','recorder-list');list.setAttribute('role','group');list.setAttribute('aria-label','Mensajes de Leo');
  const choices=[];
  for(const track of voiceNotes){
    const button=labeledButton(track.title,()=>{
      player.select(track.filename);status.textContent='Mensaje elegido. Pulsa Reproducir para escucharlo.';sync();
    },'recorder-message');
    button.dataset.filename=track.filename;choices.push(button);list.append(button);
  }
  let alive=true;
  function sync(){
    if(!alive)return;
    const track=player.selected(),playing=!audio.paused&&!audio.ended;
    title.textContent=track?.title??'Mi voz para ti';
    shell.classList.toggle('is-playing',playing);
    play.textContent=playing?'Pausar':'Reproducir';play.setAttribute('aria-label',playing?'Pausar mensaje':'Reproducir mensaje');
    play.disabled=restart.disabled=!track;
    const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
    progress.disabled=!duration;progress.value=duration?String(Math.round(audio.currentTime/duration*1000)):'0';
    clock.textContent=voiceNoteTime(audio.currentTime)+' / '+voiceNoteTime(duration);
    for(const choice of choices)choice.setAttribute('aria-pressed',String(choice.dataset.filename===track?.filename));
  }
  progress.addEventListener('input',()=>{if(Number.isFinite(audio.duration))player.seek(Number(progress.value)/1000*audio.duration);sync();});
  volume.addEventListener('input',()=>player.setVolume(Number(volume.value)/100));
  const onPlay=()=>{status.textContent='Leo tiene algo que decirte…';sync();};
  const onPause=()=>{if(audio.getAttribute('src')&&!audio.ended)status.textContent='Mensaje en pausa.';sync();};
  const onEnded=()=>{player.pause();status.textContent='Puedes volver a escucharlo cuando quieras.';sync();};
  const listeners=[['play',onPlay],['pause',onPause],['ended',onEnded],['timeupdate',sync],['loadedmetadata',sync],['durationchange',sync]];
  for(const [name,handler] of listeners)audio.addEventListener(name,handler);
  shell.append(intro,cassette,title,status,controls,progressRow,volumeLabel,count,list,audio);root.append(shell);sync();
  return ()=>{alive=false;for(const [name,handler] of listeners)audio.removeEventListener(name,handler);player.dispose();};
}
