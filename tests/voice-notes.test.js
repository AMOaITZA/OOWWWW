import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceNoteCatalog,voiceNotes,normalizeVoiceNoteState,createVoiceNotePlayer,voiceNoteTime} from '../game/voice-notes.js';

const files={'/assets/game/voice-notes/mensaje-12.mp3':'/assets/twelve.mp3','/assets/game/voice-notes/mensaje-01.mp3':'/assets/one.mp3'};
const tracks=createVoiceNoteCatalog(files);
class FakeAudio extends EventTarget{
  paused=true;ended=false;currentTime=0;duration=100;volume=1;playCalls=0;pauseCalls=0;loadCalls=0;attrs={};
  getAttribute(key){return this.attrs[key]??null;}
  removeAttribute(key){delete this.attrs[key];}
  set src(value){this.attrs.src=value;}
  get src(){return this.attrs.src??'';}
  play(){this.playCalls++;this.paused=false;return Promise.resolve();}
  pause(){this.pauseCalls++;this.paused=true;}
  load(){this.loadCalls++;this.currentTime=0;}
}
test('voice notes discover only installed MP3s in numeric order',()=>{
  assert.deepEqual(tracks.map(track=>[track.filename,track.number,track.title]),[['mensaje-01.mp3',1,'Mensaje 01'],['mensaje-12.mp3',12,'Mensaje 12']]);
  assert.equal(tracks[0].url,'/assets/one.mp3');
});
test('catalog rejects wrong names, zero, arbitrary paths and non-MP3 files',()=>{
  const invalid={
    '/assets/game/voice-notes/mensaje-00.mp3':'a','/assets/game/voice-notes/mensaje-1.mp3':'b',
    '/assets/game/voice-notes/mensaje-100.mp3':'c','/assets/game/voice-notes/Mensaje-01.mp3':'d',
    '/assets/game/voice-notes/mensaje-01.wav':'e','../mensaje-01.mp3':'f',
    '/assets/game/voice-notes/../mensaje-01.mp3':'g','/assets/game/audio/mensaje-01.mp3':'h'
  };
  assert.deepEqual(createVoiceNoteCatalog(invalid),[]);
});
test('an empty installation creates no source and never calls play',async()=>{
  assert.deepEqual(voiceNotes,[]);
  const audio=new FakeAudio(),player=createVoiceNotePlayer({audio,tracks:[]});
  assert.equal(player.selected(),null);assert.equal(audio.getAttribute('src'),null);
  assert.equal(await player.play(),false);assert.equal(audio.playCalls,0);assert.equal(audio.getAttribute('src'),null);
});
test('saved preferences recover an installed selection and normalize position and volume',()=>{
  assert.deepEqual(normalizeVoiceNoteState({filename:'mensaje-12.mp3',position:14,volume:.35},tracks),{filename:'mensaje-12.mp3',position:14,volume:.35});
  assert.deepEqual(normalizeVoiceNoteState({filename:'missing.mp3',position:14,volume:8},tracks),{filename:'mensaje-01.mp3',position:0,volume:1});
  assert.deepEqual(normalizeVoiceNoteState(undefined,[]),{filename:null,position:0,volume:.85});
});
test('opening and choosing a message never autoplays or requests a file',()=>{
  const audio=new FakeAudio(),saved=[];
  const player=createVoiceNotePlayer({audio,tracks,onChange:state=>saved.push(state)});
  assert.equal(audio.src,'');assert.equal(audio.playCalls,0);
  assert.equal(player.select('mensaje-12.mp3'),true);
  assert.equal(audio.playCalls,0);assert.equal(audio.src,'');assert.equal(saved.at(-1).filename,'mensaje-12.mp3');
  assert.equal(player.select('../../secret.mp3'),false);assert.equal(player.selected().filename,'mensaje-12.mp3');
});
test('explicit play notifies the host before playback and restores saved position',async()=>{
  const audio=new FakeAudio(),order=[];
  audio.play=()=>{order.push('play');audio.paused=false;audio.playCalls++;return Promise.resolve();};
  const player=createVoiceNotePlayer({audio,tracks,saved:{filename:'mensaje-12.mp3',position:14,volume:.35},onPlay:()=>order.push('host')});
  assert.equal(await player.play(),true);assert.deepEqual(order,['host','play']);
  assert.equal(audio.src,'/assets/twelve.mp3');assert.equal(audio.currentTime,14);assert.equal(audio.volume,.35);
});
test('pause, seek, restart and volume persist without starting playback',async()=>{
  const audio=new FakeAudio(),changes=[];
  const player=createVoiceNotePlayer({audio,tracks,onChange:state=>changes.push(state)});
  await player.play();player.seek(25);player.setVolume(.4);player.pause();
  assert.deepEqual(changes.at(-1),{filename:'mensaje-01.mp3',position:25,volume:.4});
  assert.equal(audio.paused,true);const count=audio.playCalls;
  player.restart();assert.equal(audio.currentTime,0);assert.equal(audio.playCalls,count);
  assert.equal(player.seek(NaN),false);assert.equal(player.setVolume(NaN),false);
  assert.equal(voiceNoteTime(65.9),'1:05');assert.equal(voiceNoteTime(Infinity),'0:00');
});
test('closing pauses, saves progress, releases source and cannot restart disposed player',async()=>{
  const audio=new FakeAudio(),changes=[];
  const player=createVoiceNotePlayer({audio,tracks,onChange:state=>changes.push(state)});
  await player.play();audio.currentTime=37;player.dispose();
  assert.equal(audio.paused,true);assert.equal(changes.at(-1).position,37);assert.equal(audio.src,'');
  const count=audio.playCalls;assert.equal(await player.play(),false);assert.equal(audio.playCalls,count);
});
test('blocked audio reports a readable error without throwing to the app',async()=>{
  const audio=new FakeAudio(),errors=[];
  audio.play=()=>Promise.reject(new Error('device unavailable'));
  const player=createVoiceNotePlayer({audio,tracks,onError:error=>errors.push(error.message)});
  assert.equal(await player.play(),false);assert.deepEqual(errors,['device unavailable']);
});
