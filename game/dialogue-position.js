// Colocación de globos pixel art en coordenadas CSS de pantalla.
// Evalúa distintas orientaciones y evita cubrir personajes y objetos interactivos.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function placeDialogue({anchor,bubble,viewport,obstacles=[]}){
  const w=Math.max(1,bubble.width),h=Math.max(1,bubble.height);
  const margin=8,gap=13;
  const hero=obstacles.find(o=>o.id==='pair')??{x:anchor.x-15,y:anchor.y,width:30,height:40};
  const choices=[
    {x:anchor.x-w/2,y:anchor.y-h-gap,tail:'bottom',preference:0},
    {x:anchor.x-w+26,y:anchor.y-h-gap,tail:'bottom',preference:1},
    {x:anchor.x-26,y:anchor.y-h-gap,tail:'bottom',preference:2},
    {x:hero.x-w-gap,y:anchor.y-h/2,tail:'right',preference:3},
    {x:hero.x+hero.width+gap,y:anchor.y-h/2,tail:'left',preference:4},
    {x:anchor.x-w/2,y:hero.y+hero.height+gap,tail:'top',preference:5},
    {x:anchor.x-w+26,y:hero.y+hero.height+gap,tail:'top',preference:6},
    {x:anchor.x-26,y:hero.y+hero.height+gap,tail:'top',preference:7}
  ];
  let best=null;
  for(const candidate of choices){
    const x=clamp(candidate.x,margin,Math.max(margin,viewport.width-w-margin));
    const y=clamp(candidate.y,margin,Math.max(margin,viewport.height-h-margin));
    let score=candidate.preference*5+(Math.abs(x-candidate.x)+Math.abs(y-candidate.y))*.17;
    for(const obstacle of obstacles){
      const pad=obstacle.id==='pair'?9:6;
      const left=Math.max(x,obstacle.x-pad);
      const top=Math.max(y,obstacle.y-pad);
      const right=Math.min(x+w,obstacle.x+obstacle.width+pad);
      const bottom=Math.min(y+h,obstacle.y+obstacle.height+pad);
      const overlap=Math.max(0,right-left)*Math.max(0,bottom-top);
      score+=overlap*(obstacle.id==='pair'?35:22);
    }
    // Penaliza al globo que quede muy lejos del personaje, aunque no colisione.
    score+=Math.hypot(
      clamp(anchor.x,x,x+w)-anchor.x,
      clamp(anchor.y,y,y+h)-anchor.y
    )*.05;
    if(best===null||score<best.score)best={x,y,tail:candidate.tail,score};
  }
  const tailX=clamp(anchor.x-best.x,13,Math.max(13,w-13));
  const tailY=clamp(anchor.y-best.y,13,Math.max(13,h-13));
  return {x:Math.round(best.x),y:Math.round(best.y),tail:best.tail,
    tailX:Math.round(tailX),tailY:Math.round(tailY)};
}
