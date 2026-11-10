import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogs,getLookOptions,getChoice,chooseOutfit,equipmentUrls} from '../game/wardrobe.js';
test('there are exactly two complete character looks without layered parts',()=>{
  for(const who of ['leo','itza']){
    const looks=getLookOptions(who);
    assert.equal(looks.length,2);
    assert.equal(looks[0].id,'principal');
    assert.equal(looks[1].id,'alternativo');
    for(const look of looks){
      assert.ok(look.sheet.startsWith('/assets/game/characters/'+who+'/'));
      assert.ok(look.sheet.endsWith('.png'));
    }
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
