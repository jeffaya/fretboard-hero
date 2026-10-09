const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{}};
vm.createContext(c);
for(const name of ['core/music-theory','instruments/guitar','instruments/bass-4','instruments/ukulele','core/pentatonic-renderer']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name+'.js'),'utf8'),c);
  Object.assign(c,c.window);
}
const {visiblePairs,positionSpans}=c.PentatonicRenderer;
const plain=value=>JSON.parse(JSON.stringify(value));

test('A minor guides follow each other on one strip, splitting shared frets between neighbours',()=>{
  const windows=visiblePairs({profile:c.FRETBOARD_INSTRUMENTS.guitar,anchor:5,maxFret:12});
  const spans=positionSpans(windows,12);
  assert.deepEqual(plain(spans.map(({id,start,end})=>({id,start,end}))),[
    {id:3,start:0,end:.5},
    {id:4,start:.5,end:2},
    {id:5,start:2,end:4.5},
    {id:1,start:4.5,end:7},
    {id:2,start:7,end:9},
    {id:3,start:9,end:11.5},
    {id:4,start:11.5,end:12}
  ]);
  assert.deepEqual(plain(spans.find(s=>s.id===1)),{id:1,from:5,to:8,start:4.5,end:7});
});

test('Open-string positions include fret zero; off-neck and zero-only boxes do not create empty guides',()=>{
  const windows=visiblePairs({profile:c.FRETBOARD_INSTRUMENTS.guitar,anchor:0,maxFret:12});
  assert.deepEqual(plain(positionSpans(windows,12).filter(s=>s.id===1)),[
    {id:1,from:0,to:3,start:0,end:2},
    {id:1,from:12,to:12,start:11.5,end:12}
  ]);
  assert.equal(positionSpans([{id:5,pairs:[[-3,0],[-2,0]]}],12).length,0);
});

test('All instruments, anchors and fret counts produce a continuous non-overlapping strip',()=>{
  for(const profile of Object.values(c.FRETBOARD_INSTRUMENTS))for(let anchor=0;anchor<12;anchor++)for(const maxFret of profile.fretOptions){
    const spans=positionSpans(visiblePairs({profile,anchor,maxFret}),maxFret);
    assert.ok(spans.length>=5,`${profile.id}, anchor ${anchor}, ${maxFret} frets`);
    for(let i=0;i<spans.length;i++){
      const a=spans[i];assert.ok(a.from>=0&&a.to<=maxFret&&a.from<=a.to);
      assert.ok(a.start>=0&&a.end<=maxFret&&a.start<a.end);
      assert.equal(Object.hasOwn(a,'lane'),false);
      if(i>0)assert.equal(spans[i-1].end,a.start);
    }
  }
});
