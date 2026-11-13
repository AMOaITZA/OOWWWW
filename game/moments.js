import {TILE} from './world.js';

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
      ? Math.abs(x-sx)<44&&y>=sy-66&&y<=sy+12
      : Math.abs(x-sx)<35&&y>=sy-43&&y<=sy+15;
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
  let sitting=null,petRemaining=0,phraseRemaining=0;
  let nextPhrase=12+Math.random()*12;
  let bubbleAnchor='pair',lastPhrase=-1;
  function say(line,anchor='pair'){
    bubble.textContent='Leo: '+line;
    bubble.hidden=false;
    phraseRemaining=line.length>65?9:6;
    bubbleAnchor=anchor;
  }
  function randomLine(){
    const choices=LEO_LINES.map((line,i)=>({line,i})).filter(({i})=>i!==lastPhrase);
    const chosen=pick(choices);
    lastPhrase=chosen.i;
    return chosen.line;
  }
  function isMoment(spot){return spots.some(item=>item.id===spot?.id);}
  function stand(){sitting=null;}
  function arrive(spot){
    if(!isMoment(spot))return false;
    if(spot.kind==='cats'){
      stand();
      petRemaining=2.8;
      say(pick(['owww qué bonitaaa','miralooos, les encantan las caricias','qué bonitos están juntos']), 'cats');
    }else if(sitting?.id===spot.id){
      stand();
      say('vamos a seguir caminando');
    }else{
      sitting=spot;
      say(randomLine());
    }
    nextPhrase=24+Math.random()*22;
    return true;
  }
  function isSitting(){return sitting!==null;}
  function shouldHidePair(){return sitting!==null&&Boolean(getImage('pairBenchSit'));}
  function tick(dt,{active=true,dialogsOpen=false}={}){
    petRemaining=Math.max(0,petRemaining-dt);
    phraseRemaining=Math.max(0,phraseRemaining-dt);
    if(!active || dialogsOpen){
      bubble.hidden=true;
      return;
    }
    if(phraseRemaining<=0)bubble.hidden=true;
    nextPhrase-=dt;
    if(nextPhrase<=0){
      say(randomLine());
      nextPhrase=24+Math.random()*22;
    }
  }
  function positionBubble(camera){
    if(bubble.hidden||phraseRemaining<=0)return;
    let x=pair.x*TILE,y=pair.y*TILE-65;
    if(bubbleAnchor==='cats'&&petRemaining>0){
      x=cats.tile[0]*TILE;y=cats.tile[1]*TILE-80;
    }else if(sitting){
      x=sitting.tile[0]*TILE;y=sitting.tile[1]*TILE-64;
    }
    // Posición relativa al canvas: funciona también con escala fraccionaria móvil.
    const sx=Math.min(410,Math.max(70,x-camera.x));
    const sy=Math.min(192,Math.max(8,y-camera.y));
    bubble.style.left=(sx/480*100)+'%';
    bubble.style.top=(sy/270*100)+'%';
  }
  function scenery(){
    const result=[];
    if(cats){
      result.push({z:cats.tile[1]*TILE+1,draw(ctx){
        const x=cats.tile[0]*TILE,y=cats.tile[1]*TILE;
        const sprite=getImage(petRemaining>0?'catHappy':'catIdle');
        if(sprite)ctx.drawImage(sprite,x-40,y-64,80,64);
        else{
          ctx.fillStyle='#8B8584';ctx.fillRect(x-24,y-36,48,34);
          ctx.fillStyle='#FFF1DC';ctx.fillRect(x-22,y-33,18,25);
        }
        if(petRemaining>0){
          const fx=getImage('petSparkles');
          if(fx){
            const frame=Math.min(5,Math.floor((2.8-petRemaining)/.44));
            ctx.drawImage(fx,frame*16,0,16,16,x-8,y-83,16,16);
            ctx.drawImage(fx,((frame+2)%6)*16,0,16,16,x+15,y-76,16,16);
          }else{
            ctx.fillStyle='#FFC76E';ctx.fillRect(x-2,y-71,5,5);
            ctx.fillStyle='#E8A0A8';ctx.fillRect(x+13,y-66,5,5);
          }
        }
      }});
    }
    if(sitting){
      const sprite=getImage('pairBenchSit');
      if(sprite){
        result.push({z:sitting.tile[1]*TILE+12,draw(ctx){
          const x=sitting.tile[0]*TILE,y=sitting.tile[1]*TILE;
          const frame=Math.floor(pair.clock/1.25)%2;
          ctx.drawImage(sprite,frame*64,0,64,48,x-32,y-47,64,48);
        }});
      }
    }
    return result;
  }
  return {spots,momentAt:(x,y)=>momentAt(spots,x,y),isMoment,closest:(x,y)=>closestMoment(spots,x,y),
    arrive,stand,isSitting,shouldHidePair,tick,scenery,positionBubble};
}
