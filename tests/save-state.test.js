import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSave,writeSave} from '../game/save.js';

function withStorage(value,run){
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  let stored=value;
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>stored,setItem:(_key,next)=>{stored=next;}}});
  try{run();}finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;}
}
test('hair and lighting survive a full save round trip with position and outfits',()=>{
  withStorage(null,()=>{
    const save={position:{x:24,y:33},direction:'left',visited:['inicio','armario'],
      outfits:{leo:{look:'alternativo',glasses:false},itza:{look:'boda',hair:'rubio',glasses:false}},
      dayNight:{mode:'night',cycleStartedAt:1700000000000},leoVoice:{enabled:false},
      secretQuiz:{index:2,choices:{0:1}},voiceNotes:{filename:'mensaje-02.mp3',position:8,volume:.7}};
    writeSave(save);assert.deepEqual(loadSave(),save);
  });
});
test('older saves keep progress while lighting initializes separately',()=>{
  const old={position:{x:45,y:21},direction:'up',visited:['carta'],outfits:{leo:{look:'principal'},itza:{look:'alternativo'}}};
  withStorage(JSON.stringify(old),()=>{
    const loaded=loadSave();assert.equal(loaded.dayNight,undefined);
    assert.deepEqual(loaded.position,old.position);assert.deepEqual(loaded.outfits,old.outfits);assert.deepEqual(loaded.visited,old.visited);
  });
});
