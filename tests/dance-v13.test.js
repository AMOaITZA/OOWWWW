import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {danceStep,DANCE_BODY_URL,DANCE_LOOP_SECONDS} from '../game/dance.js';

const atlas=PNG.sync.read(fs.readFileSync(new URL('..'+DANCE_BODY_URL,import.meta.url)));
function silhouette(row,frame,fromY=0,toY=56){
  const bytes=[];
  for(let y=fromY;y<toY;y++)for(let x=0;x<40;x++)bytes.push(atlas.data[((row*56+y)*atlas.width+frame*40+x)*4+3]?1:0);
  return Buffer.from(bytes).toString('base64');
}
test('dance costumes contain eight different upper-body and leg silhouettes in every outfit',()=>{
  assert.equal(atlas.width,320);assert.equal(atlas.height,336);
  for(let row=0;row<6;row++){
    assert.equal(new Set(Array.from({length:8},(_,frame)=>silhouette(row,frame))).size,8);
    assert.ok(new Set(Array.from({length:8},(_,frame)=>silhouette(row,frame,18,38))).size>=7,'arms must change pose');
    assert.ok(new Set(Array.from({length:8},(_,frame)=>silhouette(row,frame,39,56))).size>=7,'knees and feet must change pose');
  }
});
test('dance bodies have a transparent head field, binary alpha and a bounded pixel palette',()=>{
  const colors=new Set();
  for(let i=0;i<atlas.data.length;i+=4){
    assert.ok(atlas.data[i+3]===0||atlas.data[i+3]===255);
    if(atlas.data[i+3])colors.add([...atlas.data.subarray(i,i+3)].join(','));
  }
  assert.ok(colors.size<=128);
  // Raised arms legitimately enter the sides of the head's space. The middle
  // remains empty so actual personalized faces can be composed without a seam.
  for(let row=0;row<6;row++)for(let frame=0;frame<8;frame++)for(let y=3;y<19;y++)
    for(let x=16;x<25;x++)assert.equal(atlas.data[((row*56+y)*atlas.width+frame*40+x)*4+3],0);
  const provenance=JSON.parse(fs.readFileSync(new URL('../docs/DANCE-V13-GENERATION.json',import.meta.url)));
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('..'+DANCE_BODY_URL,import.meta.url))).digest('hex'),provenance.sha256);
});
test('choreography alternates the underarm turn and visits every drawn pose for both partners',()=>{
  const leo=new Set(),itza=new Set();
  for(let index=0;index<16;index++){
    const step=danceStep((index+.5)*DANCE_LOOP_SECONDS/8);
    leo.add(step.leoFrame);itza.add(step.itzaFrame);
    if(step.frame===4)assert.notEqual(step.leoFrame,step.itzaFrame);
  }
  assert.equal(leo.size,8);assert.equal(itza.size,8);
  assert.equal(danceStep(.1).turning,'itza');assert.equal(danceStep(2.5).turning,'leo');
});
test('reduced motion keeps one real handhold pose and invalid clocks stay finite',()=>{
  for(const time of [-1,NaN,Infinity,8]){
    const step=danceStep(time,true);assert.equal(step.frame,0);assert.equal(step.leoFrame,0);assert.equal(step.itzaFrame,0);
  }
  assert.equal(danceStep(NaN).frame,0);
});
