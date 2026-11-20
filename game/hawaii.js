export const HAWAII_SIZE=Object.freeze({width:640,height:400});
export const HAWAII_ZONES=Object.freeze([
  {id:'bar',label:'Bar de la playa',x:108,y:191,radius:44,arrival:{x:112,y:207}},
  {id:'dance',label:'Bailar junto al mar',x:275,y:228,radius:44,arrival:{x:275,y:228}},
  {id:'giraffe',label:'El jardín de la jirafa',x:531,y:204,radius:58,arrival:{x:503,y:218}}
]);
export const HAWAII_DRINKS=Object.freeze([
  {id:'pina',label:'Piña de la playa',detail:'Piña, hielo y una sombrillita',color:'#E5BC62',cost:2},
  {id:'mango',label:'Mango al atardecer',detail:'Mango dulce con un toque de limón',color:'#E79A5D',cost:2},
  {id:'coco',label:'Coco para dos',detail:'Agüita de coco bien fresquita',color:'#E8D7AE',cost:2}
]);
const integer=(value,fallback=0)=>Number.isInteger(value)&&value>=0?Math.min(999999,value):fallback;
export function normalizeHawaii(saved){
  return {visits:integer(saved?.visits),dances:integer(saved?.dances),giraffePets:integer(saved?.giraffePets),
    shells:integer(saved?.shells,12),drinks:Object.fromEntries(HAWAII_DRINKS.map(({id})=>[id,integer(saved?.drinks?.[id])])),
    lastDrink:HAWAII_DRINKS.some(({id})=>id===saved?.lastDrink)?saved.lastDrink:null};
}
export function visitHawaii(saved){const state=normalizeHawaii(saved);state.visits=integer(state.visits+1);return state;}
export function danceInHawaii(saved){
  const state=normalizeHawaii(saved);state.dances=integer(state.dances+1);state.shells=integer(state.shells+3);return state;
}
export function buyHawaiiDrink(saved,id){
  const state=normalizeHawaii(saved),drink=HAWAII_DRINKS.find(drink=>drink.id===id);
  if(!drink||state.shells<drink.cost)return {state,bought:false};
  state.shells-=drink.cost;state.drinks[id]=integer(state.drinks[id]+1);state.lastDrink=id;
  return {state,bought:true};
}
export function petHawaiiGiraffe(saved){const state=normalizeHawaii(saved);state.giraffePets=integer(state.giraffePets+1);return state;}
export function hawaiiZoneAt(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return HAWAII_ZONES.find(zone=>Math.hypot(x-zone.x,y-zone.y)<=zone.radius)||null;
}
// The walkable beach stays inland from the water and outside the bar's roof.
export function hawaiiWalkable(x,y){
  return Number.isFinite(x)&&Number.isFinite(y)&&x>=32&&x<=606&&y>=184&&y<=310&&
    !(x<166&&y<195)&&!(x>390&&y<218);
}
export function nearestHawaiiPoint(x,y){
  let px=Number.isFinite(x)?Math.max(32,Math.min(606,x)):320;
  let py=Number.isFinite(y)?Math.max(184,Math.min(310,y)):300;
  if(px<166&&py<195)py=195;
  if(px>390&&py<218)py=218;
  return {x:px,y:py};
}
