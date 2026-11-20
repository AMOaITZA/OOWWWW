import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TRAVEL_SPOTS,travelAt,isTravelSpot} from '../game/travel-spots.js';
import {SECRETS} from '../game/hidden-secrets.js';
import {initWorld,walkable,findPath} from '../game/world.js';
const json=path=>JSON.parse(fs.readFileSync(new URL('../game/data/'+path,import.meta.url)));
test('the harbor and beach are reachable physical locations on the southern coast',()=>{
  initWorld(json('places.json'),json('decor.json'),json('moments.json'),{
    extraObstacles:SECRETS.map(spot=>spot.tile)});
  for(const spot of TRAVEL_SPOTS){
    assert.ok(walkable(...spot.arrival));
    assert.ok(findPath({x:30,y:25},{x:spot.arrival[0],y:spot.arrival[1]}).length);
    assert.equal(travelAt(spot.tile[0]*16,spot.tile[1]*16-10)?.id,spot.id);
    assert.ok(isTravelSpot(spot));
    assert.equal(walkable(...spot.tile),spot.id==='mirador');
  }
  assert.equal(travelAt(0,0),null);assert.equal(isTravelSpot({id:'pesca'}),false);
});
