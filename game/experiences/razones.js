import {node,paragraph,labeledButton} from './dom.js';
import './activities-v7.css';
const PER_PAGE=8;
export function mount(root,data){
  const shell=node('section','reasons-v7');
  paragraph(shell,data.text,'activity-lead');
  const paper=node('div','reasons-paper'),list=node('ol','reasons-list'),foot=node('div','reasons-navigation'),count=node('span','reasons-count');
  list.setAttribute('role','list');
  foot.setAttribute('role','group');foot.setAttribute('aria-label','Páginas de razones');
  count.setAttribute('aria-live','polite');
  let page=0;
  const prev=labeledButton('Anterior',()=>{page--;render();});
  const next=labeledButton('Siguiente',()=>{page++;render();});
  foot.append(prev,count,next);paper.append(list,foot);shell.append(paper);root.append(shell);
  function render(){
    list.replaceChildren();
    data.items.slice(page*PER_PAGE,(page+1)*PER_PAGE).forEach((reason,i)=>{
      const number=page*PER_PAGE+i+1,li=node('li','reason-card');li.value=number;
      const badge=node('span','reason-number',String(number).padStart(3,'0'));
      badge.setAttribute('aria-hidden','true');
      const heart=node('span','reason-heart','♥');heart.setAttribute('aria-hidden','true');
      li.append(badge,node('span','reason-message',reason),heart);list.append(li);
    });
    count.textContent=(page+1)+' / '+Math.ceil(data.items.length/PER_PAGE);
    prev.disabled=page===0;next.disabled=(page+1)*PER_PAGE>=data.items.length;
  }render();
  return ()=>{};
}
