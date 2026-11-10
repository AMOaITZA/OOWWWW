import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
const manifest=read('game/data/assets.json');
const leo=read('game/data/catalog-leo.json'),itza=read('game/data/catalog-itza.json');
const items=new Map();
const add=(url,type)=>{if(url&&url.startsWith('/assets/game/')&&url.toLowerCase().endsWith('.png'))items.set(url,type);};
add(manifest.world.ground,'ground');
for(const url of Object.values(manifest.objects))add(url,'object');
for(const who of ['leo','itza']){
  add(manifest.characters[who]?.base,'sheet');
  const catalog=who==='leo'?leo:itza;
  for(const values of Object.values(catalog))for(const garment of values)for(const name of ['sprite','front','back'])add(garment[name],'sheet');
}
const palette=new Set(),errors=[];
let present=0,skipped=0;
for(const [url,type] of items){
  const file=resolve(root,'.'+url);
  if(!existsSync(file)){skipped++;continue;}
  present++;
  let png;
  try{png=PNG.sync.read(readFileSync(file));}
  catch(err){errors.push(url+': PNG ilegible ('+err.message+')');continue;}
  const expected=type==='ground'?[1920,1280]:type==='sheet'?[192,144]:null;
  if(expected&&(png.width!==expected[0]||png.height!==expected[1])){
    errors.push(url+': '+png.width+'×'+png.height+'; debe ser '+expected.join('×'));
  }
  let translucent=0,transparent=0;
  for(let i=0;i<png.data.length;i+=4){
    const r=png.data[i],g=png.data[i+1],b=png.data[i+2],a=png.data[i+3];
    if(a===0)transparent++;else if(a!==255)translucent++;
    if(a===255)palette.add([r,g,b].join(','));
  }
  if(type!=='ground'&&transparent===0)errors.push(url+': fondo no transparente');
  if(translucent)errors.push(url+': '+translucent+' píxeles con alfa intermedio (se requiere alfa 0 o 255)');
}
if(palette.size>48)errors.push('Paleta combinada: '+palette.size+' colores; máximo aprobado: 48');
console.log('Recursos presentes:',present,'| provisionales pendientes:',skipped,'| colores:',palette.size);
if(present===0)console.log('Aún no hay PNG del juego: se usan placeholders. La prueba vertical sigue pendiente.');
if(errors.length){for(const e of errors)console.error('ERROR',e);process.exitCode=1;}
else console.log('Dimensiones, alfa y paleta: validaciones automáticas aprobadas.');
