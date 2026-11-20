import manifest from './data/assets.json';
import {CHARACTERS,equipmentUrls,getLookOptions} from './wardrobe.js';
import {loadWeddingImages,weddingImage} from './wedding-assets.js';
import {getHairColor,hairVariant} from './hair.js';
import {glassesVariant,setEyePatches} from './glasses.js';
export const EYE_PATCH_URL='/assets/game/appearance/eyes-without-glasses.png';

// Vite resolves this inventory at build time. Missing optional outfits never
// produce HTTP requests, including when recovering an older saved selection.
const installedSheets=new Set(Object.keys(import.meta.glob('/assets/game/characters/**/*.png')));
const cache=new Map(),ready=new Map();
function load(url,{sheet=false,ground=false}={}){
  if(!url)return Promise.resolve(null);
  if(sheet&&!url.startsWith('wedding:')&&!installedSheets.has(url))return Promise.resolve(null);
  if(url.startsWith('wedding:'))return loadWeddingImages().then(()=>weddingImage(url.slice(8)));
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
export const assetImage=url=>url?.startsWith('wedding:')?weddingImage(url.slice(8)):ready.get(url)||null;
export function outfitImage(url,outfits){
  const image=assetImage(url);
  for(const who of CHARACTERS){
    const look=manifest.characters[who].looks.find(option=>option.sheet===url);
    if(!look)continue;
    const profile='walk-'+look.id;
    return glassesVariant(who==='itza'?hairVariant(image,profile,getHairColor(outfits)):image,profile,who,outfits);
  }
  return image;
}
export const hasAsset=url=>Boolean(assetImage(url));
export async function prepareWorldAssets(){
  const tasks=[load(manifest.world.ground,{ground:true}),loadWeddingImages(),load(EYE_PATCH_URL).then(setEyePatches)];
  for(const url of Object.values(manifest.objects))tasks.push(load(url));
  for(const url of Object.values(manifest.ambient??{}))tasks.push(load(url));
  for(const url of Object.values(manifest.fishing??{}))tasks.push(load(url));
  for(const url of Object.values(manifest.home??{}))tasks.push(load(url));
  for(const url of Object.values(manifest.secrets??{}))tasks.push(load(url));
  for(const url of Object.values(manifest.architecture??{}))tasks.push(load(url));
  for(const looks of Object.values(manifest.seated??{}))for(const url of Object.values(looks))tasks.push(load(url));
  for(const url of Object.values(manifest.moments??{}))tasks.push(load(url));
  for(const who of CHARACTERS){
    for(const look of getLookOptions(who))tasks.push(load(look.sheet,{sheet:true}));
  }
  await Promise.all(tasks);
}
export function groundImage(){return assetImage(manifest.world.ground);}
export function ambientImage(kind){return assetImage(manifest.ambient?.[kind]);}
export function objectImage(kind){return assetImage(manifest.objects[kind]);}
export function momentImage(kind){return assetImage(manifest.moments?.[kind]);}
export function seatedImage(who,look,outfits){
  const image=assetImage(manifest.seated?.[who]?.[look]);
  const profile='seat-'+look;
  return glassesVariant(who==='itza'?hairVariant(image,profile,getHairColor(outfits)):image,profile,who,outfits);
}
export function weddingCharacterImage(key,outfits){
  const image=weddingImage(key);
  if(key==='leo-walk')return glassesVariant(image,'walk-boda','leo',outfits);
  if(key==='itza-walk')return glassesVariant(hairVariant(image,'walk-boda',getHairColor(outfits)),'walk-boda','itza',outfits);
  const profile=key==='itza-walk'?'walk-boda':key==='wedding-bench'?'wedding-bench-v2':key;
  return ['idle','vows','kiss','hug','celebrate','wedding-bench','wedding-bench-v2'].includes(key)
    ?glassesVariant(hairVariant(image,profile,getHairColor(outfits)),profile,null,outfits):image;
}
export function placeImage(id){return assetImage(manifest.architecture?.[id]);}
export async function prepareOutfit(outfits){
  // Always keep a real original sheet ready when a saved optional look is absent.
  const urls=new Set([...equipmentUrls(outfits),...CHARACTERS.map(who=>getLookOptions(who)[0]?.sheet)]);
  await Promise.all([...urls].filter(Boolean).map(url=>load(url,{sheet:true})));
}
export async function prepareLooks(){
  await Promise.all(CHARACTERS.flatMap(who=>getLookOptions(who).map(look=>load(look.sheet,{sheet:true}))));
}
