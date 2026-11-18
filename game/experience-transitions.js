// Visual transitions never own the dialog lifecycle. Closing releases focus,
// audio and movement immediately; only the inert paper remains for a short fade.
export function createExperienceTransitions(panel,paper){
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let exit=null,entryTimer=0;
  function reset(){
    clearTimeout(entryTimer);entryTimer=0;
    delete panel.dataset.transition;
    if(!exit)return;
    const current=exit;exit=null;
    clearTimeout(current.timer);
    panel.append(paper);
    paper.style.width=current.width;paper.style.height=current.height;
    paper.style.maxHeight=current.maxHeight;
    current.layer.remove();
    current.onRest();
  }
  function arrive(){
    reset();
    if(preference.matches||document.hidden)return;
    panel.dataset.transition='entering';
    entryTimer=setTimeout(()=>{delete panel.dataset.transition;entryTimer=0;},280);
  }
  function depart(bounds,onRest){
    reset();
    if(preference.matches||document.hidden||!bounds.width||!bounds.height){onRest();return;}
    const layer=document.createElement('div');
    layer.className='experience experience-departure';
    layer.setAttribute('aria-hidden','true');layer.inert=true;
    const current={layer,onRest,width:paper.style.width,height:paper.style.height,
      maxHeight:paper.style.maxHeight,timer:0};
    exit=current;
    paper.style.width=bounds.width+'px';paper.style.height=bounds.height+'px';
    paper.style.maxHeight=bounds.height+'px';
    layer.append(paper);panel.parentElement.append(layer);
    current.timer=setTimeout(reset,180);
  }
  document.addEventListener('oowwww-dialog-open',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  window.addEventListener('resize',reset);
  preference.addEventListener('change',reset);
  return {arrive,depart,reset};
}
