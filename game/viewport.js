// One world pixel always occupies the same whole number of CSS pixels in both
// axes. The tiny overscan is clipped by the frame instead of stretching sprites.
export function worldViewport(width,height,{worldWidth=1920,worldHeight=1280}={}){
  const cssWidth=Math.max(1,Math.ceil(Number(width)||1));
  const cssHeight=Math.max(1,Math.ceil(Number(height)||1));
  const shorter=Math.min(cssWidth,cssHeight);
  const preferred=shorter<600?2:shorter<1000?3:4;
  const scale=Math.max(preferred,Math.ceil(cssWidth/worldWidth),Math.ceil(cssHeight/worldHeight));
  const logicalWidth=Math.min(worldWidth,Math.ceil(cssWidth/scale));
  const logicalHeight=Math.min(worldHeight,Math.ceil(cssHeight/scale));
  return {width:logicalWidth,height:logicalHeight,scale,
    cssWidth:logicalWidth*scale,cssHeight:logicalHeight*scale};
}

// Architecture can lift the view while approaching it, but the couple's feet
// must remain above the bottom controls even on a short phone in landscape.
export function approachLift(requested,height,bottomInset=0,scale=1){
  return Math.min(Math.max(0,requested),Math.max(0,Math.floor(height/2-bottomInset/scale)));
}
