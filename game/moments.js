import {TILE} from './world.js';
import {placeDialogue} from './dialogue-position.js';

// Tamaños de dibujo (no alteran el tamaño original de los archivos PNG).
const CAT_DRAW_W=40;
const CAT_DRAW_H=32;
const SIT_FRAME_W=64;
const SIT_FRAME_H=48;
const SIT_DRAW_W=64;
const SIT_DRAW_H=48;

export const LEO_LINES=[
  'te amo mil ocho mil',
  'owww qué bonitaaa',
  'tus pecas son muyy lindas',
  'tus ojitos me enamoran',
  'graciaas por amarmee tanto',
  'te amo como el mar abraza la orilla una y otra vez sin cansarse jamás',
  'amor, me encanta decirte amor',
  'qué bonito es estar contigo',
  'me haces sentir en casa',
  'quiero seguir viendo el mundo contigo',
  'me enamoras todos los días',
  'contigo todo se siente más lindo'
];

const pick=items=>items[Math.floor(Math.random()*items.length)];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

// Selección por la ilustración, no por la celda de colisión.
export function momentAt(spots,x,y){
  return spots.find(spot=>{
    const sx=spot.tile[0]*TILE,sy=spot.tile[1]*TILE;
    return spot.kind==='cats'
      ? Math.abs(x-sx)<CAT_DRAW_W/2+4&&y>=sy-CAT_DRAW_H-4&&y<=sy+10
      : Math.abs(x-sx)<39&&y>=sy-54&&y<=sy+12;
  })??null;
}
export function closestMoment(spots,x,y,maxDistance=4){
  return spots.reduce((best,spot)=>{
    const d=distance([x,y],spot.arrival);
    return d<=maxDistance&&(!best||d<best.d)?{spot,d}:best;
  },null)?.spot??null;
}

