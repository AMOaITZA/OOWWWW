import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const destination=resolve(root,'assets/game/wedding/atlas.png');
const chunks=Array.from({length:8},(_,i)=>resolve(root,'assets/game/wedding/atlas.b64/'+String(i).padStart(2,'0')+'.txt'));
if(chunks.every(existsSync)){
  const encoded=chunks.map(file=>readFileSync(file,'utf8').trim()).join('');
  const buffer=Buffer.from(encoded,'base64');
  const signature=Buffer.from([137,80,78,71,13,10,26,10]);
  if(buffer.length<10000||!buffer.subarray(0,8).equals(signature)){
    throw Error('La hoja de boda está incompleta o contiene datos inválidos');
  }
  mkdirSync(dirname(destination),{recursive:true});
  if(!existsSync(destination)||!readFileSync(destination).equals(buffer)){
    writeFileSync(destination,buffer);
    console.log('[OOWWWW] Recursos de boda instalados: '+buffer.length+' bytes');
  }
}else{
  console.warn('[OOWWWW] Faltan partes del atlas de boda; se usarán dibujos provisionales.');
}
