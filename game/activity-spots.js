// The garden grows beside the house, on the same village terrain.
export const GARDEN_SPOT=Object.freeze({id:'huerto',name:'Nuestro jardín',kind:'garden',
  tile:[44,51],arrival:[43,54]});
export function gardenAt(x,y){
  return x>=44*16-32&&x<=44*16+32&&y>=51*16-22&&y<=51*16+22;
}
export const gardenObstacles=()=>Array.from({length:6},(_,i)=>[43+i%3,50+Math.floor(i/3)]);
