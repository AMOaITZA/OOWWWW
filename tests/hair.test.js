import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {HAIR_OPTIONS,getHairColor,chooseHairColor,recolorHairPixels,hairVariant} from '../game/hair.js';
const png=path=>PNG.sync.read(readFileSync(new URL('../'+path,import.meta.url)));
const walking=[['walk-principal','assets/game/characters/itza/look-01.png'],
  ['walk-alternativo','assets/game/characters/itza/look-02.png'],
  ['walk-boda','assets/game/wedding/characters/itza-walk.png']];
const sitting=['principal','alternativo','boda'].map(look=>['seat-'+look,'assets/game/moments/seated/itza-'+look+'.png']);
const ceremony=['idle','vows','kiss','hug','celebrate'].map(key=>[key,'assets/game/wedding/characters/'+key+'.png']);
ceremony.push(['wedding-bench-v2','assets/game/wedding/pair-bench-v2.png']);
const colors=['cafe','rosa','rubio'];
function samePixel(a,b,index,message){assert.deepEqual([...a.subarray(index,index+4)],[...b.subarray(index,index+4)],message);}
function unchangedRect(original,result,frameWidth,frame,row,left,top,right,bottom,message){
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    const index=((row*48+y)*original.width+frame*frameWidth+x)*4;
    samePixel(original.data,result,index,message+' '+x+','+y);
  }
}
test('only Itza can choose four hair colors without changing either outfit',()=>{
  assert.deepEqual(HAIR_OPTIONS.map(color=>color.id),['negro','cafe','rosa','rubio']);
  assert.deepEqual(HAIR_OPTIONS.map(color=>color.name),['Negro','Café','Rosa pastel','Rubio claro']);
  const outfits={itza:{look:'boda'},leo:{look:'alternativo'}};
  assert.equal(getHairColor(outfits),'negro');assert.equal(chooseHairColor(outfits,'leo','rosa'),false);
  assert.deepEqual(outfits,{itza:{look:'boda'},leo:{look:'alternativo'}});
  for(const color of HAIR_OPTIONS){assert.equal(chooseHairColor(outfits,'itza',color.id),true);assert.equal(getHairColor(outfits),color.id);}
  assert.equal(chooseHairColor(outfits,'itza','azul'),false);
  assert.equal(outfits.itza.look,'boda');assert.deepEqual(outfits.leo,{look:'alternativo'});
  outfits.itza.hair='obsolete';assert.equal(getHairColor(outfits),'negro');
});
test('black hair preserves the original image object and all original RGBA bytes',()=>{
  for(const [profile,path] of [...walking,...sitting,...ceremony]){
    const original=png(path);
    assert.deepEqual(recolorHairPixels(original,profile,'negro'),new Uint8ClampedArray(original.data));
    assert.equal(hairVariant(original,profile,'negro'),original);
  }
});
test('all 54 walking and six seated frames have visibly different hair colors',()=>{
  for(const [profile,path] of [...walking,...sitting]){
    const original=png(path),rows=original.height/48,columns=original.width/32;
    const variants=colors.map(color=>recolorHairPixels(original,profile,color));
    for(let row=0;row<rows;row++)for(let frame=0;frame<columns;frame++)for(const variant of variants){
      let changed=0;
      for(let y=0;y<48;y++)for(let x=0;x<32;x++){
        const index=((row*48+y)*original.width+frame*32+x)*4;
        if(original.data[index]!==variant[index]||original.data[index+1]!==variant[index+1]||original.data[index+2]!==variant[index+2])changed++;
      }
      assert.ok(changed>=12,`${profile} ${row}/${frame}: ${changed} hair pixels`);
    }
    assert.notDeepEqual(variants[0],variants[1]);assert.notDeepEqual(variants[1],variants[2]);
  }
});
test('pastel pink and light blonde use bright midtones while retaining ink shadows',()=>{
  const original=png(walking[0][1]);
  for(const color of ['rosa','rubio']){
    const output=recolorHairPixels(original,'walk-principal',color),brightness=[];
    for(let index=0;index<original.data.length;index+=4){
      if(output[index]!==original.data[index]||output[index+1]!==original.data[index+1]||output[index+2]!==original.data[index+2])
        brightness.push((output[index]+output[index+1]+output[index+2])/3);
    }
    brightness.sort((a,b)=>a-b);
    assert.ok(brightness[Math.floor(brightness.length/2)]>=160,color+' has a light hair midtone');
    assert.ok(brightness.at(-1)>=210,color+' has pale highlights');
  }
});
test('the side locks beside the cheek and shoulder recolor in every walking frame',()=>{
  // These coordinates are traced on the source sprites, including the exact
  // formerly black strips in the user's alternate and wedding side views.
  const locks=[
    ['walk-principal',walking[0][1],[[17,18],[17,24],[17,29]]],
    ['walk-alternativo',walking[1][1],[[18,14],[17,19],[17,22],[18,27]]],
    ['walk-boda',walking[2][1],[[17,20],[18,23],[18,25]]]
  ];
  for(const [profile,path,points] of locks){
    const original=png(path);
    for(const color of colors){
      const result=recolorHairPixels(original,profile,color);
      for(let frame=0;frame<6;frame++)for(const [x,y] of points){
        const index=((48+y)*original.width+frame*32+x)*4;
        assert.equal(original.data[index+3],255,'The regression point must be visible hair');
        assert.notDeepEqual([...result.subarray(index,index+3)],
          [...original.data.subarray(index,index+3)],`${profile} ${frame}/${x},${y} ${color}`);
      }
    }
  }
});
test('the reported bridal fringe, front neck lock and rear lock below the veil all recolor',()=>{
  const original=png(walking[2][1]);
  // Traced directly on the unchanged 32×48 bridal cells. These are hair
  // interiors (not the glasses, flower outline or the two exposed arms).
  const reportedLocks=[
    [0,[[18,11],[20,14],[23,16],[22,23],[17,26],[20,27],[19,28],[20,31]]],
    [1,[[5,34]]],
    [2,[[7,27],[6,31],[7,34]]]
  ];
  for(const color of colors){
    const output=recolorHairPixels(original,'walk-boda',color);
    for(const [row,points] of reportedLocks)for(let frame=0;frame<6;frame++)for(const [x,y] of points){
      const index=((row*48+y)*original.width+frame*32+x)*4;
      assert.equal(original.data[index+3],255,'The regression coordinate must contain hair');
      assert.notDeepEqual([...output.subarray(index,index+3)],[...original.data.subarray(index,index+3)],
        `Bridal ${color}, view ${row}, frame ${frame}: hair at ${x},${y} must not stay black`);
    }
  }
});
test('bridal veil, flower, face and the actual gown remain intact beside the repaired locks',()=>{
  const original=png(walking[2][1]);
  for(const color of colors){
    const output=recolorHairPixels(original,'walk-boda',color);
    for(let frame=0;frame<6;frame++){
      // The white/cream veil and flower have many generated highlight
      // shades. Preserve all of them, rather than only three skin entries.
      for(let row=0;row<3;row++)for(let y=0;y<48;y++)for(let x=0;x<32;x++){
        const index=((row*48+y)*original.width+frame*32+x)*4;
        if(original.data[index+3]&&Math.max(...original.data.subarray(index,index+3))>112)
          samePixel(original.data,output,index,'Bridal veil/flower/skin/gown');
      }
      unchangedRect(original,output,32,frame,0,10,28,17,39,'front gown');
      unchangedRect(original,output,32,frame,1,18,28,27,39,'side gown/arm');
      unchangedRect(original,output,32,frame,2,10,40,26,46,'rear gown');
    }
  }
});
test('hair color preserves alpha, skin reference and all lower boots/trousers pixels',()=>{
  const skin=new Set(['199,135,104','146,103,89','211,178,160']);
  for(const [profile,path] of [...walking,...sitting,...ceremony]){
    const original=png(path);
    for(const color of colors){
      const result=recolorHairPixels(original,profile,color);
      for(let index=0;index<original.data.length;index+=4){
        assert.equal(result[index+3],original.data[index+3],profile+' alpha');
        const y=Math.floor(index/4/original.width)%48;
        if(skin.has([...original.data.subarray(index,index+3)].join(','))||y>=40)
          samePixel(original.data,result,index,profile+' skin/shoes');
      }
    }
  }
});
test('front glasses and central leather/hoodie clothing remain byte-identical',()=>{
  for(const [profile,path] of [...walking,...sitting]){
    const original=png(path),columns=original.width/32;
    for(const color of colors){
      const result=recolorHairPixels(original,profile,color);
      for(let frame=0;frame<columns;frame++){
        const left=profile==='walk-boda'?6:profile==='seat-boda'?10:profile.startsWith('seat-')?9:8,right=23;
        // Seated heads are two pixels higher: their actual lens bands are
        // y15–19. The former y17–21 rectangle also covered the hair tips.
        unchangedRect(original,result,32,frame,0,left,profile.startsWith('seat-')?15:17,right,profile.startsWith('seat-')?19:21,profile+' glasses');
        // In the bride's front view x19,y28 is the inner edge of a long
        // hair lock, not the gown. Keep the protected gown/neck rectangle
        // through x18; its formerly black lock is tested separately below.
        unchangedRect(original,result,32,frame,0,12,28,profile==='walk-boda'?18:profile==='walk-principal'||profile.startsWith('seat-')?21:22,33,profile+' central outfit');
        if(profile==='walk-principal'){
          unchangedRect(original,result,32,frame,1,18,27,22,37,profile+' side jacket');
          unchangedRect(original,result,32,frame,1,17,34,22,37,profile+' lower side jacket');
        }
        if(profile==='walk-alternativo'){
          unchangedRect(original,result,32,frame,1,20,27,22,37,profile+' side jacket');
          unchangedRect(original,result,32,frame,1,17,30,22,37,profile+' lower side jacket');
          unchangedRect(original,result,32,frame,1,13,27,16,34,profile+' rear hoodie');
        }
      }
    }
  }
});
test('alternate cap fabric remains original black',()=>{
  for(const [profile,path] of [walking[1],sitting[1]]){
    const original=png(path),columns=original.width/32;
    for(const color of colors){
      const result=recolorHairPixels(original,profile,color);
      for(let frame=0;frame<columns;frame++){
        unchangedRect(original,result,32,frame,0,10,0,23,10,'cap crown');
        if(profile==='walk-alternativo')unchangedRect(original,result,32,frame,1,3,15,9,19,'projecting cap bill');
      }
    }
  }
});
test('all 16 shared ceremony frames change Itza hair while preserving Leo and costumes',()=>{
  for(const [profile,path] of ceremony){
    const original=png(path),columns=original.width/64;
    for(const color of colors){
      const result=recolorHairPixels(original,profile,color);
      for(let frame=0;frame<columns;frame++){
        unchangedRect(original,result,64,frame,0,0,0,29,47,profile+' Leo');
        unchangedRect(original,result,64,frame,0,30,40,63,47,profile+' lower costumes');
        let changed=0;
        for(let y=0;y<40;y++)for(let x=30;x<64;x++){
          const index=(y*original.width+frame*64+x)*4;
          if(original.data[index]!==result[index]||original.data[index+1]!==result[index+1]||original.data[index+2]!==result[index+2])changed++;
        }
        assert.ok(changed>=50,profile+' '+frame+' '+color+' visible Itza hair');
      }
    }
  }
});
