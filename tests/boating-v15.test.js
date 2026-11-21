import test from 'node:test';
import assert from 'node:assert/strict';
import {BOAT_START,BOAT_ISLANDS,normalizeBoating,visitBoating,openBoatGift,boatWater,boatRoute,nearestBoatWater,boatingViewport} from '../game/boating.js';

test('boat save accepts unique known gifts and never migrates world coordinates',()=>{
 assert.deepEqual(normalizeBoating({visits:-1,found:['cerezo','cerezo','bad','jardin'],position:{x:999,y:999}}),{visits:0,found:['cerezo','jardin']});
 const old={visits:2,found:['cerezo']};assert.equal(visitBoating(old).visits,3);assert.equal(old.visits,2);
});
test('island gifts require arrival, stay unique, and all three can be collected',()=>{
 let state=visitBoating();
 assert.equal(openBoatGift(state,'estrellas',BOAT_START).opened,false);
 assert.equal(openBoatGift(state,'bad',BOAT_START).opened,false);
 for(const island of BOAT_ISLANDS){const result=openBoatGift(state,island.id,island.arrival);assert.equal(result.opened,true);assert.equal(result.isNew,true);state=result.state;assert.equal(openBoatGift(state,island.id,island.arrival).isNew,false);}
 assert.equal(state.found.length,3);assert.equal(state.visits,1);
});
test('all piers are navigable and routes between every pair stay in water',()=>{
 const stops=[BOAT_START,...BOAT_ISLANDS.map(island=>island.arrival)];
 for(const start of stops)for(const end of stops){
  assert.equal(boatWater(start.x,start.y),true);const route=boatRoute(start,end);assert.ok(route.length);assert.deepEqual(route.at(-1),end);
  let from=start;for(const to of route){const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)));for(let i=0;i<=n;i++){const t=i/n;assert.equal(boatWater(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t),true,JSON.stringify({start,end,from,to,t}));}from=to;}
 }
});
test('taps on islands or beyond map resolve to water rather than crossing land',()=>{
 for(const [x,y] of [[154,157],[592,139],[602,297],[-500,900],[Infinity,NaN]]){const point=nearestBoatWater(x,y);assert.equal(boatWater(point.x,point.y),true);assert.ok(boatRoute(BOAT_START,point).length);}
});
test('boat viewport fills phone, landscape and desktop with crisp uniform pixels',()=>{
 for(const [width,height] of [[390,844],[844,390],[1440,900]]){const view=boatingViewport(width,height);assert.ok(view.cssWidth>=width);assert.ok(view.cssHeight>=height);assert.equal(view.cssWidth/view.width,view.cssHeight/view.height);assert.ok(Number.isInteger(view.scale));}
});
