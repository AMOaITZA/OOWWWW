import {TILE} from './world.js';
import {drawBench} from './seating.js';
import {drawWeddingCastle,weddingImage as loadedWeddingImage} from './wedding-assets.js';
import {castleWorldBounds} from './castle-layout.js';
import {placeWorldBounds} from './place-layout.js';
import {createVillagePathLayer} from './village-paths.js';
const imageMasks=new WeakMap();
function opaqueImageHit(image,bounds,x,y){
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  const px=Math.floor((x-bounds.x)*width/bounds.width);
  const py=Math.floor((y-bounds.y)*height/bounds.height);
  if(px<0||py<0||px>=width||py>=height)return false;
  if(image.data)return image.data[(py*width+px)*4+3]>=128;
  if(typeof document==='undefined')return true;
  let mask=imageMasks.get(image);
  if(!mask){
    const sample=document.createElement('canvas');sample.width=width;sample.height=height;
    const context=sample.getContext('2d',{willReadFrequently:true});
    context.drawImage(image,0,0);mask=context.getImageData(0,0,width,height).data;
    imageMasks.set(image,mask);
  }
  return mask[(py*width+px)*4+3]>=128;
}
export function nearestPlace(places,x,y,getPlaceImage=()=>null){
  const illustrated=loadedWeddingImage('castle-v2');
  const castle=places.find(place=>place.kind==='wedding');
  // Painted silhouettes keep transparent corners from stealing ground clicks.
  if(castle&&illustrated&&opaqueImageHit(illustrated,castleWorldBounds(castle),x,y))return castle;
  for(const place of [...places].sort((a,b)=>b.tile[1]-a.tile[1])){
    if(place.kind==='wedding'){
      if(!illustrated&&Math.abs(x-place.tile[0]*TILE)<174&&y>=place.tile[1]*TILE-218&&y<=place.tile[1]*TILE+28)return place;
      continue;
    }
    const image=getPlaceImage(place.id);
    if(image){if(opaqueImageHit(image,placeWorldBounds(place),x,y))return place;}
    else if(Math.abs(x-place.tile[0]*TILE)<76&&Math.abs(y-place.tile[1]*TILE+12)<104)return place;
  }
  return undefined;
}

