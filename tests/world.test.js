import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initWorld,walkable,closestWalkable,findPath,WIDTH,HEIGHT,TILE} from '../game/world.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const places=read('game/data/places.json'),decor=read('game/data/decor.json');
initWorld(places,decor);
test('world dimensions and spawn',()=>{assert.equal(WIDTH*TILE,1920);assert.equal(HEIGHT*TILE,1280);assert.ok(walkable(30,25));});
test('landmarks and scenery block traversal but arrival tiles remain free',()=>{
  for(const p of places){assert.ok(!walkable(p.tile[0],p.tile[1]),p.id);assert.ok(walkable(...p.arrival),p.id);}
  assert.ok(!walkable(20,14));assert.ok(walkable(30,25));
});
test('A* walks to landmarks with adjacent collision-safe steps',()=>{
  for(const place of places){
    const start={x:30,y:25},route=findPath(start,{x:place.arrival[0],y:place.arrival[1]});
    assert.ok(route.length>0,place.id);
    let last=start;
    for(const tile of route){assert.ok(walkable(tile.x,tile.y));assert.equal(Math.abs(last.x-tile.x)+Math.abs(last.y-tile.y),1);last=tile;}
    assert.deepEqual(last,{x:place.arrival[0],y:place.arrival[1]});
  }
});
test('tapping blocked ground chooses a nearby walkable tile',()=>{
  const closest=closestWalkable(30,18);assert.ok(closest);assert.ok(walkable(closest.x,closest.y));
});

test('wider house collision matches facade sprites without blocking arrivals',()=>{
  for(const p of places){
    assert.ok(!walkable(p.tile[0]-4,p.tile[1]),p.id);
    assert.ok(!walkable(p.tile[0]+4,p.tile[1]),p.id);
    assert.ok(walkable(...p.arrival),p.id);
  }
});

test('wedding castle has a wide obstacle and a reachable entrance',()=>{
 const castle=places.find(p=>p.id==='boda');
 assert.ok(castle);
 assert.ok(!walkable(castle.tile[0]-8,castle.tile[1]-3));
 assert.ok(!walkable(castle.tile[0]+8,castle.tile[1]));
 assert.ok(walkable(...castle.arrival));
 const route=findPath({x:30,y:25},{x:castle.arrival[0],y:castle.arrival[1]});
 assert.ok(route.length>0);
});


test('rerouting mid-step rejoins the grid before turning around an obstacle',()=>{
  initWorld(places,decor);
  const from={x:30.4,y:25};
  const route=findPath(from,{x:30,y:26});
  assert.deepEqual(route[0],{x:30,y:25});
  let previous=from;
  for(const point of route){
    assert.ok(point.x===previous.x||point.y===previous.y,'No diagonal corner cutting');
    assert.ok(walkable(point.x,point.y));
    previous=point;
  }
  assert.deepEqual(findPath(from,{x:30,y:25}),[{x:30,y:25}],
    'An interaction must reach the exact center even when rounding says it has arrived');
});


test('the castle entrance keeps both characters clear of the foreground tree',()=>{
  const entrance=places.find(place=>place.id==='boda').arrival;
  const pairBox={left:entrance[0]*16-32,right:entrance[0]*16+32,
    top:entrance[1]*16-46,bottom:entrance[1]*16+2};
  for(const tree of decor.filter(item=>item.kind==='tree'&&item.tile[1]>=entrance[1])){
    const left=tree.tile[0]*16-32,right=left+64,top=tree.tile[1]*16-110,bottom=top+112;
    const overlap=Math.max(0,Math.min(pairBox.right,right)-Math.max(pairBox.left,left))*
      Math.max(0,Math.min(pairBox.bottom,bottom)-Math.max(pairBox.top,top));
    assert.equal(overlap,0,'Foreground trees must not hide Itza or Leo at the entrance');
  }
});

test('the expanded castle footprint leaves every existing destination reachable',()=>{
  const castle=places.find(place=>place.id==='boda');
  assert.deepEqual(castle.arrival,[105,54]);
  assert.equal(walkable(95,51),false,'The wider west facade blocks passage');
  assert.equal(walkable(115,51),false,'The wider east facade blocks passage');
  assert.equal(walkable(105,38),false,'The taller building blocks the upper row');
  assert.ok(walkable(94,43),'The neighboring playlist arrival stays free');
  assert.ok(walkable(105,53),'The landing is reachable directly before the doorway');
  for(const destination of places){
    assert.ok(findPath({x:30,y:25},{x:destination.arrival[0],y:destination.arrival[1]}).length,destination.id);
  }
});

test('castle approach frames the illustrated crown and both characters together',async()=>{
  const {castleWorldBounds,castleApproachLift,CASTLE_LAYOUT}=await import('../game/castle-layout.js');
  const castle=places.find(place=>place.id==='boda');
  const pair={x:castle.arrival[0],y:castle.arrival[1]};
  const bounds=castleWorldBounds(castle);
  const cameraY=pair.y*16-135-castleApproachLift(pair,castle);
  const pngjs=await import('pngjs');
  const image=pngjs.PNG.sync.read(readFileSync(new URL('../assets/game/wedding/castle-v2.png',import.meta.url)));
  let contentTop=image.height;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)
    if(image.data[(y*image.width+x)*4+3]>=128)contentTop=Math.min(contentTop,y);
  assert.ok(bounds.y+contentTop-cameraY>=6,'The actual illustrated crown has breathing room');
  assert.ok(pair.y*16+2-cameraY<=264,'Both characters keep their shoes in view');
  assert.ok(CASTLE_LAYOUT.width/264>=1.25&&CASTLE_LAYOUT.width/264<=1.4);
  assert.equal(castleApproachLift({x:30,y:25},castle),0,'Ordinary exploration keeps its camera');
  assert.equal(castleApproachLift(pair,null),0);
});
