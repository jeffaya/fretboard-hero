# Regression coverage and release checks

## What a green run means

`Tests` runs Node tests on Windows, Chromium/Firefox journeys on Linux and
WebKit journeys on macOS (the closest Playwright platform to Safari). The browser
suite loads the actual HTML, CSS, scripts, fonts and artwork from `web/`.
It fails on uncaught JavaScript errors, failed HTTP resource loads, unusable
fretboard dimensions, missing drawing content or broken interactions.

| Layer | Coverage | Important limit |
| --- | --- | --- |
| Existing Node tests | Free/premium rules, Learn modes and Circle, translations, Privacy, microphone lifecycle and signal processing, billing races/recovery, server verification and native package preparation | DOM/audio/store doubles do not prove CSS layout or real store settings |
| Quiz unit tests | Twelve roots, thirds/fifths, combo scoring, fret progression and every instrument rank boundary | Does not render the quiz |
| Browser journeys | Learn/Map/Circle in free and premium access for all instruments; Quiz drawing, scoring, orientation, exit and replay; all Routine steps and completion; Tuner denied permission; French language, instrument persistence and Privacy navigation | Device profiles emulate screen/touch characteristics; they are not physical devices |
| Browser billing journeys | Actual modal, success and automatic reload, pending/cancelled results, verification update, restore, error panel/details and retry | Native billing bridge is simulated; no real transaction occurs |
| Android PR build | Native inset tests on APIs 28, 29, 35 and 36, purchase cache, optimized release APK/AAB, package identity, access configuration, permissions and R8 mapping validation | Robolectric is not a device; CI uses a disposable signing key and never publishes this package |

## Browser matrix

| CI project | Engine / host | Profile |
| --- | --- | --- |
| `desktop-chromium` | Chromium / Linux | 1440 × 900 desktop |
| `desktop-firefox` | Firefox / Linux | 1440 × 900 desktop |
| `android-chromium` | Chromium / Linux | Pixel 5 emulation |
| `iphone-webkit` | WebKit / macOS | iPhone 13 emulation |
| `ipad-webkit` | WebKit / macOS | iPad Pro 11 emulation |

Quiz journeys resize portrait/landscape during play. Browser billing runs on the
Android and iPhone profiles with the corresponding PlayBilling/StoreBilling test
double. The test server serves only `web/`; configuration overrides and fake native
responses are injected by the test runner. No testing switch is added to production.

WebKit catches engine/layout differences that Chromium misses, but is not the
shipping Safari/iOS build. A green result does not certify every OS version,
installed PWA behavior or native WebView integration. Geometry and interaction
assertions are not pixel-perfect visual comparisons.

The initial browser run exposed a real Quiz lifecycle bug: the header's Back
button left its timer alive, allowing the results modal to appear over Home.
Leaving Quiz now clears the timer, pending question state and results overlay.
The same journey covers this regression on every instrument and browser profile.

## Run and diagnose

From `tests/browser`:

```sh
npm ci
npx playwright install --with-deps
npm test
npm test -- --project=iphone-webkit
```

Use Node 22 or later. Each test gets a fresh browser context; retries are disabled
so a flaky failure remains visible. Do not use forced clicks or skip an assertion
to turn an interaction failure green. Fix a test when its expectation is wrong;
fix the application when a real user cannot complete the intended action.

On GitHub, inspect the failing `Browser / ...` check. Its failure artifact contains
an HTML report, screenshots and Playwright traces for 14 days. Open a downloaded
trace with `npx playwright show-trace path/to/trace.zip` from `tests/browser`.
No store credentials or live purchase tokens are used in browser fixtures.

The shared test workflow runs on relevant PR changes. Cloudflare deployment and
Android packaging depend on the same workflow succeeding for their exact checkout.
A failed prerequisite prevents the deploy/build job from running. Repository rules
can additionally require these checks before merging; this PR does not alter rules.

## Android window and release regressions

`Android / insets and optimized release` builds the real Store profile with a
temporary CI key, validates the generated Capacitor plugin registry, and runs
`app/android/gradlew testDebugUnitTest` (use `gradlew.bat` on Windows). It requires
JDK 21 and Android SDK 36. The native tests measure a real Android View container
under Robolectric on APIs 28, 29, 35 and 36: cutouts, side navigation in landscape,
gesture/three-button navigation, keyboard open/close, repeated dispatch and inset
removal. Purchase-cache tests run in the same job. Reports are retained for 14 days;
CI packages are never uploaded to Play or the GitHub Android release.

`MainActivity` draws the dark background edge to edge and `WebViewInsets` pads the
WebView's parent by the maximum of system bars, display cutouts and IME insets.
Child insets are consumed. Android's generated HTML uses `viewport-fit=contain`
and scoped content gaps so Chromium cannot apply the same safe area twice.
Capacitor SystemBars CSS/native inset handling is explicitly disabled, avoiding
the previous competing JavaScript and native inset owners. The separate legacy
StatusBar plugin stays installed for iOS but is excluded from Android by the
platform plugin allowlist. New Android plugins must be added to that allowlist.

Release builds enable resource shrinking and AGP 8.13's integrated R8 resource
optimization. AGP is deliberately not upgraded to 9 in this fix: that is a
separate Capacitor/build-tool migration. Play may still recommend AGP 9, and its
warnings about the already uploaded version 6 remain until a new bundle is
uploaded and analyzed. This change does not increment version codes or publish.

References: [Android edge-to-edge setup](https://developer.android.com/develop/ui/views/layout/edge-to-edge-manually),
[R8 optimized resource shrinking](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization).

## Device checks that remain necessary

Before a store release, validate on Play internal testing and Apple Sandbox/TestFlight
as described in [Google Play billing](GOOGLE_PLAY_BILLING.md) and
[Apple billing](APPLE_BILLING.md):

- New purchase, pending approval/completion, cancellation, automatic unlock while
  the app stays open, reinstall/restore, offline paid startup, refund/revocation.
- The actual store catalog, product availability, price, service-account access,
  signatures and native bridge in the distributed package.
- Microphone permission, actual instrument input, interruption/resume and switching
  between Tuner and Routine on iPhone/iPad and Android hardware.
- Android 15/16: Home, Learn, Map, Circle, Quiz, Routine and purchase/error dialogs
  in portrait/landscape, with gesture and three-button navigation; a cutout device
  and keyboard open/close (including the test-access input). Check usable controls
  and no doubled padding with both older and current Android System WebView.

These checks can be performed by a tester with the devices or a real-device testing
service. No paid service or recurring run is configured here. Remaining automation
opportunities include native StoreKit/Play sandbox integration, real-device WebView
tests, PWA update/offline journeys and approved screenshot baselines. New UI bugs
should gain a browser regression case when observable there; domain logic belongs
in the faster Node suite.

References: [Playwright projects](https://playwright.dev/docs/test-projects),
[web server](https://playwright.dev/docs/test-webserver),
[CI](https://playwright.dev/docs/ci-intro),
[WebKit platform differences](https://playwright.dev/docs/browsers#webkit).
