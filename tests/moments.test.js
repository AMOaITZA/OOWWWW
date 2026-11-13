import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import pngjs from 'pngjs';
import places from '../game/data/places.json' with {type:'json'};
import decor from '../game/data/decor.json' with {type:'json'};
import spots from '../game/data/moments.json' with {type:'json'};
import assets from '../game/data/assets.json' with {type:'json'};
import {momentAt,closestMoment,LEO_LINES} from '../game/moments.js';
import {initWorld,walkable,findPath} from '../game/world.js';

test('one cats point and two original bench points are registered',()=>{
  assert.equal(spots.length,3);
  assert.equal(spots.filter(x=>x.kind==='cats').length,1);
  assert.equal(spots.filter(x=>x.kind==='bench').length,2);
  for(const bench of spots.filter(x=>x.kind==='bench'))
    assert.ok(decor.some(item=>item.kind==='bench'&&item.tile.join()===bench.tile.join()));
  assert.equal(new Set(spots.map(x=>x.id)).size,spots.length);
  assert.equal(LEO_LINES.length>=10,true);
});
test('cats and benches have valid access points without blocking the game',()=>{
  initWorld(places,decor,spots);
  for(const spot of spots){
    assert.ok(walkable(...spot.arrival),spot.id+' debe tener acceso');
    assert.deepEqual(closestMoment(spots,...spot.arrival,1),spot);
    const x=spot.tile[0]*16,y=spot.tile[1]*16;
    assert.equal(momentAt(spots,x,y-18)?.id,spot.id);
  }
  assert.equal(walkable(68,47),false,'gatos deben tener colisión');
  assert.ok(findPath({x:30,y:25},{x:68,y:51}).length>0);
});
test('all five resources are real transparent PNGs at native pixel-art resolution',()=>{
  const expected={
    catIdle:[80,64],catHappy:[80,64],petSparkles:[96,16],
    pairBenchSit:[128,48],benchSeat:[56,40]
  };
  for(const [name,size] of Object.entries(expected)){
    const url=assets.moments[name];
    assert.match(url,/^\/assets\/game\/moments\/[-a-z]+\.png$/);
    const file=fileURLToPath(new URL('..'+url,import.meta.url));
    assert.ok(existsSync(file),url+' no existe');
    const image=pngjs.PNG.sync.read(readFileSync(file));
    assert.deepEqual([image.width,image.height],size,url+' tamaño');
    let fullyTransparent=false,fullyOpaque=false;
    for(let i=3;i<image.data.length;i+=4){
      const a=image.data[i];assert.ok(a===0||a===255,url+' alfa no válido');
      if(a===0)fullyTransparent=true;
      if(a===255)fullyOpaque=true;
    }
    assert.ok(fullyTransparent&&fullyOpaque,url+' sin recorte transparente válido');
  }
});
