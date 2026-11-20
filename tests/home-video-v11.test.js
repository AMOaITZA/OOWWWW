import test from 'node:test';
import assert from 'node:assert/strict';
import {findHomeVideo,normalizeHomeVideoState,createHomeVideoPlayer,drawHomeVideoFrame} from '../game/home-video.js';
import {normalizeHomeState,chooseHomeActivity} from '../game/home.js';

class Video extends EventTarget{
  constructor(){super();this.attributes={};this.paused=true;this.ended=false;this.currentTime=0;this.duration=NaN;this.readyState=0;this.loads=0;this.plays=0;}
  set src(value){this.attributes.src=value;}
  get src(){return this.attributes.src||'';}
  getAttribute(name){return this.attributes[name]??null;}
  removeAttribute(name){delete this.attributes[name];}
  async play(){this.plays++;this.paused=false;this.dispatchEvent(new Event('play'));}
  pause(){if(this.paused)return;this.paused=true;this.dispatchEvent(new Event('pause'));}
  load(){this.loads++;this.currentTime=0;this.duration=NaN;this.readyState=0;this.dispatchEvent(new Event('timeupdate'));}
  metadata(duration=90){this.duration=duration;this.readyState=2;this.dispatchEvent(new Event('loadedmetadata'));}
}
const source={filename:'nuestro-video.mp4',url:'/real-installed-video.mp4'};

test('the TV catalog only chooses a real installed personal video and prefers MP4',()=>{
  assert.equal(findHomeVideo(),null);
  const files={'/assets/game/home/videos/other.mp4':'/other',
    '/assets/game/home/videos/nuestro-video.webm':'/webm',
    '/assets/game/home/videos/nuestro-video.mp4':'/mp4'};
  assert.deepEqual(findHomeVideo(files),{filename:'nuestro-video.mp4',url:'/mp4'});
  assert.equal(findHomeVideo({'/assets/game/home/videos/nuestro-video.mp4':undefined}),null);
});

test('opening the TV is silent and a missing video never receives a source',async()=>{
  const video=new Video(),player=createHomeVideoPlayer({video,source:null});
  player.setActive(true);assert.equal(player.available(),false);
  assert.equal(await player.play(),false);assert.equal(video.plays,0);
  assert.equal(video.getAttribute('src'),null);player.dispose();
});

test('manual playback restores the saved position after metadata and unload keeps it',async()=>{
  const video=new Video(),changes=[],playback=[];
  const player=createHomeVideoPlayer({video,source,saved:{position:23,volume:.4,muted:true},
    onChange:state=>changes.push(state),onPlayback:playing=>playback.push(playing)});
  player.setActive(true);assert.equal(video.getAttribute('src'),null);assert.equal(video.plays,0);
  await player.play();assert.equal(video.src,source.url);
  // A browser may emit timeupdate at zero before metadata; do not lose the resume point.
  video.dispatchEvent(new Event('timeupdate'));assert.equal(player.getState().position,23);
  video.metadata();assert.equal(video.currentTime,23);assert.equal(video.volume,.4);assert.equal(video.muted,true);
  video.currentTime=31;video.dispatchEvent(new Event('timeupdate'));
  player.setActive(false);
  assert.equal(video.paused,true);assert.equal(video.getAttribute('src'),null);
  assert.equal(player.getState().position,31);assert.equal(playback.at(-1),false);
  player.setActive(true);await player.play();video.metadata();assert.equal(video.currentTime,31);
  player.seek(40);player.setVolume(.7);player.setMuted(false);
  assert.deepEqual(player.getState(),{position:40,volume:.7,muted:false});
  player.dispose();assert.equal(changes.at(-1).position,40);
});

test('switching activities while a play promise is pending cannot restart the video',async()=>{
  const video=new Video();let resolve;
  video.play=()=>{video.paused=false;video.dispatchEvent(new Event('play'));return new Promise(done=>{resolve=done;});};
  const playback=[],player=createHomeVideoPlayer({video,source,onPlayback:playing=>playback.push(playing)});
  player.setActive(true);const pending=player.play();player.setActive(false);resolve();
  assert.equal(await pending,false);assert.equal(video.paused,true);assert.equal(video.getAttribute('src'),null);
  assert.equal(playback.at(-1),false);player.dispose();
  const count=playback.length;video.dispatchEvent(new Event('play'));assert.equal(playback.length,count,'Disposed listeners cannot play background audio');
});

test('video preferences survive house actions without changing legacy house state',()=>{
  assert.deepEqual(normalizeHomeVideoState({position:-3,volume:8,muted:'true'}),{position:0,volume:1,muted:false});
  assert.deepEqual(normalizeHomeState(),{activity:'eat',visits:0,counts:{eat:0,sleep:0,tv:0}});
  const original={activity:'tv',visits:2,counts:{eat:1,sleep:0,tv:2},video:{position:30,volume:.3,muted:true}};
  const next=chooseHomeActivity(original,'sleep');assert.deepEqual(next.video,original.video);
  assert.equal(original.activity,'tv');assert.equal(next.activity,'sleep');
});

test('the video frame keeps its aspect ratio inside the native TV screen',()=>{
  const drawings=[],ctx={fillRect(){},drawImage:(...args)=>drawings.push(args)};
  const video={readyState:2,videoWidth:160,videoHeight:90},box={x:352,y:80,width:42,height:29};
  assert.equal(drawHomeVideoFrame(ctx,video,box),true);
  const [image,,,sw,sh,x,y,width,height]=drawings[0];
  assert.equal(image,video);assert.equal(sw/sh,16/9);assert.equal(width/height,16/9);
  assert.ok(x>=box.x&&y>=box.y&&x+width<=box.x+box.width&&y+height<=box.y+box.height);
  assert.equal(drawHomeVideoFrame(ctx,{readyState:1},box),false);
});
