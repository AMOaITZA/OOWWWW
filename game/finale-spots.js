import {POND_LAYOUT} from './pond-geometry.js';

export const FISHING_SPOT=Object.freeze({id:'pesca',name:'Lago de los peluches',kind:'fishing',
  tile:[50,30],arrival:[50,34]});
export const PONYO_SPOT=Object.freeze({id:'ponyo',name:'Ponyo',kind:'ponyo',
  tile:[71,47],arrival:[71,50]});
export const PONYO_LINE='ponyo ponyo que divertida es';
export const FISHING_SIGN=Object.freeze({x:859,y:502,width:42,height:32});
export function fishingAt(x,y){
  return (x>=POND_LAYOUT.x&&x<=POND_LAYOUT.x+POND_LAYOUT.width&&
    y>=POND_LAYOUT.y&&y<=POND_LAYOUT.y+POND_LAYOUT.height)||
    (x>=FISHING_SIGN.x&&x<=FISHING_SIGN.x+FISHING_SIGN.width&&
      y>=FISHING_SIGN.y&&y<=FISHING_SIGN.y+FISHING_SIGN.height);
}
export function drawFishingSign(ctx){
  const {x,y,width}=FISHING_SIGN;
  ctx.fillStyle='#634B37';ctx.fillRect(x+18,y+14,5,18);
  ctx.fillStyle='#785740';ctx.fillRect(x,y,width,18);
  ctx.fillStyle='#F4DCB9';ctx.fillRect(x+2,y+2,width-4,14);
  ctx.fillStyle='#624B40';ctx.font='6px monospace';ctx.textAlign='center';
  ctx.fillText('PESCAR',x+width/2,y+11);
}
