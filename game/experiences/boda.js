import {node,labeledButton,paragraph} from './dom.js';

// No se usa audio protegido ni reproducción automática; la música ambiental del juego continúa.
export const WEDDING_STAGES=[
  {id:'welcome',name:'La llegada',caption:'Nuestro castillo',line:'Mira, amor. Hasta aquí nos trajo este pequeño mundo.',asset:'idle',frames:2,duration:1.25},
  {id:'vows',name:'Nuestras promesas',caption:'Nuestros votos',line:'Prometo elegirte cada día, incluso en los días difíciles.',asset:'vows',frames:4,duration:.64},
  {id:'kiss',name:'El gran sí',caption:'El momento especial',line:'Y hoy, en este cuento que construimos, volvemos a decir que sí.',asset:'kiss',frames:3,duration:.9},
  {id:'hug',name:'El abrazo',caption:'Siempre juntos',line:'Un abrazo que dice mucho más que cualquier palabra.',asset:'hug',frames:2,duration:1.1},
  {id:'celebrate',name:'¡A celebrar!',caption:'Nuestra historia continúa',line:'¡Que nunca nos falten motivos para celebrarnos!',asset:'celebrate',frames:3,duration:.65},
  {id:'end',name:'Para recordar',caption:'Un recuerdo para siempre',line:'Te volvería a elegir en cada una de nuestras historias.',asset:'idle',frames:2,duration:1.25}
];
export const stageFor=index=>WEDDING_STAGES[Math.min(WEDDING_STAGES.length-1,Math.max(0,index))];

