import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(resolve(root,'game/data/assets.json'),'utf8'));
const images=new Map(),errors=[],warnings=[],palette=new Set(),treePalette=new Set();
const add=(url,options)=>{
  if(url?.startsWith('/assets/game/')&&url.toLowerCase().endsWith('.png'))images.set(url,options);
};
add(manifest.world.ground,{size:[1920,1280],opaque:true,palette:true});
if(!manifest.appearance?.eyes)errors.push('Falta el recurso de ojos sin lentes');
add(manifest.appearance?.eyes,{size:[72,16],frame:[18,8],generated:true,maxColors:16});
if(!manifest.ambient?.pond)errors.push('Falta el estanque del jardín');
add(manifest.ambient?.pond,{size:[144,96],generated:true,maxColors:64});
const special={roof:[152,34],awning:[40,24],tree:[48,84],rock:[48,47],bench:[48,47],lamp:[48,47]};
for(const [kind,url] of Object.entries(manifest.objects)){
  const tree=kind.startsWith('tree-');
  add(url,{size:tree?[64,112]:special[kind]??[144,85],palette:!tree,treePalette:tree,
    generated:tree,maxColors:tree?48:undefined,emptyAllowed:kind==='awning'});
}
for(const species of ['cerezo','jacaranda','roble','abedul'])
  if(!manifest.objects['tree-'+species])errors.push('Falta el árbol '+species);
for(const who of ['leo','itza']){
  const looks=manifest.characters[who]?.looks??[];
  if(looks.length>3)errors.push(who+': solo se permiten tres conjuntos completos');
  for(const look of looks)add(look.sheet,{size:[192,144],frame:[32,48],character:true,generated:true,maxColors:128});
}
if(manifest.moments?.pairBenchSit)errors.push('La banca del mundo no debe usar una pareja con vestuario fijo');
const momentSizes={catIdle:[80,64],catHappy:[80,64],petSparkles:[96,16],benchSeat:manifest.moments?.benchSeat?.endsWith('/bench-seat-v4.png')?[56,32]:[56,40]};
for(const [kind,url] of Object.entries(manifest.moments??{}))
  add(url,{size:momentSizes[kind],blankFrames:kind==='petSparkles'?[4,5]:[],frame:{catIdle:[80,64],catHappy:[80,64],petSparkles:[16,16]}[kind]});
