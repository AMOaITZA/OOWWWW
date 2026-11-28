// Complete architecture shares a logical cell, while each painted silhouette
// keeps its own roof, entrance and decorative details inside that cell.
export const PLACE_LAYOUT=Object.freeze({width:160,height:128,baseOffset:20,
  collisionHalfWidth:6,collisionHeight:3,approachLift:64});
export function placeWorldBounds(place){
  return {x:place.tile[0]*16-PLACE_LAYOUT.width/2,
    y:place.tile[1]*16-PLACE_LAYOUT.height+PLACE_LAYOUT.baseOffset,
    width:PLACE_LAYOUT.width,height:PLACE_LAYOUT.height};
}
export function placeApproachLift(pair,places){
  let lift=0;
  for(const place of places){
    if(place.kind==='wedding')continue;
    const dx=Math.abs(pair.x-place.arrival[0]),dy=Math.abs(pair.y-place.arrival[1]);
    const horizontal=Math.max(0,Math.min(1,(7-dx)/4));
    const vertical=Math.max(0,Math.min(1,(5-dy)/4));
    lift=Math.max(lift,horizontal*vertical*PLACE_LAYOUT.approachLift);
  }
  return Math.round(lift);
}
