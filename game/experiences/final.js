import {node,paragraph,picture,labeledButton} from './dom.js';
import './memories-v7.css';
export function mount(root,data){
  const finale=node('section','memory-finale');finale.dataset.state='looking';
  paragraph(finale,data.text,'final-quote finale-introduction');
  const chapter=node('div','finale-stage'),frame=node('div','final-pair');
  const looking=picture(data.photo,'Itza y Leo mirándose');
  const kiss=picture(data.kissPhoto,'Itza y Leo');
  looking.loading=kiss.loading='eager';
  kiss.hidden=true;
  frame.append(looking,kiss);
  const ticket=node('div','finale-ticket');
  paragraph(ticket,data.chapter,'final-chapter');
  paragraph(ticket,data.question,'final-question');
  paragraph(ticket,data.continuation,'final-continuation');
  let timer;
  const action=labeledButton(data.action,()=>{
    clearTimeout(timer);
    action.textContent=data.actionAfter;
    looking.hidden=true;kiss.hidden=false;
    finale.dataset.state='kiss';
    timer=setTimeout(()=>{kiss.hidden=true;looking.hidden=false;finale.dataset.state='looking';},1800);
  },'pixel-action final-action-game');
  ticket.append(action);chapter.append(frame,ticket);finale.append(chapter);
  const dedication=node('div','finale-dedication');
  paragraph(dedication,data.footer,'final-footer-love');
  const address=node('div','final-correspondence');
  paragraph(address,'De: '+data.from);paragraph(address,'Para: '+data.to);
  dedication.append(address);finale.append(dedication);
  paragraph(finale,data.ps,'final-ps');root.append(finale);
  return ()=>clearTimeout(timer);
}
