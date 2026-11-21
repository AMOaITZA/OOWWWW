// Decorative garden pond. Geometry is shared by its art, paths and overview.
export const POND_LAYOUT=Object.freeze({x:728,y:422,width:144,height:96,
  centerX:800,centerY:479,radiusX:65,radiusY:34});

// A route cell is blocked whenever its footprint touches the pond's bank.
// This keeps feet out of the water instead of testing just a cell's center.
export function pondTileBlocked(x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y))return false;
  const dx=Math.max(0,Math.abs(x*16-POND_LAYOUT.centerX)-8)/POND_LAYOUT.radiusX;
  const dy=Math.max(0,Math.abs(y*16-POND_LAYOUT.centerY)-8)/POND_LAYOUT.radiusY;
  return dx*dx+dy*dy<=1;
}
