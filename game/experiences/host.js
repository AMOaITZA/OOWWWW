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
import * as hallazgo from './hallazgo.js';
import * as hawai from './hawai.js';
import * as mirador from './mirador.js';
import {activateDialog} from '../dialog.js';
import {createExperienceTransitions} from '../experience-transitions.js';
import manifest from '../data/assets.json';
import '../experience-theme.css';
import '../scene-presentation.css';
const modules={inicio:intro,carta:letter,galeria:gallery,razones:reasons,playlist,recuerdos:tv,contador:counter,lugares:places,final:ending,armario:wardrobe,boda,secreto,grabadora,pesca,casita,hallazgo,hawai,mirador};
const extraContent={secreto:{title:'Nuestro rinconcito secreto',eyebrow:'Solo tú y yo'},grabadora:{title:'La grabadora de Leo',eyebrow:'Mi voz para ti'},
  pesca:{title:'Lago de los peluches',eyebrow:'Una misión para conocer a Ponyo'},
  casita:{title:'Nuestra casita',eyebrow:'Aquí estamos en casa'},
  hallazgo:{title:'Un secreto para ti',eyebrow:'Tesoros de nuestro mundo'},
  hawai:{title:'Nuestra escapada a Hawái',eyebrow:'Un viaje contigo'},
  mirador:{title:'Orilla de los deseos',eyebrow:'Una noche para los dos'}};
const immersiveScenes=new Set(['hawai','casita','boda','pesca','mirador']);
export function createHost(api){
  const panel=document.getElementById('experience');
  const body=document.getElementById('experience-content');
  const title=document.getElementById('experience-title');
  const category=document.getElementById('experience-category');
  const closeButton=document.getElementById('close-experience');
  const paper=panel.querySelector('.experience-panel');
  panel.dataset.presentation='scene';
  closeButton.textContent='← Volver';
  closeButton.title='Volver al mundo';
  const transition=createExperienceTransitions(panel,paper);
  const hero=document.createElement('header');hero.className='experience-hero';
  const art=document.createElement('img');art.className='experience-hero-art';
  art.alt='';art.setAttribute('aria-hidden','true');art.width=384;art.height=128;art.decoding='async';
  const heading=document.createElement('div');heading.className='experience-heading';
  heading.append(category,title);hero.append(art,heading);paper.insertBefore(hero,body);
  let cleanup=()=>{},releaseDialog=()=>{};
  function theme(id){
    paper.dataset.experience=id;
    paper.dataset.sceneKind=immersiveScenes.has(id)?'immersive':'story';
    panel.dataset.experience=id;
    closeButton.hidden=id==='hawai';
    const image=id==='boda'?manifest.wedding.background:manifest.experienceHeaders?.[id==='help'?'inicio':id];
    art.hidden=!image;if(image&&art.getAttribute('src')!==image)art.src=image;
    body.scrollTop=0;
  }
  function show(){
    releaseDialog=activateDialog(panel,{onClose:close,initialFocus:body.querySelector('.hawaii-back')||closeButton,
      fallbackFocus:document.getElementById('world')});
    // Reset after the dialog is visible: browsers can restore a hidden scroll
    // container's old offset when it is shown again.
    body.scrollTop=0;body.scrollLeft=0;
    transition.arrive();
  }
  function addSceneControls(id){
    const selectors=id==='casita'?[['.home-video-controls','Controles de la tele']]:
      id==='pesca'?[['.fishing-collection','Mis peluches']]:[];
    for(const [selector,label] of selectors){
      const controls=body.querySelector(selector);if(!controls)continue;
      const drawer=document.createElement('details');drawer.className='scene-options';
      const summary=document.createElement('summary');summary.textContent=label;
      drawer.append(summary);controls.replaceWith(drawer);drawer.append(controls);
    }
  }
  function followHouseCamera(id){
    if(id!=='casita')return ()=>{};
    const canvas=body.querySelector('.home-scene'),frame=body.querySelector('.home-scene-frame');
    if(!canvas||!frame)return ()=>{};
    let width=0,height=0,lastKey='';
    function update(){
      if(!width||!height)return;
      const activity=canvas.dataset.activity||'eat',key=activity+':'+width+':'+height;
      if(key===lastKey)return;lastKey=key;
      const scale=Math.max(width/canvas.width,height/canvas.height);
      const target=activity==='sleep'?85:activity==='tv'?374:234;
      const renderedWidth=canvas.width*scale,renderedHeight=canvas.height*scale;
      const x=Math.max(width-renderedWidth,Math.min(0,width/2-target*scale));
      const y=Math.max(height-renderedHeight,Math.min(0,height/2-canvas.height/2*scale));
      Object.assign(canvas.style,{position:'absolute',width:renderedWidth+'px',height:renderedHeight+'px',left:x+'px',top:y+'px',objectFit:'fill'});
      canvas.dataset.cameraFocus=String(target);
    }
    const resize=new ResizeObserver(entries=>{const rect=entries[0].contentRect;width=rect.width;height=rect.height;update();});
    const activity=new MutationObserver(update);resize.observe(frame);activity.observe(canvas,{attributes:true,attributeFilter:['data-activity']});
    return ()=>{resize.disconnect();activity.disconnect();};
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
    cleanup=modules[id].mount(body,data,{...api,requestClose:close})||(()=>{});
    addSceneControls(id);
    const releaseCamera=followHouseCamera(id),releaseModule=cleanup;
    cleanup=()=>{releaseCamera();releaseModule();};
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
    discoveries.textContent='Explora el bosque: hay un rinconcito con preguntas de Leo, dos cofres y una cartita escondidos. En el estanque puedes pescar peluches para conocer a Ponyo. Nuestra casita permite comer, dormir y ver tu video en la tele. Al sur del pueblo está la costa. En la Orilla de los deseos pueden sentarse frente al mar a ver fuegos artificiales y estrellas fugaces. En el Muelle de los viajes pulsa E y elige Subir al barco para ir a Hawái: allí pueden caminar, bailar, comprar bebidas y acariciar una jirafa. Ambos lugares aparecen en el mapa. La grabadora guarda tus mensajes de voz. En Música puedes ajustar la voz de Leo y los efectos de gatos, agua y grillos.';
    body.append(p,customization,discoveries);show();
  }
  closeButton.addEventListener('click',close);
  panel.addEventListener('click',event=>{if(event.target===panel)close();});
  return {open,help,close,isOpen:()=>!panel.hidden};
}
