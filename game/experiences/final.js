import {node,paragraph,picture,labeledButton} from './dom.js';
export function mount(root,data){
  paragraph(root,data.title,'final-quote');
  paragraph(root,data.text);
  const frame=node('div','final-pair');
  const looking=picture(data.photo,'Itza y Leo mirándose');
  const kiss=picture(data.kissPhoto,'Itza y Leo');
  kiss.hidden=true;
  frame.append(looking,kiss);root.append(frame);
  paragraph(root,data.chapter,'final-chapter');
  paragraph(root,data.question,'final-question');
  paragraph(root,data.continuation);
  let timer;
  const action=labeledButton(data.action,()=>{
    clearTimeout(timer);
    action.textContent=data.actionAfter;
    looking.hidden=true;kiss.hidden=false;
    timer=setTimeout(()=>{kiss.hidden=true;looking.hidden=false;},1800);
  },'pixel-action final-action-game');
  root.append(action);
  paragraph(root,data.footer,'final-footer-love');
  paragraph(root,'De: '+data.from);
  paragraph(root,'Para: '+data.to);
  paragraph(root,data.ps,'final-ps');
  return ()=>clearTimeout(timer);
}
