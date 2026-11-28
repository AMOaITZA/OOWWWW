// Original mono game sounds. They are synthesized once, then reused as buffers.
export const EFFECT_SAMPLE_RATE=22050;
export const EFFECT_DURATIONS=Object.freeze({meow:.66,splash:.48,
  chime:.7,water:4,crickets:4});
const TAU=Math.PI*2;
export function makeSoundSamples(kind,sampleRate=EFFECT_SAMPLE_RATE){
  const duration=EFFECT_DURATIONS[kind];
  if(!duration)throw new Error('Unknown world sound: '+kind);
  const samples=new Float32Array(Math.ceil(duration*sampleRate));
  let seed=13841+kind.length*7919,low=0,phase=0;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  for(let i=0;i<samples.length;i++){
    const t=i/sampleRate,p=t/duration,n=noise();low=low*.86+n*.14;
    const edge=Math.min(1,t/.007,(duration-t)/.016);
    let value=0;
    if(kind==='meow'){
      const frequency=330+240*Math.sin(Math.PI*Math.min(1,p*1.25))*(1-p*.5);
      phase+=TAU*frequency/sampleRate;
      const envelope=Math.pow(Math.sin(Math.PI*p),.8)*edge;
      value=(Math.sin(phase)*.36+Math.sin(phase*2.01)*.15+
        Math.sin(phase*3)*.07+low*.16)*envelope;
    }else if(kind==='splash'){
      const envelope=Math.pow(1-p,2)*edge;
      value=(low*1.65+n*.12+Math.sin(TAU*(520-370*p)*t)*Math.exp(-p*9)*.12)*envelope;
    }else if(kind==='chime'){
      value=(Math.sin(TAU*660*t)*.24+Math.sin(TAU*990*t)*.12+Math.sin(TAU*1320*t)*.05)*
        Math.exp(-t*5)*edge;
    }else if(kind==='water'){
      const shimmer=.65+.2*Math.sin(TAU*t*.75)+.15*Math.sin(TAU*t*1.25);
      value=low*.72*shimmer;
      for(const start of [.32,1.12,2.25,3.28]){
        const at=t-start;
        if(at>=0&&at<.24)value+=Math.sin(TAU*(390-at*620)*at)*Math.exp(-at*24)*.16;
      }
      value*=edge;
    }else if(kind==='crickets'){
      const group=t%2,chirp=group%.27;
      if(group<1.08&&chirp<.105){
        const envelope=Math.sin(Math.PI*chirp/.105)**2;
        value=(Math.sin(TAU*3150*t)*.23+Math.sin(TAU*3620*t)*.07)*envelope*edge;
      }
    }
    samples[i]=Math.max(-.8,Math.min(.8,value));
  }
  samples[0]=0;samples[samples.length-1]=0;
  return samples;
}
