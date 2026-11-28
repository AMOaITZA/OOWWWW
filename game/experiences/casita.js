import {node,paragraph} from './dom.js';
import {HOME_ACTIVITIES,HOME_LAYOUT,visitHome,chooseHomeActivity} from '../home.js';
import {getChoice,getSelectedLook} from '../wardrobe.js';
import {getHairColor} from '../hair.js';
import {getGlasses} from '../glasses.js';
import {drawHomeActor} from '../home-poses.js';
import {createHomeVideoPlayer,drawHomeVideoFrame,homeVideoTime} from '../home-video.js';
import {getHomeDecoration} from '../garden.js';
import {normalizeCooking,recipeById} from '../cooking.js';
import manifest from '../data/assets.json';
import './casita.css';

const INTERIOR='/assets/game/home/interior.png';
const SOFA_BACK='/assets/game/home/sofa-back-patch.png';
const activityOf=id=>HOME_ACTIVITIES.find(activity=>activity.id===id)||HOME_ACTIVITIES[0];

export function mount(root,_data,api){
  let home=visitHome(api.save.home),alive=true,frame=0,last=0,clock=0,expanded=false,videoError='';
  const cooking=normalizeCooking(api.save.cooking);
  const meal=cooking.served?recipeById(cooking.recipe):null;
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
  const tvControls=node('section','home-video-controls');tvControls.setAttribute('aria-label','Video de nuestra tele');
  const videoStatus=node('p','home-video-status');videoStatus.setAttribute('role','status');videoStatus.setAttribute('aria-live','polite');
  const videoActions=node('div','home-video-actions');
  const playVideo=node('button','home-video-play','Reproducir video');playVideo.type='button';
  const muteVideo=node('button','home-video-mute','Silenciar video');muteVideo.type='button';
  const expandVideo=node('button','home-video-expand','Ver en grande');expandVideo.type='button';expandVideo.setAttribute('aria-expanded','false');
  videoActions.append(playVideo,muteVideo,expandVideo);
  const videoProgress=node('input','home-video-progress');videoProgress.type='range';videoProgress.min='0';videoProgress.max='1000';videoProgress.value='0';videoProgress.setAttribute('aria-label','Progreso del video');
  const videoClock=node('span','home-video-clock','0:00 / 0:00');
  const videoTimeline=node('div','home-video-timeline');videoTimeline.append(videoProgress,videoClock);
  const videoVolumeLabel=node('label','home-video-volume','Volumen del video '),videoVolume=node('input');
  videoVolume.type='range';videoVolume.min='0';videoVolume.max='100';videoVolume.setAttribute('aria-label','Volumen del video');videoVolumeLabel.append(videoVolume);
  const videoPreview=node('div','home-video-preview');videoPreview.hidden=true;
  const video=node('video','home-video-source');video.controls=true;video.playsInline=true;video.preload='none';video.tabIndex=0;video.setAttribute('aria-label','Nuestro video');videoPreview.append(video);
  tvControls.append(videoStatus,videoActions,videoTimeline,videoVolumeLabel,videoPreview);
  root.append(room,tvControls,activities,reply,keepsake);
  const outings=node('details','home-outings'),outingsTitle=node('summary','','Más en casa');
  const outingsActions=node('div','home-outings-actions');
  for(const [id,label] of [['cocina','Cocinar juntos'],['huerto','Cuidar el huerto'],['album','Nuestro álbum']]){
    const button=node('button','',label);button.type='button';
    button.addEventListener('click',()=>api.openExperience?.(id));outingsActions.append(button);
  }
  outings.append(outingsTitle,outingsActions);root.append(outings);
  const ctx=canvas.getContext('2d');
  let roomCache=null,roomSource=null,sofaSource=null;
  function roomImage(){
    const background=api.assetImage?.(INTERIOR),sofa=api.assetImage?.(SOFA_BACK);
    if(!background||!sofa)return background;
    if(roomCache&&roomSource===background&&sofaSource===sofa)return roomCache;
    roomSource=background;sofaSource=sofa;
    roomCache=document.createElement('canvas');roomCache.width=480;roomCache.height=270;
    const painter=roomCache.getContext('2d');painter.imageSmoothingEnabled=false;
    painter.drawImage(background,0,0);
    const box=HOME_LAYOUT.sofa.patch;painter.drawImage(sofa,box.x,box.y,box.width,box.height);
    return roomCache;
  }
  const player=createHomeVideoPlayer({video,saved:home.video,
    onChange:state=>{home={...home,video:state};api.save.home=home;api.onProgressChange?.();},
    onPlayback:playing=>{api.onHomeVideoPlayback?.(playing);syncVideo();scheduleFrame();},
    onError:()=>{videoError='No pudimos abrir el video. Puedes intentarlo otra vez.';syncVideo();},
    onUpdate:()=>{syncVideo();draw();scheduleFrame();}});
  const outfits=()=>api.getOutfits?.()??api.save.outfits??{};
  const image=url=>api.getCharacterImage?.(url)??api.assetImage?.(url);
  function actor(who,x,y,pose,blink=0){
    const choices=outfits(),look=getChoice(choices,who);
    if(pose==='eat'||pose==='tv'){
      drawHomeActor(ctx,{who,pose,frame:blink,x,y,outfits:choices,getCharacterImage:image,
        getRawImage:url=>api.assetImage?.(url),getPoseImage:url=>api.assetImage?.(url)});
      return;
    }
    const sheet=image(getSelectedLook(choices,who)?.sheet);if(!sheet)return;
    if(pose==='sleep')ctx.drawImage(sheet,32,0,32,24,x,y,32,24);
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
    const background=roomImage();
    if(background)ctx.drawImage(background,0,0,480,270);
    else{ctx.fillStyle='#CFAE8E';ctx.fillRect(0,0,480,270);ctx.fillStyle='#F4DEBD';ctx.fillRect(12,12,456,246);}
    const bouquet=getHomeDecoration(api.save.garden),bouquetImage=bouquet&&api.assetImage?.(bouquet.asset);
    if(bouquetImage){
      const box=bouquet.source;
      ctx.drawImage(bouquetImage,box.x,box.y,box.width,box.height,383,8,32,32);
    }
    canvas.dataset.flowerDecoration=bouquet?.id||'none';
    const still=preference.matches,blink=still?0:Math.floor(clock/1.8)%2;
    canvas.dataset.activity=home.activity;
    canvas.dataset.meal=home.activity==='eat'&&meal?meal.id:'';
    canvas.dataset.leoLook=getChoice(outfits(),'leo');canvas.dataset.itzaLook=getChoice(outfits(),'itza');
    canvas.dataset.itzaHair=getHairColor(outfits());canvas.dataset.itzaGlasses=String(getGlasses(outfits(),'itza'));
    canvas.dataset.motion=still?'reduced':'active';
    if(home.activity==='eat'){
      HOME_LAYOUT.table.people.forEach(([x,y],index)=>actor(index?'itza':'leo',x,y,'eat',blink));
      restoreFurniture(background,HOME_LAYOUT.table.foreground);
      const dishes=meal&&api.assetImage?.(manifest.cooking.foods);
      const mats=meal&&api.assetImage?.(manifest.home.diningMats);
      if(dishes&&mats)ctx.drawImage(mats,197,188);
      for(const [index,[x,y]] of HOME_LAYOUT.table.food.entries()){
        if(dishes&&mats){
          ctx.drawImage(dishes,meal.frame*32,0,32,32,x-13,y-16,26,26);
        }
        if(!still&&meal?.id!=='pastel'){
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
      if(!drawHomeVideoFrame(ctx,video,tv)){
        ctx.fillStyle='#334454';ctx.fillRect(tv.x,tv.y,tv.width,tv.height);
        ctx.fillStyle='#78939A';ctx.fillRect(tv.x+2,tv.y+2,tv.width-4,tv.height-4);
        ctx.fillStyle='#B8B597';ctx.fillRect(tv.x+2,tv.y+tv.height-10,tv.width-4,8);
        const sway=still?0:Math.floor(Math.sin(clock)*3);
        heart(tv.x+7+sway,tv.y+7,'#F6CED1');heart(tv.x+27-sway,tv.y+11,'#F7E0B6');
        ctx.fillStyle='#FFF1DC';ctx.fillRect(tv.x+7,tv.y+5,1,1);ctx.fillRect(tv.x+tv.width-7,tv.y+6,1,1);
      }
      HOME_LAYOUT.sofa.people.forEach(([x,y],index)=>{
        // The sofa opens toward the TV. Its rear backrest sits below the
        // actors and naturally occludes the knees, leaving complete heads.
        ctx.globalAlpha=.18;ctx.fillStyle='#4D302E';ctx.fillRect(x+5,y+44,23,2);ctx.globalAlpha=1;
        actor(index?'itza':'leo',x,y,'tv',blink);
      });
      restoreFurniture(background,HOME_LAYOUT.sofa.foreground);
      canvas.dataset.sofaFacing='tv';
    }
    if(api.getPonyoUnlocked?.()){
      const ponyo=api.getPonyoImage?.();
      if(ponyo)ctx.drawImage(ponyo,0,0,32,32,HOME_LAYOUT.ponyo.x,HOME_LAYOUT.ponyo.y,27,27);
    }
  }
  function describe(){
    const activity=activityOf(home.activity);
    const dinner=home.activity==='eat'&&meal;
    caption.textContent=dinner?`${meal.label} para dos`:activity.caption;
    reply.textContent='Leo: '+activity.line;
    canvas.setAttribute('aria-label',dinner?`Itza y Leo comparten ${meal.label.toLowerCase()} en la mesa.`:`Itza y Leo en su casita: ${activity.label.toLowerCase()}`);
    for(const [id,button] of buttons)button.setAttribute('aria-pressed',String(id===home.activity));
    keepsake.textContent=api.getPonyoUnlocked?.()?'Ponyo también tiene un rinconcito aquí.':'Nuestro lugar favorito siempre será juntos.';
    keepsake.dataset.ponyo=String(Boolean(api.getPonyoUnlocked?.()));
  }
  function select(id){
    if(!alive)return;
    if(id!=='tv'){player.setActive(false);expanded=false;}
    home=chooseHomeActivity(home,id);api.save.home=home;clock=0;
    player.setActive(id==='tv');
    api.onProgressChange?.();api.onLeoSay?.(activityOf(id).line);describe();syncVideo();draw();scheduleFrame();
  }
  function syncVideo(){
    if(!alive)return;
    tvControls.hidden=home.activity!=='tv';
    const available=player.available(),playing=player.isPlaying(),state=player.getState(),duration=player.duration();
    playVideo.disabled=muteVideo.disabled=expandVideo.disabled=!available;
    playVideo.textContent=playing?'Pausar video':'Reproducir video';playVideo.setAttribute('aria-label',playVideo.textContent);
    muteVideo.textContent=state.muted?'Activar sonido del video':'Silenciar video';muteVideo.setAttribute('aria-label',muteVideo.textContent);
    muteVideo.setAttribute('aria-pressed',String(state.muted));
    const statusText=!available?'Pronto veremos nuestro video aquí.':videoError||
      (playing?'Nuestra peli está en la tele.':'Tu video está listo. Pulsa Reproducir.');
    if(videoStatus.textContent!==statusText)videoStatus.textContent=statusText;
    videoProgress.disabled=!duration;videoProgress.value=duration?String(Math.round(state.position/duration*1000)):'0';
    videoVolume.disabled=!available;videoVolume.value=String(Math.round(state.volume*100));
    videoClock.textContent=homeVideoTime(state.position)+' / '+homeVideoTime(duration);
    videoPreview.hidden=!expanded;expandVideo.setAttribute('aria-expanded',String(expanded));
    expandVideo.textContent=expanded?'Ver solo en la tele':'Ver en grande';
    canvas.dataset.videoState=!available?'empty':videoError?'error':playing?'playing':'paused';
  }
  playVideo.addEventListener('click',async()=>{videoError='';if(player.isPlaying())player.pause();else await player.play();syncVideo();});
  muteVideo.addEventListener('click',()=>player.setMuted(!player.getState().muted));
  expandVideo.addEventListener('click',()=>{expanded=!expanded;syncVideo();});
  videoProgress.addEventListener('input',()=>player.seek(Number(videoProgress.value)/1000*player.duration()));
  videoVolume.addEventListener('input',()=>player.setVolume(Number(videoVolume.value)/100));
  function scheduleFrame(){
    if(!alive||frame||document.hidden||(preference.matches&&!player.isPlaying()))return;
    frame=requestAnimationFrame(tick);
  }
  function tick(time){
    frame=0;if(!alive)return;
    const elapsed=last?Math.min(.05,(time-last)/1000):0;last=time;
    if(!document.hidden){if(!preference.matches)clock+=elapsed;draw();}
    scheduleFrame();
  }
  function preferenceChanged(){
    cancelAnimationFrame(frame);frame=0;last=0;draw();
    scheduleFrame();
  }
  function visibilityChanged(){
    last=0;
    if(document.hidden){cancelAnimationFrame(frame);frame=0;player.suspend();}
    else{syncVideo();draw();scheduleFrame();}
  }
  preference.addEventListener('change',preferenceChanged);document.addEventListener('visibilitychange',visibilityChanged);
  player.setActive(home.activity==='tv');describe();syncVideo();draw();scheduleFrame();
  return ()=>{alive=false;cancelAnimationFrame(frame);player.dispose();preference.removeEventListener('change',preferenceChanged);document.removeEventListener('visibilitychange',visibilityChanged);};
}
