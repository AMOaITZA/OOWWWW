import {hairMaskPixel} from './hair.js';

export const getGlasses=(outfits,who)=>outfits?.[who]?.glasses!==false;
export function chooseGlasses(outfits,who,enabled){
  if(!['itza','leo'].includes(who)||typeof enabled!=='boolean')return false;
  if(!outfits[who]||typeof outfits[who]!=='object')outfits[who]={};
  outfits[who].glasses=enabled;return true;
}
const skin=(r,g,b)=>(r===199&&g===135&&b===104)||(r===146&&g===103&&b===89)||(r===211&&g===178&&b===160);
const faceTone=[199,135,104];
const isWalk=profile=>profile.startsWith('walk-');
const isSeated=profile=>profile.startsWith('seat-');
// Traced eye bands on the native sheets. In particular bridal veil shadows
// are not skin: they must never expand a face box or stretch an eye patch.
const walkingBands={
  itza:{principal:[[8,16,17,6],[19,16,7,5]],alternativo:[[8,16,17,7],[20,17,7,6]],boda:[[7,16,16,6],[20,15,7,6]]},
  leo:{principal:[[8,17,18,5],[18,16,7,4]],alternativo:[[6,16,21,7],[18,17,8,6]],boda:[[8,16,18,6],[19,16,7,5]]}
};
const pairedBands={
  idle:{leo:[[15,15,15,6]],itza:[[33,15,15,6]]},
  vows:{leo:[[15,15,15,6]],itza:[[34,15,15,6],[34,15,15,6],[34,15,15,6],[33,15,15,6]]},
  celebrate:{leo:[[15,15,15,6]],itza:[[33,15,15,6]]},
  kiss:{leo:[[16,15,14,6],[19,14,12,6],[20,13,12,6]],itza:[[33,14,12,6],[33,14,10,6],[33,15,9,6]]},
  hug:{leo:[[16,15,14,6],[18,14,13,6]],itza:[[32,14,12,6],[32,15,10,6]]},
  'wedding-bench-v2':{leo:[[14,14,16,6]],itza:[[34,14,15,6]]},
  'wedding-bench':{leo:[[14,14,16,6]],itza:[[34,14,15,6]]}
};
function faceBox(pixels,frame,who,profile,row,cellWidth){
  const side=isWalk(profile)&&row===1;
  const ranges=cellWidth===64?(who==='leo'?[11,30,8,23]:[31,51,7,24]):side?[16,29,7,24]:[4,28,7,isSeated(profile)?22:24];
  const [l,r,t,b]=ranges;let left=r,right=l,top=b,bottom=t,count=0;
  for(let y=t;y<=b;y++)for(let x=l;x<=r;x++){
    const i=((row*48+y)*pixels.width+frame*cellWidth+x)*4;
    if(!pixels.data[i+3]||!skin(...pixels.data.subarray(i,i+3)))continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
  }
  return count>=6?{left,right,top,bottom}:null;
}
export function eyeRegion(pixels,profile,who,frame,row=0){
  if(isWalk(profile)&&row===2)return null;
  const cellWidth=isWalk(profile)||isSeated(profile)?32:64;
  const box=faceBox(pixels,frame,who,profile,row,cellWidth);if(!box)return null;
  const side=isWalk(profile)?row===1:['kiss','hug'].includes(profile);
  let band;
  if(isWalk(profile))band=walkingBands[who]?.[profile.slice(5)]?.[row];
  else if(isSeated(profile))band=[9,14,15,7];
  else{const list=pairedBands[profile]?.[who];band=list?.[frame]??list?.[0];}
  if(!band)return null;
  const [x,y,width,height]=band;
  const reference=faceBox(pixels,0,who,profile,row,cellWidth);
  const vertical=isWalk(profile)||isSeated(profile)?Math.max(-1,Math.min(1,box.top-(reference?.top??box.top))):0;
  return {x,y:y+vertical,width,height,
    side,mirror:cellWidth===64&&side&&who==='itza',closed:frame===1||['kiss','hug'].includes(profile),cellWidth};
}

