import {TILE} from './world.js';
export function createPair(save){return {x:save.position.x,y:save.position.y,direction:save.direction,clock:0,moving:false};}
function person(ctx,x,y,who,direction,clock,assets){
  const isLeo=who==='leo',offset=clock?1:0;
  const image=assets?.[who]?.base;
  if(image){const row=direction==='down'?0:direction==='up'?2:1,col=clock?3:2;ctx.save();if(direction==='left'){ctx.translate(x*2+32,0);ctx.scale(-1,1);}ctx.drawImage(image,col*32,row*48,32,48,direction==='left'?0:x,y+offset,32,48);ctx.restore();return;}
  const skin=isLeo?'#C98F5B':'#D9C2A3',coat=isLeo?'#B5656F':'#2E1F18',hair=isLeo?'#1B120E':'#302020';
  ctx.fillStyle='#2E1F18';ctx.fillRect(x+9,y+39+offset,5,6);ctx.fillRect(x+19,y+39+offset,5,6);
  ctx.fillStyle='#607D91';ctx.fillRect(x+8,y+30+offset,16,10);
  ctx.fillStyle=coat;ctx.fillRect(x+6,y+17+offset,20,15);
  ctx.fillStyle=skin;ctx.fillRect(x+9,y+7+offset,14,12);
  if(!isLeo){ctx.fillStyle=hair;ctx.fillRect(x+7,y+5+offset,3,23);ctx.fillRect(x+22,y+5+offset,3,23);}
  ctx.fillStyle=hair;ctx.fillRect(x+8,y+4+offset,16,isLeo?6:8);
  if(direction!=='up'){ctx.fillStyle='#1B120E';ctx.fillRect(x+10,y+12+offset,5,2);ctx.fillRect(x+18,y+12+offset,5,2);ctx.fillStyle='#FFF1DC';ctx.fillRect(x+12,y+13+offset,1,1);ctx.fillRect(x+20,y+13+offset,1,1);}
  if(direction==='left'||direction==='right'){ctx.fillStyle=skin;ctx.fillRect(x+23,y+24+offset,5,4);}
}
export function drawPair(ctx,pair,assets){
  const sx=Math.round(pair.x*TILE),sy=Math.round(pair.y*TILE),clock=pair.moving?Math.floor(pair.clock/0.14)%2:0;
  ctx.fillStyle='#50644A';ctx.fillRect(sx-13,sy+6,26,5);
  const y=sy-40;
  if(pair.direction==='left'||pair.direction==='right'){
    const sign=pair.direction==='right'?1:-1;
    person(ctx,sx-16-sign*12,y+sign*0,'itza',pair.direction,clock,assets);
    person(ctx,sx-16+sign*12,y,'leo',pair.direction,clock,assets);
    ctx.fillStyle='#D9C2A3';ctx.fillRect(sx-2,sy-17,4,3);
  }else{
    person(ctx,sx-32,y,'leo',pair.direction,clock,assets);
    person(ctx,sx,y,'itza',pair.direction,clock,assets);
    ctx.fillStyle='#D9C2A3';ctx.fillRect(sx-4,sy-17,8,3);
  }
}
