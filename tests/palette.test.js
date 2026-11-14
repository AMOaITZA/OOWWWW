import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import pngjs from 'pngjs';
import {relightPixel,relightImageData} from '../game/palette.js';

const skin=[[199,135,104],[146,103,89],[211,178,160]];
test('lighting preserves all original skin RGB values exactly',()=>{
  for(const color of skin)assert.deepEqual(relightPixel(...color),color);
});
test('lighting lifts a named dark hair shade without altering alpha',()=>{
  const original=[26,25,31];
  const lit=relightPixel(...original);
  assert.ok(lit.reduce((sum,value)=>sum+value,0)>original.reduce((sum,value)=>sum+value,0));
  const data=new Uint8ClampedArray([...original,255,...skin[0],128,0,0,0,0]);
  relightImageData(data);
  assert.deepEqual([...data.slice(4,8)],[...skin[0],128]);
  assert.deepEqual([data[3],data[7],data[11]],[255,128,0]);
});
test('every skin pixel in both original sheets retains its exact color after relighting',()=>{
  const protectedColors=new Set(skin.map(color=>color.join(',')));
  for(const who of ['leo','itza']){
    const original=pngjs.PNG.sync.read(readFileSync(new URL('../assets/game/characters/'+who+'/look-01.png',import.meta.url)));
    const result=new Uint8ClampedArray(original.data);
    relightImageData(result);
    let preserved=0;
    for(let i=0;i<original.data.length;i+=4){
      if(!original.data[i+3]||!protectedColors.has([...original.data.slice(i,i+3)].join(',')))continue;
      assert.deepEqual([...result.slice(i,i+4)],[...original.data.slice(i,i+4)],who+' piel alterada en píxel '+i/4);
      preserved++;
    }
    assert.ok(preserved>1000,'La prueba debe cubrir piel real, no una hoja vacía');
  }
});

test('wedding indexed shadow is lit while every warm atlas pixel keeps its RGB',()=>{
  const atlas=pngjs.PNG.sync.read(readFileSync(new URL('../assets/game/wedding/atlas.png',import.meta.url)));
  const lit=new Uint8ClampedArray(atlas.data);relightImageData(lit);
  let warmPreserved=0,shadowChanged=0;
  for(let i=0;i<atlas.data.length;i+=4){
    const [r,g,b,a]=atlas.data.slice(i,i+4);if(a<128)continue;
    if(r===25&&g===22&&b===25){
      assert.deepEqual([...lit.slice(i,i+3)],[42,39,46]);shadowChanged++;
    }
    if(r-g>=15&&g>=b){assert.deepEqual([...lit.slice(i,i+4)],[r,g,b,a]);warmPreserved++;}
  }
  assert.ok(shadowChanged>10000,'Debe iluminar sombras reales del atlas');
  assert.ok(warmPreserved>10000,'Los tonos cálidos reales, incluida la piel, deben conservarse');
});
