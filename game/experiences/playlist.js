import {tracks} from '../music.js';
import {paragraph,node} from './dom.js';

const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function mount(root,data,api){
  paragraph(root,data.text);
  paragraph(root,'Elige una canción para escucharla mientras exploras. Los controles están en el botón Música.','playlist-guide');
  const search=node('input','playlist-search');
  search.type='search';
  search.placeholder='Buscar canción o artista';
  search.setAttribute('aria-label','Buscar canción o artista');
  const count=node('p','playlist-song-count');
  count.setAttribute('aria-live','polite');
  const list=node('div','playlist-song-list');
  list.setAttribute('aria-label','Canciones disponibles');
  function render(){
    const query=normalize(search.value.trim());
    const filtered=tracks.filter(track=>normalize(track.title+' '+track.artist).includes(query));
    count.textContent=filtered.length+' de '+tracks.length+' canciones';
    list.replaceChildren();
    for(const track of filtered){
      const button=node('button','playlist-song');
      button.type='button';
      button.setAttribute('aria-label','Elegir '+track.title+(track.artist?' — '+track.artist:''));
      button.append(node('strong','playlist-song-title',track.title),node('span','playlist-song-artist',track.artist||'Audio'));
      button.addEventListener('click',()=>api.onMusicSelect?.(track.filename));
      list.append(button);
    }
    if(!filtered.length)list.append(node('p','playlist-empty','No encontramos esa canción.'));
  }
  search.addEventListener('input',render);
  root.append(search,count,list);
  render();
  return ()=>{};
}
