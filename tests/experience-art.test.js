import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const ids=['inicio','carta','galeria','razones','playlist','recuerdos','contador','lugares','final','armario','secreto','grabadora'];
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const manifest=JSON.parse(read('game/data/assets.json'));
const provenance=JSON.parse(read('docs/EXPERIENCE-ART-V7-GENERATION.json'));
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');

test('each non-wedding experience has its own complete opaque native banner',()=>{
  const hashes=new Set();
  for(const id of ids){
    const url='/assets/game/experiences/'+id+'.png';
    assert.equal(manifest.experienceHeaders?.[id],url,id+' is registered for the dialogue header');
    const bytes=read(url.slice(1)),image=PNG.sync.read(bytes),colors=new Set();
    assert.deepEqual([image.width,image.height],[384,128],id+' native panorama');
    for(let i=0;i<image.data.length;i+=4){
      assert.equal(image.data[i+3],255,id+' has no transparent gutters or holes');
      colors.add([...image.data.subarray(i,i+3)].join(','));
    }
    assert.ok(colors.size>96&&colors.size<=192,id+' keeps textured detail within its palette budget');
    assert.ok(bytes.length<80000,id+' stays small enough for on-demand headers');
    hashes.add(hash(image.data));
  }
  assert.equal(hashes.size,12,'All twelve places have distinct scenes');
});

test('native banners have illustrated detail across their full width',()=>{
  for(const id of ids){
    const image=PNG.sync.read(read('assets/game/experiences/'+id+'.png'));
    for(let section=0;section<3;section++){
      const colors=new Set();
      for(let y=0;y<128;y++)for(let x=section*128;x<(section+1)*128;x++){
        const i=(y*image.width+x)*4;colors.add([...image.data.subarray(i,i+3)].join(','));
      }
      assert.ok(colors.size>40,id+' section '+section+' contains an independent illustrated scene');
    }
  }
});

test('provenance matches final PNGs and partitions each source atlas without overlap',()=>{
  assert.equal(provenance.generator,'image_gen.imagegen');
  assert.equal(provenance.assets.length,12);
  const sources=new Map();
  for(const entry of provenance.assets){
    assert.ok(ids.includes(entry.id));assert.equal(entry.sha256,hash(read(entry.path)));
    assert.deepEqual(entry.size,[384,128]);assert.equal(entry.opaque,true);
    assert.ok(/^[a-f0-9]{64}$/.test(entry.sourceSha256));
    const group=sources.get(entry.source)??[];group.push(entry);sources.set(entry.source,group);
  }
  assert.equal(sources.size,3);
  for(const group of sources.values()){
    assert.equal(group.length,4);const [width,height]=group[0].sourceSize;
    assert.equal(group.reduce((sum,entry)=>sum+entry.sourceRegion.width*entry.sourceRegion.height,0),width*height);
    for(let a=0;a<group.length;a++)for(let b=a+1;b<group.length;b++){
      const x=group[a].sourceRegion,y=group[b].sourceRegion;
      assert.equal(Math.max(0,Math.min(x.x+x.width,y.x+y.width)-Math.max(x.x,y.x))*
        Math.max(0,Math.min(x.y+x.height,y.y+y.height)-Math.max(x.y,y.y)),0,'Source crops never borrow a neighboring scene');
    }
  }
});
