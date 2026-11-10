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
