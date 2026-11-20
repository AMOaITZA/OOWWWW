import {placeWorldBounds} from './place-layout.js';
import {castleWorldBounds} from './castle-layout.js';

// Cast the painted silhouette onto the ground; transparent roof corners do not
// turn into a rectangular shadow. Every building shares the same light direction.
export function structureShadowGeometry(place){
  const source=place.kind==='wedding'?castleWorldBounds(place):placeWorldBounds(place);
  const x=source.x+source.width/2,y=source.y+source.height-3;
  return {source,x,y,shear:-.24,flatten:-.14,
    bounds:{x:source.x-2,y:y-2,width:source.width+source.height*.24+4,
      height:source.height*.14+6}};
}

const masks=new WeakMap();
function shadowMask(image){
  if(masks.has(image))return masks.get(image);
  if(typeof document==='undefined')return null;
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!width||!height)return null;
  const mask=document.createElement('canvas');mask.width=width;mask.height=height;
  const context=mask.getContext('2d');context.drawImage(image,0,0);
  context.globalCompositeOperation='source-in';context.fillStyle='#3E3540';context.fillRect(0,0,width,height);
  masks.set(image,mask);return mask;
}

export function structureShadowObjects(places,getPlaceImage,getWeddingImage,getNight=()=>false){
  return [{z:-.5,draw(ctx){
    if(!ctx.save||!ctx.transform)return;
    const cameraX=Number(ctx.canvas?.dataset?.cameraX)||0,cameraY=Number(ctx.canvas?.dataset?.cameraY)||0;
    const width=ctx.canvas?.width??1920,height=ctx.canvas?.height??1280;
    const strength=getNight() ? .65 : 1;
    for(const place of places){
      const geometry=structureShadowGeometry(place),b=geometry.bounds;
      if(b.x+b.width<cameraX||b.x>cameraX+width||b.y+b.height<cameraY||b.y>cameraY+height)continue;
      const image=place.kind==='wedding'?getWeddingImage('castle-v2'):getPlaceImage(place.id);
      if(!image)continue;
      const mask=shadowMask(image);if(!mask)continue;
      ctx.save();
      ctx.globalAlpha=.11*strength;
      ctx.transform(1,0,geometry.shear,geometry.flatten,geometry.x+1,geometry.y+2);
      ctx.drawImage(mask,-geometry.source.width/2,-geometry.source.height,geometry.source.width,geometry.source.height);
      ctx.restore();
      // A short contact shadow anchors the stairs, separately from the roof cast.
      ctx.save();ctx.globalAlpha=.13*strength;ctx.fillStyle='#4B3D3B';
      const contactWidth=geometry.source.width*(place.kind==='wedding'?.52:.48);
      ctx.fillRect(Math.round(geometry.x-contactWidth/2),Math.round(geometry.y-1),Math.round(contactWidth),3);
      ctx.globalAlpha=.05*strength;
      ctx.fillRect(Math.round(geometry.x-contactWidth/2)-2,Math.round(geometry.y+2),Math.round(contactWidth)+4,2);
      ctx.restore();
    }
  }}];
}
