const KEY = 'oowwww-game-v1';
const DEFAULT = {position:{x:60,y:39},direction:'down',outfits:{leo:{},itza:{}},visited:[]};
export function loadSave() {
  try {
    const data=JSON.parse(localStorage.getItem(KEY));
    if(!data || typeof data!=='object') return structuredClone(DEFAULT);
    const x=Number(data.position?.x), y=Number(data.position?.y);
    return {position:{x:Number.isFinite(x)?x:60,y:Number.isFinite(y)?y:39},
      direction:['up','down','left','right'].includes(data.direction)?data.direction:'down',
      outfits:data.outfits&&typeof data.outfits==='object'?data.outfits:{leo:{},itza:{}},
      visited:Array.isArray(data.visited)?data.visited:[]};
  } catch {return structuredClone(DEFAULT);}
}
export function writeSave(save) {
  try {localStorage.setItem(KEY,JSON.stringify(save));}
  catch(err) { console.warn('No se pudo guardar el progreso',err); }
}
