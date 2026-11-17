import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {getGlasses,chooseGlasses,removeGlassesPixels,eyeRegion} from '../game/glasses.js';
const read=path=>PNG.sync.read(readFileSync(new URL('../'+path,import.meta.url)));
const patches=read('assets/game/appearance/eyes-without-glasses.png');
const paths=who=>[['walk-principal','assets/game/characters/'+who+'/look-01.png'],
  ['walk-alternativo','assets/game/characters/'+who+'/look-02.png'],
  ['walk-boda','assets/game/wedding/characters/'+who+'-walk.png'],
  ...['principal','alternativo','boda'].map(look=>['seat-'+look,'assets/game/moments/seated/'+who+'-'+look+'.png'])];
test('glasses default to on and can be chosen independently without changing hair or clothes',()=>{
  const outfits={itza:{look:'boda',hair:'rosa'},leo:{look:'alternativo'}};
  assert.equal(getGlasses(outfits,'itza'),true);assert.equal(getGlasses(outfits,'leo'),true);
  assert.equal(chooseGlasses(outfits,'itza',false),true);assert.equal(getGlasses(outfits,'leo'),true);
  chooseGlasses(outfits,'leo',false);chooseGlasses(outfits,'itza',true);
  assert.deepEqual(outfits,{itza:{look:'boda',hair:'rosa',glasses:true},leo:{look:'alternativo',glasses:false}});
  assert.equal(chooseGlasses(outfits,'unknown',false),false);assert.equal(chooseGlasses(outfits,'leo','off'),false);
});
test('eye artwork has eight transparent cells with actual natural eye pixels',()=>{
  assert.deepEqual([patches.width,patches.height],[72,16]);
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){
    let dark=0,skin=0;for(let y=0;y<8;y++)for(let x=0;x<18;x++){
      const i=((row*8+y)*72+col*18+x)*4,a=patches.data[i+3];assert.ok(a===0||a===255);
      if(a&&patches.data[i]<74)dark++;if(a&&patches.data[i]===199)skin++;
    }
    assert.ok(dark>=2,'Eye/eyelid is present rather than a blank skin cover');assert.ok(skin>10);
  }
});
test('all front/profile and seated frames remove glasses while keeping alpha and clothing intact',()=>{
  for(const who of ['itza','leo'])for(const [profile,path] of paths(who)){
    const source=read(path),output=removeGlassesPixels(source,profile,[who],patches),fw=32;
    for(let row=0;row<source.height/48;row++)for(let frame=0;frame<source.width/fw;frame++){
      let changes=0;for(let y=0;y<48;y++)for(let x=0;x<32;x++){
        const i=((row*48+y)*source.width+frame*fw+x)*4;
        assert.equal(output[i+3],source.data[i+3]);
        const changed=output[i]!==source.data[i]||output[i+1]!==source.data[i+1]||output[i+2]!==source.data[i+2];
        if(changed)changes++;
        if(y>=26||row===2)assert.deepEqual([...output.subarray(i,i+4)],[...source.data.subarray(i,i+4)],profile+' clothing/back');
      }
      assert.ok(row===2?changes===0:changes>=6,who+' '+profile+' '+row+'/'+frame+' changes '+changes);
    }
    assert.deepEqual(removeGlassesPixels(source,profile,[],patches),new Uint8ClampedArray(source.data));
  }
});
test('the former bottom rims of Leo bridal front and alternate profile are cleared',()=>{
  for(const [profile,path,row,y] of [['walk-boda','assets/game/wedding/characters/leo-walk.png',0,21],
    ['walk-alternativo','assets/game/characters/leo/look-02.png',1,22]]){
    const source=read(path),output=removeGlassesPixels(source,profile,['leo'],patches);
    const r=eyeRegion(source,profile,'leo',0,row);assert.ok(y>=r.y&&y<r.y+r.height);
    for(let x=r.x;x<r.x+r.width;x++){
      // This single warm central pixel is the bridal nose shadow between
      // the two lower rims. Keep its original anatomy while clearing rims.
      if(profile==='walk-boda'&&x===15){
        const nose=((row*48+y)*source.width+x)*4;
        assert.deepEqual([...output.subarray(nose,nose+4)],[...source.data.subarray(nose,nose+4)]);
        continue;
      }
      const i=((row*48+y)*source.width+x)*4;
      if(!source.data[i+3])continue;
      assert.ok(output[i]>=146,'No dark rectangular lower frame remains');
    }
  }
});
test('paired ceremony toggles affect only their own face and preserve costumes',()=>{
  for(const profile of ['idle','vows','kiss','hug','celebrate','wedding-bench-v2']){
    const source=read(profile==='wedding-bench-v2'?'assets/game/wedding/pair-bench-v2.png':'assets/game/wedding/characters/'+profile+'.png');
    for(const who of ['itza','leo']){
      const output=removeGlassesPixels(source,profile,[who],patches);
      for(let frame=0;frame<source.width/64;frame++){
        let changes=0;for(let y=0;y<48;y++)for(let x=0;x<64;x++){
          const i=(y*source.width+frame*64+x)*4,changed=output[i]!==source.data[i]||output[i+1]!==source.data[i+1]||output[i+2]!==source.data[i+2];
          assert.equal(output[i+3],source.data[i+3]);
          if(changed)changes++;
          if(y>=25||(who==='leo'?x>=32:x<31))assert.deepEqual([...output.subarray(i,i+4)],[...source.data.subarray(i,i+4)],profile+' other person/costume');
        }
        assert.ok(changes>=6,profile+' '+frame+' '+who+' has no unchanged glasses');
      }
    }
  }
});
