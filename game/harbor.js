import {COAST_LAYOUT} from './coast-layout.js';
import './harbor.css';

// The harbor is an interaction in the overworld; it never opens a modal.
export function createHarbor({pair,onTravel=()=>{},onBoat=()=>{},onSay=()=>{},onBoard=()=>{}}){
  const frame=document.getElementById('game-frame');
  const panel=document.createElement('section');panel.className='harbor-hud';panel.hidden=true;
  panel.setAttribute('aria-label','Muelle de los viajes');
  const title=document.createElement('h2');title.textContent='Muelle de los viajes';
  const line=document.createElement('p');line.textContent='El barco está listo. ¿Nos escapamos a Hawái?';
  const actions=document.createElement('div');
  const board=document.createElement('button');board.type='button';board.textContent='Subir al barco · Hawái';
  const boat=document.createElement('button');boat.type='button';boat.textContent='Pasear en barca';
  const leave=document.createElement('button');leave.type='button';leave.textContent='Seguir paseando';
  actions.append(board,boat,leave);panel.append(title,line,actions);frame.append(panel);
  let open=false,departure=0,active=false;
  function close(){open=false;departure=0;panel.hidden=true;board.disabled=false;board.textContent='Subir al barco · Hawái';}
  function arrive(){
    open=true;departure=0;panel.hidden=false;line.textContent='¿Un viaje a Hawái o un paseo entre nuestras islas?';
    onSay('ya tenemos un barco y muchas ganas de viajar juntos. ¿Nos vamos, amor?');
  }
  board.addEventListener('click',()=>{
    if(!open||departure)return;
    onBoard();
    departure=.001;board.disabled=true;board.textContent='¡Zarpamos!';
    line.textContent='Un viaje más en nuestra historia.';
    onSay('toma mi mano. Nuestra siguiente parada es Hawái.');
  });
  boat.addEventListener('click',()=>{
    if(!open||departure)return;
    onBoard();close();onBoat();
  });
  leave.addEventListener('click',close);
  function tick(dt,{visible=true}={}){
    active=visible;
    if(open&&Math.hypot(pair.x-COAST_LAYOUT.hawaiiArrival[0],pair.y-COAST_LAYOUT.hawaiiArrival[1])>4)close();
    panel.hidden=!active||!open;
    if(departure&&active){departure+=dt;if(departure>=1.15){close();onTravel();}}
  }
  return {arrive,close,tick,isBoarding:()=>departure>0,isOpen:()=>open,
    dispose:()=>{close();panel.remove();}};
}
