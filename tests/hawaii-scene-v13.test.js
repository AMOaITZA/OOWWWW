import test from 'node:test';
import assert from 'node:assert/strict';
import {hawaiiViewport} from '../game/hawaii.js';

for(const [width,height] of [[1440,1000],[390,844],[844,390],[360,640],[2560,1440]]){
  test(`the full-screen Hawaii camera covers ${width}×${height} without stretching its pixel grid`,()=>{
    const view=hawaiiViewport(width,height);
    assert.ok(Number.isInteger(view.scale)&&view.scale>=2);
    assert.ok(view.width<=640&&view.height<=400);
    assert.ok(view.cssWidth>=width&&view.cssHeight>=height);
    assert.equal(view.cssWidth/view.width,view.cssHeight/view.height);
    assert.equal(view.cssWidth/view.width,view.scale);
    assert.ok(view.cssWidth-width<view.scale&&view.cssHeight-height<view.scale);
  });
}
test('portrait and landscape use camera crops while retaining the native world',()=>{
  const portrait=hawaiiViewport(390,844),landscape=hawaiiViewport(844,390);
  assert.ok(portrait.width<landscape.width);
  assert.ok(portrait.height>landscape.height);
  assert.ok(portrait.width>=100,'both 40px dancing bodies and their separation fit the view');
});
