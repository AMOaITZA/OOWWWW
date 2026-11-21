import {node,labeledButton} from './dom.js';
import {getSelectedLook,getChoice} from '../wardrobe.js';
import {getHairColor} from '../hair.js';
import {getGlasses} from '../glasses.js';
import {drawDancingPair} from '../dance.js';
import {mountSceneMusic} from '../scene-music.js';
import {HAWAII_ZONES,HAWAII_DRINKS,visitHawaii,danceInHawaii,buyHawaiiDrink,petHawaiiGiraffe,
  hawaiiZoneAt,hawaiiWalkable,nearestHawaiiPoint,hawaiiViewport} from '../hawaii.js';
import './hawai.css';

const BACKGROUND='/assets/game/travel/hawaii.png',GIRAFFE='/assets/game/travel/giraffe.png';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const arrows={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};

export function mount(root,_data,api){
  api.save??={};
  let state=visitHawaii(api.save.hawaii),alive=true,raf=0,last=0,clock=0,action='explore',actionUntil=0;
  let nearby=null,petCooldown=0,drinkUntil=0,route=[],destination=null,pendingAction=null,moving=false,direction='down';
  let menuOpen=false,speechTimer=0,danceStarted=0;
  const pair={x:320,y:299},camera={x:0,y:0},keys=new Set();
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell=node('section','hawaii-trip');shell.setAttribute('aria-label','Nuestra isla de Hawái');
  const stage=node('div','hawaii-stage'),canvas=node('canvas','hawaii-map');canvas.width=640;canvas.height=400;canvas.tabIndex=0;
  canvas.setAttribute('role','application');canvas.setAttribute('aria-label','Mapa de Hawái. Toca la arena para caminar; usa flechas o WASD y E para interactuar. También puedes elegir un lugar con los botones.');
  stage.append(canvas);
  const top=node('div','hawaii-topline');
  const back=labeledButton('Volver a nuestro mundo',()=>api.requestClose?.(),'hawaii-back');
  back.append(node('span','hawaii-back-arrow','←'));back.setAttribute('aria-label','Volver a nuestro mundo');
  const place=node('span','hawaii-location','Hawái · Playa de Aloha');place.setAttribute('aria-hidden','true');
  const wallet=node('p','hawaii-wallet');wallet.setAttribute('aria-label','Conchitas para comprar bebidas');
  top.append(back,place,wallet);
  const travel=node('nav','hawaii-destinations');travel.setAttribute('aria-label','Lugares de Hawái');
  const zoneButtons=new Map();
  for(const [id,label,short,icon] of [['bar','Bar de la playa','Bebidas','◒'],['dance','Bailar juntos','Bailar','♫'],['giraffe','Visitar a la jirafa','Jirafa','♡']]){
    const button=labeledButton('',()=>goTo(id),'hawaii-destination');button.dataset.hawaiiDestination=id;button.setAttribute('aria-label',label);
    const symbol=node('span','hawaii-destination-icon',icon);symbol.setAttribute('aria-hidden','true');
    button.append(symbol,node('strong','',short));travel.append(button);zoneButtons.set(id,button);
  }
  const status=node('p','hawaii-status','Leo: mi lugar favorito sigue siendo contigo.');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const interaction=node('section','hawaii-interaction');interaction.setAttribute('aria-label','Actividad de la isla');
  const primary=labeledButton('',()=>perform(),'hawaii-primary');
  interaction.append(primary);
  const drinks=node('section','hawaii-drinks');drinks.setAttribute('aria-label','Bebidas del bar de la playa');
  const drinkHeader=node('div','hawaii-drinks-heading');
  const title=node('h3','','Un brindis para dos');
  const closeDrinks=labeledButton('×',()=>{menuOpen=false;render();primary.focus({preventScroll:true});},'hawaii-close-drinks');closeDrinks.setAttribute('aria-label','Cerrar bebidas');
  drinkHeader.append(title,closeDrinks);drinks.append(drinkHeader);
  const drinkChoices=node('div','hawaii-drink-choices');
  const drinkButtons=HAWAII_DRINKS.map(drink=>{
    const button=labeledButton('',()=>buy(drink.id),'hawaii-drink');button.dataset.hawaiiDrink=drink.id;
    const swatch=node('span','hawaii-cup');swatch.style.setProperty('--drink-color',drink.color);swatch.setAttribute('aria-hidden','true');
    const details=node('span','hawaii-drink-details');details.append(node('strong','',drink.label),node('span','',drink.detail),node('b','',drink.cost+' conchitas'));
    button.append(swatch,details);drinkChoices.append(button);return {drink,button};
  });
  const drinkHint=node('p','hawaii-drink-hint','Un baile nos regala tres conchitas para el siguiente brindis.');
  drinks.append(drinkChoices,drinkHint);
  const memories=node('p','hawaii-memories');
  const help=node('p','hawaii-help','Toca la arena para caminar · E para interactuar');
  shell.append(stage,top,travel,status,interaction,drinks,memories,help);root.append(shell);
  const releaseMusic=mountSceneMusic(shell,api.music);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  function save(){api.save.hawaii=state;api.onProgressChange?.();}
  function speak(line){
    clearTimeout(speechTimer);status.textContent='Leo: '+line;status.hidden=false;
    speechTimer=setTimeout(()=>{if(alive)status.hidden=true;},6500);
  }
  function say(line){speak(line);api.onLeoSay?.(line);}
  function render(){
    const zone=nearby;
    wallet.textContent='◌ '+state.shells;wallet.title=state.shells+' conchitas';
    memories.textContent=state.dances+' bailes · '+Object.values(state.drinks).reduce((total,n)=>total+n,0)+' bebidas · '+state.giraffePets+' cariñitos a la jirafa';
    Object.assign(shell.dataset,{hawaiiAction:action,hawaiiZone:zone?.id||'beach',hawaiiShells:String(state.shells),shopOpen:String(menuOpen)});
    const choices=api.getOutfits?.()??api.save.outfits??{};
    Object.assign(canvas.dataset,{hawaiiX:String(Math.round(pair.x)),hawaiiY:String(Math.round(pair.y)),leoLook:getChoice(choices,'leo'),itzaLook:getChoice(choices,'itza'),itzaHair:getHairColor(choices),itzaGlasses:String(getGlasses(choices,'itza')),hawaiiAction:action});
    for(const [id,button] of zoneButtons)button.setAttribute('aria-current',zone?.id===id?'location':'false');
    place.textContent='Hawái · '+(zone?.label||'Playa de Aloha');
    drinks.hidden=!menuOpen;
    for(const {drink,button} of drinkButtons)button.disabled=state.shells<drink.cost||Boolean(route.length);
    primary.hidden=!zone||Boolean(route.length)||(zone.id==='bar'&&menuOpen);
    primary.disabled=Boolean(route.length);
    primary.textContent=zone?.id==='dance'?(action==='dance'?'Dejar de bailar':'Bailar con Leo'):zone?.id==='bar'?'Ver bebidas':'Acariciar a la jirafa';
    help.textContent=destination?'Caminando hacia '+destination.label.toLowerCase()+'…':'Toca la arena para caminar · E para interactuar';
  }
  function stopAction(){action='explore';actionUntil=0;}
  function routeTo(point){route=[{x:pair.x,y:245},{x:point.x,y:245},{...point}];}
  function goTo(id){
    if(!alive)return;
    const zone=HAWAII_ZONES.find(zone=>zone.id===id);if(!zone)return;
    stopAction();keys.clear();menuOpen=false;nearby=null;destination=zone;pendingAction=null;
    routeTo(zone.arrival);render();canvas.focus({preventScroll:true});schedule();
  }
  function perform(){
    if(!alive||!nearby||route.length)return;
    if(Math.hypot(pair.x-nearby.arrival.x,pair.y-nearby.arrival.y)>1){
      const id=nearby.id;goTo(id);pendingAction=id;return;
    }
    route=[];destination=null;keys.clear();
    if(nearby.id==='dance'){
      if(action==='dance'){stopAction();render();draw();return;}
      action='dance';danceStarted=clock;actionUntil=clock+12;pair.x=275;pair.y=228;direction='down';
      state=danceInHawaii(state);save();say('dame tu mano. Esta canción y este baile son nuestros.');
    }else if(nearby.id==='giraffe'){
      if(clock<petCooldown)return;
      petCooldown=clock+1.2;action='pet';actionUntil=clock+3.2;direction='right';
      state=petHawaiiGiraffe(state);save();say('hola, amiga. Qué bonito encontrarte en nuestro viaje.');api.onSfx?.('chime');
    }else if(nearby.id==='bar')menuOpen=!menuOpen;
    render();draw();schedule();
  }
  function buy(id){
    if(!alive||nearby?.id!=='bar'||route.length)return;
    const result=buyHawaiiDrink(state,id);if(!result.bought)return;
    state=result.state;save();stopAction();route=[];destination=null;keys.clear();drinkUntil=clock+12;
    const drink=HAWAII_DRINKS.find(drink=>drink.id===id);
    say('un '+(id==='coco'?'coquito':id==='mango'?'juguito de mango':'juguito de piña')+' para compartir. Por todos los viajes que nos faltan.');
    status.dataset.hawaiiDrink=drink.id;render();draw();schedule();
  }
  function updateNearby(){
    const zone=hawaiiZoneAt(pair.x,pair.y);
    if(zone?.id!==nearby?.id){nearby=zone;if(zone?.id!=='bar')menuOpen=false;render();}
  }
  function walk(dx,dy){
    let moved=false;
    if(hawaiiWalkable(pair.x+dx,pair.y)){pair.x+=dx;moved||=Math.abs(dx)>.001;}
    if(hawaiiWalkable(pair.x,pair.y+dy)){pair.y+=dy;moved||=Math.abs(dy)>.001;}
    if(moved)direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
    return moved;
  }
  function update(dt){
    moving=false;
    if(keys.size){
      let dx=0,dy=0;for(const key of keys){const vector=arrows[key];if(vector){dx+=vector[0];dy+=vector[1];}}
      const length=Math.hypot(dx,dy);if(length)moving=walk(dx/length*90*dt,dy/length*90*dt);
    }else if(route.length){
      const point=route[0],dx=point.x-pair.x,dy=point.y-pair.y,distance=Math.hypot(dx,dy);
      if(distance<=Math.max(.7,90*dt)){pair.x=point.x;pair.y=point.y;route.shift();moving=Boolean(route.length);}
      else moving=walk(dx/distance*90*dt,dy/distance*90*dt);
      if(!route.length&&destination){
        const arrived=destination,queued=pendingAction;destination=null;pendingAction=null;updateNearby();
        if(arrived.id==='bar')menuOpen=true;
        render();speak(arrived.id==='bar'?'¿Qué bebida compartimos?':arrived.id==='dance'?'¿Me regalas este baile?':'Nuestra amiga nos está esperando.');
        if(queued===arrived.id)perform();
      }
    }
    if(actionUntil&&clock>=actionUntil){stopAction();render();}
    if(drinkUntil&&clock>=drinkUntil)drinkUntil=0;
    updateNearby();canvas.dataset.hawaiiX=String(Math.round(pair.x));canvas.dataset.hawaiiY=String(Math.round(pair.y));
  }
  function heart(x,y,color='#E9B3A9'){
    ctx.fillStyle=color;ctx.fillRect(x+1,y,2,1);ctx.fillRect(x+4,y,2,1);ctx.fillRect(x,y+1,7,2);ctx.fillRect(x+1,y+3,5,1);ctx.fillRect(x+2,y+4,3,1);ctx.fillRect(x+3,y+5,1,1);
  }
  function actor(who,x,y,face,frame){
    const choices=api.getOutfits?.()??api.save.outfits??{},selected=getSelectedLook(choices,who);
    const source=selected&&(api.getCharacterImage?.(selected.sheet)??api.assetImage?.(selected.sheet));if(!source)return;
    const row=face==='up'?2:face==='down'?0:1;
    const px=Math.round(x-16),py=Math.round(y-46);
    ctx.fillStyle='#715A443A';ctx.fillRect(px+8,Math.round(y)-2,17,3);
    ctx.save();if(face==='left'){ctx.translate(px+32,py);ctx.scale(-1,1);ctx.drawImage(source,frame*32,row*48,32,48,0,0,32,48);}
    else ctx.drawImage(source,frame*32,row*48,32,48,px,py,32,48);ctx.restore();
  }
  function fallback(){
    ctx.fillStyle='#80B4AA';ctx.fillRect(0,0,640,400);ctx.fillStyle='#F0D39F';ctx.fillRect(20,125,600,220);
    ctx.fillStyle='#7A9363';ctx.fillRect(20,35,600,96);ctx.fillStyle='#C0B275';ctx.fillRect(185,130,270,18);
  }
  function draw(){
    if(!alive)return;ctx.imageSmoothingEnabled=false;
    camera.x=Math.round(clamp(pair.x-canvas.width*.5,0,640-canvas.width));
    camera.y=Math.round(clamp(pair.y-canvas.height*.52,0,400-canvas.height));
    ctx.save();ctx.translate(-camera.x,-camera.y);
    const background=api.assetImage?.(BACKGROUND);if(background)ctx.drawImage(background,0,0,640,400);else fallback();
    if(!preference.matches){
      ctx.fillStyle='#E8E8CB70';
      for(let i=0;i<9;i++){const x=33+i*69+Math.round(Math.sin(clock*.65+i)*3),y=360+(i%3)*10;ctx.fillRect(x,y,13+(i%2)*9,1);}
      ctx.fillStyle='#FFF2CC80';for(let i=0;i<6;i++){const x=210+i*59,y=91+(i%3)*11;ctx.fillRect(x,y+Math.round(Math.sin(clock+i)),1,2);}
    }
    const giraffe=api.assetImage?.(GIRAFFE);
    if(giraffe){
      ctx.fillStyle='#66594236';ctx.fillRect(519,202,35,4);
      const bob=action==='pet'&&!preference.matches?Math.floor(Math.sin(clock*2)*1):0;
      ctx.drawImage(giraffe,0,0,giraffe.naturalWidth||giraffe.width,giraffe.naturalHeight||giraffe.height,500,109+bob,64,96);
    }
    if(action==='dance'){
      const choices=api.getOutfits?.()??api.save.outfits??{};
      const metadata=drawDancingPair(ctx,{x:pair.x,y:pair.y,time:clock-danceStarted,reducedMotion:preference.matches,outfits:choices,
        getCharacterImage:url=>api.getCharacterImage?.(url)??api.assetImage?.(url),getRawImage:url=>api.assetImage?.(url),getDanceImage:url=>api.assetImage?.(url)});
      canvas.dataset.danceFrame=String(metadata?.frame??0);canvas.dataset.dancePhase=metadata?.phase||'dance';
    }else{
      const frame=moving?Math.floor(clock*8)%6:0;
      actor('leo',pair.x+14,pair.y,direction,frame);actor('itza',pair.x-17,pair.y-2,direction,frame);
      delete canvas.dataset.danceFrame;delete canvas.dataset.dancePhase;
    }
    if(action==='pet'){
      const rise=preference.matches?0:Math.floor((clock%1.5)*6);heart(541,101-rise);heart(561,116-rise,'#F2DCA7');
      ctx.fillStyle='#E5AA87';
      ctx.fillRect(Math.round(pair.x+23),Math.round(pair.y-32),3,4);ctx.fillRect(Math.round(pair.x+25),Math.round(pair.y-35),3,4);ctx.fillRect(Math.round(pair.x+26),Math.round(pair.y-38),4,4);
    }
    if(drinkUntil>clock){
      const drink=HAWAII_DRINKS.find(drink=>drink.id===state.lastDrink);ctx.fillStyle='#765B45';ctx.fillRect(pair.x+27,pair.y-26,9,13);
      ctx.fillStyle=drink?.color||'#E5BC62';ctx.fillRect(pair.x+28,pair.y-25,7,10);ctx.fillStyle='#FFF0CC';ctx.fillRect(pair.x+32,pair.y-31,1,8);
    }
    if(route.length){const end=route.at(-1);ctx.fillStyle='#B88C7188';ctx.fillRect(Math.round(end.x)-2,Math.round(end.y)-1,5,1);ctx.fillRect(Math.round(end.x),Math.round(end.y)-3,1,5);}
    ctx.restore();Object.assign(canvas.dataset,{hawaiiAction:action,hawaiiMotion:preference.matches?'reduced':'active',cameraX:String(camera.x),cameraY:String(camera.y)});
  }
  function tick(time){
    raf=0;if(!alive||document.hidden)return;
    const dt=last?Math.min(.05,(time-last)/1000):0;last=time;clock+=dt;update(dt);draw();schedule();
  }
  function schedule(){if(alive&&!raf&&!document.hidden&&(!preference.matches||route.length||keys.size||action!=='explore'||drinkUntil>clock))raf=requestAnimationFrame(tick);}
  function resize(){
    if(!alive)return;
    const viewport=hawaiiViewport(stage.clientWidth,stage.clientHeight);
    canvas.width=viewport.width;canvas.height=viewport.height;
    canvas.style.width=viewport.cssWidth+'px';canvas.style.height=viewport.cssHeight+'px';
    canvas.style.left=Math.floor((stage.clientWidth-viewport.cssWidth)/2)+'px';canvas.style.top=Math.floor((stage.clientHeight-viewport.cssHeight)/2)+'px';
    canvas.dataset.pixelScale=String(viewport.scale);draw();
  }
  function pointer(event){
    if(!alive||event.button!==0)return;
    const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width*canvas.width+camera.x,y=(event.clientY-rect.top)/rect.height*canvas.height+camera.y;
    const attraction=x>=500&&x<=564&&y>=109&&y<=205?'giraffe':x>=30&&x<=180&&y>=85&&y<=192?'bar':null;
    const zone=attraction?HAWAII_ZONES.find(zone=>zone.id===attraction):hawaiiZoneAt(x,y);
    if(zone){if(nearby?.id===zone.id){perform();}else goTo(zone.id);return;}
    stopAction();keys.clear();menuOpen=false;destination=null;pendingAction=null;
    routeTo(nearestHawaiiPoint(x,y));canvas.focus({preventScroll:true});render();schedule();
  }
  function keydown(event){
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(arrows[key]){event.preventDefault();event.stopPropagation();route=[];destination=null;pendingAction=null;menuOpen=false;stopAction();keys.add(key);render();schedule();}
    else if(key==='e'){event.preventDefault();event.stopPropagation();perform();}
  }
  function keyup(event){keys.delete(event.key.length===1?event.key.toLowerCase():event.key);}
  function blur(){keys.clear();}
  function visibility(){last=0;keys.clear();if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{draw();schedule();}}
  function motion(){cancelAnimationFrame(raf);raf=0;last=0;draw();schedule();}
  canvas.addEventListener('pointerup',pointer);canvas.addEventListener('keydown',keydown);canvas.addEventListener('blur',blur);
  window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
  document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',motion);
  const observer=new ResizeObserver(resize);observer.observe(stage);
  save();render();resize();speak('mi lugar favorito sigue siendo contigo.');schedule();
  return ()=>{
    releaseMusic();
    alive=false;cancelAnimationFrame(raf);clearTimeout(speechTimer);keys.clear();route=[];observer.disconnect();
    canvas.removeEventListener('pointerup',pointer);canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('blur',blur);
    window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);
    document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',motion);
  };
}
