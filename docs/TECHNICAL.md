# Fretboard Hero — Technical Reference

This document is the authoritative technical reference for this repository.
It is written to be sufficient on its own for a new engineer **or an AI
agent** to resume work without prior session context: repo layout, exact
build pipeline, every non-obvious gotcha discovered so far, and how to
extend the system safely.

If something here becomes stale, fix this file in the same change that
invalidates it — it is the single source of truth for "how this repo
works", separate from `README.md` (product-facing) and `web/README.md`
(site changelog).

---

## 1. Repository layout

```
fretoboard-hero/
├── web/              # Site source. SINGLE SOURCE OF TRUTH for content/engine.
├── app/              # Capacitor native wrapper (Android/iOS).
│   ├── www/          # DISPOSABLE. Regenerated from web/ on every build. Gitignored.
│   ├── android/      # Native Android project (Gradle).
│   ├── ios/          # Native iOS scaffold (not actively built in this workflow).
│   ├── native-assets/capacitor-bridge.js   # Back-button bridge, copied into www/core/ at sync time.
│   ├── tests/capacitor-bridge.test.js      # Unit tests for the bridge logic.
│   ├── instruments.json                    # instrument -> {appId, name} map.
│   └── capacitor.config.json               # Regenerated per-build by build-instrument.ps1. Don't hand-edit for a release.
├── scripts/          # Build orchestration (PowerShell), run from repo root.
├── dist/             # Gitignored. Output APKs land here: fretboard-hero-<instrument>-debug.apk
├── tools/            # Ad hoc dev/debug scripts, NOT part of the shipped product.
└── docs/             # This file + the original Android-wrapper design/plan docs.
```

**Golden rule:** `web/` is the only place that defines product behavior.
`app/www/` must never be hand-edited — any change made there will be
silently destroyed the next time `sync-web.ps1` runs.

## 2. Web engine architecture (inside `web/`)

```
web/
├── core/          # Shared engine. MUST stay instrument-agnostic.
├── instruments/    # Per-instrument profiles (tuning, fret range, ...).
├── products/       # Per-instrument product identity (branding, SEO, copy).
├── modes/          # Reusable practice modes (pentatonic/triads/chords/...).
├── site.config.json  # { "instrument": "guitar" | "bass-4" | "ukulele" }
├── bootstrap.js     # Reads site.config.json, wires instrument -> product -> core.
├── index.html / app.js / styles.css / sw.js
└── README.md        # Site changelog + config reference (V10.3 -> V10.5.8+).
```

Resolution chain at runtime:

```
site.config.json (instrument key)
   -> web/instruments/<instrument>.*   (tuning, fret range, quiz ranks, ...)
   -> web/products/<product>.*         (Home branding, SEO/OG metadata, PWA name)
   -> web/core/*                       (fretboard rendering, theory, quiz engine — shared)
```

**Hard architecture rule** (enforced by convention, not by a linter):
`web/core/**` must never contain an instrument-conditional branch such as
`if (instrument === "bass-4")`. Any instrument-specific behavior belongs in
`web/instruments/` or `web/products/`. If you find yourself tempted to
branch inside `core`, that's a signal the profile/product layering is
missing a hook — add the hook instead of branching.

`site.config.json` is fetched with `cache: "no-store"` so a config change
is never masked by the browser cache. An unknown `instrument` value must
fail loudly (explicit configuration error), never silently fall back to a
different instrument.

Known product identities (see `web/README.md` for full changelog):
`guitar` → Guitar Fretboard Hero, `bass-4` → Bass Fretboard Hero,
`ukulele` → Ukulele Fretboard Hero.

## 3. Android wrapper architecture (inside `app/`)

