/* YIN difference / cumulative mean normalization, with sub-sample interpolation. */
(function(root){
  'use strict';
  // Reject near-silence, not soft fingerpicking. YIN's normalized difference
  // still requires a periodic signal; lowering this floor does not relax it.
  const minLevel=0.0005;
  function detect(samples, sampleRate, {maxFrequency=1000}={}){
    // Decimate to ~12 kHz: enough resolution for open strings, low CPU on phones.
    const step=Math.max(1,Math.floor(sampleRate/12000)), rate=sampleRate/step;
    const size=Math.floor(samples.length/step), x=new Float32Array(size);
    let energy=0,mean=0;
    for(let i=0;i<size;i++){let sum=0;for(let j=0;j<step;j++)sum+=samples[i*step+j];x[i]=sum/step;mean+=x[i];}
    mean/=size;
    for(let i=0;i<size;i++){x[i]-=mean;energy+=x[i]*x[i];}
    if(Math.sqrt(energy/size)<minLevel)return null;
    const max=Math.min(Math.floor(rate/32),Math.floor(size/2)-1), min=Math.floor(rate/maxFrequency), span=size-max;
    const d=new Float32Array(max+1);let total=0;
    for(let lag=1;lag<=max;lag++){
      let sum=0;for(let i=0;i<span;i++){const delta=x[i]-x[i+lag];sum+=delta*delta;}
      total+=sum;d[lag]=total?sum*lag/total:1;
    }
    for(let lag=Math.max(2,min);lag<max;lag++){
      if(d[lag]>=0.12)continue;
      while(lag+1<max&&d[lag+1]<d[lag])lag++;
      const a=d[lag-1],b=d[lag],c=d[lag+1],den=a-2*b+c;
      const offset=den?(a-c)/(2*den):0;
      return rate/(lag+Math.max(-1,Math.min(1,offset)));
    }
    return null;
  }
  const frequency=midi=>440*Math.pow(2,(midi-69)/12);
  const cents=(hz,midi)=>1200*Math.log2(hz/frequency(midi));
  const closest=(hz,courses)=>courses.reduce((best,c,i)=>Math.abs(cents(hz,c.midi))<Math.abs(cents(hz,courses[best].midi))?i:best,0);
  const api={detect,frequency,cents,closest,minLevel};
  if(typeof module==='object')module.exports=api;else root.FretboardPitch=api;
})(typeof window==='object'?window:globalThis);
