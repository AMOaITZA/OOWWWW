import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogs,SLOTS,getChoice,chooseOutfit,equipmentUrls} from '../game/wardrobe.js';
test('separate Leo and Itza catalogues have default clothes',()=>{
  for(const who of ['leo','itza'])for(const slot of SLOTS){
    assert.ok(catalogs[who][slot].length>0,who+'/'+slot);
    assert.ok(catalogs[who][slot].some(item=>item.default),who+'/'+slot);
  }
});
test('selected outfits and removals are independent',()=>{
  const outfits={leo:{},itza:{}};
  assert.equal(getChoice(outfits,'leo','top'),'guinda');
  assert.equal(getChoice(outfits,'itza','top'),'negra');
  chooseOutfit(outfits,'leo','top','beige');
  chooseOutfit(outfits,'itza','accessories',null);
  assert.equal(getChoice(outfits,'leo','top'),'beige');
  assert.equal(getChoice(outfits,'itza','top'),'negra');
  assert.equal(getChoice(outfits,'itza','accessories'),null);
  assert.ok(equipmentUrls(outfits).every(x=>x.startsWith('/assets/game/characters/')));
});
