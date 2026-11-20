import test from 'node:test';
import assert from 'node:assert/strict';
import places from '../game/data/places.json' with {type:'json'};
import {structureShadowGeometry,structureShadowObjects} from '../game/structure-shadows.js';

test('every structure casts a shallow ground shadow in one consistent direction',()=>{
  for(const place of places){
    const g=structureShadowGeometry(place);
    assert.ok(g.shear<0&&g.flatten<0);
    assert.ok(g.bounds.height<g.source.height/3,'A shadow lies on the ground instead of painting a second building');
    assert.ok(g.bounds.width>=g.source.width);
    assert.equal(g.x,g.source.x+g.source.width/2);
    assert.ok(g.y>=place.tile[1]*16-6&&g.y<=place.tile[1]*16+24,'Shadow anchor follows the real entrance baseline');
  }
});

test('shadow masks are cached and structures outside the camera do not draw',()=>{
  const previous=globalThis.document;let allocations=0,draws=0;
  globalThis.document={createElement:()=>{allocations++;return {getContext:()=>({drawImage(){},fillRect(){}})};}};
  const image={width:160,height:128},place=places.find(p=>p.id==='inicio');
  const ctx={canvas:{width:480,height:270,dataset:{cameraX:'240',cameraY:'180'}},
    save(){},restore(){},transform(){},drawImage(){draws++;},fillRect(){}};
  try{
    const object=structureShadowObjects([place],()=>image,()=>null)[0];
    object.draw(ctx);object.draw(ctx);assert.equal(allocations,1);assert.equal(draws,2);
    ctx.canvas.dataset.cameraX='1400';object.draw(ctx);assert.equal(draws,2);
  }finally{globalThis.document=previous;}
});
