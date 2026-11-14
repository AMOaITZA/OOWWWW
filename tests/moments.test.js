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
import {opaqueFrameBounds,seatedGeometry,benchGeometry,BENCH_WIDTH,BENCH_HEIGHT} from '../game/seating.js';
import {sceneObjects} from '../game/places.js';

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
    pairBenchSit:assets.moments.pairBenchSit.includes('-v2')?[160,64]:[128,48],benchSeat:[56,40]
  };
  for(const [name,size] of Object.entries(expected)){
    const url=assets.moments[name];
    assert.match(url,/^\/assets\/game\/moments\/[-a-z0-9]+\.png$/);
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

test('cats keep their readable scale and sitting crops transparent margins before uniform scaling',()=>{
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
  assert.deepEqual(sitDraw.slice(1),[15,7,36,36,bench.tile[0]*16-36,bench.tile[1]*16-71,72,72]);
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


test('real seated heads regain standing facial scale without stretching their aspect',()=>{
  const sprite=pngjs.PNG.sync.read(readFileSync(new URL('../assets/game/moments/pair-bench-sit-sheet.png',import.meta.url)));
  const frames=opaqueFrameBounds(sprite);
  assert.deepEqual(frames.map(({x,y,width,height})=>({x,y,width,height})),[
    {x:15,y:7,width:36,height:36},{x:13,y:7,width:36,height:36}
  ]);
  const first=seatedGeometry(sprite,0,100,200),second=seatedGeometry(sprite,1,100,200);
  for(const pose of [first,second]){
    assert.equal(pose.scale,2,'13px head is restored to26px, matching standing heads');
    assert.equal(pose.width/pose.source.width,pose.height/pose.source.height,'Uniform pixels');
    assert.equal(pose.y+pose.height,200,'Actual alpha bottom, not transparent cell bottom, stays on the ground');
  }
  assert.equal(frames[0].headWidth*first.scale,26);
  assert.equal(first.x,second.x,'Transparent padding changes must not shift the pair');
  assert.equal(first.y,second.y);
  const bench=benchGeometry(100,200);
  assert.deepEqual(bench,{x:61,y:144,width:78,height:56});
  assert.ok(first.width<=BENCH_WIDTH,'Both characters fit on the enlarged bench');
  assert.equal(BENCH_HEIGHT,56);
});

test('a new sheet with full-size heads is not enlarged a second time',()=>{
  const width=160,height=64,data=new Uint8Array(width*height*4);
  for(let frame=0;frame<2;frame++){
    for(let y=4;y<40;y++)for(let x=12;x<62;x++)data[(y*width+frame*80+x)*4+3]=255;
    for(let y=31;y<47;y++)for(let x=6;x<72;x++)data[(y*width+frame*80+x)*4+3]=255;
  }
  const pose=seatedGeometry({width,height,data},0,100,200);
  assert.equal(pose.scale,1,'An already proportional generated pose keeps native pixels');
  assert.equal(pose.width,66);
  const second=seatedGeometry({width,height,data},1,100,200);
  assert.equal(second.source.x,86,'Second frame starts at80px, not legacy64px');
  assert.equal(second.x,pose.x);
  assert.equal(second.y,pose.y);
});

test('bench collision follows its larger visible seat while all arrivals remain accessible',()=>{
  initWorld(places,decor,spots);
  for(const spot of spots.filter(s=>s.kind==='bench')){
    const [x,y]=spot.tile;
    for(let offset=-2;offset<=2;offset++)assert.equal(walkable(x+offset,y),false);
    assert.equal(walkable(...spot.arrival),true);
    assert.ok(findPath({x:30,y:25},{x:spot.arrival[0],y:spot.arrival[1]}).length>0);
  }
});


test('generated seated sheet uses two native80x64 frames with a stable visible baseline',()=>{
  const sprite=pngjs.PNG.sync.read(readFileSync(new URL('../assets/game/moments/pair-bench-sit-v2.png',import.meta.url)));
  assert.deepEqual([sprite.width,sprite.height],[160,64]);
  const frames=opaqueFrameBounds(sprite);
  assert.deepEqual(frames.map(({x,y,width,height})=>({x,y,width,height})),[
    {x:2,y:4,width:75,height:59},{x:2,y:4,width:75,height:59}
  ]);
  const first=seatedGeometry(sprite,0,100,200),second=seatedGeometry(sprite,1,100,200);
  assert.equal(first.scale,1);
  assert.equal(first.width,75);
  assert.equal(first.height,59);
  assert.equal(second.source.x-first.source.x,80);
  assert.equal(second.x,first.x);
  assert.equal(second.y,first.y);
  assert.ok(first.width<=BENCH_WIDTH);
  assert.equal(first.y+first.height,200);
});

test('the approach and rise keep Leo head anchored across the seated pose change',()=>{
  const sprite=pngjs.PNG.sync.read(readFileSync(new URL('../assets/game/moments/pair-bench-sit-v2.png',import.meta.url)));
  const bench=spots.find(s=>s.kind==='bench');
  const pair={x:bench.arrival[0],y:bench.arrival[1],clock:0,direction:'down'};
  const controller=createMoments({spots,pair,bubble:{hidden:true,style:{}},getImage:()=>sprite});
  controller.arrive(bench);controller.tick(.39);
  const pose=seatedGeometry(sprite,0,bench.tile[0]*16,bench.tile[1]*16+1);
  assert.equal(controller.renderPair().y*16-39,pose.anchor.y);
  controller.stand();
  assert.equal(controller.renderPair().y*16-39,pose.anchor.y);
});


test('a seated composite replaces its exact decorative bench without drawing two backrests',()=>{
  const bench=spots.find(s=>s.kind==='bench');
  let occupied=false,draws=0;
  const objects=sceneObjects([],[{kind:'bench',tile:bench.tile}],()=>null,
    key=>key==='benchSeat'?{}:null,()=>null,tile=>occupied&&tile===bench.tile);
  const ctx={drawImage(){draws++;}};
  objects.forEach(item=>item.draw(ctx));assert.equal(draws,1);
  occupied=true;objects.forEach(item=>item.draw(ctx));assert.equal(draws,1);
  occupied=false;objects.forEach(item=>item.draw(ctx));assert.equal(draws,2,'Empty bench returns when standing');
});
