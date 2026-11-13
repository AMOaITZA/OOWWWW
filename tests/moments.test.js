import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import pngjs from 'pngjs';
import places from '../game/data/places.json' with {type:'json'};
import decor from '../game/data/decor.json' with {type:'json'};
import spots from '../game/data/moments.json' with {type:'json'};
import assets from '../game/data/assets.json' with {type:'json'};
import {momentAt,closestMoment,LEO_LINES,createMoments} from '../game/moments.js';
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

test('cats render smaller, the seated pair renders larger and the interaction hitboxes follow the new sizes',()=>{
  const pair={x:68,y:51,clock:0};
  const bubble={textContent:'',hidden:true,style:{}};
  const controller=createMoments({spots,pair,bubble,getImage:name=>({name})});
  const cats=spots.find(spot=>spot.kind==='cats');
  const bench=spots.find(spot=>spot.kind==='bench');
  const drawings=[];
  const ctx={
    drawImage(...args){drawings.push(args);},
    fillRect(){},
    set fillStyle(_) {}
  };
  controller.scenery().forEach(item=>item.draw(ctx));
  const catDraw=drawings.find(args=>args[0].name==='catIdle');
  assert.ok(catDraw,'Gatos visibles');
  assert.deepEqual(catDraw.slice(1),[cats.tile[0]*16-20,cats.tile[1]*16-32,40,32]);
  assert.equal(momentAt(spots,cats.tile[0]*16+22,cats.tile[1]*16-20)?.id,cats.id);
  assert.equal(momentAt(spots,cats.tile[0]*16+28,cats.tile[1]*16-20)?.id,undefined);
  controller.arrive(bench);
  drawings.length=0;
  controller.scenery().forEach(item=>item.draw(ctx));
  const sitDraw=drawings.find(args=>args[0].name==='pairBenchSit');
  assert.ok(sitDraw,'Itza y Leo sentados visibles');
  assert.deepEqual(sitDraw.slice(1),[0,0,64,48,bench.tile[0]*16-40,bench.tile[1]*16-59,80,60]);
});

test('speech lives outside the canvas; the game no longer positions a floating bubble over sprites',()=>{
  const pair={x:24,y:33,clock:0};
  const bubble={textContent:'',hidden:true,style:{}};
  const controller=createMoments({spots,pair,bubble,getImage:()=>({})});
  assert.equal('positionBubble' in controller,false);
  controller.arrive(spots.find(s=>s.kind==='bench'));
  assert.equal(bubble.hidden,false);
  controller.tick(0.1,{active:true,dialogsOpen:true});
  assert.equal(bubble.hidden,true);
  controller.tick(0.1,{active:true,dialogsOpen:false});
  assert.equal(bubble.hidden,false);
});
