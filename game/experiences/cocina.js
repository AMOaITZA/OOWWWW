import {node,labeledButton} from './dom.js';
import {RECIPES,recipeById,normalizeCooking,cookingStage,chooseRecipe,prepareIngredient,stirRecipe,heatRecipe,serveRecipe} from '../cooking.js';
import {getChoice} from '../wardrobe.js';
import {chooseHomeActivity} from '../home.js';
import {kitchenActor,cookingPose} from '../cooking-poses.js';
import {getHairColor} from '../hair.js';
import {getGlasses} from '../glasses.js';
import './cocina.css';
const BACKGROUND='/assets/game/cooking/kitchen.png';
const copy={choose:['Una receta para los dos','Elige algo rico en nuestro recetario.'],prepare:['Todo comienza con cariño','Añade los tres ingredientes a la mesa.'],stir:['Una vuelta tú, otra yo','Mezclen juntos hasta que todo esté listo.'],cook:['A fuego lento','Cocinen en tres pasos, sin prisas.'],serve:['¡Huele delicioso!','Lleven su creación a la mesa.'],served:['¡A la mesa!','Ya tienen dos porciones. Pueden comerlas juntos en la casita.']};
export function mount(root,_data,api){
  api.save??={};let state=normalizeCooking(api.save.cooking),alive=true,raf=0,last=0,clock=0,actionAt=-10;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell=node('section','cooking-room');shell.setAttribute('aria-label','Cocinar juntos');
  const stage=node('div','cooking-stage'),canvas=node('canvas','cooking-scene');canvas.width=640;canvas.height=400;canvas.setAttribute('role','img');
  stage.append(canvas);
  const heading=node('div','cooking-heading');heading.append(node('span','','NUESTRA COCINA'),node('h3','','Hecho entre los dos'));
  const cookbook=node('details','cooking-book');const summary=node('summary','','Recetario');cookbook.append(summary);
  const recipes=node('div','cooking-recipes');const recipeButtons=new Map();
  for(const recipe of RECIPES){
    const button=labeledButton('',()=>select(recipe.id),'cooking-recipe');button.dataset.cookingRecipe=recipe.id;
    button.append(node('strong','',recipe.label),node('span','cooking-recipe-count',''));
    recipeButtons.set(recipe.id,button);recipes.append(button);
  }
  cookbook.append(recipes);
  const controls=node('section','cooking-controls');controls.setAttribute('aria-label','Preparar nuestra receta');
  const title=node('h3','cooking-title'),hint=node('p','cooking-hint'),steps=node('div','cooking-steps');steps.setAttribute('aria-label','Progreso de la receta');
  for(const label of ['Ingredientes','Mezclar','Cocinar','Compartir'])steps.append(node('span','',label));
  const actions=node('div','cooking-actions'),reply=node('p','cooking-reply');reply.setAttribute('role','status');reply.setAttribute('aria-live','polite');
  const progress=node('progress','cooking-progress');progress.max=10;progress.setAttribute('aria-label','Progreso de la receta');
  const backHome=labeledButton('Volver a nuestra casita',()=>{
    if(state.served){api.save.home=chooseHomeActivity(api.save.home,'eat');api.onProgressChange?.();}
    api.openExperience?.('casita');
  },'cooking-back-home');
  controls.append(title,hint,steps,progress,actions,reply,backHome);shell.append(stage,heading,cookbook,controls);root.append(shell);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  let worktopOffset=0;
  function fitWorktop(){
    if(!alive)return;
    const box=canvas.getBoundingClientRect(),hud=controls.getBoundingClientRect();
    if(!box.width||!box.height||!hud.height)return;
    const scale=Math.max(box.width/640,box.height/400);
    const position=parseFloat(getComputedStyle(canvas).objectPosition.split(' ')[1])/100;
    const worktopBottom=box.top+worktopOffset+(box.height-400*scale)*position+267*scale;
    const offset=Math.max(0,Math.ceil(worktopBottom-hud.top+16));
    if(offset===worktopOffset)return;
    worktopOffset=offset;canvas.style.transform=`translateY(-${offset}px)`;
  }
  // Replies can wrap onto extra lines after serving, including on a small
  // phone. Measure the real HUD so the shared plates stay above its edge.
  const framing=new ResizeObserver(fitWorktop);framing.observe(stage);framing.observe(controls);
  let image=null;
  if(!api.assetImage?.(BACKGROUND)){image=new Image();image.src=BACKGROUND;image.onload=()=>alive&&draw();}
  const background=()=>api.assetImage?.(BACKGROUND)||(image?.complete&&image.naturalWidth?image:null);
  function save(){api.save.cooking=state;api.onProgressChange?.();}
  function select(id){const restoreFocus=shell.contains(document.activeElement);state=chooseRecipe(state,id);actionAt=clock;cookbook.open=false;reply.textContent='Leo: tú y yo hacemos buen equipo.';api.onLeoSay?.('Tú y yo hacemos buen equipo.');save();render();draw();if(restoreFocus)actions.querySelector('button')?.focus({preventScroll:true});}
  function perform(kind,id){
    const before=cookingStage(state),restoreFocus=actions.contains(document.activeElement);
    state=kind==='ingredient'?prepareIngredient(state,id):kind==='stir'?stirRecipe(state):kind==='cook'?heatRecipe(state):serveRecipe(state);
    actionAt=clock;save();
    if(state.served&&before==='serve'){
      const line=recipeById(state.recipe).line;reply.textContent='Leo: '+line;api.onLeoSay?.(line);api.onSfx?.('chime');
    }else if(kind==='ingredient')reply.textContent='Añadimos '+recipeById(state.recipe).ingredients.find(item=>item.id===id).label.toLowerCase()+'.';
    else if(kind==='stir')reply.textContent=state.stirs===4?'La mezcla quedó lista.':'Mezclando juntos… '+state.stirs+' / 4';
    else reply.textContent=state.heat===3?'Listo para compartir.':'A fuego lento… '+state.heat+' / 3';
    render();draw();if(restoreFocus)actions.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  function render(){
    const phase=cookingStage(state),recipe=recipeById(state.recipe);
    Object.assign(shell.dataset,{cookingStage:phase,cookingRecipe:state.recipe||'',cookingServings:String(Object.values(state.servings).reduce((a,b)=>a+b,0))});
    Object.assign(canvas.dataset,{cookingStage:phase,itzaLook:getChoice(api.getOutfits?.()??api.save.outfits,'itza'),leoLook:getChoice(api.getOutfits?.()??api.save.outfits,'leo'),itzaHair:getHairColor(api.getOutfits?.()??api.save.outfits),itzaGlasses:String(getGlasses(api.getOutfits?.()??api.save.outfits,'itza')),leoGlasses:String(getGlasses(api.getOutfits?.()??api.save.outfits,'leo'))});
    title.textContent=recipe?recipe.label:copy[phase][0];hint.textContent=copy[phase][1];
    backHome.textContent=state.served?'Comer juntos en la casita':'Volver a nuestra casita';
    backHome.setAttribute('aria-label',backHome.textContent);
    progress.value=state.prepared.length+state.stirs+state.heat;
    const index={choose:-1,prepare:0,stir:1,cook:2,serve:3,served:4}[phase];
    [...steps.children].forEach((item,i)=>{item.dataset.step=i<index?'complete':i===index?'active':'waiting';if(i===index)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
    for(const item of RECIPES){const button=recipeButtons.get(item.id);button.querySelector('.cooking-recipe-count').textContent=state.servings[item.id]?'Cocinada '+state.servings[item.id]+' '+(state.servings[item.id]===1?'vez':'veces'):'Una nueva receta';button.setAttribute('aria-pressed',String(item.id===state.recipe));}
    actions.replaceChildren();
    if(phase==='choose')for(const item of RECIPES){const button=labeledButton(item.short,()=>select(item.id));button.dataset.cookingChoose=item.id;actions.append(button);}
    else if(phase==='prepare')for(const ingredient of recipe.ingredients){
      const added=state.prepared.includes(ingredient.id),button=labeledButton((added?'✓ ':'+ ')+ingredient.label,()=>perform('ingredient',ingredient.id));button.dataset.cookingIngredient=ingredient.id;button.disabled=added;actions.append(button);
    }else{
      const labels={stir:'Mezclar juntos · '+state.stirs+' / 4',cook:'Cocinar a fuego lento · '+state.heat+' / 3',serve:'Servir para los dos',served:'Cocinar otra receta'};
      const button=labeledButton(labels[phase],()=>{if(phase==='served'){cookbook.open=true;summary.focus({preventScroll:true});}else perform(phase==='serve'?'serve':phase);});button.dataset.cookingAction=phase;actions.append(button);
    }
    canvas.setAttribute('aria-label',`Itza y Leo en su cocina. ${recipe?.label||'Eligiendo una receta'}. ${copy[phase][0]}.`);
  }
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function heart(x,y){rect(x+1,y,2,1,'#D58589');rect(x+4,y,2,1,'#D58589');rect(x,y+1,7,2,'#D58589');rect(x+1,y+3,5,1,'#D58589');rect(x+2,y+4,3,1,'#D58589');rect(x+3,y+5,1,1,'#D58589');}
  // Both chefs use the side-on sleeve, elbow and hand of their selected outfit.
  // Only the forearms reach over the far edge of the counter.
  function chef(actor,x,y,mirror,forearm=false){
    if(!actor)return;
    ctx.save();ctx.translate(x+(mirror?32:0),y);if(mirror)ctx.scale(-1,1);
    if(forearm){
      const left=actor.elbow;
      ctx.drawImage(actor.canvas,left,28,32-left,10,left,28,32-left,10);
    }else ctx.drawImage(actor.canvas,0,0);
    ctx.restore();
  }
  function utensil(actor,x,y,mirror,knife){
    if(!actor)return;
    const handX=x+(mirror?31-actor.gripX:actor.gripX),handY=y+actor.gripY;
    const direction=mirror?-1:1;
    for(let i=1;i<=6;i++){
      const px=handX+direction*Math.round(i/2),py=handY+i;
      rect(px,py,2,2,'#785035');rect(px,py,1,1,'#C6935D');
    }
    const tipX=handX+direction*4,tipY=handY+7;
    if(knife){
      rect(tipX,tipY,3,4,'#766763');rect(tipX,tipY,2,3,'#E1D6BA');
    }else{
      rect(tipX-1,tipY,4,3,'#835330');rect(tipX,tipY-1,2,4,'#C38D58');
    }
  }
  function worktop(recipe,phase){
    rect(278,249,30,11,'#8C5939');rect(277,248,30,10,'#AE794D');
    rect(279,247,26,10,'#D7A66D');rect(280,248,22,1,'#E9BB82');
    if(recipe)recipe.ingredients.forEach((item,i)=>{
      if(!state.prepared.includes(item.id))return;
      const x=280+8*i;
      rect(x,252,6,3,item.color);rect(x+1,250,4,6,item.color);rect(x+1,251,2,1,'#FFE7B5');
    });
    const soup=recipe?.color??'#C79162';
    rect(319,250,29,6,'#775744');rect(321,255,25,4,'#9B7F62');rect(324,259,19,3,'#A48166');rect(328,262,11,1,'#765741');
    rect(320,250,27,4,'#FCEDCC');rect(322,254,23,3,'#E9D0A6');rect(325,257,17,3,'#C3AF87');
    rect(319,248,29,4,'#F6E5BF');rect(322,247,23,6,'#F6E5BF');
    rect(321,249,25,2,soup);rect(324,248,19,4,soup);rect(336,249,6,1,'#F0CC93');
    if(phase==='cook'||phase==='serve'){
      rect(322,264,23,2,'#634D42');for(let i=0;i<3;i++)rect(326+i*6,262,2,2,'#DA9349');
      if(!preference.matches)for(let i=0;i<3;i++){
        const rise=Math.floor((clock*.8+i*.32)%1*13);rect(326+i*7,245-rise,1,3,'#FFF0DAAA');
      }
    }
  }
  function draw(){
    if(!alive)return;ctx.imageSmoothingEnabled=false;const bg=background();
    if(bg)ctx.drawImage(bg,0,0,640,400);else{rect(0,0,640,400,'#DFC49B');rect(0,210,640,190,'#BC865D');rect(164,242,312,140,'#AD7448');}
    const phase=cookingStage(state),recipe=recipeById(state.recipe),active=!preference.matches&&clock-actionAt<.65;
    const pose=cookingPose(phase,clock,preference.matches,active),outfits=api.getOutfits?.()??api.save.outfits??{};
    const leo=kitchenActor('leo',pose,outfits,api),itza=kitchenActor('itza',pose,outfits,api);
    chef(leo,270,209,false);chef(itza,328,209,true);
    if(bg)ctx.drawImage(bg,160,242,320,145,160,242,320,145);
    if(phase==='served'){
      const food=api.assetImage?.('/assets/game/cooking/foods.png');
      if(food)for(const x of [294,337])ctx.drawImage(food,recipe.frame*32,0,32,32,x-16,234,32,32);
      const rise=preference.matches?0:Math.round(Math.sin(clock*1.5)*2);heart(312,205+rise);
    }else{
      worktop(recipe,phase);
      if(phase!=='choose'){
        utensil(leo,270,209,false,phase==='prepare');utensil(itza,328,209,true,false);
        chef(leo,270,209,false,true);chef(itza,328,209,true,true);
      }
    }
    canvas.dataset.cookingAnimation=active?'working':phase==='served'?'shared':'idle';
  }
  function schedule(){if(alive&&!raf&&!document.hidden&&!preference.matches)raf=requestAnimationFrame(tick);}
  function tick(time){raf=0;if(!alive)return;clock+=last?Math.min(.05,(time-last)/1000):0;last=time;draw();schedule();}
  function motion(){cancelAnimationFrame(raf);raf=0;last=0;draw();schedule();}
  function visibility(){last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{draw();schedule();}}
  preference.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
  render();draw();schedule();save();
  return()=>{alive=false;cancelAnimationFrame(raf);framing.disconnect();if(image)image.onload=null;preference.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
}
