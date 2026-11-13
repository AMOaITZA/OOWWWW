import {node,paragraph,labeledButton} from './dom.js';
import {getLookOptions,getChoice,chooseOutfit} from '../wardrobe.js';
import {drawCharacter} from '../pair.js';
import {prepareLooks} from '../assets.js';

export function mount(root,_data,api){
  let who='itza',facing='down',walking=false,clock=0,loading=true;
  paragraph(root,'Elige el atuendo de Itza o Leo y mira cómo se ve al caminar. Tu elección se guarda automáticamente.');
  const tabs=node('div','wardrobe-tabs');
  tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Personaje');
  const directions=node('div','wardrobe-direction');
  directions.setAttribute('role','group');directions.setAttribute('aria-label','Dirección de la vista previa');
  const items=node('div','wardrobe-items');
  items.setAttribute('role','group');items.setAttribute('aria-label','Conjuntos completos');
  const preview=node('canvas','wardrobe-preview');
  preview.width=160;preview.height=125;
  preview.setAttribute('role','img');
  const info=paragraph(root,'Cargando conjuntos…','wardrobe-info');
  info.setAttribute('role','status');info.setAttribute('aria-live','polite');
  const walkButton=labeledButton('Ver caminata',()=>{
    walking=!walking;clock=0;walkButton.textContent=walking?'Detener animación':'Ver caminata';
    walkButton.setAttribute('aria-pressed',String(walking));draw();
  },'wardrobe-category');
  walkButton.setAttribute('aria-pressed','false');
  const layout=node('div','wardrobe-layout'),left=node('div','wardrobe-left'),right=node('div','wardrobe-right');
  left.append(tabs,directions,preview,walkButton);
  right.append(info,items);layout.append(left,right);root.append(layout);
  let alive=true;
  const available=sheet=>Boolean(api.assetImage(sheet));
  function draw(){
    if(!alive)return;
    const ctx=preview.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#F3D9B1';ctx.fillRect(0,0,160,125);
    for(let y=0;y<125;y+=16){ctx.fillStyle='#D9C2A3';ctx.fillRect(0,y,160,1);}
    // Anchor the feet to the same baseline for every direction and frame.
    ctx.fillStyle='#C8AA8F';ctx.fillRect(55,108,50,4);
    const frame=walking?2+clock%4:0;
    ctx.save();ctx.scale(2,2);
    drawCharacter(ctx,24,7,who,facing,frame,api.assetImage,api.save.outfits);
    ctx.restore();
  }
  function select(id){
    if(loading||!chooseOutfit(api.save.outfits,who,id,available))return;
    const promise=api.onOutfitChange();
    render();
    Promise.resolve(promise).then(()=>{if(alive)draw();});
  }
  function render(){
    if(!alive)return;
    // Restore focus after rebuilding controls; keyboard selection remains usable.
    const focus=root.contains(document.activeElement)?document.activeElement.dataset.wardrobeFocus:null;
    tabs.replaceChildren();directions.replaceChildren();items.replaceChildren();
    for(const name of ['itza','leo']){
      const button=labeledButton(name==='itza'?'Itza':'Leo',()=>{who=name;clock=0;render();},'wardrobe-tab');
      button.dataset.wardrobeFocus='who-'+name;
      button.classList.toggle('selected',who===name);
      button.setAttribute('aria-pressed',String(who===name));tabs.append(button);
    }
    for(const [direction,label] of [['down','Frente'],['right','Lado'],['up','Espalda']]){
      const button=labeledButton(label,()=>{facing=direction;clock=0;render();},'wardrobe-face');
      button.dataset.wardrobeFocus='direction-'+direction;
      button.classList.toggle('selected',facing===direction);
      button.setAttribute('aria-pressed',String(facing===direction));directions.append(button);
    }
    const options=getLookOptions(who),selected=getChoice(api.save.outfits,who,available);
    for(const look of options){
      const installed=available(look.sheet);
      const button=labeledButton(look.name+(loading?'':installed?'':' · No disponible'),()=>select(look.id),'wardrobe-item');
      button.dataset.wardrobeFocus='look-'+look.id;
      button.classList.toggle('selected',selected===look.id);
      button.setAttribute('aria-pressed',String(selected===look.id));
      button.disabled=loading||!installed;
      if(!installed)button.title=loading?'Cargando vista previa':'Este conjunto todavía no está instalado.';
      items.append(button);
    }
    const person=who==='itza'?'Itza':'Leo',count=options.filter(look=>available(look.sheet)).length;
    info.textContent=loading?'Cargando conjuntos…':person+' · '+count+' '+(count===1?'conjunto disponible':'conjuntos disponibles');
    preview.setAttribute('aria-label','Vista previa de '+person+', '+(options.find(look=>look.id===selected)?.name??'cargando conjunto')+', '+({down:'de frente',right:'de lado',up:'de espalda'}[facing]));
    walkButton.disabled=loading||count===0;
    if(focus)root.querySelector('[data-wardrobe-focus="'+focus+'"]')?.focus({preventScroll:true});
    draw();
  }
  const timer=setInterval(()=>{if(walking){clock++;draw();}},130);
  prepareLooks().then(()=>{if(alive){loading=false;render();}});
  render();
  return ()=>{alive=false;clearInterval(timer);};
}
