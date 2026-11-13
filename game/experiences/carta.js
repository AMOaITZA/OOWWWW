import {paragraph} from './dom.js';
export function mount(root,data){
  paragraph(root,data.text,'letter-original');
  paragraph(root,data.signature,'signature');
  return ()=>{};
}
