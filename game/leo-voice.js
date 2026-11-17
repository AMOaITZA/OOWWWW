// Gentle synthetic syllables, unlocked only by a deliberate user gesture.
export const MAX_VOICE_SECONDS=.98;
export const normalizeLeoVoice=saved=>({enabled:saved?.enabled!==false});
export function voiceSyllables(text){
  const letters=String(text??'').replace(/\s/g,'');
  if(!letters)return [];
  const count=Math.min(9,Math.max(4,Math.ceil(letters.length/5)));
  return Array.from({length:count},(_,index)=>({offset:index*.103,duration:.078,
    pitch:215+((letters.charCodeAt(index%letters.length)+index*17)%65)}));
}
const defaultContext=()=>{
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  return Audio?new Audio({latencyHint:'interactive'}):null;
};
export function createLeoVoice({saved,onChange=()=>{},createAudioContext=defaultContext,
  eventTarget=globalThis.document,isHidden=()=>Boolean(globalThis.document?.hidden)}={}){
  let enabled=normalizeLeoVoice(saved).enabled,context=null,button=null,disposed=false;
  const active=new Set(),getState=()=>({enabled});
  function refresh(){
    if(!button)return;
    button.textContent=enabled?'Voz: sí':'Voz: no';
    button.setAttribute('aria-label','Voz de Leo');button.setAttribute('aria-pressed',String(enabled));
    button.title=enabled?'Silenciar la vocecita de Leo':'Activar la vocecita de Leo';
  }
  function stop(){
    if(!context)return;
    const at=context.currentTime;
    for(const syllable of active)try{
      syllable.gain.gain.cancelScheduledValues(at);syllable.gain.gain.setTargetAtTime(.0001,at,.003);
      syllable.oscillator.stop(at+.015);
    }catch{}
    active.clear();
  }
  function setEnabled(value){
    if(typeof value!=='boolean'||enabled===value||disposed)return false;
    enabled=value;if(!enabled)stop();refresh();onChange(getState());return true;
  }
  async function unlock(){
    if(!enabled||disposed||isHidden())return false;
    try{context??=createAudioContext();if(!context)return false;
      if(context.state==='suspended')await context.resume();return context.state==='running';
    }catch{return false;}
  }
  function speak(text){
    if(!enabled||disposed||isHidden()||!context||context.state!=='running')return false;
    const syllables=voiceSyllables(text);if(!syllables.length)return false;
    stop();const start=context.currentTime+.025;
    try{
      for(const {offset,duration,pitch} of syllables){
        const at=start+offset,oscillator=context.createOscillator(),filter=context.createBiquadFilter(),gain=context.createGain();
        oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(pitch*.88,at);
        oscillator.frequency.linearRampToValueAtTime(pitch,at+.018);
        oscillator.frequency.linearRampToValueAtTime(pitch*.93,at+duration);
        filter.type='bandpass';filter.frequency.value=1120;filter.Q.value=.75;
        gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.075,at+.012);
        gain.gain.setValueAtTime(.052,at+.040);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
        oscillator.connect(filter);filter.connect(gain);gain.connect(context.destination);
        const syllable={oscillator,filter,gain};active.add(syllable);
        oscillator.onended=()=>{active.delete(syllable);for(const node of [oscillator,filter,gain])try{node.disconnect();}catch{}};
        oscillator.start(at);oscillator.stop(at+duration+.008);
      }
      return true;
    }catch{stop();return false;}
  }
  function mount(container){
    if(!container||button||disposed)return button;
    button=document.createElement('button');button.type='button';button.id='leo-voice-toggle';
    button.className='hud-button leo-voice-toggle';
    button.addEventListener('click',()=>{setEnabled(!enabled);if(enabled)void unlock();});
    refresh();container.append(button);return button;
  }
  function visibility(){if(isHidden())stop();}
  eventTarget?.addEventListener?.('visibilitychange',visibility);
  function dispose(){
    if(disposed)return;stop();disposed=true;button?.remove();
    eventTarget?.removeEventListener?.('visibilitychange',visibility);
    try{context?.close?.()?.catch?.(()=>{});}catch{}
  }
  return {unlock,speak,stop,getState,setEnabled,mount,dispose};
}
