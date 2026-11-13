import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import pngjs from 'pngjs';
import {WEDDING_STAGES,stageFor,weddingPose} from '../game/experiences/boda.js';
import {drawWeddingCastle} from '../game/wedding-assets.js';

const regions={idle:[0,240],vows:[412,154],kiss:[128,240],hug:[320,240],celebrate:[0,288]};
const atlas=pngjs.PNG.sync.read(readFileSync(new URL('../assets/game/wedding/atlas.png',import.meta.url)));

test('romantic gestures reach their last pose and hold it until the chapter changes',()=>{
  for(const stage of WEDDING_STAGES.filter(s=>['vows','kiss','hug'].includes(s.id))){
    assert.equal(weddingPose(stage,0).frame,0);
    assert.equal(weddingPose(stage,stage.duration).frame,1);
    assert.equal(weddingPose(stage,30).frame,stage.frames-1,'No rebobinar un beso o abrazo');
    assert.equal(weddingPose(stage,120).frame,stage.frames-1);
    assert.equal(weddingPose(stage,0).frame,0,'Repetir vuelve al principio');
  }
});
test('real atlas frames keep their feet on the ground and their couple centered',()=>{
  for(const stage of WEDDING_STAGES){
    for(let f=0;f<stage.frames;f++){
      const time=stage.duration*(f+(stage.id==='welcome'?2:0));
      const pose=weddingPose(stage,time);
      const [sx,sy]=regions[stage.asset];
      let left=64,right=0,bottom=0;
      for(let y=0;y<48;y++)for(let x=0;x<64;x++){
        if(atlas.data[((sy+y)*atlas.width+sx+pose.sourceX+x)*4+3]>=128){
          left=Math.min(left,x);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
        }
      }
      assert.equal(pose.width/64,2);assert.equal(pose.height/48,2);
      assert.equal(pose.y+bottom*2,232,stage.id+' mantiene los pies en el suelo');
      assert.ok(Math.abs(pose.x+(left+right)-240)<=1,stage.id+' mantiene la pareja centrada');
    }
  }
});
test('reduced motion holds a meaningful pose and the ending rests quietly',()=>{
  for(const stage of WEDDING_STAGES){
    assert.deepEqual(weddingPose(stage,0,true),weddingPose(stage,90,true));
  }
  const ending=WEDDING_STAGES.at(-1);
  assert.equal(weddingPose(ending,100).frame,0);
  assert.equal(stageFor(-1),WEDDING_STAGES[0]);
  assert.equal(stageFor(99),ending);
});
test('castle composition removes original spires and keeps roof aspect ratio',()=>{
  const calls=[],ctx={drawImage:(...args)=>calls.push(args)};
  const castle={dataset:{weddingSource:'atlas'}},roof={};
  assert.equal(drawWeddingCastle(ctx,castle,roof,12.2,10.7),true);
  assert.equal(calls.length,2);
  assert.deepEqual(calls[0],[castle,0,56,264,98,12,67,264,98]);
  const roofCall=calls[1];
  assert.equal(roofCall[7]/roofCall[8],231/84,'El techo no se aplasta');
  assert.equal(drawWeddingCastle(ctx,null,roof,0,0),false);
});
test('fallback castle is complete without applying atlas-specific cropping',()=>{
  const calls=[],ctx={drawImage:(...args)=>calls.push(args)},fallback={};
  drawWeddingCastle(ctx,fallback,{},0,0);
  assert.deepEqual(calls,[[fallback,0,0,264,154]]);
});
