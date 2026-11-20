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
test('TV bodies sit on the cushions and the sofa front never chops their legs',()=>{
  for(const[x,y]of HOME_LAYOUT.sofa.people){
    assert.ok(x>=335&&x+32<=422);
    assert.ok(y+40>=194&&y+46<=207,'Folded legs rest on the seat rather than on the decorative pillows');
    assert.ok(HOME_LAYOUT.sofa.foreground.y>=y+48,'Only the front lip belongs above the actors');
  }
});
