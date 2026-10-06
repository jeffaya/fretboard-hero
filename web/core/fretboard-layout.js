(() => {
  'use strict';
  function create({portrait,stringCount,maxFret,width,height}){
    const W=width??(portrait?520:1500),H=height??(portrait?1500:500);
    const fretStart=150,fretEnd=portrait?H-70:W-40,stringStart=portrait?85:88,stringEnd=portrait?W-55:H-48;
    const fretPos=f=>fretStart+(fretEnd-fretStart)*(f/maxFret);
    const stringPos=s=>stringStart+(stringEnd-stringStart)*(s/Math.max(1,stringCount-1));
    return {isP:portrait,W,H,fretStart,fretEnd,stringStart,stringEnd,fretPos,stringPos,maxFret};
  }
  const OPEN_CENTER=35;
  const fretCenter=(fret,fretPos)=>fret===0?OPEN_CENTER:(fretPos(fret-1)+fretPos(fret))/2;
  window.FretboardLayout={create,fretCenter,OPEN_CENTER};
})();
