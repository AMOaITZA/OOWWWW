// Entrances stay in the village; their experiences own a separate scene/map.
export const TRAVEL_SPOTS=Object.freeze([
  {id:'mirador',name:'Orilla de los deseos',kind:'lakeside',tile:[58,30],arrival:[58,34]},
  {id:'hawai',name:'Viaje a Hawái',kind:'travel',tile:[76,39],arrival:[76,42]}
]);
export const isTravelSpot=spot=>TRAVEL_SPOTS.some(item=>item.id===spot?.id);
export function travelAt(x,y){
  return TRAVEL_SPOTS.find(spot=>Math.abs(x-spot.tile[0]*16)<=24&&
    y>=spot.tile[1]*16-25&&y<=spot.tile[1]*16+13)||null;
}
export function travelScenery(){
  return TRAVEL_SPOTS.map(spot=>({z:spot.tile[1]*16+12,draw:ctx=>{
    const x=spot.tile[0]*16,y=spot.tile[1]*16;
    ctx.save();
    ctx.fillStyle='#493E3540';ctx.fillRect(x-22,y+9,45,4);
    ctx.fillStyle='#694D3A';ctx.fillRect(x-2,y-5,5,17);
    ctx.fillStyle='#806048';ctx.fillRect(x-25,y-23,51,22);
    ctx.fillStyle=spot.id==='hawai'?'#D1E4D6':'#DDD8E8';ctx.fillRect(x-23,y-21,47,18);
    ctx.fillStyle=spot.id==='hawai'?'#476F67':'#6B607C';
    ctx.font="7px 'Silkscreen', monospace";ctx.textAlign='center';
    ctx.fillText(spot.id==='hawai'?'HAWÁI':'MIRADOR',x,y-9);
    ctx.fillStyle='#E7C47F';ctx.fillRect(x-26,y-20,2,15);ctx.fillRect(x+25,y-20,2,15);
    ctx.restore();
  }}));
}
