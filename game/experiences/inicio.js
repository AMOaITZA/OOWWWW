import {paragraph,picture} from './dom.js';
export function mount(root,data){
  const image=picture(data.photo,'Itza y Leo en pixel art');image.className='intro-portrait';root.append(image);
  paragraph(root,data.title,'intro-quote');paragraph(root,data.text);
  return ()=>{};
}
