// Pixel geometry shared by the world render, collision map and approach camera.
// The complete illustration replaces the two-part 264px facade at 1.27× width.
export const CASTLE_LAYOUT=Object.freeze({width:336,height:224,baseOffset:12,
  collisionHalfWidth:10,collisionHeight:13,arrivalOffset:3});

export function castleWorldBounds(place){
  const x=place.tile[0]*16,y=place.tile[1]*16;
  return {x:x-CASTLE_LAYOUT.width/2,y:y-CASTLE_LAYOUT.height+CASTLE_LAYOUT.baseOffset,
    width:CASTLE_LAYOUT.width,height:CASTLE_LAYOUT.height};
}

export function castleApproachLift(pair,castle){
  if(!castle)return 0;
  const dx=Math.abs(pair.x-castle.tile[0]);
  const dy=pair.y-castle.arrival[1];
  const horizontal=Math.max(0,Math.min(1,(12-dx)/5));
  const vertical=Math.max(0,Math.min(1,(7-Math.abs(dy))/4));
  return Math.round(125*horizontal*vertical);
}
