import {POND_LAYOUT} from './pond-geometry.js';

export const AMBIENT_LIMITS=Object.freeze({petals:50,ripples:7});
const TAU=Math.PI*2;
const visible=(camera,width,height,x,y,w,h)=>x+w>=camera.x&&x<=camera.x+width&&y+h>=camera.y&&y<=camera.y+height;

// A one-time color mask follows the actual water in the artwork. Stones,
// reeds, transparent margins and lily pads can never receive a white ripple.
export function waterMask({width,height,data}){
  const mask=new Uint8Array(width*height);
  for(let i=0;i<mask.length;i++){
    const offset=i*4,r=data[offset],g=data[offset+1],b=data[offset+2];
    if(data[offset+3]>=128&&b>r+8&&g>r+2)mask[i]=1;
  }
  return {width,height,data:mask};
}
function pixelsOf(image){
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(image.data)return {width,height,data:image.data};
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  return ctx.getImageData(0,0,width,height);
}
export function createAmbient({decor=[],getPondImage=()=>null}={}){
  const emitters=decor.filter(tree=>tree.kind==='tree'&&['cerezo','jacaranda'].includes(tree.species)).slice(0,AMBIENT_LIMITS.petals);
  const perEmitter=Math.floor(AMBIENT_LIMITS.petals/Math.max(1,emitters.length));
  const petals=[];
  for(const [emitter,tree] of emitters.entries()){
    const count=Math.min(tree.species==='cerezo'?8:6,perEmitter);
    for(let i=0;i<count&&petals.length<AMBIENT_LIMITS.petals;i++){
      const seed=emitter*97+i*31;
      petals.push({rootX:tree.tile[0]*16,rootY:tree.tile[1]*16,
        x:(seed*17%89)-44,startY:-182+(seed*13%38),fall:158+seed%33,
        duration:11+seed%6,phase:(seed*19%997)/997,
        sway:seed%2?1:-1,color:tree.species==='cerezo'?'#F5CDD2':'#D9C4E4',
        shade:tree.species==='cerezo'?'#D899AA':'#AE92C5'});
    }
  }
  let pondImage=null,mask=null,anchors=[];
  const stats={visiblePetals:0,visibleRipples:0,waterReady:false,motion:'active'};
  function preparePond(){
    const image=getPondImage();
    if(!image||image===pondImage)return;
    const pixels=pixelsOf(image);if(!pixels.width||!pixels.height)return;
    pondImage=image;mask=waterMask(pixels);
    const candidates=[];
    for(let y=8;y<mask.height-8;y+=5)for(let x=8;x<mask.width-8;x+=7)
      if(mask.data[y*mask.width+x])candidates.push({x,y});
    anchors=[];
    for(let i=0;i<AMBIENT_LIMITS.ripples&&i<candidates.length;i++){
      const point=candidates[Math.floor((i+.5)*candidates.length/AMBIENT_LIMITS.ripples)];
      if(point)anchors.push(point);
    }
    stats.waterReady=anchors.length>0;
  }
  function drawGround(ctx,{camera={x:0,y:0},time=0,reducedMotion=false}={}){
    stats.visibleRipples=0;stats.motion=reducedMotion?'reduced':'active';preparePond();
    if(!pondImage||!visible(camera,ctx.canvas.width,ctx.canvas.height,POND_LAYOUT.x,POND_LAYOUT.y,POND_LAYOUT.width,POND_LAYOUT.height))return;
    ctx.drawImage(pondImage,POND_LAYOUT.x,POND_LAYOUT.y,POND_LAYOUT.width,POND_LAYOUT.height);
    if(reducedMotion||!mask)return;
    const sx=POND_LAYOUT.width/mask.width,sy=POND_LAYOUT.height/mask.height;
    ctx.save();ctx.fillStyle='#FFF1DC';
    for(let i=0;i<anchors.length;i++){
      const phase=(Math.max(0,time)/5.6+i*.371)%1;
      const radius=3+Math.floor(phase*9),height=1+Math.floor(phase*3),anchor=anchors[i];
      ctx.globalAlpha=.18*Math.sin(phase*Math.PI);
      let painted=false;
      // Eight short segments suggest a flattened ring, leaving quiet gaps.
      for(let segment=0;segment<8;segment++){
        const angle=segment*TAU/8;
        const px=Math.round(anchor.x+Math.cos(angle)*radius),py=Math.round(anchor.y+Math.sin(angle)*height);
        for(let offset=0;offset<2;offset++){
          const x=px+offset;
          if(x<0||x>=mask.width||py<0||py>=mask.height||!mask.data[py*mask.width+x])continue;
          ctx.fillRect(Math.round(POND_LAYOUT.x+x*sx),Math.round(POND_LAYOUT.y+py*sy),Math.max(1,Math.round(sx)),Math.max(1,Math.round(sy)));painted=true;
        }
      }
      if(painted)stats.visibleRipples++;
    }
    ctx.restore();
  }
  function drawAir(ctx,{camera={x:0,y:0},time=0,reducedMotion=false}={}){
    stats.visiblePetals=0;stats.motion=reducedMotion?'reduced':'active';
    if(reducedMotion)return;
    ctx.save();
    for(const petal of petals){
      if(!visible(camera,ctx.canvas.width,ctx.canvas.height,petal.rootX-74,petal.rootY-205,148,232))continue;
      const phase=(Math.max(0,time)/petal.duration+petal.phase)%1;
      const x=Math.round(petal.rootX+petal.x+phase*18+Math.sin(phase*TAU*1.6+petal.phase*TAU)*7*petal.sway);
      const y=Math.round(petal.rootY+petal.startY+phase*petal.fall);
      if(!visible(camera,ctx.canvas.width,ctx.canvas.height,x,y,3,2))continue;
      ctx.globalAlpha=Math.min(1,phase*8,(1-phase)*7)*.82;
      ctx.fillStyle=petal.color;ctx.fillRect(x,y,2,1);
      ctx.fillStyle=petal.shade;ctx.fillRect(x+(Math.floor(phase*8)%2),y+1,1,1);
      stats.visiblePetals++;
    }
    ctx.restore();
  }
  return {drawGround,drawAir,getStats:()=>({...stats})};
}
