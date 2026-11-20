import {getChoice,getSelectedLook} from './wardrobe.js';
import {hairMaskPixel} from './hair.js';

export const HOME_POSE_URL='/assets/game/home/seated-bodies.png';
const looks=['principal','alternativo','boda'];
const pixelsCache=new WeakMap(),posedCache=new WeakMap();
function pixelsOf(image){
  let pixels=pixelsCache.get(image);if(pixels)return pixels;
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  pixels=ctx.getImageData(0,0,canvas.width,canvas.height);pixelsCache.set(image,pixels);return pixels;
}
function rawHairPixel(r,g,b){
  const light=Math.max(r,g,b);
  return light<=112&&light-Math.min(r,g,b)<=48&&!(r>g&&g>b&&r-b>20);
}
function posedActor({who,pose,frame,outfits,getCharacterImage,getRawImage,getPoseImage}){
  const look=getChoice(outfits,who),selected=getSelectedLook(outfits,who);
  const source=getCharacterImage?.(selected?.sheet),body=getPoseImage?.(HOME_POSE_URL);
  if(!source||!body)return null;
  let byBody=posedCache.get(source);if(!byBody){byBody=new WeakMap();posedCache.set(source,byBody);}
  let variants=byBody.get(body);if(!variants){variants=new Map();byBody.set(body,variants);}
  const index=frame?1:0,key=who+':'+look+':'+pose+':'+index;
  if(variants.has(key))return variants.get(key);
  const canvas=document.createElement('canvas');canvas.width=32;canvas.height=48;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const row=(who==='itza'?3:0)+Math.max(0,looks.indexOf(look));
  const column=(pose==='tv'?2:0)+index;
  ctx.drawImage(body,column*32,row*48,32,48,0,0,32,48);
  const personalized=pixelsOf(source),raw=pixelsOf(getRawImage?.(selected?.sheet)||source);
  const output=ctx.getImageData(0,0,32,48),direction=pose==='tv'?2:1;
  for(let y=0;y<40;y++)for(let x=0;x<32;x++){
    const from=((direction*48+y)*personalized.width+index*32+x)*4;
    if(!personalized.data[from+3])continue;
    if(y>=25){
      const original=((direction*48+y)*raw.width+index*32+x)*4;
      const hair=who==='itza'&&hairMaskPixel('walk-'+look,index,direction,x,y)&&
        rawHairPixel(...raw.data.subarray(original,original+3));
      // The cap look has shorter hair. Its real upper back must fill the
      // transparent hair-clearance region above the generated seated torso.
      const upperBack=pose==='tv'&&y<36&&!output.data[(y*32+x)*4+3];
      if(!hair&&!upperBack)continue;
    }
    output.data.set(personalized.data.subarray(from,from+4),(y*32+x)*4);
  }
  ctx.putImageData(output,0,0);
  canvas.dataset.homePose=pose;canvas.dataset.homeCharacter=who;canvas.dataset.homeLook=look;
  canvas.dataset.assetSource=source.src||source.dataset?.assetSource||'';
  Object.assign(canvas.dataset,{hairColor:source.dataset?.hairColor||'negro',
    hairProfile:source.dataset?.hairProfile||'walk-'+look,
    glassesItza:source.dataset?.glassesItza||'on',glassesLeo:source.dataset?.glassesLeo||'on'});
  variants.set(key,canvas);return canvas;
}

// A complete seated body is drawn first. Only personalized head/hair pixels
// are composed over it, so changing glasses or hair never swaps the outfit.
export function drawHomeActor(ctx,{who,pose,frame=0,x,y,outfits={},getCharacterImage,getRawImage,getPoseImage}){
  const actor=posedActor({who,pose,frame,outfits,getCharacterImage,getRawImage,getPoseImage});
  if(!actor)return false;
  ctx.save();
  if(pose==='eat'&&who==='itza'){
    ctx.translate(x+32,y);ctx.scale(-1,1);ctx.drawImage(actor,0,0,32,48);
  }else ctx.drawImage(actor,x,y,32,48);
  ctx.restore();return true;
}
