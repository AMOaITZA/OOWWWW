// Geometry is shared by the world collision grid, scenery and overview map.
// The original 120 × 80 village stays at its original coordinates.
export const COAST_LAYOUT=Object.freeze({
  strip:Object.freeze({x:0,y:1280,width:1920,height:512}),
  tileStart:80,
  grassEndY:1470,
  seaY:1540,
  harbor:Object.freeze({x:250,y:1380,width:256,height:256}),
  terminal:Object.freeze({x:300,y:1390,width:140,height:85}),
  pier:Object.freeze({x:330,y:1510,width:100,height:130}),
  hawaiiArrival:Object.freeze([24,94]),
  shoreArrival:Object.freeze([78,94])
});
const TILE=16;
const validTile=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<120&&y<112;
const touches=(left,top,right,bottom,box)=>right>box.x&&left<box.x+box.width&&
  bottom>box.y&&top<box.y+box.height;
function insidePier(x,y){
  const b=COAST_LAYOUT.pier;
  return x-8>=b.x&&x+8<=b.x+b.width&&y-8>=b.y&&y+8<=b.y+b.height;
}

// Tile coordinates. The sixteen-pixel footprint prevents feet crossing the
// shoreline; the wooden pier provides the only walkable route over the sea.
export function coastTileBlocked(x,y){
  if(!validTile(x,y))return true;
  if(y<COAST_LAYOUT.tileStart)return false;
  const px=x*TILE,py=y*TILE;
  if(touches(px-8,py-8,px+8,py+8,COAST_LAYOUT.terminal))return true;
  return py+8>COAST_LAYOUT.seaY&&!insidePier(px,py);
}
export function coastTileType(x,y){
  if(!validTile(x,y)||y<COAST_LAYOUT.tileStart)return null;
  const px=x*TILE,py=y*TILE;
  if(insidePier(px,py))return 'pier';
  if(py+8>COAST_LAYOUT.seaY)return 'water';
  if(py>=COAST_LAYOUT.grassEndY)return 'sand';
  return 'grass';
}
export const onCoast=(x,y)=>validTile(x,y)&&y>=COAST_LAYOUT.tileStart;
