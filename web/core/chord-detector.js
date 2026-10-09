/* Small harmonic dictionary + non-negative spectral fit. No model or network. */
(function(root){
  'use strict';
  const LOW=24,HIGH=120,SIZE=HIGH-LOW+1;
  function create({minMidi=40,maxMidi=84}={}){
    const dictionary=[];
    for(let midi=minMidi;midi<=maxMidi;midi++)for(const [slope,second] of [[.8,1],[1.5,1],[1.2,2.5]]){
      const bins=new Map();
      for(let h=1;h<=10;h++){
        const bin=Math.round(midi+12*Math.log2(h))-LOW;
        if(bin>=SIZE)break;
        bins.set(bin,(bins.get(bin)||0)+(h===2?second:1)/h**slope);
      }
      const norm=Math.sqrt([...bins.values()].reduce((sum,x)=>sum+x*x,0));
      dictionary.push({midi,bins:[...bins].map(([i,x])=>[i,x/norm])});
    }
    function analyze(spectrum,sampleRate,fftSize){
      const observed=new Float64Array(SIZE),resolution=sampleRate/fftSize;
      let peak=-Infinity;
      for(let i=2;i<Math.min(spectrum.length-1,Math.ceil(8000/resolution));i++)peak=Math.max(peak,spectrum[i]);
      if(peak<-70)return {notes:[],fit:0};
      for(let i=2;i<Math.min(spectrum.length-1,Math.ceil(8000/resolution));i++){
        const b=spectrum[i];if(b<peak-38||b<spectrum[i-1]||b<=spectrum[i+1])continue;
        const a=spectrum[i-1],c=spectrum[i+1],den=a-2*b+c;
        const offset=Number.isFinite(den)&&den?(a-c)/(2*den):0;
        const hz=(i+Math.max(-.5,Math.min(.5,offset)))*resolution;
        const pitch=69+12*Math.log2(hz/440),midi=Math.round(pitch),bin=midi-LOW;
        if(bin<0||bin>=SIZE||Math.abs(pitch-midi)>.43)continue;
        const amplitude=10**((b-.25*(a-c)*offset-peak)/20);
        observed[bin]+=Number.isFinite(amplitude)?amplitude:10**((b-peak)/20);
      }
      // Fit all playable pitches, including wrong notes; never fit just the target.
      const residual=observed.slice(),weights=new Float64Array(dictionary.length);
      const active=dictionary.map((d,i)=>observed[d.midi-LOW]>.035?i:-1).filter(i=>i>=0);
      for(let pass=0;pass<48;pass++)for(const i of active){
        const d=dictionary[i];let gradient=0;
        for(const [bin,value] of d.bins)gradient+=residual[bin]*value;
        const next=Math.max(0,weights[i]+gradient-.018),delta=next-weights[i];
        if(!delta)continue;weights[i]=next;
        for(const [bin,value] of d.bins)residual[bin]-=delta*value;
      }
      const strengths=new Map();
      dictionary.forEach((d,i)=>strengths.set(d.midi,(strengths.get(d.midi)||0)+weights[i]));
      const strongest=Math.max(...strengths.values(),0),notes=[];
      for(const [midi,strength] of strengths)if(strength>Math.max(.075,strongest*.17))notes.push({midi,strength});
      let energy=0,error=0;for(let i=0;i<SIZE;i++){energy+=observed[i]**2;error+=residual[i]**2}
      return {notes,fit:energy?1-error/energy:0};
    }
    function matches(result,expected){
      const wanted=[...new Set(expected)],heard=new Set(result.notes.map(n=>n.midi));
      return result.fit>.72&&wanted.length>=2&&wanted.every(midi=>heard.has(midi))&&result.notes.every(n=>wanted.includes(n.midi));
    }
    return {analyze,matches};
  }
  const api={create};
  if(typeof module==='object')module.exports=api;else root.FretboardChordDetector=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
