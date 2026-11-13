import {node,picture,paragraph,labeledButton} from './dom.js';
export function mount(root,data){
  paragraph(root,data.text);
  const tv=node('div','tv-console'),screen=node('div','tv-display'),screenInner=node('div','tv-inner');
  const image=picture('','Recuerdo');image.className='tv-image';image.referrerPolicy='no-referrer';
  const message=node('p','tv-memory'),number=node('span','tv-number');
  const controls=node('div','tv-controls');
  let index=0,active=false;
  const prev=labeledButton('◀',()=>{index=(index-1+data.memories.length)%data.memories.length;paint();});
  prev.setAttribute('aria-label','Recuerdo anterior');
  const next=labeledButton('▶',()=>{index=(index+1)%data.memories.length;paint();});
  next.setAttribute('aria-label','Recuerdo siguiente');
  const power=labeledButton('Encender',()=>{active=!active;paint();});
  screenInner.append(image,message);screen.append(screenInner);controls.append(prev,power,next);
  tv.append(screen,number,controls);root.append(tv);
  function paint(){
    screen.classList.toggle('off',!active);power.textContent=active?'Apagar':'Encender';
    prev.disabled=next.disabled=!active;
    if(!active){image.removeAttribute('src');message.textContent='Picale a la tele pa que inicien los recuerdos';number.textContent='';return;}
    const memory=data.memories[index];image.src=memory.gif;image.alt=memory.text;
    message.textContent=memory.text;number.textContent=(index+1)+' / '+data.memories.length;
  }
  image.onerror=()=>{image.removeAttribute('src');image.alt='GIF no disponible';};
  paint();
  return ()=>{image.removeAttribute('src');};
}
