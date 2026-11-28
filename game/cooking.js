export const RECIPES=Object.freeze([
  {id:'macarrones',label:'Macarrones con queso',short:'Macarrones',frame:0,ingredients:[
    {id:'macarrones',label:'Macarrones',color:'#E7C16D'},{id:'leche',label:'Leche',color:'#FFF5DE'},{id:'queso',label:'Queso',color:'#E7AA43'}],
    color:'#E3AE4C',line:'Con mucho quesito y contigo al lado, ya es mi comida favorita.'},
  {id:'crema',label:'Crema de calabaza',short:'Crema de calabaza',frame:1,ingredients:[
    {id:'calabaza',label:'Calabaza',color:'#D9954E'},{id:'crema',label:'Crema',color:'#FFF0D3'},{id:'caldo',label:'Caldo',color:'#D9BC79'}],
    color:'#D9954E',line:'Te serví la crema con un remolino. Sopla un poquito, que está caliente.'},
  {id:'pastel',label:'Pastel',short:'Pastel',frame:2,ingredients:[
    {id:'harina',label:'Harina',color:'#EED6A6'},{id:'huevo',label:'Huevo',color:'#F5DEAD'},{id:'fresas',label:'Fresas',color:'#CD7581'}],
    color:'#E7AAB5',line:'Te guardé la rebanada con la fresa de arriba.'}
]);
const legacyRecipes=new Map([['pasta','macarrones'],['panqueques','crema'],['galletas','pastel']]);
const count=value=>Math.min(9999,Math.max(0,Math.floor(Number(value)||0)));
export const recipeById=id=>RECIPES.find(recipe=>recipe.id===id)||null;
export function normalizeCooking(value={}){
  const source=value&&typeof value==='object'?value:{};
  const legacy=legacyRecipes.get(source.recipe),recipe=recipeById(legacy??source.recipe);
  // A recipe from the previous menu keeps its count but needs fresh ingredients.
  const prepared=recipe&&!legacy?[...new Set((Array.isArray(source.prepared)?source.prepared:[]).filter(id=>recipe.ingredients.some(ingredient=>ingredient.id===id)))]:[];
  const stirs=prepared.length===3?Math.min(4,count(source.stirs)):0;
  const heat=stirs===4?Math.min(3,count(source.heat)):0;
  const servings=Object.fromEntries(RECIPES.map(item=>[item.id,count(source.servings?.[item.id])]));
  for(const [old,current] of legacyRecipes)servings[current]=count(servings[current]+count(source.servings?.[old]));
  const served=Boolean(recipe&&source.served&&heat===3);
  return {recipe:recipe?.id||null,prepared,stirs,heat,served,servings};
}
export function cookingStage(value){
  const state=normalizeCooking(value);
  return !state.recipe?'choose':state.served?'served':state.prepared.length<3?'prepare':state.stirs<4?'stir':state.heat<3?'cook':'serve';
}
export function chooseRecipe(value,id){
  const state=normalizeCooking(value);if(!recipeById(id))return state;
  return {...state,recipe:id,prepared:[],stirs:0,heat:0,served:false};
}
export function prepareIngredient(value,id){
  const state=normalizeCooking(value),recipe=recipeById(state.recipe);
  if(cookingStage(state)!=='prepare'||!recipe?.ingredients.some(ingredient=>ingredient.id===id)||state.prepared.includes(id))return state;
  return {...state,prepared:[...state.prepared,id]};
}
export function stirRecipe(value){
  const state=normalizeCooking(value);return cookingStage(state)==='stir'?{...state,stirs:state.stirs+1}:state;
}
export function heatRecipe(value){
  const state=normalizeCooking(value);return cookingStage(state)==='cook'?{...state,heat:state.heat+1}:state;
}
export function serveRecipe(value){
  const state=normalizeCooking(value);if(cookingStage(state)!=='serve')return state;
  return {...state,served:true,servings:{...state.servings,[state.recipe]:Math.min(9999,state.servings[state.recipe]+1)}};
}
