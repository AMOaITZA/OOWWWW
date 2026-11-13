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
