// Pack the three new botanical illustrations alongside the original flowers.
// Usage: node scripts/prepare-flowers-v16.mjs <generated 1086x1448 sheet>
import {readFileSync,writeFileSync} from 'node:fs';
import {PNG} from 'pngjs';

const atlasPath='assets/game/garden/flowers.png';
const source=PNG.sync.read(readFileSync(process.argv[2]));
if(source.width!==1086||source.height!==1448)throw Error('Expected the 1086×1448 generated flower sheet');
const original=PNG.sync.read(readFileSync(atlasPath));
const atlas=new PNG({width:192,height:128});
PNG.bitblt(original,atlas,0,0,96,128,0,0);

const palette=[
  '553d32','6c4e37','885f3f','ad824e','c4a26c','dbc391','f1ddb1',
  '444c2e','586038','717647','89905a','a1a76d','b9bd87',
  '915263','aa6177','c97688','db8799','e09eae','f0b8bd','f8c9cc',
  'a45f55','bc7769','d78c80','eaa193','f4b6a5','fbc9b7','ffe1d3',
  'b29369','ceb182','ecd39f','f8eac8','fff6df','fff9ed','ba873a','e5b459',
  '676666','80898a','98a7a8','b4c4c4','d8d9cb','f3e9ce'
].map(hex=>hex.match(/../g).map(value=>parseInt(value,16)));

function colorFor(red,green,blue){
  let best,closest=Infinity;
  for(const color of palette){
    const distance=2*(color[0]-red)**2+3*(color[1]-green)**2+2*(color[2]-blue)**2;
    if(distance<closest){closest=distance;best=color;}
  }
  return best;
}
function visibleBounds(xMin,xMax,yMin,yMax){
  let left=xMax,right=xMin,top=yMax,bottom=yMin;
  for(let y=yMin;y<yMax;y++)for(let x=xMin;x<xMax;x++){
    if(source.data[(y*source.width+x)*4+3]<160)continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return {left,top,width:right-left+1,height:bottom-top+1};
}

const rows=[0,250,560,1015,1448],dimensions=[[16,11],[20,22],[28,29],[29,31]];
for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const bounds=visibleBounds(col*362,(col+1)*362,rows[row],rows[row+1]);
  const scale=Math.min(dimensions[row][0]/bounds.width,dimensions[row][1]/bounds.height);
  const w=Math.round(bounds.width*scale),h=Math.round(bounds.height*scale);
  const left=(col+3)*32+Math.floor((32-w)/2),top=(row+1)*32-1-h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    // Aggregate the generated pixels to keep thin stems connected at game scale.
    const rgb=[0,0,0];let ink=0;
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
      const sx=bounds.left+Math.floor((x+(dx+.5)/4)*bounds.width/w);
      const sy=bounds.top+Math.floor((y+(dy+.5)/4)*bounds.height/h);
      const i=(sy*source.width+sx)*4;
      if(source.data[i+3]<128)continue;
      for(let c=0;c<3;c++)rgb[c]+=source.data[i+c];
      ink++;
    }
    if(ink<6)continue;
    const color=colorFor(...rgb.map(value=>value/ink));
    atlas.data.set([...color,255],((top+y)*atlas.width+left+x)*4);
  }
}
writeFileSync(atlasPath,PNG.sync.write(atlas));
