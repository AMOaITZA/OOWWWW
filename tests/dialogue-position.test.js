import test from 'node:test';
import assert from 'node:assert/strict';
import {placeDialogue} from '../game/dialogue-position.js';

const intersects=(a,b)=>{
  const x=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
  const y=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  return x*y;
};
test('speech avoids Leo, the cats and the bench when centered-above would cover them',()=>{
  const obstacles=[
    {id:'pair',x:618,y:305,width:128,height:100},
    {id:'cats',x:640,y:215,width:80,height:64},
    {id:'banca',x:624,y:294,width:144,height:105}
  ];
  const bubble={width:245,height:65};
  const result=placeDialogue({anchor:{x:650,y:315},bubble,viewport:{width:1280,height:720},obstacles});
  const rect={x:result.x,y:result.y,...bubble};
  for(const obstacle of obstacles)assert.equal(intersects(rect,obstacle),0,obstacle.id);
  assert.ok(['top','bottom','left','right'].includes(result.tail));
});
test('bubble stays on screen when Leo is near corners',()=>{
  const viewport={width:375,height:812},bubble={width:180,height:70};
  for(const anchor of [{x:20,y:20},{x:362,y:30},{x:15,y:795},{x:370,y:800}]){
    const result=placeDialogue({
      anchor,bubble,viewport,
      obstacles:[{id:'pair',x:anchor.x-15,y:anchor.y-18,width:30,height:52}]
    });
    assert.ok(result.x>=8&&result.y>=8);
    assert.ok(result.x+bubble.width<=viewport.width-8);
    assert.ok(result.y+bubble.height<=viewport.height-8);
    assert.ok(Number.isFinite(result.tailX)&&Number.isFinite(result.tailY));
  }
});
