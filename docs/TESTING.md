# Regression coverage and release checks

## What a green run means

`Tests` runs Node tests on Windows and browser journeys on Linux. The browser
suite loads the actual HTML, CSS, scripts, fonts and artwork from `web/`.
It fails on uncaught JavaScript errors, failed HTTP resource loads, unusable
fretboard dimensions, missing drawing content or broken interactions.

| Layer | Coverage | Important limit |
| --- | --- | --- |
| Existing Node tests | Free/premium rules, Learn modes and Circle, translations, Privacy, microphone lifecycle and signal processing, billing races/recovery, server verification and native package preparation | DOM/audio/store doubles do not prove CSS layout or real store settings |
| Quiz unit tests | Twelve roots, thirds/fifths, combo scoring, fret progression and every instrument rank boundary | Does not render the quiz |
| Browser journeys | Learn/Map/Circle in free and premium access for all instruments; Quiz drawing, scoring, orientation, exit and replay; all Routine steps and completion; Tuner denied permission; French language, instrument persistence and Privacy navigation | Device profiles emulate screen/touch characteristics; they are not physical devices |
| Browser billing journeys | Actual modal, success and automatic reload, pending/cancelled results, verification update, restore, error panel/details and retry | Native billing bridge is simulated; no real transaction occurs |
| Android build | Existing native purchase cache tests, package identity, access configuration, permissions and R8 mapping validation | Does not interact with Play Console or a physical microphone |

## Browser matrix

| CI project | Engine | Profile |
| --- | --- | --- |
| `desktop-chromium` | Chromium | 1440 × 900 desktop |
| `desktop-firefox` | Firefox | 1440 × 900 desktop |
| `android-chromium` | Chromium | Pixel 5 emulation |
| `iphone-webkit` | WebKit | iPhone 13 emulation |
| `ipad-webkit` | WebKit | iPad Pro 11 emulation |

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

These checks can be performed by a tester with the devices or a real-device testing
service. No paid service or recurring run is configured here. Remaining automation
opportunities include native StoreKit/Play sandbox integration, real-device WebView
tests, PWA update/offline journeys and approved screenshot baselines. New UI bugs
should gain a browser regression case when observable there; domain logic belongs
in the faster Node suite.

References: [Playwright projects](https://playwright.dev/docs/test-projects),
[web server](https://playwright.dev/docs/test-webserver),
[CI](https://playwright.dev/docs/ci-intro).
