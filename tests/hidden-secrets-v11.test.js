import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import places from '../game/data/places.json' with {type:'json'};
import decor from '../game/data/decor.json' with {type:'json'};
import moments from '../game/data/moments.json' with {type:'json'};
import {SECRETS,normalizeHiddenSecrets,discoverSecret,createHiddenSecrets,drawShootingStars} from '../game/hidden-secrets.js';
import {initWorld,walkable,findPath} from '../game/world.js';

test('secret progress accepts known IDs once and preserves deterministic collection order',()=>{
  assert.deepEqual(normalizeHiddenSecrets(null),{found:[]});
  const input={found:['carta-bosque','unknown','cofre-cerezo','carta-bosque']};
  assert.deepEqual(normalizeHiddenSecrets(input),{found:['cofre-cerezo','carta-bosque']});
  assert.equal(input.found.length,4,'Loading does not mutate the supplied save');
  assert.deepEqual(normalizeHiddenSecrets({found:'cofre-cerezo'}),{found:[]});
});

test('discovering and revisiting a treasure never duplicates rewards or erases earlier secrets',()=>{
  const first=discoverSecret(undefined,'cofre-cerezo');assert.equal(first.isNew,true);
  const again=discoverSecret(first.state,'cofre-cerezo');assert.equal(again.isNew,false);
  assert.deepEqual(again.state,first.state);
  const next=discoverSecret(again.state,'cofre-luna');assert.equal(next.state.found.length,2);
  const invalid=discoverSecret(next.state,'not-a-secret');assert.equal(invalid.secret,null);
  assert.deepEqual(invalid.state,next.state);assert.equal(first.state.found.length,1);
});

test('every hidden object and its approach remains reachable beside the existing village',()=>{
  try{
    // Rocks model an even deeper footprint than a chest, so the chosen clearings
    // stay accessible when root registers the actual single-tile obstacles.
    initWorld(places,[...decor,...SECRETS.map(secret=>({kind:'rock',tile:secret.tile}))],moments,{ponyoUnlocked:true});
    for(const secret of SECRETS){
      assert.ok(walkable(...secret.arrival),secret.id+' has a free interaction point');
      assert.ok(findPath({x:30,y:25},{x:secret.arrival[0],y:secret.arrival[1]}).length,secret.id+' has a route');
    }
    for(const place of places)assert.ok(findPath({x:30,y:25},{x:place.arrival[0],y:place.arrival[1]}).length,place.id);
  }finally{initWorld(places,decor,moments);}
});

test('world interaction reveals only earned secrets on the map and opens the matching chest frame',()=>{
  const save={},events=[],images={chest:{name:'chest'},note:{name:'note'}};
  const controller=createHiddenSecrets({save,getImage:key=>images[key],onDiscover:event=>events.push(event)});
  assert.deepEqual(controller.getVisibleSpots(),[]);
  const secret=SECRETS[0],x=secret.tile[0]*16,y=secret.tile[1]*16;
  assert.equal(controller.hit(x,y-12)?.id,secret.id);
  assert.equal(controller.hit(0,0),null);assert.equal(controller.closest(...secret.arrival)?.id,secret.id);
  const before=[];controller.scenery()[0].draw({drawImage:(...args)=>before.push(args),fillRect(){}});
  assert.equal(before[0][1],0);
  assert.equal(controller.arrive(secret),true);assert.equal(controller.arrive(secret),true);
  assert.deepEqual(events.map(event=>event.isNew),[true,false]);assert.equal(save.hiddenSecrets.found.length,1);
  assert.equal(controller.getVisibleSpots()[0].id,secret.id);assert.equal(controller.getCurrent().id,secret.id);
  const after=[];controller.scenery()[0].draw({drawImage:(...args)=>after.push(args),fillRect(){}});
  assert.equal(after[0][1],32);assert.equal(controller.arrive({id:'invalid'}),false);
});

test('shooting stars appear briefly at night and never animate in reduced motion or daylight',()=>{
  const calls=[],ctx={canvas:{width:480,height:270},save(){},restore(){},fillRect(...args){calls.push(args);}};
  assert.equal(drawShootingStars(ctx,{time:6.8,night:false}),0);
  assert.equal(drawShootingStars(ctx,{time:6.8,night:true,reducedMotion:true}),0);
  assert.equal(calls.length,0);
  assert.equal(drawShootingStars(ctx,{time:6.8,night:true}),1);assert.ok(calls.length<=6);
  for(const [x,y,w,h] of calls){assert.ok(x>=0&&x+w<=480&&y>=0&&y+h<=270);assert.ok(w<=3&&h===1);}
  assert.equal(drawShootingStars(ctx,{time:8,night:true}),0);
  calls.length=0;assert.equal(drawShootingStars(ctx,{time:51.8,night:true}),1);
  assert.ok(calls.length>0,'The next 45-second cycle remains available');
});

test('generated chest frames and letter are native transparent, distinct and palette bounded',()=>{
  const chest=PNG.sync.read(readFileSync(new URL('../assets/game/secrets/chest.png',import.meta.url)));
  const note=PNG.sync.read(readFileSync(new URL('../assets/game/secrets/note.png',import.meta.url)));
  assert.deepEqual([chest.width,chest.height],[64,32]);assert.deepEqual([note.width,note.height],[32,32]);
  const masks=[];
  for(const image of [chest,note]){
    const colors=new Set();let transparent=0,opaque=0;
    for(let i=0;i<image.data.length;i+=4){
      assert.ok(image.data[i+3]===0||image.data[i+3]===255);
      if(!image.data[i+3])transparent++;else{opaque++;colors.add([...image.data.subarray(i,i+3)].join(','));}
    }
    assert.ok(transparent>image.width&&opaque>100);assert.ok(colors.size<=64);
    masks.push(image.data);
  }
  let differing=0;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const a=(y*64+x)*4,b=(y*64+x+32)*4;
    if(!chest.data.subarray(a,a+4).equals(chest.data.subarray(b,b+4)))differing++;
  }
  assert.ok(differing>100,'The open lid is real distinct artwork');
});
