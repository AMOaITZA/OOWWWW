import {normalizeLakesideState,visitLakeside,recordLakesideAction,FIREWORK_DURATION,
  LAKESIDE_WISHES,fireworkParticles} from './lakeside.js';
import {drawHomeActor} from './home-poses.js';
import {COAST_LAYOUT} from './coast-layout.js';
import './coast.css';

export const COAST_VIEW_URL='/assets/game/coast/view.png';
export const COAST_SEAT=Object.freeze({x:COAST_LAYOUT.shoreArrival[0]*16,y:COAST_LAYOUT.shoreArrival[1]*16});

function element(tag,className,text){
  const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;
}
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// The shoreline is an overworld interaction. It owns neither a dialog nor a
// canvas nor an animation loop: the main game's frame renders this viewpoint.
export function createCoast({pair,save,getOutfits=()=>save.outfits??{},getCharacterImage,
  getRawImage,assetImage,onChange=()=>{},onSay=()=>{},onNight=()=>{}}){
  let state=normalizeLakesideState(save.lakeside),sitting=false,showing=false,alive=true;
  let active=false,near=false,night=true,clock=0,showStarted=0,wishStarted=null,seen=false;
  let lastParticleCount=0,lastStarCount=0;
  let reserveCache=null;
  const frame=document.getElementById('game-frame'),screen=document.getElementById('game-screen');
  const hud=element('section','coast-hud');hud.hidden=true;hud.setAttribute('aria-label','Actividades junto al mar');
  const label=element('div','coast-place','Orilla de los deseos');
  const reply=element('p','coast-reply','Leo: ven, aquí podemos mirar el mar un ratito.');
  reply.setAttribute('role','status');reply.setAttribute('aria-live','polite');
  const actions=element('div','coast-actions');actions.setAttribute('role','group');actions.setAttribute('aria-label','Una noche junto al mar');
  function button(text,run,className=''){
    const node=element('button','coast-action '+className,text);node.type='button';node.addEventListener('click',run);actions.append(node);return node;
  }
  const sitButton=button('Sentarnos juntos',sit,'coast-primary');
  const fireworkButton=button('Ver fuegos artificiales',toggleFireworks);
  const wishButton=button('Pedir un deseo',wish);
  const standButton=button('Levantarnos',stand,'coast-return');
  const sceneTitle=element('div','coast-scene-title','Orilla de los deseos');sceneTitle.hidden=true;
  sceneTitle.setAttribute('aria-hidden','true');hud.append(label,reply,actions);frame?.append(sceneTitle,hud);
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>{reserveCache=null;});
  if(frame)observer?.observe(frame);observer?.observe(hud);

  function persist(){save.lakeside=state;onChange();}
  function say(text){reply.textContent='Leo: '+text;onSay(text);}
  function update(){
    reserveCache=null;
    hud.hidden=!alive||!active||(!near&&!sitting);
    sceneTitle.hidden=!alive||!active||!sitting;
    hud.dataset.sitting=String(sitting);hud.dataset.fireworks=String(showing);
    hud.dataset.wishes=String(state.wishes);
    if(screen)screen.dataset.coastView=String(sitting&&active);
    sitButton.hidden=sitting;standButton.hidden=!sitting;
    fireworkButton.hidden=wishButton.hidden=!sitting;
    fireworkButton.textContent=showing?'Detener fuegos artificiales':'Ver fuegos artificiales';
    fireworkButton.setAttribute('aria-pressed',String(showing));
  }
  function sit(){
    if(!alive||sitting||!active)return false;
    if(!seen){state=visitLakeside(state);seen=true;}
    state=recordLakesideAction(state,'sits');sitting=true;showing=false;wishStarted=null;
    pair.moving=false;onNight();night=true;persist();
    say('aquí, en la orilla. Hoy tenemos el mar y el cielo para los dos.');update();
    fireworkButton.focus({preventScroll:true});return true;
  }
  function stand(){
    if(!alive||!sitting)return false;
    sitting=false;showing=false;wishStarted=null;lastParticleCount=lastStarCount=0;
    const canvas=document.getElementById('world');
    if(canvas)Object.assign(canvas.dataset,{coastView:'false',coastSitting:'false',coastFireworks:'false',coastParticles:'0',coastStars:'0'});
    say('nos levantamos cuando tú quieras. El mar se queda guardando este recuerdo.');update();
    document.getElementById('world')?.focus({preventScroll:true});return true;
  }
  function arrive(){return sitting?stand():sit();}
  function toggleFireworks(){
    if(!alive||!sitting||!active)return;
    showing=!showing;
    if(showing){showStarted=clock;state=recordLakesideAction(state,'shows');persist();say('mira, amor. Este pedacito del cielo es para ti.');}
    else say('también me gusta esta calma, contigo.');
    update();
  }
  function wish(){
    if(!alive||!sitting||!active)return;
    state=recordLakesideAction(state,'wishes');wishStarted=clock;persist();
    say(LAKESIDE_WISHES[(state.wishes-1)%LAKESIDE_WISHES.length]);update();
  }
  function sync(next={}){
    if(!alive)return;
    const nextActive=Boolean(next.active),nextNear=Boolean(next.near);
    if(active===nextActive&&near===nextNear)return;
    active=nextActive;near=nextNear;
    if(!near&&!sitting)seen=false;
    update();
  }
  function tick(dt,{active:running=active,night:isNight=night}={}){
    if(!alive)return;
    night=Boolean(isNight);
    if(!running||!active||document.hidden)return;
    clock+=clamp(Number(dt)||0,0,.1);
    if(showing&&clock-showStarted>=FIREWORK_DURATION){
      showing=false;reply.textContent='Leo: se apagaron los fuegos, pero yo me quedo otro ratito contigo.';update();
    }
  }
  function blanket(ctx,x,y){
    ctx.fillStyle='#66544544';ctx.fillRect(x-49,y+7,101,25);
    ctx.fillStyle='#B68294';ctx.fillRect(x-47,y+4,96,24);
    ctx.fillStyle='#E1B7B5';ctx.fillRect(x-45,y+6,92,19);
    ctx.fillStyle='#C08C9C';
    for(let i=-39;i<47;i+=9)ctx.fillRect(x+i,y+6,2,19);
    for(let i=10;i<25;i+=7)ctx.fillRect(x-45,y+i,92,2);
    ctx.fillStyle='#F4D8C0';ctx.fillRect(x-45,y+5,92,1);
    for(let i=-45;i<47;i+=4)ctx.fillRect(x+i,y+27,1,3);
  }
  function lantern(ctx,x,y){
    ctx.fillStyle='#6D5144';ctx.fillRect(x-3,y-11,7,12);ctx.fillRect(x-4,y-10,9,2);
    ctx.fillStyle='#EFCB8C';ctx.fillRect(x-2,y-7,5,6);
    ctx.fillStyle='#FFF0BE';ctx.fillRect(x,y-6,1,4);
    ctx.fillStyle='#876D50';ctx.fillRect(x-5,y+1,11,2);
  }
  function drawScenery(ctx){
    blanket(ctx,COAST_SEAT.x,COAST_SEAT.y-4);
    lantern(ctx,COAST_SEAT.x-62,COAST_SEAT.y+13);
    lantern(ctx,COAST_SEAT.x+64,COAST_SEAT.y+13);
    ctx.fillStyle='#876454';ctx.fillRect(COAST_SEAT.x-56,COAST_SEAT.y-2,5,12);
    ctx.fillStyle='#D3BE9E';ctx.fillRect(COAST_SEAT.x-55,COAST_SEAT.y-4,3,3);
    ctx.fillStyle='#F1DFC0';ctx.fillRect(COAST_SEAT.x-54,COAST_SEAT.y+8,3,3);
  }
  function bottomReserve(ctx){
    if(reserveCache?.height===ctx.canvas.height&&reserveCache?.width===ctx.canvas.width)return reserveCache.reserve;
    const frameBox=frame?.getBoundingClientRect(),hudBox=hud.getBoundingClientRect();
    if(!frameBox?.height||!hudBox.height)return Math.min(ctx.canvas.height*.23,80);
    const reserve=(frameBox.bottom-hudBox.top)*ctx.canvas.height/frameBox.height+9;
    reserveCache={width:ctx.canvas.width,height:ctx.canvas.height,reserve};return reserve;
  }
  function drawActor(ctx,who,x,y){
    return drawHomeActor(ctx,{who,pose:'tv',frame:0,x,y,outfits:getOutfits(),getCharacterImage,
      getRawImage:getRawImage||assetImage,getPoseImage:assetImage});
  }
  function drawFallback(ctx,width,height){
    ctx.fillStyle='#3B3D60';ctx.fillRect(0,0,width,height*.4);
    ctx.fillStyle='#315C6D';ctx.fillRect(0,height*.4,width,height*.4);
    ctx.fillStyle='#B1A389';ctx.fillRect(0,height*.8,width,height*.2);
    ctx.fillStyle='#E6D5B2';ctx.fillRect(width*.74,height*.12,12,12);
  }
  function drawView(ctx,{reducedMotion=false}={}){
    if(!alive||!sitting||!active){
      Object.assign(ctx.canvas.dataset,{coastView:'false',coastSitting:'false',coastFireworks:'false',coastParticles:'0',coastStars:'0'});
      return false;
    }
    const width=ctx.canvas.width,height=ctx.canvas.height,reserve=bottomReserve(ctx);
    const baseline=Math.max(height*.58,Math.min(height*.87,height-reserve-3));
    const scale=Math.max(width/640,height/400),imageHeight=400*scale,imageWidth=640*scale;
    const imageX=(width-imageWidth)/2,imageY=clamp(baseline-338*scale,height-imageHeight,0);
    const background=assetImage?.(COAST_VIEW_URL);
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
    if(background)ctx.drawImage(background,imageX,imageY,imageWidth,imageHeight);else drawFallback(ctx,width,height);
    // World-to-view coordinates keep every burst in the open visible sky, even
    // when portrait framing crops the wide source artwork.
    const skyTop=Math.max(7,height*.05);
    const horizon=imageY+170*scale;
    const skyBottom=Math.max(skyTop+15,Math.min(baseline-69,horizon-6,height*.43));
    const toX=x=>width*.13+(x-150)/380*width*.74;
    const toY=y=>skyTop+(y-12)/155*Math.max(12,skyBottom-skyTop);
    const particles=showing?fireworkParticles(reducedMotion?1:clock-showStarted,{reducedMotion}):[];
    const burstScale=clamp(Math.min(width/420,height/270),.6,1.4);
    // Each eighteen-point burst keeps a single scale in both axes. Its center
    // adapts to the viewport without stretching a round firework on a phone.
    for(let start=0;start<particles.length;start+=18){
      const burst=particles.slice(start,start+18);
      const centerX=burst.reduce((sum,p)=>sum+p.x,0)/burst.length;
      const centerY=burst.reduce((sum,p)=>sum+p.y,0)/burst.length;
      const sourceRadius=Math.max(...burst.map(p=>Math.abs(p.y-centerY)));
      const fittedScale=Math.min(burstScale,Math.max(.15,(skyBottom-skyTop-7)/(sourceRadius*2+1)));
      const radius=sourceRadius*fittedScale+3;
      const screenCenterY=clamp(toY(centerY),skyTop+radius,Math.max(skyTop+radius,skyBottom-radius));
      for(const particle of burst){
        const x=Math.round(toX(centerX)+(particle.x-centerX)*fittedScale);
        const y=Math.round(screenCenterY+(particle.y-centerY)*fittedScale);
        ctx.fillStyle=particle.color;
        for(let tail=3;tail>=1;tail--){
          ctx.globalAlpha=particle.alpha*(.6-tail*.12);
          ctx.fillRect(Math.round(x-particle.dx*tail*2),Math.round(y-particle.dy*tail*2),2,1);
        }
        ctx.globalAlpha=particle.alpha*.91;ctx.fillRect(x,y,particle.size,particle.size);
        const waterY=Math.round(height*.48+(skyBottom-y)*.42);
        if(waterY<baseline-10){ctx.globalAlpha=particle.alpha*.2;ctx.fillRect(x-2,waterY,5,1);}
      }
    }
    ctx.globalAlpha=1;lastParticleCount=particles.length;lastStarCount=0;
    const wishAge=wishStarted===null?-1:clock-wishStarted;
    const starAge=reducedMotion?(wishStarted===null?-1:.7):wishAge>=0&&wishAge<1.4?wishAge:clock%18-6;
    if(night&&starAge>=0&&starAge<1.4){
      const progress=starAge/1.4,x=width*.27+progress*width*.38,y=skyTop+progress*Math.max(7,(skyBottom-skyTop)*.4);
      ctx.fillStyle='#FFF1CB';
      for(let i=8;i>=0;i--){ctx.globalAlpha=(1-i/10)*.8;ctx.fillRect(Math.round(x-i*2),Math.round(y-i*.7),i===0?3:2,1);}
      ctx.globalAlpha=1;lastStarCount=1;
    }
    const center=Math.round(width/2),seatY=Math.round(baseline-18);
    blanket(ctx,center,seatY);
    lantern(ctx,center-61,seatY+12);lantern(ctx,center+62,seatY+12);
    drawActor(ctx,'leo',center-32,Math.round(baseline-45));
    drawActor(ctx,'itza',center+1,Math.round(baseline-45));
    ctx.restore();
    Object.assign(ctx.canvas.dataset,{coastView:'true',coastSitting:'true',coastFireworks:String(showing),
      coastParticles:String(lastParticleCount),coastStars:String(lastStarCount),coastWishes:String(state.wishes)});
    return true;
  }
  function dispose(){
    alive=false;sitting=false;showing=false;observer?.disconnect();hud.remove();sceneTitle.remove();
    if(screen)screen.dataset.coastView='false';
  }
  return {arrive,stand,isSitting:()=>sitting,drawScenery,drawView,tick,sync,dispose,
    getState:()=>({...state}),getStats:()=>({sitting,showing,clock,particles:lastParticleCount,stars:lastStarCount})};
}
