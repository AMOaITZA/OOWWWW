import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import pngjs from 'pngjs';

const png=path=>pngjs.PNG.sync.read(readFileSync(new URL('../'+path,import.meta.url)));
const frame=(image,col,row,fw=32,fh=48)=>{
  let x0=fw,y0=fh,x1=-1,y1=-1,count=0;
  const pixels=[];
  for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){
    const i=((row*fh+y)*image.width+col*fw+x)*4;
    const pixel=[...image.data.subarray(i,i+4)];
    pixels.push(...pixel);
    assert.ok(pixel[3]===0||pixel[3]===255,'La cuadrícula debe tener alfa binaria');
    if(!pixel[3])continue;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;
  }
  return {x0,y0,x1,y1,count,pixels:Buffer.from(pixels)};
};

const walkingSheets=['leo','itza'].flatMap(who=>[
  {name:who+' look 1',path:'assets/game/characters/'+who+'/look-01.png'},
  {name:who+' look 2',path:'assets/game/characters/'+who+'/look-02.png'},
  {name:who+' wedding',path:'assets/game/wedding/characters/'+who+'-walk.png'}
]);
for(const {name,path} of walkingSheets){
  test(name+' is a real transparent 6×3 sheet with aligned complete frames',()=>{
    const image=png(path);
    assert.equal(image.width,192);assert.equal(image.height,144);
    const feet=[];
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const box=frame(image,col,row);
      assert.ok(box.count>180,`Celda ${col},${row} vacía o fragmentaria`);
      assert.ok(box.x0>0&&box.x1<31&&box.y0>0,`Celda ${col},${row} recortada`);
      assert.ok(box.y1-box.y0>=38,`Celda ${col},${row} demasiado pequeña frente a los otros looks`);
      assert.ok(box.y1>=44&&box.y1<=47,'Los pies deben conservar la línea base');
      feet.push(box.y1);
    }
    assert.ok(Math.max(...feet)-Math.min(...feet)<=1,'La hoja no debe saltar de altura al animarse');
  });
  test(name+' has distinct front, side, back and walking poses',()=>{
    const image=png(path);
    assert.notDeepEqual(frame(image,0,0).pixels,frame(image,0,1).pixels);
    assert.notDeepEqual(frame(image,0,1).pixels,frame(image,0,2).pixels);
    for(let row=0;row<3;row++){
      const unique=new Set([2,3,4,5].map(col=>frame(image,col,row).pixels.toString('base64')));
      assert.ok(unique.size>=3,'La caminata necesita al menos tres poses visuales en la fila '+row);
    }
  });
}

test('cinematic garden is a real opaque 480×270 image and the castle has actual transparency',()=>{
  const background=png('assets/game/wedding/cinematic-background.png');
  assert.equal(background.width,480);assert.equal(background.height,270);
  for(let i=3;i<background.data.length;i+=4)assert.equal(background.data[i],255);
  const castle=png('assets/game/wedding/castle-v2.png');
  assert.equal(castle.width,336);assert.equal(castle.height,224);
  let opaque=0,transparent=0;
  for(let i=3;i<castle.data.length;i+=4){
    assert.ok(castle.data[i]===0||castle.data[i]===255,'No conservar bordes de alfa intermedia');
    if(castle.data[i])opaque++;else transparent++;
  }
  assert.ok(opaque>10000,'Debe contener un edificio completo');
  assert.ok(transparent>5000,'La transparencia debe rodear las torres y la silueta');
});

test('new seated illustration contains two complete transparent 80×64 poses',()=>{
  const image=png('assets/game/moments/pair-bench-sit-v2.png');
  assert.equal(image.width,160);assert.equal(image.height,64);
  const poses=[frame(image,0,0,80,64),frame(image,1,0,80,64)];
  for(const box of poses){
    assert.ok(box.count>800,'Debe mostrar a los dos personajes y el asiento');
    assert.ok(box.x0>0&&box.x1<79&&box.y0>0,'La pose no debe cortar cabezas ni brazos');
    assert.ok(box.y1-box.y0>40,'La pareja no debe ocupar una miniatura dentro de la celda');
  }
  assert.ok(Math.abs(poses[0].y1-poses[1].y1)<=1,'La base debe mantenerse entre poses');
});


