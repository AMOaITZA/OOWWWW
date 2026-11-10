export const TILE = 16;
export const WIDTH = 120;
export const HEIGHT = 80;
const seed = (x,y) => {let n=(x*374761393+y*668265263)>>>0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)%100;};
export const inside=(x,y)=>x>=2&&y>=2&&x<WIDTH-2&&y<HEIGHT-2;
const solid=new Uint8Array(WIDTH*HEIGHT);
export function initWorld(places) {
  solid.fill(0);
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    if(!inside(x,y)) solid[y*WIDTH+x]=1;
  }
  // Las construcciones son obstáculos separados del suelo.
  for(const place of places){
    const [cx,cy]=place.tile;
    for(let y=cy-2;y<=cy+1;y++)for(let x=cx-3;x<=cx+3;x++){
      if(inside(x,y))solid[y*WIDTH+x]=1;
    }
  }
}
export function walkable(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&inside(x,y)&&!solid[y*WIDTH+x];}
export function findPath(from,to) {
  const sx=Math.round(from.x),sy=Math.round(from.y), tx=Math.round(to.x),ty=Math.round(to.y);
  if(!walkable(tx,ty))return [];
  const start=sy*WIDTH+sx,goal=ty*WIDTH+tx;
  if(start===goal)return [];
  const parent=new Int32Array(WIDTH*HEIGHT).fill(-1),cost=new Float32Array(WIDTH*HEIGHT).fill(Infinity);
  const open=[start];cost[start]=0;
  const heuristic=(n)=>Math.abs(n%WIDTH-tx)+Math.abs(Math.floor(n/WIDTH)-ty);
  while(open.length){
    let best=0,bestScore=Infinity;
    for(let i=0;i<open.length;i++){const n=open[i],score=cost[n]+heuristic(n);if(score<bestScore){best=i;bestScore=score;}}
    const current=open.splice(best,1)[0];
    if(current===goal){const path=[];let n=goal;while(n!==start){path.push({x:n%WIDTH,y:Math.floor(n/WIDTH)});n=parent[n];}return path.reverse();}
    const x=current%WIDTH,y=Math.floor(current/WIDTH);
    for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){
      const nx=x+dx,ny=y+dy;if(!walkable(nx,ny))continue;
      const id=ny*WIDTH+nx,nc=cost[current]+1;
      if(nc<cost[id]){cost[id]=nc;parent[id]=current;if(!open.includes(id))open.push(id);}
    }
  }
  return [];
}
export function groundTile(ctx,x,y) {
  const n=seed(x,y);
  ctx.fillStyle=n<13?'#8BAE74':n<38?'#94B77B':'#9CBC83';
  ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
  if(n<8){ctx.fillStyle='#607C5C';ctx.fillRect(x*TILE+4,y*TILE+5,2,3);ctx.fillRect(x*TILE+8,y*TILE+9,2,2);}
  if(n>=95){ctx.fillStyle='#F6D1CF';ctx.fillRect(x*TILE+7,y*TILE+6,3,3);}
}
