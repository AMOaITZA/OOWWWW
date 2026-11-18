const KEY = 'oowwww-game-v1';
const DEFAULT = {position:{x:30,y:25},direction:'down',outfits:{leo:{},itza:{}},visited:[]};
export function loadSave() {
  try {
    const data=JSON.parse(localStorage.getItem(KEY));
    if(!data || typeof data!=='object') return structuredClone(DEFAULT);
    const x=Number(data.position?.x),y=Number(data.position?.y);
    return {position:{x:Number.isFinite(x)?x:30,y:Number.isFinite(y)?y:25},
      direction:['up','down','left','right'].includes(data.direction)?data.direction:'down',
      outfits:data.outfits&&typeof data.outfits==='object'?data.outfits:{leo:{},itza:{}},
      visited:Array.isArray(data.visited)?data.visited:[],
      dayNight:data.dayNight&&typeof data.dayNight==='object'?data.dayNight:undefined,
      leoVoice:data.leoVoice&&typeof data.leoVoice==='object'?data.leoVoice:undefined,
      secretQuiz:data.secretQuiz&&typeof data.secretQuiz==='object'?data.secretQuiz:undefined,
      voiceNotes:data.voiceNotes&&typeof data.voiceNotes==='object'?data.voiceNotes:undefined,
      ...(data.fishing&&typeof data.fishing==='object'?{fishing:data.fishing}:{}),
      ...(data.home&&typeof data.home==='object'?{home:data.home}:{})};
  } catch {return structuredClone(DEFAULT);}
}
export function writeSave(save) {
  try {localStorage.setItem(KEY,JSON.stringify(save));}
  catch(err){console.warn('No se pudo guardar el progreso',err);}
}
