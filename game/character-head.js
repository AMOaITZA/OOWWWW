import {hairMaskPixel} from './hair.js';

// Measured on the first native 32×48 frame, in down / right / back order.
// The lower contour is part of the head: wedding jaws reach row 26 and the
// casual Leo head reaches row 27. A shared rectangular crop at row 24 removed
// those rows, including the chin outline. Only the narrow neck continues below.
const shapes={
  leo:{
    principal:[{bottom:24},{bottom:23,neck:[[25,18,20],[26,18,20]]},{bottom:24}],
    alternativo:[{bottom:27,neck:[[28,15,17]]},{bottom:25,neck:[[26,16,24]]},{bottom:25}],
    boda:[{bottom:26,neck:[[27,15,17]]},{bottom:25,neck:[[26,17,19]]},{bottom:25}]
  },
  itza:{
    principal:[{bottom:25,neck:[[26,14,17],[27,14,17]]},{bottom:24},{bottom:24}],
    alternativo:[{bottom:26,neck:[[27,14,17]]},{bottom:25,neck:[[26,20,22],[27,20,22]]},{bottom:26}],
    boda:[{bottom:26,neck:[[27,11,15]]},{bottom:25,neck:[[26,18,20],[27,19,21]]},{bottom:25}]
  }
};
export function characterHeadPixel(who,look,direction,x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=32||y<0||y>=48)return false;
  const shape=shapes[who]?.[look]?.[direction];
  if(!shape)return false;
  return y<=shape.bottom||Boolean(shape.neck?.some(([row,left,right])=>y===row&&x>=left&&x<=right));
}
function darkHair(r,g,b){
  const light=Math.max(r,g,b);
  return light<=112&&light-Math.min(r,g,b)<=48&&!(r>g&&g>b&&r-b>20);
}

// Separate rear/front hair lets a generated action body retain its arms while
// the real personalized face and its complete jaw are drawn above the body.
// This returns pixels, so fishing and dancing can share the same anatomy.
export function splitCharacterHeadPixels(personalized,raw=personalized,{who,look,direction=0,
  width=40,height=56,offsetX=4,offsetY=0}={}){
  const head=new Uint8ClampedArray(width*height*4),hair=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<41;y++)for(let x=0;x<32;x++){
    const dx=x+offsetX,dy=y+offsetY;
    if(dx<0||dy<0||dx>=width||dy>=height)continue;
    const from=((direction*48+y)*personalized.width+x)*4,to=(dy*width+dx)*4;
    if(!personalized.data[from+3])continue;
    if(characterHeadPixel(who,look,direction,x,y))
      head.set(personalized.data.subarray(from,from+4),to);
    else if(who==='itza'&&hairMaskPixel('walk-'+look,0,direction,x,y)&&
      darkHair(...raw.data.subarray(((direction*48+y)*raw.width+x)*4,((direction*48+y)*raw.width+x)*4+3)))
      hair.set(personalized.data.subarray(from,from+4),to);
  }
  return {head,hair,width,height};
}
