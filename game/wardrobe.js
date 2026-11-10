import leo from './data/catalog-leo.json';
import itza from './data/catalog-itza.json';
export const catalogs={leo,itza};
export const SLOTS=['hair','top','bottom','shoes','accessories'];
export function getChoice(outfits,who,slot){
  const recorded=outfits?.[who]?.[slot];
  if(recorded===null)return null;
  const items=catalogs[who][slot];
  if(items.some(item=>item.id===recorded))return recorded;
  return items.find(item=>item.default)?.id??null;
}
export function chooseOutfit(outfits,who,slot,id){
  if(!outfits[who])outfits[who]={};
  outfits[who][slot]=id;
}
export function getItem(outfits,who,slot){
  const selected=getChoice(outfits,who,slot);
  return catalogs[who][slot].find(item=>item.id===selected)||null;
}
export function equipmentUrls(outfits){
  const urls=[];
  for(const who of ['leo','itza'])for(const slot of SLOTS){
    const item=getItem(outfits,who,slot);
    if(item){for(const url of [item.sprite,item.front,item.back])if(url)urls.push(url);}
  }
  return urls;
}