const characterRegions={
  'itza-walk':[264,0,192,144],'leo-walk':[456,0,192,144],
  vows:[412,154,256,48],idle:[0,240,128,48],kiss:[128,240,192,48],
  hug:[320,240,128,48],celebrate:[0,288,192,48]
};
const retiredPixels={
  'itza-walk':'be6e916be5d50e9bdfd11b2d43c7a08a1def3620e83190340516001b1fa5494b',
  'leo-walk':'2397cd5eba47ef672748f4a28738f5e604150c706cf67c81ea35fd8f3fdb4c6c',
  vows:'b6e0237f650e4fd747e3a07a81db4ba442ad6068a725ead00b90910ad9faf469',
  idle:'fe9953f1d3660bd2859f140e7afd732e1980bfac82b5b03beea7f7942eb14831',
  kiss:'0826d4e179827bea030c8b6cdb9ee159a4c38d8217df0a55fe51c8edc378c3f6',
  hug:'3ef9e0ae82a72d02ef6b6a9485ffff6615adf06458b614a07fe13aa1116a9029',
  celebrate:'0aefd6826b6a518e82d8339508ace8ceca5519a0142f562677c60ef1482ef67e'
};
const hash=data=>createHash('sha256').update(data).digest('hex');
function regionPixels(image,[x,y,width,height]){
  const result=Buffer.alloc(width*height*4);
  for(let row=0;row<height;row++)image.data.copy(result,row*width*4,
    ((y+row)*image.width+x)*4,((y+row)*image.width+x+width)*4);
  return result;
}

test('look 1 replaces the retired pixel artwork rather than retaining it under the same name',()=>{
  const retired={leo:'66c5abc6727ddfeebec0ae0af113a8bd097d19f362fa87a73d6de4a859b0c58d',
    itza:'de5f372e95f38acdd94e94397c389cc705a332200aef758002e1fe95509b4202'};
  for(const who of ['leo','itza'])assert.notEqual(hash(png('assets/game/characters/'+who+'/look-01.png').data),retired[who]);
});

test('every wedding character region contains the new standalone pixels with binary transparency',()=>{
  const atlas=png('assets/game/wedding/atlas.png');
  const manifest=JSON.parse(readFileSync(new URL('../game/data/assets.json',import.meta.url),'utf8'));
  for(const [key,bounds] of Object.entries(characterRegions)){
    const path=manifest.wedding.characters?.[key];
    assert.equal(path,'/assets/game/wedding/characters/'+key+'.png','El manifiesto debe usar la nueva hoja real');
    const image=png(path.slice(1)),pixels=regionPixels(atlas,bounds);
    assert.equal(image.width,bounds[2]);assert.equal(image.height,bounds[3]);
    assert.deepEqual(pixels,image.data,key+' debe coincidir con el archivo nuevo, sin dejar arte antiguo en el atlas');
    assert.notEqual(hash(pixels),retiredPixels[key],key+' no debe conservar la región retirada');
    for(let i=3;i<pixels.length;i+=4)assert.ok(pixels[i]===0||pixels[i]===255,key+' requiere alfa binaria');
  }
  const seated=png(manifest.wedding.seatedPair.slice(1));
  assert.deepEqual(regionPixels(atlas,[448,240,128,48]),seated.data,'La región sentada antigua también debe reemplazarse');
});

for(const [name,frames] of Object.entries({idle:2,vows:4,kiss:3,hug:2,celebrate:3})){
  test(name+' uses complete new pair frames with aligned feet and visible gestures',()=>{
    const image=png('assets/game/wedding/characters/'+name+'.png');
    assert.equal(image.width,frames*64);assert.equal(image.height,48);
    const poses=Array.from({length:frames},(_,col)=>frame(image,col,0,64,48));
    for(const pose of poses){
      assert.ok(pose.count>300,'La pareja debe ser visible y completa');
      assert.ok(pose.x0>0&&pose.x1<63&&pose.y0>0,'Cabezas y brazos deben caber en su celda');
      assert.ok(pose.y1>=44&&pose.y1<=47,'Los pies deben conservar el mismo suelo');
    }
    assert.ok(Math.max(...poses.map(pose=>pose.y1))-Math.min(...poses.map(pose=>pose.y1))<=1);
    assert.ok(new Set(poses.map(pose=>pose.pixels.toString('base64'))).size>=2,'La animación debe contener al menos dos gestos reales');
  });
}

test('the retired miniature seated sheet has no runtime manifest entry or file',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../game/data/assets.json',import.meta.url),'utf8'));
  assert.equal(manifest.moments.pairBenchSitOriginal,undefined);
  assert.equal(existsSync(new URL('../assets/game/moments/pair-bench-sit-sheet.png',import.meta.url)),false);
});
