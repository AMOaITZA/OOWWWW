// Measured opaque bounds, rather than transparent cell dimensions, define the
// visible size of the current generated bench art.
const cache=new WeakMap();
const defaultFrames=[{x:2,y:4,width:75,height:59},{x:2,y:4,width:75,height:59}];
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
  if(!image||typeof image!=='object')return {frames:defaultFrames,frameWidth:80,scale:1};
  if(cache.has(image))return cache.get(image);
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  let result={frames:defaultFrames,frameWidth:80,scale:1};
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
      // Select an integer uniform scale from the actual head span; the
      // installed full-size heads keep their native 1× pixels.
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
