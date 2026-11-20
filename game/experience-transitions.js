// Scene entry fades directly on the live surface. Closing releases the scene
// immediately; no detached paper, cloned canvas or dark window remains behind.
export function createExperienceTransitions(panel,paper){
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let entryTimer=0;
  function reset(){
    clearTimeout(entryTimer);entryTimer=0;
    delete panel.dataset.transition;
  }
  function arrive(){
    reset();
    if(preference.matches||document.hidden)return;
    panel.dataset.transition='entering';
    entryTimer=setTimeout(()=>{delete panel.dataset.transition;entryTimer=0;},220);
  }
  function depart(bounds,onRest){
    reset();
    onRest();
  }
  document.addEventListener('oowwww-dialog-open',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  window.addEventListener('resize',reset);
  preference.addEventListener('change',reset);
  return {arrive,depart,reset};
}
