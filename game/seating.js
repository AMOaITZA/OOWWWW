// Measured opaque bounds, rather than transparent cell dimensions, define the
// visible size of bench art. The original pair's heads are 13 px across while
// a standing head is 26–27 px; an integer 2× restores that facial scale.
const cache=new WeakMap();
const originalFrames=[{x:15,y:7,width:36,height:36},{x:13,y:7,width:36,height:36}];
export const BENCH_VISIBLE={x:9,y:7,width:39,height:28};
export const BENCH_SCALE=2;
export const BENCH_WIDTH=BENCH_VISIBLE.width*BENCH_SCALE;
export const BENCH_HEIGHT=BENCH_VISIBLE.height*BENCH_SCALE;

export function opaqueFrameBounds({data,width,height},frameCount=2){
  const frameWidth=width/frameCount;
  if(!Number.isInteger(frameWidth))throw new Error('La hoja de banca requiere celdas completas');
  return Array.from({length:frameCount},(_,frame)=>{
    let left=frameWidth,top=height,right=-1,bottom=-1;
    const rowSpans=[];
    for(let y=0;y<height;y++){
      let rowLeft=frameWidth,rowRight=-1;
      for(let x=0;x<frameWidth;x++)if(data[(y*width+frame*frameWidth+x)*4+3]>=128){
        left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
        rowLeft=Math.min(rowLeft,x);rowRight=Math.max(rowRight,x);
      }
      if(rowRight>=rowLeft)rowSpans.push({y,width:rowRight-rowLeft+1});
    }
    if(right<left)throw new Error('La hoja de banca contiene un fotograma vacío');
    const contentWidth=right-left+1;
    // Before the wide bench/backrest starts, the widest occupied row belongs
    // to the two heads. Decorative hearts above them do not affect the max.
    const firstWide=rowSpans.find(row=>row.width>=contentWidth*.9)?.y??bottom;
    const headSpan=Math.max(1,...rowSpans.filter(row=>row.y<firstWide).map(row=>row.width));
    return {x:left,y:top,width:contentWidth,height:bottom-top+1,headWidth:headSpan/2};
  });
}

function framesFor(image){
  if(!image||typeof image!=='object')return {frames:originalFrames,frameWidth:64,scale:2};
  if(cache.has(image))return cache.get(image);
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  let result={frames:originalFrames,frameWidth:64,scale:2};
  if(width&&height){
    try{
      let pixels=image;
      if(!image.data){
        const c=document.createElement('canvas');c.width=width;c.height=height;
        const context=c.getContext('2d',{willReadFrequently:true});
        context.drawImage(image,0,0);pixels=context.getImageData(0,0,width,height);
      }
      const frames=opaqueFrameBounds(pixels);
      const headWidth=Math.max(...frames.map(frame=>frame.headWidth));
      // A future correctly proportioned sheet already has ~26px heads and
      // stays at 1×. The inherited miniature sheet requires 2×, never stretch.
      result={frames,frameWidth:width/2,scale:Math.max(1,Math.min(2,Math.round(26/headWidth)))};
    }catch{/* A fallback remains readable before pixels can be inspected. */}
  }
  cache.set(image,result);return result;
}

export function seatedGeometry(image,frame,x,groundY){
  const {frames,frameWidth,scale}=framesFor(image),index=frame%frames.length;
  const source=frames[index],width=source.width*scale,height=source.height*scale;
  return {source:{x:index*frameWidth+source.x,y:source.y,width:source.width,height:source.height},
    x:Math.round(x-width/2),y:Math.round(groundY-height),width,height,scale,
    // The speaker anchor follows Leo's head within the actual visible crop.
    anchor:{x:Math.round(x-width*.2),y:Math.round(groundY-height+height*.3)}};
}
export function drawSeatedPair(ctx,image,frame,x,groundY){
  const pose=seatedGeometry(image,frame,x,groundY),s=pose.source;
  ctx.drawImage(image,s.x,s.y,s.width,s.height,pose.x,pose.y,pose.width,pose.height);
  return pose;
}
export function benchGeometry(x,groundY){
  return {x:Math.round(x-BENCH_WIDTH/2),y:Math.round(groundY-BENCH_HEIGHT),width:BENCH_WIDTH,height:BENCH_HEIGHT};
}
export function drawBench(ctx,image,x,groundY){
  const s=BENCH_VISIBLE,b=benchGeometry(x,groundY);
  ctx.drawImage(image,s.x,s.y,s.width,s.height,b.x,b.y,b.width,b.height);
  return b;
}
