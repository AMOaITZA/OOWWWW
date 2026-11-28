import {getChoice,getSelectedLook} from './wardrobe.js';
import {splitCharacterHeadPixels} from './character-head.js';

const ACTIONS='/assets/game/cooking/actions.png';
const looks=['principal','alternativo','boda'];
const elbows=[14,14,16,18,18,17],palms=[23,24,25,26,26,26];
const gripHeights=[33,30,34,32];
const pixelCache=new WeakMap(),actorCache=new WeakMap();

function nativePixels(image){
  if(pixelCache.has(image))return pixelCache.get(image);
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  pixelCache.set(image,pixels);return pixels;
}

export function cookingPose(phase,clock,reduced,busy){
  if(phase==='served')return 3;
  if(phase==='stir'||phase==='cook')return reduced?1:1+Math.floor(clock*3)%2;
  return phase==='prepare'&&busy?1:0;
}

export function kitchenActor(who,pose,outfits,api){
  const look=getChoice(outfits,who),url=getSelectedLook(outfits,who)?.sheet;
  const source=api.getCharacterImage?.(url)??api.assetImage?.(url),atlas=api.assetImage?.(ACTIONS);
  if(!source||!atlas)return null;
  let variants=actorCache.get(source);
  if(!variants){variants=new Map();actorCache.set(source,variants);}
  const key=who+':'+look+':'+pose;
  if(variants.has(key))return variants.get(key);
  const row=(who==='itza'?3:0)+looks.indexOf(look);
  const canvas=document.createElement('canvas');canvas.width=32;canvas.height=48;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const {head,hair}=splitCharacterHeadPixels(nativePixels(source),nativePixels(api.assetImage?.(url)??source),
    {who,look,direction:1,width:32,height:48,offsetX:0,offsetY:0});
  ctx.putImageData(new ImageData(hair,32,48),0,0);
  ctx.drawImage(atlas,pose*32,row*48,32,48,0,0,32,48);
  const face=document.createElement('canvas');face.width=32;face.height=48;
  face.getContext('2d').putImageData(new ImageData(head,32,48),0,0);ctx.drawImage(face,0,0);
  const actor={canvas,elbow:elbows[row],gripX:palms[row],gripY:gripHeights[pose]};
  variants.set(key,actor);return actor;
}
