import {getChoice,getSelectedLook} from './wardrobe.js';
import {getHairColor} from './hair.js';
import {getGlasses} from './glasses.js';
import {splitCharacterHeadPixels} from './character-head.js';

export const FISHING_SCENE_URL='/assets/game/fishing/scene.png';
export const FISHING_POSE_URL='/assets/game/fishing/poses.png';
export const FISHING_ACTOR_HEIGHT=64;
export const FISHING_BODY_OFFSET_Y=6;
// These points were measured on the generated palms after packing, rather
// than inferred from the outer frame. The rod is drawn behind that real hand.
export const FISHING_GRIPS=[[28,32],[35,26],[31,20],[34,11]];
const looks=['principal','alternativo','boda'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pixelsCache=new WeakMap(),actorCache=new WeakMap();
export function fishingViewport(width,height){
  const w=Math.max(1,Math.ceil(Number(width)||1)),h=Math.max(1,Math.ceil(Number(height)||1));
  const scale=Math.max(Math.min(w,h)<600?2:3,Math.ceil(w/640),Math.ceil(h/400));
  return {width:Math.ceil(w/scale),height:Math.ceil(h/scale),scale,
    cssWidth:Math.ceil(w/scale)*scale,cssHeight:Math.ceil(h/scale)*scale};
}
export function fishingPoseAt(phase,elapsed=0,reducedMotion=false){
  const time=Math.max(0,Number(elapsed)||0);
  if(phase==='waiting')return {pose:!reducedMotion&&time<.48?1:0,visual:!reducedMotion&&time<.48?'casting':'waiting',progress:clamp(time/.48,0,1)};
  if(phase==='bite')return {pose:2,visual:'bite',progress:0};
  if(phase==='caught')return {pose:reducedMotion||time>=1.05?3:2,visual:reducedMotion||time>=1.05?'caught':'reeling',progress:reducedMotion?1:clamp(time/1.05,0,1)};
  return {pose:0,visual:phase==='missed'?'missed':'idle',progress:0};
}
function pixelsOf(image){
  if(pixelsCache.has(image))return pixelsCache.get(image);
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);pixelsCache.set(image,pixels);return pixels;
}
function actorPose({pose,outfits,source,raw,body}){
  if(!source||!body)return null;
  let variants=actorCache.get(source);if(!variants){variants=new WeakMap();actorCache.set(source,variants);}
  let frames=variants.get(body);if(!frames){frames=new Map();variants.set(body,frames);}
  const look=getChoice(outfits,'itza'),key=look+':'+pose;if(frames.has(key))return frames.get(key);
  const result=document.createElement('canvas');result.width=40;result.height=FISHING_ACTOR_HEIGHT;
  const ctx=result.getContext('2d');ctx.imageSmoothingEnabled=false;
  const split=splitCharacterHeadPixels(pixelsOf(source),pixelsOf(raw||source),{who:'itza',look,direction:1,width:40,height:56,offsetX:4,offsetY:2});
  const head=document.createElement('canvas'),hair=document.createElement('canvas');head.width=hair.width=40;head.height=hair.height=56;
  head.getContext('2d').putImageData(new ImageData(split.head,40,56),0,0);
  hair.getContext('2d').putImageData(new ImageData(split.hair,40,56),0,0);
  ctx.drawImage(hair,0,0);ctx.drawImage(body,pose*40,Math.max(0,looks.indexOf(look))*56,40,56,0,FISHING_BODY_OFFSET_Y,40,56);ctx.drawImage(head,0,0);
  Object.assign(result.dataset,{fishingActor:'itza',fishingPose:String(pose),fishingLook:look,fishingGripX:String(FISHING_GRIPS[pose][0]),fishingGripY:String(FISHING_GRIPS[pose][1]),hairColor:source.dataset?.hairColor||'negro',
    glassesItza:source.dataset?.glassesItza||'on',assetSource:source.src||source.dataset?.assetSource||''});
  frames.set(key,result);return result;
}

