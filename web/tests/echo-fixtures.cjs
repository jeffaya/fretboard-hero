const fs=require('node:fs'),vm=require('node:vm'),echo=require('../core/routine-echo.js');
function runtime(rate=48000){
 let now=1000;const sources=[];
 class Context{
  constructor(){this.sampleRate=rate;this.state='running';this.destination={}}
  get currentTime(){return now/1000}
  getOutputTimestamp(){return {contextTime:now/1000,performanceTime:now}}
  resume(){return Promise.resolve()}close(){this.state='closed';return Promise.resolve()}
  createBuffer(_,length,rate){const data=new Float32Array(length);return {length,sampleRate:rate,getChannelData:()=>data}}
  createBufferSource(){const source={connect(){},disconnect(){},start(at){this.at=at},stop(){this.stopped=now}};sources.push(source);return source}
 }
 const c={window:{AudioContext:Context},performance:{now:()=>now},RoutineEcho:echo};
 vm.runInNewContext(fs.readFileSync(require.resolve('../core/routine-rhythm-audio.js'),'utf8'),c);
 return {audio:c.window.RoutineRhythmAudio.create(),sources,setTime:t=>now=t};
}
function capture(pcm,rate,{now=1120,start=1000,delay=60,gain=.6,guitar=0,noise=.00002,reflection=false,percussive=false}={}){
 let seed=303,filtered=0;const output=new Float32Array(16384),sampleAt=i=>i>=0&&i<pcm.length?pcm[i]:0;
 for(let i=0;i<output.length;i++){
  const t=now-(output.length-i)*1000/rate,index=Math.round((t-start-delay)*rate/1000),age=(t-start-delay)/1000;
  const direct=sampleAt(index);filtered=.65*filtered+.35*direct;
  let value=gain*(reflection?filtered+.35*sampleAt(index-Math.round(rate*.017))+.2*sampleAt(index-Math.round(rate*.043)):direct);
  seed=seed*16807%2147483647;value+=noise*(seed/2147483647*2-1);
  if(age>=0&&age<.2){
   if(percussive)value+=guitar*(seed/2147483647*2-1)*Math.exp(-age*40);
   else for(const freq of [110,164.81,220,261.63,329.63])for(let h=1;h<=4;h++)value+=guitar/5/h*Math.sin(2*Math.PI*freq*h*age+.3)*Math.exp(-age*5);
  }
  output[i]=value;
 }
 return output;
}
module.exports={runtime,capture};
