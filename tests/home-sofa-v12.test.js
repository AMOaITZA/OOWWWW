import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {HOME_LAYOUT} from '../game/home.js';

const bytes=readFileSync(new URL('../assets/game/home/seated-crossed.png',import.meta.url));
const body=PNG.sync.read(bytes);
test('the TV bodies have folded knees wider than a standing pair of feet',()=>{
  assert.deepEqual([body.width,body.height],[64,288]);
  for(let row=0;row<6;row++)for(let column=0;column<2;column++){
    let widest=0;
    for(let y=39;y<46;y++){
      let left=32,right=-1;
      for(let x=0;x<32;x++)if(body.data[((row*48+y)*body.width+column*32+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);}
      widest=Math.max(widest,right-left+1);
    }
    assert.ok(widest>=24,`row${row}/frame${column}: crossed thighs must spread across the seat`);
  }
  const provenance=JSON.parse(readFileSync(new URL('../docs/SOFA-V12-GENERATION.json',import.meta.url)));
  assert.equal(provenance.sha256,createHash('sha256').update(bytes).digest('hex'));
});
test('the TV-facing sofa puts its rear backrest below complete seated heads',()=>{
  for(const[x,y]of HOME_LAYOUT.sofa.people){
    assert.ok(x>=335&&x+32<=422);
    assert.ok(HOME_LAYOUT.tv.y+HOME_LAYOUT.tv.height<y,'Both people face the TV across the room');
    assert.ok(y+32<HOME_LAYOUT.sofa.foreground.y,'Complete heads and upper backs stay above the rear backrest');
    assert.ok(y+40>HOME_LAYOUT.sofa.foreground.y,'The rear backrest naturally hides the folded knees');
  }
});

test('the local furniture patch preserves the original room and its native palette',()=>{
  const provenance=JSON.parse(readFileSync(new URL('../docs/SOFA-TURN-V14-GENERATION.json',import.meta.url)));
  const patchBytes=readFileSync(new URL('../assets/game/home/sofa-back-patch.png',import.meta.url));
  const originalBytes=readFileSync(new URL('../assets/game/home/interior.png',import.meta.url));
  assert.equal(provenance.baseSha256,createHash('sha256').update(originalBytes).digest('hex'));
  assert.equal(provenance.sha256,createHash('sha256').update(patchBytes).digest('hex'));
  assert.deepEqual(provenance.roomRegion,HOME_LAYOUT.sofa.patch);
  const patch=PNG.sync.read(patchBytes),original=PNG.sync.read(originalBytes);
  const palette=new Set(Array.from({length:original.width*original.height},(_,i)=>[...original.data.subarray(i*4,i*4+3)].join(',')));
  assert.deepEqual([patch.width,patch.height],[124,84]);
  for(let i=0;i<patch.data.length;i+=4){
    assert.equal(patch.data[i+3],255);assert.ok(palette.has([...patch.data.subarray(i,i+3)].join(',')));
  }
});
