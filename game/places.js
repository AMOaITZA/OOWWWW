import {TILE} from './world.js';
export function nearestPlace(places,x,y){
  return places.find(p=>p.kind==='wedding' ? Math.abs(x-p.tile[0]*TILE)<138&&y>=p.tile[1]*TILE-170&&y<=p.tile[1]*TILE+22 : Math.abs(x-p.tile[0]*TILE)<76&&Math.abs(y-p.tile[1]*TILE+12)<104);
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
      ctx.drawImage(image, x - 36, y - 51, 72, 52);
    } else if (obj.kind === 'lamp') {
ctx.drawImage(image, x - 22, y - 94, 50, 100);    } else {
      ctx.drawImage(image, x - 24, y - 45, 48, 47);
    }
  } else {
    scenery(ctx, x, y, obj.kind);
  }
}
function weddingCastle(ctx,obj,images){
  const x=obj.tile[0]*TILE,y=obj.tile[1]*TILE;
  const castle=images('castle');
  if(castle)ctx.drawImage(castle,x-132,y-152,264,154);
  else{
    ctx.fillStyle='#F6DDC7';ctx.fillRect(x-112,y-111,224,100);
    ctx.fillStyle='#C9879C';ctx.fillRect(x-124,y-136,248,27);
    for(const bx of [x-121,x+88]){
      ctx.fillStyle='#F6DDC7';ctx.fillRect(bx,y-136,33,121);
      ctx.fillStyle='#B5656F';ctx.fillRect(bx-8,y-148,49,15);
      ctx.fillStyle='#FFF0D1';ctx.fillRect(bx+11,y-105,10,35);
    }
    ctx.fillStyle='#A76972';ctx.fillRect(x-19,y-62,38,51);
    ctx.fillStyle='#F7C77A';ctx.fillRect(x-12,y-56,24,45);
  }
  ctx.fillStyle='#FFF1DC';ctx.fillRect(x-7,y+1,14,7);
  ctx.fillStyle='#B5656F';ctx.fillRect(x-4,y+3,8,4);
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
export function sceneObjects(places,decor,objectImage,momentImage=()=>null,weddingImage=()=>null){
  return [
    ...decor.map(obj=>({z:obj.tile[1]*TILE,draw:ctx=>drawWorldObject(ctx,obj,obj.kind==='bench'?(momentImage('benchSeat')||objectImage('bench')):objectImage(obj.kind))})),
    ...places.flatMap(obj=>obj.kind==='wedding'
      ? [{z:(obj.tile[1]+1)*TILE,draw:ctx=>weddingCastle(ctx,obj,weddingImage)}]
      : [
        {z:obj.tile[1]*TILE,draw:ctx=>placeBase(ctx,obj,objectImage(obj.kind))},
        {z:(obj.tile[1]+2)*TILE,draw:ctx=>placeOverlays(ctx,obj,objectImage('roof'),objectImage('awning'))}
      ]),
  ];
}
