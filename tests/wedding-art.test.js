import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import pngjs from 'pngjs';
import {initWorld,walkable,findPath} from '../game/world.js';
import places from '../game/data/places.json' with {type:'json'};
import decor from '../game/data/decor.json' with {type:'json'};
import moments from '../game/data/moments.json' with {type:'json'};
import manifest from '../game/data/assets.json' with {type:'json'};

const atlasFile=fileURLToPath(new URL('../assets/game/wedding/atlas.png',import.meta.url));
const regions={
  castle:[0,0,264,154],itza:[264,0,192,144],leo:[456,0,192,144],
  roof:[0,154,280,86],arch:[280,154,64,86],bench:[344,154,68,68],
  vows:[412,154,256,48],idle:[0,240,128,48],kiss:[128,240,192,48],
  hug:[320,240,128,48],seated:[448,240,128,48],flower:[576,240,32,40],
  emblem:[608,240,24,24],vines:[632,240,40,40],
  petalPath:[672,240,48,48],celebrate:[0,288,192,48],
  awning:[192,288,56,38],hearts:[248,288,96,16],sparkles:[344,288,96,16]
};
test('wedding PNG atlas exists, is small and contains all 19 nonempty sprites',()=>{
  assert.equal(manifest.wedding.atlas,'/assets/game/wedding/atlas.png');
  assert.equal(manifest.wedding.resourceCount,19);
  assert.equal(Object.keys(regions).length,19);
  assert.ok(statSync(atlasFile).size<100000,'Un solo atlas optimizado');
  const png=pngjs.PNG.sync.read(readFileSync(atlasFile));
  assert.deepEqual([png.width,png.height],[720,342]);
  for(const [name,[sx,sy,w,h]] of Object.entries(regions)){
    assert.ok(sx>=0&&sy>=0&&sx+w<=png.width&&sy+h<=png.height,name);
    let opaque=0;
    for(let y=sy;y<sy+h;y++)for(let x=sx;x<sx+w;x++){
      if(png.data[((y*png.width+x)*4)+3]>=128)opaque++;
    }
    assert.ok(opaque>30,name+' contiene píxeles visibles');
  }
});
test('the rebuilt castle roof and reconstructed celebration contain valid animation art',()=>{
  const png=pngjs.PNG.sync.read(readFileSync(atlasFile));
  for(const [sx,sy,w,h,min] of [[0,154,280,86,5000],[0,288,64,48,500],[64,288,64,48,500],[128,288,64,48,500]]){
    let count=0;
    for(let y=sy;y<sy+h;y++)for(let x=sx;x<sx+w;x++){
      if(png.data[((y*png.width+x)*4)+3]>=128)count++;
    }
    assert.ok(count>=min,'Se espera arte visible en el techo o celebración');
  }
});
test('wedding castle arrival is walkable and reachable from the starting area',()=>{
  const castle=places.find(p=>p.id==='boda');
  assert.ok(castle);
  assert.equal(castle.kind,'wedding');
  initWorld(places,decor,moments);
  assert.ok(walkable(...castle.arrival),'La entrada debe quedar libre');
  assert.ok(findPath({x:30,y:25},{x:castle.arrival[0],y:castle.arrival[1]}).length>0,
    'Debe existir un sendero desde el inicio hasta la boda');
  assert.equal(walkable(castle.tile[0],castle.tile[1]),false,'El edificio tiene colisión');
});
