import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PNG} from 'pngjs';

const ground=()=>PNG.sync.read(fs.readFileSync(new URL('../assets/game/world/ground-unified.png',import.meta.url)));
const rgb=(image,x,y)=>[...image.data.subarray((y*image.width+x)*4,(y*image.width+x)*4+3)];
const isWater=([r,g,b])=>g>r+30&&b>r+20;
const isPath=([r,g,b])=>r>190&&r>g+8&&g>b+15;

test('the full ground is opaque and keeps a bounded native pixel palette',()=>{
  const image=ground(),colors=new Set();assert.deepEqual([image.width,image.height],[1920,1792]);
  for(let i=0;i<image.data.length;i+=4){
    assert.equal(image.data[i+3],255);colors.add([...image.data.subarray(i,i+3)].join(','));
  }
  assert.ok(colors.size<=192);
});

test('the central road crossing and the established ocean shore retain their positions',()=>{
  const image=ground();
  for(const [x,y] of [[960,180],[960,640],[960,1060],[300,640],[1600,640]]){
    let paved=0,total=0;
    for(let yy=y-8;yy<=y+8;yy++)for(let xx=x-8;xx<=x+8;xx++){paved+=Number(isPath(rgb(image,xx,yy)));total++;}
    assert.ok(paved/total>.6,`The walkable road remains at ${x},${y}`);
  }
  // The foam belongs to the first ~30px below the collision shore; open
  // turquoise water follows it, just as in the reference coastline.
  for(const [y,minimum] of [[1572,.85],[1710,.8]]){
    let water=0;
    for(let x=120;x<1800;x++)water+=Number(isWater(rgb(image,x,y)));
    assert.ok(water/1680>minimum,`Ocean water remains south of the shore at y${y}`);
  }
  let northernWater=0;
  for(let x=120;x<1800;x++)northernWater+=Number(isWater(rgb(image,x,1495)));
  assert.ok(northernWater/1680<.2,'The beach stays on the landward side of the collision shore');
});

test('crossing the former y1280 join does not introduce a horizontal grass color step',()=>{
  const image=ground();
  function meanRow(y){
    const sum=[0,0,0];let count=0;
    for(let x=240;x<1680;x++){
      if(x>800&&x<1120)continue;
      const color=rgb(image,x,y);if(color[0]>185||isWater(color))continue;
      for(let c=0;c<3;c++)sum[c]+=color[c];count++;
    }
    return sum.map(value=>value/count);
  }
  const before=meanRow(1278),after=meanRow(1282);
  const difference=Math.hypot(...before.map((value,c)=>value-after[c]));
  assert.ok(difference<8,`Grass remains continuous across the old join, distance ${difference.toFixed(2)}`);
});
