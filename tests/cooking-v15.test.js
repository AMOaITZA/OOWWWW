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
  let state=chooseRecipe({},'pastel');state=prepareIngredient(state,'harina');
  assert.deepEqual(prepareIngredient(state,'harina'),state);
  assert.deepEqual(prepareIngredient(state,'tomate'),state);
  state.servings.macarrones=4;const changed=chooseRecipe(state,'crema');
  assert.equal(changed.servings.macarrones,4);assert.deepEqual(changed.prepared,[]);
  assert.deepEqual(chooseRecipe(changed,'unknown'),changed);
});
test('corrupt or interrupted save cannot bypass cooking stages',()=>{
  const bad=normalizeCooking({recipe:'macarrones',prepared:['macarrones','macarrones','x'],stirs:100,heat:100,served:true,servings:{pasta:-10,galletas:Infinity}});
  assert.deepEqual(bad.prepared,['macarrones']);assert.equal(bad.stirs,0);assert.equal(bad.heat,0);assert.equal(bad.served,false);
  assert.equal(bad.servings.macarrones,0);assert.equal(bad.servings.pastel,9999);
  assert.equal(cookingStage(null),'choose');
});

test('a legacy recipe restarts at ingredients and keeps old and new serving counts after reloading',()=>{
  const old={recipe:'galletas',prepared:['harina','mantequilla','chocolate'],stirs:4,heat:3,served:true,
    servings:{pasta:1,macarrones:2,panqueques:4,galletas:3}};
  const converted=normalizeCooking(old);
  assert.equal(converted.recipe,'pastel');
  assert.equal(cookingStage(converted),'prepare');
  assert.deepEqual(converted.servings,{macarrones:3,crema:4,pastel:3});
  assert.deepEqual(normalizeCooking(converted),converted);
});
