import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
const manifest=read('game/data/assets.json');
const images=new Map();
const add=(url,type)=>{if(url&&url.startsWith('/assets/game/')&&url.toLowerCase().endsWith('.png'))images.set(url,type);};
add(manifest.world.ground,'ground');
for(const [kind,url] of Object.entries(manifest.objects))add(url,kind);
for(const who of ['leo','itza']){
  const looks=manifest.characters[who]?.looks??[];
  if(looks.length>2)throw Error(who+': solo se permiten dos conjuntos completos');
  for(const look of looks)add(look.sheet,'sheet');
}
const palette=new Set(),errors=[];
let present=0,missing=0;
for(const [url,type] of images){
  const path=resolve(root,'.'+url);
  if(!existsSync(path)){missing++;continue;}
  present++;
  let png;
  try{png=PNG.sync.read(readFileSync(path));}
  catch(error){errors.push(url+': PNG ilegible ('+error.message+')');continue;}
  const special={roof:[152,34],awning:[40,24],tree:[48,84],rock:[48,47],bench:[48,47],lamp:[48,47]};
  const expected=type==='ground'?[1920,1280]:type==='sheet'?[192,144]:special[type]??[144,85];
  if(expected&&(png.width!==expected[0]||png.height!==expected[1]))
    errors.push(url+': '+png.width+'×'+png.height+'; debe ser '+expected.join('×'));
  let transparent=0,partial=0;
  for(let i=0;i<png.data.length;i+=4){
    const a=png.data[i+3];
    if(a===0)transparent++;
    else if(a!==255)partial++;
    if(a===255)palette.add([png.data[i],png.data[i+1],png.data[i+2]].join(','));
  }
  if(type!=='ground'&&transparent===0)errors.push(url+': el fondo debe ser transparente');
  if(partial)errors.push(url+': '+partial+' píxeles con alfa intermedio');
}
if(palette.size>48)errors.push('Paleta combinada: '+palette.size+' colores; máximo aprobado: 48');
console.log('PNG presentes:',present,'| pendientes:',missing,'| colores:',palette.size);
if(present===0)console.log('Aún no hay PNG: se usarán placeholders hasta copiarlos');
if(errors.length){for(const message of errors)console.error('ERROR',message);process.exitCode=1;}
else console.log('Dimensiones, alfa y paleta: comprobación aprobada');
