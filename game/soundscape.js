import {makeSoundSamples,EFFECT_SAMPLE_RATE,EFFECT_DURATIONS} from './sound-samples.js';

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function normalizeSoundEffects(saved){
  return {enabled:saved?.enabled!==false,
    volume:typeof saved?.volume==='number'&&Number.isFinite(saved.volume)?clamp(saved.volume,0,1):.35};
}
const defaultContext=()=>{
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  return Audio?new Audio({latencyHint:'interactive'}):null;
};
export const MAX_SOUND_SOURCES=10;
const levels={meow:.6,splash:.48,chime:.36,water:.13,crickets:.1};

export function createSoundscape({saved,onChange=()=>{},createAudioContext=defaultContext,
  now=()=>globalThis.performance?.now?.()??Date.now(),eventTarget=globalThis.document,
  isHidden=()=>Boolean(globalThis.document?.hidden)}={}){
  let state=normalizeSoundEffects(saved),context=null,master=null,compressor=null,disposed=false;
  let environment={active:false,night:false,nearWater:false},controls=null,toggle=null,slider=null,levelLabel=null;
  const buffers=new Map(),sources=new Set(),loops=new Map(),lastPlayed=new Map(),suspensions=new Set();
  const getState=()=>({...state});
  function refresh(){
    if(!controls)return;
    toggle.textContent=state.enabled?'Efectos: sí':'Efectos: no';
    toggle.setAttribute('aria-pressed',String(state.enabled));
    slider.value=String(Math.round(state.volume*100));levelLabel.textContent=slider.value+'%';
  }
  function stopSource(item){
    if(!sources.has(item))return;
    sources.delete(item);
    if(loops.get(item.kind)===item)loops.delete(item.kind);
    try{
      const at=context?.currentTime??0;
      item.gain.gain.cancelScheduledValues(at);item.gain.gain.setTargetAtTime(.0001,at,.004);
      item.source.stop(at+.025);
    }catch{try{item.source.disconnect();item.gain.disconnect();}catch{}}
  }
  function stop(){for(const item of [...sources])stopSource(item);}
  function available(){
    return !disposed&&state.enabled&&state.volume>0&&!isHidden()&&!suspensions.size&&
      context?.state==='running';
  }
  function bufferFor(kind){
    if(buffers.has(kind))return buffers.get(kind);
    const samples=makeSoundSamples(kind),buffer=context.createBuffer(1,samples.length,EFFECT_SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);buffers.set(kind,buffer);return buffer;
  }
  function play(kind,{loop=false}={}){
    if(!available())return false;
    if(loop&&loops.has(kind))return true;
    if(sources.size>=MAX_SOUND_SOURCES){
      const oldest=[...sources].find(item=>!item.loop);
      if(oldest)stopSource(oldest);else return false;
    }
    try{
      const source=context.createBufferSource(),gain=context.createGain(),at=context.currentTime;
      source.buffer=bufferFor(kind);source.loop=loop;
      gain.gain.setValueAtTime(.0001,at);
      gain.gain.linearRampToValueAtTime(levels[kind],at+(loop ? .15 : .009));
      if(!loop)gain.gain.setTargetAtTime(.0001,at+EFFECT_DURATIONS[kind]-.025,.012);
      source.connect(gain);gain.connect(master);
      const item={source,gain,kind,loop};sources.add(item);if(loop)loops.set(kind,item);
      source.onended=()=>{
        sources.delete(item);if(loops.get(kind)===item)loops.delete(kind);
        try{source.disconnect();gain.disconnect();}catch{}
      };
      source.start(at);if(!loop)source.stop(at+EFFECT_DURATIONS[kind]+.01);
      return true;
    }catch{return false;}
  }
  function syncEnvironment(){
    const active=available()&&environment.active;
    for(const [kind,wanted] of [['water',active&&environment.nearWater],['crickets',active&&environment.night]]){
      if(wanted)play(kind,{loop:true});else if(loops.has(kind))stopSource(loops.get(kind));
    }
  }
  function applyVolume(){
    if(master&&context)try{master.gain.setTargetAtTime(state.volume*.6,context.currentTime,.015);}catch{}
  }
  async function unlock(){
    if(disposed||!state.enabled||isHidden())return false;
    try{
      if(!context){
        context=createAudioContext();if(!context)return false;
        master=context.createGain();
        compressor=context.createDynamicsCompressor?.()??null;
        if(compressor){
          compressor.threshold.value=-18;compressor.knee.value=12;compressor.ratio.value=4;
          compressor.attack.value=.003;compressor.release.value=.15;
          master.connect(compressor);compressor.connect(context.destination);
        }else master.connect(context.destination);
        applyVolume();
      }
      if(context.state!=='running'&&context.state!=='closed')await context.resume();
      if(disposed)return false;syncEnvironment();return context.state==='running';
    }catch{return false;}
  }
  function setEnabled(enabled){
    if(typeof enabled!=='boolean'||disposed||state.enabled===enabled)return false;
    state={...state,enabled};if(!enabled)stop();else syncEnvironment();
    refresh();onChange(getState());return true;
  }
  function setVolume(value){
    if(typeof value!=='number'||!Number.isFinite(value)||disposed)return false;
    const volume=Math.round(clamp(value,0,1)*1000)/1000;
    if(volume===state.volume)return false;
    state={...state,volume};applyVolume();if(!volume)stop();else syncEnvironment();
    refresh();onChange(getState());return true;
  }
  function oneShot(kind,group,interval){
    if(!available())return false;
    const at=now();if(at-(lastPlayed.get(group)??-Infinity)<interval)return false;
    const played=play(kind);if(played)lastPlayed.set(group,at);return played;
  }
  function setEnvironment(next={}){
    environment={active:next.active===true,night:next.night===true,nearWater:next.nearWater===true};
    syncEnvironment();
  }
  function suspend(reason='media'){suspensions.add(reason);stop();}
  function resume(reason='media'){suspensions.delete(reason);syncEnvironment();}
  function visibility(){if(isHidden())stop();else syncEnvironment();}
  eventTarget?.addEventListener?.('visibilitychange',visibility);
  function mount(container){
    if(!container||controls||disposed||typeof document==='undefined')return controls;
    controls=document.createElement('section');controls.className='soundscape-controls';
    controls.setAttribute('aria-label','Efectos del mundo');
    toggle=document.createElement('button');toggle.type='button';toggle.id='sound-effects-toggle';
    toggle.setAttribute('aria-label','Efectos de sonido');
    toggle.addEventListener('click',()=>{setEnabled(!state.enabled);if(state.enabled)void unlock();});
    const description=document.createElement('span');description.className='soundscape-description';
    description.textContent='Gatos, agua y grillos';
    const label=document.createElement('label');label.className='soundscape-volume';label.htmlFor='sound-effects-volume';
    const caption=document.createElement('span');caption.textContent='Volumen de efectos';
    slider=document.createElement('input');slider.type='range';slider.id='sound-effects-volume';
    slider.min='0';slider.max='100';slider.step='1';slider.setAttribute('aria-label','Volumen de efectos');
    slider.addEventListener('input',()=>setVolume(Number(slider.value)/100));
    levelLabel=document.createElement('output');levelLabel.htmlFor=slider.id;
    label.append(caption,slider,levelLabel);controls.append(toggle,description,label);container.append(controls);
    refresh();return controls;
  }
  function dispose(){
    if(disposed)return;disposed=true;stop();controls?.remove();
    eventTarget?.removeEventListener?.('visibilitychange',visibility);
    try{master?.disconnect();compressor?.disconnect();context?.close?.()?.catch?.(()=>{});}catch{}
    buffers.clear();
  }
  return {unlock,mount,getState,setEnabled,setVolume,setEnvironment,suspend,resume,stop,dispose,
    meow:()=>oneShot('meow','meow',700),splash:()=>oneShot('splash','splash',220),
    chime:()=>oneShot('chime','chime',180)};
}
