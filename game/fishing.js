export const PLUSHIES=Object.freeze([
  {id:'freddy',name:'Freddy',rarity:'Común',weight:30},
  {id:'bonnie',name:'Bonnie',rarity:'Común',weight:25},
  {id:'chica',name:'Chica',rarity:'Común',weight:25},
  {id:'foxy',name:'Foxy',rarity:'Especial',weight:15},
  {id:'golden-freddy',name:'Golden Freddy',rarity:'Dorado',weight:5}
].map(plushie=>Object.freeze({...plushie,image:'/assets/game/fishing/'+plushie.id+'.png'})));

const integer=(value,max=1000000)=>typeof value==='number'&&Number.isFinite(value)
  ?Math.min(max,Math.max(0,Math.floor(value))):0;

export function normalizeFishing(saved){
  const collection={};
  for(const {id} of PLUSHIES){
    const count=integer(saved?.collection?.[id],9999);
    if(count)collection[id]=count;
  }
  const total=Object.values(collection).reduce((sum,count)=>sum+count,0);
  const catches=Math.max(total,integer(saved?.catches));
  return {collection,catches,casts:Math.max(catches,integer(saved?.casts))};
}

export function collectedPlushies(saved){
  const state=normalizeFishing(saved);
  return PLUSHIES.filter(({id})=>state.collection[id]>0).length;
}
export const hasAllPlushies=saved=>collectedPlushies(saved)===PLUSHIES.length;

// Rarity determines the order of discoveries. Missing plushies have priority,
// so the quest takes five successful catches instead of an unbounded grind.
export function selectPlushie(saved,random=Math.random){
  const state=normalizeFishing(saved),missing=PLUSHIES.filter(({id})=>!state.collection[id]);
  const pool=missing.length?missing:PLUSHIES;
  const sample=random(),fraction=typeof sample==='number'&&Number.isFinite(sample)
    ?Math.min(.999999999,Math.max(0,sample)):0;
  let point=fraction*pool.reduce((sum,plushie)=>sum+plushie.weight,0);
  for(const plushie of pool){point-=plushie.weight;if(point<0)return plushie;}
  return pool.at(-1);
}

export function recordCast(saved){
  const state=normalizeFishing(saved);state.casts=Math.min(1000000,state.casts+1);return state;
}
export function recordCatch(saved,id){
  const state=normalizeFishing(saved);
  if(!PLUSHIES.some(plushie=>plushie.id===id))return state;
  state.collection[id]=Math.min(9999,(state.collection[id]||0)+1);
  state.catches=Math.min(1000000,state.catches+1);
  state.casts=Math.max(state.casts,state.catches);return state;
}

export const FISHING_WAIT_MS=1500;
export const FISHING_BITE_MS=2800;
