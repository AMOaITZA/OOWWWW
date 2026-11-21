import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhotoStore,normalizeCamera,photoFilename,PHOTO_LIMIT} from '../game/photo-store.js';

test('camera keeps only bounded progress metadata outside binary photo storage',()=>{
  assert.deepEqual(normalizeCamera({shots:-5,lastPhotoAt:'broken',blob:'not localStorage'}),{shots:0,lastPhotoAt:0});
  assert.deepEqual(normalizeCamera({shots:1.8,lastPhotoAt:12345}),{shots:1,lastPhotoAt:12345});
  assert.equal(normalizeCamera({shots:Infinity}).shots,0);
  assert.equal(normalizeCamera({shots:1e8}).shots,1e6);
});
test('photo download names stay safe and recognizable',()=>{
  assert.equal(photoFilename({title:'Hawái / Playa de Aloha!',createdAt:Date.UTC(2026,10,20)}),'itza-y-leo-hawai-playa-de-aloha-2026-11-20.png');
  assert.equal(photoFilename({title:'../',createdAt:0}),'itza-y-leo-nuestro-mundo-1970-01-01.png');
});
test('unavailable IndexedDB keeps actual PNG blobs for session, never pretends persistence',async()=>{
  const store=createPhotoStore({indexedDB:null}),blob=new Blob(['png-data'],{type:'image/png'});
  const photo=await store.put({id:'one',blob,title:'Nuestra casita',pose:'frente',width:480,height:270,createdAt:42});
  assert.equal(photo.durable,false);assert.equal(store.storage(),'session');
  assert.equal((await store.get('one')).blob,blob);
  assert.deepEqual(await store.list(),[{id:'one',createdAt:42,title:'Nuestra casita',pose:'frente',width:480,height:270,durable:false}]);
  assert.equal(await store.remove('one'),true);assert.equal(await store.get('one'),null);assert.deepEqual(await store.list(),[]);
});
test('photo list is newest first and a full album preserves every previous photo',async()=>{
  const store=createPhotoStore({indexedDB:null}),blob=new Blob(['png'],{type:'image/png'});
  for(let index=0;index<PHOTO_LIMIT;index++)await store.put({id:String(index),blob,createdAt:index});
  const list=await store.list();assert.equal(list[0].id,'59');assert.equal(list.at(-1).id,'0');
  await assert.rejects(store.put({blob}),/60 fotos/);assert.equal((await store.list()).length,PHOTO_LIMIT);
  await store.remove('10');await store.put({id:'replacement',blob,createdAt:100});assert.equal((await store.list())[0].id,'replacement');
});
test('empty photo is rejected without increasing stored photos',async()=>{
  const store=createPhotoStore({indexedDB:null});await assert.rejects(store.put({blob:new Blob([])}),/vacía/);assert.equal((await store.list()).length,0);
});
