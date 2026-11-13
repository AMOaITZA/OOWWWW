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

test('cats keep their readable scale and sitting uses native pixels after approaching the bench',()=>{
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
  pair.x=bench.arrival[0];pair.y=bench.arrival[1];
  controller.arrive(bench);
  assert.equal(controller.shouldHidePair(),false,'Walk to the bench before switching to the sitting pose');
  assert.equal(controller.isTransitioning(),true);
  controller.tick(.4);
  assert.equal(controller.shouldHidePair(),true);
  drawings.length=0;
  controller.scenery().forEach(item=>item.draw(ctx));
  const sitDraw=drawings.find(args=>args[0].name==='pairBenchSit');
  assert.ok(sitDraw,'Itza y Leo sentados visibles');
  assert.deepEqual(sitDraw.slice(1),[0,0,64,48,bench.tile[0]*16-32,bench.tile[1]*16-47,64,48]);
});


test('Leo dialogue is a floating sprite-aware bubble, including after modal close',()=>{
  const pair={x:68,y:51,clock:0,direction:'down'};
  const changed={};
  const bubble={textContent:'',hidden:true,style:{
    setProperty(name,value){changed[name]=value;},
  },dataset:{},offsetWidth:208,offsetHeight:60};
  const controller=createMoments({spots,pair,bubble,getImage:()=>({})});
  controller.arrive(spots.find(s=>s.kind==='cats'));
  assert.equal(bubble.hidden,false);
  const canvas={width:480,height:270,getBoundingClientRect:()=>({
    left:90,top:60,width:960,height:540
  })};
  const originalDocument=globalThis.document,originalWidth=globalThis.innerWidth,originalHeight=globalThis.innerHeight;
  try{
    globalThis.document={getElementById:()=>null};
    globalThis.innerWidth=1200;
    globalThis.innerHeight=720;
    controller.positionBubble({x:68*16-240,y:51*16-135},canvas);
    assert.match(bubble.style.left,/px$/);
    assert.match(bubble.style.top,/px$/);
    assert.ok(['bottom','top','left','right'].includes(bubble.dataset.tail));
    assert.match(changed['--tail-x'],/px$/);
  }finally{
    globalThis.document=originalDocument;globalThis.innerWidth=originalWidth;globalThis.innerHeight=originalHeight;
  }
  controller.tick(.1,{active:true,dialogsOpen:true});
  assert.equal(bubble.hidden,true);
  controller.tick(.1,{active:true,dialogsOpen:false});
  assert.equal(bubble.hidden,false);
});


test('standing moves smoothly back to the saved arrival instead of teleporting',()=>{
  const bench=spots.find(s=>s.kind==='bench');
  const pair={x:bench.arrival[0],y:bench.arrival[1],clock:0,direction:'down'};
  const controller=createMoments({spots,pair,bubble:{hidden:true,style:{}},getImage:()=>({})});
  controller.arrive(bench);
  controller.tick(.19);
  const halfway=controller.renderPair();
  assert.ok(halfway.y<pair.y&&halfway.y>bench.tile[1]);
  controller.tick(.2);
  const seated=controller.renderPair();
  controller.stand();
  assert.equal(controller.isSitting(),false);
  assert.equal(controller.renderPair().y,seated.y,'Standing starts at the visible seat');
  controller.tick(.19);
  assert.ok(controller.renderPair().y>seated.y&&controller.renderPair().y<pair.y);
  controller.tick(.2);
  assert.equal(controller.renderPair(),pair);
  assert.deepEqual([pair.x,pair.y],bench.arrival,'Save position stays compatible');
});

test('cat reaction turns toward cats and pauses behind an experience',()=>{
  const pair={x:68,y:51,clock:0,direction:'down'};
  const bubble={textContent:'',hidden:true,style:{}};
  const controller=createMoments({spots,pair,bubble,getImage:name=>({name})});
  controller.arrive(spots.find(s=>s.kind==='cats'));
  assert.equal(pair.direction,'up');
  let names=[];
  const ctx={drawImage(sprite){names.push(sprite.name);},fillRect(){}};
  controller.scenery().forEach(item=>item.draw(ctx));
  assert.ok(names.includes('catIdle'),'A short anticipation precedes the happy reaction');
  controller.tick(.4);
  controller.tick(10,{dialogsOpen:true});
  names=[];
  controller.scenery().forEach(item=>item.draw(ctx));
  assert.ok(names.includes('catHappy'),'Reaction time does not expire behind a modal');
  controller.tick(3);
  names=[];
  controller.scenery().forEach(item=>item.draw(ctx));
  assert.ok(names.includes('catIdle'));
});
