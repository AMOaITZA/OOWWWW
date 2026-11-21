import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {createAmbient,waterMask,AMBIENT_LIMITS} from '../game/ambient.js';
import {POND_LAYOUT,pondTileBlocked} from '../game/pond-geometry.js';

function pond(){
  const width=144,height=96,data=new Uint8ClampedArray(width*height*4);
  for(let y=12;y<84;y++)for(let x=13;x<132;x++)data.set([76,132,151,255],(y*width+x)*4);
  // A lily pad and a stone inside the same rectangle are deliberately not water.
  for(let y=35;y<52;y++)for(let x=55;x<72;x++)data.set([103,141,78,255],(y*width+x)*4);
  for(let y=58;y<66;y++)for(let x=92;x<102;x++)data.set([161,143,127,255],(y*width+x)*4);
  return {width,height,data};
}
function context(width=1920,height=1280){
  const drawings=[];
  return {canvas:{width,height},drawings,fillStyle:'',globalAlpha:1,
    save(){},restore(){},drawImage(...args){drawings.push({kind:'image',args});},
    fillRect(x,y,w,h){drawings.push({kind:'pixel',x,y,w,h,color:this.fillStyle,alpha:this.globalAlpha});}};
}

test('water mask excludes stones, leaves, transparency and warm grass',()=>{
  const source=pond(),mask=waterMask(source),at=(x,y)=>mask.data[y*mask.width+x];
  assert.equal(at(30,30),1);assert.equal(at(60,40),0);assert.equal(at(95,60),0);assert.equal(at(0,0),0);
  assert.equal(mask.data.length,source.width*source.height);
});

test('pond bank blocks intersecting route cells without swallowing the surrounding garden',()=>{
  assert.deepEqual([POND_LAYOUT.x,POND_LAYOUT.y,POND_LAYOUT.width,POND_LAYOUT.height],[728,422,144,96]);
  assert.equal(pondTileBlocked(50,29),true);
  assert.equal(pondTileBlocked(54,29),true,'Footprints touching the eastern bank are blocked');
  for(const [x,y] of [[45,21],[63,22],[30,25],[45,29],[55,29],[50,25],[50,34]])
    assert.equal(pondTileBlocked(x,y),false,`${x},${y} stays available`);
  assert.equal(pondTileBlocked(50.5,29),false);
});

test('the real pond artwork has water and every water footprint is excluded from routes',()=>{
  const image=PNG.sync.read(readFileSync(new URL('../assets/game/ambient/pond.png',import.meta.url))),mask=waterMask(image);
  let count=0;
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++)if(mask.data[y*mask.width+x]){
    count++;
    assert.equal(pondTileBlocked(Math.round((POND_LAYOUT.x+x)/16),Math.round((POND_LAYOUT.y+y)/16)),true,
      `The route footprint over water ${x},${y} must be blocked`);
  }
  assert.ok(count>2000,'The ripple mask follows a substantial real water surface');
});

test('every animated ripple pixel stays inside the actual water artwork',()=>{
  const source=pond(),mask=waterMask(source),ambient=createAmbient({getPondImage:()=>source});
  for(const time of [0,.7,1.8,3.4,5.5,8,23]){
    const ctx=context();ambient.drawGround(ctx,{time});
    const pixels=ctx.drawings.filter(draw=>draw.kind==='pixel');assert.ok(pixels.length>0);
    for(const pixel of pixels){
      assert.equal(mask.data[(pixel.y-POND_LAYOUT.y)*mask.width+pixel.x-POND_LAYOUT.x],1,
        `Ripple at ${pixel.x},${pixel.y} cannot cross a lily pad or bank`);
      assert.equal(pixel.w,1);assert.equal(pixel.h,1);
    }
    assert.ok(ambient.getStats().visibleRipples<=AMBIENT_LIMITS.ripples);
  }
});

test('pausing the ambient clock freezes geometry and advancing it moves water and petals',()=>{
  const ambient=createAmbient({decor:[{kind:'tree',species:'cerezo',tile:[40,33]}],getPondImage:pond});
  const draw=time=>{const ctx=context();ambient.drawGround(ctx,{time});ambient.drawAir(ctx,{time});return ctx.drawings;};
  const first=draw(2),same=draw(2),later=draw(4);
  assert.deepEqual(first,same,'Same elapsed time must not catch up with wall time');
  assert.notDeepEqual(first.filter(draw=>draw.kind==='pixel'),later.filter(draw=>draw.kind==='pixel'));
});

test('reduced motion keeps the pond illustration still and removes moving petals and ripples',()=>{
  const ambient=createAmbient({decor:[{kind:'tree',species:'cerezo',tile:[40,33]}],getPondImage:pond});
  const ctx=context();ambient.drawGround(ctx,{time:18,reducedMotion:true});ambient.drawAir(ctx,{time:18,reducedMotion:true});
  assert.equal(ctx.drawings.filter(draw=>draw.kind==='image').length,1);
  assert.equal(ctx.drawings.filter(draw=>draw.kind==='pixel').length,0);
  assert.deepEqual(ambient.getStats(),{visiblePetals:0,visibleRipples:0,waterReady:true,motion:'reduced'});
});

test('offscreen effects are culled and petal count is bounded even with many trees',()=>{
  const decor=Array.from({length:100},()=>({kind:'tree',species:'cerezo',tile:[40,33]}));
  const ambient=createAmbient({decor,getPondImage:pond}),ctx=context();
  ambient.drawGround(ctx,{time:1,camera:{x:4000,y:4000}});ambient.drawAir(ctx,{time:1,camera:{x:4000,y:4000}});
  assert.equal(ctx.drawings.length,0);assert.equal(ambient.getStats().visiblePetals,0);assert.equal(ambient.getStats().visibleRipples,0);
  ambient.drawAir(ctx,{time:2});assert.ok(ambient.getStats().visiblePetals<=AMBIENT_LIMITS.petals);
  assert.ok(ambient.getStats().visiblePetals>0);
});

test('water artwork is prepared once after it becomes available, rather than reading pixels each frame',()=>{
  const source=pond();let current=null,reads=0;
  const image={width:source.width,height:source.height,get data(){reads++;return source.data;}};
  const ambient=createAmbient({getPondImage:()=>current});
  ambient.drawGround(context(),{time:0});assert.equal(ambient.getStats().waterReady,false);
  current=image;ambient.drawGround(context(),{time:1});const prepared=reads;assert.ok(prepared>0);
  ambient.drawGround(context(),{time:2});ambient.drawGround(context(),{time:3});assert.equal(reads,prepared);
  assert.equal(ambient.getStats().waterReady,true);
});
