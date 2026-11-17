import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {recolorHairPixels} from '../game/hair.js';
import {removeGlassesPixels,eyeRegion} from '../game/glasses.js';
const read=path=>PNG.sync.read(readFileSync(new URL('../'+path,import.meta.url)));
const eyes=read('assets/game/appearance/eyes-without-glasses.png');
const walking=[['walk-principal','assets/game/characters/itza/look-01.png'],
  ['walk-alternativo','assets/game/characters/itza/look-02.png'],
  ['walk-boda','assets/game/wedding/characters/itza-walk.png']];
const seated=['principal','alternativo','boda'].map(look=>['seat-'+look,'assets/game/moments/seated/itza-'+look+'.png']);
const shared=['idle','vows','kiss','hug','celebrate'].map(profile=>[profile,'assets/game/wedding/characters/'+profile+'.png']);
shared.push(['wedding-bench-v2','assets/game/wedding/pair-bench-v2.png']);
const colors=['negro','cafe','rosa','rubio'];
const pixel=(data,width,frame,row,x,y,cell=32)=>data.subarray(((row*48+y)*width+frame*cell+x)*4,((row*48+y)*width+frame*cell+x)*4+4);

test('casual fringe and inner locks follow the chosen color in all six animation cells',()=>{
  const reported=[
    [walking[0],0,[[21,12],[23,15],[10,28],[22,29]]],
    [walking[0],1,[[13,25],[13,28],[9,35],[12,36]]],
    [walking[1],0,[[25,16],[25,22],[6,29],[25,31]]],
    [walking[1],1,[[14,12],[13,13],[9,23],[11,28],[8,31]]],
    [walking[1],2,[[15,25],[21,24],[24,27],[24,28]]]
  ];
  for(const [[profile,path],row,points] of reported){
    const source=read(path);
    for(const color of colors.slice(1)){
      const rendered=recolorHairPixels(source,profile,color);
      for(let frame=0;frame<6;frame++)for(const [x,y] of points){
        const vertical=row===2?0:eyeRegion(source,profile,'itza',frame,row).y-eyeRegion(source,profile,'itza',0,row).y;
        assert.notDeepEqual([...pixel(rendered,source.width,frame,row,x,y+vertical)],
          [...pixel(source.data,source.width,frame,row,x,y+vertical)],`${profile} ${color} frame ${frame} ${x},${y}`);
      }
    }
  }
});

test('all seated outfits recolor the fringe and locks next to the cheeks',()=>{
  const points=[[[21,10],[22,11],[23,13],[23,23],[22,27]],
    [[23,11],[23,13],[23,22],[22,27]],
    [[11,10],[22,13],[23,14],[24,16],[23,24],[23,30]]];
  for(const [look,[profile,path]] of seated.entries()){
    const source=read(path);
    for(const color of colors.slice(1)){
      const rendered=recolorHairPixels(source,profile,color);
      for(let frame=0;frame<2;frame++)for(const [x,y] of points[look]){
        assert.notDeepEqual([...pixel(rendered,source.width,frame,0,x,y)],
          [...pixel(source.data,source.width,frame,0,x,y)],`${profile} ${color} frame ${frame} ${x},${y}`);
      }
    }
  }
});

test('removing glasses never repaints a recolored hair pixel in any walk, seat or ceremony',()=>{
  for(const [profile,path] of [...walking,...seated,...shared]){
    const source=read(path);
    for(const color of colors.slice(1)){
      const hair=recolorHairPixels(source,profile,color);
      const rendered=removeGlassesPixels({...source,data:hair},profile,['itza'],eyes);
      for(let index=0;index<hair.length;index+=4){
        const changedHair=hair[index]!==source.data[index]||hair[index+1]!==source.data[index+1]||hair[index+2]!==source.data[index+2];
        if(changedHair)assert.deepEqual([...rendered.subarray(index,index+4)],[...hair.subarray(index,index+4)],`${profile} ${color} hair ${index/4}`);
      }
    }
  }
});

test('glasses restoration preserves the original brows, mouth and nose instead of scaling the face',()=>{
  for(const [profile,path] of walking){
    const source=read(path);
    for(const color of colors){
      const hair=recolorHairPixels(source,profile,color),rendered=removeGlassesPixels({...source,data:hair},profile,['itza'],eyes);
      for(let frame=0;frame<6;frame++){
        const band=eyeRegion({...source,data:hair},profile,'itza',frame,0);
        // The true brow is above the top glasses rail; the mouth lies below
        // the lenses. Neither feature belongs to the replacement eye artwork.
        for(let y=11;y<=25;y++)for(let x=8;x<=24;x++){
          if(y>=band.y&&y<band.y+band.height)continue;
          assert.deepEqual([...pixel(rendered,source.width,frame,0,x,y)],
            [...pixel(hair,source.width,frame,0,x,y)],`${profile} ${color} face ${x},${y}`);
        }
      }
    }
  }
  const source=read(walking[0][1]),rendered=removeGlassesPixels(source,'walk-principal',['itza'],eyes);
  for(let frame=0;frame<6;frame++)for(const x of [15,16,17]){
    const y=18+eyeRegion(source,'walk-principal','itza',frame,0).y-eyeRegion(source,'walk-principal','itza',0,0).y;
    assert.deepEqual([...pixel(rendered,source.width,frame,0,x,y)],
      [...pixel(source.data,source.width,frame,0,x,y)],'Warm nose shading keeps its original shape');
  }
});

// The former full-width restoration erased the tiny seated mouth along with
// the glasses bridge. Its position is below the actual bridge rail.
test('seated mouths and nose pixels between the lenses retain their original shape',()=>{
  for(const [profile,path] of seated){
    const source=read(path);
    for(const color of colors){
      const hair=recolorHairPixels(source,profile,color),rendered=removeGlassesPixels({...source,data:hair},profile,['itza'],eyes);
      for(let frame=0;frame<2;frame++)for(let y=18;y<=23;y++)for(let x=15;x<=17;x++){
        assert.deepEqual([...pixel(rendered,source.width,frame,0,x,y)],
          [...pixel(hair,source.width,frame,0,x,y)],`${profile} ${color} mouth/nose ${x},${y}`);
      }
    }
  }
});

test('shared ceremony faces keep the nose and mouth below the glasses bridge',()=>{
  for(const [profile,path] of shared.filter(([profile])=>!['kiss','hug'].includes(profile))){
    const source=read(path),hair=recolorHairPixels(source,profile,'rubio');
    const rendered=removeGlassesPixels({...source,data:hair},profile,['itza','leo'],eyes);
    for(let frame=0;frame<source.width/64;frame++)for(const who of ['itza','leo']){
      const band=eyeRegion({...source,data:hair},profile,who,frame),lensWidth=Math.floor((band.width-3)/2);
      for(let y=20;y<=24;y++)for(let x=band.x+lensWidth;x<band.x+band.width-lensWidth;x++){
        assert.deepEqual([...pixel(rendered,source.width,frame,0,x,y,64)],
          [...pixel(hair,source.width,frame,0,x,y,64)],`${profile} ${who} mouth/nose ${x},${y}`);
      }
    }
  }
});
