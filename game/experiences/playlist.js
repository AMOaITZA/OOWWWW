import songs from '../data/songs.json' with { type: 'json' };
import {paragraph,node} from './dom.js';

const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function mount(root,data,api){
  paragraph(root,data.text);
  paragraph(root,'Elige una canción para abrir el reproductor de YouTube. Puedes seguir caminando y visitar los demás lugares mientras el video permanece visible.','playlist-guide');
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
    const filtered=songs.filter(song=>normalize(song.title+' '+song.artist).includes(query));
    count.textContent=filtered.length+' de '+songs.length+' canciones';
    list.replaceChildren();
    for(const song of filtered){
      const button=node('button','playlist-song');
      button.type='button';
      button.setAttribute('aria-label','Elegir '+song.title+' — '+song.artist);
      const title=node('strong','playlist-song-title',song.title);
      const artist=node('span','playlist-song-artist',song.artist);
      button.append(title,artist);
      button.addEventListener('click',()=>api.onMusicSelect?.(song.videoId));
      list.append(button);
    }
    if(!filtered.length)list.append(node('p','playlist-empty','No encontramos esa canción.'));
  }
  search.addEventListener('input',render);
  root.append(search,count,list);
  render();
  return ()=>{};
}
