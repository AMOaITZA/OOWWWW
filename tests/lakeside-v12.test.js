import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLakesideState,visitLakeside,recordLakesideAction,fireworkParticles,FIREWORK_DURATION,LAKESIDE_WISHES} from '../game/lakeside.js';

test('lake saves count visits and memories without restoring a live spectacle',()=>{
  for(const damaged of [undefined,null,'night',{visits:-1,sits:Infinity,shows:'4',wishes:NaN}]){
    assert.deepEqual(normalizeLakesideState(damaged),{visits:0,sits:0,shows:0,wishes:0});
  }
  assert.deepEqual(normalizeLakesideState({visits:4,sits:2,shows:1,wishes:3,showing:true}),{visits:4,sits:2,shows:1,wishes:3});
});
test('lake actions preserve caller state and cannot grow counters without bounds',()=>{
  const original={visits:2,sits:1,shows:0,wishes:3};
  const next=recordLakesideAction(visitLakeside(original),'wishes');
  assert.deepEqual(next,{visits:3,sits:1,shows:0,wishes:4});
  assert.deepEqual(original,{visits:2,sits:1,shows:0,wishes:3});
  assert.deepEqual(recordLakesideAction(original,'unknown'),original);
  assert.equal(visitLakeside({visits:999999}).visits,999999);
  assert.equal(recordLakesideAction({wishes:999999},'wishes').wishes,999999);
});
test('finite fireworks stay within the sky and a fixed particle budget',()=>{
  for(let time=0;time<FIREWORK_DURATION;time+=.03){
    const particles=fireworkParticles(time);assert.ok(particles.length<=36);
    for(const particle of particles){
      assert.ok(particle.x>0&&particle.x<640);assert.ok(particle.y>0&&particle.y<160);
      assert.ok(particle.alpha>=0&&particle.alpha<=1);
    }
  }
  for(const time of [-1,NaN,Infinity,FIREWORK_DURATION,99])assert.deepEqual(fireworkParticles(time),[]);
  assert.deepEqual(fireworkParticles(.8),fireworkParticles(.8));
});
test('reduced motion uses a static constellation of fireworks and personal wishes',()=>{
  assert.deepEqual(fireworkParticles(0,{reducedMotion:true}),fireworkParticles(15,{reducedMotion:true}));
  assert.equal(fireworkParticles(2,{reducedMotion:true}).length,54);
  assert.equal(new Set(LAKESIDE_WISHES).size,4);
  assert.ok(LAKESIDE_WISHES.every(line=>typeof line==='string'&&line.length>30));
});
