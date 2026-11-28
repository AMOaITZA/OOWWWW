import {node,paragraph,picture} from './dom.js';
import './memories-v7.css';
export function mount(root,data){
  const welcome=node('section','memory-welcome');
  const portrait=node('figure','welcome-portrait-frame');
  const image=picture(data.photo,'Itza y Leo en pixel art');image.className='intro-portrait';
  image.loading='eager';
  const names=node('figcaption','welcome-names','Itza & Leo');
  portrait.append(image,names);
  const message=node('div','welcome-message');
  const ornament=node('div','memory-flower-rule');ornament.setAttribute('aria-hidden','true');
  ornament.append(node('span','','✦'),node('span','','♥'),node('span','','✦'));
  paragraph(message,data.text,'intro-quote welcome-note');
  message.append(ornament);
  welcome.append(portrait,message);root.append(welcome);
  return ()=>{};
}
