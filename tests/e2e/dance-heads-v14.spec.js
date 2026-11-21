import {test,expect} from '@playwright/test';

test('all eight delivered dance poses retain the complete native jaws in every personalized outfit',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/__dance-heads-v14',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.goto('/__dance-heads-v14');
  const result=await page.evaluate(async()=>{
    const assets=await import('/game/assets.js'),dance=await import('/game/dance.js');
    const wardrobe=await import('/game/wardrobe.js');await assets.prepareWorldAssets();
    const points={
      leo:{principal:[[[15,24],[18,24],[12,24]],[[19,23],[22,23]]],alternativo:[[[11,26],[20,26],[12,27]],[[16,25],[22,25],[18,26]]],boda:[[[13,25],[20,25],[14,26]],[[17,24],[23,24],[18,25]]]},
      itza:{principal:[[[14,24],[20,24],[14,25]],[[20,23],[21,24]]],alternativo:[[[14,25],[18,25],[16,26]],[[21,24],[24,24],[23,25]]],boda:[[[10,25],[16,25],[13,26]],[[21,24],[24,24],[24,25]]]}
    };
    const canvas=document.createElement('canvas');canvas.width=120;canvas.height=84;
    const ctx=canvas.getContext('2d'),original=CanvasRenderingContext2D.prototype.drawImage;
    const mismatches=[],variants=new Set();let samples=0,current;
    const pixels=new WeakMap();
    function dataOf(image){
      if(pixels.has(image))return pixels.get(image);
      const sample=document.createElement('canvas');sample.width=image.naturalWidth||image.width;sample.height=image.naturalHeight||image.height;
      original.call(sample.getContext('2d'),image,0,0);
      const data=sample.getContext('2d').getImageData(0,0,sample.width,sample.height);pixels.set(image,data);return data;
    }
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      const actor=args[0],who=actor?.dataset?.danceCharacter;
      if(who){
        const look=current[who].look,direction=Number(actor.dataset.danceHeadDirection),pose=Number(actor.dataset.dancePose);
        const source=assets.outfitImage(wardrobe.getSelectedLook(current,who).sheet,current),raw=dataOf(source),painted=dataOf(actor);
        variants.add([who,look,who==='itza'?current.itza.hair:'',current[who].glasses,pose].join(':'));
        if(direction<2)for(const [x,y] of points[who][look][direction]){
          samples++;const from=((direction*48+y)*raw.width+x)*4,to=(y*40+x+4)*4;
          const wanted=[...raw.data.subarray(from,from+4)],found=[...painted.data.subarray(to,to+4)];
          if(wanted[3]!==255||wanted.some((value,i)=>value!==found[i]))mismatches.push({who,look,direction,pose,x,y,wanted,found});
        }
      }
      return original.apply(this,args);
    };
    try{
      for(const look of ['principal','alternativo','boda'])for(const hair of ['negro','cafe','rosa','rubio'])for(const glasses of [true,false]){
        current={leo:{look,glasses},itza:{look,hair,glasses}};await assets.prepareOutfit(current);
        for(let frame=0;frame<16;frame++)dance.drawDancingPair(ctx,{x:60,y:70,time:(frame+.5)*.3,outfits:current,
          getCharacterImage:url=>assets.outfitImage(url,current),getRawImage:assets.assetImage,getDanceImage:assets.assetImage});
      }
    }finally{CanvasRenderingContext2D.prototype.drawImage=original;}
    return {variants:variants.size,samples,mismatches};
  });
  expect(result.variants).toBe(240);expect(result.samples).toBeGreaterThan(1500);
  expect(result.mismatches).toEqual([]);expect(errors).toEqual([]);
});
