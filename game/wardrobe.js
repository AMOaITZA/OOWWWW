import manifest from './data/assets.json' with { type: 'json' };

// Los catálogos conservan los identificadores guardados incluso cuando un PNG
// opcional aún no está instalado. La disponibilidad se comprueba al mostrarlo.
export const catalogs={
  leo:manifest.characters.leo.looks,
  itza:manifest.characters.itza.looks
};
export const CHARACTERS=['leo','itza'];
export const LOOK_LIMIT=3;
export function getLookOptions(who){return catalogs[who]||[];}
export function getChoice(outfits,who,isAvailable=()=>true){
  const available=getLookOptions(who).filter(look=>isAvailable(look.sheet));
  const requested=outfits?.[who]?.look;
  return available.find(look=>look.id===requested)?.id??available[0]?.id??null;
}
export function getSelectedLook(outfits,who,isAvailable){
  const chosen=getChoice(outfits,who,isAvailable);
  return getLookOptions(who).find(look=>look.id===chosen)||null;
}
export function chooseOutfit(outfits,who,id,isAvailable=()=>true){
  if(!getLookOptions(who).some(look=>look.id===id&&isAvailable(look.sheet)))return false;
  if(!outfits[who]||typeof outfits[who]!=='object')outfits[who]={};
  outfits[who].look=id;
  return true;
}
export function equipmentUrls(outfits){
  return CHARACTERS.map(who=>getSelectedLook(outfits,who)?.sheet).filter(Boolean);
}
