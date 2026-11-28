import {node,labeledButton} from './dom.js';
import {getChoice,getSelectedLook} from '../wardrobe.js';
import {drawHomeActor} from '../home-poses.js';
import {BOAT_START,BOAT_ISLANDS,visitBoating,boatIslandAt,openBoatGift,boatWater,nearestBoatWater,boatRoute,boatingViewport} from '../boating.js';
import './barca.css';

const BACKGROUND='/assets/game/boating/archipelago.png',BOATS='/assets/game/boating/boats.png';
const vectors={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

export function mount(root,_data,api){
 api.save??={};let state=visitBoating(api.save.boating),alive=true,raf=0,last=0,clock=0,route=[],destination=null,moving=false,nearby=null,heading='up',viewed=null;
 const boat={...BOAT_START},camera={x:0,y:0},keys=new Set(),preference=matchMedia('(prefers-reduced-motion: reduce)');
 const shell=node('section','boating-trip');shell.setAttribute('aria-label','Un paseo en barca por las islas');
 const stage=node('div','boating-stage'),canvas=node('canvas','boating-map');canvas.width=768;canvas.height=512;canvas.tabIndex=0;
 canvas.setAttribute('role','application');canvas.setAttribute('aria-label','Paseo en barca. Toca el agua para remar; flechas o WASD para navegar y E para abrir un regalo cerca de una isla. También puedes usar los destinos.');stage.append(canvas);
 const name=node('p','boating-title','Las islas de nuestros recuerdos');
 const counter=node('p','boating-counter');counter.setAttribute('aria-live','polite');
 const nav=node('nav','boating-destinations');nav.setAttribute('aria-label','Destinos de la barca');
 const destinations=new Map();
 for(const island of [...BOAT_ISLANDS,{id:'muelle',label:'Volver al muelle',short:'Muelle',arrival:BOAT_START}]){
  const button=labeledButton(island.short,()=>navigate(island),'boating-destination');button.dataset.boatDestination=island.id;button.setAttribute('aria-label',island.label);destinations.set(island.id,button);nav.append(button);
 }
 const primary=labeledButton('',()=>discover(),'boating-open-gift');primary.hidden=true;primary.dataset.boatAction='gift';
 const status=node('p','boating-status','Toca el agua para remar. Cada isla guarda algo para ti.');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const message=node('section','boating-message');message.hidden=true;message.setAttribute('aria-label','Regalo de la isla');
 const messageTitle=node('h3'),messageText=node('p'),messageClose=labeledButton('Seguir navegando',()=>{viewed=null;message.hidden=true;render();draw();canvas.focus({preventScroll:true});},'boating-message-close');message.append(messageTitle,messageText,messageClose);
 const help=node('p','boating-help','Toca el agua para remar · E para descubrir');
 shell.append(stage,name,counter,nav,status,primary,message,help);root.append(shell);
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 function persist(){api.save.boating=state;api.onProgressChange?.();}
 function outfits(){return api.getOutfits?.()??api.save.outfits??{};}
 function render(){
  const progress=state.found.length+' / 3 regalos';if(counter.textContent!==progress)counter.textContent=progress;
  status.hidden=Boolean(viewed);
  primary.hidden=!nearby||route.length>0||Boolean(viewed);primary.textContent=nearby?(state.found.includes(nearby.id)?'Leer nuestra carta':'Abrir el regalo'):'';
  for(const [id,button] of destinations){button.dataset.discovered=String(state.found.includes(id));button.setAttribute('aria-current',nearby?.id===id?'location':'false');button.setAttribute('aria-pressed',String(destination?.id===id));}
  Object.assign(shell.dataset,{boatMoving:String(moving),boatDestination:destination?.id||'',boatIsland:nearby?.id||'',boatFound:String(state.found.length)});
  Object.assign(canvas.dataset,{boatX:String(Math.round(boat.x)),boatY:String(Math.round(boat.y)),boatHeading:heading,boatMotion:preference.matches?'reduced':'active',leoLook:getChoice(outfits(),'leo'),itzaLook:getChoice(outfits(),'itza')});
 }
 function navigate(island){
  if(!alive)return;keys.clear();viewed=null;message.hidden=true;route=boatRoute(boat,island.arrival);destination=island;nearby=null;
  status.textContent=route.length?'Remando hacia '+island.label.toLowerCase()+'…':'Estamos junto al muelle.';render();canvas.focus({preventScroll:true});schedule();
 }
 function discover(){
  if(!alive||!nearby||route.length)return;
  const result=openBoatGift(state,nearby.id,boat);if(!result.opened)return;state=result.state;viewed=nearby.id;
  messageTitle.textContent=nearby.gift;messageText.textContent='Leo: '+nearby.message;message.hidden=false;
  status.textContent=state.found.length===3?'Los tres regalos están contigo. Podemos volver cuando quieras.':'Este recuerdo ya es nuestro.';
  persist();api.onLeoSay?.(nearby.message);if(result.isNew)api.onSfx?.('chime');render();draw();messageClose.focus({preventScroll:true});
 }
 function move(dx,dy){
  let changed=false;
  if(boatWater(boat.x+dx,boat.y)){boat.x+=dx;changed=Math.abs(dx)>.001;}
  if(boatWater(boat.x,boat.y+dy)){boat.y+=dy;changed||=Math.abs(dy)>.001;}
  if(changed)heading=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
  return changed;
 }
 function update(dt){
  moving=false;
  if(keys.size){let dx=0,dy=0;for(const key of keys){dx+=vectors[key]?.[0]||0;dy+=vectors[key]?.[1]||0;}const length=Math.hypot(dx,dy);if(length)moving=move(dx/length*100*dt,dy/length*100*dt);}
  else if(route.length){
   const next=route[0],dx=next.x-boat.x,dy=next.y-boat.y,distance=Math.hypot(dx,dy),step=100*dt;
   if(distance<=Math.max(.5,step)){boat.x=next.x;boat.y=next.y;route.shift();moving=route.length>0;}
   else moving=move(dx/distance*step,dy/distance*step);
   if(!route.length&&destination){const arrived=destination;destination=null;status.textContent=arrived.id==='muelle'?'De vuelta al muelle. Las islas siguen aquí para otro paseo.':'Llegamos a '+arrived.label.toLowerCase()+'. Hay un regalo esperándote.';}
  }
  nearby=boatIslandAt(boat.x,boat.y);render();
 }
 function actor(who,x,y){
  const choices=outfits();
  if(heading==='up'){
   drawHomeActor(ctx,{who,pose:'tv',x,y,frame:0,outfits:choices,getCharacterImage:url=>api.getCharacterImage?.(url)??api.assetImage?.(url),getRawImage:url=>api.assetImage?.(url),getPoseImage:url=>api.assetImage?.(url)});return;
  }
  const look=getChoice(choices,who),seated=api.getSeatedImage?.(who,look);
  if(seated){ctx.drawImage(seated,0,0,32,48,x,y,32,48);return;}
  const source=api.getCharacterImage?.(getSelectedLook(choices,who)?.sheet);if(source)ctx.drawImage(source,0,0,32,38,x,y,32,38);
 }
 function drawBoat(){
  const bob=preference.matches?0:Math.round(Math.sin(clock*2)*1),x=Math.round(boat.x),y=Math.round(boat.y)+bob;
  const horizontal=heading==='left'||heading==='right',column=horizontal?2:heading==='down'?1:0,atlas=api.assetImage?.(BOATS);
  // Oars rotate around their pins; their blades enter the water behind the hull.
  const swing=moving&&!preference.matches?Math.sin(clock*5)*.45:.15;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#153F4055';ctx.beginPath();ctx.ellipse(0,17,horizontal?54:33,horizontal?25:48,0,0,Math.PI*2);ctx.fill();
  for(const side of [-1,1]){
   ctx.save();ctx.translate(side*(horizontal?20:29),4);ctx.rotate(side*(.6+swing));
   ctx.fillStyle='#68462D';ctx.fillRect(side<0?-44:0,-2,44,4);ctx.fillStyle='#C58B4F';ctx.fillRect(side<0?-43:1,-1,42,2);
   ctx.fillStyle='#8D5D36';ctx.fillRect(side<0?-48:37,-4,12,8);ctx.fillStyle='#D4A562';ctx.fillRect(side<0?-47:38,-3,10,5);ctx.restore();
  }
  ctx.restore();
  if(atlas){
   ctx.save();if(heading==='left'){ctx.translate(x+64,y-64);ctx.scale(-1,1);ctx.drawImage(atlas,column*128,0,128,128,0,0,128,128);}
   else ctx.drawImage(atlas,column*128,0,128,128,x-64,y-64,128,128);ctx.restore();
  }
  // Full seated bodies preserve faces and wardrobe. Two real benches support
  // their poses, while the near hull naturally covers the lower seat edge.
  actor('leo',x-31,y-37);actor('itza',x+1,y-37);
  if(atlas){
   const cut=horizontal?82:100;
   ctx.save();if(heading==='left'){ctx.translate(x+64,y-64+cut);ctx.scale(-1,1);ctx.drawImage(atlas,column*128,cut,128,128-cut,0,0,128,128-cut);}
   else ctx.drawImage(atlas,column*128,cut,128,128-cut,x-64,y-64+cut,128,128-cut);ctx.restore();
  }
  if(moving&&!preference.matches){ctx.fillStyle='#DAEBD088';for(let i=0;i<3;i++)ctx.fillRect(x-18-i*3,y+48+i*5,36+i*6,1);}
 }
 function draw(){
  if(!alive)return;ctx.imageSmoothingEnabled=false;
  camera.x=Math.round(clamp(boat.x-canvas.width*.5,0,768-canvas.width));camera.y=Math.round(clamp(boat.y-canvas.height*.53,0,512-canvas.height));
  ctx.save();ctx.translate(-camera.x,-camera.y);
  const background=api.assetImage?.(BACKGROUND);if(background)ctx.drawImage(background,0,0,768,512);else{ctx.fillStyle='#448D85';ctx.fillRect(0,0,768,512);}
  if(!preference.matches){ctx.fillStyle='#D5EACD77';for(let i=0;i<13;i++){const x=45+(i*83)%690,y=90+(i*59)%306;if(boatWater(x,y))ctx.fillRect(x+Math.round(Math.sin(clock+i)*3),y,6+i%7,1);}}
  for(const island of BOAT_ISLANDS){if(!state.found.includes(island.id))continue;const x=island.arrival.x,y=island.arrival.y;ctx.fillStyle='#F1D889';ctx.fillRect(x-2,y-31,5,1);ctx.fillRect(x,y-33,1,5);}
  drawBoat();
  if(route.length){const point=route.at(-1);ctx.fillStyle='#FBE9BC';ctx.fillRect(point.x-3,point.y-1,7,1);ctx.fillRect(point.x,point.y-4,1,7);}
  ctx.restore();canvas.dataset.cameraX=String(camera.x);canvas.dataset.cameraY=String(camera.y);
 }
 function tick(time){raf=0;if(!alive||document.hidden)return;const dt=last?Math.min(.05,(time-last)/1000):0;last=time;clock+=dt;update(dt);draw();schedule();}
 function schedule(){if(alive&&!raf&&!document.hidden&&(!preference.matches||route.length||keys.size))raf=requestAnimationFrame(tick);}
 function resize(){if(!alive)return;const viewport=boatingViewport(stage.clientWidth,stage.clientHeight);canvas.width=viewport.width;canvas.height=viewport.height;Object.assign(canvas.style,{width:viewport.cssWidth+'px',height:viewport.cssHeight+'px',left:Math.floor((stage.clientWidth-viewport.cssWidth)/2)+'px',top:Math.floor((stage.clientHeight-viewport.cssHeight)/2)+'px'});canvas.dataset.pixelScale=String(viewport.scale);draw();}
 function pointer(event){
  if(event.button!==0)return;const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*canvas.width+camera.x,y=(event.clientY-rect.top)/rect.height*canvas.height+camera.y;
  const island=BOAT_ISLANDS.find(item=>Math.hypot(x-item.arrival.x,y-item.arrival.y)<50);if(island){navigate(island);return;}
  keys.clear();viewed=null;message.hidden=true;destination=null;route=boatRoute(boat,nearestBoatWater(x,y));status.textContent='Remando juntos…';canvas.focus({preventScroll:true});render();schedule();
 }
 function keydown(event){const key=event.key.length===1?event.key.toLowerCase():event.key;if(vectors[key]){event.preventDefault();event.stopPropagation();keys.add(key);route=[];destination=null;viewed=null;message.hidden=true;schedule();}else if(key==='e'){event.preventDefault();event.stopPropagation();discover();}}
 function keyup(event){keys.delete(event.key.length===1?event.key.toLowerCase():event.key);}
 function blur(){keys.clear();}
 function visibility(){last=0;keys.clear();if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{draw();schedule();}}
 function motion(){cancelAnimationFrame(raf);raf=0;last=0;draw();schedule();}
 const observer=new ResizeObserver(resize);observer.observe(stage);
 canvas.addEventListener('pointerup',pointer);canvas.addEventListener('keydown',keydown);canvas.addEventListener('blur',blur);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',motion);
 persist();render();resize();schedule();
 return ()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerup',pointer);canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('blur',blur);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',motion);keys.clear();};
}
