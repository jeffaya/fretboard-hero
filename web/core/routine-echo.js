/* Match only the application's known playback waveform, never a timing window. */
(function(root){
  'use strict';
  const RATE=4000,WINDOW_MS=90,DELAY_MS=450;
  function render(stroke,rate){
    const duration=stroke.mute==='percussive'?.035:stroke.mute==='palm'?.065:.13;
    const frequency=stroke.mute==='percussive'?1600:stroke.mute==='palm'?450:850;
    const omega=2*Math.PI*frequency/rate,alpha=Math.sin(omega)/(2*.7),a0=1+alpha;
    const b0=alpha/a0,b2=-b0,a1=-2*Math.cos(omega)/a0,a2=(1-alpha)/a0;
    const data=new Float32Array(Math.ceil(rate*(duration+.01))),volume=stroke.accent?.65:.4;
    // Band-limit the reference before speaker playback so downsampling does
    // not turn fractional device latency into an unrelated aliased waveform.
    let power=0;let seed=17,x1=0,x2=0,y1=0,y2=0;const low=new Float64Array(4),cut=1-Math.exp(-2*Math.PI*900/rate);
    for(let i=0;i<data.length;i++){
      seed=seed*16807%2147483647;const x=seed/2147483647*2-1,t=i/rate;
      const y=b0*x+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;
      const gain=t<.003?.0001+(volume-.0001)*t/.003:t<duration?volume*Math.pow(.0001/volume,(t-.003)/(duration-.003)):.0001;
      power+=(y*gain)**2;let value=y*gain;for(let pole=0;pole<low.length;pole++){low[pole]+=cut*(value-low[pole]);value=low[pole]}data[i]=value;
    }
    // Preserve the original preview loudness and accent ratio.
    const loudness=Math.sqrt(power/(data.reduce((sum,x)=>sum+x*x,0)||1));
    for(let i=0;i<data.length;i++)data[i]*=loudness;
    return data;
  }
  // Fractional integration avoids phase-dependent aliasing at 44.1 kHz.
  function average(data,a,b){
    let sum=0;
    for(let i=Math.max(0,Math.floor(a));i<Math.min(data.length,Math.ceil(b));i++)sum+=data[i]*(Math.min(b,i+1)-Math.max(a,i));
    return sum/Math.max(1e-9,b-a);
  }
  function reduce(samples,rate){
    const length=Math.round(WINDOW_MS*RATE/1000),out=new Float64Array(length),start=samples.length-WINDOW_MS*rate/1000;
    let mean=0;
    for(let i=0;i<length;i++){
      out[i]=average(samples,start+i*rate/RATE,start+(i+1)*rate/RATE);mean+=out[i];
    }
    mean/=length;for(let i=0;i<length;i++)out[i]-=mean;return out;
  }
  const energy=data=>data.reduce((sum,x)=>sum+x*x,0);
  function strongest(input,reference,lead){
    let best={score:0,lag:0};const power=energy(input);
    if(power<1e-12)return best;
    for(let lag=0;lag<=lead;lag++){
      let dot=0,refPower=0,mean=0;
      for(let i=0;i<input.length;i++){const x=reference[lead+i-lag]||0;dot+=input[i]*x;refPower+=x*x;mean+=x}
      refPower-=mean*mean/input.length;const score=refPower>1e-10?dot*dot/(power*refPower):0;
      if(score>best.score)best={score,lag};
    }
    return best;
  }
  function project(input,reference,lead,lags){
    const columns=lags.map(lag=>Float64Array.from(input,(_,i)=>reference[lead+i-lag]||0)),n=columns.length;
    for(const column of columns){const mean=column.reduce((sum,x)=>sum+x,0)/column.length;for(let i=0;i<column.length;i++)column[i]-=mean}
    const matrix=Array.from({length:n},()=>new Float64Array(n+1));let trace=0;
    for(let i=0;i<n;i++){
      for(let j=i;j<n;j++){let value=0;for(let k=0;k<input.length;k++)value+=columns[i][k]*columns[j][k];matrix[i][j]=matrix[j][i]=value}
      for(let k=0;k<input.length;k++)matrix[i][n]+=columns[i][k]*input[k];trace+=matrix[i][i];
    }
    // Ridge regularization prevents narrow-band playback from fitting arbitrary
    // microphone noise with huge, mutually cancelling filter coefficients.
    for(let i=0;i<n;i++)matrix[i][i]+=Math.max(1e-10,trace/n*1e-4);
    for(let i=0;i<n;i++){
      let pivot=i;for(let j=i+1;j<n;j++)if(Math.abs(matrix[j][i])>Math.abs(matrix[pivot][i]))pivot=j;
      [matrix[i],matrix[pivot]]=[matrix[pivot],matrix[i]];
      const divisor=matrix[i][i];if(Math.abs(divisor)<1e-14)continue;
      for(let k=i;k<=n;k++)matrix[i][k]/=divisor;
      for(let j=i+1;j<n;j++){const factor=matrix[j][i];for(let k=i;k<=n;k++)matrix[j][k]-=factor*matrix[i][k]}
    }
    const coefficients=new Float64Array(n);
    for(let i=n-1;i>=0;i--){coefficients[i]=matrix[i][n];for(let j=i+1;j<n;j++)coefficients[i]-=matrix[i][j]*coefficients[j]}
    return Float64Array.from(input,(value,k)=>value-columns.reduce((sum,column,i)=>sum+column[k]*coefficients[i],0));
  }
  function isGuideOnly(samples,sampleRate,reference){
    if(!reference)return false;
    const input=reduce(samples,sampleRate),power=energy(input),lead=reference.length-input.length;
    if(power<1e-10||lead<0)return false;
    let residual=input;const lags=[];
    // Fit the direct sound plus up to two distinct room reflections. A real
    // guitar is not correlated with the seeded guide noise, even on the beat.
    for(let path=0;path<3;path++){
      const match=strongest(residual,reference,lead);
      if(match.score<(path?.25:.12))break;
      for(let offset=-8;offset<=12;offset++){const lag=match.lag+offset;if(lag>=0&&lag<=lead&&!lags.includes(lag))lags.push(lag)}
      residual=project(input,reference,lead,lags);
      if(energy(residual)/power<.002)return true;
    }
    return false;
  }
  const api={RATE,WINDOW_MS,DELAY_MS,render,average,isGuideOnly};
  if(typeof module==='object')module.exports=api;else root.RoutineEcho=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
