import {paragraph,node} from './dom.js';
export function mount(root,data){
  paragraph(root,data.text);
  const iframe=node('iframe','playlist-embed');
  iframe.src=data.embed;iframe.title='Playlist de Spotify';iframe.loading='lazy';
  iframe.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  iframe.setAttribute('allowfullscreen','');
  root.append(iframe);
  return ()=>{iframe.src='about:blank';};
}
