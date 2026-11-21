import {node,labeledButton} from './dom.js';
import {getSelectedLook} from '../wardrobe.js';
import {GARDEN_FLOWERS,GARDEN_PLOTS,visitGarden,plantGarden,waterGarden,advanceGarden,gardenStage,
  harvestGarden,decorateGarden,gardenViewport} from '../garden.js';
import './huerto.css';

const BACKGROUND='/assets/game/garden/garden.png',FLOWERS='/assets/game/garden/flowers.png';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function mount(root,_data,api){
  api.save??={};
  let state=visitGarden(api.save.garden),selected=4,seed='cosmos',alive=true,raf=0,last=0,clock=0,saveClock=0;
  let action='idle',until=0,drawerOpen=false,queued=false,actionFlower='cosmos';
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)'),camera={x:0,y:0};
  const pair={x:GARDEN_PLOTS[selected].x-60,y:GARDEN_PLOTS[selected].y+23};
  const shell=node('section','garden-trip');shell.setAttribute('aria-label','Nuestro jardín de flores');
  const stage=node('div','garden-stage'),canvas=node('canvas','garden-scene');canvas.width=640;canvas.height=400;canvas.tabIndex=0;
  canvas.setAttribute('role','application');canvas.setAttribute('aria-label','Nuestro jardín. Toca un bancal o elige uno de los seis botones. Flechas para cambiar de bancal; E para sembrar, regar o recoger.');
  stage.append(canvas);
  const top=node('div','garden-top');top.append(node('span','garden-location','Nuestro jardín'));
  const decorToggle=labeledButton('Decorar la casita',()=>{drawerOpen=!drawerOpen;render();},'garden-decor-toggle');decorToggle.setAttribute('aria-expanded','false');
  const harvestCount=node('span','garden-harvest-count');top.append(harvestCount,decorToggle);
  const hud=node('section','garden-hud');hud.setAttribute('aria-label','Herramientas del jardín');
  const info=node('p','garden-info');info.setAttribute('role','status');info.setAttribute('aria-live','polite');
  const plots=node('div','garden-plots');plots.setAttribute('role','group');plots.setAttribute('aria-label','Bancales de flores');
  const plotButtons=GARDEN_PLOTS.map(plot=>{
    const button=labeledButton(String(plot.id+1),()=>choosePlot(plot.id),'garden-plot');button.dataset.gardenPlot=String(plot.id);plots.append(button);return button;
  });
  const tools=node('div','garden-tools'),seeds=node('div','garden-seeds');seeds.setAttribute('role','group');seeds.setAttribute('aria-label','Semillas de flores');
  const seedButtons=GARDEN_FLOWERS.map(flower=>{
    const button=labeledButton(flower.short,()=>{seed=flower.id;render();},'garden-seed');button.dataset.gardenSeed=flower.id;button.style.setProperty('--flower-color',flower.color);seeds.append(button);return button;
  });
  const primary=labeledButton('',()=>perform(),'garden-primary');tools.append(seeds,primary);hud.append(info,plots,tools);
  const reply=node('p','garden-reply','Leo: plantemos algo bonito y lo vemos crecer juntos.');reply.setAttribute('role','status');reply.setAttribute('aria-live','polite');
  const drawer=node('section','garden-decoration');drawer.setAttribute('aria-label','Flores para decorar nuestra casita');
  const drawerTitle=node('div','garden-decoration-heading');drawerTitle.append(node('h3','','Un florero para casa'));
  const closeDrawer=labeledButton('×',()=>{drawerOpen=false;render();decorToggle.focus();},'garden-decoration-close');closeDrawer.setAttribute('aria-label','Cerrar decoración');drawerTitle.append(closeDrawer);
  drawer.append(drawerTitle,node('p','garden-decoration-hint','Recoge una flor para hacer su florero. Después puedes cambiarlo cuando quieras.'));
  const decorationButtons=GARDEN_FLOWERS.map(flower=>{
    const button=labeledButton('',()=>decorate(flower.id),'garden-decoration-choice');button.dataset.gardenDecoration=flower.id;button.style.setProperty('--flower-color',flower.color);
    const icon=node('span','garden-vase-icon');icon.style.backgroundPosition=`${-flower.frame*32}px -96px`;icon.setAttribute('aria-hidden','true');
    const text=node('span');text.append(node('strong','',flower.label),node('span','garden-stock'));button.append(icon,text);drawer.append(button);return button;
  });
  const clearDecor=labeledButton('Guardar el florero',()=>decorate(null),'garden-decoration-clear');
  const goHome=labeledButton('Ver el florero en casa',()=>api.openExperience?.('casita'),'garden-go-home');drawer.append(clearDecor,goHome);
  shell.append(stage,top,reply,hud,drawer);root.append(shell);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  function save(){api.save.garden=state;api.onProgressChange?.();}
  function say(line){reply.textContent='Leo: '+line;api.onLeoSay?.(line);}
  function growing(){return state.plots.some(plot=>plot.flower&&plot.watered&&plot.growth<1);}
  function render(){
    const plot=state.plots[selected],flower=GARDEN_FLOWERS.find(f=>f.id===plot.flower),growth=gardenStage(plot),selectedSeed=GARDEN_FLOWERS.find(f=>f.id===seed);
    shell.dataset.gardenAction=action;canvas.dataset.gardenPlot=String(selected);canvas.dataset.gardenStage=String(growth);canvas.dataset.gardenAction=action;
    info.textContent=queued?'Vamos a ese bancal…':growth===0?`Bancal ${selected+1} · una semillita, un comienzo`:
      growth===3?`${flower.label} · ¡listas para recoger!`:!plot.watered?`${flower.label} · necesitan agüita`:
      `${flower.label} · ${growth===2?'ya vienen los capullos':'creciendo juntas'} · ${Math.max(1,Math.ceil((1-plot.growth)*7))} s`;
    primary.textContent=queued?'Caminando…':growth===0?'Sembrar '+selectedSeed.short.toLowerCase():growth===3?'Recoger flores':!plot.watered?'Regar las flores':'Creciendo…';
    primary.disabled=queued||Boolean(plot.flower&&plot.watered&&growth<3);
    seeds.hidden=Boolean(plot.flower);
    for(const [index,button] of plotButtons.entries()){
      const p=state.plots[index],stage=gardenStage(p),name=GARDEN_FLOWERS.find(f=>f.id===p.flower)?.label;
      button.setAttribute('aria-pressed',String(index===selected));button.setAttribute('aria-label',`Bancal ${index+1}: ${stage===0?'vacío':name+', '+(stage===3?'listo para recoger':p.watered?'creciendo':'sin regar')}`);
      button.dataset.gardenStage=String(stage);button.style.setProperty('--flower-color',GARDEN_FLOWERS.find(f=>f.id===p.flower)?.color||'#C3AC7F');
    }
    seedButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(GARDEN_FLOWERS[index].id===seed)));
    harvestCount.textContent=state.harvested+' flores recogidas';drawer.hidden=!drawerOpen;decorToggle.setAttribute('aria-expanded',String(drawerOpen));
    for(const [index,button] of decorationButtons.entries()){
      const id=GARDEN_FLOWERS[index].id,unlocked=state.decorations.includes(id);button.disabled=!unlocked&&!state.inventory[id];button.setAttribute('aria-pressed',String(state.decoration===id));
      button.querySelector('.garden-stock').textContent=state.decoration===id?'En nuestra casita':unlocked?'Florero disponible':state.inventory[id]+' flores · cuesta 1';
    }
    clearDecor.disabled=!state.decoration;
  }
  function choosePlot(index){if(!alive||!GARDEN_PLOTS[index])return;selected=index;queued=false;action='walk';until=0;render();draw();schedule();}
  function perform(){
    if(!alive||primary.disabled)return;
    const spot=GARDEN_PLOTS[selected],distance=Math.hypot(pair.x-(spot.x-60),pair.y-(spot.y+23));
    if(distance>3){queued=true;action='walk';render();schedule();return;}
    execute();
  }
  function execute(){
    queued=false;const plot=state.plots[selected],growth=gardenStage(plot);
    const result=growth===0?plantGarden(state,selected,seed):growth===3?harvestGarden(state,selected):waterGarden(state,selected);
    if(!result.changed){render();return;}
    state=result.state;action=growth===0?'plant':growth===3?'harvest':'water';until=clock+1.6;
    const flower=GARDEN_FLOWERS.find(f=>f.id===(result.flower||plot.flower||seed));actionFlower=flower.id;
    say(action==='plant'?'Yo pongo la semilla y tú le das el cariño.':action==='water'?'Un poquito de agua… y mucha paciencia de la bonita.':flower.line);
    if(action==='harvest')api.onSfx?.('chime');save();render();draw();schedule();
  }
  function decorate(id){
    const result=decorateGarden(state,id);if(!result.changed)return;
    state=result.state;save();render();say(id?'Ya dejé nuestro florero en la casita. Lo sembramos entre los dos.':'Lo guardamos hasta la próxima florecita.');api.onSfx?.('chime');
  }
  function actor(who,x,y,moving){
    const selectedLook=getSelectedLook(api.getOutfits?.()??api.save.outfits??{},who),image=selectedLook&&(api.getCharacterImage?.(selectedLook.sheet)??api.assetImage?.(selectedLook.sheet));if(!image)return;
    const frame=moving&&!preference.matches?Math.floor(clock*7)%6:0;
    ctx.fillStyle='#6F61422E';ctx.fillRect(Math.round(x)-7,Math.round(y)-1,19,3);
    ctx.drawImage(image,frame*32,48,32,48,Math.round(x)-16,Math.round(y)-46,32,48);
  }
  function draw(){
    if(!alive)return;ctx.imageSmoothingEnabled=false;
    const spot=GARDEN_PLOTS[selected];camera.x=Math.round(clamp(spot.x-38-canvas.width/2,0,640-canvas.width));camera.y=Math.round(clamp(spot.y+17-canvas.height*.48,0,400-canvas.height));
    ctx.save();ctx.translate(-camera.x,-camera.y);
    const background=api.assetImage?.(BACKGROUND);if(background)ctx.drawImage(background,0,0,640,400);else{ctx.fillStyle='#A4AF76';ctx.fillRect(0,0,640,400);}
    const flowers=api.assetImage?.(FLOWERS);
    for(const [index,bed] of GARDEN_PLOTS.entries()){
      const plot=state.plots[index],stage=gardenStage(plot),flower=GARDEN_FLOWERS.find(f=>f.id===plot.flower);
      if(plot.watered){ctx.fillStyle='#61483C66';ctx.fillRect(bed.x-43,bed.y-20,86,25);}
      if(flowers&&flower){
        for(const [plantIndex,offset] of [[0,-29],[1,-8],[2,14],[3,31]]){
          const dx=bed.x+offset-16,dy=bed.y-30+(plantIndex%2)*6;
          ctx.drawImage(flowers,flower.frame*32,(stage-1)*32,32,32,dx,dy,32,32);
        }
      }
      if(index===selected){ctx.fillStyle='#F8E9B5';ctx.fillRect(bed.x-48,bed.y+15,96,1);ctx.fillRect(bed.x-48,bed.y+12,1,4);ctx.fillRect(bed.x+47,bed.y+12,1,4);}
      ctx.fillStyle=index===selected?'#FBE6B9':'#EBD9AF';ctx.fillRect(bed.x-5,bed.y+18,11,8);ctx.fillStyle='#775D46';ctx.font="7px monospace";ctx.fillText(String(index+1),bed.x-2,bed.y+25);
    }
    const moving=action==='walk';actor('leo',pair.x-24,pair.y-2,moving);actor('itza',pair.x+8,pair.y,moving);
    if(action==='water'){
      const px=Math.round(pair.x+16),py=Math.round(pair.y-17),sway=preference.matches?0:Math.floor(Math.sin(clock*9));
      ctx.fillStyle='#526F6B';ctx.fillRect(px,py,11,8);ctx.fillRect(px+8,py-3,4,3);ctx.fillRect(px+10,py-4,6,2);ctx.fillStyle='#A1BCAC';ctx.fillRect(px+2,py+1,7,4);
      ctx.fillStyle='#C5E1D3';for(let i=0;i<4;i++)ctx.fillRect(spot.x-14+i*5,spot.y+4+((i*7+(preference.matches?0:Math.floor(clock*25)))%7)+sway,1,2);
    }
    if(action==='plant'){ctx.fillStyle='#7A6244';ctx.fillRect(Math.round(pair.x+19),Math.round(pair.y-23),8,10);ctx.fillStyle=GARDEN_FLOWERS.find(f=>f.id===seed).color;ctx.fillRect(Math.round(pair.x+20),Math.round(pair.y-21),6,5);}
    if(action==='harvest'&&flowers){const flower=GARDEN_FLOWERS.find(f=>f.id===actionFlower);ctx.drawImage(flowers,(flower?.frame||0)*32,96,32,32,Math.round(pair.x+11),Math.round(pair.y-29),23,23);}
    if(!preference.matches){ctx.fillStyle='#F5CED17A';for(let i=0;i<5;i++){const px=(83+i*117+clock*(3+i%2))%640,py=(i*83+clock*(5+i%3))%360;ctx.fillRect(Math.floor(px),Math.floor(py),2,1);}}
    ctx.restore();canvas.dataset.gardenMotion=preference.matches?'reduced':'active';canvas.dataset.cameraX=String(camera.x);canvas.dataset.cameraY=String(camera.y);
  }
  function update(dt){
    const spot=GARDEN_PLOTS[selected],dx=spot.x-60-pair.x,dy=spot.y+23-pair.y,distance=Math.hypot(dx,dy);
    if(distance>.5){const step=Math.min(distance,140*dt);pair.x+=dx/distance*step;pair.y+=dy/distance*step;}
    else if(action==='walk'){if(queued)execute();else{action='idle';render();}}
    if(until&&clock>=until){until=0;action='idle';render();}
    if(growing()){
      const stages=state.plots.map(gardenStage),was=stages[selected];state=advanceGarden(state,dt);saveClock+=dt;
      if(saveClock>=.6){saveClock=0;save();render();}
      const now=gardenStage(state.plots[selected]);
      if(state.plots.some((plot,index)=>gardenStage(plot)!==stages[index])){save();render();}
      if(now!==was&&now===3){say('¡Mira, ya florecieron! Las cuidamos juntos.');api.onSfx?.('chime');}
    }
  }
  function tick(time){raf=0;if(!alive||document.hidden)return;const dt=last?Math.min(.1,(time-last)/1000):0;last=time;clock+=dt;update(dt);draw();schedule();}
  function schedule(){if(alive&&!raf&&!document.hidden&&(!preference.matches||growing()||action!=='idle'))raf=requestAnimationFrame(tick);}
  function resize(){const viewport=gardenViewport(stage.clientWidth,stage.clientHeight);canvas.width=viewport.width;canvas.height=viewport.height;Object.assign(canvas.style,{width:viewport.cssWidth+'px',height:viewport.cssHeight+'px',left:Math.floor((stage.clientWidth-viewport.cssWidth)/2)+'px',top:Math.floor((stage.clientHeight-viewport.cssHeight)/2)+'px'});draw();}
  function pointer(event){if(event.button!==0)return;const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width*canvas.width+camera.x,y=(event.clientY-bounds.top)/bounds.height*canvas.height+camera.y;const plot=GARDEN_PLOTS.find(p=>Math.abs(x-p.x)<55&&Math.abs(y-p.y)<30);if(plot)choosePlot(plot.id);canvas.focus({preventScroll:true});}
  function keydown(event){if(event.target!==canvas)return;const key=event.key.toLowerCase();let next=selected;if(key==='arrowleft'||key==='a')next=(selected+5)%6;else if(key==='arrowright'||key==='d')next=(selected+1)%6;else if(key==='arrowup'||key==='arrowdown'||key==='w'||key==='s')next=(selected+3)%6;else if(key==='e'||key===' '){event.preventDefault();perform();return;}else if(/^[1-6]$/.test(key))next=Number(key)-1;else return;event.preventDefault();choosePlot(next);}
  function visibility(){last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;save();}else{draw();schedule();}}
  function motion(){cancelAnimationFrame(raf);raf=0;last=0;draw();schedule();}
  canvas.addEventListener('pointerdown',pointer);canvas.addEventListener('keydown',keydown);document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',motion);
  const observer=new ResizeObserver(resize);observer.observe(stage);save();render();resize();schedule();
  return ()=>{save();alive=false;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerdown',pointer);canvas.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',motion);};
}
