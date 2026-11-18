import test from 'node:test';
import assert from 'node:assert/strict';
import {lampGlowAt,fireflyAt,FIREFLY_COUNT} from '../game/night-effects.js';
import {createDayNight} from '../game/day-night.js';

test('lamps breathe gently without switching off or changing the sky',()=>{
  const samples=[];
  for(let t=0;t<30;t+=.25){
    const value=lampGlowAt(t,0);samples.push(value);
    assert.ok(value>=.72&&value<=1);
    assert.equal(lampGlowAt(t,0,true),.9);
  }
  assert.ok(Math.max(...samples)-Math.min(...samples)>.2);
  assert.notEqual(lampGlowAt(1,0),lampGlowAt(1,1),'Lamps do not pulse together');
});

test('fireflies drift within a few world pixels and freeze with reduced motion',()=>{
  assert.equal(FIREFLY_COUNT,36);
  for(let i=0;i<FIREFLY_COUNT;i++){
    const still=fireflyAt(i,0,true);
    for(let t=0;t<60;t+=3){
      const point=fireflyAt(i,t);
      assert.ok(Math.abs(point.x-still.x)<=5&&Math.abs(point.y-still.y)<=3);
      assert.ok(point.alpha>=.26&&point.alpha<=.61);
      assert.ok(point.x>=0&&point.x<1920&&point.y>=0&&point.y<1280);
      assert.deepEqual(fireflyAt(i,t,true),still);
    }
  }
});

test('night lighting caches the halo and backdrop instead of creating gradients every frame',()=>{
  let radial=0,linear=0,canvases=0;
  const gradient={addColorStop(){}};
  const savedDocument=globalThis.document;
  globalThis.document={createElement:()=>{
    canvases++;return {getContext:()=>({createRadialGradient(){radial++;return gradient;},fillRect(){}})};
  }};
  try{
    const ctx={canvas:{width:480,height:270,dataset:{}},save(){},restore(){},
      createLinearGradient(){linear++;return gradient;},fillRect(){},drawImage(){}};
    const night=createDayNight({saved:{mode:'night'},now:()=>1000,reducedMotion:()=>false});
    const scene={camera:{x:700,y:400},decor:[{kind:'lamp',tile:[55,40]}]};
    for(let frame=0;frame<10;frame++)night.draw(ctx,{...scene,motionTime:frame/60});
    assert.equal(canvases,1);assert.equal(radial,1);assert.equal(linear,1);
    assert.equal(ctx.canvas.dataset.visibleLanterns,'1');
    ctx.canvas.height=300;night.draw(ctx,scene);
    assert.equal(linear,2);assert.equal(radial,1);
  }finally{globalThis.document=savedDocument;}
});
