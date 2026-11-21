import test from 'node:test';
import assert from 'node:assert/strict';
import {RECIPES,normalizeCooking,cookingStage,chooseRecipe,prepareIngredient,stirRecipe,heatRecipe,serveRecipe} from '../game/cooking.js';
test('all recipes require every ingredient, mixing and heat before serving',()=>{
  for(const recipe of RECIPES){
    let state=chooseRecipe({},recipe.id);
    assert.equal(cookingStage(state),'prepare');
    assert.deepEqual(serveRecipe(state),state);
    assert.deepEqual(heatRecipe(state),state);
    for(const ingredient of recipe.ingredients)state=prepareIngredient(state,ingredient.id);
    assert.equal(cookingStage(state),'stir');
    for(let i=0;i<4;i++)state=stirRecipe(state);
    assert.equal(cookingStage(state),'cook');
    for(let i=0;i<3;i++)state=heatRecipe(state);
    assert.equal(cookingStage(state),'serve');
    state=serveRecipe(state);assert.equal(state.servings[recipe.id],1);
    assert.deepEqual(serveRecipe(state),state,'serving twice never duplicates a reward');
    assert.equal(cookingStage(state),'served');
  }
});
test('cooking rejects foreign/duplicate ingredients and preserves the recipe book',()=>{
  let state=chooseRecipe({},'panqueques');state=prepareIngredient(state,'harina');
  assert.deepEqual(prepareIngredient(state,'harina'),state);
  assert.deepEqual(prepareIngredient(state,'tomate'),state);
  state.servings.pasta=4;const changed=chooseRecipe(state,'galletas');
  assert.equal(changed.servings.pasta,4);assert.deepEqual(changed.prepared,[]);
  assert.deepEqual(chooseRecipe(changed,'unknown'),changed);
});
test('corrupt or interrupted save cannot bypass cooking stages',()=>{
  const bad=normalizeCooking({recipe:'pasta',prepared:['pasta','pasta','x'],stirs:100,heat:100,served:true,servings:{pasta:-10,galletas:Infinity}});
  assert.deepEqual(bad.prepared,['pasta']);assert.equal(bad.stirs,0);assert.equal(bad.heat,0);assert.equal(bad.served,false);
  assert.equal(bad.servings.pasta,0);assert.equal(bad.servings.galletas,9999);
  assert.equal(cookingStage(null),'choose');
});
