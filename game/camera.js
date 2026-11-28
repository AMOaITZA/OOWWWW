import {node,labeledButton} from './experiences/dom.js';
import {getSelectedLook} from './wardrobe.js';
import {createPhotoStore,normalizeCamera,photoFilename} from './photo-store.js';
import './camera.css';

const ART='/assets/game/camera/canon-retro.svg';
const focusable='button:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]';
const readableDate=time=>new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(time);
const toBlob=canvas=>new Promise((resolve,reject)=>{try{canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No pudimos revelar esta foto. Intenta otra vez.')),'image/png');}catch(error){reject(error);}});

export function createCamera({save={},onChange,getScene=()=>null,onAlbum,getOutfits=()=>save.outfits||{},getCharacterImage,assetImage,store=createPhotoStore()}={}){
  let active=null,disposed=false;
  save.camera=normalizeCamera(save.camera);
  function close(){active?.release();active=null;}
  function open(sceneOverride){
    if(disposed)return false;
    close();const source=typeof sceneOverride==='function'?sceneOverride():sceneOverride||getScene();
    const scene=source?.canvas;
    if(!scene||!scene.width||!scene.height)return false;
    const container=source.container||scene.closest('#experience')||document.getElementById('game-screen')||document.body;
    const previousFocus=document.activeElement,overlay=node('section','retro-camera');overlay.tabIndex=-1;
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Cámara Canon digital retro');
    const header=node('header','retro-camera-header');
    const back=labeledButton('← Seguir jugando',close,'retro-camera-back');
    const brand=node('div','retro-camera-brand');brand.append(node('strong','','Canon'),node('span','','Digital · nuestros recuerdos'));
    header.append(back,brand);
    const finder=node('div','retro-camera-finder'),preview=node('canvas','retro-camera-preview');preview.setAttribute('role','img');preview.setAttribute('aria-label','Vista previa de '+(source.title||'nuestro mundo'));
    const framing=node('div','retro-camera-framing');framing.setAttribute('aria-hidden','true');
    const tag=node('span','retro-camera-location',source.title||'Nuestro mundo');
    const date=node('span','retro-camera-date',readableDate(Date.now()));
    finder.append(preview,framing,tag,date);
    const controls=node('footer','retro-camera-controls'),camera=node('img','retro-camera-body');camera.src=ART;camera.alt='Canon digital retro negra, con lente plateado y flash';camera.width=160;camera.height=104;
    const actions=node('div','retro-camera-actions'),poseLabel=node('label','retro-camera-pose','Encuadre'),pose=node('select');pose.setAttribute('aria-label','Pose para la foto');
    for(const [value,label]of [['natural','Tal como estamos'],['frente','Retrato juntos · frente'],['lado','Retrato juntos · de lado']]){const option=node('option','',label);option.value=value;pose.append(option);}poseLabel.append(pose);
    const shutter=labeledButton('Tomar foto',capture,'retro-camera-shutter');shutter.dataset.cameraShutter='';
    const album=labeledButton('Ver nuestro álbum',()=>{close();onAlbum?.();},'retro-camera-album');
    const message=node('p','retro-camera-status','Encuentra tu momento. La foto se guarda en este navegador.');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
    actions.append(poseLabel,shutter,album);controls.append(camera,actions,message);overlay.append(header,finder,controls);container.append(overlay);
    const inertStates=[...container.children].filter(child=>child!==overlay).map(child=>[child,child.inert]);for(const [child]of inertStates)child.inert=true;
    let alive=true,frame=0,busy=false,flashTimer=0,last=0;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const portraitBackdrop=document.createElement('canvas');
    function image(url){return getCharacterImage?.(url)||assetImage?.(url);}
    function renderPhoto(target,time=Date.now()){
      // Capture only the game's actual canvas. HUD and camera chrome are never in the PNG.
      const scale=Math.min(1,1280/scene.width,960/scene.height);
      target.width=Math.max(1,Math.round(scene.width*scale));target.height=Math.max(1,Math.round(scene.height*scale));
      const ctx=target.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(scene,0,0,target.width,target.height);
      if(pose.value!=='natural'){
        // A soft-focus portrait keeps the actual location as the backdrop.
        // The live, smaller couple blends into the background instead of
        // appearing as a second sharp pair beside the posed foreground.
        portraitBackdrop.width=48;portraitBackdrop.height=Math.max(1,Math.round(48*scene.height/scene.width));
        const backdrop=portraitBackdrop.getContext('2d');backdrop.imageSmoothingEnabled=true;backdrop.drawImage(scene,0,0,portraitBackdrop.width,portraitBackdrop.height);
        ctx.imageSmoothingEnabled=true;ctx.drawImage(portraitBackdrop,0,0,target.width,target.height);ctx.imageSmoothingEnabled=false;
        ctx.fillStyle='#24262f75';ctx.fillRect(0,0,target.width,target.height);
        const pixelScale=Math.max(1,Math.min(6,Math.floor(Math.min(target.width/100,target.height/78))));
        const x=Math.round(target.width/2-29*pixelScale),y=Math.round(target.height*.54-26*pixelScale);
        ctx.fillStyle='#473f3740';ctx.fillRect(x+6*pixelScale,y+45*pixelScale,51*pixelScale,3*pixelScale);
        ['leo','itza'].forEach((who,index)=>{
          const sheet=image(getSelectedLook(getOutfits(),who)?.sheet);if(!sheet)return;
          const row=pose.value==='lado'?1:0;
          ctx.drawImage(sheet,0,row*48,32,48,x+index*26*pixelScale,y,32*pixelScale,48*pixelScale);
        });
      }
      const h=Math.max(16,Math.round(target.height*.043)),font=Math.max(10,Math.round(h*.59));
      ctx.fillStyle='#1b2124b8';ctx.fillRect(0,target.height-h,target.width,h);
      ctx.font=font+'px monospace';ctx.textBaseline='middle';ctx.fillStyle='#f8e6b9';
      ctx.fillText('ITZA & LEO',Math.max(6,font*.7),target.height-h/2);
      ctx.textAlign='right';ctx.fillText(readableDate(time).toUpperCase(),target.width-Math.max(6,font*.7),target.height-h/2);ctx.textAlign='left';
      target.dataset.cameraPose=pose.value;
    }
    function draw(){if(!alive)return;renderPhoto(preview);}
    function tick(now){frame=0;if(!alive||document.hidden)return;if(now-last>70){draw();last=now;}frame=requestAnimationFrame(tick);}
    function schedule(){if(alive&&!frame&&!document.hidden&&!preference.matches)frame=requestAnimationFrame(tick);}
    function visibility(){cancelAnimationFrame(frame);frame=0;if(!document.hidden){draw();schedule();}}
    function changeMotion(){cancelAnimationFrame(frame);frame=0;draw();schedule();}
    async function capture(){
      if(!alive||busy)return;busy=true;shutter.disabled=true;message.textContent='Revelando nuestro recuerdo…';
      try{
        const snapshot=document.createElement('canvas'),createdAt=Date.now();renderPhoto(snapshot,createdAt);
        const blob=await toBlob(snapshot);if(!alive)return;
        const photo=await store.put({blob,title:source.title||'Nuestro mundo',pose:pose.value,createdAt,width:snapshot.width,height:snapshot.height});
        save.camera={shots:save.camera.shots+1,lastPhotoAt:createdAt};onChange?.(save.camera);if(!alive)return;
        overlay.dataset.lastPhoto=photo.id;overlay.dataset.storage=photo.durable?'persistent':'session';
        message.textContent=photo.durable?'Foto guardada en nuestro álbum. ♡':'Foto lista para esta sesión. Tu navegador no permite guardarla: descárgala desde el álbum antes de salir.';
        overlay.dataset.shutter='flash';clearTimeout(flashTimer);flashTimer=setTimeout(()=>delete overlay.dataset.shutter,180);
      }catch(error){if(alive)message.textContent=error?.message||'No pudimos guardar la foto. Intenta otra vez.';}
      finally{busy=false;if(alive)shutter.disabled=false;}
    }
    function keydown(event){
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return;}
      if(event.key!=='Tab')return;
      const items=[...overlay.querySelectorAll(focusable)].filter(item=>!item.hidden&&item.getClientRects().length),first=items[0],last=items.at(-1);
      if(event.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){event.preventDefault();event.stopImmediatePropagation();last?.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){event.preventDefault();event.stopImmediatePropagation();first?.focus();}
    }
    overlay.addEventListener('keydown',event=>event.stopPropagation());
    pose.addEventListener('change',draw);document.addEventListener('keydown',keydown,true);document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',changeMotion);
    active={sourceCanvas:scene,release(){alive=false;cancelAnimationFrame(frame);clearTimeout(flashTimer);document.removeEventListener('keydown',keydown,true);document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',changeMotion);overlay.remove();for(const [child,inert]of inertStates)child.inert=inert;if(previousFocus?.isConnected&&!previousFocus.closest('[inert],[hidden]'))previousFocus.focus({preventScroll:true});}};
    draw();schedule();shutter.focus({preventScroll:true});return true;
  }
  function attach(parent,{getScene:localScene}={}){
    const button=labeledButton('',()=>open(localScene||getScene),'camera-open-control');button.setAttribute('aria-label','Abrir cámara Canon');button.title='Cámara y álbum de recuerdos';
    const icon=node('img');icon.src=ART;icon.alt='';icon.width=40;icon.height=26;button.append(icon,node('span','','Cámara'));parent.append(button);
    return ()=>{button.remove();if(active&&parent.contains(active.sourceCanvas))close();};
  }
  async function downloadPhoto(id){
    const photo=await store.get(id);if(!photo)throw new Error('Esta foto ya no está en el álbum.');
    const url=URL.createObjectURL(photo.blob),anchor=document.createElement('a');anchor.href=url;anchor.download=photoFilename(photo);document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return {open,show:open,close,attach,mountControl:parent=>attach(parent),listPhotos:store.list,getPhoto:store.get,deletePhoto:store.remove,downloadPhoto,isOpen:()=>Boolean(active),dispose(){disposed=true;close();store.close();}};
}
