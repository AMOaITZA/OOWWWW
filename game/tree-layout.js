// Trees use an integer scale and anchor their last opaque root to the ground.
// Transparent padding is never interpreted as canopy size or root height.
export const TREE_SCALE=2;
const cached=new WeakMap();
function sourceBounds(image){
  if(image&&cached.has(image))return cached.get(image);
  const width=image?.naturalWidth||image?.width||48,height=image?.naturalHeight||image?.height||84;
  let box={x:0,y:0,width,height};
  try{
    let data=image?.data;
    if(!data&&typeof document!=='undefined'){
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      data=ctx.getImageData(0,0,width,height).data;
    }
    if(data){
      let left=width,top=height,right=-1,bottom=-1;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=128){
        left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
      }
      if(right>=left)box={x:left,y:top,width:right-left+1,height:bottom-top+1};
    }
  }catch{}
  const result={width,height,box};if(image&&typeof image==='object')cached.set(image,result);return result;
}
export function treeDrawGeometry(tree,image){
  const source=sourceBounds(image),scale=TREE_SCALE;
  const x=Math.round(tree.tile[0]*16-(source.box.x+source.box.width/2)*scale);
  const y=Math.round(tree.tile[1]*16+1-(source.box.y+source.box.height)*scale);
  return {x,y,width:source.width*scale,height:source.height*scale,scale,
    visible:{x:x+source.box.x*scale,y:y+source.box.y*scale,
      width:source.box.width*scale,height:source.box.height*scale}};
}
export const treeWorldBounds=(tree,image)=>treeDrawGeometry(tree,image).visible;
