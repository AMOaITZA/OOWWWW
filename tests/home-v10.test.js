import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_ACTIVITIES,HOME_LAYOUT,normalizeHomeState,visitHome,chooseHomeActivity} from '../game/home.js';

test('old or damaged house saves become a safe independent home state',()=>{
  const expected={activity:'eat',visits:0,counts:{eat:0,sleep:0,tv:0}};
  for(const saved of [null,undefined,'sleep',{activity:'bad',visits:-1,counts:{eat:NaN,sleep:'3',tv:Infinity}}])assert.deepEqual(normalizeHomeState(saved),expected);
  assert.deepEqual(normalizeHomeState({activity:'tv',visits:2,counts:{eat:3,sleep:1,tv:4}}),{activity:'tv',visits:2,counts:{eat:3,sleep:1,tv:4}});
});
test('visits and chosen activities persist separately without changing caller state',()=>{
  const original={activity:'tv',visits:4,counts:{eat:1,sleep:2,tv:3}};
  const home=chooseHomeActivity(visitHome(original),'sleep');
  assert.deepEqual(home,{activity:'sleep',visits:5,counts:{eat:1,sleep:3,tv:3}});
  assert.deepEqual(original,{activity:'tv',visits:4,counts:{eat:1,sleep:2,tv:3}});
  assert.deepEqual(chooseHomeActivity(home,'unknown'),home);
});
test('the room has three distinct actions and furniture stays inside its native canvas',()=>{
  assert.deepEqual(HOME_ACTIVITIES.map(activity=>activity.id),['eat','sleep','tv']);
  for(const box of [HOME_LAYOUT.bed.blanket,HOME_LAYOUT.table.foreground,HOME_LAYOUT.sofa.foreground,HOME_LAYOUT.tv]){
    assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=480&&box.y+box.height<=270);
  }
  const full=chooseHomeActivity({visits:999999,counts:{eat:999999}},'eat');
  assert.equal(full.counts.eat,999999);assert.equal(visitHome(full).visits,999999);
});
