import {tracks} from '../music.js';
import {paragraph,node} from './dom.js';
import './activities-v7.css';

const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function mount(root,data,api){
  const shell=node('section','playlist-v7');
  paragraph(shell,data.text,'activity-lead');
  const studio=node('div','playlist-studio'),deck=node('div','playlist-deck'),browse=node('div','playlist-browse');
  deck.setAttribute('aria-hidden','true');
  deck.append(node('span','playlist-vinyl'),node('span','playlist-tonearm'),node('span','playlist-deck-switch'),node('span','playlist-deck-label','LADO A'));
  paragraph(browse,'Elige una canción para escucharla mientras exploras. Los controles están en el botón Música.','playlist-guide');
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
      const number=node('span','playlist-song-number',String(tracks.indexOf(track)+1).padStart(2,'0'));
      number.setAttribute('aria-hidden','true');
      const copy=node('span','playlist-song-copy');
      copy.append(node('strong','playlist-song-title',track.title),node('span','playlist-song-artist',track.artist||'Audio'));
      const play=node('span','playlist-song-play','▶');play.setAttribute('aria-hidden','true');
      button.append(number,copy,play);
      button.addEventListener('click',()=>api.onMusicSelect?.(track.filename));
      list.append(button);
    }
    if(!filtered.length)list.append(node('p','playlist-empty','No encontramos esa canción.'));
  }
  search.addEventListener('input',render);
  browse.append(search,count);studio.append(deck,browse);shell.append(studio,list);root.append(shell);
  render();
  return ()=>{};
}
