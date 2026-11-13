import {WIDTH,HEIGHT,walkable} from './world.js';
import {activateDialog} from './dialog.js';
const STEP=3;
const palette={grass:'#94B77B',grassShade:'#8BAE74',road:'#D8C69A',water:'#6D9BAC',accent:'#B5656F',ink:'#1B120E',cream:'#FFF1DC',visited:'#F2C46D'};
export function createMap({places,decor,moments=[],pair,save,onNavigate}){
  const panel=document.getElementById('map-panel');
  const canvas=document.getElementById('overview');
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const closeButton=document.getElementById('close-map');
  const destinations=document.getElementById('map-destinations');
  const mapButton=document.getElementById('map-button');
  let releaseDialog=()=>{};
  const background=document.createElement('canvas');
  background.width=WIDTH*STEP;background.height=HEIGHT*STEP;
  const land=background.getContext('2d');land.imageSmoothingEnabled=false;
  land.fillStyle=palette.grass;land.fillRect(0,0,background.width,background.height);
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    if((x*29+y*17)%13===0){land.fillStyle=palette.grassShade;land.fillRect(x*STEP,y*STEP,STEP,STEP);}
    if((y>=36&&y<=42&&x>10&&x<101)||(x>=59&&x<=65&&y>19&&y<65)){
      land.fillStyle=palette.road;land.fillRect(x*STEP,y*STEP,STEP,STEP);
    }
  }
  land.fillStyle='#426B4C';
  for(const item of decor)if(item.kind==='tree')land.fillRect(item.tile[0]*STEP-2,item.tile[1]*STEP-2,7,7);
  function repaint(){
    if(panel.hidden)return;
    ctx.drawImage(background,0,0);
    for(const place of places){
      const x=place.tile[0]*STEP,y=place.tile[1]*STEP;
      ctx.fillStyle=save.visited.includes(place.id)?palette.visited:palette.accent;
      ctx.fillRect(x-4,y-4,9,9);
      ctx.fillStyle=palette.ink;ctx.fillRect(x-2,y-2,5,5);
      ctx.fillStyle=palette.cream;ctx.fillRect(x-1,y-1,3,3);
    }
    for(const spot of moments){
      const x=spot.tile[0]*STEP,y=spot.tile[1]*STEP;
      ctx.fillStyle=spot.kind==='cats'?'#F6C0CE':'#F2C46D';
      ctx.fillRect(x-3,y-3,7,7);
      ctx.fillStyle=palette.ink;ctx.fillRect(x-1,y-1,3,3);
    }
    // Vista exacta de 480×270 sobre el mapa de 1920×1280.
    const cameraX=Math.max(0,Math.min(WIDTH*16-480,Math.round(pair.x*16-240)));
    const cameraY=Math.max(0,Math.min(HEIGHT*16-270,Math.round(pair.y*16-135)));
    ctx.strokeStyle=palette.ink;ctx.lineWidth=2;
    ctx.strokeRect(Math.round(cameraX*STEP/16),Math.round(cameraY*STEP/16),90,51);
    ctx.fillStyle=palette.ink;ctx.fillRect(Math.round(pair.x*STEP)-3,Math.round(pair.y*STEP)-3,7,7);
    ctx.fillStyle=palette.visited;ctx.fillRect(Math.round(pair.x*STEP)-2,Math.round(pair.y*STEP)-2,5,5);
  }
  function close(){
    if(panel.hidden)return;
    releaseDialog();releaseDialog=()=>{};
    mapButton.setAttribute('aria-expanded','false');
  }
  function navigate(x,y,place){
    close();
    onNavigate(x,y,place);
  }
  function open(){
    if(!panel.hidden)return;
    destinations.replaceChildren();
    for(const place of places){
      const button=document.createElement('button');
      button.type='button';button.className='map-destination';button.textContent=place.name;
      if(save.visited.includes(place.id))button.classList.add('visited');
      button.addEventListener('click',()=>navigate(...place.arrival,place));
      destinations.append(button);
    }
    for(const spot of moments){
      const button=document.createElement('button');
      button.type='button';button.className='map-destination moment-destination';
      button.textContent=spot.kind==='cats'?'Gatitos · Acariciar':'Banca · '+spot.name;
      button.addEventListener('click',()=>navigate(...spot.arrival,spot));
      destinations.append(button);
    }
    releaseDialog=activateDialog(panel,{onClose:close,initialFocus:closeButton,fallbackFocus:mapButton});
    mapButton.setAttribute('aria-expanded','true');
    repaint();
  }
  canvas.addEventListener('pointerdown',event=>{
    const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)*canvas.width/rect.width/STEP;
    const y=(event.clientY-rect.top)*canvas.height/rect.height/STEP;
    const spot=moments.reduce((best,p)=>{
      const dist=Math.hypot(p.tile[0]-x,p.tile[1]-y);
      return dist<3.8&&(!best||dist<best.dist)?{p,dist}:best;
    },null)?.p;
    if(spot){navigate(...spot.arrival,spot);return;}
    const place=places.reduce((best,p)=>{
      const dist=Math.hypot(p.tile[0]-x,p.tile[1]-y);
      return dist<7&&(!best||dist<best.dist)?{p,dist}:best;
    },null)?.p;
    if(place)navigate(...place.arrival,place);
    else navigate(Math.floor(x),Math.floor(y),null);
  });
  mapButton.addEventListener('click',open);
  closeButton.addEventListener('click',close);
  panel.addEventListener('pointerdown',event=>{if(event.target===panel)close();});
  return {open,close,repaint,isOpen:()=>!panel.hidden};
}
