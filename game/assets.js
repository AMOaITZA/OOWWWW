import manifest from './data/assets.json';
import {CHARACTERS,equipmentUrls,getLookOptions} from './wardrobe.js';

const cache=new Map(),ready=new Map();
function load(url,{sheet=false,ground=false}={}){
  if(!url)return Promise.resolve(null);
  if(cache.has(url))return cache.get(url);
  const task=new Promise(resolve=>{
    const image=new Image();image.decoding='async';
    image.onload=()=>{
      if(sheet&&(image.naturalWidth!==192||image.naturalHeight!==144)){
        console.warn('[OOWWWW] Hoja inválida:',url,'se requieren 192×144');
        resolve(null);return;
      }
      if(ground&&(image.naturalWidth!==1920||image.naturalHeight!==1280)){
        console.warn('[OOWWWW] Suelo inválido:',url,'se requieren 1920×1280');
        resolve(null);return;
      }
      resolve(image);
    };
    image.onerror=()=>resolve(null);
    image.src=url;
  });
  cache.set(url,task);
  task.then(image=>{if(image)ready.set(url,image);});
  return task;
}
export const assetImage=url=>ready.get(url)||null;
export const hasAsset=url=>Boolean(ready.get(url));
export async function prepareWorldAssets(){
  const tasks=[load(manifest.world.ground,{ground:true})];
  for(const url of Object.values(manifest.objects))tasks.push(load(url));
  for(const who of CHARACTERS){
    for(const look of getLookOptions(who))tasks.push(load(look.sheet,{sheet:true}));
  }
  await Promise.all(tasks);
}
export function groundImage(){return assetImage(manifest.world.ground);}
export function objectImage(kind){return assetImage(manifest.objects[kind]);}
export async function prepareOutfit(outfits){
  await Promise.all(equipmentUrls(outfits).map(url=>load(url,{sheet:true})));
}
export async function prepareLooks(){
  await Promise.all(CHARACTERS.flatMap(who=>getLookOptions(who).map(look=>load(look.sheet,{sheet:true}))));
}
