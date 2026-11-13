export const TILE=16,WIDTH=120,HEIGHT=80;
const total=WIDTH*HEIGHT,solid=new Uint8Array(total);
const key=(x,y)=>y*WIDTH+x;
export const inside=(x,y)=>x>=2&&y>=2&&x<WIDTH-2&&y<HEIGHT-2;
const seed=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)%100;};
export function initWorld(places,decor=[],moments=[]){
  solid.fill(0);
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)if(!inside(x,y))solid[key(x,y)]=1;
  for(const p of places){
    for(let y=p.tile[1]-2;y<=p.tile[1]+1;y++)for(let x=p.tile[0]-4;x<=p.tile[0]+4;x++){
      if(inside(x,y))solid[key(x,y)]=1;
    }
  }
  for(const obj of decor){
    const [x,y]=obj.tile;
    if(obj.kind==='tree'||obj.kind==='rock')for(let oy=0;oy<=1;oy++)if(inside(x,y+oy))solid[key(x,y+oy)]=1;
    if(obj.kind==='bench')for(let ox=0;ox<=1;ox++)if(inside(x+ox,y))solid[key(x+ox,y)]=1;
    if(obj.kind==='lamp'&&inside(x,y))solid[key(x,y)]=1;
  }
  for(const spot of moments){
    if(spot.kind==='cats'){
      const [x,y]=spot.tile;
      for(let dx=-1;dx<=1;dx++)if(inside(x+dx,y))solid[key(x+dx,y)]=1;
    }
  }
}
export const walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&inside(x,y)&&solid[key(x,y)]===0;
export function closestWalkable(x,y){
  x=Math.floor(x);y=Math.floor(y);
  if(walkable(x,y))return{x,y};
  for(let radius=1;radius<=5;radius++){
    for(let yy=y-radius;yy<=y+radius;yy++)for(let xx=x-radius;xx<=x+radius;xx++){
      if(Math.max(Math.abs(xx-x),Math.abs(yy-y))===radius&&walkable(xx,yy))return{x:xx,y:yy};
    }
  }
  return null;
}
class Heap{
  items=[];
  push(node,score){
    const a=this.items;let i=a.length;a.push({node,score});
    while(i){const p=(i-1)>>1;if(a[p].score<=score)break;a[i]=a[p];i=p;}a[i]={node,score};
  }
  pop(){
    const a=this.items,first=a[0],last=a.pop();if(a.length){
      let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].score<a[c].score)c++;if(a[c].score>=last.score)break;a[i]=a[c];i=c;}a[i]=last;
    }return first.node;
  }
  get size(){return this.items.length;}
}
export function findPath(from,to){
  const sx=Math.round(from.x),sy=Math.round(from.y),tx=Math.round(to.x),ty=Math.round(to.y);
  if(!walkable(sx,sy)||!walkable(tx,ty))return [];
  const start=key(sx,sy),goal=key(tx,ty);
  if(start===goal)return [];
  const parent=new Int32Array(total).fill(-1),cost=new Int32Array(total).fill(0x3fffffff),visited=new Uint8Array(total),open=new Heap();
  cost[start]=0;open.push(start,Math.abs(sx-tx)+Math.abs(sy-ty));
  while(open.size){
    const n=open.pop();if(visited[n])continue;visited[n]=1;
    if(n===goal){const route=[];let step=goal;while(step!==start){route.push({x:step%WIDTH,y:Math.floor(step/WIDTH)});step=parent[step];}return route.reverse();}
    const x=n%WIDTH,y=Math.floor(n/WIDTH);
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const nx=x+dx,ny=y+dy;if(!walkable(nx,ny))continue;
      const next=key(nx,ny),newCost=cost[n]+1;
      if(newCost>=cost[next])continue;cost[next]=newCost;parent[next]=n;
      open.push(next,newCost+Math.abs(nx-tx)+Math.abs(ny-ty));
    }
  }return [];
}
export function groundTile(ctx,x,y){
  const n=seed(x,y);ctx.fillStyle=n<13?'#8BAE74':n<38?'#94B77B':'#9CBC83';
  ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
  if(n<8){ctx.fillStyle='#607C5C';ctx.fillRect(x*TILE+4,y*TILE+5,2,3);ctx.fillRect(x*TILE+8,y*TILE+9,2,2);}
  if(n>=95){ctx.fillStyle='#F6D1CF';ctx.fillRect(x*TILE+7,y*TILE+6,3,3);}
  if((y>=36&&y<=42&&x>10&&x<101)||(x>=59&&x<=65&&y>19&&y<65)){
    ctx.fillStyle=(x+y)%3?'#D8C69A':'#E5D1A7';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
  }
}
