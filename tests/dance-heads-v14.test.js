import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PNG} from 'pngjs';
import {splitCharacterHeadPixels} from '../game/character-head.js';
import {recolorHairPixels} from '../game/hair.js';
import {removeGlassesPixels} from '../game/glasses.js';

// Measured chin/outline pixels in the original artwork, below the old row-24
// cutoff. These are anatomy coordinates, independent of the extraction masks.
const jawPoints={
  leo:{principal:[[[15,24],[18,24],[12,24]],[[19,23],[22,23]]],
    alternativo:[[[11,26],[20,26],[12,27]],[[16,25],[22,25],[18,26]]],
    boda:[[[13,25],[20,25],[14,26]],[[17,24],[23,24],[18,25]]]},
  itza:{principal:[[[14,24],[20,24],[14,25]],[[20,23],[21,24]]],
    alternativo:[[[14,25],[18,25],[16,26]],[[21,24],[24,24],[23,25]]],
    boda:[[[10,25],[16,25],[13,26]],[[21,24],[24,24],[24,25]]]}
};
const png=path=>PNG.sync.read(fs.readFileSync(new URL('../'+path,import.meta.url)));
const eyes=png('assets/game/appearance/eyes-without-glasses.png');
function sheet(who,look){return png(look==='boda'?'assets/game/wedding/characters/'+who+'-walk.png':
  'assets/game/characters/'+who+'/look-0'+(look==='principal'?1:2)+'.png');}
test('every measured native jaw and its outline survive hair and glasses customization',()=>{
  for(const who of ['leo','itza'])for(const look of ['principal','alternativo','boda']){
    const raw=sheet(who,look),profile='walk-'+look;
    for(const hair of who==='itza'?['negro','cafe','rosa','rubio']:['negro'])for(const glasses of [true,false]){
      let data=who==='itza'?recolorHairPixels(raw,profile,hair):new Uint8ClampedArray(raw.data);
      if(!glasses)data=removeGlassesPixels({...raw,data},profile,[who],eyes);
      const personalized={...raw,data};
      for(let direction=0;direction<2;direction++){
        const split=splitCharacterHeadPixels(personalized,raw,{who,look,direction});
        for(const [x,y] of jawPoints[who][look][direction]){
          const from=((direction*48+y)*raw.width+x)*4,to=(y*40+x+4)*4;
          assert.equal(personalized.data[from+3],255,`${who}/${look}: measured point must belong to the native contour`);
          assert.deepEqual([...split.head.subarray(to,to+4)],[...personalized.data.subarray(from,from+4)],
            `${who}/${look}/${hair}/${glasses}/${direction}: chin at ${x},${y} must not be cropped`);
        }
      }
    }
  }
});
test('only a narrow native neck continues below the jaw, leaving generated action arms free',()=>{
  for(const [who,look,direction,x,y] of [['leo','boda',0,13,30],['leo','principal',0,11,27],
    ['leo','alternativo',1,10,27],['itza','boda',0,9,29],['itza','alternativo',0,9,29]]){
    const raw=sheet(who,look),split=splitCharacterHeadPixels(raw,raw,{who,look,direction});
    assert.equal(split.head[(y*40+x+4)*4+3],0,`${who}/${look}: old shirt/arm cannot cover the action body`);
  }
});
