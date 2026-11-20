import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSoundSamples,EFFECT_SAMPLE_RATE,EFFECT_DURATIONS} from '../game/sound-samples.js';
import {createSoundscape,normalizeSoundEffects,MAX_SOUND_SOURCES} from '../game/soundscape.js';

function fixture(saved){
  let time=0,hidden=false,created=0;const sources=[],buffers=[],parameters=[],listeners={};
  const param=()=>Object.fromEntries(['setValueAtTime','linearRampToValueAtTime','setTargetAtTime','cancelScheduledValues']
    .map(method=>[method,(...args)=>parameters.push({method,args})]));
  const node=()=>({connect(){},disconnect(){}});
  const context={state:'suspended',currentTime:0,destination:{},
    resume:async()=>{context.state='running';},close:async()=>{context.state='closed';},
    createGain:()=>({...node(),gain:param()}),
    createBuffer(channels,length,rate){const data=new Float32Array(length),buffer={channels,length,sampleRate:rate,getChannelData:()=>data};buffers.push(buffer);return buffer;},
    createBufferSource(){const source={...node(),starts:[],stops:[],start(at){this.starts.push(at);},stop(at){this.stops.push(at);}};sources.push(source);return source;}};
  const sound=createSoundscape({saved,createAudioContext:()=>{created++;return context;},now:()=>time,
    isHidden:()=>hidden,eventTarget:{addEventListener:(type,callback)=>{listeners[type]=callback;},removeEventListener:type=>delete listeners[type]}});
  return {sound,context,sources,buffers,parameters,created:()=>created,
    advance(ms){time+=ms;context.currentTime=time/1000;},
    hide(value=true){hidden=value;listeners.visibilitychange?.();}};
}

test('each original sound contains a bounded audible signal with quiet edges',()=>{
  const signatures=new Set();
  for(const kind of Object.keys(EFFECT_DURATIONS)){
    const samples=makeSoundSamples(kind);let energy=0,peak=0,signature=0;
    assert.equal(samples.length,Math.ceil(EFFECT_DURATIONS[kind]*EFFECT_SAMPLE_RATE));
    for(let i=0;i<samples.length;i++){
      assert.ok(Number.isFinite(samples[i]));energy+=samples[i]**2;peak=Math.max(peak,Math.abs(samples[i]));
      if(i%101===0)signature+=samples[i];
    }
    assert.ok(peak<=.800001&&Math.sqrt(energy/samples.length)>.015,kind+' is audible within its headroom');
    assert.equal(samples[0],0);assert.ok(Math.abs(samples.at(-1))<.005,kind+' ends quietly');
    assert.deepEqual(makeSoundSamples(kind),samples,'The buffer can be reproduced without random downloads');
    signatures.add(signature.toFixed(5));
  }
  assert.equal(signatures.size,Object.keys(EFFECT_DURATIONS).length);
});

test('the soundscape stays silent and creates no audio context before a gesture unlock',async()=>{
  const a=fixture();a.sound.setEnvironment({active:true,night:true,nearWater:true});
  assert.equal(a.sound.meow(),false);assert.equal(a.sound.step(),false);assert.equal(a.created(),0);
  assert.equal(await a.sound.unlock(),true);assert.equal(a.created(),1);
  assert.equal(a.sources.length,2);assert.ok(a.sources.every(source=>source.loop));
  await a.sound.unlock();assert.equal(a.created(),1);assert.equal(a.sources.length,2);
});

test('ambient loops follow proximity, night and visible-world state without accumulating sources',async()=>{
  const a=fixture();await a.sound.unlock();
  a.sound.setEnvironment({active:true,nearWater:true,night:false});assert.equal(a.sources.length,1);
  for(let frame=0;frame<120;frame++)a.sound.setEnvironment({active:true,nearWater:true,night:false});
  assert.equal(a.sources.length,1,'An update reuses the active water source');
  a.sound.setEnvironment({active:true,nearWater:true,night:true});assert.equal(a.sources.length,2);
  const loops=[...a.sources];a.sound.setEnvironment({active:false,nearWater:true,night:true});
  assert.ok(loops.every(source=>source.stops.length===1),'A dialog stops the world loops');
  a.sound.setEnvironment({active:true,nearWater:true,night:true});assert.equal(a.sources.length,4);
  assert.equal(a.buffers.length,2,'Resuming reuses the generated PCM resources');
});

test('footsteps and meows are throttled and one-shot sources remain bounded',async()=>{
  const a=fixture();await a.sound.unlock();
  assert.equal(a.sound.step('grass'),true);assert.equal(a.sound.step('stone'),false);
  a.advance(150);assert.equal(a.sound.step('stone'),true);
  assert.equal(a.sound.meow(),true);assert.equal(a.sound.meow(),false);
  for(let i=0;i<30;i++){a.advance(800);a.sound.meow();}
  assert.ok(a.sources.some(source=>source.stops.length>1),'The oldest one-shot is released at the voice budget');
  assert.ok(MAX_SOUND_SOURCES<=10);
  assert.equal(a.buffers.length,3,'Repetition never regenerates the step and meow buffers');
});

test('mute, zero volume, hidden tabs and media priority stop all world sound',async()=>{
  const a=fixture();await a.sound.unlock();a.sound.setEnvironment({active:true,night:true,nearWater:true});
  a.sound.meow();const first=[...a.sources];a.sound.setEnabled(false);
  assert.ok(first.every(source=>source.stops.length>0));assert.equal(a.sound.splash(),false);
  a.sound.setEnabled(true);a.sound.setVolume(0);assert.equal(a.sound.meow(),false);
  a.sound.setVolume(.4);a.sound.suspend('television');const count=a.sources.length;
  assert.equal(a.sound.chime(),false);a.sound.setEnvironment({active:true,night:true});assert.equal(a.sources.length,count);
  a.sound.resume('television');assert.ok(a.sources.length>count);
  a.hide();assert.equal(a.sound.splash(),false);const hiddenCount=a.sources.length;
  a.sound.setEnvironment({active:true,night:true,nearWater:true});assert.equal(a.sources.length,hiddenCount);
  a.hide(false);assert.ok(a.sources.length>hiddenCount);
  a.sound.dispose();assert.equal(await a.sound.unlock(),false);assert.equal(a.sound.meow(),false);
});

test('preferences are normalized and absent Web Audio support leaves the game usable',async()=>{
  assert.deepEqual(normalizeSoundEffects(),{enabled:true,volume:.35});
  assert.deepEqual(normalizeSoundEffects({enabled:false,volume:5}),{enabled:false,volume:1});
  const changes=[],sound=createSoundscape({onChange:state=>changes.push(state),createAudioContext:()=>null});
  sound.setEnabled(false);sound.setEnabled(false);sound.setVolume(.5);
  assert.deepEqual(changes,[{enabled:false,volume:.35},{enabled:false,volume:.5}]);
  sound.setEnabled(true);assert.equal(await sound.unlock(),false);assert.equal(sound.step(),false);
  sound.dispose();
});
