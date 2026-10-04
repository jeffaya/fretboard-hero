const assert = require('node:assert/strict');
const { shouldGoHome, markNativeApp, attach } = require('../native-assets/capacitor-bridge.js');

// shouldGoHome: pure decision logic
assert.equal(shouldGoHome('practice'), true);
assert.equal(shouldGoHome('quiz'), true);
assert.equal(shouldGoHome('home'), false);

// markNativeApp: adds a class to <html> only, never touches anything else
const addedClasses = [];
const fakeNativeDoc = {
  documentElement: {
    classList: { add: (name) => addedClasses.push(name) }
  }
};
markNativeApp(fakeNativeDoc);
assert.deepEqual(addedClasses, ['native-app'], 'expected native-app class to be added to <html>');

// attach(): wires the Capacitor "backButton" event
let clicked = false;
let exited = false;
const fakeApp = {
  addListener(eventName, handler) {
    assert.equal(eventName, 'backButton');
    this._handler = handler;
  },
  exitApp() { exited = true; }
};
const fakeHomeBtn = { click: () => { clicked = true; } };

// Case 1: on a non-home screen, back navigates home instead of exiting
const fakeDocOnQuiz = {
  querySelector(selector) {
    if (selector === '.screen.active') return { id: 'quiz' };
    if (selector === '[data-go="home"]') return fakeHomeBtn;
    return null;
  }
};
attach(fakeApp, fakeDocOnQuiz);
fakeApp._handler();
assert.equal(clicked, true, 'expected the home button to be clicked');
assert.equal(exited, false, 'expected the app not to exit from a non-home screen');

// Case 2: already on home, back exits the app
clicked = false;
exited = false;
const fakeDocOnHome = {
  querySelector(selector) {
    if (selector === '.screen.active') return { id: 'home' };
    return null;
  }
};
attach(fakeApp, fakeDocOnHome);
fakeApp._handler();
assert.equal(exited, true, 'expected the app to exit from the home screen');
assert.equal(clicked, false, 'expected no click when already on home');

console.log('All capacitor-bridge tests passed.');
