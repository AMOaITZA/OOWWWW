import {node,picture,paragraph,labeledButton} from './dom.js';
export function mount(root,data){
  paragraph(root,data.text);
  const grid=node('div','memory-gallery'),viewer=node('div','gallery-viewer');
  viewer.hidden=true;viewer.setAttribute('role','group');viewer.setAttribute('aria-label','Fotografía ampliada');
  const larger=picture('','Fotografía');larger.loading='eager';const caption=paragraph(viewer,'');
  const dismiss=labeledButton('Cerrar foto',()=>{viewer.hidden=true;grid.hidden=false;});
  viewer.prepend(larger);viewer.append(dismiss);
  data.photos.forEach((photo,index)=>{
    const btn=labeledButton('','photo-tile');btn.setAttribute('aria-label','Ver fotografía '+(index+1));
    btn.append(picture(photo.src,photo.caption));
    const number=node('span','photo-number',String(index+1).padStart(2,'0'));btn.append(number);
    btn.addEventListener('click',()=>{larger.src=photo.src;larger.alt=photo.caption;caption.textContent=photo.caption;grid.hidden=true;viewer.hidden=false;dismiss.focus();});
    grid.append(btn);
  });root.append(grid,viewer);
  return ()=>{};
}
