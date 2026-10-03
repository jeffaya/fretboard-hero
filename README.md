# Fretboard Hero

Fretboard Hero is a web app for learning the fretboard, designed to teach
guitar visually and through practice rather than acting as a plain note
dictionary.

The core idea: progressively understand where notes are, how intervals are
organized, how musical shapes are built, and be able to find them quickly
on the neck.

The app runs on a shared multi-instrument engine: guitar, 4-string bass,
ukulele and 12-string guitar. The same code ships both as a **website** and
as **3 native Android apps** (Guitar, Bass, Ukulele), via
[Capacitor](https://capacitorjs.com/).

> 🔧 **Technical doc**: detailed architecture, build pipeline, gotchas and
> verification procedures -> [`docs/TECHNICAL.md`](docs/TECHNICAL.md).

## PRACTICE

This is the learning/exploration area.

You pick a root note, a key quality and a mode, then what you want to work
on:

- **Pentatonics** teaches the five pentatonic positions. Each position has
  its own color and the "lanes" genuinely follow the two notes on each
  string. You can isolate P1 through P5 or show the whole system to
  understand how the positions connect across the whole neck.
- **Triads** shows major/minor triads and their inversions across the
  EAD, ADG, DGB and GBE string groups.
- **Chords** lets you work through the five CAGED shapes: C - A - G - E - D.

The notes shown are always the real notes. Color is only there to convey
function: Root, 3rd, 4th, 5th, 7th.

---

## FRETBOARD MAP

A complete map of the neck.

It can show every note, or isolate a single one: A, A#, B, C, etc. The
number of frets is adjustable: 12 / 15 / 17 / 21.

This is essentially the "I want to know where this note is everywhere on
my instrument" mode. Fret markers are reinforced so that 3, 5, 7, 9, 12,
15... are instantly identifiable, even on a phone.

---

## CIRCLE OF FIFTHS

The Circle of Fifths brings the harmony/music-theory side of Fretboard
Hero.

You select a key on the circle and the app immediately gives you: Selected
Key, Relative Minor, Key Signature, Major Scale, Diatonic Chords, Common
Progressions.

For example, a progression doesn't only show:

```
I -> V -> vi -> IV
```

but also the actual chords for that key:

```
I / F -> V / C -> vi / Dm -> IV / Bb
```

Theory blocks have small "?" help bubbles explaining what a key signature,
a major scale, a diatonic chord or a progression is. And crucially, theory
stays connected to the instrument: the matching fretboard is shown below
the harmonic information.

---

## QUIZ

This is the actually gamified part.

A round lasts 60 seconds. The player must find the correct position on the
neck as fast as possible.

Difficulty ramps up during the round. The neck no longer immediately throws
the player all the way to fret 15:

| Correct answers | Unlocked frets |
|---|---|
| 0-4 | 0-5 |
| 5-9 | 0-7 |
| 10-14 | 0-9 |
| 15-19 | 0-12 |
| 20+ | 0-15 |

The question type also evolves with level: mostly Root early on, then 5th
and 3rd start appearing.

The Quiz only shows Major/Minor information when it's musically relevant.
For finding A# ROOT or its 5th, knowing whether A# is major or minor
doesn't matter. For the 3rd, however, Major/Minor is shown since the note
actually changes.

### Scoring

Correct streaks are deliberately heavily rewarded so a player who truly
knows the neck beats someone who clicks at random:

| Multiplier | Points |
|---|---|
| x1 | 100 pts |
| x2 | 250 pts |
| x3 | 500 pts |
| x4 | 800 pts |
| x5 | 1,200 pts |

A wrong answer resets the multiplier to x1. Five consecutive correct
answers already earns 2,850 points -- holding x5 becomes extremely
profitable.

The score then feeds a 30-rank system, up to the highest ranks such as
**Virtuoso**.

---

## Architecture

This isn't four separately coded applications. There's one generic
Fretboard Engine with shared modules for:

Theory - Fretboard - Pentatonic - Triads - Chords - Arpeggios - Quiz -
Circle of Fifths - Controls - Layout - Tuning

Instruments are configuration profiles. This lets the same engine power:

- Guitar Fretboard Hero
- Bass Fretboard Hero
- Ukulele Fretboard Hero
- 12-string Guitar

Fretboard rendering -- frets, strings, nut, numbers, inlays, portrait
orientation, etc. -- is shared through the Fretboard Core. That means an
improvement to a shared concern (e.g. fret-number readability) benefits the
whole app and every instrument.

**Contribution rule**: `/core` must never contain an instrument-specific
branch (`if (instrument === "bass-4")` is forbidden) -- differences live in
`/instruments` or `/products`.

## Responsive / UX philosophy

The app is mobile-first, but "responsive" isn't just "desktop vs mobile".
Controls adapt to the space actually available: full buttons -> compact
selects -> hamburger.

Content, on the other hand, never becomes a menu. That's the rule set in
particular with the Circle of Fifths: header always on top, Back on the
left, title centered, controls on the right when needed, then the real
content below. The same principle structures Practice, Map, Circle and
Quiz.

## Web vs native app (Android)

| | Web | Native app (Capacitor) |
|---|---|---|
| Hosting | `stupid-games.seignemorte.com` | 3 separately installable APKs (one per instrument) |
| Connectivity | Needs network on first load | 100% offline (bundled assets) |
| Back button | -- | Hardware/gesture Back: goes to Home, then exits the app from Home |
| Zoom/overscroll | Standard browser | Pinch-zoom and overscroll bounce disabled (app-like feel) |
| Icon/splash | Browser favicon | Native icon + splash on dark `#05070b` background |
| Updates | Instant (web deploy) | Requires a rebuild + APK reinstall |

## Current state

The latest site version is **V10.5.8**.

Fretboard Hero is no longer just a pentatonic visualizer. There are three
complementary layers: **Learn** with Practice -> **Understand** with
Map/Circle -> **Prove it** with Quiz.

That's probably what sits at the core of the product: see -> understand ->
memorize -> recall under pressure.

## Release notes

Every **site** update is documented in
[`web/README.md`](web/README.md#release-notes) (V10.4.4 -> V10.5.8 so far)
-- it is the single source of truth for the web product's history.

Every **Android app** update (wrapper, not the site itself) is documented
separately in [`docs/APP-RELEASE-NOTES.md`](docs/APP-RELEASE-NOTES.md).

---

## Where to edit what

- **`web/`** -- the actual site. This is the only place you edit for content,
  features, styling, or bugfixes. It's the same engine serving all three
  instruments, selected at runtime via `site.config.json`.
- **`app/`** -- the Capacitor + native Android/iOS wrapper. You only touch
  this for native-specific changes (back-button behavior, icons, splash,
  per-instrument app IDs). `app/www/` is **disposable and gitignored** --
  it's regenerated from `web/` on every build, never hand-edited.
- **`scripts/`** -- build orchestration, runnable from the repo root.
- **`dist/`** -- gitignored output folder for the built debug APKs.
- **`docs/`** -- technical reference and release notes for the Android app.
- **`tools/`** -- ad hoc dev/debug scripts (not part of the shipped product).

## Updating the website

Edit files under `web/` as usual. No app-side code changes are needed for a
normal content/feature update.

## Building the apps

```powershell
# One instrument:
.\scripts\build-instrument.ps1 -Instrument guitar   # or bass-4 / ukulele

# All three:
.\scripts\build-all.ps1
```

Output APKs land in `dist/fretboard-hero-<instrument>-debug.apk`.

### Prerequisites

- Node.js
- JDK 21
- Android SDK (`ANDROID_HOME` set), with `platform-tools`,
  `platforms;android-34`, and `build-tools;34.0.0` installed
- Run `npm install` inside `app/` once before the first build

## Native back-button bridge

`app/native-assets/capacitor-bridge.js` makes the Android hardware/gesture
Back button navigate to Home first, then exit the app from Home. Covered by
unit tests in `app/tests/capacitor-bridge.test.js` (`node app/tests/capacitor-bridge.test.js`).