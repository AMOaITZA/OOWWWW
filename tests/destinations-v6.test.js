import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

test('the secret nook and recording studio are complete distinct transparent sprites',()=>{
  const hashes=[];
  for(const id of ['secreto','grabadora']){
    const image=PNG.sync.read(readFileSync(new URL('../assets/game/architecture/'+id+'.png',import.meta.url)));
    assert.equal(image.width,160);assert.equal(image.height,128);
    const colors=new Set();let minX=160,maxX=-1,minY=128,maxY=-1,count=0;
    for(let y=0;y<128;y++)for(let x=0;x<160;x++){
      const index=(y*160+x)*4,alpha=image.data[index+3];assert.ok(alpha===0||alpha===255);
      if(!alpha)continue;count++;colors.add([...image.data.subarray(index,index+3)].join(','));
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    assert.ok(count>1000,id+' has a complete painted entrance');
    assert.ok(minX>0&&maxX<159&&minY>0,id+' keeps transparent gutters');
    assert.equal(maxY,119,id+' stairs meet the shared architecture baseline');
    assert.ok(colors.size<=128);
    hashes.push(createHash('sha256').update(image.data).digest('hex'));
  }
  assert.notEqual(hashes[0],hashes[1]);
});
