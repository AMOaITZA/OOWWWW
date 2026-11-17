import test from 'node:test';
import assert from 'node:assert/strict';
import {visiblePlaces,placeProgress} from '../game/place-discovery.js';
const places=[{id:'inicio'},{id:'grabadora'},{id:'secreto',hidden:true}];
test('the secret stays off the map until discovered and old visited IDs do not inflate progress',()=>{
  assert.deepEqual(visiblePlaces(places).map(p=>p.id),['inicio','grabadora']);
  const save={visited:['inicio','secreto']};
  assert.deepEqual(visiblePlaces(places,save).map(p=>p.id),['inicio','grabadora','secreto']);
  assert.deepEqual(placeProgress(places,save),{visited:2,total:3});
  assert.deepEqual(placeProgress(places,{visited:['inicio','obsolete']}),{visited:1,total:2});
});
