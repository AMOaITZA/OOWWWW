import {node} from './dom.js';
import {LAKESIDE_BACKGROUND,LAKESIDE_SIZE,FIREWORK_DURATION,LAKESIDE_WISHES,
  visitLakeside,recordLakesideAction,fireworkParticles} from '../lakeside.js';
import {getSelectedLook} from '../wardrobe.js';
import {drawHomeActor} from '../home-poses.js';
import './mirador.css';

export function mount(root,_data,api){
  api.save??={};
  let state=visitLakeside(api.save.lakeside),alive=true,sitting=false,showing=false;
  let frame=0,last=0,clock=0,showStarted=0,wishStarted=null;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell=node('section','lakeside');
  shell.append(node('p','lakeside-intro','Un pedacito de la noche reservado para nosotros.'));
  const stage=node('div','lakeside-stage'),canvas=node('canvas','lakeside-scene');
  canvas.width=LAKESIDE_SIZE.width;canvas.height=LAKESIDE_SIZE.height;canvas.tabIndex=0;
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Un lago de noche, con una manta junto a la orilla para Itza y Leo');
  stage.append(canvas);
  const badge=node('div','lakeside-badge','UNA NOCHE JUNTO AL LAGO');badge.setAttribute('aria-hidden','true');stage.append(badge);
  const caption=node('p','lakeside-caption','El mundo puede esperar un ratito.');
  const actions=node('div','lakeside-actions');actions.setAttribute('role','group');actions.setAttribute('aria-label','Actividades de la orilla');
  function button(label,action,kind=''){
    const element=node('button','lakeside-button'+(kind?' '+kind:''),label);element.type='button';
    element.addEventListener('click',action);actions.append(element);return element;
  }
  const sitButton=button('Sentarnos juntos',sit,'lakeside-primary');
  const fireworkButton=button('Ver fuegos artificiales',toggleFireworks);
  const wishButton=button('Pedir un deseo',wish);
  const standButton=button('Levantarnos',stand);
  const reply=node('p','lakeside-reply','Leo: ven, vamos a guardar este ratito para nosotros.');
  reply.setAttribute('role','status');reply.setAttribute('aria-live','polite');
  const instruction=node('p','lakeside-instruction','Siéntense en la manta para mirar el cielo. Los fuegos son silenciosos.');
  if(api.requestClose){
    const back=node('button','lakeside-return','Volver al mundo');back.type='button';back.addEventListener('click',()=>api.requestClose?.());
    shell.append(stage,caption,actions,reply,instruction,back);
  }else shell.append(stage,caption,actions,reply,instruction);
  root.append(shell);
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  function save(){api.save.lakeside=state;api.onProgressChange?.();}
  function say(line){reply.textContent='Leo: '+line;api.onLeoSay?.(line);}
  function sync(){
    sitButton.hidden=sitting;standButton.hidden=!sitting;
    fireworkButton.disabled=wishButton.disabled=!sitting;
    fireworkButton.textContent=showing?(preference.matches?'Ocultar fuegos artificiales':'Detener fuegos artificiales'):'Ver fuegos artificiales';
    fireworkButton.setAttribute('aria-pressed',String(showing));
    caption.textContent=sitting?'Mi lugar favorito es al lado de ti.':'El mundo puede esperar un ratito.';
    canvas.setAttribute('aria-label',sitting?'Itza y Leo sentados juntos en una manta, mirando el lago y el cielo de noche':'Itza y Leo junto a una manta en la orilla del lago de noche');
    Object.assign(canvas.dataset,{sitting:String(sitting),fireworks:String(showing),wishes:String(state.wishes),motion:preference.matches?'reduced':'active'});
  }
  function sit(){
    if(!alive||sitting)return;
    sitting=true;state=recordLakesideAction(state,'sits');save();sync();
    say('aquí, cerquita de mí. Hoy tenemos el cielo para los dos.');draw();
  }
  function stand(){
    if(!alive||!sitting)return;
    sitting=false;showing=false;wishStarted=null;sync();say('cuando quieras, volvemos a sentarnos aquí.');draw();sitButton.focus({preventScroll:true});
  }
  function toggleFireworks(){
    if(!alive||!sitting)return;
    showing=!showing;
    if(showing){showStarted=clock;state=recordLakesideAction(state,'shows');save();say('mira el cielo, amor. Este espectáculo es para ti.');}
    else say('también me gusta esta calma, contigo.');
    sync();draw();schedule();
  }
  function wish(){
    if(!alive||!sitting)return;
    state=recordLakesideAction(state,'wishes');wishStarted=clock;save();
    say(LAKESIDE_WISHES[(state.wishes-1)%LAKESIDE_WISHES.length]);sync();draw();schedule();
  }
  function drawFallback(){
    ctx.fillStyle='#343B59';ctx.fillRect(0,0,640,170);ctx.fillStyle='#4A4969';ctx.fillRect(0,125,640,45);
    ctx.fillStyle='#8B9AA2';ctx.fillRect(0,170,640,140);ctx.fillStyle='#3F675F';ctx.fillRect(0,300,640,100);
    ctx.fillStyle='#F7DFAE';ctx.fillRect(510,40,22,22);ctx.fillStyle='#343B59';ctx.fillRect(504,35,20,20);
    ctx.fillStyle='#CEC7CF';for(let i=0;i<38;i++)ctx.fillRect(16+(i*83)%608,18+(i*47)%118,1,1);
    ctx.fillStyle='#9DB4B7';for(let i=0;i<16;i++)ctx.fillRect(35+(i*67)%570,183+(i*17)%113,10+(i%4)*5,1);
  }
  function drawBlanket(){
    ctx.fillStyle='#243D40';ctx.globalAlpha=.3;ctx.fillRect(277,333,99,25);ctx.globalAlpha=1;
    ctx.fillStyle='#BA8396';ctx.fillRect(280,330,94,23);ctx.fillStyle='#E3BBBD';ctx.fillRect(282,332,90,18);
    ctx.fillStyle='#C893A4';for(let x=286;x<373;x+=9)ctx.fillRect(x,332,2,18);
    for(let y=336;y<350;y+=7)ctx.fillRect(282,y,90,2);
    ctx.fillStyle='#F3D2C5';ctx.fillRect(282,331,90,1);ctx.fillRect(282,351,90,1);
    for(let x=282;x<374;x+=4)ctx.fillRect(x,352,1,3);
    // A tiny thermos and two cups keep the shore feeling lived in.
    ctx.fillStyle='#855C59';ctx.fillRect(263,333,6,12);ctx.fillStyle='#D5B7A4';ctx.fillRect(264,331,4,3);
    ctx.fillStyle='#E9D4AE';ctx.fillRect(273,339,4,4);ctx.fillRect(376,339,4,4);
  }
  function drawPerson(who,x,y){
    const outfits=api.getOutfits?.()??api.save.outfits??{};
    const image=url=>api.getCharacterImage?.(url)??api.assetImage?.(url);
    if(sitting){
      const drawn=drawHomeActor(ctx,{who,pose:'tv',frame:0,x,y,outfits,getCharacterImage:image,
        getRawImage:url=>api.assetImage?.(url),getPoseImage:url=>api.assetImage?.(url)});
      if(drawn)return;
    }
    const sheet=image(getSelectedLook(outfits,who)?.sheet);
    if(sheet)ctx.drawImage(sheet,0,96,32,48,x,y,32,48);
  }
  function star(){
    if(!sitting)return 0;
    let progress;
    if(preference.matches){if(wishStarted===null)return 0;progress=.58;}
    else{
      const wished=wishStarted===null?-1:clock-wishStarted;
      const phase=wished>=0&&wished<1.45?wished:(clock%18)-6;
      if(phase<0||phase>1.45)return 0;progress=phase/1.45;
    }
    const x=280+progress*154,y=35+progress*53;
    for(let i=8;i>=0;i--){ctx.globalAlpha=(1-i/10)*.66;ctx.fillStyle='#F3DFC9';ctx.fillRect(Math.round(x-i*3),Math.round(y-i),i===0?3:2,1);}
    ctx.globalAlpha=.95;ctx.fillStyle='#FFF2D3';ctx.fillRect(Math.round(x),Math.round(y),2,2);ctx.globalAlpha=1;return 1;
  }
  function draw(){
    if(!alive)return;ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;
    const background=api.assetImage?.(LAKESIDE_BACKGROUND);
    if(background)ctx.drawImage(background,0,0,640,400);else drawFallback();
    // Small highlights stay inside the lake; there is no moving full-scene tint.
    ctx.fillStyle='#D3C6B4';ctx.globalAlpha=.19;
    for(let i=0;i<12;i++){
      const sway=preference.matches?0:Math.round(Math.sin(clock*.7+i)*3);
      ctx.fillRect(82+(i*43)%470+sway,185+(i*19)%108,8+(i%4)*6,1);
    }
    ctx.globalAlpha=1;
    const particles=showing?fireworkParticles(preference.matches?1:clock-showStarted,{reducedMotion:preference.matches}):[];
    for(const particle of particles){
      // Short, stepped tails make each burst legible against the detailed sky.
      ctx.fillStyle=particle.color;
      for(let trail=1;trail<=3;trail++){
        ctx.globalAlpha=particle.alpha*(.68-trail*.13);
        ctx.fillRect(Math.round(particle.x-particle.dx*trail*2),Math.round(particle.y-particle.dy*trail*2),2,1);
      }
      ctx.fillStyle=particle.color;ctx.globalAlpha=particle.alpha*.88;ctx.fillRect(particle.x,particle.y,particle.size,particle.size);
      // A dim, broken reflection belongs to the water, rather than the sky.
      const reflectedY=Math.round(174+(160-particle.y)*.6);
      ctx.globalAlpha=particle.alpha*.17;ctx.fillRect(particle.x-2,reflectedY,5,1);
    }
    ctx.globalAlpha=1;canvas.dataset.activeParticles=String(particles.length);
    canvas.dataset.visibleShootingStars=String(star());
    drawBlanket();
    if(sitting){drawPerson('leo',295,299);drawPerson('itza',326,299);}
    else{drawPerson('leo',294,309);drawPerson('itza',330,309);}
    if(!preference.matches){
      ctx.fillStyle='#EEE2B3';
      for(let i=0;i<7;i++){
        ctx.globalAlpha=.17+(.5+.5*Math.sin(clock*1.3+i*2))*.35;
        ctx.fillRect(54+(i*89)%540+Math.round(Math.sin(clock*.3+i)*3),329+(i*13)%50+Math.round(Math.cos(clock*.5+i)*2),1,1);
      }
      ctx.globalAlpha=1;
    }
  }
  function schedule(){if(alive&&!frame&&!document.hidden&&!preference.matches)frame=requestAnimationFrame(tick);}
  function tick(time){
    frame=0;if(!alive||document.hidden)return;
    const delta=last?Math.min(.06,(time-last)/1000):0;last=time;clock+=delta;
    if(showing&&clock-showStarted>=FIREWORK_DURATION){showing=false;sync();reply.textContent='Leo: se apagaron los fuegos, pero yo me quedo otro ratito contigo.';}
    draw();schedule();
  }
  function visibilityChanged(){
    last=0;
    if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{draw();schedule();}
  }
  function motionChanged(){cancelAnimationFrame(frame);frame=0;last=0;sync();draw();schedule();}
  function onKey(event){
    if(event.key==='Enter'||event.key.toLowerCase()==='e'){
      event.preventDefault();event.stopPropagation();if(sitting)stand();else sit();
    }
  }
  canvas.addEventListener('keydown',onKey);
  preference.addEventListener('change',motionChanged);document.addEventListener('visibilitychange',visibilityChanged);
  save();sync();draw();schedule();
  return ()=>{alive=false;cancelAnimationFrame(frame);frame=0;preference.removeEventListener('change',motionChanged);
    document.removeEventListener('visibilitychange',visibilityChanged);canvas.removeEventListener('keydown',onKey);};
}
