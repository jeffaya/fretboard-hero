const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{}};
vm.createContext(c);
for(const name of ['core/music-theory','instruments/guitar','instruments/bass-4','instruments/ukulele','core/pentatonic-renderer']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name+'.js'),'utf8'),c);
  Object.assign(c,c.window);
}
const {visiblePairs,positionSpans}=c.PentatonicRenderer;
const plain=value=>JSON.parse(JSON.stringify(value));

test('A minor P1 covers frets 5–8 and its clipped octave repeat',()=>{
  const windows=visiblePairs({profile:c.FRETBOARD_INSTRUMENTS.guitar,anchor:5,maxFret:17,selected:'1'});
  assert.deepEqual(plain(positionSpans(windows,17)),[
    {id:1,from:5,to:8,lane:0},
    {id:1,from:17,to:17,lane:0}
  ]);
});

test('Open-string positions include fret zero; off-neck and zero-only boxes do not create empty guides',()=>{
  const windows=visiblePairs({profile:c.FRETBOARD_INSTRUMENTS.guitar,anchor:0,maxFret:12,selected:'1'});
  assert.deepEqual(plain(positionSpans(windows,12)),[
    {id:1,from:0,to:3,lane:0},
    {id:1,from:12,to:12,lane:0}
  ]);
  assert.equal(positionSpans([{id:5,pairs:[[-3,0],[-2,0]]}],12).length,0);
});

test('All instruments, anchors and fret counts produce bounded guides with separate tracks for overlapping boxes',()=>{
  for(const profile of Object.values(c.FRETBOARD_INSTRUMENTS))for(let anchor=0;anchor<12;anchor++)for(const maxFret of profile.fretOptions){
    const spans=positionSpans(visiblePairs({profile,anchor,maxFret}),maxFret);
    assert.ok(spans.length>=5,`${profile.id}, anchor ${anchor}, ${maxFret} frets`);
    for(let i=0;i<spans.length;i++){
      const a=spans[i];assert.ok(a.from>=0&&a.to<=maxFret&&a.from<=a.to);
      for(const b of spans.slice(i+1))if(a.lane===b.lane)assert.ok(a.to<b.from-1);
    }
  }
});
