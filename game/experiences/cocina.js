import {node,labeledButton} from './dom.js';
import {RECIPES,recipeById,normalizeCooking,cookingStage,chooseRecipe,prepareIngredient,stirRecipe,heatRecipe,serveRecipe} from '../cooking.js';
import {getSelectedLook,getChoice} from '../wardrobe.js';
import {getHairColor} from '../hair.js';
import {getGlasses} from '../glasses.js';
import './cocina.css';
const BACKGROUND='/assets/game/cooking/kitchen.png';
const copy={choose:['Una receta para los dos','Elige algo rico en nuestro recetario.'],prepare:['Todo comienza con cariño','Añade los tres ingredientes a la mesa.'],stir:['Una vuelta tú, otra yo','Mezclen juntos hasta que todo esté listo.'],cook:['A fuego lento','Cocinen en tres pasos, sin prisas.'],serve:['¡Huele delicioso!','Lleven su creación a la mesa.'],served:['Nuestra receta ya tiene historia','La guardamos en nuestro recetario. ¿Hacemos otra?']};
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
  const backHome=labeledButton('Volver a nuestra casita',()=>api.openExperience?.('casita'),'cooking-back-home');
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
  function actor(who,x,y){
    const look=getSelectedLook(api.getOutfits?.()??api.save.outfits??{},who);const sheet=api.getCharacterImage?.(look?.sheet)??api.assetImage?.(look?.sheet);if(!sheet)return;
    // Use the complete personalized idle frame. Faces, glasses and hair are never repainted.
    const frame=0;ctx.drawImage(sheet,frame*32,0,32,48,x,y,32,48);
  }
  function arm(points,color){ctx.strokeStyle='#5E3E33';ctx.lineWidth=5;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();}
  function draw(){
    if(!alive)return;ctx.imageSmoothingEnabled=false;const bg=background();
    if(bg)ctx.drawImage(bg,0,0,640,400);else{rect(0,0,640,400,'#DFC49B');rect(0,210,640,190,'#BC865D');rect(164,242,312,140,'#AD7448');}
    const phase=cookingStage(state),recipe=recipeById(state.recipe),active=!preference.matches&&clock-actionAt<.65;
    const sway=active?Math.round(Math.sin((clock-actionAt)*12)):0;
    actor('leo',275,197);actor('itza',329,197);
    // Restore only the island foreground: the complete heads and torsos stay above its edge.
    if(bg)ctx.drawImage(bg,160,242,320,145,160,242,320,145);
    rect(275,248,37,16,'#6C4932');rect(276,247,35,15,'#DEB77C');rect(279,249,2,1,'#EED4A1');
    rect(319,254,34,5,'#795247');rect(316,247,40,8,'#FFF0D2');rect(319,255,34,7,'#F3D3A8');rect(323,262,26,2,'#B88A65');
    rect(320,248,32,5,recipe?.color||'#E9C48F');
    if(recipe)for(const [i,ingredient]of recipe.ingredients.entries()){
      const x=281+i*10,y=251;
      rect(x,y,7,6,state.prepared.includes(ingredient.id)?ingredient.color:'#F1D8AC');
      if(state.prepared.includes(ingredient.id))rect(x+2,y-1,2,1,'#FFF0D2');
    }
    // Connected forearms and a spoon animate on the worktop, below intact walking-sheet faces.
    if(['prepare','stir','cook','serve'].includes(phase)){
      arm([[289,228],[290,240],[294+sway,248]],({principal:'#B86E65',alternativo:'#64775B',boda:'#453B38'})[getChoice(api.getOutfits?.()??api.save.outfits,'leo')]);
      rect(292+sway,246,4,4,'#BD8966');
      arm([[343,228],[344,239],[337+sway,247]],getChoice(api.getOutfits?.()??api.save.outfits,'itza')==='boda'?'#F5E3CA':'#51433F');
      rect(334+sway,245,4,4,'#C28A68');
      ctx.strokeStyle='#805537';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(336+sway,247);ctx.lineTo(331-sway,255);ctx.stroke();
      if(phase==='prepare'&&active){rect(293+sway,246-sway,2,8,'#EEE0BA');rect(293+sway,243-sway,2,4,'#79523B');}
    }
    if(phase==='cook'||phase==='serve'){
      rect(320,267,33,2,'#59483D');for(let i=0;i<3;i++)rect(325+i*8,265,3,2,phase==='cook'?'#D99047':'#BC8E5A');
      if(!preference.matches)for(let i=0;i<3;i++){const rise=Math.floor((clock*.8+i*.32)%1*15);rect(326+i*8,244-rise,1,4,'#FFF0DAAA');}
    }
    if(phase==='served'){
      for(const x of [293,343]){rect(x-12,248,24,11,'#FAE9CE');rect(x-9,250,18,7,recipe?.color||'#D9A56D');rect(x-3,249,4,1,'#E4C396');}
      const rise=preference.matches?0:Math.round(Math.sin(clock*1.5)*2);heart(313,204+rise);
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
