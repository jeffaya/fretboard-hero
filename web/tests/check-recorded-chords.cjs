// Optional evaluation against separately downloaded IDMT-SMT-Guitar recordings.
// No licensed audio is bundled. See docs/routine-audio.md for source and scope.
const fs=require('node:fs'),path=require('node:path');
const {spectrumOf,N}=require('./audio-fixtures.cjs');
const {create}=require('../core/chord-detector.js'),{createGate}=require('../core/routine-guide.js');
const root=process.argv[2];
if(!root)throw Error('Usage: node web/tests/check-recorded-chords.cjs /path/to/IDMT-SMT-GUITAR_V2');
function wav(file){
 const bytes=fs.readFileSync(file);let format,data;
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('Expected WAV: '+file);
 for(let offset=12;offset+8<=bytes.length;){
  const type=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8;
  if(type==='fmt ')format={encoding:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),rate:bytes.readUInt32LE(start+4),bits:bytes.readUInt16LE(start+14)};
  if(type==='data')data=bytes.subarray(start,start+size);
  offset=start+size+(size%2);
 }
 if(!format||!data||format.encoding!==1||format.channels!==1||![16,24].includes(format.bits))throw Error('Expected mono PCM16/24: '+file);
 const width=format.bits/8,samples=Float32Array.from({length:data.length/width},(_,i)=>data.readIntLE(i*width,width)/2**(format.bits-1));
 return {samples,rate:format.rate};
}
let tested=0,accepted=0,falseMatches=0;const failed=[];
for(const guitar of ['Fender Strat Clean Neck SC Chords','Ibanez Power Strat Clean Bridge HU Chords']){
 const folder=path.join(root,'dataset1',guitar);
 for(const name of fs.readdirSync(path.join(folder,'audio')).filter(n=>n.endsWith('.wav')).sort()){
  const xml=fs.readFileSync(path.join(folder,'annotation',name.replace(/\.wav$/,'.xml')),'utf8');
  const expected=[...new Set([...xml.matchAll(/<pitch>(\d+)<\/pitch>/g)].map(m=>Number(m[1])))].sort((a,b)=>a-b);
  const third=expected.find(m=>[3,4].includes((m-expected[0])%12));
  const wrong=expected.map(m=>(m-third)%12===0?m+((third-expected[0])%12===3?1:-1):m);
  const {samples,rate}=wav(path.join(folder,'audio',name)),detector=create({minMidi:40,maxMidi:79}),gate=createGate(),wrongGate=createGate();let passed=false,falseMatch=false;
  for(let now=560;now<=1840;now+=80){
   const end=Math.floor(now*rate/1000),frame=samples.slice(end-N,end),level=Math.sqrt(frame.reduce((sum,x)=>sum+x*x,0)/N);
   const result=detector.analyze(spectrumOf(frame),rate,N);
   passed=gate.update({match:detector.matches(result,expected),level,now,chord:true})||passed;
   falseMatch=wrongGate.update({match:detector.matches(result,wrong),level,now,chord:true})||falseMatch;
  }
  tested++;if(passed)accepted++;else failed.push(guitar+'/'+name);if(falseMatch)falseMatches++;
 }
}
console.log(JSON.stringify({tested,accepted,falseMatches,failed},null,2));
if(tested!==88||falseMatches)process.exitCode=1;
