import {node,paragraph} from './dom.js';
import './memories-v7.css';
export function mount(root,data){
  const letter=node('article','memory-letter');
  const seal=node('div','letter-wax-seal','♥');seal.setAttribute('aria-hidden','true');
  const paper=node('div','letter-sheet');
  paragraph(paper,data.text,'letter-original');
  paragraph(paper,data.signature,'signature');
  letter.append(seal,paper);root.append(letter);
  return ()=>{};
}
