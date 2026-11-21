export const BOATING_SIZE=Object.freeze({width:768,height:512});
export const BOAT_START=Object.freeze({x:384,y:316});
export const BOAT_ISLANDS=Object.freeze([
  {id:'cerezo',label:'Isla del cerezo',short:'Cerezo',arrival:{x:275,y:237},gift:'Una cajita de cartas',message:'Si un día no encuentras las palabras, aquí te dejo las mías: te elegiría en todos los mundos.'},
  {id:'estrellas',label:'Isla de las estrellas',short:'Estrellas',arrival:{x:465,y:215},gift:'Una estrella para tu bolsillo',message:'De todos los cielos que podría mirar, mis estrellas favoritas siguen siendo tus ojos.'},
  {id:'jardin',label:'Isla del jardín',short:'Jardín',arrival:{x:460,y:338},gift:'Una flor que nunca se marchita',message:'Para que siempre lleves contigo un pedacito de este lugar. Gracias por hacer de cualquier sitio nuestro hogar.'}
]);
const count=value=>Number.isInteger(value)&&value>=0?Math.min(999999,value):0;
export function normalizeBoating(saved){
 return {visits:count(saved?.visits),found:BOAT_ISLANDS.filter(island=>Array.isArray(saved?.found)&&saved.found.includes(island.id)).map(island=>island.id)};
}
export function visitBoating(saved){const state=normalizeBoating(saved);state.visits=count(state.visits+1);return state;}
export function boatIslandAt(x,y){
 return Number.isFinite(x)&&Number.isFinite(y)?BOAT_ISLANDS.find(island=>Math.hypot(x-island.arrival.x,y-island.arrival.y)<=25)||null:null;
}
export function openBoatGift(saved,id,position){
 const state=normalizeBoating(saved),island=BOAT_ISLANDS.find(item=>item.id===id);
 if(!island||!position||Math.hypot(position.x-island.arrival.x,position.y-island.arrival.y)>25)return {state,opened:false,isNew:false};
 const isNew=!state.found.includes(id);if(isNew)state.found.push(id);
 return {state,opened:true,isNew};
}
// The safety margin is measured from the complete hull, not just its centre.
// Docks remain outside these land silhouettes so the boat never crosses land.
export function boatWater(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<35||x>733||y<66||y>414)return false;
 if(x>326&&x<436&&y>346)return false;
 return ![[154,157,130,101],[592,139,134,101],[602,297,136,104]].some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1);
}
export function nearestBoatWater(x,y){
 const px=Number.isFinite(x)?x:BOAT_START.x,py=Number.isFinite(y)?y:BOAT_START.y;
 if(boatWater(px,py))return {x:px,y:py};
 let best={...BOAT_START},distance=Infinity;
 for(let row=72;row<=408;row+=8)for(let col=40;col<=728;col+=8){
  if(!boatWater(col,row))continue;const next=Math.hypot(col-px,row-py);if(next<distance){distance=next;best={x:col,y:row};}
 }
 return best;
}
function clearLine(a,b){
 const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/4);
 for(let i=0;i<=n;i++){const t=n?i/n:0;if(!boatWater(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}
 return true;
}
// Small deterministic A* keeps taps on the far side of an island navigable.
export function boatRoute(from,target){
 const start=nearestBoatWater(from?.x,from?.y),end=nearestBoatWater(target?.x,target?.y);
 if(clearLine(start,end))return [{...end}];
 const grid=16,key=(x,y)=>x+','+y,point=(x,y)=>({x:40+x*grid,y:72+y*grid});
 const cell=p=>{let best=null,distance=Infinity;for(let y=0;y<=21;y++)for(let x=0;x<=43;x++){const p2=point(x,y);if(!boatWater(p2.x,p2.y)||!clearLine(p,p2))continue;const d=Math.hypot(p.x-p2.x,p.y-p2.y);if(d<distance){distance=d;best={x,y};}}return best;};
 const s=cell(start),e=cell(end);if(!s||!e)return [];
 const first={...s,g:0,f:0,parent:null},open=[first],best=new Map([[key(s.x,s.y),0]]),closed=new Set();
 while(open.length){
  open.sort((a,b)=>a.f-b.f);const current=open.shift(),id=key(current.x,current.y);if(closed.has(id))continue;closed.add(id);
  if(current.x===e.x&&current.y===e.y){const path=[end];for(let n=current;n;n=n.parent)path.unshift(point(n.x,n.y));const simplified=[];let anchor=start;while(path.length){let chosen=0;for(let i=path.length-1;i>=0;i--)if(clearLine(anchor,path[i])){chosen=i;break;}anchor=path[chosen];simplified.push(anchor);path.splice(0,chosen+1);}return simplified;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=current.x+dx,y=current.y+dy;if(x<0||x>43||y<0||y>21)continue;
   const p=point(x,y);if(!boatWater(p.x,p.y)||!clearLine(point(current.x,current.y),p))continue;
   const g=current.g+Math.hypot(dx,dy),k=key(x,y);if(g>=(best.get(k)??Infinity))continue;
   best.set(k,g);open.push({x,y,g,f:g+Math.hypot(e.x-x,e.y-y),parent:current});
  }
 }
 return [];
}
export function boatingViewport(cssWidth,cssHeight){
 const w=Math.max(1,Math.ceil(Number(cssWidth)||1)),h=Math.max(1,Math.ceil(Number(cssHeight)||1));
 const preferred=Math.min(w,h)<700?2:3,scale=Math.max(preferred,Math.ceil(w/768),Math.ceil(h/512));
 const width=Math.min(768,Math.ceil(w/scale)),height=Math.min(512,Math.ceil(h/scale));
 return {width,height,scale,cssWidth:width*scale,cssHeight:height*scale};
}