export function mount(root,_data,api){
  let index=0,clock=0,playing=true,alive=true,last=0,frameHandle=0;
  let autoStory=false,storyClock=0,transition=0;
  const shell=node('section','wedding-ceremony');
  shell.setAttribute('aria-label','Ceremonia interactiva de Itza y Leo');
  const status=node('p','wedding-stage-number');
  const stageName=node('h3','wedding-stage-title');
  const caption=node('p','wedding-stage-caption');
  const canvas=node('canvas','wedding-cinema');
  canvas.width=480;canvas.height=270;
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Itza y Leo vestidos de boda celebran frente a un altar de flores');
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const story=node('p','wedding-vow');
  story.setAttribute('aria-live','polite');
  const controls=node('div','wedding-controls');
  const back=labeledButton('Anterior',()=>setStage(index-1),'wedding-nav');
  const next=labeledButton('Siguiente',()=>setStage(index===WEDDING_STAGES.length-1?0:index+1),'wedding-nav wedding-next');
  const replay=labeledButton('Repetir escena',()=>{clock=0;playing=true;},'wedding-nav');
  const auto=labeledButton('Reproducir historia',()=>{
    if(!autoStory&&index===WEDDING_STAGES.length-1)setStage(0);
    autoStory=!autoStory;storyClock=0;
    auto.textContent=autoStory?'Pausar historia':'Reproducir historia';
    auto.setAttribute('aria-pressed',String(autoStory));
  },'wedding-nav wedding-auto');
  auto.setAttribute('aria-pressed','false');
  const yes=labeledButton('Sí, quiero',()=>{
    setStage(2);
    story.textContent='Sí, quiero. Hoy y en cada capítulo de nuestra historia.';
  },'wedding-nav wedding-yes');
  const counter=node('p','wedding-progress');
  controls.append(back,next,replay,auto,yes);
  shell.append(status,stageName,caption,canvas,story,counter,controls);
  root.append(shell);

  // Fallback visual deliberado: la ceremonia funciona incluso con cargas lentas de arte.
  function rectangle(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function fallbackCastle(){
    rectangle(0,0,480,270,'#312a4a');
    rectangle(0,176,480,94,'#b98d86');
    for(let y=184;y<270;y+=15)for(let x=((y/15)|0)%2?0:17;x<480;x+=34)
      rectangle(x,y,32,1,'#ebc8ac');
    rectangle(80,46,320,134,'#f8ddc4');
    rectangle(96,38,288,18,'#e6a3b2');
    for(const x of [80,342]){
      rectangle(x,22,58,157,'#f4d4bd');
      rectangle(x-9,15,76,15,'#e6a3b2');
      rectangle(x+20,43,16,44,'#ffdb9a');
    }
    rectangle(210,100,60,80,'#9e5e67');
    rectangle(218,109,44,71,'#efc7b3');
    rectangle(232,115,16,65,'#b76575');
  }
  function drawBackdrop(time){
    // Atardecer lavanda y jardín frontal, con parpadeos pixelados.
    rectangle(0,0,480,270,'#6d5875');
    for(let y=0;y<180;y+=15){
      const bands=['#75617d','#7d6885','#8d7590','#997f91','#a88f97','#c0a19a'];
      rectangle(0,y,480,15,bands[Math.min(5,Math.floor(y/30))]);
    }
    rectangle(0,183,480,87,'#97ac87');
    rectangle(0,218,480,52,'#c5a799');
    for(let y=221;y<270;y+=13){
      for(let x=Math.floor(y/13)%2?0:13;x<480;x+=26){
        rectangle(x,y,24,1,'#f8d4bc');
      }
    }
    for(let i=0;i<27;i++){
      const x=(i*97+43)%480,y=(i*53+17)%174;
      const pulse=Math.sin(time*1.3+i*1.87)>0.24;
      rectangle(x,y,pulse?3:1,pulse?3:1,i%3===0?'#fff4c9':'#e9bed1');
    }
    const castle=api.getWeddingImage('castle');
    if(castle)ctx.drawImage(castle,108,53,264,154);
    else fallbackCastle();
    const roof=api.getWeddingImage('roof');
    if(roof)ctx.drawImage(roof,100,17,280,86);
    // Un toque de pétalos bajo los zapatos, sin colocar losetas cuadradas
    // flotando en la parte inferior de la pantalla.
    const petal=api.getWeddingImage('petalPath');
    if(petal)ctx.drawImage(petal,221,212,38,38);
    // El arco queda detrás de la pareja durante los votos.
    const arch=api.getWeddingImage('arch');
    if(arch)ctx.drawImage(arch,173,87,134,148);
    else{
      rectangle(174,95,9,128,'#e5b6a5');
      rectangle(298,95,9,128,'#e5b6a5');
      rectangle(183,92,115,10,'#f4d6c5');
      for(let i=0;i<9;i++)rectangle(175+i*15,83+Math.abs(4-i)*2,9,9,i%2?'#d68f9e':'#b9bc91');
    }
    for(const x of [148,332]){
      const flower=api.getWeddingImage('flower');
      if(flower)ctx.drawImage(flower,x-18,198,36,46);
      else{rectangle(x-13,212,26,12,'#ebc1b7');rectangle(x-11,198,22,16,'#bf7991');}
    }
    const bench=api.getWeddingImage('bench');
    if(bench&&stageFor(index).id==='end'){
      ctx.globalAlpha=.87;
      ctx.drawImage(bench,15,189,85,76);
      ctx.drawImage(bench,380,189,85,76);
      ctx.globalAlpha=1;
    }
  }
  function drawPairSprite(stage,t){
    const image=api.getWeddingImage(stage.asset);
    if(image){
      const sourceW=stage.id==='vows'?64:64;
      const n=stage.frames;
      const frame=Math.floor(t/stage.duration)%n;
      const factor=stage.id==='celebrate'?2.4:stage.id==='welcome'?2.3:2.35;
      const width=Math.round(64*factor),height=Math.round(48*factor);
      ctx.drawImage(image,frame*sourceW,0,sourceW,48,240-width/2,193-height/2,width,height);
    }else{
      // Ambas figuras siguen visibles aunque alguna imagen tarde en cargar.
      for(let i=0;i<2;i++){
        const x=i?248:205;
        rectangle(x,126,28,31,'#211d29');
        rectangle(x+4,129,19,18,'#c48d77');
        rectangle(x+1,158,26,35,i?'#fff0d6':'#27252c');
        rectangle(x+5,139,5,3,'#27252c');rectangle(x+17,139,5,3,'#27252c');
      }
      if(stage.id==='vows'||stage.id==='kiss')rectangle(230,162,18,5,'#edbc9d');
    }
  }
  function particles(time,celebration){
    if(!celebration)return;
    const hearts=api.getWeddingImage('hearts');
    const sparkles=api.getWeddingImage('sparkles');
    const n=hearts?6:0;
    for(let i=0;i<15;i++){
      const x=(i*71+30+Math.sin(time*.6+i)*14)%460;
      const y=((i*47+225-time*(10+(i%5)*4))%210+210)%210+9;
      if(i%2===0&&hearts)ctx.drawImage(hearts,(Math.floor(time*5+i)%n)*16,0,16,16,x,y,16,16);
      else if(sparkles)ctx.drawImage(sparkles,(Math.floor(time*6+i)%6)*16,0,16,16,x,y,16,16);
      else rectangle(x,y,3,3,i%2?'#fff3af':'#f4a2b6');
    }
  }
  function redraw(){
    if(!alive)return;
    const stage=stageFor(index);
    drawBackdrop(clock);
    drawPairSprite(stage,clock);
    particles(clock,stage.id==='kiss'||stage.id==='celebrate'||stage.id==='end');
    if(transition>0){
      ctx.fillStyle='#fff3d9';ctx.globalAlpha=Math.min(.45,transition*1.1);
      ctx.fillRect(0,0,480,270);ctx.globalAlpha=1;
    }
    ctx.strokeStyle='#f3d3ad';ctx.lineWidth=4;
    ctx.strokeRect(2,2,476,266);
  }
  function setStage(n){
    const nextIndex=Math.min(WEDDING_STAGES.length-1,Math.max(0,n));
    index=nextIndex;clock=0;storyClock=0;transition=.38;playing=true;
    const stage=stageFor(index);
    status.textContent='Capítulo '+(index+1)+' de '+WEDDING_STAGES.length;
    stageName.textContent=stage.name;
    caption.textContent=stage.caption;
    story.textContent=stage.line;
    counter.textContent='Escena '+(index+1)+' / '+WEDDING_STAGES.length;
    back.disabled=index===0;
    yes.hidden=stage.id!=='vows';
    next.textContent=index===WEDDING_STAGES.length-1?'Volver al principio':'Siguiente';
    redraw();
  }
  function animate(timestamp){
    if(!alive)return;
    const dt=Math.min(.05,(timestamp-last)/1000||0);last=timestamp;
    if(playing)clock+=dt;
    transition=Math.max(0,transition-dt);
    if(autoStory){
      storyClock+=dt;
      const seconds={welcome:7,vows:10,kiss:7,hug:8,celebrate:9,end:12};
      if(storyClock>=(seconds[stageFor(index).id]||8)){
        if(index===WEDDING_STAGES.length-1){
          autoStory=false;auto.textContent='Reproducir historia';
          auto.setAttribute('aria-pressed','false');
        }else setStage(index+1);
      }
    }
    redraw();frameHandle=requestAnimationFrame(animate);
  }
  setStage(0);
  frameHandle=requestAnimationFrame(animate);
  return ()=>{alive=false;cancelAnimationFrame(frameHandle);};
}
