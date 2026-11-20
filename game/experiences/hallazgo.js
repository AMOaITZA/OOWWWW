import {node,labeledButton} from './dom.js';
import {SECRETS,normalizeHiddenSecrets,discoverSecret} from '../hidden-secrets.js';
import './hallazgo.css';

export function mount(root,_data,api){
  let alive=true;
  const requested=api.getCurrentDiscovery?.()??api.currentDiscovery;
  const secret=typeof requested==='string'?SECRETS.find(item=>item.id===requested):requested;
  const shell=node('section','hidden-finding');
  if(!secret||!SECRETS.some(item=>item.id===secret.id)){
    shell.append(node('p','finding-message','Todavía hay rincones del mundo esperando a que los encuentres.'));
    root.append(shell);return ()=>{alive=false;};
  }
  const result=discoverSecret(api.save.hiddenSecrets,secret.id);
  api.save.hiddenSecrets=result.state;if(result.isNew)api.onProgressChange?.();
  const state=normalizeHiddenSecrets(api.save.hiddenSecrets);
  shell.dataset.secret=secret.id;
  shell.append(node('p','finding-eyebrow','Una sorpresa que era para ti'));
  const relic=node('div','finding-relic');relic.setAttribute('aria-hidden','true');
  relic.dataset.art=secret.art;
  const image=node('img');image.src=secret.art==='chest'?'/assets/game/secrets/chest.png':'/assets/game/secrets/note.png';image.alt='';
  relic.append(image);shell.append(relic,node('h3','finding-title',secret.title));
  const message=node('blockquote','finding-message',secret.message);
  const signature=node('p','finding-signature','Con amor, Leo');
  const reward=node('p','finding-reward',secret.reward);
  const repeat=labeledButton('Escuchar a Leo',()=>{if(alive)api.onLeoSay?.(secret.message);},'finding-button');
  const progress=node('p','finding-progress',state.found.length+' / '+SECRETS.length+' secretos');
  progress.setAttribute('role','status');
  const collection=node('ul','finding-collection');collection.setAttribute('aria-label','Tesoros descubiertos');
  for(const item of SECRETS){
    const found=state.found.includes(item.id),entry=node('li',found?'found':'waiting',found?item.reward:'Un secreto por descubrir');
    entry.dataset.found=String(found);collection.append(entry);
  }
  shell.append(message,signature,reward,repeat,progress,collection);root.append(shell);
  return ()=>{alive=false;};
}
