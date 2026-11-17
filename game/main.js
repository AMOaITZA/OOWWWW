import places from './data/places.json';
import {castleApproachLift} from './castle-layout.js';
import {placeApproachLift} from './place-layout.js';
import decor from './data/decor.json';
import momentSpots from './data/moments.json';
import {TILE,WIDTH,HEIGHT,initWorld,walkable,closestWalkable,findPath,groundTile} from './world.js';
import {createPair,drawPair,advancePairAnimation} from './pair.js';
import {nearestPlace,sceneObjects} from './places.js';
import {loadSave,writeSave} from './save.js';
import {assetImage,outfitImage,weddingCharacterImage,prepareWorldAssets,prepareOutfit,groundImage,objectImage,momentImage,seatedImage,placeImage} from './assets.js';
import {createHost} from './experiences/host.js';
import {createMap} from './map.js';
import {createMusicPlayer} from './music.js';
import {createMoments} from './moments.js';
import {weddingImage} from './wedding-assets.js';
import {createDayNight} from './day-night.js';
import {createLeoVoice} from './leo-voice.js';
import {placeProgress} from './place-discovery.js';
import {worldViewport,approachLift} from './viewport.js';

const $=id=>document.getElementById(id);
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const save=loadSave();save.outfits??={leo:{},itza:{}};
const pair=createPair(save);
const moments=createMoments({spots:momentSpots,pair,getImage:momentImage,bubble:$('leo-bubble'),
  getOutfits:()=>save.outfits,getSeatedImage:(who,look)=>seatedImage(who,look,save.outfits),onSay:line=>voice.speak(line)});
