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
import {opaqueFrameBounds,seatedCharacterGeometry,seatedPairGeometry,benchGeometry,BENCH_WIDTH,BENCH_HEIGHT} from '../game/seating.js';
import {sceneObjects} from '../game/places.js';
const readPng=url=>pngjs.PNG.sync.read(readFileSync(fileURLToPath(new URL('..'+url,import.meta.url))));
const looks=['principal','alternativo','boda'];
const benchSpot=spots.find(spot=>spot.kind==='bench');
function fixtures(){
  return Object.fromEntries(['leo','itza'].map(who=>[who,Object.fromEntries(looks.map((look,index)=>{
    const width=64,height=48,data=new Uint8Array(width*height*4);
    for(let frame=0;frame<2;frame++)for(let y=3;y<46;y++)for(let x=4;x<28;x++){
      const i=(y*width+frame*32+x)*4;data[i]=40+index*60;data[i+1]=90;data[i+2]=who==='leo'?100:150;data[i+3]=255;
    }
    return [look,{width,height,data,label:who+'-'+look}];
  }))]));
}
function controllerAtBench(outfits={leo:{look:'principal'},itza:{look:'principal'}},images=fixtures()){
  const pair={x:benchSpot.arrival[0],y:benchSpot.arrival[1],clock:0,direction:'down'};
  const controller=createMoments({spots,pair,bubble:{hidden:true,style:{}},getImage:name=>({name}),
    getOutfits:()=>outfits,getSeatedImage:(who,look)=>images[who]?.[look]});
  return {pair,controller,images,outfits};
}
const ctxFor=drawings=>({drawImage(...args){drawings.push(args);},fillRect(){},set fillStyle(_) {}});

test('an interaction phrase finishes before a pending random line replaces it',()=>{
  const previousRandom=Math.random;Math.random=()=>0;
  try{
    const bubble={hidden:true,style:{}},spoken=[];
    const controller=createMoments({spots,pair:{x:71,y:50,clock:0},bubble,getImage:()=>null,onSay:line=>spoken.push(line)});
    controller.tick(11.9);controller.say('ponyo ponyo que divertida es');controller.tick(.2);controller.tick(5);
    assert.equal(bubble.textContent,'Leo: ponyo ponyo que divertida es');
    assert.deepEqual(spoken,['ponyo ponyo que divertida es']);
  }finally{Math.random=previousRandom;}
});

