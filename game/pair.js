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
export function drawCharacter(ctx,x,y,who,direction,frame,getImage,outfits){
  const sheet=getImage(getSelectedLook(outfits,who,url=>Boolean(getImage(url)))?.sheet);
  if(!sheet)return; // Loading/error status is handled by the UI, without old substitute art.
  const row=rowOf[direction]??0;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  if(direction==='left'){ctx.translate(32,0);ctx.scale(-1,1);}
  ctx.drawImage(sheet,frame*32,row*48,32,48,0,0,32,48);
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
  }else{
    const leoX=pair.direction==='right'?sx:sx-32;
    const itzaX=pair.direction==='right'?sx-24:sx-8;
    drawCharacter(ctx,itzaX,y,'itza',pair.direction,frame,getImage,outfits);
    drawCharacter(ctx,leoX,y,'leo',pair.direction,frame,getImage,outfits);
  }
}