initWorld(places,decor,momentSpots);
if(!walkable(Math.round(pair.x),Math.round(pair.y))){pair.x=30;pair.y=25;}
let path=[],targetPlace=null,lastTime=0,saveClock=0,active=false;
let viewportScale=2,bottomInset=64;
let pendingLayout=0;
const status=text=>{$('world-status').textContent=text;};
function persist(){
  save.position={x:Math.round(pair.x),y:Math.round(pair.y)};
  save.direction=pair.direction;writeSave(save);
}
function updatePlaceCounter(){
  const progress=placeProgress(places,save);
  $('place-counter').textContent=progress.visited+' / '+progress.total+' lugares visitados';
}
const voice=createLeoVoice({saved:save.leoVoice,onChange:state=>{save.leoVoice=state;persist();}});
save.leoVoice=voice.getState();voice.mount($('music-dock'));
const lighting=createDayNight({saved:save.dayNight,onChange:state=>{save.dayNight=state;persist();}});
save.dayNight=lighting.getState();
lighting.mount(document.querySelector('.game-header'));
const music=createMusicPlayer({openPlaylist:()=>host.open('playlist')});
const host=createHost({
  save,assetImage,getWeddingImage:key=>weddingCharacterImage(key,save.outfits),
  onMusicSelect:videoId=>{if(music.select(videoId))host.close();},
  onOutfitChange:()=>{persist();return prepareOutfit(save.outfits);},
  onProgressChange:persist,onLeoSay:line=>voice.speak(line),
  onVoiceNotePlay:()=>{$('music-audio').pause();voice.stop();},
  onClose:()=>{status('Explora nuestro mundo');persist();}
});
function goTo(x,y,place=null){
  if(moments.isSitting()&&moments.seatId()!==place?.id)moments.stand();
  const point=closestWalkable(x,y);
  if(!point){status('No se puede llegar a ese lugar');return;}
  const route=findPath(pair,point);
  if(route.length){path=route;targetPlace=place;status(place?'Caminando hacia '+place.name:'Caminando…');}
  else if(pair.x===point.x&&pair.y===point.y){
    path=[];targetPlace=null;
    if(place&&moments.isMoment(place)){
      moments.arrive(place);
      status(place.kind==='cats'?'Acariciando a los gatitos':moments.isSitting()?'Descansando juntos en la banca':'Seguimos explorando');
    }else status(place?'Toca otra vez '+place.name:'Ya estamos aquí');
  }else status('No se puede llegar a ese lugar');
}
function openPlace(place){
  path=[];targetPlace=place;pair.moving=false;host.open(place.id);
  if(!save.visited.includes(place.id)){save.visited.push(place.id);updatePlaceCounter();}
  persist();
}
function cameraAt(){
  const castle=places.find(place=>place.id==='boda');
  const displayed=moments.renderPair();
  // Lift the final approach without changing the world's 1:1 pointer geometry.
  const lift=approachLift(Math.max(castleApproachLift(pair,castle),placeApproachLift(pair,places)),
    canvas.height,bottomInset,viewportScale);
  // Sitting and standing animate the visible couple away from the walking
  // arrival tile. Follow that pose so seated heads stay clear of the top HUD.
  return {x:Math.max(0,Math.min(WIDTH*TILE-canvas.width,Math.round(displayed.x*TILE-canvas.width/2))),
    y:Math.max(0,Math.min(HEIGHT*TILE-canvas.height,Math.round(displayed.y*TILE-canvas.height/2)-lift))};
}
function pointClick(event){
  if(!active||host.isOpen()||overview.isOpen())return;
  canvas.focus({preventScroll:true});
  const bounds=canvas.getBoundingClientRect();
  const px=(event.clientX-bounds.left)*canvas.width/bounds.width;
  const py=(event.clientY-bounds.top)*canvas.height/bounds.height;
  const camera=cameraAt(),wx=px+camera.x,wy=py+camera.y;
  const spot=moments.momentAt(wx,wy);
  if(spot){
    if(moments.isSitting()&&Math.hypot(pair.x-spot.arrival[0],pair.y-spot.arrival[1])<.51){
      moments.arrive(spot);
      status('Seguimos explorando');
    }else goTo(...spot.arrival,spot);
    return;
  }
  const place=nearestPlace(places,wx,wy,placeImage);
  if(place){
    if(!path.length&&Math.hypot(pair.x-place.arrival[0],pair.y-place.arrival[1])<0.51)openPlace(place);
    else goTo(place.arrival[0],place.arrival[1],place);
  }else goTo(Math.floor(wx/TILE),Math.floor(wy/TILE));
}
const overview=createMap({
  places,decor,moments:momentSpots,pair,save,
  onNavigate:(x,y,place)=>{canvas.focus({preventScroll:true});goTo(x,y,place);}
});
const pressed=new Set();
const keyDirections={arrowup:[0,-1,'up'],w:[0,-1,'up'],arrowdown:[0,1,'down'],s:[0,1,'down'],arrowleft:[-1,0,'left'],a:[-1,0,'left'],arrowright:[1,0,'right'],d:[1,0,'right']};
function step(dt){
  pair.clock+=dt;
  if(!active||host.isOpen()||overview.isOpen()||moments.isTransitioning()){pair.moving=false;return;}
  const direction=Object.keys(keyDirections).find(key=>pressed.has(key));
  if(direction&&!path.length){
    if(moments.isSitting())moments.stand();
    const [dx,dy,face]=keyDirections[direction];
    pair.direction=face;
    const nx=Math.round(pair.x)+dx,ny=Math.round(pair.y)+dy;
    if(walkable(nx,ny)){path=findPath(pair,{x:nx,y:ny});targetPlace=null;}
  }
  pair.moving=path.length>0;
  if(path.length){
    const next=path[0],dx=next.x-pair.x,dy=next.y-pair.y,dist=Math.hypot(dx,dy);
    const speed=Math.min(dist,dt*6);
    if(Math.abs(dx)>Math.abs(dy))pair.direction=dx>0?'right':'left';
    else pair.direction=dy>0?'down':'up';
    if(dist<=0.035||speed>=dist){pair.x=next.x;pair.y=next.y;path.shift();
      if(!path.length){
        pair.moving=false;
        if(targetPlace&&moments.isMoment(targetPlace)){
          const spot=targetPlace;targetPlace=null;moments.arrive(spot);
          status(spot.kind==='cats'?'Acariciando a los gatitos':moments.isSitting()?'Descansando juntos en la banca':'Seguimos explorando');
        }else status(targetPlace?'Llegamos a '+targetPlace.name+'. Toca otra vez para entrar.':'Explora nuestro mundo');
        persist();
      }
    }else{pair.x+=dx/dist*speed;pair.y+=dy/dist*speed;}
  }
}
const objects=sceneObjects(places,decor,objectImage,momentImage,weddingImage,()=>false,placeImage,
  place=>!place.hidden||save.visited.includes(place.id));