// Restore the two lens bands independently. A full face-sized rectangle used
// to flatten the eyebrows, nose and cheek shading. Eye artwork is now sampled
// at its native 3×3 pixel size; no head or eye is stretched to fit a face box.
function lensBands(region){
  if(region.side)return [{x:region.x,width:region.width}];
  const width=Math.floor((region.width-3)/2);
  return [{x:region.x,width},{x:region.x+region.width-width,width}];
}
function patchPixel(patches,x,y){
  const index=(y*patches.width+x)*4;
  return patches.data.subarray(index,index+3);
}
export function removeGlassesPixels(pixels,profile,people,patches){
  const data=new Uint8ClampedArray(pixels.data),cellWidth=isWalk(profile)||isSeated(profile)?32:64;
  const rows=pixels.height/48,columns=pixels.width/cellWidth;
  for(let row=0;row<rows;row++)for(let frame=0;frame<columns;frame++)for(const who of people){
    const region=eyeRegion(pixels,profile,who,frame,row);if(!region)continue;
    const bands=lensBands(region);
    const pixelIndex=(x,y)=>((row*48+y)*pixels.width+frame*cellWidth+x)*4;
    const protectedHair=(x,y,index)=>who==='itza'&&hairMaskPixel(profile,frame,row,x,y)&&!skin(...pixels.data.subarray(index,index+3));
    for(const band of bands)for(let y=region.y;y<region.y+region.height;y++)for(let x=band.x;x<band.x+band.width;x++){
      const index=pixelIndex(x,y);
      if(!pixels.data[index+3]||protectedHair(x,y,index))continue;
      // Skin-tone quantization also occurs on the original tinted rims.
      // Their top/bottom rails must be cleared even when a rail equals a
      // cheek-shadow color; the real brows sit above these lens bands.
      if(skin(...pixels.data.subarray(index,index+3))&&y!==region.y&&y!==region.y+region.height-1)continue;
      data.set(faceTone,index);
    }
    // Only neutral frame ink can be the bridge. Keep the warm, original
    // nose shading and every skin pixel between the lenses.
    if(!region.side){
      const y=region.y+Math.floor(region.height/2);
      const [left,right]=bands;
      for(let x=left.x+left.width;x<right.x;x++){
        const index=pixelIndex(x,y),[r,g,b,a]=pixels.data.subarray(index,index+4);
        if(a&&!skin(r,g,b)&&Math.max(r,g,b)<=112&&
          Math.max(r,g,b)-Math.min(r,g,b)<=24&&!(r>g&&g>b&&r-b>20))data.set(faceTone,index);
      }
    }
    const patchCol=(region.side?2:0)+(region.closed?1:0),patchX=patchCol*18,patchY=(who==='itza'?0:8);
    for(const [eye,band] of bands.entries()){
      const eyeX=band.x+Math.floor((band.width-3)/2),eyeY=region.y+(region.side?1:2);
      const sourceX=region.side?7:eye===0?3:11;
      const height=region.closed?1:3;
      for(let y=0;y<height;y++)for(let x=0;x<3;x++){
        const index=pixelIndex(eyeX+x,eyeY+y);
        if(!pixels.data[index+3]||protectedHair(eyeX+x,eyeY+y,index))continue;
        const sx=patchX+sourceX+(region.mirror?2-x:x);
        const sy=patchY+(region.closed?3:2)+y;
        data.set(patchPixel(patches,sx,sy),index);
      }
    }
  }
  return data;
}

let eyePatches=null;
export function setEyePatches(image){eyePatches=image;}
const cache=new WeakMap();
function pixelsOf(image){
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0);
  return {canvas,ctx,pixels:ctx.getImageData(0,0,width,height)};
}
export function glassesVariant(image,profile,who,outfits){
  if(!image||!eyePatches||typeof document==='undefined')return image;
  const people=(who?[who]:['leo','itza']).filter(person=>!getGlasses(outfits,person));
  if(!people.length)return image;
  let variants=cache.get(image);if(!variants){variants=new Map();cache.set(image,variants);}
  const key=profile+':'+people.join(',')+':'+getGlasses(outfits,'itza')+':'+getGlasses(outfits,'leo');
  if(variants.has(key))return variants.get(key);
  const result=pixelsOf(image),patches=pixelsOf(eyePatches).pixels;
  result.pixels.data.set(removeGlassesPixels(result.pixels,profile,people,patches));
  result.ctx.putImageData(result.pixels,0,0);
  Object.assign(result.canvas.dataset,image.dataset??{});
  result.canvas.dataset.appearanceProfile=profile;
  result.canvas.dataset.glassesItza=getGlasses(outfits,'itza')?'on':'off';
  result.canvas.dataset.glassesLeo=getGlasses(outfits,'leo')?'on':'off';
  result.canvas.dataset.assetSource=image.src||image.dataset?.assetSource||'';
  variants.set(key,result.canvas);return result.canvas;
}
