import {TILE} from './world.js';
export function drawPlaces(ctx,places,images) {
  for(const p of places){
    const [tx,ty]=p.tile,x=tx*TILE,y=ty*TILE;
    const img=images?.[p.kind];
    if(img){ctx.drawImage(img,x-48,y-64,96,80);continue;}
    ctx.fillStyle='#5A4230';ctx.fillRect(x-50,y+18,100,6);
    ctx.fillStyle=p.kind==='wardrobe'?'#B5656F':'#F3D9B1';ctx.fillRect(x-46,y-38,92,56);
    ctx.fillStyle='#6B4429';ctx.fillRect(x-51,y-42,102,9);
    ctx.fillStyle='#C98F5B';ctx.fillRect(x-38,y-56,76,14);
    ctx.fillStyle='#2E1F18';ctx.fillRect(x-11,y-12,22,30);
    ctx.fillStyle='#F2C46D';ctx.fillRect(x-7,y-7,5,5);
    ctx.fillStyle='#B5656F';ctx.fillRect(x-40,y-31,18,15);ctx.fillRect(x+22,y-31,18,15);
    ctx.fillStyle='#FFF1DC';ctx.font='7px monospace';ctx.textAlign='center';
    const label=p.name.length>22?p.name.slice(0,21)+'…':p.name;
    ctx.fillStyle='#2E1F18';ctx.fillRect(x-59,y-78,118,15);
    ctx.fillStyle='#FFF1DC';ctx.fillText(label,x,y-68,110);
    ctx.fillStyle='#F2C46D';ctx.fillRect(p.arrival[0]*TILE-4,p.arrival[1]*TILE-4,8,8);
  }
}
export function nearestPlace(places,x,y) {
  return places.find(p=>Math.abs(x-p.tile[0]*TILE)<56&&Math.abs(y-(p.tile[1]*TILE-12))<80);
}
