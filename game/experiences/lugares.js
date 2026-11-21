import {node,paragraph} from './dom.js';
import './memories-v7.css';
export function mount(root,data){
  const journey=node('section','memory-journey');
  const illustrations=['carta','lugares','recuerdos'];
  for(const [index,item] of data.cards.entries()){
    const card=node('article','place-memory place-postcard');
    const scene=node('div','postcard-scene');scene.setAttribute('aria-hidden','true');
    const illustration=node('img','postcard-illustration');illustration.src='/assets/game/architecture/'+illustrations[index%illustrations.length]+'.png';illustration.alt='';illustration.loading='lazy';
    scene.append(illustration);
    const copy=node('div','postcard-copy'),stamp=node('span','postcard-stamp',String(index+1).padStart(2,'0'));
    copy.append(stamp,node('h3','',item.title));paragraph(copy,item.text);
    card.append(scene,copy);journey.append(card);
  }
  root.append(journey);
  return ()=>{};
}
