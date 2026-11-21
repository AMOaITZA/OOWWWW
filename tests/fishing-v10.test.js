import test from 'node:test';
import assert from 'node:assert/strict';
import {PLUSHIES,normalizeFishing,selectPlushie,recordCast,recordCatch,collectedPlushies,hasAllPlushies} from '../game/fishing.js';

test('legacy and malformed fishing progress normalizes without inventing unlocks',()=>{
  assert.deepEqual(normalizeFishing(),{collection:{},casts:0,catches:0});
  assert.deepEqual(normalizeFishing({collection:{freddy:2.9,bonnie:-1,chica:'4',unknown:999},casts:'bad',catches:NaN}),
    {collection:{freddy:2},casts:2,catches:2});
  assert.equal(hasAllPlushies({collection:{unknown:100000}}),false);
  assert.equal(collectedPlushies({collection:{freddy:9999}}),1);
});

test('weighted draws retain rare characters while prioritizing missing plushies',()=>{
  assert.equal(selectPlushie({},()=>0).id,'freddy');
  assert.equal(selectPlushie({},()=>.9999999).id,'golden-freddy');
  const state={collection:{freddy:1,bonnie:1,chica:1,foxy:1}};
  for(const fraction of [0,.1,.5,.99,1,-1,NaN])assert.equal(selectPlushie(state,()=>fraction).id,'golden-freddy');
});

test('five successful catches always complete the quest for every deterministic draw order',()=>{
  for(const fraction of [0,.02,.2,.49,.75,.9999999]){
    let state=normalizeFishing();const found=new Set();
    for(let catchIndex=0;catchIndex<5;catchIndex++){
      const cast=recordCast(state),plushie=selectPlushie(cast,()=>fraction);
      assert.equal(found.has(plushie.id),false,'Missing plushies have priority');
      found.add(plushie.id);state=recordCatch(cast,plushie.id);
      assert.equal(hasAllPlushies(state),catchIndex===4);
    }
    assert.equal(state.casts,5);assert.equal(state.catches,5);assert.equal(collectedPlushies(state),5);
  }
});

test('completed collections can catch repeats without losing Ponyo or earlier counts',()=>{
  const original={collection:Object.fromEntries(PLUSHIES.map(({id})=>[id,1])),casts:5,catches:5};
  const next=recordCatch(recordCast(original),selectPlushie(original,()=>0).id);
  assert.equal(next.collection.freddy,2);assert.equal(next.catches,6);assert.equal(next.casts,6);
  assert.equal(hasAllPlushies(next),true);assert.equal(original.collection.freddy,1,'Input progress stays immutable');
  assert.deepEqual(recordCatch(original,'other-character'),original);
});

test('a missed cast spends only an attempt and cannot alter the collection',()=>{
  const state={collection:{foxy:1},casts:3,catches:1},cast=recordCast(state);
  assert.deepEqual(cast,{collection:{foxy:1},casts:4,catches:1});
  assert.deepEqual(state,{collection:{foxy:1},casts:3,catches:1});
});
