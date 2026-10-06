(() => {
  'use strict';
  const normalizeCourse=(course,index)=>({
    name:course.name||`S${index+1}`,
    pc:Number(course.pc), midi:Number(course.midi)
  });
  const normalize=profile=>({...profile,courses:(profile.courses||[]).map(normalizeCourse)});
  window.TuningEngine={normalize,normalizeCourse};
})();
