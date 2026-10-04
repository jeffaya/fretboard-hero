// Capacitor native bridge for Fretboard Hero.
// No-op when running as a plain web page (window.Capacitor is undefined there).
(function (root) {
  'use strict';

  function shouldGoHome(screenId) {
    return screenId !== 'home';
  }

  function markNativeApp(doc) {
    doc.documentElement.classList.add('native-app');
  }

  function attach(capacitorApp, doc) {
    capacitorApp.addListener('backButton', function () {
      var activeScreen = doc.querySelector('.screen.active');
      var screenId = activeScreen ? activeScreen.id : 'home';
      if (shouldGoHome(screenId)) {
        var homeBtn = doc.querySelector('[data-go="home"]');
        if (homeBtn) {
          homeBtn.click();
          return;
        }
      }
      capacitorApp.exitApp();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { shouldGoHome: shouldGoHome, markNativeApp: markNativeApp, attach: attach };
  } else if (root.Capacitor && root.Capacitor.Plugins && root.Capacitor.Plugins.App) {
    markNativeApp(document);
    attach(root.Capacitor.Plugins.App, document);
  }
})(typeof window !== 'undefined' ? window : globalThis);
