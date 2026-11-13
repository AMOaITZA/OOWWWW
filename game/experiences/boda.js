import {node,labeledButton} from './dom.js';
import {drawWeddingCastle,weddingAssetStatus} from '../wedding-assets.js';

// La ceremonia conserva el reproductor montado: nunca solicita reproducción de audio.
export const WEDDING_STAGES=[
  {id:'welcome',name:'La llegada',caption:'Nuestro castillo',line:'Mira, amor. Hasta aquí nos trajo este pequeño mundo.',asset:'idle',frames:2,duration:1.25},
  {id:'vows',name:'Nuestras promesas',caption:'Nuestros votos',line:'Prometo elegirte cada día, incluso en los días difíciles.',asset:'vows',frames:4,duration:.8},
  {id:'kiss',name:'El gran sí',caption:'El momento especial',line:'Y hoy, en este cuento que construimos, volvemos a decir que sí.',asset:'kiss',frames:3,duration:1},
  {id:'hug',name:'El abrazo',caption:'Siempre juntos',line:'Un abrazo que dice mucho más que cualquier palabra.',asset:'hug',frames:2,duration:1.2},
  {id:'celebrate',name:'¡A celebrar!',caption:'Nuestra historia continúa',line:'¡Que nunca nos falten motivos para celebrarnos!',asset:'celebrate',frames:3,duration:.85},
  {id:'end',name:'Para recordar',caption:'Un recuerdo para siempre',line:'Te volvería a elegir en cada una de nuestras historias.',asset:'idle',frames:2,duration:1.25}
];
export const stageFor=index=>WEDDING_STAGES[Math.min(WEDDING_STAGES.length-1,Math.max(0,index))];
const CHAPTER_SECONDS=[7,10,7,8,9,12];
// Los lienzos originales tienen márgenes distintos. Compensarlos al dibujar
// mantiene los zapatos en el mismo suelo y evita saltos laterales entre poses.
const PAIR_ANCHORS={
  idle:{feet:[44,44],x:[-2,2]},vows:{feet:[48,48,48,48],x:[-4,0,0,3]},
  kiss:{feet:[48,48,48],x:[12,2,-12]},hug:{feet:[48,48],x:[-6,0]},
  celebrate:{feet:[44,48,44],x:[-2,0,2]}
};
function poseFrame(stage,time,reduced){
  if(reduced)return ['vows','kiss','hug'].includes(stage.id)?stage.frames-1:0;
  const step=Math.floor(time/stage.duration);
  // Los votos y el beso avanzan una vez y sostienen la pose, sin rebobinarla.
  if(['vows','kiss','hug'].includes(stage.id))return Math.min(stage.frames-1,step);
  if(stage.id==='end')return 0;
  if(stage.id==='celebrate')return [0,1,2,1][step%4];
  return step%stage.frames;
}

// Geometría de dibujo comprobable sin Canvas ni reloj del navegador.
export function weddingPose(stage,time,reduced=false){
  const frame=poseFrame(stage,Math.max(0,time),reduced);
  const anchor=PAIR_ANCHORS[stage.asset];
  const arrival=stage.id==='welcome'&&!reduced?Math.max(0,1-time/1.5):0;
  return {frame,sourceX:frame*64,sourceFeet:anchor.feet[frame],
    x:176+Math.round(anchor.x[frame]-arrival*10),
    y:232-anchor.feet[frame]*2+Math.round(arrival*8),width:128,height:96};
}

