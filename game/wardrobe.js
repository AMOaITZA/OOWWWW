import manifest from './data/assets.json' with { type: 'json' };

// Solo dos looks completos por personaje. La ropa, los lentes y el pelo ya vienen
// integrados en cada hoja: la lógica nunca conoce nombres de prendas sueltas.
export const catalogs={
  leo:manifest.characters.leo.looks,
  itza:manifest.characters.itza.looks
};
export const CHARACTERS=['leo','itza'];
export const LOOK_LIMIT=3;
export function getLookOptions(who){return catalogs[who]||[];}
export function getChoice(outfits,who){
  const available=getLookOptions(who);
  const requested=outfits?.[who]?.look;
  return available.find(look=>look.id===requested)?.id??available[0]?.id??null;
}
export function getSelectedLook(outfits,who){
  const chosen=getChoice(outfits,who);
  return getLookOptions(who).find(look=>look.id===chosen)||null;
}
export function chooseOutfit(outfits,who,id){
  if(!getLookOptions(who).some(look=>look.id===id))return false;
  if(!outfits[who]||typeof outfits[who]!=='object')outfits[who]={};
  outfits[who].look=id;
  return true;
}
export function equipmentUrls(outfits){
  return CHARACTERS.map(who=>getSelectedLook(outfits,who)?.sheet).filter(Boolean);
}
