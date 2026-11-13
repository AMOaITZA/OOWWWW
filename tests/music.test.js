import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import filenames from '../game/data/audio.json' with {type:'json'};
import {tracks,trackUrl,parseTrackFilename} from '../game/music.js';

test('catalog lists exactly the 37 MP3 files present in the beta',()=>{
  assert.equal(filenames.length,37);
  assert.equal(new Set(filenames).size,filenames.length);
  assert.equal(tracks.length,filenames.length);
  for(const filename of filenames){
    assert.match(filename,/\.mp3$/i);
    const local=new URL('../assets/game/audio/'+encodeURIComponent(filename),import.meta.url);
    assert.ok(existsSync(fileURLToPath(local)),filename+' no existe');
  }
});
test('song titles and artists are derived from the original filenames',()=>{
  assert.deepEqual(parseTrackFilename('Compartir - Carla Morrison - Spotimate.app.mp3'),{
    filename:'Compartir - Carla Morrison - Spotimate.app.mp3',
    title:'Compartir',artist:'Carla Morrison'
  });
  assert.equal(parseTrackFilename('Everywhere - 2017 Remaster - Fleetwood Mac - Spotimate.app.mp3').title,'Everywhere - 2017 Remaster');
  assert.equal(parseTrackFilename('Árbol De Manzanas - Nsqk - Spotimate.app.mp3').title,'Árbol De Manzanas');
  assert.ok(tracks.every(track=>track.title.trim()));
});
test('audio URLs handle spaces and accents without allowing arbitrary paths',()=>{
  assert.equal(trackUrl('Árbol De Manzanas - Nsqk - Spotimate.app.mp3'),'/assets/game/audio/%C3%81rbol%20De%20Manzanas%20-%20Nsqk%20-%20Spotimate.app.mp3');
  assert.throws(()=>trackUrl('../private.mp3'),/fuera del catálogo/);
});
