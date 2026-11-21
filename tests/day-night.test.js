import test from 'node:test';
import assert from 'node:assert/strict';
import {createDayNightClock,normalizeLightingState,PHASE_DURATION} from '../game/day-night.js';

test('automatic daylight and night each last exactly five real minutes',()=>{
  let now=1000;const clock=createDayNightClock({now:()=>now});
  assert.equal(PHASE_DURATION,300000);
  assert.equal(clock.sample().phase,'day');
  now+=299999;assert.equal(clock.sample().phase,'day');assert.equal(clock.sample().remaining,1);
  now++;assert.equal(clock.sample().phase,'night');assert.equal(clock.sample().remaining,300000);
  now+=299999;assert.equal(clock.sample().phase,'night');
  now++;assert.equal(clock.sample().phase,'day');
});

test('manual night and day remain fixed across automatic phase boundaries',()=>{
  let now=0;const changes=[],clock=createDayNightClock({now:()=>now,onChange:state=>changes.push(state)});
  clock.setMode('night');now=21*PHASE_DURATION;assert.equal(clock.sample().phase,'night');
  assert.equal(clock.sample().remaining,null);
  clock.setMode('day');now=44*PHASE_DURATION;assert.equal(clock.sample().phase,'day');
  assert.deepEqual(changes.map(state=>state.mode),['night','day']);
  assert.equal(clock.setMode('day'),false);assert.equal(clock.setMode('invalid'),false);
  assert.equal(changes.length,2,'No per-frame save notifications');
});

test('returning to automatic starts a fresh daylight phase without resetting the world',()=>{
  let now=0;const clock=createDayNightClock({now:()=>now});
  clock.setMode('night');now=1234567;clock.setMode('auto');
  assert.equal(clock.sample().phase,'day');assert.equal(clock.sample().remaining,300000);
  assert.deepEqual(clock.getState(),{mode:'auto',cycleStartedAt:now});
  now+=PHASE_DURATION;assert.equal(clock.sample().phase,'night');
});

test('reopening a save or resuming a hidden tab catches up using elapsed wall time',()=>{
  const saved={mode:'auto',cycleStartedAt:1000};
  let now=1000+PHASE_DURATION*7+9000;
  const clock=createDayNightClock({saved,now:()=>now});
  assert.equal(clock.sample().phase,'night');assert.equal(clock.sample().remaining,291000);
  now+=PHASE_DURATION*3;assert.equal(clock.sample().phase,'day');
  assert.deepEqual(saved,{mode:'auto',cycleStartedAt:1000},'Input save is not mutated');
});

test('legacy or damaged lighting preferences fall back to automatic daylight',()=>{
  for(const saved of [undefined,null,{},'night',{mode:'unknown',cycleStartedAt:'bad'},
    {mode:'auto',cycleStartedAt:null},{mode:'auto',cycleStartedAt:-1},{mode:'auto',cycleStartedAt:5001}]){
    assert.deepEqual(normalizeLightingState(saved,5000),{mode:'auto',cycleStartedAt:5000});
  }
  assert.deepEqual(normalizeLightingState({mode:'night',cycleStartedAt:0},5000),{mode:'night',cycleStartedAt:0});
});
