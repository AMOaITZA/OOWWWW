import {node,labeledButton} from './dom.js';
import './album.css';

const dateLabel=value=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric'}).format(value);
export function mount(root,_data,api){
  const camera=api.camera;
  const album=node('section','photo-album');album.setAttribute('aria-label','Álbum de nuestras fotos');
  const heading=node('header','photo-album-heading');
  const titles=node('div');titles.append(node('p','photo-album-eyebrow','Hechos de momentos'),node('h3','','Nuestro álbum digital'));
  const count=node('span','photo-album-count','Revelando recuerdos…');
  heading.append(titles,count);
  const message=node('p','photo-album-message','Las fotos se guardan en este navegador. También puedes descargarlas para conservarlas contigo.');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const empty=node('div','photo-album-empty');empty.hidden=true;
  const cameraArt=node('img');cameraArt.src='/assets/game/camera/canon-retro.svg';cameraArt.alt='Nuestra cámara Canon digital negra';cameraArt.width=160;cameraArt.height=104;
  empty.append(cameraArt,node('h4','','Nuestro primer recuerdo está por llegar'),node('p','','Lleva la Canon de paseo. Abre Cámara en el mundo o en una actividad, elige el encuadre y toma una foto.'));
  const grid=node('div','photo-album-grid'),viewer=node('section','photo-album-viewer');viewer.hidden=true;viewer.setAttribute('aria-label','Foto ampliada');
  const toolbar=node('div','photo-album-toolbar');
  const back=labeledButton('← Todas las fotos',hideViewer,'photo-album-back');
  const controls=node('div','photo-album-viewer-actions');
  const download=labeledButton('Descargar PNG',downloadCurrent,'photo-album-download');
  const remove=labeledButton('Eliminar esta foto',deleteCurrent,'photo-album-delete');
  controls.append(download,remove);toolbar.append(back,controls);
  const figure=node('figure','photo-album-photo'),large=node('img','photo-album-large'),caption=node('figcaption','photo-album-caption');large.alt='';figure.append(large,caption);
  const navigation=node('div','photo-album-navigation'),position=node('span');
  const previous=labeledButton('← Anterior',()=>showPhoto(selected-1),'photo-album-previous'),next=labeledButton('Siguiente →',()=>showPhoto(selected+1),'photo-album-next');navigation.append(previous,position,next);
  viewer.append(toolbar,figure,navigation);album.append(heading,message,empty,grid,viewer);root.append(album);
  let alive=true,photos=[],selected=0,previousCard=null,loading=0;
  const urls=new Map(),cards=new Map();
  async function imageUrl(id){
    if(urls.has(id))return urls.get(id);
    const photo=await camera.getPhoto(id);if(!alive||!photo)return null;
    const url=URL.createObjectURL(photo.blob);urls.set(id,url);return url;
  }
  async function refresh(){
    if(!camera){count.textContent='Cámara no disponible';message.textContent='Vuelve al mundo para abrir la cámara.';empty.hidden=false;return;}
    const token=++loading;
    try{
      const result=await camera.listPhotos();if(!alive||token!==loading)return;photos=result;grid.replaceChildren();cards.clear();
      count.textContent=photos.length+' / 60 recuerdos';empty.hidden=Boolean(photos.length);
      if(photos.some(photo=>!photo.durable))message.textContent='Algunas fotos solo están disponibles durante esta sesión. Descárgalas antes de salir de este navegador.';
      for(const [index,photo]of photos.entries()){
        const button=labeledButton('',()=>{previousCard=button;showPhoto(index);},'photo-album-card');button.dataset.photoId=photo.id;
        button.setAttribute('aria-label','Ver foto '+(index+1)+' de '+photo.title);
        const frame=node('span','photo-album-print'),image=node('img');image.alt='';image.loading='lazy';image.decoding='async';frame.append(image);
        const label=node('span','photo-album-label');label.append(node('strong','',photo.title),node('span','',dateLabel(photo.createdAt)));
        if(!photo.durable)label.append(node('em','','Solo esta sesión'));
        button.append(frame,label);grid.append(button);cards.set(photo.id,button);
        imageUrl(photo.id).then(url=>{if(alive&&button.isConnected&&url)image.src=url;});
      }
    }catch(error){if(alive){count.textContent='No pudimos abrir el álbum';message.textContent=error.message||'Inténtalo de nuevo al volver al mundo.';}}
  }
  async function showPhoto(index){
    if(!alive||!photos.length)return;
    selected=Math.max(0,Math.min(photos.length-1,index));const photo=photos[selected];
    const token=photo.id,url=await imageUrl(photo.id);if(!alive||photos[selected]?.id!==token)return;
    if(!url){message.textContent='Esta foto no está disponible. Vuelve a abrir el álbum.';return;}
    large.src=url;large.alt='Itza y Leo: '+photo.title;
    caption.textContent=photo.title+' · '+dateLabel(photo.createdAt)+(photo.pose==='natural'?'':' · Retrato juntos');
    viewer.dataset.photoId=photo.id;
    position.textContent=(selected+1)+' / '+photos.length;previous.disabled=selected===0;next.disabled=selected===photos.length-1;
    grid.hidden=true;empty.hidden=true;viewer.hidden=false;back.focus({preventScroll:true});
  }
  function hideViewer(){viewer.hidden=true;grid.hidden=false;empty.hidden=Boolean(photos.length);large.removeAttribute('src');previousCard?.focus({preventScroll:true});}
  async function downloadCurrent(){
    const photo=photos[selected];if(!photo)return;
    try{await camera.downloadPhoto(photo.id);if(alive)message.textContent='Tu recuerdo está listo para descargar. ♡';}
    catch(error){if(alive)message.textContent=error.message||'No pudimos descargar esta foto.';}
  }
  async function deleteCurrent(){
    const photo=photos[selected];if(!photo||remove.disabled)return;
    remove.disabled=download.disabled=true;
    try{
      await camera.deletePhoto(photo.id);if(!alive)return;
      const url=urls.get(photo.id);if(url){URL.revokeObjectURL(url);urls.delete(photo.id);}
      hideViewer();await refresh();if(!alive)return;message.textContent='Foto eliminada de este álbum.';[...cards.values()][0]?.focus({preventScroll:true});
    }catch(error){if(alive)message.textContent=error.message||'No pudimos eliminar esta foto.';}
    finally{if(alive)remove.disabled=download.disabled=false;}
  }
  function keydown(event){
    if(viewer.hidden)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();hideViewer();}
    else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();event.stopPropagation();showPhoto(selected+(event.key==='ArrowRight'?1:-1));}
  }
  root.addEventListener('keydown',keydown,true);refresh();
  return ()=>{alive=false;loading++;root.removeEventListener('keydown',keydown,true);large.removeAttribute('src');for(const urlof of urls.values())URL.revokeObjectURL(urlof);urls.clear();};
}
