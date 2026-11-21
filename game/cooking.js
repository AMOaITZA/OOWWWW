export const RECIPES=Object.freeze([
  {id:'panqueques',label:'Panqueques con fresas',short:'Panqueques',ingredients:[{id:'harina',label:'Harina',color:'#EED6A6'},{id:'leche',label:'Leche',color:'#FFF5DE'},{id:'fresas',label:'Fresas',color:'#C96E72'}],color:'#DBAB63',line:'El ingrediente que más me gusta es cocinar contigo.'},
  {id:'pasta',label:'Pasta de nuestro domingo',short:'Pasta',ingredients:[{id:'pasta',label:'Pasta',color:'#E8BF6A'},{id:'tomate',label:'Tomate',color:'#C86D58'},{id:'albahaca',label:'Albahaca',color:'#7D9B64'}],color:'#D78A58',line:'Si todos los domingos son así, ya tengo mi plan favorito.'},
  {id:'galletas',label:'Galletitas de chocolate',short:'Galletitas',ingredients:[{id:'harina',label:'Harina',color:'#EED6A6'},{id:'mantequilla',label:'Mantequilla',color:'#F0C873'},{id:'chocolate',label:'Chocolate',color:'#795044'}],color:'#BF8A58',line:'Una para ti, una para mí… y el último pedacito lo compartimos.'}
]);
const count=value=>Math.min(9999,Math.max(0,Math.floor(Number(value)||0)));
export const recipeById=id=>RECIPES.find(recipe=>recipe.id===id)||null;
export function normalizeCooking(value={}){
  const recipe=recipeById(value?.recipe),source=value&&typeof value==='object'?value:{};
  const prepared=recipe?[...new Set((Array.isArray(source.prepared)?source.prepared:[]).filter(id=>recipe.ingredients.some(ingredient=>ingredient.id===id)))]:[];
  const stirs=prepared.length===3?Math.min(4,count(source.stirs)):0;
  const heat=stirs===4?Math.min(3,count(source.heat)):0;
  const servings=Object.fromEntries(RECIPES.map(item=>[item.id,count(source.servings?.[item.id])]));
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
