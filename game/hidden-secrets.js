export const SECRETS=Object.freeze([
  {id:'cofre-cerezo',kind:'hidden-secret',name:'El cofre del cerezo',title:'Un lugar para descansar',
    tile:[39,34],arrival:[39,36],art:'chest',reward:'Un corazón de calma',
    message:'Si un día el mundo hace mucho ruido, acuérdate de que conmigo siempre puedes descansar.'},
  {id:'cofre-luna',kind:'hidden-secret',name:'El cofre de la luna',title:'Lo que le pediría a una estrella',
    tile:[108,68],arrival:[108,71],art:'chest',reward:'Una estrella para los dos',
    message:'No hace falta pedirle nada a una estrella: ya me pasó lo más bonito al encontrarte.'},
  {id:'carta-bosque',kind:'hidden-secret',name:'La carta del bosque',title:'Te elegiría aquí también',
    tile:[55,72],arrival:[55,74],art:'note',reward:'Una cartita para guardar',
    message:'Te elegiría también en este rincón del mundo, en un día sencillo y sin ningún motivo especial.'}
].map(secret=>Object.freeze({...secret,hidden:true,tile:Object.freeze(secret.tile),arrival:Object.freeze(secret.arrival)})));

export function normalizeHiddenSecrets(saved){
  const input=new Set(Array.isArray(saved?.found)?saved.found:[]);
  return {found:SECRETS.filter(secret=>input.has(secret.id)).map(secret=>secret.id)};
}
export function discoverSecret(saved,id){
  const state=normalizeHiddenSecrets(saved),secret=SECRETS.find(item=>item.id===id);
  if(!secret)return {state,secret:null,isNew:false};
  const isNew=!state.found.includes(id);
  if(isNew)state.found.push(id);
  return {state:normalizeHiddenSecrets(state),secret,isNew};
}

export function createHiddenSecrets({save,getImage=()=>null,onDiscover=()=>{}}){
  let state=normalizeHiddenSecrets(save.hiddenSecrets),current=null;
  save.hiddenSecrets=state;
  const bounds=secret=>({x:secret.tile[0]*16-16,y:secret.tile[1]*16-29,width:32,height:32});
  function hit(x,y){
    return SECRETS.find(secret=>{const box=bounds(secret);return x>=box.x&&x<=box.x+box.width&&y>=box.y&&y<=box.y+box.height;})??null;
  }
  function closest(x,y,maxDistance=4){
    return SECRETS.map(secret=>({secret,distance:Math.hypot(x-secret.arrival[0],y-secret.arrival[1])}))
      .filter(item=>item.distance<=maxDistance).sort((a,b)=>a.distance-b.distance)[0]?.secret??null;
  }
  function arrive(spot){
    const result=discoverSecret(state,typeof spot==='string'?spot:spot?.id);
    if(!result.secret)return false;
    state=result.state;current=result.secret;save.hiddenSecrets=state;
    onDiscover({secret:current,isNew:result.isNew,found:state.found.length,total:SECRETS.length});
    return true;
  }
  function scenery(){
    return SECRETS.map(secret=>({z:secret.tile[1]*16+1,draw(ctx){
      const image=getImage(secret.art);if(!image)return;
      const found=state.found.includes(secret.id),box=bounds(secret);
      if(secret.art==='chest')ctx.drawImage(image,found?32:0,0,32,32,box.x,box.y,32,32);
      else ctx.drawImage(image,box.x,box.y,32,32);
      // A tiny static glint makes a hidden object discoverable without a label.
      if(!found){ctx.fillStyle='#F5E3B5';ctx.fillRect(box.x+25,box.y+7,3,1);ctx.fillRect(box.x+26,box.y+6,1,3);}
    }}));
  }
  return {hit,closest,arrive,scenery,isSpot:spot=>SECRETS.some(secret=>secret.id===spot?.id),
    getCurrent:()=>current,getVisibleSpots:()=>SECRETS.filter(secret=>state.found.includes(secret.id)),
    getState:()=>({found:[...state.found]})};
}

// One brief, quiet meteor every 45 seconds. The shared world clock pauses it
// with dialogs and hidden tabs; the effect owns no timer or animation loop.
export function drawShootingStars(ctx,{time=0,night=false,reducedMotion=false}={}){
  if(!night||reducedMotion)return 0;
  const phase=Math.max(0,time)%45;
  if(phase<6||phase>=7.6)return 0;
  const progress=(phase-6)/1.6,width=ctx.canvas.width,height=ctx.canvas.height;
  const x=Math.round(width*.08+progress*Math.min(120,width*.22));
  const y=Math.round(Math.max(28,Math.min(60,height*.2))+progress*Math.min(25,height*.12));
  ctx.save();
  const opacity=Math.sin(progress*Math.PI)*.68;
  for(let segment=5;segment>=1;segment--){
    ctx.globalAlpha=opacity*(1-segment/7);ctx.fillStyle='#EED7AD';
    ctx.fillRect(x-segment*3,y-segment,3,1);
  }
  ctx.globalAlpha=opacity;ctx.fillStyle='#FFF1DC';ctx.fillRect(x,y,2,1);
  ctx.restore();return 1;
}
