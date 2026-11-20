export const LAKESIDE_BACKGROUND='/assets/game/travel/lakeside.png';
export const LAKESIDE_SIZE=Object.freeze({width:640,height:400});
export const FIREWORK_DURATION=18;
const maximum=999999;
const count=value=>Number.isInteger(value)&&value>=0?Math.min(maximum,value):0;
const actions=new Set(['sits','shows','wishes']);

export function normalizeLakesideState(saved){
  return {visits:count(saved?.visits),sits:count(saved?.sits),shows:count(saved?.shows),wishes:count(saved?.wishes)};
}
export function visitLakeside(saved){
  const state=normalizeLakesideState(saved);state.visits=Math.min(maximum,state.visits+1);return state;
}
export function recordLakesideAction(saved,action){
  const state=normalizeLakesideState(saved);
  if(actions.has(action))state[action]=Math.min(maximum,state[action]+1);
  return state;
}

const colors=['#F4CE8B','#E9ADB9','#B0D7CB','#CBB9EA'];
const bursts=[
  [.15,235,74,0],[2.65,416,62,1],[5.1,315,96,2],
  [7.6,450,94,3],[10.1,240,64,1],[12.6,352,88,0],[15.1,430,56,2]
];
function burstPoints(x,y,age,color){
  const radius=7+age*19,fade=.95*Math.min(1,age*4)*Math.min(1,Math.max(0,(2.55-age)/.9));
  return Array.from({length:18},(_,index)=>{
    const angle=index/18*Math.PI*2;
    return {x:Math.round(x+Math.cos(angle)*radius),y:Math.round(y+Math.sin(angle)*radius*.76+age*age*2),
      dx:Math.cos(angle),dy:Math.sin(angle)*.76,
      color:colors[color],alpha:fade,size:index%3===0?3:2};
  });
}

// A finite, quiet display. Its schedule bounds work to at most two bursts;
// no full-screen flashes, timers or random allocations are needed by the view.
export function fireworkParticles(elapsed,{reducedMotion=false}={}){
  if(!Number.isFinite(elapsed)||elapsed<0||elapsed>=FIREWORK_DURATION)return [];
  if(reducedMotion)return [[232,85,0],[340,57,1],[454,104,2]].flatMap(([x,y,color])=>burstPoints(x,y,1,color));
  return bursts.flatMap(([start,x,y,color])=>{
    const age=elapsed-start;return age>=0&&age<2.55?burstPoints(x,y,age,color):[];
  });
}

export const LAKESIDE_WISHES=Object.freeze([
  'si se cumple un deseo esta noche, que sea tener muchas noches más contigo',
  'yo ya pedí el mío: seguir encontrándote en todos mis días',
  'no me digas tu deseo; te ayudo a cuidarlo hasta que se cumpla',
  'qué suerte la mía: el cielo lleno de estrellas y tú aquí conmigo'
]);
