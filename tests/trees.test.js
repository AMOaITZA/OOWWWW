import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {sceneObjects} from '../game/places.js';
import {initWorld,walkable,findPath} from '../game/world.js';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const species=['cerezo','jacaranda','roble','abedul'];
const decor=read('game/data/decor.json'),manifest=read('game/data/assets.json');
const images=species.map(name=>PNG.sync.read(readFileSync(new URL('../assets/game/trees/'+name+'.png',import.meta.url))));

test('four distinct native tree PNGs have transparent margins, grounded feet and no red-alpha fringe',()=>{
  const hashes=new Set();
  for(const [index,image] of images.entries()){
    assert.equal(image.width,64);assert.equal(image.height,112);
    hashes.add(createHash('sha256').update(image.data).digest('hex'));
    let minX=64,minY=112,maxX=-1,maxY=-1,visible=0;
    for(let y=0;y<112;y++)for(let x=0;x<64;x++){
      const i=(y*64+x)*4,[r,g,b,a]=image.data.subarray(i,i+4);
      assert.ok(a===0||a===255,species[index]+' needs binary transparency');
      if(!a)continue;
      visible++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      assert.ok(!(r>180&&g<80&&(b<100||b>150)),species[index]+' must not keep red/magenta alpha noise');
    }
    assert.ok(visible>1200,species[index]+' has a complete crown and trunk');
    assert.ok(minX>=2&&maxX<=61,species[index]+' keeps lateral transparent gutters');
    assert.ok(minY>=9,species[index]+' crown is not clipped');
    assert.equal(maxY,110,species[index]+' roots share the ground baseline');
  }
  assert.equal(hashes.size,4,'Each tree species has its own silhouette and pixels');
});

test('all four ornamental trees share at most 48 opaque colors',()=>{
  const colors=new Set();
  for(const image of images)for(let i=0;i<image.data.length;i+=4)
    if(image.data[i+3])colors.add([...image.data.subarray(i,i+3)].join(','));
  assert.ok(colors.size>24,'Separate flower and leaf tones survive packing');
  assert.ok(colors.size<=48,'The ornamental set has its own bounded palette');
});

test('species are spread over the existing tree positions and keep original tall trees',()=>{
  const trees=decor.filter(object=>object.kind==='tree');
  assert.deepEqual(trees.map(tree=>tree.tile),[[20,14],[37,13],[53,12],[73,11],[88,13],[108,18],[113,58],[106,69],[92,68],[74,73],[53,72],[37,72],[13,71],[12,52],[7,23],[40,33],[71,35]]);
  assert.equal(trees.filter(tree=>!tree.species).length,4);
  for(const name of species){
    assert.ok(trees.filter(tree=>tree.species===name).length>=3,name+' appears across the village');
    assert.equal(manifest.objects['tree-'+name],'/assets/game/trees/'+name+'.png');
  }
});

test('world tree drawing picks the species image at native scale and retains a legacy fallback',()=>{
  const special={name:'cerezo'},legacy={name:'tree'},draws=[];
  const ctx={drawImage:(...args)=>draws.push(args)};
  const create=lookup=>sceneObjects([],[{kind:'tree',species:'cerezo',tile:[20,14]}],lookup);
  for(const obj of create(kind=>kind==='tree-cerezo'?special:legacy))obj.draw(ctx);
  assert.deepEqual(draws[0],[special,20*16-32,14*16-110,64,112]);
  draws.length=0;
  for(const obj of create(kind=>kind==='tree'?legacy:null))obj.draw(ctx);
  assert.deepEqual(draws[0],[legacy,20*16-32,14*16-110,64,112]);
});

test('decorative species preserve every place arrival and navigation route',()=>{
  const places=read('game/data/places.json');
  initWorld(places,decor,read('game/data/moments.json'));
  for(const place of places){
    assert.ok(walkable(...place.arrival),place.id+' arrival remains free');
    assert.ok(findPath({x:30,y:25},{x:place.arrival[0],y:place.arrival[1]}).length,place.id+' remains reachable');
  }
});