function draw(){
  if(!active)return;
  const camera=cameraAt();
  canvas.dataset.cameraX=String(camera.x);canvas.dataset.cameraY=String(camera.y);
  ctx.save();ctx.translate(-camera.x,-camera.y);
  const ground=groundImage();
  if(ground)ctx.drawImage(ground,0,0);
  else{
    const x0=Math.max(0,Math.floor(camera.x/TILE)-1),x1=Math.min(WIDTH,Math.ceil((camera.x+canvas.width)/TILE)+1);
    const y0=Math.max(0,Math.floor(camera.y/TILE)-1),y1=Math.min(HEIGHT,Math.ceil((camera.y+canvas.height)/TILE)+1);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)groundTile(ctx,x,y);
  }
  const scenery=objects.concat(moments.scenery());
  if(!moments.shouldHidePair())scenery.push({z:pair.y*TILE,draw:ctx=>drawPair(ctx,moments.renderPair(),url=>outfitImage(url,save.outfits),save.outfits)});
  scenery.sort((a,b)=>a.z-b.z);
  for(const item of scenery)item.draw(ctx); // objetos independientes, clasificados por profundidad
  ctx.restore();
  lighting.draw(ctx,{camera,decor,places});
  moments.positionBubble(camera,canvas);
}
function tick(time){
  const dt=Math.min(0.05,(time-lastTime)/1000||0);lastTime=time;
  moments.tick(dt,{active,dialogsOpen:host.isOpen()||overview.isOpen()});
  step(dt);advancePairAnimation(pair,dt);
  // Nothing moves behind a modal. Keep its last frame and repaint when it closes;
  // the day/night clock still uses real time, including time spent in a dialog.
  if(!host.isOpen()&&!overview.isOpen())draw();
  saveClock+=dt;
  if(saveClock>10){persist();saveClock=0;}
  requestAnimationFrame(tick);
}
function stars(){
  const c=$('title-stars'),context=c.getContext('2d');c.width=320;c.height=180;
  context.fillStyle='#FFF1DC';let s=76543;
  for(let i=0;i<110;i++){s=(1664525*s+1013904223)>>>0;const x=s%320;s=(1664525*s+1013904223)>>>0;const y=s%180;context.globalAlpha=.25+(s%70)/100;context.fillRect(x,y,i%9===0?2:1,1);}
}
function layout(){
  const frame=$('game-frame'),screen=$('game-screen');
  if(screen.hidden)return;
  // Read layout viewport dimensions together. visualViewport can still report
  // the previous orientation during a resize, producing a permanently tall map.
  // 100dvh handles browser bars; resize/visualViewport events resample the screen.
  screen.style.height=innerHeight+'px';
  const bounds=frame.getBoundingClientRect();
  const viewport=worldViewport(bounds.width,bounds.height);
  viewportScale=viewport.scale;
  if(canvas.width!==viewport.width||canvas.height!==viewport.height){
    canvas.width=viewport.width;canvas.height=viewport.height;
    ctx.imageSmoothingEnabled=false;
  }
  canvas.style.width=viewport.cssWidth+'px';canvas.style.height=viewport.cssHeight+'px';
  canvas.dataset.pixelScale=String(viewport.scale);
  const footer=screen.querySelector('.game-footer').getBoundingClientRect();
  bottomInset=Math.max(64,bounds.bottom-footer.top+8);
  draw();overview.repaint();
}
function requestLayout(){
  if(pendingLayout)return;
  pendingLayout=requestAnimationFrame(()=>{pendingLayout=0;layout();});
}
// Mobile rotation can dispatch viewport events before the frame's final layout.
// Observing the frame catches its settled size even if no further resize fires.
const frameObserver=new ResizeObserver(requestLayout);
frameObserver.observe($('game-frame'));
$('start-game').addEventListener('click',()=>{
  void voice.unlock();
  $('title-screen').hidden=true;$('game-screen').hidden=false;active=true;layout();canvas.focus();persist();status('Toca para caminar');
});
$('help-button').addEventListener('click',()=>{
  host.help();
});
canvas.addEventListener('pointerdown',pointClick);
window.addEventListener('pointerdown',()=>{if(active)void voice.unlock();},{capture:true,passive:true});
window.addEventListener('keydown',()=>{if(active)void voice.unlock();},{capture:true});
window.addEventListener('keydown',event=>{
  if(event.defaultPrevented)return;
  const interactive=event.target?.closest?.('input,textarea,select,button,a,[contenteditable="true"]');
  if(event.key==='Escape'&&host.isOpen()){host.close();return;}
  if(event.key==='Escape'&&overview.isOpen()){overview.close();return;}
  if(interactive)return;
  const key=event.key.toLowerCase();
  if(active&&key==='e'&&!event.repeat&&!host.isOpen()&&!overview.isOpen()){
    const spot=moments.closest(pair.x,pair.y,4);
    if(spot){event.preventDefault();goTo(...spot.arrival,spot);return;}
    const place=places.find(item=>Math.hypot(pair.x-item.arrival[0],pair.y-item.arrival[1])<1.5);
    if(place){
      event.preventDefault();
      if(!path.length&&pair.x===place.arrival[0]&&pair.y===place.arrival[1])openPlace(place);
      else goTo(...place.arrival,place);
      return;
    }
  }
  if(active&&!host.isOpen()&&!overview.isOpen()&&keyDirections[key]){
    event.preventDefault();
    if(!pressed.has(key)){pressed.add(key);path=[];targetPlace=null;}
  }
});
window.addEventListener('keyup',event=>pressed.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>{pressed.clear();persist();});
document.addEventListener('visibilitychange',()=>{
  pressed.clear();lastTime=0;
  if(document.hidden)persist();
  else requestLayout();
});
document.addEventListener('oowwww-dialog-open',()=>{pressed.clear();voice.stop();});
window.addEventListener('resize',requestLayout);
window.addEventListener('pagehide',persist);
updatePlaceCounter();
const startButton=$('start-game');
startButton.disabled=true;startButton.textContent='Cargando…';
Promise.allSettled([prepareWorldAssets(),prepareOutfit(save.outfits)]).then(results=>{
  startButton.disabled=false;startButton.textContent='Entrar';
  const loading=$('asset-status');
  if(loading)loading.textContent=results.some(result=>result.status==='rejected')
    ?'Puedes entrar. Algunos detalles tardan en estar disponibles.'
    :'Nuestro mundo está listo';
});
document.fonts?.ready.then(requestLayout);
window.visualViewport?.addEventListener('resize',requestLayout);
stars();requestAnimationFrame(tick);
