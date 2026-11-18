import {POND_LAYOUT} from './pond-geometry.js';

// Slow local changes keep the meadow calm: the sky itself never flickers.
export function lampGlowAt(time,index,reducedMotion=false){
  return reducedMotion ? .9 : .86+.14*Math.sin(time*.72+index*1.9);
}

export const FIREFLY_COUNT=36;
const pondLights=[[-62,-12],[64,5],[-40,78],[38,-8],[80,63],[-12,88],[-78,44],[52,88]];
export function fireflyAt(index,time,reducedMotion=false){
  const local=pondLights[index];
  const anchorX=local?POND_LAYOUT.x+POND_LAYOUT.width/2+local[0]:40+(index*487)%1830;
  const anchorY=local?POND_LAYOUT.y+local[1]:90+(index*229)%1090;
  const t=reducedMotion?0:time;
  return {x:Math.round(anchorX+(reducedMotion?0:Math.sin(t*.43+index*2.1)*5)),
    y:Math.round(anchorY+(reducedMotion?0:Math.sin(t*.57+index*1.7)*3)),
    alpha:reducedMotion ? .5 : .43+.17*Math.sin(t*.9+index*2.1)};
}
