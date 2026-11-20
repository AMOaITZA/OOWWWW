export const HOME_VIDEO_PATTERN=/^\/assets\/game\/home\/videos\/nuestro-video\.(mp4|webm)$/;

export function findHomeVideo(files={}){
  return Object.entries(files).filter(([path,url])=>HOME_VIDEO_PATTERN.test(path)&&typeof url==='string')
    .sort(([a],[b])=>a.endsWith('.mp4')?-1:b.endsWith('.mp4')?1:a.localeCompare(b))
    .map(([path,url])=>({filename:path.split('/').at(-1),url}))[0]??null;
}
let installed={};
try{installed=import.meta.glob('/assets/game/home/videos/nuestro-video.{mp4,webm}',{eager:true,query:'?url',import:'default'});}catch{}
export const homeVideo=findHomeVideo(installed);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function normalizeHomeVideoState(saved){
  return {position:Number.isFinite(saved?.position)?clamp(saved.position,0,86400):0,
    volume:Number.isFinite(saved?.volume)?clamp(saved.volume,0,1):.8,muted:saved?.muted===true};
}

// A source is attached only after an intentional play. Leaving the TV releases
// the decoder and keeps the last position; opening the house never autoplays.
export function createHomeVideoPlayer({video,source=homeVideo,saved,onChange=()=>{},
  onPlayback=()=>{},onError=()=>{},onUpdate=()=>{},isVisible=()=>typeof document==='undefined'||!document.hidden}){
  let state=normalizeHomeVideoState(saved),pendingPosition=state.position,active=false,disposed=false,metadataReady=false;
  video.preload='none';video.playsInline=true;video.volume=state.volume;video.muted=state.muted;
  const available=()=>Boolean(source);
  const isPlaying=()=>!disposed&&!video.paused&&!video.ended;
  const duration=()=>Number.isFinite(video.duration)&&video.duration>0?video.duration:0;
  function getState(){
    const position=metadataReady&&video.getAttribute('src')&&Number.isFinite(video.currentTime)?Math.max(0,video.currentTime):pendingPosition;
    return {...state,position};
  }
  function persist(){state=getState();pendingPosition=state.position;onChange({...state});}
  function restore(){
    if(!duration())return;
    pendingPosition=pendingPosition>=duration()?0:Math.min(pendingPosition,duration());
    metadataReady=true;video.currentTime=pendingPosition;onUpdate();
  }
  function pause(){
    if(disposed)return;
    video.pause();persist();onPlayback(false);onUpdate();
  }
  function suspend(){
    if(disposed)return;
    pause();metadataReady=false;video.removeAttribute('src');video.load();onUpdate();
  }
  function setActive(value){
    active=Boolean(value);
    if(!active)suspend();
  }
  async function play(){
    if(disposed||!active||!source||!isVisible())return false;
    if(!video.getAttribute('src')||video.error){metadataReady=false;video.src=source.url;}
    else if(video.ended){pendingPosition=0;video.currentTime=0;}
    try{
      await video.play();
      if(disposed||!active||!isVisible()){video.pause();return false;}
      onUpdate();return true;
    }catch(error){
      if(!disposed&&error.name!=='AbortError')onError(error);
      onPlayback(false);onUpdate();return false;
    }
  }
  function seek(value){
    if(disposed||!duration()||!Number.isFinite(value))return false;
    pendingPosition=clamp(value,0,duration());video.currentTime=pendingPosition;persist();onUpdate();return true;
  }
  function setVolume(value){
    if(disposed||!Number.isFinite(value))return false;
    state.volume=clamp(value,0,1);video.volume=state.volume;persist();onUpdate();return true;
  }
  function setMuted(value){
    if(disposed)return;
    state.muted=Boolean(value);video.muted=state.muted;persist();onUpdate();
  }
  function onPlay(){
    if(disposed||!active||!isVisible()){video.pause();return;}
    onPlayback(true);onUpdate();
  }
  function onPause(){if(disposed)return;persist();onPlayback(false);onUpdate();}
  function onEnded(){if(disposed)return;persist();onPlayback(false);onUpdate();}
  function onTime(){if(disposed)return;persist();onUpdate();}
  function onVolume(){
    if(disposed)return;
    state.volume=Number.isFinite(video.volume)?clamp(video.volume,0,1):state.volume;
    state.muted=video.muted===true;persist();onUpdate();
  }
  function onMediaError(){if(!disposed&&video.getAttribute('src')){onPlayback(false);onError(video.error);onUpdate();}}
  const listeners=[['loadedmetadata',restore],['play',onPlay],['pause',onPause],['ended',onEnded],
    ['timeupdate',onTime],['volumechange',onVolume],['seeked',onUpdate],['loadeddata',onUpdate],['error',onMediaError]];
  for(const [name,handler] of listeners)video.addEventListener(name,handler);
  function dispose(){
    if(disposed)return;
    pause();disposed=true;active=false;
    for(const [name,handler] of listeners)video.removeEventListener(name,handler);
    metadataReady=false;video.removeAttribute('src');video.load();
  }
  return {available,isPlaying,duration,getState,setActive,play,pause,suspend,seek,setVolume,setMuted,dispose};
}

export function drawHomeVideoFrame(ctx,video,box){
  if(video.readyState<2||!video.videoWidth||!video.videoHeight)return false;
  const scale=Math.min(box.width/video.videoWidth,box.height/video.videoHeight);
  const width=video.videoWidth*scale,height=video.videoHeight*scale;
  ctx.fillStyle='#1B1E25';ctx.fillRect(box.x,box.y,box.width,box.height);
  ctx.drawImage(video,0,0,video.videoWidth,video.videoHeight,
    box.x+(box.width-width)/2,box.y+(box.height-height)/2,width,height);
  return true;
}

export function homeVideoTime(seconds){
  const value=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0;
  return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');
}
