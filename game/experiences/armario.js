import {node,paragraph,labeledButton} from './dom.js';
import {catalogs,getChoice,chooseOutfit} from '../wardrobe.js';
import {drawCharacter} from '../pair.js';
const categories=[['hair','Cabello'],['top','Parte superior'],['bottom','Parte inferior'],['shoes','Calzado'],['accessories','Accesorios']];
export function mount(root,_data,api){
  let who='itza',category='top';
  paragraph(root,'Prueba combinaciones para Itza y Leo. Las prendas se guardan automáticamente.');
  const tabs=node('div','wardrobe-tabs'),categoriesEl=node('div','wardrobe-categories'),items=node('div','wardrobe-items');
  const preview=node('canvas','wardrobe-preview');preview.width=160;preview.height=125;preview.setAttribute('aria-label','Vista previa del personaje');
  const info=paragraph(root,'','wardrobe-info');
  const container=node('div','wardrobe-layout'),left=node('div','wardrobe-left'),right=node('div','wardrobe-right');
  left.append(tabs,preview);right.append(categoriesEl,items);container.append(left,right);root.append(container);
  function draw(){
    const ctx=preview.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#F3D9B1';ctx.fillRect(0,0,160,125);
    for(let y=0;y<125;y+=16){ctx.fillStyle='#D9C2A3';ctx.fillRect(0,y,160,1);}
    drawCharacter(ctx,64,40,who,'down',0,api.assetImage,api.save.outfits);
  }
  function render(){
    tabs.replaceChildren();categoriesEl.replaceChildren();items.replaceChildren();
    for(const name of ['itza','leo']){const b=labeledButton(name==='itza'?'Itza':'Leo',()=>{who=name;render();},'wardrobe-tab');b.classList.toggle('selected',who===name);tabs.append(b);}
    categories.forEach(([id,label])=>{const b=labeledButton(label,()=>{category=id;render();},'wardrobe-category');b.classList.toggle('selected',category===id);categoriesEl.append(b);});
    const choices=catalogs[who][category];
    const none=labeledButton('Quitar',()=>set(null),'wardrobe-item');
    none.classList.toggle('selected',getChoice(api.save.outfits,who,category)===null);items.append(none);
    for(const item of choices){const b=labeledButton(item.name,()=>set(item.id),'wardrobe-item');b.classList.toggle('selected',getChoice(api.save.outfits,who,category)===item.id);items.append(b);}
    info.textContent='Editando a '+(who==='itza'?'Itza':'Leo')+' · '+categories.find(([id])=>id===category)[1];draw();
  }
  function set(id){chooseOutfit(api.save.outfits,who,category,id);const loading=api.onOutfitChange();render();Promise.resolve(loading).then(draw);}
  render();
  return ()=>{};
}
