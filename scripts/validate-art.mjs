import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(resolve(root,'game/data/assets.json'),'utf8'));
const images=new Map(),errors=[],warnings=[],palette=new Set();
const add=(url,options)=>{
  if(url?.startsWith('/assets/game/')&&url.toLowerCase().endsWith('.png'))images.set(url,options);
};
add(manifest.world.ground,{size:[1920,1280],opaque:true,palette:true});
const special={roof:[152,34],awning:[40,24],tree:[48,84],rock:[48,47],bench:[48,47],lamp:[48,47]};
for(const [kind,url] of Object.entries(manifest.objects))
  add(url,{size:special[kind]??[144,85],palette:true,emptyAllowed:kind==='awning'});
for(const who of ['leo','itza']){
  const looks=manifest.characters[who]?.looks??[];
  if(looks.length>3)errors.push(who+': solo se permiten tres conjuntos completos');
  for(const look of looks)add(look.sheet,{size:[192,144],frame:[32,48],palette:true,optional:look.id==='alternativo'});
}
const momentSizes={catIdle:[80,64],catHappy:[80,64],petSparkles:[96,16],pairBenchSit:[128,48],benchSeat:[56,40]};
for(const [kind,url] of Object.entries(manifest.moments??{}))
  add(url,{size:momentSizes[kind],blankFrames:kind==='petSparkles'?[4,5]:[],frame:{catIdle:[80,64],catHappy:[80,64],petSparkles:[16,16],pairBenchSit:[64,48]}[kind]});
add(manifest.wedding?.atlas,{size:manifest.wedding.logicalSize,normalizedAlpha:true});
const regions={
  castle:[0,0,264,154],'itza-walk':[264,0,192,144],'leo-walk':[456,0,192,144],
  roof:[0,154,280,86],arch:[280,154,64,86],bench:[344,154,68,68],vows:[412,154,256,48],
  idle:[0,240,128,48],kiss:[128,240,192,48],hug:[320,240,128,48],
  'wedding-bench':[448,240,128,48],flower:[576,240,32,40],emblem:[608,240,24,24],
  vines:[632,240,40,40],petalPath:[672,240,48,48],celebrate:[0,288,192,48],
  awning:[192,288,56,38],hearts:[248,288,96,16],sparkles:[344,288,96,16]
};
function visibleIn(png,x,y,w,h){
  let count=0;
  for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)
    if(png.data[(py*png.width+px)*4+3]>=128)count++;
  return count;
}
let present=0,optionalMissing=0;
for(const [url,options] of images){
  const path=resolve(root,'.'+url);
  if(!existsSync(path)){
    if(options.optional){optionalMissing++;warnings.push(url+': opcional, no instalado');}
    else errors.push(url+': falta un recurso obligatorio');
    continue;
  }
  present++;
  let png;
  try{png=PNG.sync.read(readFileSync(path));}
  catch(error){errors.push(url+': PNG ilegible ('+error.message+')');continue;}
  if(options.size&&(png.width!==options.size[0]||png.height!==options.size[1]))
    errors.push(url+': '+png.width+'×'+png.height+'; debe ser '+options.size.join('×'));
  let transparent=0,partial=0,visible=0;
  for(let i=0;i<png.data.length;i+=4){
    const a=png.data[i+3];
    if(a===0)transparent++;
    else if(a!==255)partial++;
    if(a>=128)visible++;
    if(a===255&&options.palette)palette.add([png.data[i],png.data[i+1],png.data[i+2]].join(','));
  }
  if(!options.opaque&&transparent===0)errors.push(url+': el fondo debe ser transparente');
  if(options.opaque&&(transparent||partial))errors.push(url+': el suelo debe ser opaco');
  if(!visible){
    if(options.emptyAllowed)warnings.push(url+': reserva heredada totalmente transparente; no aporta dibujo');
    else errors.push(url+': imagen completamente vacía');
  }
  if(partial&&!options.normalizedAlpha)errors.push(url+': '+partial+' píxeles con alfa intermedio');
  if(partial&&options.normalizedAlpha)warnings.push(url+': '+partial+' píxeles con alfa intermedio; el render aplica umbral 128');
  if(options.frame){
    const [fw,fh]=options.frame;
    if(png.width%fw||png.height%fh)errors.push(url+': cuadrícula de frames incompatible');
    else for(let y=0;y<png.height;y+=fh)for(let x=0;x<png.width;x+=fw)
      if(!visibleIn(png,x,y,fw,fh)&&!options.blankFrames?.includes((y/fh)*(png.width/fw)+x/fw))
        errors.push(url+': frame vacío en ['+x/fw+','+y/fh+']');
  }
  if(url===manifest.wedding?.atlas){
    if(Object.keys(regions).length!==manifest.wedding.resourceCount)errors.push('El número de regiones de boda no coincide con el manifiesto');
    for(const [name,[x,y,w,h]] of Object.entries(regions)){
      if(x+w>png.width||y+h>png.height)errors.push('Boda '+name+': región fuera del atlas');
      else if(!visibleIn(png,x,y,w,h))errors.push('Boda '+name+': región vacía');
    }
  }
}
const MAX_APPROVED_COLORS=192;
if(palette.size>MAX_APPROVED_COLORS)errors.push('Paleta combinada del mundo: '+palette.size+' colores; máximo aprobado: '+MAX_APPROVED_COLORS);
console.log('PNG presentes:',present,'| opcionales ausentes:',optionalMissing,'| colores del mundo:',palette.size);
for(const message of warnings)console.log('OBSERVACIÓN',message);
if(errors.length){for(const message of errors)console.error('ERROR',message);process.exitCode=1;}
else console.log('Dimensiones, recursos obligatorios, frames, regiones, alfa y paleta: comprobación aprobada');
