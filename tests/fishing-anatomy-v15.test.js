import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PNG} from 'pngjs';
import {FISHING_GRIPS,FISHING_ACTOR_WIDTH,FISHING_ACTOR_HEIGHT,FISHING_BODY_OFFSET_Y,fishingPoseAt} from '../game/fishing-scene.js';
const body=PNG.sync.read(fs.readFileSync(new URL('../assets/game/fishing/poses-v16.png',import.meta.url)));
function frame(row,column){
  const rgba=(x,y)=>body.data.subarray(((row*FISHING_ACTOR_HEIGHT+y)*body.width+column*FISHING_ACTOR_WIDTH+x)*4,((row*FISHING_ACTOR_HEIGHT+y)*body.width+column*FISHING_ACTOR_WIDTH+x)*4+4);
  const opaque=(x,y)=>x>=0&&x<FISHING_ACTOR_WIDTH&&y>=0&&y<FISHING_ACTOR_HEIGHT&&rgba(x,y)[3]===255;
  return {rgba,opaque};
}
test('every fishing palm is attached continuously through its arm and torso to the standing body',()=>{
  for(let row=0;row<3;row++)for(let pose=0;pose<4;pose++){
    const {rgba,opaque}=frame(row,pose),[gripX,actorGripY]=FISHING_GRIPS[pose],gripY=actorGripY-FISHING_BODY_OFFSET_Y;
    assert.ok(gripY>=30 && gripX>=30, `look${row}/pose${pose}: the native face must not hide the palm`);
    assert.ok(opaque(gripX,gripY),`look${row}/pose${pose}: the rod must start on the actual hand`);
    let flesh=0;
    for(let y=gripY-2;y<=gripY+2;y++)for(let x=gripX-2;x<=gripX+2;x++)if(opaque(x,y)){
      const [r,g,b]=rgba(x,y);if(r>g+20&&g>b+10)flesh++;
    }
    assert.ok(flesh>=3,`look${row}/pose${pose}: measured grip belongs to the palm, not empty air or an unrelated body edge`);
    const queue=[[gripX,gripY]],seen=new Set([gripY*FISHING_ACTOR_WIDTH+gripX]);
    while(queue.length){
      const [x,y]=queue.pop();
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy,key=ny*FISHING_ACTOR_WIDTH+nx;
        if(seen.has(key)||!opaque(nx,ny))continue;
        seen.add(key);queue.push([nx,ny]);
      }
    }
    let bodyPixels=0,torso=0,feet=0;
    for(let y=0;y<FISHING_ACTOR_HEIGHT;y++)for(let x=0;x<FISHING_ACTOR_WIDTH;x++)if(opaque(x,y)){
      bodyPixels++;
      if(seen.has(y*FISHING_ACTOR_WIDTH+x)&&y>=28&&y<=38)torso++;
      if(seen.has(y*FISHING_ACTOR_WIDTH+x)&&y>=55)feet++;
    }
    assert.equal(seen.size,bodyPixels,`look${row}/pose${pose}: no detached hands, legs or neighboring sprite fragments`);
    assert.ok(torso>=60,`look${row}/pose${pose}: grip must connect to a complete torso`);
    assert.ok(feet>=10,`look${row}/pose${pose}: striding legs must remain attached to the body`);
  }
});
test('the waiting and missed poses retain shoulders and forearms below the native jaw',()=>{
  assert.equal(FISHING_ACTOR_HEIGHT,64);
  for(let row=0;row<3;row++){
    const {opaque}=frame(row,0);let shoulders=0;
    for(let y=28;y<=33;y++)for(let x=14;x<36;x++)if(opaque(x,y))shoulders++;
    assert.ok(shoulders>=50,`look${row}: waiting shoulders must connect below the native jaw`);
  }
  assert.equal(fishingPoseAt('idle').pose,0);assert.equal(fishingPoseAt('missed').pose,0);
});
