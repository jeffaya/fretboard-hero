// Shared by the browser, Worker and sitemap generator.
export const appRoutes = Object.freeze({
  home: {path:'/', title:'', description:''},
  tuner: {path:'/tuner', title:'Tuner', description:'Tune your instrument with the microphone tuner.'},
  routine: {path:'/practice/daily-routine', title:'Daily Routine', description:'Practice five guided fretboard exercises in one key.'},
  learn: {path:'/practice/learn', title:'Learn', description:'Practice scales, triads and chord tones on the interactive fretboard.'},
  quiz: {path:'/practice/quiz', title:'Quiz', description:'Test your fretboard knowledge with the interactive note quiz.'},
  fretmap: {path:'/explore/fretboard-map', title:'Fretboard Map', description:'Explore the notes across your instrument’s fretboard.'},
  circle: {path:'/explore/circle-of-fifths', title:'Circle of Fifths', description:'Explore keys and their relationships with the interactive circle of fifths.'}
});

export function matchRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return Object.keys(appRoutes).find(screen => appRoutes[screen].path === path) || (path === '/index.html' ? 'home' : null);
}

export function entryScreen(url) {
  const route = matchRoute(url.pathname);
  const legacy = url.searchParams.get('screen');
  return route === 'home' && Object.hasOwn(appRoutes, legacy) ? legacy : route || 'home';
}

export function routeURL(screen, current) {
  const url = new URL(current);
  url.pathname = appRoutes[screen].path;
  url.hash = '';
  url.searchParams.delete('screen');
  if (screen !== 'learn') url.searchParams.delete('mode');
  return url;
}
