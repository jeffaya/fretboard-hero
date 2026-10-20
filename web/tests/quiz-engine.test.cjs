const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('web/core/quiz-engine.js','utf8'),context);
const quiz=context.window.QuizEngine;
test('Quiz root, major/minor thirds and fifths wrap correctly for all twelve roots',()=>{
  for(let rootPC=0;rootPC<12;rootPC++)for(const quality of ['major','minor'])for(const [target,interval] of [['root',0],['third',quality==='major'?4:3],['fifth',7]]){
    assert.equal(quiz.targetPC({rootPC,quality,target,mod:n=>((n%12)+12)%12}),(rootPC+interval)%12);
  }
});
test('Quiz scoring caps the combo and fret progression changes exactly at its boundaries',()=>{
  for(const [multiplier,points] of [[0,100],[1,100],[2,250],[3,500],[4,800],[5,1200],[6,1200]])assert.equal(quiz.scoreGain(multiplier),points);
  for(const [correct,fret] of [[0,5],[4,5],[5,7],[9,7],[10,9],[14,9],[15,12],[19,12],[20,15],[100,15]]){
    assert.deepEqual(Array.from(quiz.progressionWindow(correct)),[0,fret]);assert.equal(quiz.progressionMaxFret(correct,12),Math.min(12,fret));
  }
});
for(const instrument of ['guitar','bass','ukulele'])test(`${instrument}: every rank threshold and the score immediately below it select the correct rank`,()=>{
  vm.runInNewContext(fs.readFileSync(`web/products/${instrument}-fretboard-hero.js`,'utf8'),context);
  const ranks=context.window.FRETBOARD_PRODUCTS[instrument].ranks;
  ranks.forEach((row,index)=>{assert.equal(quiz.rankFor(row[0],ranks).rank,row[2]);if(index<ranks.length-1)assert.equal(quiz.rankFor(row[0]-1,ranks).rank,ranks[index+1][2])});
});
