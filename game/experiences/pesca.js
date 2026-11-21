import {node,labeledButton} from './dom.js';
import {PLUSHIES,normalizeFishing,collectedPlushies,hasAllPlushies,selectPlushie,
  recordCast,recordCatch,FISHING_WAIT_MS,FISHING_BITE_MS} from '../fishing.js';
import {createFishingScene} from '../fishing-scene.js';
import './pesca.css';

export function mount(root,_data,api){
  api.save??={};
  let state=normalizeFishing(api.save.fishing),alive=true,phase='idle',caughtPlushie=null;
  let waitTimer=0,biteTimer=0,progressTimer=0,deadline=0;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell=node('section','fishing-game');shell.setAttribute('aria-label','Pesca de peluches de FNAF');
  const mission=node('section','fishing-mission'),missionTitle=node('h3','','Una colección para Ponyo');
  const missionText=node('p','','Consigue los cinco peluches para conocer a Ponyo.');
  const progress=node('progress','fishing-quest-progress');progress.max=PLUSHIES.length;
  progress.setAttribute('aria-label','Peluches distintos encontrados');
  const counter=node('span','fishing-quest-counter');
  const completion=node('p','fishing-completion','¡Los cinco están contigo! Ponyo ya te espera junto a los gatitos. Sal al mundo para conocer a Ponyo.');
  mission.append(missionTitle,missionText,progress,counter,completion);

  const stage=node('div','fishing-stage');
  const status=node('p','fishing-status','Lanza la caña. Cuando el flotador se hunda, pulsa «¡Sacar!».');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  const meter=node('div','fishing-meter');meter.setAttribute('role','progressbar');
  meter.setAttribute('aria-label','Tiempo para sacar el peluche');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');
  const meterFill=node('span','fishing-meter-fill');meter.append(meterFill);meter.hidden=true;
  const button=labeledButton('Lanzar la caña',()=>{
    if(phase==='bite')reel();else if(phase!=='waiting')cast();
  },'fishing-action');
  const guidance=node('p','fishing-guidance','Puedes usar un toque, Enter o la barra espaciadora sobre el botón. Cada nueva captura ayuda a completar tu colección.');
  const collection=node('section','fishing-collection');collection.setAttribute('aria-label','Colección de peluches');
  const collectionTitle=node('h3','','Nuestros peluches'),cards=node('div','fishing-plushies');
  const cardViews=PLUSHIES.map(plushie=>{
    const card=node('figure','fishing-plush'),image=node('img');card.dataset.plushId=plushie.id;image.src=plushie.image;image.width=64;image.height=64;image.alt='';
    const fallback=node('span','fishing-plush-placeholder','?');fallback.hidden=true;fallback.setAttribute('aria-hidden','true');
    image.addEventListener('error',()=>{image.hidden=true;fallback.hidden=false;});
    const label=node('figcaption'),name=node('strong','',plushie.name),detail=node('span','fishing-plush-detail');
    label.append(name,detail);card.append(image,fallback,label);cards.append(card);
    return {plushie,card,detail};
  });
  collection.append(collectionTitle,cards);shell.append(mission,stage,status,meter,button,guidance,collection);root.append(shell);
  const scene=createFishingScene({stage,api,preference});

  function clearRound(){
    clearTimeout(waitTimer);clearTimeout(biteTimer);clearInterval(progressTimer);
    waitTimer=0;biteTimer=0;progressTimer=0;
  }
  function save(){api.save.fishing=normalizeFishing(state);api.onProgressChange?.();}
  function render(){
    shell.dataset.phase=phase;shell.dataset.collected=String(collectedPlushies(state));
    shell.dataset.catches=String(state.catches);
    const count=collectedPlushies(state);progress.value=count;counter.textContent=count+' / '+PLUSHIES.length+' peluches';
    completion.hidden=!hasAllPlushies(state);
    for(const {plushie,card,detail} of cardViews){
      const count=state.collection[plushie.id]||0;card.dataset.found=String(count>0);
      card.setAttribute('aria-label',plushie.name+', '+(count?'encontrado, '+count+' '+(count===1?'peluche':'peluches'):'todavía no encontrado'));
      detail.textContent=count?plushie.rarity+' · ×'+count:'Por descubrir';
    }
    // Keep keyboard focus on the action while waiting. The handler ignores
    // waiting presses and ARIA announces its temporary unavailable state.
    button.setAttribute('aria-disabled',String(phase==='waiting'));
    button.textContent=phase==='waiting'?'Esperando el pique…':phase==='bite'?'¡Sacar!':phase==='idle'?'Lanzar la caña':'Lanzar otra vez';
    meter.hidden=phase!=='bite';
    scene.setState({phase,plushie:caughtPlushie});
  }
  function cast(){
    if(!alive||phase==='waiting'||phase==='bite')return;
    clearRound();caughtPlushie=null;state=recordCast(state);save();phase='waiting';
    api.onSfx?.('splash');
    status.textContent='La caña está en el agua… espera a que pique un peluche.';render();
    waitTimer=setTimeout(()=>{if(alive&&phase==='waiting')bite();},FISHING_WAIT_MS);
  }
  function updateMeter(){
    const fraction=preference.matches?1:Math.max(0,(deadline-performance.now())/FISHING_BITE_MS);
    meterFill.style.transform='scaleX('+fraction+')';meter.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
    meter.setAttribute('aria-valuetext',preference.matches?'Listo para sacar, sin límite de tiempo':'Pulsa Sacar antes de que se vacíe la barra');
  }
  function armWindow(){
    clearTimeout(biteTimer);clearInterval(progressTimer);biteTimer=0;progressTimer=0;
    deadline=performance.now()+FISHING_BITE_MS;updateMeter();
    if(!preference.matches){
      progressTimer=setInterval(updateMeter,80);biteTimer=setTimeout(miss,FISHING_BITE_MS);
    }
  }
  function bite(){
    phase='bite';status.textContent=preference.matches?'¡Un peluche ha picado! Pulsa «¡Sacar!» cuando quieras.':'¡Ha picado! Pulsa «¡Sacar!» antes de que se vacíe la barra.';
    render();armWindow();
  }
  function miss(){
    if(!alive||phase!=='bite')return;
    clearRound();phase='missed';status.textContent='Esta vez se escapó, pero tu colección sigue a salvo. ¡Prueba otra vez!';render();
  }
  function reel(){
    if(!alive||phase!=='bite')return;
    if(!preference.matches&&performance.now()>deadline){miss();return;}
    clearRound();phase='caught';
    api.onSfx?.('splash');api.onSfx?.('chime');
    const before=hasAllPlushies(state),plushie=selectPlushie(state);state=recordCatch(state,plushie.id);save();
    caughtPlushie=plushie;
    const complete=hasAllPlushies(state),newlyCompleted=!before&&complete;
    status.textContent='¡Encontraste a '+plushie.name+'! '+(newlyCompleted?'¡Colección completa! Ponyo ya está junto a los gatitos.':plushie.rarity+' · Se ha guardado en tu colección.');
    render();api.onFishingChange?.({complete,newlyCompleted,plushie});
    api.onLeoSay?.(newlyCompleted?'¡Los cinco peluches! Vamos a conocer a Ponyo.':'¡Mira, amor! Encontramos a '+plushie.name+'.');
  }
  function preferenceChanged(){
    if(alive&&phase==='bite'){
      status.textContent=preference.matches?'¡Un peluche ha picado! Pulsa «¡Sacar!» cuando quieras.':'¡Ha picado! Tienes una barra nueva para sacar el peluche.';
      armWindow();
    }
  }
  function visibilityChanged(){
    if(document.hidden&&['waiting','bite'].includes(phase)){
      clearRound();phase='idle';status.textContent='La caña te espera. Lanza de nuevo cuando vuelvas; tu colección está guardada.';render();
    }
  }
  preference.addEventListener('change',preferenceChanged);document.addEventListener('visibilitychange',visibilityChanged);
  render();
  return ()=>{
    alive=false;clearRound();scene.dispose();preference.removeEventListener('change',preferenceChanged);
    document.removeEventListener('visibilitychange',visibilityChanged);
  };
}
