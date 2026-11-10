import {node,paragraph,labeledButton} from './dom.js';
const PER_PAGE=8;
export function mount(root,data){
  paragraph(root,data.text);
  const paper=node('div','reasons-paper'),list=node('ol','reasons-list'),foot=node('div','reasons-navigation'),count=node('span','reasons-count');
  let page=0;
  const prev=labeledButton('Anterior',()=>{page--;render();});
  const next=labeledButton('Siguiente',()=>{page++;render();});
  foot.append(prev,count,next);paper.append(list,foot);root.append(paper);
  function render(){
    list.replaceChildren();
    data.items.slice(page*PER_PAGE,(page+1)*PER_PAGE).forEach((reason,i)=>{
      const li=node('li','',reason);li.value=page*PER_PAGE+i+1;list.append(li);
    });
    count.textContent=(page+1)+' / '+Math.ceil(data.items.length/PER_PAGE);
    prev.disabled=page===0;next.disabled=(page+1)*PER_PAGE>=data.items.length;
  }render();
  return ()=>{};
}
