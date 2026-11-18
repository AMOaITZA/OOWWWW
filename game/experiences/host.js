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
import * as pesca from './pesca.js';
import * as casita from './casita.js';
import {activateDialog} from '../dialog.js';
import {createExperienceTransitions} from '../experience-transitions.js';
import manifest from '../data/assets.json';
import '../experience-theme.css';
const modules={inicio:intro,carta:letter,galeria:gallery,razones:reasons,playlist,recuerdos:tv,contador:counter,lugares:places,final:ending,armario:wardrobe,boda,secreto,grabadora,pesca,casita};
const extraContent={secreto:{title:'Nuestro rinconcito secreto',eyebrow:'Solo tú y yo'},grabadora:{title:'La grabadora de Leo',eyebrow:'Mi voz para ti'},
  pesca:{title:'Lago de los peluches',eyebrow:'Una misión para conocer a Ponyo'},
  casita:{title:'Nuestra casita',eyebrow:'Aquí estamos en casa'}};
export function createHost(api){
  const panel=document.getElementById('experience');
  const body=document.getElementById('experience-content');
  const title=document.getElementById('experience-title');
  const category=document.getElementById('experience-category');
  const closeButton=document.getElementById('close-experience');
  const paper=panel.querySelector('.experience-panel');
  const transition=createExperienceTransitions(panel,paper);
  const hero=document.createElement('header');hero.className='experience-hero';
  const art=document.createElement('img');art.className='experience-hero-art';
  art.alt='';art.setAttribute('aria-hidden','true');art.width=384;art.height=128;art.decoding='async';
  const heading=document.createElement('div');heading.className='experience-heading';
  heading.append(category,title);hero.append(art,heading);paper.insertBefore(hero,body);
  let cleanup=()=>{},releaseDialog=()=>{};
  function theme(id){
    paper.dataset.experience=id;
    const image=id==='boda'?manifest.wedding.background:manifest.experienceHeaders?.[id==='help'?'inicio':id];
    art.hidden=!image;if(image&&art.getAttribute('src')!==image)art.src=image;
    body.scrollTop=0;
  }
  function show(){
    releaseDialog=activateDialog(panel,{onClose:close,initialFocus:closeButton,
      fallbackFocus:document.getElementById('world')});
    // Reset after the dialog is visible: browsers can restore a hidden scroll
    // container's old offset when it is shown again.
    body.scrollTop=0;body.scrollLeft=0;
    transition.arrive();
  }
  function open(id){
    if(!modules[id])return;
    if(!panel.hidden)close();
    transition.reset();
    body.replaceChildren();
    const data=content[id]||extraContent[id]||{};
    theme(id);
    title.textContent=data.title||id;
    category.textContent=data.eyebrow||'Nuestro pequeño mundo';
    cleanup=modules[id].mount(body,data,api)||(()=>{});
    show();
  }
  function close(){
    if(panel.hidden)return;
    const bounds=paper.getBoundingClientRect();
    cleanup();cleanup=()=>{};
    releaseDialog();releaseDialog=()=>{};
    transition.depart(bounds,()=>body.replaceChildren());
    api.onClose?.();
  }
  function help(){
    if(!panel.hidden)close();
    transition.reset();
    body.replaceChildren();
    theme('help');
    title.textContent='Cómo jugar';category.textContent='Controles';
    const p=document.createElement('p');
    p.textContent='Toca o haz clic en el suelo para caminar. Toca una casa para acercarte y vuelve a tocarla para abrir su experiencia. En computadora también puedes usar las flechas o WASD, y E cerca de una entrada para abrirla. El armario permite cambiar los conjuntos, incluidos el traje y el vestido de boda. En el mapa general encontrarás el Castillo de nuestra boda: camina hasta su puerta y toca de nuevo el edificio para entrar a la ceremonia. Allí puedes decir «Sí, quiero», avanzar por seis escenas o reproducir la historia seguida. También encontrarás Los gatitos y dos bancas: tócalos o pulsa E cerca para acariciar o sentarte. Pulsa E otra vez o camina para levantarte.';
    const customization=document.createElement('p');
    customization.textContent='En el armario puedes poner o quitar los lentes de cada personaje y elegir el cabello negro, café, rosa pastel o rubio claro de Itza. Se conserva con sus conjuntos y al sentarse. Arriba del mundo puedes elegir Día, Noche o Automático. Las opciones manuales se mantienen; Automático alterna cinco minutos de día y cinco de noche.';
    const discoveries=document.createElement('p');
    discoveries.textContent='Explora el bosque: hay un rinconcito que solo aparece en el mapa después de descubrirlo. Allí Leo tiene unas preguntas para ti. En el estanque puedes pescar cinco peluches de FNAF: completa la colección para que Ponyo llegue junto a los gatitos. En Nuestra casita pueden comer, dormir y ver la tele. La grabadora de Leo guarda mensajes de voz para escuchar cuando quieras. En Música puedes activar o silenciar la vocecita que acompaña sus frases.';
    body.append(p,customization,discoveries);show();
  }
  closeButton.addEventListener('click',close);
  panel.addEventListener('click',event=>{if(event.target===panel)close();});
  return {open,help,close,isOpen:()=>!panel.hidden};
}
