import {HAIR_REGIONS} from './hair-regions.js';
import {WEDDING_HAIR_REGIONS} from './hair-wedding-regions.js';

export const HAIR_OPTIONS=Object.freeze([
  {id:'negro',name:'Negro',swatch:'#302830'},
  {id:'cafe',name:'Café',swatch:'#77492f'},
  {id:'rosa',name:'Rosa pastel',swatch:'#f1bbd1'},
  {id:'rubio',name:'Rubio claro',swatch:'#f5e5be'}
]);
const palettes={
  cafe:[[55,30,24],[85,47,32],[119,73,47],[158,103,65],[190,140,91]],
  rosa:[[162,101,127],[219,153,181],[241,187,209],[253,219,234],[255,239,247]],
  rubio:[[168,136,85],[221,197,144],[245,229,190],[255,246,220],[255,252,237]]
};
const colors=new Set(HAIR_OPTIONS.map(option=>option.id));
export const getHairColor=outfits=>colors.has(outfits?.itza?.hair)?outfits.itza.hair:'negro';
export function chooseHairColor(outfits,who,color){
  if(who!=='itza'||!colors.has(color))return false;
  if(!outfits.itza||typeof outfits.itza!=='object')outfits.itza={};
  outfits.itza.hair=color;return true;
}
function profileRuns(profile,frame,row){
  if(profile.startsWith('walk-'))return HAIR_REGIONS[profile]?.[row]??[];
  if(profile.startsWith('seat-'))return HAIR_REGIONS[profile]??[];
  return WEDDING_HAIR_REGIONS[profile]?.[frame]?.runs??[];
}
export function hairMaskPixel(profile,frame,row,x,y){
  return profileRuns(profile,frame,row).some(([line,left,right])=>y===line&&x>=left&&x<=right);
}
// Preserve the silhouette ink beside the face/background, but tint dark
// interior strands as well. Keeping every near-black pixel unchanged left
// whole black locks inside otherwise blonde or pastel hair.
const skinPixel=(r,g,b)=>(r===199&&g===135&&b===104)||(r===146&&g===103&&b===89)||(r===211&&g===178&&b===160);
function contourInk(data,width,height,x,y){
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    const nx=x+dx,ny=y+dy;
    if(nx<0||ny<0||nx>=width||ny>=height)return true;
    const index=(ny*width+nx)*4;
    if(!data[index+3]||skinPixel(...data.subarray(index,index+3)))return true;
  }
  return false;
}
// Selective palette rendering preserves the face, clothes and outline.
export function recolorHairPixels({data,width,height},profile,color){
  const output=new Uint8ClampedArray(data),palette=palettes[color];
  if(!palette)return output;
  const cellWidth=profile.startsWith('walk-')||profile.startsWith('seat-')?32:64;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const index=(y*width+x)*4;
    if(!data[index+3]||!hairMaskPixel(profile,Math.floor(x/cellWidth),Math.floor(y/48),x%cellWidth,y%48))continue;
    const r=data[index],g=data[index+1],b=data[index+2],light=Math.max(r,g,b);
    if(light>112||light-Math.min(r,g,b)>48)continue;
    if(light<=20&&contourInk(data,width,height,x,y))continue;
    // Warm contours touching skin remain ink; warm interior hair shadows
    // must follow the selected color, too.
    if(r>g&&g>b&&r-b>20&&contourInk(data,width,height,x,y))continue;
    const shade=Math.min(4,Math.max(0,Math.floor((light-20)/18)));
    output.set(palette[shade],index);
  }
  return output;
}
const variants=new WeakMap();
export function hairVariant(image,profile,color='negro'){
  if(!image||!palettes[color])return image;
  let entries=variants.get(image);
  if(!entries){entries=new Map();variants.set(image,entries);}
  const key=profile+':'+color;if(entries.has(key))return entries.get(key);
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!width||!height||typeof document==='undefined')return image;
  const result=document.createElement('canvas');result.width=width;result.height=height;
  const ctx=result.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,width,height);
  pixels.data.set(recolorHairPixels(pixels,profile,color));ctx.putImageData(pixels,0,0);
  result.dataset.hairColor=color;result.dataset.hairProfile=profile;
  result.dataset.character='itza';result.dataset.assetSource=image.src||image.dataset?.assetSource||'';
  if(image.dataset?.weddingSource)result.dataset.weddingSource=image.dataset.weddingSource;
  entries.set(key,result);return result;
}
