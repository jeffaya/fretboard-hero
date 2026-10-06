# Android App — Release notes

Version history for the **Android app** (Capacitor wrapper), separate from
the website changelog ([`web/README.md`](../web/README.md#release-notes)).
For every new app version, add an `## App vX` entry below describing what
changed.

## App v1

First installable version of the Android app, shipped as 3 separate debug
APKs built from the same `web/` code:

- 3 separate apps installable side by side: **Guitar Fretboard Hero**
  (`com.guitar.fretboardhero`), **Bass Fretboard Hero**
  (`com.bass.fretboardhero`), **Ukulele Fretboard Hero**
  (`com.ukulele.fretboardhero`).
- **100% offline**: all assets are bundled into the APK, no network request
  is needed to use Practice, Map, Circle of Fifths or Quiz.
- **Hardware/gesture Back button** mapped to in-app navigation: goes to
  Home from any screen, then exits the app from Home (instead of killing
  the app immediately).
- **Pinch-zoom and overscroll bounce disabled** for a native-app feel
  rather than a web page.
- **Native icon and splash screen** on a dark `#05070b` background,
  matching the site's theme.
- Content strictly identical to the website at build time (same engine,
  same 4 screens, same instruments) — the app doesn't redefine any product
  logic, it only bundles `web/` for offline use.
- iOS is scaffolded (`app/ios/`) but not built/tested in v1.

See [`TECHNICAL.md`](TECHNICAL.md) for the full architecture, build
pipeline and verification procedures.
