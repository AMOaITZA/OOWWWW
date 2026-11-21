import test from 'node:test';
import assert from 'node:assert/strict';
import {HAWAII_ZONES,HAWAII_DRINKS,normalizeHawaii,visitHawaii,danceInHawaii,buyHawaiiDrink,petHawaiiGiraffe,hawaiiZoneAt,hawaiiWalkable,nearestHawaiiPoint} from '../game/hawaii.js';

test('the tropical holiday has a safe state independent of earlier saves',()=>{
  const expected={visits:0,dances:0,giraffePets:0,shells:12,drinks:{pina:0,mango:0,coco:0},lastDrink:null};
  for(const saved of [null,undefined,'bad',{visits:-3,shells:NaN,drinks:{pina:Infinity}}])assert.deepEqual(normalizeHawaii(saved),expected);
  assert.equal(normalizeHawaii({shells:0}).shells,0);
});
test('visits, dancing and petting persist without mutating the saved object',()=>{
  const old=normalizeHawaii({shells:1});
  const state=petHawaiiGiraffe(danceInHawaii(visitHawaii(old)));
  assert.deepEqual({...state},{...old,visits:1,dances:1,giraffePets:1,shells:4});
  assert.equal(old.visits,0);assert.equal(old.shells,1);
});
test('buying each drink deducts exactly its price and counts the chosen drink',()=>{
  let state=normalizeHawaii();
  for(const drink of HAWAII_DRINKS){const result=buyHawaiiDrink(state,drink.id);assert.equal(result.bought,true);state=result.state;}
  assert.equal(state.shells,6);assert.deepEqual(state.drinks,{pina:1,mango:1,coco:1});assert.equal(state.lastDrink,'coco');
});
test('an invalid or unaffordable purchase cannot spend shells or add drinks',()=>{
  for(const id of ['pina','not-a-drink']){
    const state=normalizeHawaii({shells:1}),result=buyHawaiiDrink(state,id);
    assert.equal(result.bought,false);assert.deepEqual(result.state,state);
  }
  assert.equal(buyHawaiiDrink(danceInHawaii({shells:0}),'coco').bought,true);
});
test('every attraction has an accessible arrival and nearby hit target',()=>{
  assert.equal(HAWAII_ZONES.length,3);
  for(const zone of HAWAII_ZONES){assert.ok(hawaiiWalkable(zone.arrival.x,zone.arrival.y));assert.equal(hawaiiZoneAt(zone.arrival.x,zone.arrival.y)?.id,zone.id);}
  assert.equal(hawaiiZoneAt(320,330),null);assert.equal(hawaiiZoneAt(NaN,200),null);
});
test('navigation cannot step into the sea or walk through the bar and giraffe',()=>{
  for(const [x,y] of [[-1,100],[700,500],[100,100],[550,185],[NaN,Infinity]]){
    const point=nearestHawaiiPoint(x,y);assert.ok(hawaiiWalkable(point.x,point.y));
  }
  assert.equal(hawaiiWalkable(100,100),false);assert.equal(hawaiiWalkable(320,390),false);
});
