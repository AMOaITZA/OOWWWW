export const VOICE_NOTE_PATTERN=/^\/assets\/game\/voice-notes\/(mensaje-(\d{2})\.mp3)$/;

export function createVoiceNoteCatalog(files={}){
  return Object.entries(files).flatMap(([path,url])=>{
    const match=path.match(VOICE_NOTE_PATTERN);
    if(!match||Number(match[2])<1||typeof url!=='string')return [];
    return [{filename:match[1],number:Number(match[2]),title:'Mensaje '+match[2],url}];
  }).sort((a,b)=>a.number-b.number);
}
let installed={};
// Vite replaces this literal with only files that really exist. Node can still
// import the pure catalog/player helpers for unit tests without a bundler.
try{installed=import.meta.glob('/assets/game/voice-notes/*.mp3',{eager:true,query:'?url',import:'default'});}catch{}
export const voiceNotes=createVoiceNoteCatalog(installed);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function normalizeVoiceNoteState(saved,tracks){
  const selected=tracks.find(track=>track.filename===saved?.filename)??tracks[0];
  return {filename:selected?.filename??null,
    position:selected?.filename===saved?.filename&&Number.isFinite(saved?.position)?Math.max(0,saved.position):0,
    volume:Number.isFinite(saved?.volume)?clamp(saved.volume,0,1):.85};
}
export function createVoiceNotePlayer({tracks=voiceNotes,audio,saved,onChange=()=>{},onPlay=()=>{},onError=()=>{}}){
  let state=normalizeVoiceNoteState(saved,tracks),disposed=false,pendingPosition=state.position;
  audio.volume=state.volume;
  const selected=()=>tracks.find(track=>track.filename===state.filename)??null;
  const duration=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
  function getState(){
    const position=audio.getAttribute('src')&&Number.isFinite(audio.currentTime)?Math.max(0,audio.currentTime):pendingPosition;
    return {...state,position};
  }
  function persist(){state=getState();onChange({...state});}
  function pause(){audio.pause();persist();}
  function select(filename){
    if(disposed||!tracks.some(track=>track.filename===filename))return false;
    if(filename===state.filename)return true;
    audio.pause();audio.removeAttribute('src');audio.load();
    state.filename=filename;state.position=0;pendingPosition=0;persist();return true;
  }
  function restorePosition(){
    if(!duration())return;
    audio.currentTime=pendingPosition>=duration()?0:clamp(pendingPosition,0,duration());
    pendingPosition=audio.currentTime;
  }
  async function play(){
    const track=selected();if(disposed||!track)return false;
    if(!audio.getAttribute('src')){audio.src=track.url;restorePosition();}
    else if(audio.ended){audio.currentTime=0;pendingPosition=0;}
    try{onPlay();await audio.play();return true;}
    catch(error){if(error.name!=='AbortError'&&!disposed)onError(error);return false;}
  }
  function restart(){
    if(disposed||!selected())return false;
    audio.pause();pendingPosition=0;
    if(audio.getAttribute('src'))audio.currentTime=0;
    persist();return true;
  }
  function seek(value){
    if(disposed||!duration()||!Number.isFinite(value))return false;
    audio.currentTime=clamp(value,0,duration());pendingPosition=audio.currentTime;persist();return true;
  }
  function setVolume(value){
    if(disposed||!Number.isFinite(value))return false;
    state.volume=clamp(value,0,1);audio.volume=state.volume;persist();return true;
  }
  function dispose(){
    if(disposed)return;
    audio.pause();persist();disposed=true;
    audio.removeEventListener('loadedmetadata',restorePosition);
    audio.removeAttribute('src');audio.load();
  }
  audio.addEventListener('loadedmetadata',restorePosition);
  return {selected,getState,select,play,pause,restart,seek,setVolume,dispose};
}
export function voiceNoteTime(seconds){
  const value=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0;
  return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');
}
