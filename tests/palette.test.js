import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import pngjs from 'pngjs';

// These are the original reference complexion colours, preserved when the
// new generated characters are packed. Lighting is baked into the new art.
const skin=[[199,135,104],[146,103,89],[211,178,160]];
const skinKey=color=>color.join(',');
const sources=['leo','itza'].flatMap(who=>[
  'assets/game/characters/'+who+'/look-01.png',
  'assets/game/characters/'+who+'/look-02.png',
  'assets/game/wedding/characters/'+who+'-walk.png'
]);

test('all current walking looks retain the reference skin palette as actual opaque pixels',()=>{
  for(const path of sources){
    const image=pngjs.PNG.sync.read(readFileSync(new URL('../'+path,import.meta.url)));
    const counts=new Map(skin.map(color=>[skinKey(color),0]));
    for(let i=0;i<image.data.length;i+=4){
      const key=[...image.data.slice(i,i+3)].join(',');
      if(!counts.has(key)||!image.data[i+3])continue;
      assert.equal(image.data[i+3],255,path+' piel con alfa intermedia');
      counts.set(key,counts.get(key)+1);
    }
    assert.ok(counts.get(skinKey(skin[0]))>0,path+' debe conservar el tono de piel principal');
    assert.ok(counts.get(skinKey(skin[1]))>0,path+' debe conservar la sombra de piel de referencia');
  }
});

test('the front-facing faces keep the reference complexion in every walking frame',()=>{
  for(const path of sources){
    const image=pngjs.PNG.sync.read(readFileSync(new URL('../'+path,import.meta.url)));
    for(let col=0;col<6;col++){
      let mainSkin=0;
      // Faces occupy the upper half; outfit colours below cannot satisfy this.
      for(let y=1;y<26;y++)for(let x=1;x<31;x++){
        const i=(y*image.width+col*32+x)*4;
        if(image.data[i+3]===255&&skin[0].every((value,j)=>image.data[i+j]===value))mainSkin++;
      }
      assert.ok(mainSkin>0,path+' necesita piel de referencia en la cara del frame '+col);
    }
  }
});
