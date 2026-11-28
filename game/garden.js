export const GARDEN_SIZE=Object.freeze({width:640,height:400});
export const GARDEN_GROW_SECONDS=7;
export const GARDEN_FLOWERS=Object.freeze([
  {id:'cosmos',label:'Cosmos rosa',short:'Cosmos',color:'#E4A1AD',frame:0,line:'Estas florecitas tienen tu color de ternura.'},
  {id:'lavanda',label:'Lavanda lila',short:'Lavanda',color:'#AB9ABD',frame:1,line:'Para que nuestra casita huela a un día bonito contigo.'},
  {id:'girasol',label:'Girasoles',short:'Girasol',color:'#E7BF69',frame:2,line:'Tú eres mi solecito; estos van a recordármelo.'},
  {id:'lirio',label:'Lirios',short:'Lirios',color:'#E9CD8B',frame:3,line:'Mira cómo se abrieron los lirios. Este es para ti.'},
  {id:'rosa',label:'Rosas rosas',short:'Rosas rosas',color:'#D0829B',frame:4,line:'De todas las rosas del jardín, yo te guardé la más rosita.'},
  {id:'peonia',label:'Peonías',short:'Peonías',color:'#E7A49E',frame:5,line:'¡Cuántos pétalos tiene esta peonía! ¿La llevamos a casa?'}
]);
export const GARDEN_PLOTS=Object.freeze(Array.from({length:6},(_,i)=>({id:i,x:190+i%3*132,y:164+Math.floor(i/3)*65})));
const count=value=>Number.isInteger(value)&&value>=0?Math.min(999999,value):0;
const validFlower=id=>GARDEN_FLOWERS.some(flower=>flower.id===id);
const empty=()=>({flower:null,watered:false,growth:0});
export function normalizeGarden(saved){
  const unlocked=Array.isArray(saved?.decorations)?GARDEN_FLOWERS.map(f=>f.id).filter(id=>saved.decorations.includes(id)):[];
  return {visits:count(saved?.visits),planted:count(saved?.planted),harvested:count(saved?.harvested),
    plots:GARDEN_PLOTS.map((_,index)=>{
      const plot=saved?.plots?.[index];
      if(!validFlower(plot?.flower))return empty();
      return {flower:plot.flower,watered:plot.watered===true,
        growth:plot.watered===true&&Number.isFinite(plot.growth)?Math.max(0,Math.min(1,plot.growth)):0};
    }),
    inventory:Object.fromEntries(GARDEN_FLOWERS.map(({id})=>[id,count(saved?.inventory?.[id])])),
    decorations:unlocked,decoration:unlocked.includes(saved?.decoration)?saved.decoration:null};
}
export function visitGarden(saved){const state=normalizeGarden(saved);state.visits=count(state.visits+1);return state;}
export function plantGarden(saved,index,flower){
  const state=normalizeGarden(saved);
  if(!Number.isInteger(index)||!state.plots[index]||state.plots[index].flower||!validFlower(flower))return {state,changed:false};
  state.plots[index]={flower,watered:false,growth:0};state.planted=count(state.planted+1);
  return {state,changed:true};
}
export function waterGarden(saved,index){
  const state=normalizeGarden(saved),plot=Number.isInteger(index)&&state.plots[index];
  if(!plot?.flower||plot.watered)return {state,changed:false};
  plot.watered=true;return {state,changed:true};
}
export function advanceGarden(saved,seconds){
  const state=normalizeGarden(saved),elapsed=Number.isFinite(seconds)?Math.max(0,Math.min(60,seconds)):0;
  for(const plot of state.plots)if(plot.flower&&plot.watered)plot.growth=Math.min(1,plot.growth+elapsed/GARDEN_GROW_SECONDS);
  return state;
}
export function gardenStage(plot){return !plot?.flower?0:plot.growth>=1?3:plot.growth>=.5?2:1;}
export function harvestGarden(saved,index){
  const state=normalizeGarden(saved),plot=Number.isInteger(index)&&state.plots[index];
  if(!plot?.flower||gardenStage(plot)!==3)return {state,changed:false,flower:null};
  const flower=plot.flower;state.inventory[flower]=count(state.inventory[flower]+1);state.harvested=count(state.harvested+1);state.plots[index]=empty();
  return {state,changed:true,flower};
}
// A single hand-grown flower makes a little vase. Reusing a vase never spends
// another flower, so switching the decoration cannot destroy progress.
export function decorateGarden(saved,id){
  const state=normalizeGarden(saved);
  if(id===null){state.decoration=null;return {state,changed:true};}
  if(!validFlower(id))return {state,changed:false};
  if(!state.decorations.includes(id)){
    if(!state.inventory[id])return {state,changed:false};
    state.inventory[id]--;state.decorations.push(id);
  }
  state.decoration=id;return {state,changed:true};
}
export function getHomeDecoration(saved){
  const state=normalizeGarden(saved),flower=GARDEN_FLOWERS.find(({id})=>id===state.decoration);
  return flower?{id:flower.id,label:'Florero de '+flower.label.toLowerCase(),color:flower.color,
    asset:'/assets/game/garden/flowers.png',frame:flower.frame,source:{x:flower.frame*32,y:96,width:32,height:32}}:null;
}
export function gardenViewport(cssWidth,cssHeight){
  const w=Math.max(1,Math.ceil(Number(cssWidth)||1)),h=Math.max(1,Math.ceil(Number(cssHeight)||1));
  const scale=Math.max(Math.min(w,h)<700?2:3,Math.ceil(w/640),Math.ceil(h/400));
  const width=Math.min(640,Math.ceil(w/scale)),height=Math.min(400,Math.ceil(h/scale));
  return {width,height,scale,cssWidth:width*scale,cssHeight:height*scale};
}
export function drawGardenBeds(ctx,{x,y,getImage,state}){
  const garden=normalizeGarden(state),image=getImage?.('/assets/game/garden/flowers.png');
  for(let index=0;index<6;index++){
    const px=Math.round(x+(index%3)*16),py=Math.round(y+Math.floor(index/3)*16);
    ctx.fillStyle='#8C6749';ctx.fillRect(px,py+5,15,9);ctx.fillStyle='#C5A06D';ctx.fillRect(px,py+4,15,2);
    ctx.fillStyle=garden.plots[index].watered?'#6A4B3E':'#8A5E40';ctx.fillRect(px+2,py+6,11,5);
    const plot=garden.plots[index],flower=GARDEN_FLOWERS.find(({id})=>id===plot.flower),stage=gardenStage(plot);
    if(image&&flower)ctx.drawImage(image,flower.frame*32,(stage-1)*32,32,32,px+1,py-2,13,13);
  }
}
