// Deterministic harmonic PCM, transformed with the Web Audio Blackman window.
const N=16384;
function samples(midis,{rate=48000,detune=0,slope=1.2,second=1,levels=[],noise=0,offset=0,gain=1,decay=0,length=N,pluck=0,onsets=[],partialDecay=0}={}){
 const data=new Float32Array(length);
 let seed=13; const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<length;i++){
  let value=noise*(random()*2-1);
  midis.forEach((m,j)=>{
   const hz=440*2**((m-69+detune/100)/12),time=(i+offset)/rate-(onsets[j]||0);if(time<0)return;
   for(let h=1;h<=12;h++)if(hz*h<rate/2)value+=gain*Math.exp(-(decay+partialDecay*(h-1))*time)*(levels[j]??1)*.08*Math.sin(2*Math.PI*hz*h*time+j*.2)/(h**slope)*(h===2?second:1)*(pluck?Math.abs(Math.sin(Math.PI*h*pluck)):1);
  });
  data[i]=value;
 }
 return data;
}
function spectrum(midis,options={}){
 return spectrumOf(samples(midis,options));
}
function spectrumOf(data){
 const N=data.length;
 const real=Float64Array.from(data,(value,i)=>value*(.42-.5*Math.cos(2*Math.PI*i/N)+.08*Math.cos(4*Math.PI*i/N))),imag=new Float64Array(N);
 for(let i=1,j=0;i<N;i++){let bit=N>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[real[i],real[j]]=[real[j],real[i]]}
 for(let len=2;len<=N;len<<=1){const angle=-2*Math.PI/len;for(let i=0;i<N;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const a=i+j,b=a+len/2,tr=wr*real[b]-wi*imag[b],ti=wr*imag[b]+wi*real[b];real[b]=real[a]-tr;imag[b]=imag[a]-ti;real[a]+=tr;imag[a]+=ti;const w=wr;wr=w*Math.cos(angle)-wi*Math.sin(angle);wi=w*Math.sin(angle)+wi*Math.cos(angle)}}}
 return Float32Array.from(real.subarray(0,N/2),(v,i)=>20*Math.log10(Math.max(1e-12,Math.hypot(v,imag[i])/N)));
}
// One continuous microphone recording: analysis frames must include real
// transition history rather than a fresh stationary buffer for every target.
function phrase(segments,{rate=48000,gain=.08,noise=.00003}={}){
 const data=new Float32Array(Math.round(segments.reduce((sum,s)=>sum+s.durationMs,0)*rate/1000));
 const phases=[];let start=0,seed=17;
 for(const segment of segments){
  const end=Math.min(data.length,start+Math.round(segment.durationMs*rate/1000));
  for(let i=start;i<end;i++){
   const age=(i-start)/rate,glide=Math.min(1,age*1000/(segment.glideMs||1));
   seed=(seed*1664525+1013904223)>>>0;let value=noise*(seed/4294967296*2-1);
   segment.midis.forEach((midi,j)=>{
    const pitch=j===0&&segment.fromMidi!==undefined?segment.fromMidi+(midi-segment.fromMidi)*glide:midi;
    phases[j]=(phases[j]||0)+2*Math.PI*440*2**((pitch-69+(segment.detune||0)/100)/12)/rate;
    for(let h=1;h<=8;h++)value+=gain*.08*(segment.levels?.[j]??1)*Math.sin(phases[j]*h)/h**1.2;
   });
   data[i]=value;
  }
  start=end;
 }
 return data;
}
module.exports={samples,spectrum,spectrumOf,phrase,N};