export function mount(root,_data,api){
  let index=0,clock=0,alive=true,last=0,frameHandle=0;
  let autoStory=false,storyClock=0,transition=0,previousFrame=null,lastAssetStatus='';
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=motion.matches;
  const shell=node('section','wedding-ceremony');
  shell.setAttribute('aria-label','Ceremonia interactiva de Itza y Leo');
  const status=node('p','wedding-stage-number');
  const stageName=node('h3','wedding-stage-title');
  const caption=node('p','wedding-stage-caption');
  const canvas=node('canvas','wedding-cinema');
  canvas.width=480;canvas.height=270;
  canvas.setAttribute('role','img');
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const story=node('p','wedding-vow');story.setAttribute('aria-live','polite');
  const artNotice=node('p','wedding-art-notice');
  artNotice.setAttribute('role','status');artNotice.hidden=true;
  const controls=node('div','wedding-controls');
  controls.setAttribute('role','group');controls.setAttribute('aria-label','Controles de los capítulos');
  const back=labeledButton('Anterior',()=>setStage(index-1),'wedding-nav');
  const next=labeledButton('Siguiente',()=>setStage(index===WEDDING_STAGES.length-1?0:index+1),'wedding-nav wedding-next');
  const replay=labeledButton('Repetir escena',()=>setStage(index),'wedding-nav');
  const auto=labeledButton('Reproducir historia',()=>{
    if(!autoStory&&index===WEDDING_STAGES.length-1)setStage(0);
    autoStory=!autoStory;updateAuto();
  },'wedding-nav wedding-auto');
  auto.setAttribute('aria-pressed','false');
  const yes=labeledButton('Sí, quiero',()=>{
    setStage(2);story.textContent='Sí, quiero. Hoy y en cada capítulo de nuestra historia.';
    // El botón desaparece en este capítulo; el foco permanece en un control visible.
    next.focus({preventScroll:true});
  },'wedding-nav wedding-yes');
  const counter=node('p','wedding-progress');
  controls.append(back,next,replay,auto,yes);
  shell.append(status,stageName,caption,canvas,artNotice,story,counter,controls);root.append(shell);

  function rectangle(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function drawBackdrop(time){
    rectangle(0,0,480,270,'#6d5875');
    const bands=['#75617d','#7d6885','#8d7590','#997f91','#a88f97','#c0a19a'];
    for(let y=0;y<180;y+=15)rectangle(0,y,480,15,bands[Math.min(5,Math.floor(y/30))]);
    rectangle(0,180,480,90,'#97ac87');
    rectangle(0,231,480,39,'#c5a799');
    for(let y=235;y<270;y+=13)for(let x=Math.floor(y/13)%2?0:13;x<480;x+=26)
      rectangle(x,y,24,1,'#e8c5ad');
    for(let i=0;i<18;i++){
      const x=(i*97+43)%480,y=(i*53+17)%100;
      const pulse=!reduced&&Math.sin(time*.7+i*1.87)>.65;
      rectangle(x,y,pulse?2:1,pulse?2:1,i%3===0?'#fff4c9':'#e9bed1');
    }
    // Sombra y zócalo conectan la fachada con el jardín.
    rectangle(142,184,196,5,'#84977a');
    if(!drawWeddingCastle(ctx,api.getWeddingImage('castle'),api.getWeddingImage('roof'),108,39)){
      rectangle(150,85,180,100,'#f8ddc4');rectangle(143,73,194,17,'#ce8f9f');
      rectangle(224,130,32,55,'#9e5e67');
    }
    // El recurso petalPath es una loseta con fondo crema: aquí sus bordes
    // formarían un cuadrado flotante. Distribuimos pétalos sobre el suelo.
    for(let i=0;i<14;i++)rectangle(215+(i*19)%52,222+(i*13)%39,2,1,i%2?'#e1a7b6':'#f5d8cd');
    // El arco conserva su relación 64:86, ampliado exactamente al doble.
    const arch=api.getWeddingImage('arch');
    if(arch)ctx.drawImage(arch,176,65,128,172);
    for(const x of [143,337]){
      const flower=api.getWeddingImage('flower');
      if(flower)ctx.drawImage(flower,x-16,201,32,40);
    }
    const bench=api.getWeddingImage('bench');
    if(bench&&stageFor(index).id==='end'){
      ctx.drawImage(bench,31,188,68,68);ctx.drawImage(bench,381,188,68,68);
    }
    // Pétalos laterales discretos; nunca cruzan las caras de la pareja.
    for(let i=0;i<6;i++){
      const x=i<3?104+i*22:332+(i-3)*22;
      const y=196+((i*11+(reduced?0:time*3))%45);
      rectangle(x+(reduced?0:Math.sin(time*.5+i)*3),y,2,1,'#e8bbc0');
    }
  }
  function drawPairSprite(stage,time){
    const image=api.getWeddingImage(stage.asset);
    const pose=weddingPose(stage,time,reduced);
    // Misma escala entera en todos los capítulos: contornos nítidos, sin estirar.
    ctx.fillStyle='#798773';ctx.globalAlpha=.35;
    ctx.fillRect(pose.x+32,pose.y+pose.sourceFeet*2,64,4);ctx.globalAlpha=1;
    if(image)ctx.drawImage(image,pose.sourceX,0,64,48,pose.x,pose.y,pose.width,pose.height);
    else{
      for(let i=0;i<2;i++){
        const x=i?247:209;
        rectangle(x,161,24,28,'#211d29');rectangle(x+4,174,17,15,'#c48d77');
        rectangle(x+1,189,24,41,i?'#fff0d6':'#27252c');
      }
    }
    canvas.dataset.frame=String(pose.frame);
  }
  function particles(time,stage){
    if(reduced||!['kiss','celebrate','end'].includes(stage.id))return;
    const hearts=api.getWeddingImage('hearts'),sparkles=api.getWeddingImage('sparkles');
    const count=stage.id==='end'?4:stage.id==='celebrate'?10:6;
    for(let i=0;i<count;i++){
      const x=i%2?318+(i*29)%133:20+(i*29)%133;
      const y=((i*47+225-time*(6+i%3*2))%190+190)%190+20;
      const effect=i%2===0?hearts:sparkles;
      if(effect)ctx.drawImage(effect,(Math.floor(time*4+i)%6)*16,0,16,16,x,y,16,16);
    }
  }
  function redraw(){
    if(!alive)return;
    const stage=stageFor(index),time=reduced?0:clock;
    drawBackdrop(time);drawPairSprite(stage,clock);particles(time,stage);
    if(previousFrame&&transition>0){
      ctx.globalAlpha=transition/.5;ctx.drawImage(previousFrame,0,0);ctx.globalAlpha=1;
      ctx.fillStyle='#fff3d9';ctx.globalAlpha=Math.sin(transition/.5*Math.PI)*.08;
      ctx.fillRect(0,0,480,270);ctx.globalAlpha=1;
    }
    ctx.strokeStyle='#f3d3ad';ctx.lineWidth=4;ctx.strokeRect(2,2,476,266);
    const artStatus=weddingAssetStatus();
    if(artStatus!==lastAssetStatus){
      lastAssetStatus=artStatus;
      artNotice.hidden=artStatus==='atlas';
      artNotice.textContent=artStatus==='loading'?'Cargando el arte de la ceremonia…':
        artStatus==='fallback'?'El arte de boda no está disponible. Se muestra una versión de respaldo.':
        artStatus==='error'?'No se pudo cargar el arte de la ceremonia. El relato y los controles siguen disponibles.':'';
    }
  }
  function updateAuto(){
    auto.textContent=autoStory?'Pausar historia':'Reproducir historia';
    auto.setAttribute('aria-pressed',String(autoStory));
  }
  function setStage(n){
    const nextIndex=Math.min(WEDDING_STAGES.length-1,Math.max(0,n));
    if(!reduced&&last){
      previousFrame=document.createElement('canvas');previousFrame.width=480;previousFrame.height=270;
      previousFrame.getContext('2d').drawImage(canvas,0,0);transition=.5;
    }else{previousFrame=null;transition=0;}
    index=nextIndex;clock=0;storyClock=0;
    const stage=stageFor(index);
    shell.dataset.stage=stage.id;
    status.textContent='Capítulo '+(index+1)+' de '+WEDDING_STAGES.length;
    stageName.textContent=stage.name;caption.textContent=stage.caption;story.textContent=stage.line;
    canvas.setAttribute('aria-label',stage.name+': '+stage.line);
    counter.textContent='Escena '+(index+1)+' / '+WEDDING_STAGES.length;
    back.disabled=index===0;yes.hidden=stage.id!=='vows';
    next.textContent=index===WEDDING_STAGES.length-1?'Volver al principio':'Siguiente';
    redraw();
  }
  function animate(timestamp){
    if(!alive||document.hidden)return;
    const dt=last?Math.min(.05,(timestamp-last)/1000):0;last=timestamp;
    clock+=dt;transition=Math.max(0,transition-dt);
    if(!transition)previousFrame=null;
    if(autoStory){
      storyClock+=dt;
      if(storyClock>=CHAPTER_SECONDS[index]){
        if(index===WEDDING_STAGES.length-1){autoStory=false;updateAuto();}
        else setStage(index+1);
      }
    }
    redraw();frameHandle=requestAnimationFrame(animate);
  }
  function visibility(){
    cancelAnimationFrame(frameHandle);last=0;
    if(!document.hidden&&alive)frameHandle=requestAnimationFrame(animate);
  }
  function motionChanged(event){
    reduced=event.matches;transition=0;previousFrame=null;redraw();
  }
  document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',motionChanged);
  setStage(0);visibility();
  return ()=>{
    alive=false;cancelAnimationFrame(frameHandle);previousFrame=null;
    document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',motionChanged);
  };
}
