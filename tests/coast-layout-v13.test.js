import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {COAST_LAYOUT,coastTileBlocked,coastTileType,onCoast} from '../game/coast-layout.js';
import {initWorld,walkable,findPath,WIDTH,HEIGHT,TILE} from '../game/world.js';
const json=file=>JSON.parse(fs.readFileSync(new URL('../game/data/'+file,import.meta.url)));
const places=json('places.json'),decor=json('decor.json'),moments=json('moments.json');
initWorld(places,decor,moments);

test('the coast extends the village without moving existing coordinates',()=>{
  assert.equal(WIDTH*TILE,1920);assert.equal(HEIGHT*TILE,1792);
  assert.deepEqual(COAST_LAYOUT.strip,{x:0,y:1280,width:1920,height:512});
  assert.equal(onCoast(60,79),false);assert.equal(onCoast(60,80),true);
  assert.equal(coastTileBlocked(30,25),false);assert.ok(walkable(30,25));
});

test('village and casita routes reach both real coastal arrivals',()=>{
  for(const from of [{x:30,y:25},{x:37,y:53}]){
    for(const arrival of [COAST_LAYOUT.hawaiiArrival,COAST_LAYOUT.shoreArrival]){
      const goal={x:arrival[0],y:arrival[1]};assert.ok(walkable(...arrival));
      const route=findPath(from,goal);assert.ok(route.length>0);
      assert.deepEqual(route.at(-1),goal);
      let previous=from;
      for(const tile of route){
        assert.ok(walkable(tile.x,tile.y));
        assert.equal(Math.abs(previous.x-tile.x)+Math.abs(previous.y-tile.y),1);
        previous=tile;
      }
    }
  }
});

test('the beach edge and terminal are solid while the pier is walkable',()=>{
  assert.equal(coastTileType(78,94),'sand');assert.ok(walkable(78,94));
  assert.equal(coastTileType(78,97),'water');assert.equal(walkable(78,97),false);
  assert.equal(walkable(78,96),false,'the footprint does not cross the surf');
  assert.equal(walkable(24,91),false,'the terminal building cannot be walked through');
  assert.equal(coastTileType(24,100),'pier');assert.ok(walkable(24,100));
  assert.equal(walkable(24,103),false,'the pier ends before the open sea');
  assert.equal(walkable(28,100),false,'the boat side of the pier stays water');
});

test('invalid coastal coordinates cannot create walkable cells',()=>{
  for(const [x,y] of [[-1,90],[120,90],[24,112],[NaN,90],[24,Infinity],[24.1,90]]){
    assert.equal(coastTileBlocked(x,y),true);assert.equal(coastTileType(x,y),null);assert.equal(onCoast(x,y),false);
  }
  assert.equal(coastTileType(30,25),null);
});