- Built with [Capacitor](https://capacitorjs.com/); the Java package for
  `MainActivity` is fixed at `com.guitar.fretboardhero` **regardless of
  instrument** — only the Gradle `applicationId` changes per build. This is
  what allows all three APKs to install side-by-side on the same device
  (Android treats `applicationId` as the identity, not the Java package
  path).
- `app/android/app/src/main/java/com/guitar/fretboardhero/MainActivity.java`
  is shared across all instruments. It currently disables WebView overscroll
  glow (`setOverScrollMode(WebView.OVER_SCROLL_NEVER)`) for a native feel.
- `app/native-assets/capacitor-bridge.js` implements the hardware/gesture
  Back button behavior: if the active screen (`.screen.active`) is not
  `home`, clicking the `[data-go="home"]` button navigates home; if already
  on `home`, the app exits (`Capacitor.Plugins.App.exitApp()`). No-ops
  safely when `window.Capacitor` is undefined (i.e. running as a plain web
  page). Logic is unit-tested in `app/tests/capacitor-bridge.test.js`
  (`node app/tests/capacitor-bridge.test.js`).
- Splash/status bar theme color is `#05070b` (matches the site's dark
  theme), configured via `capacitor.config.json` plugins block
  (`SplashScreen`, `StatusBar`), regenerated per instrument by
  `build-instrument.ps1` (see §4).
- Viewport meta already sets `user-scalable=no` in `web/index.html` — this
  is what disables pinch-zoom in both the web and native builds; no
  additional native-side configuration is needed for that.
- `app/instruments.json` is the single mapping of instrument key → Android
  `applicationId` + display name, consumed by the build scripts:
  ```json
  {
    "guitar":  { "appId": "com.guitar.fretboardhero",  "name": "Guitar Fretboard Hero" },
    "bass-4":  { "appId": "com.bass.fretboardhero",    "name": "Bass Fretboard Hero" },
    "ukulele": { "appId": "com.ukulele.fretboardhero", "name": "Ukulele Fretboard Hero" }
  }
  ```

## 4. Build pipeline — exact mechanics

### 4.1 `scripts/sync-web.ps1 -Instrument <guitar|bass-4|ukulele> [-RepoPath <path>]`

Regenerates `app/www/` from scratch for one instrument:

1. Deletes `app/www/` entirely and copies `web/` into it verbatim.
2. Overwrites `app/www/site.config.json` with `{ "instrument": "<Instrument>" }`
   — this is what forces the build to lock to one instrument (the web
   deployment instead lets the hosting environment's `site.config.json`
   decide).
3. Copies `app/native-assets/capacitor-bridge.js` into
   `app/www/core/capacitor-bridge.js`, then injects
   `<script src="./core/capacitor-bridge.js" defer></script>` right before
   `</body>` in `app/www/index.html` via a regex insertion.

**Critical gotcha — Windows PowerShell 5.1 encoding**: reading/writing
`index.html` must use
`[System.IO.File]::ReadAllText(path, [System.Text.Encoding]::UTF8)` /
`WriteAllText(path, content, New-Object System.Text.UTF8Encoding $false)`.
Using `Get-Content -Raw` / `Set-Content -Encoding UTF8` instead silently
corrupts multi-byte UTF-8 characters (the site uses `→` and other non-ASCII
glyphs) because PowerShell 5.1 reads BOM-less files using the system ANSI
codepage, not UTF-8, despite the `-Encoding UTF8` flag on write. This bug
was hit and fixed once already (mojibake `â—`/`%‰` instead of `→` in the
built app) — do not reintroduce it by "simplifying" this script.

### 4.2 `scripts/build-instrument.ps1 -Instrument <guitar|bass-4|ukulele> [-RepoPath <path>]`

Full orchestration for one instrument:

1. Calls `sync-web.ps1` (§4.1).
2. Writes `app/capacitor.config.json` with `appId`/`appName` from
   `instruments.json`, `webDir: "www"`, and the splash/status-bar plugin
   config (`#05070b` background).
3. Patches `app/android/app/build.gradle`: regex-replaces
   `applicationId "..."` with the instrument's `appId`.
   **Critical gotcha — BOM**: this file must be written via
   `[System.IO.File]::WriteAllText(path, content, New-Object System.Text.UTF8Encoding $false)`.
   `Set-Content -Encoding UTF8` injects a UTF-8 BOM, and Gradle's Groovy
   parser fails on a leading BOM (`Unexpected character: '\uFEFF'`
   / similar). Already hit and fixed once.
4. Runs `npx cap sync android` (copies `app/www` + config into the native
   project) and `gradlew.bat assembleDebug` inside `app/android`.
   **Critical gotcha — stderr vs terminating errors**: this script runs
   under `$ErrorActionPreference = "Stop"` globally, but native CLI tools
   (`npx`, `gradlew`) routinely write harmless notices to stderr (e.g. Java
   tool-options notices), which PowerShell under `Stop` treats as a
   terminating `NativeCommandError` and aborts the script even though the
   command actually succeeded. Fix pattern used here: temporarily set
   `$ErrorActionPreference = "Continue"` around each native invocation and
   explicitly check `$LASTEXITCODE` afterwards; restore the previous value
   in a `finally` block. Do not remove this pattern or the script will
   intermittently fail on successful builds.
5. Copies the built
   `app/android/app/build/outputs/apk/debug/app-debug.apk` to
   `dist/fretboard-hero-<instrument>-debug.apk`.

Note: `sdkmanager`/`avdmanager`/`sdkmanager --licenses` commands frequently
return a non-zero exit code even when they succeeded (e.g. license
acceptance, platform-tools install). Don't trust their exit code alone when
diagnosing SDK setup issues — verify via file existence or
`sdkmanager --list_installed` instead. This is unrelated to the build
scripts themselves but relevant when re-provisioning a build machine.

### 4.3 `scripts/build-all.ps1 [-RepoPath <path>]`

Thin loop calling `build-instrument.ps1` for `guitar`, `bass-4`, `ukulele`
in sequence. No parallelism — Gradle/Capacitor state is shared per `app/`
checkout, so builds must be sequential, not concurrent.

### 4.4 Prerequisites for building

- Node.js, JDK 21.
- Android SDK with `ANDROID_HOME` set, `platform-tools`,
  `platforms;android-34`, `build-tools;34.0.0` installed.
- `npm install` run once inside `app/`.
- **Windows-specific**: a `User`-scope environment variable set via
  `[Environment]::SetEnvironmentVariable(..., "User")` in one PowerShell
  process is **not** visible as `$env:VAR` in a different, freshly-spawned
  PowerShell process until that process is started after the variable was
  set system-wide (each new terminal/tool invocation is a fresh process).
  If `ANDROID_HOME` appears unset in a new session despite having been
  configured, re-set `$env:ANDROID_HOME` explicitly at the top of the
  script/session rather than assuming persistence.

## 5. Headless Android SDK / emulator setup (no Android Studio GUI)

Used to provision a build+test machine without the Android Studio GUI:

1. Download `commandlinetools-win-*_latest.zip` directly from
   `https://dl.google.com/android/repository/`.
2. Extract to `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`.
3. Set `ANDROID_HOME` via
   `[Environment]::SetEnvironmentVariable("ANDROID_HOME", $path, "User")`
   (see the environment-variable gotcha in §4.4).
4. `sdkmanager --licenses`, then install `platform-tools`,
   `platforms;android-34`, `build-tools;34.0.0`, `emulator`, and a system
   image (`system-images;android-34;google_apis;x86_64`).
5. Create an AVD headlessly:
   ```
   avdmanager create avd -n Pixel_7_API_34 -k "system-images;android-34;google_apis;x86_64" -d pixel_7
   ```
6. Start it headlessly:
   ```
   Start-Process emulator.exe -ArgumentList "-avd","Pixel_7_API_34","-no-snapshot","-no-audio"
   ```
   Poll boot completion with
   `adb shell getprop sys.boot_completed` until it returns `1`.

## 6. Manual / scripted verification workflow

### 6.1 Installing all 3 APKs side-by-side

Because each instrument has a distinct `applicationId`, all three debug
APKs can be installed simultaneously on the same device/emulator:

```
adb install -r dist\fretboard-hero-guitar-debug.apk
adb install -r dist\fretboard-hero-bass-4-debug.apk
adb install -r dist\fretboard-hero-ukulele-debug.apk
```

Launch a specific one with
`adb shell monkey -p <applicationId> -c android.intent.category.LAUNCHER 1`.

### 6.2 Simulating offline mode on the emulator

The standard `android.intent.action.AIRPLANE_MODE` broadcast is **blocked**
by a `SecurityException` when sent from `adb shell` (not permitted from
shell context). Use these instead, which do work:

```
adb shell svc wifi disable
adb shell svc data disable
```

Verify with `adb shell ping -c 1 8.8.8.8` → should report
"Network is unreachable". Re-enable with `svc wifi enable` /
`svc data enable` when done — don't leave the emulator offline between
sessions.

### 6.3 Driving/inspecting the WebView via Chrome DevTools Protocol (CDP)

`uiautomator`-style tools cannot see inside a WebView's DOM. Capacitor
debug builds expose a CDP endpoint instead:

1. Get the app's PID: `adb shell pidof <applicationId>`
2. Forward the devtools socket:
   `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`
3. Query `http://localhost:9222/json` for `webSocketDebuggerUrl`.
4. Connect with Python's `websocket-client`:
   `websocket.create_connection(ws_url, suppress_origin=True)`.
   **Gotcha**: you must pass `suppress_origin=True`, not a custom `Origin`
   header — the CDP endpoint rejects connections with an unexpected
   `Origin` header (403 "Rejected ... Origin"), and passing a custom header
   gets appended alongside the default rather than replacing it.
5. Use the `Runtime.evaluate` CDP method to click nav elements
   (`document.querySelector('[data-go="practice"]').click()`, etc.) and
   `Runtime.consoleAPICalled` events to capture console errors/warnings
   during navigation.

A ready-to-run implementation of this lives at
`tools/verify-webview-navigation.py` — see `tools/README.md` and the
script's own docstring for usage. It clicks through all 4 screens
(`practice`, `fretmap`, `circle`, `quiz` — **note**: the data-go value is
`fretmap`, not `map`), prints the active screen after each click, prints
the page `<title>` (useful to confirm per-instrument branding is applied),
prints the `viewport` meta content (to confirm `user-scalable=no` /
pinch-zoom-disabled), and prints any console errors/warnings collected
during the run.

### 6.4 Known benign noise during verification

- `SystemBars.java` (inside `node_modules/@capacitor/android`, a Capacitor
  core plugin) legitimately logs
  `console.error('Error injecting safe area CSS: ...')` on the very first
  WebView frame, when `document.documentElement` isn't attached to the DOM
  yet. This is caught internally by the plugin's own try/catch and is a
  known framework-level race condition, not an app bug — do not treat it as
  a verification failure.
- A Google Play Services "account error" system activity may appear after
  launching an app on some emulator images; this is an emulator/Play
  Services artifact unrelated to this app.

## 7. How to add a new instrument

1. Add a profile under `web/instruments/` and a product identity under
   `web/products/` (branding, SEO/OG metadata, quiz ranks, tuning/fret
   range as needed) — follow the existing `bass-4`/`ukulele` profiles as a
   template. **Never** add instrument-conditional code to `web/core/`.
2. Add the new instrument key to `app/instruments.json` with a unique
   Android `appId` (reverse-DNS style, must not collide with existing
   ones) and display `name`.
3. Add the new key to the `ValidateSet` list in both
   `scripts/sync-web.ps1` and `scripts/build-instrument.ps1`, and to the
   `$instruments` array in `scripts/build-all.ps1`.
4. Build with `.\scripts\build-instrument.ps1 -Instrument <new-key>` and
   verify with the §6 workflow before considering it done.

## 8. Release process for the website

Every site update must get a changelog entry appended to
`web/README.md` under its "Release notes" section, formatted as
`## VX.Y.Z — Title` followed by a bullet list of what changed (see existing
entries from V10.4.4 through V10.5.8 for the expected level of detail).
This is the single source of truth for the product's version history; the
root `README.md`'s "État actuel" section only ever references the latest
version number, it does not duplicate the changelog.

## 9. Things intentionally NOT automated / open items

- iOS (`app/ios/`) is scaffolded but not part of the build/verification
  workflow used so far — treat it as unverified if picked up later.
- There is no CI pipeline; all builds/verification in this repo have been
  run manually/locally via the scripts above.
- `tools/verify-webview-navigation.py` is a manual diagnostic tool, not
  wired into any automated test suite — running it is a manual step during
  verification, not part of `build-instrument.ps1`.

## Shared neon theme (V10.7.0)

`web/theme.css` is the canonical shared appearance layer, loaded after legacy styles and `web/home.css`. It owns self-hosted typography, the single concert background, color tokens, gloss, button states and frame surfaces across Home, Practice, Fretboard Map, Circle and Quiz. Geometry remains in existing screen styles. `body[data-screen]` follows navigation; exercises dim the shared scene for readability. `web/home.js` loads before `app.js` and only handles the instrument dock. Settings, stats dialogs and their progress tracking were removed; the home does not read or write localStorage. Existing legacy progress data is inert. Motion runs automatically while home is active and honors prefers-reduced-motion.

The instrument dock stores `fretboard-home-instrument` in sessionStorage and reloads bootstrap. Bootstrap validates the key against CATALOG, otherwise uses `site.config.json`. The original configuration is retained as `defaultInstrument`; it controls dock order independently of the active session selection. Unknown saved selections are cleared and fall back to the configured instrument. This does not alter build configuration or native app ID.

Play Mode and Quiz are two entry points to the existing quiz intro, not independent game modes. Quiz scoring and the results screen remain unchanged.

### Home artwork and responsive layout (V10.6.1)

`assets/theme/concert-crowd.webp` and the shared `assets/home/product-wordmarks.webp` logo sprite contain only illustration/lettering; controls and text remain native DOM. `icons.svg` is a shared symbol sprite referenced with SVG use. Barlow Condensed 500/800 are self-hosted subset WOFF2 fonts in `assets/theme`, licensed under the bundled OFL. No remote font request is needed. Asset payload (illustration, logo, sprite and fonts) is approximately 415 KB across all variants on disk; the shared logo sprite is requested once. `ProductShell` loads the active product’s wordmark viewport via `assets.heroLogoViewport` and derives the Practice description from the active profile's registered modes.

Portrait layout is a centered column; landscape ≥700px is a two-column composition; short landscape ≥740px uses two columns inside the card menu. Media rules live in `home.css`, scoped to `#home`, without changing fretboard layouts. Native app/www must still be rebuilt from web. Small screens allow vertical scrolling.

Artwork source prompts and provenance: `web/assets/home/ASSETS.md`. Browser validation uses the built-in product routes, not mocked fretboard engines. The in-conversation gallery consists of actual Chromium screenshots.

V10.7.0 validation: Chromium checked shared font/background/gloss on all four modes, Practice root/degree controls, Quiz launch, six portrait/landscape viewport sizes (phone, tablet and desktop), and reduced-motion behavior. No runtime errors or horizontal overflow were observed.

## Three-product home (V10.8.0)

The selector contains Guitar, Bass and Ukulele only. The configured product comes first, followed by remaining instruments in canonical Guitar/Bass/Ukulele order; session selection never changes this order. Each product declares its own transparent brush-neon logo. A single instrument-free concert crowd image is shared by every mode. Instrument illustrations use a three-cell sprite with measured independent viewports. The engine draws one physical string per tuning entry.

## Startup readiness (V10.8.3)

The page shows a single loading status until the chosen product, interaction handlers and loaded logo are ready. Classic scripts use async=false: requests are queued concurrently while execution follows dependency order. If a logo request fails, a readable product title replaces it and the app remains usable. Switching instruments still reloads bootstrap with the saved session selection.

The product wordmarks share one 2700×550 WebP sprite, displayed through independent 900×550 SVG viewports. Instrument switching reuses the same cached artwork URL. Bootstrap waits for that shared image to load before revealing the home.


## Shared premium neck (V10.9.0)

`core/fretboard-appearance.js` owns the ebony surface, chrome frets, wound/plain strings, faceted violet diamond inlays, open-string tuning badges and dark glass note badges. Practice, Map, Quiz and Circle share the same structural neck; Practice, Map and Circle use the same note renderer. Geometry stays orthographic and follows the existing portrait/landscape layout. The 12th-fret pair is separated symmetrically for four- and six-string profiles. Open notes are centered 54 viewBox units before the nut, separately from the tuning labels.

Degree colors and Circle scale colors have one source in `FretboardAppearance`. Practice legends display actual note names and use the exact corresponding note outline color; Circle scale pills and Map pitch filters follow their neck palette. Position bands remain available but are thinner and translucent so the strings and notes stay visible. Legacy legend color rules have been removed.

The neck uses one 83 KB photorealistic ebony WebP texture, gradients and explicit contact shadows instead of turbulence and repeated blur filters. Metal parts, strings, faceted inlays and notes remain SVG geometry. No animation loop or additional dependencies are introduced. Existing Quiz hit zones and feedback remain intact.

Validation: Chromium checked Guitar/Bass/Ukulele at 1440×900, 900×1440, 1024×768, 768×1024, 844×390 and 393×873; correct C pitch locations, 3/5/7/9/double-12/15 markers, exact Practice note/legend colors and labels across all registered modes in major/minor, degree filtering and Circle scale colors. Three-product navigation and Quiz rendering, JavaScript syntax checks, Capacitor bridge tests and diff checks passed. Browser viewport checks do not replace physical iPad/iPhone testing.

V10.9.1: all fret numbers are shown, with 3/5/7/9/12/15/17/19/21 emphasized. Faceted violet diamonds replace pearls; cyan/magenta rails are removed. Raised fret bodies use rectangles so their cross-section gradients have a nonzero bounding box. Cylindrical string gauges range from 8 to 2 viewBox units, with two offset shadow layers and wound-wire patterns. Note radii are 24 landscape / 26 portrait and tuning badges 24. The landscape neck is taller for more breathing room. Updated checks verify complete fret numbering, diamond geometry, string-gauge range and texture use across all three profiles and six viewports.

V10.9.2: note, tuning and legend labels share optical centering based on the visible glyph bounds (Canvas TextMetrics), rather than the font em box. Bold font loading completes before initial board rendering; measured label metrics are cached. Browser checks verified 680 labels including accidentals in desktop, iPad and phone layouts; note/legend matching and all profile/viewport regressions still pass.
