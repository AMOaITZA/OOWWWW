const DB_NAME='oowwww-retratos-v1';
const STORE='photos';
export const PHOTO_LIMIT=60;
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
export function normalizeCamera(value={}){
  return {shots:Math.max(0,Math.min(1000000,Math.floor(finite(value?.shots)))),lastPhotoAt:Math.max(0,finite(value?.lastPhotoAt))};
}
export function photoFilename(photo){
  const name=String(photo?.title||'nuestro-mundo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'nuestro-mundo';
  const date=new Date(finite(photo?.createdAt,Date.now())).toISOString().slice(0,10);
  return 'itza-y-leo-'+name+'-'+date+'.png';
}
export function createPhotoStore({indexedDB=globalThis.indexedDB}={}){
  const memory=new Map();let database=null,opening=null,storage='persistent';
  async function db(){
    if(!indexedDB){storage='session';return null;}
    if(database)return database;
    if(opening)return opening;
    opening=new Promise(resolve=>{
      let request;try{request=indexedDB.open(DB_NAME,1);}catch{storage='session';resolve(null);return;}
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});};
      request.onsuccess=()=>{database=request.result;database.onversionchange=()=>{database.close();database=null;};resolve(database);};
      request.onerror=()=>{storage='session';resolve(null);};
      request.onblocked=()=>{storage='session';resolve(null);};
    });
    return opening;
  }
  async function transact(mode,run){
    const database=await db();if(!database)return null;
    return new Promise((resolve,reject)=>{
      try{
        const tx=database.transaction(STORE,mode);let value;
        const request=run(tx.objectStore(STORE));
        request.onsuccess=()=>{value=request.result;};
        tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error||new Error('No se pudo guardar la foto'));tx.onabort=()=>reject(tx.error||new Error('Guardado cancelado'));
      }catch(error){reject(error);}
    });
  }
  async function list(){
    let stored=[];try{stored=await transact('readonly',store=>store.getAll())||[];}catch{storage='session';}
    const all=new Map(stored.map(photo=>[photo.id,{...photo,durable:true}]));
    for(const [id,photo]of memory)all.set(id,photo);
    return [...all.values()].sort((a,b)=>b.createdAt-a.createdAt||b.id.localeCompare(a.id)).map(({blob,...metadata})=>metadata);
  }
  async function put(input){
    if(!(input?.blob instanceof Blob)||!input.blob.size)throw new Error('La foto está vacía. Intenta otra vez.');
    if((await list()).length>=PHOTO_LIMIT)throw new Error('Tu álbum tiene 60 fotos. Descarga o elimina alguna para guardar otra.');
    const createdAt=Number.isFinite(input.createdAt)?input.createdAt:Date.now();
    const id=input.id||globalThis.crypto?.randomUUID?.()||createdAt.toString(36)+'-'+Math.random().toString(36).slice(2,9);
    const photo={id,createdAt,title:String(input.title||'Nuestro mundo').slice(0,100),pose:String(input.pose||'natural'),width:Math.max(1,finite(input.width,1)),height:Math.max(1,finite(input.height,1)),blob:input.blob};
    try{const result=await transact('readwrite',store=>store.put(photo));if(result!==null)return {...photo,durable:true};}catch{storage='session';}
    const sessionPhoto={...photo,durable:false};memory.set(id,sessionPhoto);return sessionPhoto;
  }
  async function get(id){
    if(memory.has(id))return memory.get(id);
    try{const photo=await transact('readonly',store=>store.get(id));return photo?{...photo,durable:true}:null;}catch{storage='session';return null;}
  }
  async function remove(id){
    // Never claim a persistent deletion succeeded when IndexedDB rejected it.
    if(memory.has(id)){memory.delete(id);return true;}
    const existing=await get(id);if(!existing)return false;
    const database=await db();if(!database)throw new Error('No pudimos abrir el álbum para eliminar esta foto.');
    await transact('readwrite',store=>store.delete(id));return true;
  }
  function close(){database?.close();database=null;opening=null;}
  return {list,put,get,remove,close,storage:()=>storage};
}
