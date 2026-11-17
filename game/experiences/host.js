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
import * as boda from './boda.js';
import * as secreto from './secreto.js';
import * as grabadora from './grabadora.js';
import {activateDialog} from '../dialog.js';
const modules={inicio:intro,carta:letter,galeria:gallery,razones:reasons,playlist,recuerdos:tv,contador:counter,lugares:places,final:ending,armario:wardrobe,boda,secreto,grabadora};
const extraContent={secreto:{title:'Nuestro rinconcito secreto',eyebrow:'Solo tú y yo'},grabadora:{title:'La grabadora de Leo',eyebrow:'Mi voz para ti'}};
export function createHost(api){
  const panel=document.getElementById('experience');
  const body=document.getElementById('experience-content');
  const title=document.getElementById('experience-title');
  const category=document.getElementById('experience-category');
  const closeButton=document.getElementById('close-experience');
  let cleanup=()=>{},releaseDialog=()=>{};
  function show(){
    releaseDialog=activateDialog(panel,{onClose:close,initialFocus:closeButton,
      fallbackFocus:document.getElementById('world')});
  }
  function open(id){
    if(!modules[id])return;
    if(!panel.hidden)close();
    body.replaceChildren();
    const data=content[id]||extraContent[id]||{};
    title.textContent=data.title||id;
    category.textContent=data.eyebrow||'Nuestro pequeño mundo';
    cleanup=modules[id].mount(body,data,api)||(()=>{});
    show();
  }
  function close(){
    if(panel.hidden)return;
    cleanup();cleanup=()=>{};
    releaseDialog();releaseDialog=()=>{};body.replaceChildren();
    api.onClose?.();
  }
  function help(){
    if(!panel.hidden)close();
    body.replaceChildren();
    title.textContent='Cómo jugar';category.textContent='Controles';
    const p=document.createElement('p');
    p.textContent='Toca o haz clic en el suelo para caminar. Toca una casa para acercarte y vuelve a tocarla para abrir su experiencia. En computadora también puedes usar las flechas o WASD, y E cerca de una entrada para abrirla. El armario permite cambiar los conjuntos, incluidos el traje y el vestido de boda. En el mapa general encontrarás el Castillo de nuestra boda: camina hasta su puerta y toca de nuevo el edificio para entrar a la ceremonia. Allí puedes decir «Sí, quiero», avanzar por seis escenas o reproducir la historia seguida. También encontrarás Los gatitos y dos bancas: tócalos o pulsa E cerca para acariciar o sentarte. Pulsa E otra vez o camina para levantarte.';
    const customization=document.createElement('p');
    customization.textContent='En el armario puedes poner o quitar los lentes de cada personaje y elegir el cabello negro, café, rosa pastel o rubio claro de Itza. Se conserva con sus conjuntos y al sentarse. Arriba del mundo puedes elegir Día, Noche o Automático. Las opciones manuales se mantienen; Automático alterna cinco minutos de día y cinco de noche.';
    const discoveries=document.createElement('p');
    discoveries.textContent='Explora el bosque: hay un rinconcito que solo aparece en el mapa después de descubrirlo. Allí Leo tiene unas preguntas para ti. La grabadora de Leo guarda mensajes de voz para escuchar cuando quieras. En Música puedes activar o silenciar la vocecita que acompaña sus frases.';
    body.append(p,customization,discoveries);show();
  }
  closeButton.addEventListener('click',close);
  panel.addEventListener('click',event=>{if(event.target===panel)close();});
  return {open,help,close,isOpen:()=>!panel.hidden};
}
