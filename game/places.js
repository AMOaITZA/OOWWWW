import {TILE} from './world.js';
export function nearestPlace(places,x,y){
  return places.find(p=>Math.abs(x-p.tile[0]*TILE)<55&&Math.abs(y-p.tile[1]*TILE+12)<78);
}
function house(ctx,x,y,kind,name){
  const roof=kind==='wardrobe'?'#B5656F':kind==='tv'?'#6B4429':kind==='final'?'#E8A0A8':'#A06A3F';
  ctx.fillStyle='#5A4230';ctx.fillRect(x-46,y+19,92,6);
  ctx.fillStyle='#F3D9B1';ctx.fillRect(x-44,y-38,88,57);
  ctx.fillStyle='#6B4429';ctx.fillRect(x-50,y-47,100,12);
  ctx.fillStyle=roof;ctx.fillRect(x-39,y-57,78,15);
  ctx.fillStyle='#2E1F18';ctx.fillRect(x-11,y-11,22,30);
  ctx.fillStyle='#F2C46D';ctx.fillRect(x+5,y+4,4,4);
  ctx.fillStyle='#B5656F';ctx.fillRect(x-38,y-26,18,15);ctx.fillRect(x+20,y-26,18,15);
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
export function drawObject(ctx,obj,image,place=false){
  const x=obj.tile[0]*TILE,y=obj.tile[1]*TILE;
  if(image){
    if(place)ctx.drawImage(image,x-48,y-60,96,85);
    else if(obj.kind==='tree')ctx.drawImage(image,x-24,y-82,48,84);
    else ctx.drawImage(image,x-24,y-45,48,47);
  }else if(place)house(ctx,x,y,obj.kind,obj.name);
  else scenery(ctx,x,y,obj.kind);
  if(place){
    const [ax,ay]=obj.arrival;
    ctx.fillStyle='#2E1F18';ctx.fillRect(ax*TILE-5,ay*TILE-5,10,10);
    ctx.fillStyle='#F2C46D';ctx.fillRect(ax*TILE-3,ay*TILE-3,6,6);
  }
}
export function sceneObjects(places,decor,objectImage){
  return [
    ...decor.map(obj=>({z:obj.tile[1]*TILE,draw:ctx=>drawObject(ctx,obj,objectImage(obj.kind))})),
    ...places.map(obj=>({z:(obj.tile[1]+2)*TILE,draw:ctx=>drawObject(ctx,obj,objectImage(obj.kind),true)})),
  ];
}
