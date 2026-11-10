import {TILE} from './world.js';
import {getItem} from './wardrobe.js';
import {baseImage} from './assets.js';
export const createPair=save=>({x:save.position.x,y:save.position.y,direction:save.direction,clock:0,moving:false});
const rowOf={down:0,right:1,left:1,up:2};
function drawSheet(ctx,image,frame,row){if(image)ctx.drawImage(image,frame*32,row*48,32,48,0,0,32,48);}
function bodyPlaceholder(ctx,who,look,frame){
  const isLeo=who==='leo',skin=isLeo?'#C98F5B':'#D9C2A3';
  const shoes=look.shoes?.color??'#2E1F18',bottom=look.bottom?.color??'#607D91',top=look.top?.color??'#F3D9B1';
  const step=(frame>=2&&frame%2===1)?2:0;
  ctx.fillStyle=shoes;ctx.fillRect(8,42,6,5);ctx.fillRect(19,42-step,6,5);
  ctx.fillStyle=bottom;ctx.fillRect(7,29,18,13);
  ctx.fillStyle=top;ctx.fillRect(6,17,20,14);
  ctx.fillStyle=skin;ctx.fillRect(4,20,3,11);ctx.fillRect(25,20,3,11);
  ctx.fillRect(9,8,14,12);ctx.fillStyle='#C98F5B';ctx.fillRect(11,15,10,3);
}
function hairPlaceholder(ctx,item,who){
  if(!item)return;
  ctx.fillStyle=item.color||'#1B120E';
  if(who==='itza'){ctx.fillRect(7,4,18,7);ctx.fillRect(6,9,4,23);ctx.fillRect(22,9,4,23);}
  else{ctx.fillRect(7,4,18,8);ctx.fillRect(8,9,3,3);}
}
function glassesPlaceholder(ctx,item,direction){
  if(!item||direction==='up')return;
  ctx.fillStyle=item.color||'#1B120E';
  ctx.fillRect(9,13,6,3);ctx.fillRect(17,13,6,3);ctx.fillRect(15,13,2,1);
  ctx.fillStyle='#FFF1DC';ctx.fillRect(11,14,2,1);ctx.fillRect(19,14,2,1);
}
export function drawCharacter(ctx,x,y,who,direction,frame,getImage,outfits){
  const look={};for(const slot of ['hair','top','bottom','shoes','accessories'])look[slot]=getItem(outfits,who,slot);
  const base=baseImage(who),row=rowOf[direction]??0;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  if(direction==='left'){ctx.translate(32,0);ctx.scale(-1,1);}
  // Todas las hojas utilizan 192×144, frames 32×48, la misma coordenada y reloj.
  drawSheet(ctx,getImage(look.hair?.back),frame,row);
  if(base)drawSheet(ctx,base,frame,row);
  else bodyPlaceholder(ctx,who,look,frame);
  for(const slot of ['bottom','shoes','top'])drawSheet(ctx,getImage(look[slot]?.sprite),frame,row);
  if(look.hair&&!getImage(look.hair.front)&&!base)hairPlaceholder(ctx,look.hair,who);
  drawSheet(ctx,getImage(look.hair?.front),frame,row);
  if(look.accessories&&!getImage(look.accessories.sprite)&&!base)glassesPlaceholder(ctx,look.accessories,direction);
  drawSheet(ctx,getImage(look.accessories?.sprite),frame,row);
  ctx.restore();
}
export function drawPair(ctx,pair,getImage,outfits){
  const sx=Math.round(pair.x*TILE),sy=Math.round(pair.y*TILE);
  const frame=pair.moving?2+Math.floor(pair.clock/0.13)%4:Math.floor(pair.clock/1.4)%2;
  ctx.fillStyle='#527B56';ctx.fillRect(sx-22,sy-2,44,5);
  const y=sy-46;
  if(pair.direction==='up'||pair.direction==='down'){
    drawCharacter(ctx,sx-32,y,'leo',pair.direction,frame,getImage,outfits);
    drawCharacter(ctx,sx,y,'itza',pair.direction,frame,getImage,outfits);
    ctx.fillStyle='#D9C2A3';ctx.fillRect(sx-4,sy-20,8,3);
  }else{
    // Leo lleva la dirección de marcha e Itza va detrás. La entidad conserva una huella.
    const leoX=pair.direction==='right'?sx:sx-32;
    const itzaX=pair.direction==='right'?sx-24:sx-8;
    drawCharacter(ctx,itzaX,y,'itza',pair.direction,frame,getImage,outfits);
    drawCharacter(ctx,leoX,y,'leo',pair.direction,frame,getImage,outfits);
    ctx.fillStyle='#D9C2A3';ctx.fillRect(sx-3,sy-20,6,3);
  }
}
