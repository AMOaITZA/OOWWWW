import {COAST_LAYOUT} from './coast-layout.js';
// Both destinations are physical places on the new southern coast.
export const TRAVEL_SPOTS=Object.freeze([
  {id:'mirador',name:'Orilla de los deseos',kind:'lakeside',tile:[...COAST_LAYOUT.shoreArrival],arrival:[...COAST_LAYOUT.shoreArrival]},
  {id:'hawai',name:'Viaje a Hawái',kind:'travel',tile:[24,90],arrival:[...COAST_LAYOUT.hawaiiArrival]}
]);
export const isTravelSpot=spot=>TRAVEL_SPOTS.some(item=>item.id===spot?.id);
export function travelAt(x,y){
  const harbor=COAST_LAYOUT.harbor;
  if(x>=harbor.x&&x<=harbor.x+harbor.width&&y>=harbor.y&&y<=harbor.y+harbor.height)return TRAVEL_SPOTS[1];
  const [sx,sy]=COAST_LAYOUT.shoreArrival;
  return Math.abs(x-sx*16)<=53&&y>=sy*16-27&&y<=sy*16+25?TRAVEL_SPOTS[0]:null;
}
export function travelScenery(getImage=()=>null){
  const b=COAST_LAYOUT.harbor;
  return [{z:COAST_LAYOUT.terminal.y+COAST_LAYOUT.terminal.height,draw:ctx=>{
    const image=getImage('/assets/game/coast/harbor.png');
    if(image)ctx.drawImage(image,b.x,b.y,b.width,b.height);
  }}];
}
