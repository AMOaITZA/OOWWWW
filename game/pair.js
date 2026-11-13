import {TILE} from './world.js';
import {getSelectedLook} from './wardrobe.js';

export const createPair=save=>({
  x:save.position.x,y:save.position.y,
  direction:save.direction,clock:0,moving:false,walkClock:0,idleClock:0,wasMoving:false
});
export function advancePairAnimation(pair,dt){
  if(pair.moving){
    pair.walkClock=pair.wasMoving?(pair.walkClock??0)+dt:0;
    pair.idleClock=0;
  }else{
    pair.idleClock=pair.wasMoving?0:(pair.idleClock??0)+dt;
    pair.walkClock=0;
  }
  pair.wasMoving=pair.moving;
}
const rowOf={down:0,right:1,left:1,up:2};
function drawPlaceholder(ctx,who,direction,frame){
  const leo=who==='leo',skin=leo?'#C98F5B':'#D9C2A3';
  const step=frame>=2&&frame%2?2:0;
  // Respaldo pixelado cuando aún no se hayan copiado los PNG completos.
  ctx.fillStyle='#2E1F18';ctx.fillRect(8,42-step,6,5);ctx.fillRect(19,42,6,5);
  ctx.fillStyle=leo?'#252B35':'#607D91';ctx.fillRect(7,29,18,13);
  ctx.fillStyle=leo?'#7C243A':'#29242F';ctx.fillRect(6,17,20,14);
  ctx.fillStyle=skin;ctx.fillRect(4,20,3,10);ctx.fillRect(25,20,3,10);
  ctx.fillRect(9,8,14,12);
  ctx.fillStyle='#1B120E';
  if(leo){ctx.fillRect(7,4,18,7);}
  else{ctx.fillRect(7,4,18,7);ctx.fillRect(6,9,4,23);ctx.fillRect(22,9,4,23);}
  if(direction!=='up'){
    ctx.fillStyle='#1B120E';
    ctx.fillRect(9,13,6,3);ctx.fillRect(17,13,6,3);ctx.fillRect(15,13,2,1);
    ctx.fillStyle='#FFF1DC';ctx.fillRect(11,14,2,1);ctx.fillRect(19,14,2,1);
  }
}
export function drawCharacter(ctx,x,y,who,direction,frame,getImage,outfits){
  const sheet=getImage(getSelectedLook(outfits,who,url=>Boolean(getImage(url)))?.sheet);
  const row=rowOf[direction]??0;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  if(direction==='left'){ctx.translate(32,0);ctx.scale(-1,1);}
  if(sheet)ctx.drawImage(sheet,frame*32,row*48,32,48,0,0,32,48);
  else drawPlaceholder(ctx,who,direction,frame);
  ctx.restore();
}
export function drawPair(ctx,pair,getImage,outfits){
  const sx=Math.round(pair.x*TILE),sy=Math.round(pair.y*TILE);
  // Un reloj para ambos: andar sincronizado aun con atuendos diferentes.
  const frame=pair.moving?2+Math.floor((pair.walkClock??pair.clock)/0.13)%4:Math.floor((pair.idleClock??pair.clock)/1.4)%2;
  ctx.fillStyle='#527B56';ctx.fillRect(sx-22,sy-2,44,5);
  const y=sy-46;
  if(pair.direction==='up'||pair.direction==='down'){
    drawCharacter(ctx,sx-32,y,'leo',pair.direction,frame,getImage,outfits);
    drawCharacter(ctx,sx,y,'itza',pair.direction,frame,getImage,outfits);
    ctx.fillStyle='#D9C2A3';ctx.fillRect(sx-4,sy-20,8,3);
  }else{
    const leoX=pair.direction==='right'?sx:sx-32;
    const itzaX=pair.direction==='right'?sx-24:sx-8;
    drawCharacter(ctx,itzaX,y,'itza',pair.direction,frame,getImage,outfits);
    drawCharacter(ctx,leoX,y,'leo',pair.direction,frame,getImage,outfits);
    ctx.fillStyle='#D9C2A3';ctx.fillRect(sx-3,sy-20,6,3);
  }
}
