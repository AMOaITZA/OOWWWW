import {PONYO_SPOT,PONYO_LINE} from './finale-spots.js';

export function createPonyo({getImage,getUnlocked,onPet=()=>{}}){
  let clock=0,affection=0,reduced=false;
  function hit(x,y){
    return getUnlocked()&&Math.abs(x-PONYO_SPOT.tile[0]*16)<=18&&
      y>=PONYO_SPOT.tile[1]*16-35&&y<=PONYO_SPOT.tile[1]*16+5;
  }
  function arrive(){
    if(!getUnlocked())return false;
    affection=3;onPet(PONYO_LINE);return true;
  }
  function tick(dt,{active=true,dialogsOpen=false,reducedMotion=false}={}){
    reduced=reducedMotion;
    if(!active||dialogsOpen)return;
    if(!reduced)clock+=dt;
    affection=Math.max(0,affection-dt);
  }
  function scenery(){
    if(!getUnlocked())return [];
    return [{z:PONYO_SPOT.tile[1]*16+1,draw(ctx){
      const image=getImage();if(!image)return;
      const x=PONYO_SPOT.tile[0]*16,y=PONYO_SPOT.tile[1]*16;
      const frame=affection>0||(!reduced&&clock%4.8>4.45)?1:0;
      ctx.drawImage(image,frame*32,0,32,32,x-16,y-31,32,32);
      if(affection>0){
        const lift=reduced?0:Math.floor((3-affection)*3);
        ctx.fillStyle='#ECA5B8';
        ctx.fillRect(x-4,y-40-lift,3,3);ctx.fillRect(x+1,y-40-lift,3,3);
        ctx.fillRect(x-3,y-38-lift,6,3);ctx.fillRect(x-1,y-35-lift,2,2);
      }
    }}];
  }
  return {hit,arrive,tick,scenery,isSpot:spot=>spot?.id===PONYO_SPOT.id,
    bounds:()=>getUnlocked()?[{id:'ponyo',x:PONYO_SPOT.tile[0]*16-16,
      y:PONYO_SPOT.tile[1]*16-34,width:32,height:37}]:[]};
}
