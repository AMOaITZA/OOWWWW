import {node,picture,paragraph,labeledButton} from './dom.js';
import './memories-v7.css';
export function mount(root,data){
  const album=node('section','memory-album');
  paragraph(album,data.text,'album-introduction');
  const indexLabel=node('div','album-index');
  indexLabel.append(node('span','','Nuestro álbum'),node('span','',String(data.photos.length).padStart(2,'0')+' recuerdos'));
  const grid=node('div','memory-gallery'),viewer=node('div','gallery-viewer');
  viewer.hidden=true;viewer.setAttribute('role','group');viewer.setAttribute('aria-label','Fotografía ampliada');
  const larger=node('img','album-large-photo');larger.alt='Fotografía';larger.decoding='async';
  const stage=node('figure','gallery-photo-stage');
  const caption=node('figcaption','gallery-caption');
  caption.setAttribute('aria-live','polite');stage.append(larger,caption);
  const toolbar=node('div','gallery-viewer-toolbar'),position=node('span','gallery-position');
  const previous=labeledButton('←',()=>showPhoto(selected-1),'album-step');previous.setAttribute('aria-label','Foto anterior');
  const next=labeledButton('→',()=>showPhoto(selected+1),'album-step');next.setAttribute('aria-label','Foto siguiente');
  const dismiss=labeledButton('Cerrar foto',()=>{
    viewer.hidden=true;grid.hidden=false;indexLabel.hidden=false;
    buttons[selected]?.focus({preventScroll:true});buttons[selected]?.scrollIntoView({block:'nearest'});
  },'album-return');
  dismiss.setAttribute('aria-label','Cerrar foto');
  const navigation=node('div','gallery-viewer-navigation');navigation.append(previous,position,next);
  toolbar.append(dismiss,navigation);viewer.append(toolbar,stage);
  const buttons=[];let selected=0;
  function showPhoto(index){
    selected=Math.max(0,Math.min(data.photos.length-1,index));
    const photo=data.photos[selected];
    larger.src=photo.src;larger.alt=photo.caption;caption.textContent=photo.caption;
    position.textContent=String(selected+1).padStart(2,'0')+' / '+String(data.photos.length).padStart(2,'0');
    previous.disabled=selected===0;next.disabled=selected===data.photos.length-1;
  }
  data.photos.forEach((photo,index)=>{
    const btn=labeledButton('',()=>{
      showPhoto(index);grid.hidden=true;indexLabel.hidden=true;viewer.hidden=false;
      viewer.scrollIntoView({block:'start'});dismiss.focus({preventScroll:true});
    },'photo-tile');
    btn.setAttribute('aria-label','Ver fotografía '+(index+1));
    const photoFrame=node('span','album-thumbnail');photoFrame.append(picture(photo.src,photo.caption));
    const label=node('span','album-photo-label');
    label.append(node('span','photo-number',String(index+1).padStart(2,'0')),node('span','photo-note',photo.caption));
    btn.append(photoFrame,label);grid.append(btn);buttons.push(btn);
  });
  album.append(indexLabel,grid,viewer);root.append(album);
  function navigate(event){
    if(viewer.hidden||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();showPhoto(selected+(event.key==='ArrowRight'?1:-1));
  }
  root.addEventListener('keydown',navigate);
  return ()=>{root.removeEventListener('keydown',navigate);larger.removeAttribute('src');};
}
