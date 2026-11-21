import test from 'node:test';
import assert from 'node:assert/strict';
import {GARDEN_FLOWERS,GARDEN_PLOTS,GARDEN_GROW_SECONDS,normalizeGarden,plantGarden,waterGarden,advanceGarden,gardenStage,harvestGarden,decorateGarden,getHomeDecoration,gardenViewport} from '../game/garden.js';

test('garden validates corrupted progress while keeping legitimate bouquets',()=>{
  const state=normalizeGarden({plots:[{flower:'cosmos',watered:true,growth:4},{flower:'nope',watered:true,growth:1}],inventory:{cosmos:-2,girasol:3},decorations:['cosmos','fake'],decoration:'cosmos'});
  assert.equal(state.plots.length,6);assert.equal(gardenStage(state.plots[0]),3);assert.deepEqual(state.plots[1],{flower:null,watered:false,growth:0});
  assert.equal(state.inventory.cosmos,0);assert.equal(state.inventory.girasol,3);assert.deepEqual(state.decorations,['cosmos']);assert.equal(state.decoration,'cosmos');
});
test('a flower must be planted and watered before it can grow or be harvested',()=>{
  let state=plantGarden(null,0,'lavanda').state;
  assert.equal(plantGarden(state,0,'cosmos').changed,false);
  state=advanceGarden(state,60);assert.equal(gardenStage(state.plots[0]),1);assert.equal(harvestGarden(state,0).changed,false);
  state=waterGarden(state,0).state;assert.equal(waterGarden(state,0).changed,false);
  state=advanceGarden(state,GARDEN_GROW_SECONDS/2);assert.equal(gardenStage(state.plots[0]),2);
  state=advanceGarden(state,GARDEN_GROW_SECONDS/2);assert.equal(gardenStage(state.plots[0]),3);
  const result=harvestGarden(state,0);assert.equal(result.changed,true);assert.equal(result.flower,'lavanda');assert.equal(result.state.inventory.lavanda,1);assert.equal(result.state.harvested,1);
  assert.equal(harvestGarden(result.state,0).changed,false);
});
test('home vases consume one harvested flower once and remain reusable',()=>{
  let state=normalizeGarden({inventory:{cosmos:1,girasol:1}});
  assert.equal(decorateGarden(state,'lavanda').changed,false);
  state=decorateGarden(state,'cosmos').state;assert.equal(state.inventory.cosmos,0);assert.equal(getHomeDecoration(state).source.y,96);
  state=decorateGarden(state,'girasol').state;assert.equal(state.inventory.girasol,0);
  state=decorateGarden(state,'cosmos').state;assert.equal(state.inventory.cosmos,0);assert.equal(state.decoration,'cosmos');
  assert.equal(getHomeDecoration(decorateGarden(state,null).state),null);
});
test('invalid actions do not modify another plot and growth never reverses',()=>{
  for(const index of [-1,6,NaN,'0'])assert.equal(plantGarden(null,index,'cosmos').changed,false);
  assert.equal(plantGarden(null,0,'fake').changed,false);
  const state=waterGarden(plantGarden(null,0,'cosmos').state,0).state;
  assert.deepEqual(advanceGarden(state,NaN),state);assert.deepEqual(advanceGarden(state,-7),state);
  assert.equal(advanceGarden(state,Infinity).plots[0].growth,0);
  assert.equal(advanceGarden(state,10000).plots[0].growth,1);
});
test('all garden plots and flower frames fit their shared scene resources',()=>{
  assert.equal(GARDEN_FLOWERS.length,3);assert.equal(GARDEN_PLOTS.length,6);
  for(const plot of GARDEN_PLOTS)assert.ok(plot.x>32&&plot.x<608&&plot.y>32&&plot.y<368);
  for(const size of [[390,844],[844,390],[1920,1080]]){
    const viewport=gardenViewport(...size);assert.ok(viewport.cssWidth>=size[0]);assert.ok(viewport.cssHeight>=size[1]);assert.ok(Number.isInteger(viewport.scale));assert.ok(viewport.width<=640&&viewport.height<=400);
  }
});
