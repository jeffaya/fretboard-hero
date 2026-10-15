(() => {
  'use strict';
  // Editorial adaptations, not quotations or artist endorsements.
  // Keep the source with each message when editing or translating it.
  const messages=Object.freeze([
    {text:'A breakthrough can come from enjoyment.',author:'Steve Morse',source:'https://www.musicradar.com/news/guitars/steve-morses-top-5-tips-for-guitarists-608318'},
    {text:'A little every day.',author:'Marty Schwartz',source:'https://www.londonguitarinstitute.co.uk/interview-with-guitarist-and-teacher-marty-schwartz/'},
    {text:'Repetition, even at the top.',author:'Tommy Emmanuel',source:'https://college.berklee.edu/news/1097/tommy-emmanuel-embracing-repetition'},
    {text:'Prepare for your next breakthrough.',author:'Steve Vai',source:'https://guitarinternational.com/2022/05/27/steve-vai-the-vaitunes-interview/'},
    {text:'Practice becomes music.',author:'John Mayer',source:'https://www.guitarworld.com/features/john-mayer-practice-routine-song'},
    {text:'Consistency makes the difference.',author:'John Petrucci',source:'https://www.guitarworld.com/blogs/john-petrucci-practice-tips-part-1'},
    {text:'Even a short session counts.',author:'John Petrucci',source:'https://www.guitarplayer.com/player/john-petrucci-five-tips-for-guitrarists'},
    {text:'The basics can take you far.',author:'Paul Gilbert',source:'https://www.metaltalk.net/paul-gilbert-talks-dio-album-mr-big-final-tour-hendrix-yngwie.php'},
    {text:'Practice to play better.',author:'Joe Satriani',source:'https://www.guitarplayer.com/lessons/learn-bends-the-joe-satriani-way-with-the-shred-icons-bending-drill'},
    {text:'Repetition can become discovery.',author:'Jaco Pastorius',source:'https://www.musicradar.com/news/guitars/steve-morses-top-5-tips-for-guitarists-608318'}
  ].map(Object.freeze));
  function createDeck(random=Math.random){
    let remaining=[],previous=null;
    return Object.freeze({
      reset(){remaining=[];previous=null},
      next(){
        if(!remaining.length){
          remaining=[...messages];
          for(let i=remaining.length-1;i>0;i--){
            const j=Math.floor(random()*(i+1));
            [remaining[i],remaining[j]]=[remaining[j],remaining[i]];
          }
          // Revisited exercises can exceed ten transitions. Use every message
          // before recycling, and avoid a duplicate at the deck boundary.
          if(remaining[0]===previous)[remaining[0],remaining[1]]=[remaining[1],remaining[0]];
        }
        previous=remaining.shift();return previous;
      }
    });
  }
  window.RoutineEncouragement=Object.freeze({messages,createDeck});
})();
