import assetsManifest from './data/assets.json';
import places from './data/places.json';
import {TILE,WIDTH,HEIGHT,initWorld,walkable,findPath,groundTile} from './world.js';
import {createPair,drawPair} from './pair.js';
import {drawPlaces,nearestPlace} from './places.js';
import {loadSave,writeSave} from './save.js';

const $=id=>document.getElementById(id);
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const save=loadSave(),pair=createPair(save);
initWorld(places);
if(!walkable(Math.round(pair.x),Math.round(pair.y))){pair.x=30;pair.y=25;}
let path=[],targetPlace=null,opened=false,lastTime=0,autosave=0;
const images={objects:{},characters:{leo:{},itza:{}},ground:null};
function loadImage(url){if(!url)return Promise.resolve(null);return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url;});}
async function loadArt(){
  images.ground=await loadImage(assetsManifest.world.ground);
  await Promise.all(Object.entries(assetsManifest.objects).map(async ([kind,url])=>{images.objects[kind]=await loadImage(url);}));
  await Promise.all(['leo','itza'].flatMap(who=>Object.entries(assetsManifest.characters[who]||{}).map(async ([layer,url])=>{images.characters[who][layer]=await loadImage(url);})));
}
const status=(text)=>{$('world-status').textContent=text;};
function persist(){save.position={x:pair.x,y:pair.y};save.direction=pair.direction;writeSave(save);}
function goTo(x,y,place=null){
  const result=findPath(pair,{x,y});
  if(result.length){path=result;targetPlace=place;status(place?'Caminando hacia '+place.name:'Caminando…');}
  else if(Math.round(pair.x)===x&&Math.round(pair.y)===y){path=[];targetPlace=place;status(place?'Toca otra vez '+place.name:'Ya estamos aquí');}
  else status('No podemos pasar por ahí');
}
function openPlace(place){
  opened=true;path=[];pair.moving=false;
  $('experience-category').textContent='Un recuerdo por descubrir';
  $('experience-title').textContent=place.name;
  const host=$('experience-content');host.replaceChildren();
  const p=document.createElement('p');
  p.textContent=place.classic?'Esta experiencia se está preparando para el nuevo mundo. Mientras tanto, puedes disfrutar su versión original, sin cambios.':'El armario estará disponible cuando incorporemos las capas y prendas de Itza y Leo.';
  host.append(p);
  if(place.classic){const a=document.createElement('a');a.href='/'+place.classic;a.textContent='Abrir en modo clásico';host.append(a);}
  $('experience').hidden=false;$('close-experience').focus();
  if(!save.visited.includes(place.id)){save.visited.push(place.id);$('place-counter').textContent=save.visited.length+' / 10 lugares visitados';}
  persist();
}
function closePlace(){opened=false;$('experience').hidden=true;canvas.focus?.();persist();}
function pointer(event){
  if(opened)return;
  const rect=canvas.getBoundingClientRect();
  const px=(event.clientX-rect.left)*canvas.width/rect.width,py=(event.clientY-rect.top)*canvas.height/rect.height;
  const camera=cameraAt(pair);
  const wx=px+camera.x,wy=py+camera.y;
  const place=nearestPlace(places,wx,wy);
  if(place){
    if(Math.abs(pair.x-place.arrival[0])<=0.5&&Math.abs(pair.y-place.arrival[1])<=0.5&&!path.length){openPlace(place);}
    else goTo(place.arrival[0],place.arrival[1],place);
  }else goTo(Math.floor(wx/TILE),Math.floor(wy/TILE));
}
function cameraAt(entity){return {x:Math.max(0,Math.min(WIDTH*TILE-canvas.width,Math.round(entity.x*TILE-canvas.width/2))),y:Math.max(0,Math.min(HEIGHT*TILE-canvas.height,Math.round(entity.y*TILE-canvas.height/2)))};}
const keys=new Set();
function step(dt) {
  pair.clock+=dt;
  if(opened){pair.moving=false;return;}
  const keyDir=[['arrowup',0,-1,'up'],['w',0,-1,'up'],['arrowdown',0,1,'down'],['s',0,1,'down'],['arrowleft',-1,0,'left'],['a',-1,0,'left'],['arrowright',1,0,'right'],['d',1,0,'right']].find(([key])=>keys.has(key));
  if(keyDir&&!path.length){const [,dx,dy,d]=keyDir;pair.direction=d;const nx=Math.round(pair.x)+dx,ny=Math.round(pair.y)+dy;if(walkable(nx,ny))path=[{x:nx,y:ny}];}
  pair.moving=path.length>0;
  if(path.length){
    const next=path[0],dx=next.x-pair.x,dy=next.y-pair.y,dist=Math.hypot(dx,dy),speed=Math.min(dist,dt*4.2);
    if(Math.abs(dx)>Math.abs(dy))pair.direction=dx>0?'right':'left';else pair.direction=dy>0?'down':'up';
    if(dist<0.035||speed>=dist){pair.x=next.x;pair.y=next.y;path.shift();if(!path.length){pair.moving=false;status(targetPlace?'Llegamos a '+targetPlace.name+'. Toca ese lugar otra vez.':'Explora nuestro mundo');persist();}}
    else{pair.x+=dx/dist*speed;pair.y+=dy/dist*speed;}
  }
}
function draw(){
  const camera=cameraAt(pair);ctx.save();ctx.translate(-camera.x,-camera.y);
  const x0=Math.max(0,Math.floor(camera.x/TILE)-1),x1=Math.min(WIDTH,Math.ceil((camera.x+canvas.width)/TILE)+1),y0=Math.max(0,Math.floor(camera.y/TILE)-1),y1=Math.min(HEIGHT,Math.ceil((camera.y+canvas.height)/TILE)+1);
  if(images.ground){ctx.drawImage(images.ground,0,0,WIDTH*TILE,HEIGHT*TILE);}
  else{
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      groundTile(ctx,x,y);
      // Camino principal que une el recorrido sin confundirlo con el mapa de colisiones.
      if((y>=36&&y<=42&&x>10&&x<101)||(x>=59&&x<=65&&y>19&&y<65)){
        ctx.fillStyle=(x+y)%3?'#D8C69A':'#E5D1A7';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
      }
    }
  }
  // Dibujamos objetos y pareja ordenados por profundidad (pies): permite pasar por detrás.
  const list=places.map(place=>({y:(place.tile[1]+2)*TILE,draw:()=>drawPlaces(ctx,[place],images.objects)}));
  list.push({y:pair.y*TILE,draw:()=>drawPair(ctx,pair,images.characters)});
  list.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
  ctx.restore();
}
function tick(time){
  const dt=Math.min(0.05,(time-lastTime)/1000||0);lastTime=time;
  step(dt);draw();autosave+=dt;if(autosave>10){persist();autosave=0;}requestAnimationFrame(tick);
}
function stars(){const c=$('title-stars'),context=c.getContext('2d');c.width=320;c.height=180;context.fillStyle='#FFF1DC';let s=76543;for(let i=0;i<110;i++){s=(1664525*s+1013904223)>>>0;const x=s%320;s=(1664525*s+1013904223)>>>0;const y=s%180;context.globalAlpha=.25+(s%70)/100;context.fillRect(x,y,i%9===0?2:1,1);}}
$('start-game').addEventListener('click',()=>{$('title-screen').hidden=true;$('game-screen').hidden=false;status('Toca para caminar');persist();});
$('help-button').addEventListener('click',()=>{opened=true;$('experience-title').textContent='Cómo jugar';$('experience-category').textContent='Controles';$('experience-content').replaceChildren();const p=document.createElement('p');p.textContent='Toca o haz clic en el suelo para caminar. Para visitar un lugar, tócalo una vez para acercarte y otra para abrirlo. En computadora también puedes usar flechas o WASD.';$('experience-content').append(p);$('experience').hidden=false;});
$('close-experience').addEventListener('click',closePlace);
$('experience').addEventListener('click',event=>{if(event.target===$('experience'))closePlace();});
canvas.addEventListener('pointerdown',pointer);
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened){closePlace();return;}if(!opened&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(event.key)){event.preventDefault();keys.add(event.key.toLowerCase());if(path.length)path=[];targetPlace=null;}});
window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
$('place-counter').textContent=save.visited.length+' / 10 lugares visitados';
stars();loadArt();requestAnimationFrame(tick);
