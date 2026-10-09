// Deterministic harmonic PCM, transformed with the Web Audio Blackman window.
const N=16384;
function samples(midis,{rate=48000,detune=0,slope=1.2,second=1,levels=[],noise=0,offset=0,gain=1,decay=0,length=N}={}){
 const data=new Float32Array(length);
 let seed=13; const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<length;i++){
  let value=noise*(random()*2-1);
  midis.forEach((m,j)=>{const hz=440*2**((m-69+detune/100)/12);for(let h=1;h<=12;h++)if(hz*h<rate/2)value+=gain*Math.exp(-decay*i/rate)*(levels[j]??1)*.08*Math.sin(2*Math.PI*hz*h*(i+offset)/rate+j*.2)/(h**slope)*(h===2?second:1)});
  data[i]=value;
 }
 return data;
}
function spectrum(midis,options={}){
 const data=samples(midis,options),real=Float64Array.from(data,(value,i)=>value*(.42-.5*Math.cos(2*Math.PI*i/N)+.08*Math.cos(4*Math.PI*i/N))),imag=new Float64Array(N);
 for(let i=1,j=0;i<N;i++){let bit=N>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[real[i],real[j]]=[real[j],real[i]]}
 for(let len=2;len<=N;len<<=1){const angle=-2*Math.PI/len;for(let i=0;i<N;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const a=i+j,b=a+len/2,tr=wr*real[b]-wi*imag[b],ti=wr*imag[b]+wi*real[b];real[b]=real[a]-tr;imag[b]=imag[a]-ti;real[a]+=tr;imag[a]+=ti;const w=wr;wr=w*Math.cos(angle)-wi*Math.sin(angle);wi=w*Math.sin(angle)+wi*Math.cos(angle)}}}
 return Float32Array.from(real.subarray(0,N/2),(v,i)=>20*Math.log10(Math.max(1e-12,Math.hypot(v,imag[i])/N)));
}
module.exports={samples,spectrum,N};
