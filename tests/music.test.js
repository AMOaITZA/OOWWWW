import test from 'node:test';
import assert from 'node:assert/strict';
import songs from '../game/data/songs.json' with {type:'json'};
import {youtubeEmbedUrl} from '../game/music.js';

test('the user playlist contains 24 valid, unique YouTube video IDs in order',()=>{
  assert.equal(songs.length,24);
  assert.equal(new Set(songs.map(song=>song.videoId)).size,24);
  for(const song of songs){
    assert.match(song.videoId,/^[a-zA-Z0-9_-]{11}$/);
    assert.ok(song.title.trim());
    assert.ok(song.artist.trim());
  }
  assert.equal(songs[0].videoId,'5zkWMmP0fqk');
  assert.equal(songs.at(-1).videoId,'G5vz7UcDm-g');
});
test('embeds the full official YouTube video without forced autoplay',()=>{
  const embed=youtubeEmbedUrl(songs[0].videoId);
  assert.equal(embed,'https://www.youtube-nocookie.com/embed/5zkWMmP0fqk?playsinline=1&rel=0');
  assert.doesNotMatch(embed,/autoplay=1/);
  assert.throws(()=>youtubeEmbedUrl('javascript:alert(1)'),/inválido/);
});
