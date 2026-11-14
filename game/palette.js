// Deliberate colour substitutions only. Skin/lenses/eyes and all unlisted
// pixels are byte-for-byte unchanged; this is lighting, not a skin filter.
const LIGHTING=new Map([
  ['25,22,25',[42,39,46]], // indexed atlas hair/tuxedo shadow, never skin
  ['26,25,31',[42,41,53]],['23,21,26',[37,35,44]],
  ['28,27,33',[45,43,55]],['29,28,34',[48,46,58]],
  ['93,20,38',[119,39,62]],['54,30,38',[73,44,57]],
  ['60,70,83',[76,88,105]]
]);
export function relightPixel(r,g,b){return LIGHTING.get(`${r},${g},${b}`)??[r,g,b];}
export function relightImageData(data){
  for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const rgb=relightPixel(data[i],data[i+1],data[i+2]);data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];}
  return data;
}
export function litCanvas(image){
  const c=document.createElement('canvas');c.width=image.naturalWidth||image.width;c.height=image.naturalHeight||image.height;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,c.width,c.height);relightImageData(pixels.data);ctx.putImageData(pixels,0,0);return c;
}
