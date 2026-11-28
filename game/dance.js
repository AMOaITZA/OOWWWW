import {getChoice,getSelectedLook} from './wardrobe.js';
import {characterHeadPixel} from './character-head.js';
import {hairMaskPixel} from './hair.js';

export const DANCE_BODY_URL='/assets/game/dance/bodies.png';
export const DANCE_FRAME_SIZE=Object.freeze({width:40,height:56});
export const DANCE_FRAME_COUNT=8;
export const DANCE_LOOP_SECONDS=2.4;
const looks=['principal','alternativo','boda'];
const phases=['de la mano','paso abierto','paso cruzado','preparar el giro','vuelta de la pareja','cerrar el giro','paso al costado','encontrarnos otra vez'];
const headDirections=[1,0,1,0,2,2,0,1];
const spacing=[17,24,18,19,20,21,24,17];
const pixelsCache=new WeakMap(),poseCache=new WeakMap();

// A complete turn alternates who leads. Both partners use all eight drawn
// silhouettes over two loops, including a real back-facing twirl.
export function danceStep(time=0,reducedMotion=false){
  const safe=Number.isFinite(time)?Math.max(0,time):0;
  const frame=reducedMotion?0:Math.floor((safe%DANCE_LOOP_SECONDS)/DANCE_LOOP_SECONDS*DANCE_FRAME_COUNT);
  const lead=reducedMotion?0:Math.floor(safe/DANCE_LOOP_SECONDS)%2;
  const turning=lead===0?'itza':'leo';
  return {frame,phase:phases[frame],turning,leoFrame:frame===4&&turning!=='leo'?3:frame,
    itzaFrame:frame===4&&turning!=='itza'?3:frame,spacing:spacing[frame]};
}
function pixelsOf(image){
  if(pixelsCache.has(image))return pixelsCache.get(image);
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);pixelsCache.set(image,pixels);return pixels;
}
function dancePortrait(personalized,raw,who,look,direction){
  const layer=document.createElement('canvas');
  layer.width=DANCE_FRAME_SIZE.width;layer.height=DANCE_FRAME_SIZE.height;
  const ctx=layer.getContext('2d'),image=ctx.createImageData(layer.width,layer.height);
  for(let y=0;y<48;y++)for(let x=0;x<32;x++){
    const row=direction*48+y,source=(row*personalized.width+x)*4;
    if(!personalized.data[source+3])continue;
    if(!characterHeadPixel(who,look,direction,x,y)){
      // Locks fall in front of the dancing shoulders. Select them in the
      // original art so blonde highlights and warm outlines both survive.
      if(who!=='itza'||!hairMaskPixel('walk-'+look,0,direction,x,y))continue;
      const i=(row*raw.width+x)*4;
      const r=raw.data[i],g=raw.data[i+1],b=raw.data[i+2],light=Math.max(r,g,b);
      if(light>112||light-Math.min(r,g,b)>48)continue;
    }
    image.data.set(personalized.data.subarray(source,source+4),(y*layer.width+x+4)*4);
  }
  ctx.putImageData(image,0,0);
  return layer;
}
function actorPose({who,bodyFrame,outfits,getCharacterImage,getRawImage,getDanceImage}){
  const look=getChoice(outfits,who),selected=getSelectedLook(outfits,who);
  const source=getCharacterImage?.(selected?.sheet),body=getDanceImage?.(DANCE_BODY_URL);
  if(!source||!body)return null;
  let byBody=poseCache.get(source);if(!byBody){byBody=new WeakMap();poseCache.set(source,byBody);}
  let variants=byBody.get(body);if(!variants){variants=new Map();byBody.set(body,variants);}
  const key=who+':'+look+':'+bodyFrame;if(variants.has(key))return variants.get(key);
  const canvas=document.createElement('canvas');canvas.width=40;canvas.height=56;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const personalized=pixelsOf(source),raw=pixelsOf(getRawImage?.(selected?.sheet)||source);
  const direction=headDirections[bodyFrame];
  const row=(who==='itza'?3:0)+Math.max(0,looks.indexOf(look));
  ctx.drawImage(body,bodyFrame*40,row*56,40,56,0,0,40,56);
  ctx.drawImage(dancePortrait(personalized,raw,who,look,direction),0,0);
  Object.assign(canvas.dataset,{danceCharacter:who,danceLook:look,dancePose:String(bodyFrame),
    danceHeadDirection:String(direction),hairColor:source.dataset?.hairColor||'negro',
    glassesItza:source.dataset?.glassesItza||'on',glassesLeo:source.dataset?.glassesLeo||'on',
    assetSource:source.src||source.dataset?.assetSource||''});
  variants.set(key,canvas);return canvas;
}

export function drawDancingPair(ctx,{x,y,time=0,reducedMotion=false,outfits={},getCharacterImage,getRawImage,getDanceImage}){
  const step=danceStep(time,reducedMotion);
  const actors=['leo','itza'].map(who=>({who,bodyFrame:step[who+'Frame'],
    pose:actorPose({who,bodyFrame:step[who+'Frame'],outfits,getCharacterImage,getRawImage,getDanceImage})}));
  if(actors.some(actor=>!actor.pose))return {...step,ready:false};
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const actor of actors){
    const side=actor.who==='leo'?-1:1;
    const turning=actor.who===step.turning&&step.frame>=3&&step.frame<=5;
    const turnArc=turning?[0,0,0,-1,3,1,0,0][step.frame]:0;
    const cx=Math.round(x+side*step.spacing+side*turnArc),cy=Math.round(y+(turning&&step.frame===4?-1:0));
    ctx.fillStyle='#533F3A32';ctx.fillRect(cx-10,cy-1,20,3);ctx.fillRect(cx-7,cy+2,14,1);
    ctx.save();
    const mirror=actor.who==='itza';
    ctx.translate(cx+(mirror?20:-20),cy-54);if(mirror)ctx.scale(-1,1);
    ctx.drawImage(actor.pose,0,0,40,56);ctx.restore();
  }
  ctx.restore();return {...step,ready:true};
}
