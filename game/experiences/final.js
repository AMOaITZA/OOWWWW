import {node,paragraph,picture} from './dom.js';
export function mount(root,data){
  paragraph(root,data.title,'final-quote');paragraph(root,data.text);
  const frame=node('div','final-pair');
  frame.append(picture('/assets/images/pareja_mirandose.png','Itza y Leo mirándose'));root.append(frame);
  paragraph(root,data.chapter,'final-chapter');paragraph(root,data.question,'final-question');
  paragraph(root,data.continuation);paragraph(root,data.footer,'final-footer-love');
  paragraph(root,'De: '+data.from);paragraph(root,'Para: '+data.to);
  paragraph(root,data.ps,'final-ps');
  return ()=>{};
}
