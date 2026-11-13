import {node,paragraph,labeledButton} from './dom.js';
import {getLookOptions,getChoice,chooseOutfit} from '../wardrobe.js';
import {drawCharacter} from '../pair.js';
import {prepareLooks} from '../assets.js';

// Tres atuendos completos por personaje; los estilos incluyen la ropa de boda.
export function mount(root,_data,api){
  let who='itza',facing='down',walking=false,clock=0;
  paragraph(root,'Elige el atuendo de Itza o Leo. El traje y el vestido de boda están disponibles. Tu elección se guarda automáticamente.');
  const tabs=node('div','wardrobe-tabs');
  const directions=node('div','wardrobe-direction');
  const items=node('div','wardrobe-items');
  const preview=node('canvas','wardrobe-preview');
  preview.width=160;preview.height=125;
  preview.setAttribute('aria-label','Vista previa animada del conjunto completo');
  const info=paragraph(root,'','wardrobe-info');
  const walkButton=labeledButton('Ver caminata',()=>{
    walking=!walking;clock=0;walkButton.textContent=walking?'Detener animación':'Ver caminata';draw();
  },'wardrobe-category');
  const layout=node('div','wardrobe-layout'),left=node('div','wardrobe-left'),right=node('div','wardrobe-right');
  left.append(tabs,directions,preview,walkButton);
  right.append(info,items);layout.append(left,right);root.append(layout);
  let alive=true;
  function draw(){
    if(!alive)return;
    const ctx=preview.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#F3D9B1';ctx.fillRect(0,0,160,125);
    for(let y=0;y<125;y+=16){ctx.fillStyle='#D9C2A3';ctx.fillRect(0,y,160,1);}
    const frame=walking?2+clock%4:0;
    ctx.save();ctx.scale(2,2);
    drawCharacter(ctx,24,7,who,facing,frame,api.assetImage,api.save.outfits);
    ctx.restore();
  }
  function select(id){
    if(!chooseOutfit(api.save.outfits,who,id))return;
    const promise=api.onOutfitChange();
    render();
    Promise.resolve(promise).then(()=>{if(alive)draw();});
  }
  function render(){
    if(!alive)return;
    tabs.replaceChildren();directions.replaceChildren();items.replaceChildren();
    for(const name of ['itza','leo']){
      const button=labeledButton(name==='itza'?'Itza':'Leo',()=>{who=name;render();},'wardrobe-tab');
      button.classList.toggle('selected',who===name);tabs.append(button);
    }
    for(const [direction,label] of [['down','Frente'],['right','Lado'],['up','Espalda']]){
      const button=labeledButton(label,()=>{facing=direction;render();},'wardrobe-face');
      button.classList.toggle('selected',facing===direction);directions.append(button);
    }
    const options=getLookOptions(who);
    for(const [i,look] of options.entries()){
      const available=Boolean(api.assetImage(look.sheet));
      const button=labeledButton(look.name,()=>select(look.id),'wardrobe-item');
      button.classList.toggle('selected',getChoice(api.save.outfits,who)===look.id);
      button.disabled=i!==0&&!available;
      if(!available)button.title=i===0?'Copia el PNG para mostrar el sprite definitivo':'Pendiente: '+look.sheet;
      items.append(button);
    }
    info.textContent='Editando a '+(who==='itza'?'Itza':'Leo')+' · Tres conjuntos completos';
    draw();
  }
  const timer=setInterval(()=>{if(walking){clock++;draw();}},155);
  prepareLooks().then(()=>{if(alive)render();});
  render();
  return ()=>{alive=false;clearInterval(timer);};
}