const roofColor=kind=>kind==='wardrobe'?'#B5656F':kind==='tv'?'#6B4429':kind==='final'?'#E8A0A8':'#A06A3F';
function walls(ctx,x,y){
  ctx.fillStyle='#5A4230';ctx.fillRect(x-46,y+19,92,6);
  ctx.fillStyle='#F3D9B1';ctx.fillRect(x-44,y-38,88,57);
  ctx.fillStyle='#2E1F18';ctx.fillRect(x-11,y-11,22,30);
  ctx.fillStyle='#F2C46D';ctx.fillRect(x+5,y+4,4,4);
  ctx.fillStyle='#B5656F';ctx.fillRect(x-38,y-26,18,15);ctx.fillRect(x+20,y-26,18,15);
}
function roof(ctx,x,y,kind){
  ctx.fillStyle='#6B4429';ctx.fillRect(x-50,y-47,100,12);
  ctx.fillStyle=roofColor(kind);ctx.fillRect(x-39,y-57,78,15);
}
function sign(ctx,x,y,name){
  ctx.fillStyle='#2E1F18';ctx.fillRect(x-59,y-81,118,16);
  ctx.fillStyle='#FFF1DC';ctx.textAlign='center';ctx.font='7px monospace';
  const title=name.length>24?name.slice(0,23)+'…':name;ctx.fillText(title,x,y-70,112);
}
function scenery(ctx,x,y,kind){
  if(kind==='tree'){
    ctx.fillStyle='#6B4429';ctx.fillRect(x-6,y-28,12,29);
    ctx.fillStyle='#426B4C';ctx.fillRect(x-23,y-71,46,36);
    ctx.fillStyle='#527B56';ctx.fillRect(x-18,y-81,36,43);
    ctx.fillStyle='#7D9E69';ctx.fillRect(x-12,y-76,23,16);
  }else if(kind==='rock'){
    ctx.fillStyle='#647B84';ctx.fillRect(x-14,y-17,28,18);ctx.fillStyle='#A7AEB0';ctx.fillRect(x-7,y-20,15,8);
  }else if(kind==='bench'){
    ctx.fillStyle='#6B4429';ctx.fillRect(x-21,y-14,42,8);ctx.fillRect(x-17,y-23,34,7);
    ctx.fillStyle='#2E1F18';ctx.fillRect(x-14,y-6,5,9);ctx.fillRect(x+9,y-6,5,9);
  }else if(kind==='lamp'){
    ctx.fillStyle='#2E1F18';ctx.fillRect(x-3,y-35,6,36);ctx.fillRect(x-9,y-41,18,8);
    ctx.fillStyle='#F2C46D';ctx.fillRect(x-6,y-38,12,6);
  }
}
function drawWorldObject(ctx, obj, image) {
  const x = obj.tile[0] * TILE;
  const y = obj.tile[1] * TILE;

  if (image) {
    if (obj.kind === 'tree') {
      ctx.drawImage(image, x - 32, y - 110, 64, 112);
    } else if (obj.kind === 'bench') {
      drawBench(ctx,image,x,y+1);
    } else if (obj.kind === 'lamp') {
// Escala uniforme 2×; anclaje en el último píxel visible de la base.
      ctx.drawImage(image, x - 48, y - 81, 96, 94);    } else {
      ctx.drawImage(image, x - 24, y - 45, 48, 47);
    }
  } else {
    scenery(ctx, x, y, obj.kind);
  }
}
function weddingCastle(ctx,obj,images){
  const x=obj.tile[0]*TILE,y=obj.tile[1]*TILE;
  const illustrated=images('castle-v2');
  if(illustrated){
    // One complete building: no second roof over the new illustration.
    // The 336×224 box is 1.27× wider than the old 264px facade.
    const bounds=castleWorldBounds(obj);
    ctx.drawImage(illustrated,bounds.x,bounds.y,bounds.width,bounds.height);
  }else{
    const castle=images('castle');
    if(castle)drawWeddingCastle(ctx,castle,images('roof'),x-132,y-152);
    else{
      ctx.fillStyle='#F6DDC7';ctx.fillRect(x-112,y-111,224,100);
      ctx.fillStyle='#C9879C';ctx.fillRect(x-124,y-136,248,27);
      ctx.fillStyle='#A76972';ctx.fillRect(x-19,y-62,38,51);
    }
  }
}
function weddingGarden(ctx,obj,images){
  const x=obj.tile[0]*TILE,y=obj.tile[1]*TILE;
  // A shared warm stone landing joins the garden, steps and arrival point.
  ctx.fillStyle='#B9AA83';ctx.fillRect(x-38,y+1,76,4);
  ctx.fillStyle='#DBC7A0';ctx.fillRect(x-32,y+4,64,56);
  ctx.fillStyle='#F0D8B0';ctx.fillRect(x-29,y+5,58,2);
  ctx.fillStyle='#C1AC8B';
  for(let row=0;row<4;row++)ctx.fillRect(x-28,y+16+row*13,56,1);
  // Low rose beds frame a clear approach instead of blocking the door.
  for(const side of [-1,1]){
    const at=x+side*67;
    ctx.fillStyle='#71875D';ctx.fillRect(at-21,y+18,42,9);
    ctx.fillStyle='#8B9D6B';ctx.fillRect(at-18,y+13,36,9);
    for(let n=0;n<5;n++){
      const fx=at-15+n*7,fy=y+12+(n%2)*4;
      ctx.fillStyle=n%2?'#C88A96':'#E8A9AF';ctx.fillRect(fx,fy,4,3);
      ctx.fillStyle='#F7D8BD';ctx.fillRect(fx+1,fy,1,1);
    }
    ctx.fillStyle='#A48B67';ctx.fillRect(at-23,y+27,46,3);
  }
  for(let n=0;n<16;n++){
    ctx.fillStyle=n%2?'#E3A5AD':'#F2D7B6';
    ctx.fillRect(x-24+(n*19)%48,y+20+(n*11)%40,2,1);
  }
  // Keep the entrance mark visible without painting a second doorway.
  const [ax,ay]=obj.arrival;
  ctx.fillStyle='#7A5B51';ctx.fillRect(ax*TILE-5,ay*TILE+6,10,3);
  ctx.fillStyle='#F2C46D';ctx.fillRect(ax*TILE-2,ay*TILE+5,4,2);
}
function architectureGarden(ctx,obj){
  const x=obj.tile[0]*TILE,y=obj.tile[1]*TILE;
  // The narrow landing connects the illustrated stairs to the unchanged
  // arrival tile. Draw it as ground, never over the protagonists' faces.
  ctx.fillStyle='#B4A17D';ctx.fillRect(x-55,y+12,110,7);
  ctx.fillStyle='#E4D4B4';ctx.fillRect(x-22,y+11,44,57);
  ctx.fillStyle='#F5E7C9';ctx.fillRect(x-20,y+12,40,2);
  ctx.fillStyle='#CDBB98';
  for(let row=0;row<4;row++){
    ctx.fillRect(x-20,y+26+row*13,40,1);
    ctx.fillRect(x+(row%2?-10:9),y+14+row*13,1,11);
  }
  for(const side of [-1,1]){
    const at=x+side*57;
    ctx.fillStyle='#789268';ctx.fillRect(at-13,y+29,26,6);
    for(let n=0;n<4;n++){
      const fx=at-10+n*6,fy=y+25+(n%2)*3;
      ctx.fillStyle=n%2?'#E9BAC0':'#F4E1BD';ctx.fillRect(fx,fy,3,3);
      ctx.fillStyle='#B77E8B';ctx.fillRect(fx+1,fy+1,1,1);
    }
  }
}
function completeArchitecture(ctx,obj,image){
  const b=placeWorldBounds(obj);
  ctx.drawImage(image,b.x,b.y,b.width,b.height);
  // Small cream nameplates remain above the complete roof; the approach
  // camera creates room without adding an opaque bar across the artwork.
  const title=obj.name.length>24?obj.name.slice(0,23)+'…':obj.name;
  const width=Math.max(54,Math.min(146,title.length*4.2+14));
  const x=Math.round(obj.tile[0]*TILE-width/2),y=b.y-15;
  ctx.fillStyle='#88654F';ctx.fillRect(x-1,y-1,width+2,13);
  ctx.fillStyle='#FFF1DC';ctx.fillRect(x,y,width,11);
  ctx.fillStyle='#684C40';ctx.textAlign='center';ctx.font='7px monospace';
  ctx.fillText(title,obj.tile[0]*TILE,y+8,width-10);
}
function placeBase(ctx,obj,image){
  const x=obj.tile[0]*TILE,y=obj.tile[1]*TILE;
  if(image)ctx.drawImage(image,x-72,y-60,144,85);
  else walls(ctx,x,y);
}
function placeOverlays(ctx,obj,roofImage,awningImage){
  const x=obj.tile[0]*TILE,y=obj.tile[1]*TILE;
  if(roofImage)ctx.drawImage(roofImage,x-76,y-90,152,34);
  else roof(ctx,x,y,obj.kind);
  if(awningImage)ctx.drawImage(awningImage,x-20,y-41,40,24);
  sign(ctx,x,y,obj.name);
  const [ax,ay]=obj.arrival;
  ctx.fillStyle='#2E1F18';ctx.fillRect(ax*TILE-5,ay*TILE-5,10,10);
  ctx.fillStyle='#F2C46D';ctx.fillRect(ax*TILE-3,ay*TILE-3,6,6);
}
export function sceneObjects(places,decor,objectImage,momentImage=()=>null,weddingImage=()=>null,hideBench=()=>false,placeImage=()=>null){
  const paths=createVillagePathLayer(places);
  return [
    ...(paths?[{z:-1,draw:ctx=>paths.draw(ctx)}]:[]),
    ...decor.map(obj=>({z:obj.tile[1]*TILE,draw(ctx){
      // Seating uses independent outfit sprites; the bench remains a scenery
      // layer. The optional callback is retained for existing callers.
      if(obj.kind==='bench'&&hideBench(obj.tile))return;
      drawWorldObject(ctx,obj,obj.kind==='bench'?(momentImage('benchSeat')||objectImage('bench')):objectImage(obj.kind));
    }})),
    ...places.flatMap(obj=>obj.kind==='wedding'
      ? [
        {z:0,draw:ctx=>weddingGarden(ctx,obj,weddingImage)},
        {z:obj.tile[1]*TILE+13,draw:ctx=>weddingCastle(ctx,obj,weddingImage)}
      ]
      : [
        {z:0,draw(ctx){if(placeImage(obj.id))architectureGarden(ctx,obj);}},
        {z:obj.tile[1]*TILE+24,draw(ctx){
          const image=placeImage(obj.id);
          if(image)completeArchitecture(ctx,obj,image);
          else{placeBase(ctx,obj,objectImage(obj.kind));placeOverlays(ctx,obj,objectImage('roof'),objectImage('awning'));}
        }}
      ]),
  ];
}
