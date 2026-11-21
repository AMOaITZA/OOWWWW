// One modal at a time. Audio remains mounted while its controls are minimized.
let activeDialog=null;
const focusable='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
const visible=element=>element?.isConnected&&!element.closest('[hidden],[inert]')&&element.getClientRects().length>0;

export function activateDialog(panel,{onClose,initialFocus,fallbackFocus}={}){
  activeDialog?.close();
  const previousFocus=document.activeElement;
  const dock=document.getElementById('music-dock');
  const musicButton=document.getElementById('music-button');
  const restoreDock=dock&&!dock.hidden;
  if(restoreDock){dock.hidden=true;musicButton?.setAttribute('aria-expanded','false');}
  const siblings=[...panel.parentElement.children].filter(element=>element!==panel);
  const inertState=siblings.map(element=>[element,element.inert]);
  for(const [element] of inertState)element.inert=true;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  panel.hidden=false;
  panel.scrollTop=0;
  panel.querySelector('.experience-panel,.map-paper')?.scrollTo(0,0);
  document.dispatchEvent(new Event('oowwww-dialog-open'));
  const controls=()=>[...panel.querySelectorAll(focusable)].filter(visible);
  function focusFirst(){(visible(initialFocus)?initialFocus:controls()[0]||panel).focus({preventScroll:true});}
  function keydown(event){
    if(event.key==='Escape'){
      event.preventDefault();event.stopPropagation();onClose?.();return;
    }
    if(event.key!=='Tab')return;
    const items=controls(),first=items[0],last=items.at(-1);
    if(!items.length){event.preventDefault();panel.focus();return;}
    if(event.shiftKey&&(!panel.contains(document.activeElement)||document.activeElement===first)){
      event.preventDefault();last.focus();
    }else if(!event.shiftKey&&(!panel.contains(document.activeElement)||document.activeElement===last)){
      event.preventDefault();first.focus();
    }
  }
  function containFocus(event){if(!panel.contains(event.target))focusFirst();}
  document.addEventListener('keydown',keydown);
  document.addEventListener('focusin',containFocus);
  const dialog={close:onClose};activeDialog=dialog;
  focusFirst();
  return ()=>{
    document.removeEventListener('keydown',keydown);
    document.removeEventListener('focusin',containFocus);
    if(activeDialog===dialog)activeDialog=null;
    panel.hidden=true;
    for(const [element,inert] of inertState)element.inert=inert;
    document.body.style.overflow=previousOverflow;
    if(restoreDock||dock?.dataset.reopenAfterDialog==='true'){
      dock.hidden=false;delete dock.dataset.reopenAfterDialog;
      musicButton?.setAttribute('aria-expanded','true');
    }
    const target=visible(previousFocus)?previousFocus:fallbackFocus;
    if(visible(target))target.focus({preventScroll:true});
  };
}
