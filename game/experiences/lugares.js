import {node,paragraph} from './dom.js';
export function mount(root,data){
  for(const item of data.cards){
    const card=node('article','place-memory');card.append(node('h3','',item.title));paragraph(card,item.text);root.append(card);
  }
  return ()=>{};
}
