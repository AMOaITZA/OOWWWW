import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {removeGlassesPixels} from '../game/glasses.js';
import {recolorHairPixels} from '../game/hair.js';

const read=path=>PNG.sync.read(readFileSync(new URL('../'+path,import.meta.url)));
const patches=read('assets/game/appearance/eyes-without-glasses.png');
const ink=[...patches.data.subarray((2*patches.width+3)*4,(2*patches.width+3)*4+3)];
const pixel=(data,width,frame,x,y)=>[...data.subarray((y*width+frame*32+x)*4,(y*width+frame*32+x)*4+3)];
// Coordinates measured on the native source sheets, independently of the
// runtime's face-box helper. The first pair of numbers is the top of each eye.
const frontal=[
  ['leo','principal',[[10,19],[21,19]],[17,21]],
  ['leo','alternativo',[[9,18],[21,18]],[16,22]],
  ['leo','boda',[[10,18],[21,18]],[17,21]],
  ['itza','principal',[[10,18],[20,18]],[16,21]],
  ['itza','alternativo',[[10,18],[20,18]],[16,22]],
  ['itza','boda',[[9,18],[19,18]],[15,21]]
];

test('both native eyes have matching pupils instead of a remaining lens fragment',()=>{
  for(const [who,look,eyes] of frontal){
    const source=read(look==='boda'?`assets/game/wedding/characters/${who}-walk.png`:
      `assets/game/characters/${who}/look-0${look==='principal'?1:2}.png`);
    for(const color of who==='itza'?['negro','cafe','rosa','rubio']:['negro']){
      const hair=who==='itza'?recolorHairPixels(source,'walk-'+look,color):source.data;
      const result=removeGlassesPixels({...source,data:hair},'walk-'+look,[who],patches);
      for(let frame=0;frame<6;frame++)for(const [x,y] of eyes){
        const offset=who==='itza'&&look==='alternativo'&&frame>=2?-1:0;
        // The bottom of the open pupil is dark on both sides; a blink is a
        // deliberate two-pixel lid on its own row, never a mismatched eye.
        const eyeY=y+offset+(frame===1?0:2);
        for(let dx=0;dx<2;dx++)assert.deepEqual(pixel(result,source.width,frame,x+dx,eyeY),ink,
          `${who}/${look}/${color}/frame${frame}: pupil ${x+dx},${eyeY}`);
      }
    }
  }
});

test('the central old bridge is cleared to a single centered nose shadow',()=>{
  for(const [who,look,,nose] of frontal){
    const source=read(look==='boda'?`assets/game/wedding/characters/${who}-walk.png`:
      `assets/game/characters/${who}/look-0${look==='principal'?1:2}.png`);
    const result=removeGlassesPixels(source,'walk-'+look,[who],patches);
    for(let frame=0;frame<6;frame++){
      const y=nose[1]+(who==='itza'&&look==='alternativo'&&frame>=2?-1:0);
      assert.deepEqual(pixel(result,source.width,frame,nose[0],y),[146,103,89]);
      // Adjacent pixels are skin rather than a second rim/dotted nose column.
      for(const dx of [-1,1])assert.deepEqual(pixel(result,source.width,frame,nose[0]+dx,y),[199,135,104]);
    }
  }
});

test('seated body atlas contains no second generated head or black hair behind personalized heads',()=>{
  const body=read('assets/game/home/seated-bodies.png');
  assert.deepEqual([body.width,body.height],[128,288]);
  let lowerBodyPixels=0;
  for(let row=0;row<6;row++)for(let column=0;column<4;column++){
    let opaque=0;
    for(let y=0;y<48;y++)for(let x=0;x<32;x++){
      const alpha=body.data[((row*48+y)*body.width+column*32+x)*4+3];
      if(y<22)assert.equal(alpha,0,'Generated face/head must not be drawn beneath the real personalized face');
      if(row>=3&&((column>=2&&y<36)||(column<2&&x<=13&&y<38)))
        assert.equal(alpha,0,'Generated long hair must not leave black strands in light selected hair');
      if(y>=36&&alpha)opaque++;
    }
    assert.ok(opaque>10,`row${row}/column${column}: a seated lower body is present`);lowerBodyPixels+=opaque;
  }
  assert.ok(lowerBodyPixels>600);
});
