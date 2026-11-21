import test from 'node:test';
import assert from 'node:assert/strict';
import {worldViewport,approachLift} from '../game/viewport.js';

test('world fills portrait, landscape and desktop screens using uniform whole pixels',()=>{
  for(const [width,height,expected] of [[390,844,2],[375,812,2],[844,390,2],[1440,900,3],[1890,919,3],[1920,1080,4]]){
    const view=worldViewport(width,height);
    assert.equal(view.scale,expected);
    assert.equal(view.cssWidth/view.width,view.cssHeight/view.height);
    assert.ok(Number.isInteger(view.scale));
    assert.ok(view.cssWidth>=width&&view.cssWidth-width<view.scale);
    assert.ok(view.cssHeight>=height&&view.cssHeight-height<view.scale);
    assert.ok(view.width<=1920&&view.height<=1280);
  }
});

test('backing buffer stays bounded on very large or invalid displays',()=>{
  for(const [width,height] of [[15360,8640],[0,0],[NaN,undefined]]){
    const view=worldViewport(width,height);
    assert.ok(view.width>0&&view.height>0);
    assert.ok(view.width<=1920&&view.height<=1280);
    assert.ok(Number.isFinite(view.cssWidth)&&Number.isFinite(view.cssHeight));
  }
});

test('short-screen approach never pushes the couple under the bottom controls',()=>{
  assert.equal(approachLift(125,160,64,2),48);
  assert.equal(approachLift(64,422,64,2),64);
  assert.equal(approachLift(125,100,120,2),0);
});
