import test from 'node:test';
import assert from 'node:assert/strict';
import {createLeoVoice,normalizeLeoVoice,voiceSyllables,MAX_VOICE_SECONDS} from '../game/leo-voice.js';
function audio(){
  const oscillators=[],params=[],listeners={};let hidden=false,created=0;
  const param=()=>Object.fromEntries(['setValueAtTime','linearRampToValueAtTime','exponentialRampToValueAtTime','cancelScheduledValues','setTargetAtTime'].map(key=>[key,(...args)=>params.push([key,...args])]));
  const node=()=>({connect(){},disconnect(){}});
  const context={currentTime:0,state:'suspended',destination:{},resume:async()=>{context.state='running';},close:async()=>{context.state='closed';},
    createOscillator(){const n={...node(),frequency:param(),starts:[],stops:[],start(t){this.starts.push(t);},stop(t){this.stops.push(t);}};oscillators.push(n);return n;},
    createBiquadFilter:()=>({...node(),frequency:{},Q:{}}),createGain:()=>({...node(),gain:param()})};
  const voice=createLeoVoice({createAudioContext:()=>{created++;return context;},isHidden:()=>hidden,
    eventTarget:{addEventListener:(type,fn)=>{listeners[type]=fn;},removeEventListener:type=>delete listeners[type]}});
  return {voice,context,oscillators,params,created:()=>created,hide(){hidden=true;listeners.visibilitychange();}};
}
test('voice syllables are short, bounded and silent for empty text',()=>{
  assert.deepEqual(voiceSyllables('   '),[]);
  const syllables=voiceSyllables('te amo '.repeat(100));assert.equal(syllables.length,9);
  assert.ok(syllables.at(-1).offset+syllables.at(-1).duration+.033<MAX_VOICE_SECONDS);
  assert.ok(syllables.every(s=>s.pitch>=215&&s.pitch<=279));
});
test('no audio context or oscillation exists before a user unlock',()=>{
  const a=audio();assert.equal(a.voice.speak('hola amor'),false);assert.equal(a.created(),0);
});
test('unlock resumes once and every phrase schedules a gentle syllable burst',async()=>{
  const a=audio();assert.equal(await a.voice.unlock(),true);assert.equal(await a.voice.unlock(),true);assert.equal(a.created(),1);
  assert.equal(a.voice.speak('tus ojitos me enamoran'),true);assert.ok(a.oscillators.length>=4);
  assert.ok(a.oscillators.every(n=>n.starts.length===1&&n.stops.length===1));
  assert.ok(a.params.some(([name,value])=>name==='exponentialRampToValueAtTime'&&value===.075));
});
test('a new phrase cancels the previous one rather than overlapping bursts',async()=>{
  const a=audio();await a.voice.unlock();a.voice.speak('hola');const previous=[...a.oscillators];
  a.voice.speak('te amo');assert.ok(previous.every(n=>n.stops.length===2));
});
test('mute is persisted and blocks voice without changing the dialogue',async()=>{
  const a=audio();await a.voice.unlock();a.voice.speak('amor');a.voice.setEnabled(false);
  assert.deepEqual(a.voice.getState(),{enabled:false});assert.equal(a.voice.speak('otra frase'),false);
  assert.deepEqual(normalizeLeoVoice({enabled:false}),{enabled:false});
  assert.deepEqual(normalizeLeoVoice(),{enabled:true});
});
test('hiding the page stops active sound and disposal prevents new sound',async()=>{
  const a=audio();await a.voice.unlock();a.voice.speak('amor');a.hide();
  assert.equal(a.voice.speak('amor'),false);assert.ok(a.oscillators.every(n=>n.stops.length===2));
  a.voice.dispose();assert.equal(await a.voice.unlock(),false);
});
test('missing audio support leaves every phrase usable without throwing',async()=>{
  const voice=createLeoVoice({createAudioContext:()=>null});assert.equal(await voice.unlock(),false);assert.equal(voice.speak('amor'),false);
});
