export const PHASE_DURATION=5*60*1000;
export const LIGHTING_MODES=Object.freeze(['day','night','auto']);

export function normalizeLightingState(saved,now=Date.now()){
  const mode=LIGHTING_MODES.includes(saved?.mode)?saved.mode:'auto';
  const epoch=saved?.cycleStartedAt;
  return {mode,cycleStartedAt:typeof epoch==='number'&&Number.isFinite(epoch)&&epoch>=0&&epoch<=now?epoch:now};
}

// Wall-clock time keeps the five-minute phases correct when a tab is hidden,
// the game is paused behind a dialog, or an existing save is opened again.
export function createDayNightClock({saved,now=Date.now,onChange=()=>{}}={}){
  let state=normalizeLightingState(saved,now());
  function getState(){return {...state};}
  function sample(){
    const elapsed=Math.max(0,now()-state.cycleStartedAt);
    const phase=state.mode==='auto'
      ? Math.floor(elapsed/PHASE_DURATION)%2===0?'day':'night'
      :state.mode;
    return {mode:state.mode,phase,
      remaining:state.mode==='auto'?PHASE_DURATION-elapsed%PHASE_DURATION:null};
  }
  function setMode(mode){
    if(!LIGHTING_MODES.includes(mode)||state.mode===mode)return false;
    state={mode,cycleStartedAt:mode==='auto'?now():state.cycleStartedAt};
    onChange(getState());return true;
  }
  return {getState,sample,setMode};
}

export function createDayNight({saved,now=Date.now,onChange=()=>{},
  reducedMotion=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false}={}){
  let controls=null,status=null,buttons=[],lastPhase=null,lastRenderAt=now();
  const clock=createDayNightClock({saved,now,onChange:state=>{refresh();onChange(state);}});
  let nightAmount=clock.sample().phase==='night'?1:0;
  function refresh(){
    const current=clock.sample();
    if(controls){
      controls.dataset.mode=current.mode;
      for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.mode===current.mode));
      const text=(current.phase==='night'?'Noche':'Día')+' · '+(current.mode==='auto'?'automático':'manual');
      if(status.textContent!==text)status.textContent=text;
    }
    lastPhase=current.phase;return current;
  }
  function mount(header){
    if(!header||controls)return controls;
    header.classList.add('has-day-night-controls');
    controls=document.createElement('div');controls.id='day-night-controls';controls.className='day-night-controls';
    const label=document.createElement('div');label.className='day-night-label';
    status=document.createElement('span');status.id='day-night-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const hint=document.createElement('small');hint.textContent='5 min por fase en automático';
    label.append(status,hint);
    const group=document.createElement('div');group.className='day-night-buttons';
    group.setAttribute('role','group');group.setAttribute('aria-label','Hora del mundo');
    buttons=[['day','Día'],['night','Noche'],['auto','Automático']].map(([mode,text])=>{
      const button=document.createElement('button');button.type='button';button.id='day-night-'+mode;
      button.className='day-night-button';button.dataset.mode=mode;button.textContent=text;
      button.title=mode==='auto'?'Empezar de día y alternar cada cinco minutos':mode==='day'?'Mantener el mundo de día':'Mantener el mundo de noche';
      button.addEventListener('click',()=>clock.setMode(mode));group.append(button);return button;
    });
    controls.append(label,group);header.append(controls);refresh();return controls;
  }
  function draw(ctx,{camera={x:0,y:0},decor=[]}={}){
    const at=now(),current=clock.sample(),reduced=reducedMotion();
    if(current.phase!==lastPhase)refresh();
    const target=current.phase==='night'?1:0;
    const elapsed=Math.max(0,at-lastRenderAt);lastRenderAt=at;
    nightAmount=reduced?target:nightAmount+(target-nightAmount)*(1-Math.exp(-elapsed/320));
    if(Math.abs(nightAmount-target)<.001)nightAmount=target;
    if(ctx.canvas?.dataset){
      ctx.canvas.dataset.dayPhase=current.phase;ctx.canvas.dataset.lightingMode=current.mode;
      ctx.canvas.dataset.nightAmount=nightAmount.toFixed(3);
    }
    if(nightAmount<=0)return;
    const width=ctx.canvas.width,height=ctx.canvas.height;
    ctx.save();
    const dusk=ctx.createLinearGradient(0,0,0,height);
    dusk.addColorStop(0,`rgba(15,24,65,${.48*nightAmount})`);
    dusk.addColorStop(1,`rgba(21,34,84,${.42*nightAmount})`);
    ctx.fillStyle=dusk;ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation='screen';
    for(const lamp of decor.filter(item=>item.kind==='lamp')){
      const x=lamp.tile[0]*16-1-camera.x,y=lamp.tile[1]*16-54-camera.y;
      if(x<-36||x>width+36||y<-36||y>height+36)continue;
      const halo=ctx.createRadialGradient(x,y,1,x,y,31);
      halo.addColorStop(0,`rgba(255,224,157,${.46*nightAmount})`);
      halo.addColorStop(.35,`rgba(240,194,124,${.19*nightAmount})`);
      halo.addColorStop(1,'rgba(231,170,104,0)');
      ctx.fillStyle=halo;ctx.fillRect(x-31,y-31,62,62);
      ctx.fillStyle=`rgba(255,239,186,${.82*nightAmount})`;ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);
    }
    // Quiet fireflies are anchored to the meadow instead of the camera.
    for(let i=0;i<36;i++){
      const x=40+(i*487)%1830-camera.x,y=90+(i*229)%1090-camera.y;
      if(x<0||x>width||y<0||y>height)continue;
      const glow=reduced ? .52 : .34+.23*Math.sin(at/1400+i*2.1);
      ctx.fillStyle=`rgba(245,237,171,${glow*nightAmount})`;ctx.fillRect(Math.round(x),Math.round(y),2,1);
    }
    ctx.restore();
  }
  return {getState:clock.getState,sample:clock.sample,setMode:clock.setMode,mount,draw};
}
