import content from '../data/content.json';
import * as intro from './inicio.js';
import * as letter from './carta.js';
import * as gallery from './galeria.js';
import * as reasons from './razones.js';
import * as playlist from './playlist.js';
import * as tv from './recuerdos.js';
import * as counter from './contador.js';
import * as places from './lugares.js';
import * as ending from './final.js';
import * as wardrobe from './armario.js';
const modules={inicio:intro,carta:letter,galeria:gallery,razones:reasons,playlist,recuerdos:tv,contador:counter,lugares:places,final:ending,armario:wardrobe};
export function createHost(api){
  const panel=document.getElementById('experience');
  const body=document.getElementById('experience-content');
  const title=document.getElementById('experience-title');
  const category=document.getElementById('experience-category');
  const closeButton=document.getElementById('close-experience');
  let cleanup=()=>{},priorFocus=null;
  function open(id){
    if(!modules[id])return;
    if(!panel.hidden)close();
    priorFocus=document.activeElement;body.replaceChildren();
    const data=content[id]||{};
    title.textContent=data.title||id;
    category.textContent=data.eyebrow||'Nuestro pequeño mundo';
    cleanup=modules[id].mount(body,data,api)||(()=>{});
    panel.hidden=false;closeButton.focus();
  }
  function close(){
    if(panel.hidden)return;
    cleanup();cleanup=()=>{};
    panel.hidden=true;body.replaceChildren();
    if(priorFocus?.isConnected)priorFocus.focus();
    priorFocus=null;api.onClose?.();
  }
  function help(){
    if(!panel.hidden)close();
    priorFocus=document.activeElement;body.replaceChildren();
    title.textContent='Cómo jugar';category.textContent='Controles';
    const p=document.createElement('p');
    p.textContent='Toca o haz clic en el suelo para caminar. Toca una casa para acercarte y vuelve a tocarla para abrir su experiencia. En computadora también puedes usar las flechas o WASD. El armario guarda los conjuntos de cada personaje.';
    body.append(p);panel.hidden=false;closeButton.focus();
  }
  closeButton.addEventListener('click',close);
  panel.addEventListener('click',event=>{if(event.target===panel)close();});
  return {open,help,close,isOpen:()=>!panel.hidden};
}
