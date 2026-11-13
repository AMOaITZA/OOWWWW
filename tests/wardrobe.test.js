import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogs,getLookOptions,getChoice,chooseOutfit,equipmentUrls} from '../game/wardrobe.js';
test('characters have original, alternate and ceremony looks without layered parts',()=>{
  for(const who of ['leo','itza']){
    const looks=getLookOptions(who);
    assert.equal(looks.length,3);
    assert.equal(looks[0].id,'principal');
    assert.equal(looks[1].id,'alternativo');
    assert.equal(looks[2].id,'boda');
    for(const look of looks.slice(0,2)){
      assert.ok(look.sheet.startsWith('/assets/game/characters/'+who+'/'));
      assert.ok(look.sheet.endsWith('.png'));
    }
    assert.equal(looks[2].sheet,'wedding:'+who+'-walk');
  }
});
test('outfits are independent and save the complete look',()=>{
  const outfits={leo:{},itza:{}};
  assert.equal(getChoice(outfits,'leo'),'principal');
  assert.equal(getChoice(outfits,'itza'),'principal');
  assert.ok(chooseOutfit(outfits,'itza','alternativo'));
  assert.equal(getChoice(outfits,'itza'),'alternativo');
  assert.equal(getChoice(outfits,'leo'),'principal');
  assert.equal(chooseOutfit(outfits,'leo','inventado'),false);
  assert.equal(equipmentUrls(outfits).length,2);
  const recovered=JSON.parse(JSON.stringify(outfits));
  assert.equal(getChoice(recovered,'itza'),'alternativo');
});
test('old layered saves fall back to the main outfit',()=>{
  const old={leo:{top:'guinda'},itza:{hair:'largo'}};
  assert.equal(getChoice(old,'leo'),'principal');
  assert.equal(getChoice(old,'itza'),'principal');
});

test('wedding outfit can be chosen independently and persisted',()=>{
 const outfits={leo:{},itza:{}};
 assert.equal(chooseOutfit(outfits,'leo','boda'),true);
 assert.equal(chooseOutfit(outfits,'itza','boda'),true);
 assert.equal(getChoice(JSON.parse(JSON.stringify(outfits)),'leo'),'boda');
 assert.equal(getChoice(JSON.parse(JSON.stringify(outfits)),'itza'),'boda');
});

test('unavailable saved looks fall back without erasing the saved preference',()=>{
  const outfits={leo:{look:'alternativo'},itza:{look:'boda'}};
  const installed=sheet=>!sheet.endsWith('look-02.png');
  assert.equal(getChoice(outfits,'leo',installed),'principal');
  assert.equal(getChoice(outfits,'itza',installed),'boda');
  assert.equal(outfits.leo.look,'alternativo');
  assert.equal(chooseOutfit(outfits,'leo','alternativo',installed),false);
  assert.equal(chooseOutfit(outfits,'leo','boda',installed),true);
});
test('no loaded sheets means no available selection',()=>{
  assert.equal(getChoice({leo:{look:'principal'}},'leo',()=>false),null);
});
