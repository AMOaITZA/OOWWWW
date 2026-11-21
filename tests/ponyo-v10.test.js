import test from 'node:test';
import assert from 'node:assert/strict';
import places from '../game/data/places.json' with {type:'json'};
import decor from '../game/data/decor.json' with {type:'json'};
import spots from '../game/data/moments.json' with {type:'json'};
import {createPonyo} from '../game/ponyo.js';
import {PONYO_SPOT,PONYO_LINE,FISHING_SIGN,fishingAt} from '../game/finale-spots.js';
import {initWorld,walkable,findPath} from '../game/world.js';

test('Ponyo appears and responds only after the collection unlock',()=>{
  let unlocked=false;const spoken=[],image={width:64,height:32};
  const ponyo=createPonyo({getImage:()=>image,getUnlocked:()=>unlocked,onPet:line=>spoken.push(line)});
  const x=PONYO_SPOT.tile[0]*16,y=PONYO_SPOT.tile[1]*16;
  assert.equal(ponyo.hit(x,y-12),false);assert.equal(ponyo.arrive(),false);
  assert.deepEqual(ponyo.scenery(),[]);assert.deepEqual(spoken,[]);
  unlocked=true;
  assert.equal(ponyo.hit(x,y-12),true);assert.equal(ponyo.hit(x+40,y),false);
  assert.equal(ponyo.arrive(),true);assert.deepEqual(spoken,[PONYO_LINE]);
  assert.equal(PONYO_LINE,'ponyo ponyo que divertida es');
  const draws=[];ponyo.scenery()[0].draw({drawImage:(...args)=>draws.push(args),fillRect(){}});
  assert.equal(draws[0][0],image);assert.equal(draws[0][1],32,'Petting uses the content blinking pose');
});

test('Ponyo affection pauses with dialogs and does not drift with reduced motion',()=>{
  const ponyo=createPonyo({getImage:()=>({}),getUnlocked:()=>true});ponyo.arrive();
  function snapshot(){const calls=[];ponyo.scenery()[0].draw({drawImage:(...args)=>calls.push(args.slice(1)),
    fillRect:(...args)=>calls.push(args)});return calls;}
  ponyo.tick(.1,{reducedMotion:true});const still=snapshot();
  ponyo.tick(.9,{dialogsOpen:true,reducedMotion:true});assert.deepEqual(snapshot(),still);
  ponyo.tick(.5,{reducedMotion:true});assert.deepEqual(snapshot(),still);
  ponyo.tick(4,{reducedMotion:true});assert.equal(snapshot()[0][0],0,'Affection ends without an endless animation');
});

test('unlocking Ponyo preserves every entrance and its nearby cat interaction points',()=>{
  try{
    initWorld(places,decor,spots);assert.equal(walkable(71,47),true);
    initWorld(places,decor,spots,{ponyoUnlocked:true});assert.equal(walkable(71,47),false);
    assert.ok(walkable(...PONYO_SPOT.arrival));assert.ok(walkable(68,51));assert.ok(walkable(76,49));
    for(const place of places){
      assert.ok(walkable(...place.arrival),place.id);
      assert.ok(findPath({x:30,y:25},{x:place.arrival[0],y:place.arrival[1]}).length,place.id+' remains reachable');
    }
    assert.ok(findPath({x:50,y:34},{x:71,y:50}).length,'The reward can be reached from the fishing shore');
  }finally{initWorld(places,decor,spots);}
});

test('both the pond and its fishing sign select the fishing activity',()=>{
  assert.equal(fishingAt(800,479),true);
  assert.equal(fishingAt(FISHING_SIGN.x+4,FISHING_SIGN.y+4),true);
  assert.equal(fishingAt(480,400),false);assert.equal(fishingAt(1136,752),false);
});
