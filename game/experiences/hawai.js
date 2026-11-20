import {node,labeledButton} from './dom.js';
import {getSelectedLook,getChoice} from '../wardrobe.js';
import {getHairColor} from '../hair.js';
import {getGlasses} from '../glasses.js';
import {HAWAII_ZONES,HAWAII_DRINKS,visitHawaii,danceInHawaii,buyHawaiiDrink,petHawaiiGiraffe,
  hawaiiZoneAt,hawaiiWalkable,nearestHawaiiPoint} from '../hawaii.js';
import './hawai.css';

const BACKGROUND='/assets/game/travel/hawaii.png',GIRAFFE='/assets/game/travel/giraffe.png';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const arrows={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};

export function mount(root,_data,api){
  api.save??={};
  let state=visitHawaii(api.save.hawaii),alive=true,raf=0,last=0,clock=0,action='explore',actionUntil=0;
  let nearby=null,petCooldown=0,drinkUntil=0,route=[],destination=null,pendingAction=null,moving=false,direction='down';
  const pair={x:320,y:299},camera={x:0,y:0},keys=new Set();
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell=node('section','hawaii-trip');shell.setAttribute('aria-label','Nuestra isla de Hawái');
  const top=node('div','hawaii-topline'),island=node('div','hawaii-island-name');
  island.append(node('span','hawaii-kicker','UN VIAJE PARA DOS'),node('h3','','Aloha, mi amor'));
  const wallet=node('p','hawaii-wallet');wallet.setAttribute('aria-label','Conchitas para comprar bebidas');
  const back=labeledButton('Volver a nuestro mundo',()=>api.requestClose?.(),'hawaii-back');
  top.append(island,wallet,back);
  const stage=node('div','hawaii-stage'),canvas=node('canvas','hawaii-map');canvas.width=640;canvas.height=400;canvas.tabIndex=0;
  canvas.setAttribute('role','application');canvas.setAttribute('aria-label','Mapa de Hawái. Toca para caminar; usa flechas o WASD y E para interactuar. También puedes elegir un lugar con los botones.');
  const place=node('span','hawaii-location','Playa de Aloha');place.setAttribute('aria-hidden','true');
  stage.append(canvas,place);
  const travel=node('nav','hawaii-destinations');travel.setAttribute('aria-label','Lugares de Hawái');
  const zoneButtons=new Map();
  for(const [id,label,sub] of [['bar','Bar de la playa','Jugos y cocos fresquitos'],['dance','Bailar juntos','Un baile bajo las palmeras'],['giraffe','Visitar a la jirafa','Una nueva amiga muy alta']]){
    const button=labeledButton('',()=>goTo(id),'hawaii-destination');button.dataset.hawaiiDestination=id;
    button.append(node('strong','',label),node('span','',sub));travel.append(button);zoneButtons.set(id,button);
  }
  const status=node('p','hawaii-status','Leo: cambiamos de paisaje, pero mi lugar favorito sigues siendo tú.');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const interaction=node('section','hawaii-interaction');interaction.setAttribute('aria-label','Actividad de la isla');
  const activityTitle=node('h4','hawaii-activity-title','Explora nuestra isla');
  const activityHint=node('p','hawaii-activity-hint','Toca un lugar del mapa o elige dónde ir. Caminamos juntos.');
  const primary=labeledButton('',()=>perform(),'hawaii-primary');
  const drinks=node('div','hawaii-drinks');
  const drinkButtons=HAWAII_DRINKS.map(drink=>{
    const button=labeledButton('',()=>buy(drink.id),'hawaii-drink');button.dataset.hawaiiDrink=drink.id;
    const swatch=node('span','hawaii-cup');swatch.style.setProperty('--drink-color',drink.color);swatch.setAttribute('aria-hidden','true');
    const details=node('span','hawaii-drink-details');details.append(node('strong','',drink.label),node('span','',drink.detail),node('b','',drink.cost+' conchitas'));
    button.append(swatch,details);drinks.append(button);return {drink,button};
  });
  interaction.append(activityTitle,activityHint,primary,drinks);
  const memories=node('p','hawaii-memories');
  const help=node('p','hawaii-help','Camina con un toque, flechas o WASD. Pulsa E cerca de un lugar. Bailar nos regala tres conchitas para otra bebida.');
  shell.append(top,stage,travel,status,interaction,memories,help);root.append(shell);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  function save(){api.save.hawaii=state;api.onProgressChange?.();}
  function say(line){status.textContent='Leo: '+line;api.onLeoSay?.(line);}
  function render(){
    const zone=nearby;
    wallet.textContent=state.shells+' conchitas';
    memories.textContent=state.dances+' '+(state.dances===1?'baile':'bailes')+' · '+
      Object.values(state.drinks).reduce((total,n)=>total+n,0)+' bebidas compartidas · '+state.giraffePets+' cariñitos a la jirafa';
    shell.dataset.hawaiiAction=action;shell.dataset.hawaiiZone=zone?.id||'beach';
    shell.dataset.hawaiiShells=String(state.shells);canvas.dataset.hawaiiX=String(Math.round(pair.x));canvas.dataset.hawaiiY=String(Math.round(pair.y));
    const choices=api.getOutfits?.()??api.save.outfits??{};
    canvas.dataset.leoLook=getChoice(choices,'leo');canvas.dataset.itzaLook=getChoice(choices,'itza');
    canvas.dataset.itzaHair=getHairColor(choices);canvas.dataset.itzaGlasses=String(getGlasses(choices,'itza'));
    canvas.dataset.hawaiiAction=action;
    for(const [id,button] of zoneButtons)button.setAttribute('aria-current',zone?.id===id?'location':'false');
    place.textContent=zone?.label||'Playa de Aloha';
    drinks.hidden=zone?.id!=='bar';
    for(const {drink,button} of drinkButtons)button.disabled=state.shells<drink.cost||Boolean(route.length);
    primary.hidden=!zone||zone.id==='bar';primary.disabled=Boolean(route.length);
    if(zone?.id==='bar'){
      activityTitle.textContent='Un brindis con sabor a verano';
      activityHint.textContent=state.shells<2?'Nos faltan conchitas. Un baile juntos nos da tres más.':'Elige un jugo sin alcohol. Con una bebida alcanza para los dos.';
    }else if(zone?.id==='dance'){
      activityTitle.textContent=action==='dance'?'Este baile es nuestro':'Nuestra pista junto al mar';
      activityHint.textContent=action==='dance'?'Un ratito sin prisa, tú y yo. Puedes parar cuando quieras.':'Baila con Leo y guarda otro recuerdo. Nos regalan tres conchitas.';
      primary.textContent=action==='dance'?'Dejar de bailar':'Bailar con Leo';
    }else if(zone?.id==='giraffe'){
      activityTitle.textContent='Una amiga entre las palmeras';
      activityHint.textContent='En este jardín vive nuestra jirafa viajera. Acércate con calma y dale un cariñito.';
      primary.textContent='Acariciar a la jirafa';
    }else{
      activityTitle.textContent='Nuestra pequeña escapada';
      activityHint.textContent=destination?'Vamos caminando a '+destination.label.toLowerCase()+'.':'Toca la arena para explorar o elige un lugar. Caminamos juntos.';
    }
  }
  function stopAction(){action='explore';actionUntil=0;}
  function goTo(id){
    if(!alive)return;
    const zone=HAWAII_ZONES.find(zone=>zone.id===id);if(!zone)return;
    stopAction();keys.clear();nearby=null;destination=zone;pendingAction=null;
    // The clear middle strip provides a route around the bar and sanctuary.
    route=[{x:pair.x,y:245},{x:zone.arrival.x,y:245},{...zone.arrival}];
    render();canvas.focus({preventScroll:true});schedule();
  }
  function perform(){
    if(!alive||!nearby||route.length)return;
    if(Math.hypot(pair.x-nearby.arrival.x,pair.y-nearby.arrival.y)>1){
      const id=nearby.id;goTo(id);pendingAction=id;return;
    }
    route=[];destination=null;keys.clear();
    if(nearby.id==='dance'){
      if(action==='dance'){stopAction();render();draw();return;}
      action='dance';actionUntil=clock+9;pair.x=275;pair.y=228;direction='down';
      state=danceInHawaii(state);save();say('si tú me llevas de la mano, bailo contigo hasta que se duerma el mar.');
    }else if(nearby.id==='giraffe'){
      if(clock<petCooldown)return;
      petCooldown=clock+1.2;action='pet';actionUntil=clock+3.2;direction='right';
      state=petHawaiiGiraffe(state);save();say('mira qué linda… ¡y tú querías una jirafa en nuestras vacaciones!');api.onSfx?.('chime');
    }
    render();draw();schedule();
  }
  function buy(id){
    if(!alive||nearby?.id!=='bar'||route.length)return;
    const result=buyHawaiiDrink(state,id);if(!result.bought)return;
    state=result.state;save();stopAction();route=[];destination=null;keys.clear();drinkUntil=clock+12;
    const drink=HAWAII_DRINKS.find(drink=>drink.id===id);
    say('un '+(id==='coco'?'coquito':id==='mango'?'juguito de mango':'juguito de piña')+' para compartir. Brindo por todos los viajes que nos faltan.');
    status.dataset.hawaiiDrink=drink.id;render();draw();schedule();
  }
  function updateNearby(){
    const zone=hawaiiZoneAt(pair.x,pair.y);
    if(zone?.id!==nearby?.id){nearby=zone;render();}
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
        const arrived=destination,queued=pendingAction;destination=null;pendingAction=null;updateNearby();render();
        status.textContent=arrived.id==='bar'?'Ya llegamos al bar. ¿Qué bebida compartimos?':arrived.id==='dance'?'Aquí empieza nuestro baile.':'Nuestra amiga nos está esperando. Dale un cariñito.';
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
  function actor(who,x,y,face,frame,bob=0){
    const choices=api.getOutfits?.()??api.save.outfits??{},selected=getSelectedLook(choices,who);
    const source=selected&&(api.getCharacterImage?.(selected.sheet)??api.assetImage?.(selected.sheet));if(!source)return;
    const row=face==='up'?2:face==='down'?0:1;
    const px=Math.round(x-16),py=Math.round(y-46+bob);
    ctx.fillStyle='#715A443A';ctx.fillRect(px+8,Math.round(y)-2,17,3);
    ctx.save();if(face==='left'){ctx.translate(px+32,py);ctx.scale(-1,1);ctx.drawImage(source,frame*32,row*48,32,48,0,0,32,48);}
    else ctx.drawImage(source,frame*32,row*48,32,48,px,py,32,48);ctx.restore();
  }
  function fallback(){
    ctx.fillStyle='#80B4AA';ctx.fillRect(0,0,640,400);ctx.fillStyle='#F0D39F';ctx.fillRect(20,125,600,220);
    ctx.fillStyle='#7A9363';ctx.fillRect(20,35,600,96);ctx.fillStyle='#C0B275';ctx.fillRect(185,130,270,18);
    ctx.fillStyle='#B98258';ctx.fillRect(44,120,130,70);ctx.fillStyle='#936C4E';ctx.fillRect(34,110,150,17);
    ctx.fillStyle='#D5AE78';ctx.fillRect(248,226,106,72);ctx.strokeStyle='#B88A63';for(let y=232;y<298;y+=9){ctx.beginPath();ctx.moveTo(250,y);ctx.lineTo(352,y);ctx.stroke();}
  }
  function draw(){
    if(!alive)return;ctx.imageSmoothingEnabled=false;
    camera.x=Math.round(clamp(pair.x-canvas.width/2,0,640-canvas.width));
    camera.y=Math.round(clamp(pair.y-canvas.height*.62,0,400-canvas.height));
    ctx.save();ctx.translate(-camera.x,-camera.y);
    const background=api.assetImage?.(BACKGROUND);if(background)ctx.drawImage(background,0,0,640,400);else fallback();
    if(!preference.matches){
      ctx.fillStyle='#E8E8CB70';
      for(let i=0;i<9;i++){const x=33+i*69+Math.round(Math.sin(clock*.65+i)*3),y=360+(i%3)*10;ctx.fillRect(x,y,13+(i%2)*9,1);}
      ctx.fillStyle='#FFF2CC80';for(let i=0;i<6;i++){const x=210+i*59,y=91+(i%3)*11;ctx.fillRect(x,y+Math.round(Math.sin(clock+i)),1,2);}
    }
    // Small ground medallions identify the three places without hiding the art.
    for(const zone of HAWAII_ZONES){
      ctx.fillStyle=nearby?.id===zone.id?'#F8F1CA':'#FFF0C6B8';
      const x=zone.arrival.x,y=zone.arrival.y+3;ctx.fillRect(x-11,y,22,2);ctx.fillRect(x-14,y+2,28,2);
    }
    const giraffe=api.assetImage?.(GIRAFFE);
    if(giraffe){
      ctx.fillStyle='#66594236';ctx.fillRect(519,202,35,4);
      const bob=action==='pet'&&!preference.matches?Math.floor(Math.sin(clock*2)*1):0;
      ctx.drawImage(giraffe,0,0,giraffe.naturalWidth||giraffe.width,giraffe.naturalHeight||giraffe.height,500,109+bob,64,96);
    }
    const frame=moving?Math.floor(clock*8)%6:action==='dance'?Math.floor(clock*4)%2:0;
    if(action==='dance'){
      const beat=preference.matches?0:Math.sin(clock*4.3)*1.8;
      actor('leo',pair.x-17,pair.y,'down',frame,beat);actor('itza',pair.x+17,pair.y,'down',frame,-beat);
      heart(pair.x-3,pair.y-62);if(!preference.matches)heart(pair.x+35,pair.y-49+Math.floor(Math.sin(clock)*2),'#F2DCA7');
    }else{
      actor('leo',pair.x+14,pair.y,direction,frame);actor('itza',pair.x-17,pair.y-2,direction,frame);
    }
    if(action==='pet'){
      const rise=preference.matches?0:Math.floor((clock%1.5)*6);heart(541,101-rise);heart(561,116-rise,'#F2DCA7');
      ctx.fillStyle='#E5AA87';
      ctx.fillRect(Math.round(pair.x+23),Math.round(pair.y-32),3,4);
      ctx.fillRect(Math.round(pair.x+25),Math.round(pair.y-35),3,4);
      ctx.fillRect(Math.round(pair.x+26),Math.round(pair.y-38),4,4);
    }
    if(drinkUntil>clock){
      const drink=HAWAII_DRINKS.find(drink=>drink.id===state.lastDrink);ctx.fillStyle='#765B45';ctx.fillRect(pair.x+27,pair.y-26,9,13);
      ctx.fillStyle=drink?.color||'#E5BC62';ctx.fillRect(pair.x+28,pair.y-25,7,10);ctx.fillStyle='#FFF0CC';ctx.fillRect(pair.x+32,pair.y-31,1,8);
    }
    if(route.length){
      const end=route.at(-1);ctx.fillStyle='#B88C7188';ctx.fillRect(Math.round(end.x)-2,Math.round(end.y)-1,5,1);ctx.fillRect(Math.round(end.x),Math.round(end.y)-3,1,5);
    }
    ctx.restore();canvas.dataset.hawaiiAction=action;canvas.dataset.hawaiiMotion=preference.matches?'reduced':'active';
  }
  function tick(time){
    raf=0;if(!alive||document.hidden)return;
    const dt=last?Math.min(.05,(time-last)/1000):0;last=time;clock+=dt;update(dt);draw();schedule();
  }
  function schedule(){if(alive&&!raf&&!document.hidden&&(!preference.matches||route.length||keys.size||action!=='explore'||drinkUntil>clock))raf=requestAnimationFrame(tick);}
  function resize(){
    if(!alive)return;
    const width=stage.clientWidth;
    canvas.width=width<560?384:640;canvas.height=width<560?320:400;draw();
  }
  function pointer(event){
    if(!alive||event.button!==0)return;
    const rect=canvas.getBoundingClientRect(),style=getComputedStyle(canvas);
    const left=parseFloat(style.borderLeftWidth)||0,top=parseFloat(style.borderTopWidth)||0;
    const width=rect.width-left-(parseFloat(style.borderRightWidth)||0),height=rect.height-top-(parseFloat(style.borderBottomWidth)||0);
    const x=(event.clientX-rect.left-left)/width*canvas.width+camera.x,y=(event.clientY-rect.top-top)/height*canvas.height+camera.y;
    const attraction=x>=500&&x<=564&&y>=109&&y<=205?'giraffe':x>=30&&x<=180&&y>=85&&y<=192?'bar':null;
    const zone=attraction?HAWAII_ZONES.find(zone=>zone.id===attraction):hawaiiZoneAt(x,y);
    if(zone){if(nearby?.id===zone.id){perform();}else goTo(zone.id);return;}
    stopAction();keys.clear();destination=null;pendingAction=null;
    const point=nearestHawaiiPoint(x,y);route=[{x:pair.x,y:245},{x:point.x,y:245},point];
    canvas.focus({preventScroll:true});render();schedule();
  }
  function keydown(event){
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(arrows[key]){event.preventDefault();event.stopPropagation();route=[];destination=null;pendingAction=null;stopAction();keys.add(key);render();schedule();}
    else if(key==='e'){event.preventDefault();event.stopPropagation();if(nearby?.id==='bar'){drinkButtons.find(({button})=>!button.disabled)?.button.focus();}else perform();}
  }
  function keyup(event){keys.delete(event.key.length===1?event.key.toLowerCase():event.key);}
  function blur(){keys.clear();}
  function visibility(){last=0;keys.clear();if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{draw();schedule();}}
  function motion(){cancelAnimationFrame(raf);raf=0;last=0;draw();schedule();}
  canvas.addEventListener('pointerup',pointer);canvas.addEventListener('keydown',keydown);canvas.addEventListener('blur',blur);
  window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
  document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',motion);
  const observer=new ResizeObserver(resize);observer.observe(stage);
  save();render();resize();schedule();
  return ()=>{
    alive=false;cancelAnimationFrame(raf);keys.clear();route=[];observer.disconnect();
    canvas.removeEventListener('pointerup',pointer);canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('blur',blur);
    window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);
    document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',motion);
  };
}
