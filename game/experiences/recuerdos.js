import {node,picture,paragraph,labeledButton} from './dom.js';
import './activities-v7.css';
export function mount(root,data){
  const shell=node('section','tv-v7');
  paragraph(shell,data.text,'activity-lead');
  const tv=node('div','tv-console'),screen=node('div','tv-display'),screenInner=node('div','tv-inner');
  const chassis=node('div','tv-chassis'),tuner=node('div','tv-tuner'),standby=node('span','tv-standby','♡');
  standby.setAttribute('aria-hidden','true');tuner.setAttribute('aria-hidden','true');
  tuner.append(node('span','tv-knob knob-one'),node('span','tv-knob knob-two'),node('span','tv-speaker'));
  const image=picture('','Recuerdo');image.className='tv-image';image.referrerPolicy='no-referrer';
  const fallback=node('div','tv-fallback'),fallbackIcon=node('span','tv-fallback-icon','♡');
  fallback.hidden=true;fallback.setAttribute('role','status');fallbackIcon.setAttribute('aria-hidden','true');
  fallback.append(fallbackIcon,node('span','tv-fallback-label','Este recuerdo no pudo cargar.'));
  const message=node('p','tv-memory'),number=node('span','tv-number');
  const controls=node('div','tv-controls');
  let index=0,active=false;
  const prev=labeledButton('◀',()=>{index=(index-1+data.memories.length)%data.memories.length;paint();});
  prev.setAttribute('aria-label','Recuerdo anterior');
  const next=labeledButton('▶',()=>{index=(index+1)%data.memories.length;paint();});
  next.setAttribute('aria-label','Recuerdo siguiente');
  const power=labeledButton('Encender',()=>{active=!active;paint();},'tv-power');
  screenInner.append(standby,image,fallback,message);screen.append(screenInner);controls.append(prev,power,next);
  const plaque=node('div','tv-channel'),channelLabel=node('span','tv-channel-label','CANAL');
  channelLabel.setAttribute('aria-hidden','true');plaque.append(channelLabel,number);
  chassis.append(screen,tuner);tv.append(chassis,plaque,controls);shell.append(tv);root.append(shell);
  function paint(){
    screen.classList.toggle('off',!active);power.textContent=active?'Apagar':'Encender';
    power.setAttribute('aria-pressed',String(active));
    fallback.hidden=true;image.hidden=!active;
    prev.disabled=next.disabled=!active;
    if(!active){image.removeAttribute('src');message.textContent='Picale a la tele pa que inicien los recuerdos';number.textContent='';return;}
    const memory=data.memories[index];image.src=memory.gif;image.alt=memory.text;
    message.textContent=memory.text;number.textContent=(index+1)+' / '+data.memories.length;
  }
  image.onload=()=>{if(active){fallback.hidden=true;image.hidden=false;}};
  image.onerror=()=>{
    if(!active)return;
    image.removeAttribute('src');image.alt='GIF no disponible';image.hidden=true;fallback.hidden=false;
  };
  paint();
  return ()=>{image.removeAttribute('src');};
}
