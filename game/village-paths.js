import {TILE,WIDTH,HEIGHT,closestWalkable,findPath} from './world.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const onMainRoad=(x,y)=>(y>=36&&y<=42&&x>10&&x<101)||(x>=59&&x<=65&&y>19&&y<65);

// Real navigation routes avoid foundations, benches and cats. Baking their
// stone surface once keeps the village connected without per-frame tile work.
export function villagePathTiles(places){
  const tiles=new Map();
  for(const place of places){
    if(place.kind==='wedding')continue;
    const start={x:place.arrival[0],y:place.arrival[1]};
    const candidates=[closestWalkable(clamp(start.x,11,100),39),closestWalkable(62,clamp(start.y,20,64))].filter(Boolean);
    const routes=candidates.map(goal=>findPath(start,goal)).filter(route=>route.length);
    if(!routes.length)continue;
    const route=routes.sort((a,b)=>a.length-b.length)[0];
    for(const tile of [start,...route])if(!onMainRoad(tile.x,tile.y))tiles.set(tile.x+','+tile.y,tile);
  }
  return [...tiles.values()];
}

export function createVillagePathLayer(places){
  if(typeof document==='undefined')return null;
  const tiles=villagePathTiles(places);if(!tiles.length)return null;
  const margin=24;
  const x=Math.max(0,Math.min(...tiles.map(tile=>tile.x*TILE))-margin);
  const y=Math.max(0,Math.min(...tiles.map(tile=>tile.y*TILE))-margin);
  const right=Math.min(WIDTH*TILE,Math.max(...tiles.map(tile=>tile.x*TILE))+margin);
  const bottom=Math.min(HEIGHT*TILE,Math.max(...tiles.map(tile=>tile.y*TILE))+margin);
  const canvas=document.createElement('canvas');canvas.width=right-x;canvas.height=bottom-y;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const stone=(left,top,width,height,color)=>{
    // Leave grass between the irregular stones instead of laying a solid
    // rectangular strip over the illustrated meadow.
    ctx.fillStyle='#B7AE87';
    ctx.fillRect(left+1,top,width-2,height);ctx.fillRect(left,top+1,width,height-2);
    ctx.fillStyle=color;ctx.fillRect(left+1,top,width-2,height-1);
    ctx.fillStyle='#F0E1BD';ctx.fillRect(left+2,top,width-4,1);
  };
  for(const tile of tiles){
    const px=tile.x*TILE-x,py=tile.y*TILE-y,n=(tile.x*29+tile.y*17)%7;
    const shift=n%3-1;
    stone(px-8+shift,py-7,10+(n%2),7,'#DCCCA7');
    stone(px+2,py+2+shift,9,6,'#E7D8B6');
    if(n!==2)stone(px-11,py+5,6,4,'#D2C39B');
    if(n===0){
      ctx.fillStyle='#8EA06C';ctx.fillRect(px+15,py-4,3,3);
      ctx.fillStyle='#E7C4B0';ctx.fillRect(px+16,py-5,2,2);
    }
  }
  return {draw(context){context.drawImage(canvas,x,y);}};
}