test('one cats point and two original bench points are registered',()=>{
  assert.equal(spots.length,3);
  assert.equal(spots.filter(x=>x.kind==='cats').length,1);
  assert.equal(spots.filter(x=>x.kind==='bench').length,2);
  for(const bench of spots.filter(x=>x.kind==='bench'))
    assert.ok(decor.some(item=>item.kind==='bench'&&item.tile.join()===bench.tile.join()));
  assert.equal(new Set(spots.map(x=>x.id)).size,spots.length);
  assert.ok(LEO_LINES.length>=10);
});
test('cats and benches have valid access points without blocking the game',()=>{
  initWorld(places,decor,spots);
  for(const spot of spots){
    assert.ok(walkable(...spot.arrival),spot.id+' debe tener acceso');
    assert.deepEqual(closestMoment(spots,...spot.arrival,1),spot);
    assert.equal(momentAt(spots,spot.tile[0]*16,spot.tile[1]*16-18)?.id,spot.id);
  }
  assert.equal(walkable(68,47),false);
  assert.ok(findPath({x:30,y:25},{x:68,y:51}).length>0);
});
test('cats, sparkles and compact bench are real transparent PNG resources',()=>{
  const expected={catIdle:[80,64],catHappy:[80,64],petSparkles:[96,16],benchSeat:[56,32]};
  for(const [name,size] of Object.entries(expected)){
    const url=assets.moments[name];assert.match(url,/^\/assets\/game\/moments\/[-a-z0-9]+\.png$/);
    const file=fileURLToPath(new URL('..'+url,import.meta.url));assert.ok(existsSync(file),url+' no existe');
    const image=readPng(url);assert.deepEqual([image.width,image.height],size);
    const alphas=new Set();for(let i=3;i<image.data.length;i+=4)alphas.add(image.data[i]);
    assert.deepEqual([...alphas].sort((a,b)=>a-b),[0,255],url+' debe tener alfa binaria real');
  }
  assert.equal(assets.moments.pairBenchSit,undefined,'A fixed-outfit couple must not be an active world fallback');
});
test('cats keep readable scale while sitting uses two separate native outfit sprites',()=>{
  const {pair,controller}=controllerAtBench(),drawings=[],ctx=ctxFor(drawings);
  controller.scenery().forEach(item=>item.draw(ctx));
  const cats=spots.find(spot=>spot.kind==='cats');
  assert.deepEqual(drawings.find(args=>args[0].name==='catIdle').slice(1),[cats.tile[0]*16-20,cats.tile[1]*16-32,40,32]);
  controller.arrive(benchSpot);assert.equal(controller.shouldHidePair(),false);
  controller.tick(.4);assert.equal(controller.shouldHidePair(),true);
  drawings.length=0;controller.scenery().forEach(item=>item.draw(ctx));
  const seated=drawings.filter(args=>args[0].label);
  assert.deepEqual(seated.map(args=>args[0].label),['leo-principal','itza-principal']);
  for(const [,sx,sy,sw,sh,dx,dy,dw,dh] of seated){
    assert.ok(sx>=0&&sy>=0&&sx+sw<=32&&sy+sh<=48);
    assert.equal(dw,sw);assert.equal(dh,sh);assert.equal(dy+dh,benchSpot.tile[1]*16+1);
  }
  assert.deepEqual([pair.x,pair.y],benchSpot.arrival,'Sitting does not rewrite saved arrival position');
});
for(const leo of looks)for(const itza of looks){
  test('seated outfits remain independent: '+leo+' / '+itza,()=>{
    const {controller}=controllerAtBench({leo:{look:leo},itza:{look:itza}}),drawings=[];
    controller.arrive(benchSpot);controller.tick(.4);
    controller.scenery().forEach(item=>item.draw(ctxFor(drawings)));
    assert.deepEqual(drawings.filter(args=>args[0].label).map(args=>args[0].label),['leo-'+leo,'itza-'+itza]);
  });
}
test('changing one outfit while already seated updates only that character without remounting',()=>{
  const {controller,outfits}=controllerAtBench(),drawings=[];
  controller.arrive(benchSpot);controller.tick(.4);
  controller.scenery().forEach(item=>item.draw(ctxFor(drawings)));
  assert.deepEqual(drawings.filter(args=>args[0].label).map(args=>args[0].label),['leo-principal','itza-principal']);
  outfits.leo.look='alternativo';outfits.itza.look='boda';drawings.length=0;
  controller.scenery().forEach(item=>item.draw(ctxFor(drawings)));
  assert.deepEqual(drawings.filter(args=>args[0].label).map(args=>args[0].label),['leo-alternativo','itza-boda']);
  assert.equal(controller.isSitting(),true);assert.equal(controller.isTransitioning(),false);
});
test('a missing seated asset never substitutes an unrelated fixed outfit',()=>{
  const images=fixtures();delete images.leo.alternativo;
  const {controller}=controllerAtBench({leo:{look:'alternativo'},itza:{look:'boda'}},images);
  controller.arrive(benchSpot);controller.tick(.4);
  assert.equal(controller.shouldHidePair(),false,'Keep correctly dressed standing figures if a seated asset failed');
  const drawings=[];controller.scenery().forEach(item=>item.draw(ctxFor(drawings)));
  assert.equal(drawings.some(args=>args[0].label),false,'Do not draw a partly mismatched couple');
});
test('every real seated outfit has two complete native frames and stable feet',()=>{
  for(const who of ['leo','itza'])for(const look of looks){
    const image=readPng(assets.seated[who][look]);assert.deepEqual([image.width,image.height],[64,48]);
    const frames=opaqueFrameBounds(image);assert.equal(frames.length,2);
    const poses=[0,1].map(frame=>seatedCharacterGeometry(image,frame,100,200));
    for(const pose of poses){
      assert.equal(pose.scale,1);assert.equal(pose.width,pose.source.width);assert.equal(pose.height,pose.source.height);
      assert.equal(pose.y+pose.height,200);assert.ok(pose.height>=35&&pose.height<=46);
    }
    assert.ok(Math.abs(poses[0].height-poses[1].height)<=1,'Head/foot alignment must be stable');
    assert.ok(poses[1].source.x>=32&&poses[1].source.x<64,'Second frame must come from its own cell');
  }
});
test('the compact bench stays smaller than standing people and fits independent seated bodies',()=>{
  const bench=readPng(assets.moments.benchSeat),b=benchGeometry(100,200,bench);
  assert.ok(b.width>=45&&b.width<=56);assert.ok(b.height<=32&&b.height<44,'No giant backrest');
  assert.equal(b.y+b.height,200);
  for(const who of ['leo','itza']){
    const image=readPng(assets.seated[who].principal),pose=seatedCharacterGeometry(image,0,100,200);
    assert.ok(pose.height>b.height,'Faces should project above the bench back');
  }
  assert.ok(BENCH_WIDTH<=56&&BENCH_HEIGHT<=32);
});
test('Leo dialogue floats near characters and returns after a modal closes',()=>{
  const pair={x:68,y:51,clock:0,direction:'down'},changed={};
  const bubble={textContent:'',hidden:true,style:{setProperty(name,value){changed[name]=value;}},dataset:{},offsetWidth:208,offsetHeight:60};
  const controller=createMoments({spots,pair,bubble,getImage:()=>({})});controller.arrive(spots.find(s=>s.kind==='cats'));
  const saved={document:globalThis.document,width:globalThis.innerWidth,height:globalThis.innerHeight};
  try{
    const hud=[{left:90,top:60,width:960,height:90},{left:90,top:520,width:960,height:80}];
    globalThis.document={querySelectorAll:()=>hud.map((rect,index)=>({
      id:'hud-'+index,getBoundingClientRect:()=>rect
    }))};globalThis.innerWidth=1200;globalThis.innerHeight=720;
    controller.positionBubble({x:68*16-240,y:51*16-135},{width:480,height:270,
      getBoundingClientRect:()=>({left:90,top:60,right:1050,bottom:600,width:960,height:540})});
    assert.match(bubble.style.left,/px$/);assert.match(bubble.style.top,/px$/);assert.ok(['bottom','top','left','right'].includes(bubble.dataset.tail));
    const bubbleTop=parseFloat(bubble.style.top);
    assert.ok(bubbleTop>=150&&bubbleTop+bubble.offsetHeight<=520,'Speech avoids the floating HUD');
    assert.match(changed['--tail-x'],/px$/);
  }finally{globalThis.document=saved.document;globalThis.innerWidth=saved.width;globalThis.innerHeight=saved.height;}
  controller.tick(.1,{dialogsOpen:true});assert.equal(bubble.hidden,true);controller.tick(.1);assert.equal(bubble.hidden,false);
});
test('the approach and rise preserve saved position and keep the seated head anchored',()=>{
  const {controller,pair,images}=controllerAtBench();controller.arrive(benchSpot);controller.tick(.19);
  const halfway=controller.renderPair();assert.ok(halfway.y<pair.y&&halfway.y>benchSpot.tile[1]);controller.tick(.2);
  const pose=seatedPairGeometry(['leo','itza'].map(who=>({who,image:images[who].principal})),0,benchSpot.tile[0]*16,benchSpot.tile[1]*16+1);
  assert.equal(controller.renderPair().y*16-39,pose.anchor.y);
  controller.stand();assert.equal(controller.renderPair().y*16-39,pose.anchor.y);controller.tick(.19);
  assert.ok(controller.renderPair().y<pair.y);controller.tick(.2);assert.equal(controller.renderPair(),pair);
  assert.deepEqual([pair.x,pair.y],benchSpot.arrival);
});
test('cat reaction turns toward cats and pauses behind an experience',()=>{
  const pair={x:68,y:51,clock:0,direction:'down'},controller=createMoments({spots,pair,bubble:{hidden:true,style:{}},getImage:name=>({name})});
  controller.arrive(spots.find(s=>s.kind==='cats'));assert.equal(pair.direction,'up');
  const drawings=[];controller.scenery().forEach(item=>item.draw(ctxFor(drawings)));assert.ok(drawings.some(args=>args[0].name==='catIdle'));
  controller.tick(.4);controller.tick(10,{dialogsOpen:true});drawings.length=0;controller.scenery().forEach(item=>item.draw(ctxFor(drawings)));
  assert.ok(drawings.some(args=>args[0].name==='catHappy'));controller.tick(3);drawings.length=0;controller.scenery().forEach(item=>item.draw(ctxFor(drawings)));
  assert.ok(drawings.some(args=>args[0].name==='catIdle'));
});
test('compact bench collision matches its footprint and all entrances stay accessible',()=>{
  initWorld(places,decor,spots);
  for(const spot of spots.filter(s=>s.kind==='bench')){
    const [x,y]=spot.tile;for(let offset=-1;offset<=1;offset++)assert.equal(walkable(x+offset,y),false);
    assert.equal(walkable(x-2,y),true);assert.equal(walkable(x+2,y),true);assert.equal(walkable(...spot.arrival),true);
    assert.ok(findPath({x:30,y:25},{x:spot.arrival[0],y:spot.arrival[1]}).length>0);
  }
});
test('independent seated figures retain their separate decorative bench',()=>{
  let draws=0;const objects=sceneObjects([],[{kind:'bench',tile:benchSpot.tile}],()=>null,key=>key==='benchSeat'?{}:null,()=>null,()=>false);
  objects.forEach(item=>item.draw({drawImage(){draws++;}}));assert.equal(draws,1);
});
