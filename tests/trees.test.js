import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {sceneObjects} from '../game/places.js';
import {initWorld,walkable,findPath} from '../game/world.js';
import {treeDrawGeometry,treeWorldBounds,TREE_SCALE} from '../game/tree-layout.js';
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

test('world tree drawing doubles each source uniformly and retains a legacy fallback',()=>{
  const special={name:'cerezo',width:64,height:112},legacy={name:'tree',width:48,height:84},draws=[];
  const ctx={drawImage:(...args)=>draws.push(args)};
  const create=lookup=>sceneObjects([],[{kind:'tree',species:'cerezo',tile:[20,14]}],lookup);
  for(const obj of create(kind=>kind==='tree-cerezo'?special:legacy))obj.draw(ctx);
  const first=treeDrawGeometry({tile:[20,14]},special);
  assert.deepEqual(draws[0],[special,first.x,first.y,128,224]);
  draws.length=0;
  for(const obj of create(kind=>kind==='tree'?legacy:null))obj.draw(ctx);
  const fallback=treeDrawGeometry({tile:[20,14]},legacy);
  assert.deepEqual(draws[0],[legacy,fallback.x,fallback.y,96,168]);
});

test('larger trees anchor opaque roots and keep whole crisp canopies',()=>{
  assert.equal(TREE_SCALE,2);
  const legacy=PNG.sync.read(readFileSync(new URL('../assets/game/objects/tree.png',import.meta.url)));
  for(const image of [...images,legacy]){
    const tree={tile:[20,14]},draw=treeDrawGeometry(tree,image),visible=treeWorldBounds(tree,image);
    assert.equal(draw.width,image.width*2);assert.equal(draw.height,image.height*2);
    assert.equal(visible.y+visible.height,14*16+1,'Last painted roots meet the ground');
    assert.ok(visible.height>=120,'Tree crowns are substantially taller than a character');
    assert.equal(visible.x+visible.width/2,20*16,'Painted canopy remains centered');
    assert.ok(Number.isInteger(draw.x)&&Number.isInteger(draw.y));
  }
});

test('larger foreground trees keep both people readable at every destination arrival',()=>{
  const places=read('game/data/places.json');
  const loaded=new Map();
  for(const tree of decor.filter(item=>item.kind==='tree')){
    const url=manifest.objects[tree.species?'tree-'+tree.species:'tree'];
    if(!loaded.has(url))loaded.set(url,PNG.sync.read(readFileSync(new URL('..'+url,import.meta.url))));
  }
  for(const place of places){
    const [x,y]=place.arrival,pair={x:x*16-32,y:y*16-46,width:64,height:48};
    for(const tree of decor.filter(item=>item.kind==='tree'&&item.tile[1]>=y)){
      const url=manifest.objects[tree.species?'tree-'+tree.species:'tree'],box=treeWorldBounds(tree,loaded.get(url));
      const overlap=Math.max(0,Math.min(pair.x+pair.width,box.x+box.width)-Math.max(pair.x,box.x))*
        Math.max(0,Math.min(pair.y+pair.height,box.y+box.height)-Math.max(pair.y,box.y));
      assert.equal(overlap,0,place.id+' stays clear of foreground '+(tree.species||'tree'));
    }
  }
});

test('decorative species preserve every place arrival and navigation route',()=>{
  const places=read('game/data/places.json');
  initWorld(places,decor,read('game/data/moments.json'));
  for(const place of places){
    assert.ok(walkable(...place.arrival),place.id+' arrival remains free');
    assert.ok(findPath({x:30,y:25},{x:place.arrival[0],y:place.arrival[1]}).length,place.id+' remains reachable');
  }
});