export function createFishingScene({stage,api,preference}){
  const canvas=document.createElement('canvas');canvas.className='fishing-scene';canvas.width=640;canvas.height=400;
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Itza prepara su caña de pescar en la orilla del lago');
  stage.append(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  let alive=true,raf=0,last=0,elapsed=0,phase='idle',plushie=null;
  let frameWidth=640,frameHeight=400,pixelScale=1;
  const images=new Map();
  function image(url){
    if(!url)return null;
    const ready=api.assetImage?.(url);if(ready)return ready;
    let entry=images.get(url);if(entry)return entry.complete&&entry.naturalWidth?entry:null;
    entry=new Image();entry.decoding='async';entry.onload=()=>{if(alive)draw();};entry.onerror=()=>{};entry.src=url;images.set(url,entry);
    return null;
  }
  function actor(pose,x,y){
    const outfits=api.getOutfits?.()??api.save?.outfits??{},selected=getSelectedLook(outfits,'itza');
    const source=api.getCharacterImage?.(selected?.sheet)??image(selected?.sheet),body=image(FISHING_POSE_URL);
    const sprite=actorPose({pose,outfits,source,raw:image(selected?.sheet),body});
    if(sprite)ctx.drawImage(sprite,x,y,40,FISHING_ACTOR_HEIGHT);
    return Boolean(sprite);
  }
  function reserve(){
    const bounds=stage.getBoundingClientRect(),status=stage.parentElement?.querySelector('.fishing-status')?.getBoundingClientRect();
    return status?.height&&status.top<bounds.bottom?clamp((bounds.bottom-status.top)/pixelScale+8,25,canvas.height*.38):25;
  }
  function rod(x,y,tipX,tipY){
    ctx.strokeStyle='#4F4A36';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tipX,tipY);ctx.stroke();
    ctx.strokeStyle='#C49C64';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-.5,y);ctx.lineTo(tipX-.5,tipY);ctx.stroke();
  }
  function fishingLine(x,y,toX,toY){ctx.strokeStyle='#F4E8C5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.round(x),Math.round(y));ctx.lineTo(Math.round(toX),Math.round(toY));ctx.stroke();}
  function splash(x,y,age){
    const progress=clamp(age,0,1),radius=4+progress*10;ctx.strokeStyle='#E1EEE1';ctx.globalAlpha=1-progress;
    ctx.beginPath();ctx.ellipse(x,y,radius,radius*.3,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<5;i++)ctx.fillRect(Math.round(x+(i-2)*3),Math.round(y-Math.sin(i+1)*4*(1-progress)),1,2);
    ctx.globalAlpha=1;
  }
  function draw(){
    if(!alive)return;
    const width=canvas.width,height=canvas.height,still=preference.matches,step=fishingPoseAt(phase,elapsed,still);
    const baseline=Math.round(Math.min(height*.82,height-reserve())),actorX=Math.round(width/2-39),actorY=baseline-(FISHING_ACTOR_HEIGHT-2);
    const scale=Math.max(width/640,height/400),bgWidth=640*scale,bgHeight=400*scale;
    const bgX=(width-bgWidth)/2,bgY=clamp(baseline-344*scale,height-bgHeight,0),background=image(FISHING_SCENE_URL);
    ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;
    if(background)ctx.drawImage(background,bgX,bgY,bgWidth,bgHeight);
    else{ctx.fillStyle='#75A79A';ctx.fillRect(0,0,width,height);ctx.fillStyle='#AFC875';ctx.fillRect(0,height*.72,width,height*.28);}
    const floatX=Math.round(width/2+31),floatY=Math.round(Math.min(height*.47,baseline-64));
    if(!still){ctx.fillStyle='#DCEBC780';for(let i=0;i<7;i++)ctx.fillRect(Math.round(width*.15+(i*39)%(width*.7)+Math.sin(elapsed+i)*2),Math.round(height*.25+(i*11)%(height*.22)),8+i%3*3,1);}
    ctx.fillStyle='#667A5840';ctx.fillRect(actorX+10,baseline-1,25,4);
    const hand={x:actorX+FISHING_GRIPS[step.pose][0],y:actorY+FISHING_GRIPS[step.pose][1]};
    const tips=[[69,-19],[92,14],[54,-19],[49,-27]],tip={x:actorX+tips[step.pose][0],y:actorY+tips[step.pose][1]};
    if(step.visual==='casting'){
      const t=step.progress;tip.x=actorX+58+t*34;tip.y=actorY-24+t*38;
    }
    rod(hand.x,hand.y,tip.x,tip.y);
    const ready=actor(step.pose,actorX,actorY);
    let rewardX=null,rewardY=null;
    if(phase==='waiting'||phase==='bite'){
      const bob=still?0:phase==='bite'?Math.sin(elapsed*14)*2:Math.sin(elapsed*3)*.7;
      fishingLine(tip.x,tip.y,floatX,floatY+bob);
      ctx.fillStyle='#C07B7D';ctx.fillRect(floatX-2,Math.round(floatY-4+bob),4,5);ctx.fillStyle='#FFF0D5';ctx.fillRect(floatX-2,Math.round(floatY-1+bob),4,2);
      if(phase==='bite'){ctx.fillStyle='#FFF1C6';ctx.fillRect(floatX-1,floatY-15,2,5);ctx.fillRect(floatX-1,floatY-8,2,2);}
      if(!still&&elapsed<.5)splash(floatX,floatY,elapsed*2);
    }else if(phase==='caught'&&plushie){
      const p=step.progress,eased=1-(1-p)**3,target={x:actorX+54,y:actorY+2};
      rewardX=floatX+(target.x-floatX)*eased;rewardY=floatY+(target.y-floatY)*eased-Math.sin(p*Math.PI)*20;
      fishingLine(tip.x,tip.y,rewardX,rewardY-10);
      const caught=image(plushie.image);if(caught)ctx.drawImage(caught,Math.round(rewardX)-12,Math.round(rewardY)-12,24,24);
      if(!still&&elapsed<.5)splash(floatX,floatY,elapsed*2);
      if(p>=1){ctx.fillStyle='#F9DB91';for(const [dx,dy] of [[-18,-6],[16,-12],[17,8]]){ctx.fillRect(Math.round(rewardX+dx),Math.round(rewardY+dy),1,3);ctx.fillRect(Math.round(rewardX+dx)-1,Math.round(rewardY+dy)+1,3,1);}}
    }else{
      fishingLine(tip.x,tip.y,tip.x+2,tip.y+21);ctx.fillStyle='#B97378';ctx.fillRect(Math.round(tip.x),Math.round(tip.y)+20,4,4);
    }
    const outfits=api.getOutfits?.()??api.save?.outfits??{};
    Object.assign(canvas.dataset,{phase,visual:step.visual,fishingPose:String(step.pose),itzaLook:getChoice(outfits,'itza'),itzaHair:getHairColor(outfits),itzaGlasses:String(getGlasses(outfits,'itza')),
      actorReady:String(ready),actorX:String(actorX),actorY:String(actorY),actorWidth:'40',actorHeight:String(FISHING_ACTOR_HEIGHT),bodyOffsetY:String(FISHING_BODY_OFFSET_Y),rodHandX:String(hand.x),rodHandY:String(hand.y),rodTipX:String(tip.x),rodTipY:String(tip.y),
      rewardX:rewardX===null?'':rewardX.toFixed(2),rewardY:rewardY===null?'':rewardY.toFixed(2),plushie:plushie?.id||''});
    canvas.setAttribute('aria-label',phase==='caught'?'Itza levanta con su caña el peluche de '+plushie?.name:phase==='bite'?'Itza tira de su caña: ha picado un peluche':phase==='waiting'?'Itza pesca desde la orilla, con la caña y el flotador en el agua':'Itza está en la orilla del lago, sosteniendo su caña de pescar');
  }
  function schedule(){if(alive&&!raf&&!document.hidden&&!preference.matches&&(phase==='waiting'||phase==='bite'||phase==='caught'&&elapsed<1.5))raf=requestAnimationFrame(tick);}
  function tick(time){raf=0;if(!alive||document.hidden)return;elapsed+=last?Math.min(.06,(time-last)/1000):0;last=time;draw();schedule();}
  function resize(){
    if(!alive)return;frameWidth=stage.clientWidth||640;frameHeight=stage.clientHeight||400;
    const viewport=fishingViewport(frameWidth,frameHeight);pixelScale=viewport.scale;canvas.width=viewport.width;canvas.height=viewport.height;
    Object.assign(canvas.style,{width:viewport.cssWidth+'px',height:viewport.cssHeight+'px',left:Math.floor((frameWidth-viewport.cssWidth)/2)+'px',top:Math.floor((frameHeight-viewport.cssHeight)/2)+'px'});
    canvas.dataset.pixelScale=String(pixelScale);draw();
  }
  function motion(){cancelAnimationFrame(raf);raf=0;last=0;draw();schedule();}
  function visibility(){last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{draw();schedule();}}
  const observer=new ResizeObserver(resize);observer.observe(stage);
  // Wrapped captions and late font metrics change the clear area above the
  // controls even when the canvas viewport itself has not changed size.
  const status=stage.parentElement?.querySelector('.fishing-status');if(status)observer.observe(status);
  document.fonts?.ready.then(()=>{if(alive)resize();});
  preference.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
  resize();
  return {canvas,setState(next){if(!alive)return;const changed=phase!==next.phase||plushie?.id!==next.plushie?.id;phase=next.phase;plushie=next.plushie||null;if(changed){elapsed=0;last=0;}draw();schedule();},
    dispose(){alive=false;cancelAnimationFrame(raf);observer.disconnect();preference.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);for(const image of images.values()){image.onload=null;image.onerror=null;}}};
}
