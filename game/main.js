import places from './data/places.json';
import decor from './data/decor.json';
import momentSpots from './data/moments.json';
import {TILE,WIDTH,HEIGHT,initWorld,walkable,closestWalkable,findPath,groundTile} from './world.js';
import {createPair,drawPair} from './pair.js';
import {nearestPlace,sceneObjects} from './places.js';
import {loadSave,writeSave} from './save.js';
import {assetImage,prepareWorldAssets,prepareOutfit,groundImage,objectImage,momentImage} from './assets.js';
import {createHost} from './experiences/host.js';
import {createMap} from './map.js';
import {createMusicPlayer} from './music.js';
import {createMoments} from './moments.js';

const $=id=>document.getElementById(id);
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const save=loadSave();save.outfits??={leo:{},itza:{}};
const pair=createPair(save);
const moments=createMoments({spots:momentSpots,pair,getImage:momentImage,bubble:$('leo-bubble')});
initWorld(places,decor,momentSpots);
if(!walkable(Math.round(pair.x),Math.round(pair.y))){pair.x=30;pair.y=25;}
let path=[],targetPlace=null,lastTime=0,saveClock=0,active=false;
const status=text=>{$('world-status').textContent=text;};
function persist(){
  save.position={x:Math.round(pair.x),y:Math.round(pair.y)};
  save.direction=pair.direction;writeSave(save);
}
const music=createMusicPlayer({openPlaylist:()=>host.open('playlist')});
const host=createHost({
  save,assetImage,
  onMusicSelect:videoId=>{if(music.select(videoId))host.close();},
  onOutfitChange:()=>{persist();return prepareOutfit(save.outfits);},
  onClose:()=>{status('Explora nuestro mundo');persist();}
});
function goTo(x,y,place=null){
  if(moments.isSitting()&&moments.seatId()!==place?.id)moments.stand();
  const point=closestWalkable(x,y);
  if(!point){status('No se puede llegar a ese lugar');return;}
  const route=findPath(pair,point);
  if(route.length){path=route;targetPlace=place;status(place?'Caminando hacia '+place.name:'Caminando…');}
  else if(Math.round(pair.x)===point.x&&Math.round(pair.y)===point.y){
    path=[];targetPlace=null;
    if(place&&moments.isMoment(place)){
      moments.arrive(place);
      status(place.kind==='cats'?'Acariciando a los gatitos':'Descansando juntos en la banca');
    }else status(place?'Toca otra vez '+place.name:'Ya estamos aquí');
  }else status('No se puede llegar a ese lugar');
}
function openPlace(place){
  path=[];targetPlace=place;pair.moving=false;host.open(place.id);
  if(!save.visited.includes(place.id)){save.visited.push(place.id);$('place-counter').textContent=save.visited.length+' / 10 lugares visitados';}
  persist();
}
function cameraAt(){
  return {x:Math.max(0,Math.min(WIDTH*TILE-canvas.width,Math.round(pair.x*TILE-canvas.width/2))),
    y:Math.max(0,Math.min(HEIGHT*TILE-canvas.height,Math.round(pair.y*TILE-canvas.height/2)))};
}
function pointClick(event){
  if(!active||host.isOpen()||overview.isOpen())return;
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
  const place=nearestPlace(places,wx,wy);
  if(place){
    if(!path.length&&Math.hypot(pair.x-place.arrival[0],pair.y-place.arrival[1])<0.51)openPlace(place);
    else goTo(place.arrival[0],place.arrival[1],place);
  }else goTo(Math.floor(wx/TILE),Math.floor(wy/TILE));
}
const overview=createMap({
  places,decor,moments:momentSpots,pair,save,
  onNavigate:(x,y,place)=>goTo(x,y,place)
});
const pressed=new Set();
const keyDirections={arrowup:[0,-1,'up'],w:[0,-1,'up'],arrowdown:[0,1,'down'],s:[0,1,'down'],arrowleft:[-1,0,'left'],a:[-1,0,'left'],arrowright:[1,0,'right'],d:[1,0,'right']};
function step(dt){
  pair.clock+=dt;
  if(!active||host.isOpen()||overview.isOpen()){pair.moving=false;return;}
  const direction=Object.keys(keyDirections).find(key=>pressed.has(key));
  if(direction&&!path.length){
    if(moments.isSitting())moments.stand();
    const [dx,dy,face]=keyDirections[direction];
    pair.direction=face;
    const nx=Math.round(pair.x)+dx,ny=Math.round(pair.y)+dy;
    if(walkable(nx,ny)){path=[{x:nx,y:ny}];targetPlace=null;}
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
          status(spot.kind==='cats'?'Acariciando a los gatitos':'Descansando juntos en la banca');
        }else status(targetPlace?'Llegamos a '+targetPlace.name+'. Toca otra vez para entrar.':'Explora nuestro mundo');
        persist();
      }
    }else{pair.x+=dx/dist*speed;pair.y+=dy/dist*speed;}
  }
}
const objects=sceneObjects(places,decor,objectImage,momentImage);
function draw(){
  if(!active)return;
  const camera=cameraAt();
  ctx.save();ctx.translate(-camera.x,-camera.y);
  const ground=groundImage();
  if(ground)ctx.drawImage(ground,0,0);
  else{
    const x0=Math.max(0,Math.floor(camera.x/TILE)-1),x1=Math.min(WIDTH,Math.ceil((camera.x+canvas.width)/TILE)+1);
    const y0=Math.max(0,Math.floor(camera.y/TILE)-1),y1=Math.min(HEIGHT,Math.ceil((camera.y+canvas.height)/TILE)+1);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)groundTile(ctx,x,y);
  }
  const scenery=objects.concat(moments.scenery());
  if(!moments.shouldHidePair())scenery.push({z:pair.y*TILE,draw:ctx=>drawPair(ctx,pair,assetImage,save.outfits)});
  scenery.sort((a,b)=>a.z-b.z);
  for(const item of scenery)item.draw(ctx); // objetos independientes, clasificados por profundidad
  ctx.restore();
  moments.positionBubble(camera);
}
function tick(time){
  const dt=Math.min(0.05,(time-lastTime)/1000||0);lastTime=time;
  moments.tick(dt,{active,dialogsOpen:host.isOpen()||overview.isOpen()});
  step(dt);draw();overview.repaint();saveClock+=dt;
  if(saveClock>10){persist();saveClock=0;}
  requestAnimationFrame(tick);
}
function stars(){
  const c=$('title-stars'),context=c.getContext('2d');c.width=320;c.height=180;
  context.fillStyle='#FFF1DC';let s=76543;
  for(let i=0;i<110;i++){s=(1664525*s+1013904223)>>>0;const x=s%320;s=(1664525*s+1013904223)>>>0;const y=s%180;context.globalAlpha=.25+(s%70)/100;context.fillRect(x,y,i%9===0?2:1,1);}
}
function layout(){
  const frame=$('game-frame'),w=Math.max(280,innerWidth-28),h=Math.max(150,innerHeight-160);
  const scale=Math.min(Math.floor(w/480),Math.floor(h/270),4);
  if(scale>=1){frame.style.width=480*scale+'px';frame.style.height=270*scale+'px';}
  else{const fractional=Math.min(w/480,h/270);frame.style.width=480*fractional+'px';frame.style.height=270*fractional+'px';}
}
$('start-game').addEventListener('click',()=>{
  $('title-screen').hidden=true;$('game-screen').hidden=false;active=true;layout();persist();status('Toca para caminar');
});
$('help-button').addEventListener('click',()=>{
  host.help();
});
canvas.addEventListener('pointerdown',pointClick);
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&host.isOpen()){host.close();return;}
  if(event.key==='Escape'&&overview.isOpen()){overview.close();return;}
  const key=event.key.toLowerCase();
  if(active&&key==='e'&&!host.isOpen()&&!overview.isOpen()){
    const spot=moments.closest(pair.x,pair.y,4);
    if(spot){event.preventDefault();goTo(...spot.arrival,spot);return;}
  }
  if(active&&!host.isOpen()&&!overview.isOpen()&&keyDirections[key]){
    event.preventDefault();pressed.add(key);
    if(path.length){path=[];targetPlace=null;}
  }
});
window.addEventListener('keyup',event=>pressed.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>{pressed.clear();persist();});
window.addEventListener('resize',layout);
window.addEventListener('pagehide',persist);
$('place-counter').textContent=save.visited.length+' / 10 lugares visitados';
stars();prepareWorldAssets();prepareOutfit(save.outfits);requestAnimationFrame(tick);
