import {normalizeHomeVideoState} from './home-video.js';

export const HOME_ACTIVITIES=Object.freeze([
  {id:'eat',label:'Comer juntos',hint:'Algo rico para compartir',caption:'Una mesa para dos',
    line:'qué rico sabe todo cuando estoy contigo'},
  {id:'sleep',label:'Dormir juntos',hint:'Una siesta abrazaditos',caption:'Cinco minutitos más',
    line:'duerme tranquila, amor, aquí estoy contigo'},
  {id:'tv',label:'Ver la tele',hint:'Nuestra noche de pelis',caption:'La mejor parte es tu compañía',
    line:'tú escoges la peli, yo me quedo contigo'}
]);
const ids=new Set(HOME_ACTIVITIES.map(activity=>activity.id));
const count=value=>Number.isInteger(value)&&value>=0?Math.min(999999,value):0;
export function normalizeHomeState(saved){
  return {activity:ids.has(saved?.activity)?saved.activity:'eat',visits:count(saved?.visits),
    counts:Object.fromEntries(HOME_ACTIVITIES.map(({id})=>[id,count(saved?.counts?.[id])])),
    ...(saved?.video&&typeof saved.video==='object'?{video:normalizeHomeVideoState(saved.video)}:{})};
}
export function visitHome(saved){
  const home=normalizeHomeState(saved);home.visits=Math.min(999999,home.visits+1);return home;
}
export function chooseHomeActivity(saved,id){
  const home=normalizeHomeState(saved);
  if(!ids.has(id))return home;
  home.activity=id;home.counts[id]=Math.min(999999,home.counts[id]+1);return home;
}

// Coordinates are native to the 480 × 270 room, never scaled independently.
export const HOME_LAYOUT=Object.freeze({
  bed:{heads:[[55,91],[95,91]],blanket:{x:47,y:116,width:87,height:65}},
  table:{people:[[165,169],[272,169]],foreground:{x:191,y:183,width:79,height:36},food:[[211,195],[250,195]]},
  sofa:{people:[[340,156],[376,156]],foreground:{x:325,y:211,width:114,height:21}},
  tv:{x:352,y:80,width:42,height:29},ponyo:{x:443,y:225}
});