for(const who of ['leo','itza'])for(const look of ['principal','alternativo','boda']){
  const url=manifest.seated?.[who]?.[look];
  if(!url)errors.push('Falta la pose sentada de '+who+'/'+look);
  else add(url,{size:[64,48],frame:[32,48],character:true,generated:true,maxColors:128});
}
const architectureIds=['inicio','carta','galeria','razones','playlist','recuerdos','contador','lugares','final','armario','secreto','grabadora'];
for(const id of architectureIds){
  const url=manifest.architecture?.[id];
  if(!url)errors.push('Falta la arquitectura de '+id);
  else add(url,{size:[160,128],generated:true,maxColors:128});
}
// Illustrated dialogue headers have their own bounded palettes, like the
// complete architecture and character resources; base world colours stay put.
const experienceIds=['inicio','carta','galeria','razones','playlist','recuerdos','contador','lugares','final','armario','secreto','grabadora'];
for(const id of experienceIds){
  const url=manifest.experienceHeaders?.[id];
  if(!url)errors.push('Falta la ilustración de la experiencia '+id);
  else add(url,{size:[384,128],opaque:true,generated:true,maxColors:192});
}
add(manifest.wedding?.atlas,{size:manifest.wedding.logicalSize,normalizedAlpha:true});
add(manifest.wedding?.background,{size:[480,270],opaque:true,generated:true});
add(manifest.wedding?.castle,{size:[336,224],generated:true});
add(manifest.wedding?.arch,{size:[80,96],generated:true});
add(manifest.wedding?.seatedPair,{size:[128,48],frame:[64,48],generated:true,maxColors:128});
const characterContracts={
  'leo-walk':{size:[192,144],frame:[32,48],character:true},
  'itza-walk':{size:[192,144],frame:[32,48],character:true},
  idle:{size:[128,48],frame:[64,48],character:true},
  vows:{size:[256,48],frame:[64,48],character:true},
  kiss:{size:[192,48],frame:[64,48],character:true},
  hug:{size:[128,48],frame:[64,48],character:true},
  celebrate:{size:[192,48],frame:[64,48],character:true}
};
for(const [name,contract] of Object.entries(characterContracts))
  add(manifest.wedding?.characters?.[name]||'/assets/game/wedding/characters/'+name+'.png',
    {...contract,generated:true,maxColors:128});
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
  const assetPalette=new Set();
  for(let i=0;i<png.data.length;i+=4){
    const a=png.data[i+3];
    if(a===0)transparent++;
    else if(a!==255)partial++;
    if(a>=128){visible++;assetPalette.add([png.data[i],png.data[i+1],png.data[i+2]].join(','));}
    if(a===255&&options.palette)palette.add([png.data[i],png.data[i+1],png.data[i+2]].join(','));
    if(a===255&&options.treePalette)treePalette.add([png.data[i],png.data[i+1],png.data[i+2]].join(','));
  }
  if(!options.opaque&&transparent===0)errors.push(url+': el fondo debe ser transparente');
  if(options.opaque&&(transparent||partial))errors.push(url+': este fondo debe ser opaco');
  if(!visible){
    if(options.emptyAllowed)warnings.push(url+': reserva heredada totalmente transparente; no aporta dibujo');
    else errors.push(url+': imagen completamente vacía');
  }
  if(partial&&!options.normalizedAlpha)errors.push(url+': '+partial+' píxeles con alfa intermedio');
  if(partial&&options.normalizedAlpha)warnings.push(url+': '+partial+' píxeles con alfa intermedio; el render aplica umbral 128');
  if(options.maxColors&&assetPalette.size>options.maxColors)errors.push(url+': '+assetPalette.size+' colores; máximo del recurso: '+options.maxColors);
  if(options.generated&&assetPalette.size>512)warnings.push(url+': '+assetPalette.size+' colores; revisar economía de paleta en la captura real');
  if(options.frame){
    const [fw,fh]=options.frame;
    if(png.width%fw||png.height%fh)errors.push(url+': cuadrícula de frames incompatible');
    else {
      const footLines=[];
      for(let y=0;y<png.height;y+=fh)for(let x=0;x<png.width;x+=fw){
        const frame=(y/fh)*(png.width/fw)+x/fw;
        if(!visibleIn(png,x,y,fw,fh)&&!options.blankFrames?.includes(frame))
          errors.push(url+': frame vacío en ['+x/fw+','+y/fh+']');
        if(options.character){
          let minX=fw,minY=fh,maxX=-1,maxY=-1;
          for(let fy=0;fy<fh;fy++)for(let fx=0;fx<fw;fx++){
            if(png.data[((y+fy)*png.width+x+fx)*4+3]<128)continue;
            minX=Math.min(minX,fx);minY=Math.min(minY,fy);
            maxX=Math.max(maxX,fx);maxY=Math.max(maxY,fy);
          }
          if(minX===0||maxX===fw-1||minY===0)
            errors.push(url+': frame ['+x/fw+','+y/fh+'] toca un borde lateral/superior; posible recorte');
          if(maxY>=0)footLines.push(maxY);
        }
      }
      if(footLines.length&&Math.max(...footLines)-Math.min(...footLines)>1)
        errors.push(url+': línea de pies desalineada entre frames ('+Math.min(...footLines)+'..'+Math.max(...footLines)+')');
    }
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
if(palette.size>MAX_APPROVED_COLORS)errors.push('Paleta combinada del escenario: '+palette.size+' colores; máximo aprobado: '+MAX_APPROVED_COLORS);
if(treePalette.size>48)errors.push('Paleta compartida de árboles: '+treePalette.size+' colores; máximo: 48');
console.log('PNG presentes:',present,'| opcionales ausentes:',optionalMissing,'| colores del escenario:',palette.size,'| colores de árboles:',treePalette.size);
for(const message of warnings)console.log('OBSERVACIÓN',message);
if(errors.length){for(const message of errors)console.error('ERROR',message);process.exitCode=1;}
else console.log('Dimensiones, recursos obligatorios, frames, anclajes, regiones, alfa y paleta: comprobación aprobada');
