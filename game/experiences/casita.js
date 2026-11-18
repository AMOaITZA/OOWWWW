import {node,paragraph} from './dom.js';
import {HOME_ACTIVITIES,HOME_LAYOUT,visitHome,chooseHomeActivity} from '../home.js';
import {getChoice,getSelectedLook} from '../wardrobe.js';
import {getHairColor} from '../hair.js';
import {getGlasses} from '../glasses.js';
import './casita.css';

const INTERIOR='/assets/game/home/interior.png';
const activityOf=id=>HOME_ACTIVITIES.find(activity=>activity.id===id)||HOME_ACTIVITIES[0];

export function mount(root,_data,api){
  let home=visitHome(api.save.home),alive=true,frame=0,last=0,clock=0;
  api.save.home=home;api.onProgressChange?.();
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const intro=paragraph(root,'Aquí siempre hay un lugar para los dos. ¿Qué hacemos hoy?','home-intro');
  const room=node('section','home-room');
  const canvas=node('canvas','home-scene');canvas.width=480;canvas.height=270;
  canvas.setAttribute('role','img');
  const caption=node('p','home-caption');
  const sceneFrame=node('div','home-scene-frame');sceneFrame.append(canvas);room.append(sceneFrame,caption);
  const activities=node('div','home-activities');activities.setAttribute('role','group');activities.setAttribute('aria-label','Actividades de la casita');
  const buttons=new Map();
  for(const [index,activity] of HOME_ACTIVITIES.entries()){
    const button=node('button','home-activity');button.type='button';button.dataset.homeActivity=activity.id;
    button.setAttribute('aria-label',activity.label);
    const number=node('span','home-activity-number',String(index+1).padStart(2,'0'));
    number.setAttribute('aria-hidden','true');
    button.append(number,node('strong','',activity.label),node('span','home-activity-hint',activity.hint));
    button.addEventListener('click',()=>select(activity.id));buttons.set(activity.id,button);activities.append(button);
  }
  const reply=paragraph(root,'','home-reply');reply.setAttribute('role','status');reply.setAttribute('aria-live','polite');
  const keepsake=node('div','home-keepsake');
  root.append(room,activities,reply,keepsake);
  const ctx=canvas.getContext('2d');
  const outfits=()=>api.getOutfits?.()??api.save.outfits??{};
  const image=url=>api.getCharacterImage?.(url)??api.assetImage?.(url);
  function actor(who,x,y,pose,blink=0){
    const choices=outfits(),look=getChoice(choices,who);
    if(pose==='eat'){
      const seated=api.getSeatedImage?.(who,look);
      if(seated)ctx.drawImage(seated,blink*32,0,32,48,x,y,32,48);
      return;
    }
    const sheet=image(getSelectedLook(choices,who)?.sheet);if(!sheet)return;
    if(pose==='sleep')ctx.drawImage(sheet,32,0,32,24,x,y,32,24);
    else ctx.drawImage(sheet,blink*32,96,32,34,x,y,32,34);
  }
  function restoreFurniture(background,box){
    if(background)ctx.drawImage(background,box.x,box.y,box.width,box.height,box.x,box.y,box.width,box.height);
  }
  function heart(x,y,color){
    ctx.fillStyle=color;ctx.fillRect(x+1,y,2,1);ctx.fillRect(x+4,y,2,1);
    ctx.fillRect(x,y+1,7,2);ctx.fillRect(x+1,y+3,5,1);ctx.fillRect(x+2,y+4,3,1);ctx.fillRect(x+3,y+5,1,1);
  }
  function draw(){
    if(!alive)return;
    ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
    const background=api.assetImage?.(INTERIOR);
    if(background)ctx.drawImage(background,0,0,480,270);
    else{ctx.fillStyle='#CFAE8E';ctx.fillRect(0,0,480,270);ctx.fillStyle='#F4DEBD';ctx.fillRect(12,12,456,246);}
    const still=preference.matches,blink=still?0:Math.floor(clock/1.8)%2;
    canvas.dataset.activity=home.activity;
    canvas.dataset.leoLook=getChoice(outfits(),'leo');canvas.dataset.itzaLook=getChoice(outfits(),'itza');
    canvas.dataset.itzaHair=getHairColor(outfits());canvas.dataset.itzaGlasses=String(getGlasses(outfits(),'itza'));
    canvas.dataset.motion=still?'reduced':'active';
    if(home.activity==='eat'){
      HOME_LAYOUT.table.people.forEach(([x,y],index)=>actor(index?'itza':'leo',x,y,'eat',blink));
      restoreFurniture(background,HOME_LAYOUT.table.foreground);
      for(const [index,[x,y]] of HOME_LAYOUT.table.food.entries()){
        if(!still){
          const rise=Math.floor((clock*.7+index*.4)%1*6);
          ctx.globalAlpha=.45;ctx.fillStyle='#FFF3DA';ctx.fillRect(x-2,y-8-rise,1,4);ctx.fillRect(x+2,y-11-rise,1,3);ctx.globalAlpha=1;
        }
      }
    }else if(home.activity==='sleep'){
      HOME_LAYOUT.bed.heads.forEach(([x,y],index)=>actor(index?'itza':'leo',x,y,'sleep'));
      const blanket=HOME_LAYOUT.bed.blanket;
      restoreFurniture(background,blanket);
      ctx.fillStyle='rgba(56,41,66,.13)';ctx.fillRect(0,0,480,270);
      heart(blanket.x+36,blanket.y+24,'#F1D9C0');
      ctx.fillStyle='#FFF1DC';ctx.font="10px 'Silkscreen', monospace";
      const lift=still?0:Math.floor(Math.sin(clock*1.8)*2);
      ctx.fillText('z',143,94+lift);ctx.fillText('z',151,85+lift);ctx.fillText('Z',160,75+lift);
    }else{
      ctx.fillStyle='rgba(40,43,65,.1)';ctx.fillRect(0,0,480,270);
      const tv=HOME_LAYOUT.tv;
      ctx.fillStyle='#334454';ctx.fillRect(tv.x,tv.y,tv.width,tv.height);
      ctx.fillStyle='#78939A';ctx.fillRect(tv.x+2,tv.y+2,tv.width-4,tv.height-4);
      ctx.fillStyle='#B8B597';ctx.fillRect(tv.x+2,tv.y+tv.height-10,tv.width-4,8);
      const sway=still?0:Math.floor(Math.sin(clock)*3);
      heart(tv.x+7+sway,tv.y+7,'#F6CED1');heart(tv.x+27-sway,tv.y+11,'#F7E0B6');
      ctx.fillStyle='#FFF1DC';ctx.fillRect(tv.x+7,tv.y+5,1,1);ctx.fillRect(tv.x+tv.width-7,tv.y+6,1,1);
      HOME_LAYOUT.sofa.people.forEach(([x,y],index)=>actor(index?'itza':'leo',x,y,'tv',blink));
      restoreFurniture(background,HOME_LAYOUT.sofa.foreground);
    }
    if(api.getPonyoUnlocked?.()){
      const ponyo=api.getPonyoImage?.();
      if(ponyo)ctx.drawImage(ponyo,0,0,32,32,HOME_LAYOUT.ponyo.x,HOME_LAYOUT.ponyo.y,27,27);
    }
  }
  function describe(){
    const activity=activityOf(home.activity);
    caption.textContent=activity.caption;reply.textContent='Leo: '+activity.line;
    canvas.setAttribute('aria-label',`Itza y Leo en su casita: ${activity.label.toLowerCase()}`);
    for(const [id,button] of buttons)button.setAttribute('aria-pressed',String(id===home.activity));
    keepsake.textContent=api.getPonyoUnlocked?.()?'Ponyo también tiene un rinconcito aquí.':'Nuestro lugar favorito siempre será juntos.';
    keepsake.dataset.ponyo=String(Boolean(api.getPonyoUnlocked?.()));
  }
  function select(id){
    if(!alive)return;
    home=chooseHomeActivity(home,id);api.save.home=home;clock=0;
    api.onProgressChange?.();api.onLeoSay?.(activityOf(id).line);describe();draw();
  }
  function tick(time){
    if(!alive)return;
    const elapsed=last?Math.min(.05,(time-last)/1000):0;last=time;
    if(!document.hidden&&!preference.matches){clock+=elapsed;draw();}
    frame=requestAnimationFrame(tick);
  }
  function preferenceChanged(){
    cancelAnimationFrame(frame);frame=0;last=0;draw();
    if(!preference.matches)frame=requestAnimationFrame(tick);
  }
  function visibilityChanged(){last=0;}
  preference.addEventListener('change',preferenceChanged);document.addEventListener('visibilitychange',visibilityChanged);
  describe();draw();if(!preference.matches)frame=requestAnimationFrame(tick);
  return ()=>{alive=false;cancelAnimationFrame(frame);preference.removeEventListener('change',preferenceChanged);document.removeEventListener('visibilitychange',visibilityChanged);};
}
