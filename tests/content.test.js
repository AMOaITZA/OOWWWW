import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const content=JSON.parse(read('game/data/content.json'));
const html=read('index.html'),letterSrc=read('js/transitions.js'),tvSrc=read('js/TV-CAROUSEL.js');
test('letter is literally unchanged',()=>{const original=letterSrc.match(/const LETTER_TEXT = `([\s\S]*?)`;/)?.[1];assert.equal(content.carta.text,original);assert.equal(original.length,1918);});
test('104 reasons preserve original spelling and order',()=>{
  const h=html.slice(html.indexOf('id="reasonsGrid"'),html.indexOf('</section>',html.indexOf('id="razones"')));
  const original=[...h.matchAll(/<div class="r-chip">[\s\S]*?<p>([\s\S]*?)<\/p><\/div>/g)].map(x=>x[1]);
  assert.equal(original.length,104);assert.deepEqual(content.razones.items,original);
});
test('gallery keeps all eight exact captions and file paths',()=>{
  const h=html.slice(html.indexOf('id="masonryGrid"'),html.indexOf('id="lightbox"'));
  const original=[...h.matchAll(/data-full="([^"]+)" data-caption="([^"]+)"/g)].map(x=>({src:'/'+x[1],caption:x[2]}));
  assert.equal(original.length,8);assert.deepEqual(content.galeria.photos,original);
});
test('television keeps all twenty-one memories and GIF addresses',()=>{
  const src=tvSrc.slice(tvSrc.indexOf('const MEMORIES = ['),tvSrc.indexOf('];',tvSrc.indexOf('const MEMORIES = ['))+2);
  const original=[...src.matchAll(/\{\s*icon:\s*"([^"]+)",\s*text:\s*"([^"]+)",\s*gif:\s*"([^"]+)"\s*\}/g)].map(x=>({icon:x[1],text:x[2],gif:x[3]}));
  assert.equal(original.length,21);assert.deepEqual(content.recuerdos.memories,original);
});
test('playlist source and counter start stay unchanged',()=>{
  assert.match(html,new RegExp(content.playlist.embed.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.equal(content.contador.since,'2025-04-03T00:00:00');
});
