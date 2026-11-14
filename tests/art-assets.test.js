import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

for(const who of ['leo','itza']){
  test(who+' alternate is a real transparent 6×3 sheet with aligned complete frames',()=>{
    const image=png('assets/game/characters/'+who+'/look-02.png');
    assert.equal(image.width,192);assert.equal(image.height,144);
    const feet=[];
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const box=frame(image,col,row);
      assert.ok(box.count>180,`Celda ${col},${row} vacía o fragmentaria`);
      assert.ok(box.x0>0&&box.x1<31&&box.y0>0,`Celda ${col},${row} recortada`);
      assert.ok(box.y1-box.y0>=38,`Celda ${col},${row} demasiado pequeña frente al original`);
      assert.ok(box.y1>=44&&box.y1<=47,'Los pies deben conservar la línea base');
      feet.push(box.y1);
    }
    assert.ok(Math.max(...feet)-Math.min(...feet)<=1,'La hoja no debe saltar de altura al animarse');
  });
  test(who+' alternate has distinct front, side, back and walking poses',()=>{
    const image=png('assets/game/characters/'+who+'/look-02.png');
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