export function createMoments({spots,pair,getImage,bubble}){
  const cats=spots.find(spot=>spot.kind==='cats');
  let sitting=null,seatTransition=null,petRemaining=0,phraseRemaining=0;
  const seatPoint=spot=>({x:spot.tile[0],y:spot.tile[1]+.25});
  const smooth=t=>t*t*(3-2*t);
  function renderPair(){
    if(!seatTransition)return sitting?{...pair,...seatPoint(sitting),moving:false,direction:'down'}:pair;
    const t=smooth(Math.min(1,seatTransition.elapsed/.38));
    const to=seatTransition.rising?pair:seatPoint(seatTransition.spot);
    return {...pair,x:seatTransition.from.x+(to.x-seatTransition.from.x)*t,
      y:seatTransition.from.y+(to.y-seatTransition.from.y)*t,
      moving:true,walkClock:seatTransition.elapsed,direction:seatTransition.rising?'down':'up'};
  }
  let nextPhrase=12+Math.random()*12;
  let lastPhrase=-1;
  function say(line){
    bubble.textContent='Leo: '+line;
    bubble.hidden=false;
    phraseRemaining=line.length>65?9:6;
  }
  function randomLine(){
    const choices=LEO_LINES.map((line,i)=>({line,i})).filter(({i})=>i!==lastPhrase);
    const chosen=pick(choices);
    lastPhrase=chosen.i;
    return chosen.line;
  }
  function isMoment(spot){return spots.some(item=>item.id===spot?.id);}
  function stand(){
    if(!sitting)return;
    const from=renderPair();
    seatTransition={spot:sitting,from:{x:from.x,y:from.y},elapsed:0,rising:true};
    sitting=null;
  }
  function arrive(spot){
    if(!isMoment(spot))return false;
    if(spot.kind==='cats'){
      stand();
      petRemaining=2.8;
      pair.direction='up';
      say(pick(['owww qué bonitaaa','miralooos, les encantan las caricias','qué bonitos están juntos']));
    }else if(sitting?.id===spot.id){
      stand();
      say('vamos a seguir caminando');
    }else{
      const from=renderPair();
      sitting=spot;
      seatTransition={spot,from:{x:from.x,y:from.y},elapsed:0,rising:false};
      pair.direction='down';
      say(randomLine());
    }
    nextPhrase=24+Math.random()*22;
    return true;
  }
  function isSitting(){return sitting!==null;}
  function seatId(){return sitting?.id??null;}
  function shouldHidePair(){return sitting!==null&&!seatTransition&&Boolean(getImage('pairBenchSit'));}
  function tick(dt,{active=true,dialogsOpen=false}={}){
    if(!active || dialogsOpen){
      bubble.hidden=true;
      return;
    }
    if(seatTransition){
      seatTransition.elapsed+=dt;
      if(seatTransition.elapsed>=.38)seatTransition=null;
    }
    petRemaining=Math.max(0,petRemaining-dt);
    phraseRemaining=Math.max(0,phraseRemaining-dt);
    bubble.hidden=phraseRemaining<=0;
    nextPhrase-=dt;
    if(nextPhrase<=0){
      say(randomLine());
      nextPhrase=24+Math.random()*22;
    }
  }
  function positionBubble(camera,canvas){
    if(bubble.hidden)return;
    const rect=canvas.getBoundingClientRect();
    bubble.style.maxWidth=Math.min(innerWidth<=560?186:246,Math.max(80,rect.width-16))+'px';
    const sx=rect.width/canvas.width,sy=rect.height/canvas.height;
    const toScreen=(x,y)=>({x:rect.left+(x-camera.x)*sx,y:rect.top+(y-camera.y)*sy});
    const box=(id,x,y,w,h)=>{
      const p=toScreen(x,y);
      return {id,x:p.x,y:p.y,width:w*sx,height:h*sy};
    };
    const displayed=renderPair();
    const seated=sitting&&!seatTransition;
    const hero=seated
      ?box('pair',sitting.tile[0]*TILE-SIT_DRAW_W/2,
        sitting.tile[1]*TILE-SIT_DRAW_H+1,SIT_DRAW_W,SIT_DRAW_H)
      :box('pair',displayed.x*TILE-32,displayed.y*TILE-47,64,50);
    const leoX=seated?sitting.tile[0]*TILE-17:
      displayed.x*TILE+(displayed.direction==='right'?13:-16);
    const leoY=seated?sitting.tile[1]*TILE-SIT_DRAW_H+12:
      displayed.y*TILE-39;
    const anchor=toScreen(leoX,leoY);
    const obstacles=[hero];
    if(cats)obstacles.push(box('cats',cats.tile[0]*TILE-CAT_DRAW_W/2,
      cats.tile[1]*TILE-CAT_DRAW_H,CAT_DRAW_W,CAT_DRAW_H));
    for(const spot of spots){
      if(spot.kind==='bench')obstacles.push(box(spot.id,
        spot.tile[0]*TILE-28,spot.tile[1]*TILE-39,56,40));
    }
    const status=document.getElementById('world-status');
    if(status&&!status.hidden){
      const r=status.getBoundingClientRect();
      obstacles.push({id:'status',x:r.left,y:r.top,width:r.width,height:r.height});
    }
    const placement=placeDialogue({
      anchor,
      bubble:{width:bubble.offsetWidth,height:bubble.offsetHeight},
      viewport:{x:rect.left,y:rect.top,width:rect.width,height:rect.height},
      obstacles
    });
    bubble.style.left=placement.x+'px';
    bubble.style.top=placement.y+'px';
    bubble.style.setProperty('--tail-x',placement.tailX+'px');
    bubble.style.setProperty('--tail-y',placement.tailY+'px');
    bubble.dataset.tail=placement.tail;
  }
  function scenery(){
    const result=[];
    if(cats){
      result.push({z:cats.tile[1]*TILE+1,draw(ctx){
        const x=cats.tile[0]*TILE,y=cats.tile[1]*TILE;
        const sprite=getImage(petRemaining>0&&petRemaining<2.5?'catHappy':'catIdle');
        if(sprite)ctx.drawImage(sprite,x-CAT_DRAW_W/2,y-CAT_DRAW_H,CAT_DRAW_W,CAT_DRAW_H);
        else{
          ctx.fillStyle='#8B8584';ctx.fillRect(x-18,y-26,36,25);
          ctx.fillStyle='#FFF1DC';ctx.fillRect(x-16,y-23,14,18);
        }
        if(petRemaining>0&&petRemaining<2.5){
          const fx=getImage('petSparkles');
          if(fx){
            const frame=Math.floor((2.5-petRemaining)/.22)%4;
            ctx.drawImage(fx,frame*16,0,16,16,x-8,y-CAT_DRAW_H-18,16,16);
            ctx.drawImage(fx,((frame+2)%4)*16,0,16,16,x+12,y-CAT_DRAW_H-12,16,16);
          }else{
            ctx.fillStyle='#FFC76E';ctx.fillRect(x-2,y-CAT_DRAW_H-10,5,5);
            ctx.fillStyle='#E8A0A8';ctx.fillRect(x+13,y-CAT_DRAW_H-6,5,5);
          }
        }
      }});
    }
    if(sitting&&!seatTransition){
      const sprite=getImage('pairBenchSit');
      if(sprite){
        result.push({z:sitting.tile[1]*TILE+12,draw(ctx){
          const x=sitting.tile[0]*TILE,y=sitting.tile[1]*TILE;
          const frame=Math.floor(pair.clock/1.25)%2;
          ctx.drawImage(sprite,frame*SIT_FRAME_W,0,SIT_FRAME_W,SIT_FRAME_H,
            x-SIT_DRAW_W/2,y-SIT_DRAW_H+1,SIT_DRAW_W,SIT_DRAW_H);
        }});
      }
    }
    return result;
  }
  return {spots,momentAt:(x,y)=>momentAt(spots,x,y),isMoment,closest:(x,y)=>closestMoment(spots,x,y),
    arrive,stand,isSitting,seatId,shouldHidePair,tick,scenery,positionBubble,renderPair,
    isTransitioning:()=>Boolean(seatTransition)};
}
