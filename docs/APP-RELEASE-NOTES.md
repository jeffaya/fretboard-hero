# Android App — Release notes

Version history for the **Android app** (Capacitor wrapper), separate from
the website changelog ([`web/README.md`](../web/README.md#release-notes)).
For every new app version, add an `## App vX` entry below describing what
changed.

## App v1.1.3 — Google Play connection diagnosis (pending device validation)

- Show all explicit billing, catalog, purchase verification and restoration failures
  in a red alert panel with an icon, a clear title and actionable explanation.
  Technical details stay collapsed by default; pending/cancelled payments remain
  ordinary status messages. The panel and guidance support all eleven languages.
- Preserve the Google Play response code, operation and SDK diagnostic behind an
  optional, localized Error details control; never expose purchase tokens or backend errors.
- Retry only known transient setup/catalog failures, twice at one- and two-second
  intervals before a payment sheet opens. Billing refusals and payment errors do not
  trigger a second purchase flow.
- A successful catalog retry continues the original purchase click. An unavailable
  catalog still blocks payment, and repeated taps cannot open duplicate flows.
- Requires a rebuilt Store app with a higher version code. The cause of the reported
  version-code-5 connection failure remains unconfirmed until device diagnostics are read.

## App v1.1.2 — replacement Google Play product (pending device validation)

- Use `lifetime_access` for Google Play catalog lookup, purchase, restoration and
  server verification. The permanent purchase option remains `buy`.
- Replace the deleted `full_access` product before launch, without legacy purchase
  compatibility: there are no existing customers to migrate.
- Deploy the updated Worker and rebuild Store AAB/APK with a higher version code.
  Configure the new product in each Android application before distributing it.

## App v1.1.1 — automatic post-payment recovery (pending device validation)

- Reconcile verified ownership on return from the store even while its purchase
  callback is still outstanding, with WebView visibility and online fallbacks.
- Retry transient post-payment verification failures and pending payments with
  bounded delays; keep payment feedback and existing offline entitlements intact.
- Automatically refresh the WebView once after verified ownership changes;
  users no longer need to force-close the app in these recovery scenarios.
- Requires a newly built Store AAB/APK with a higher version code. Validate real
  Google Play purchases on the internal test track before publication.

## App v1.1.0 — pending store configuration and device payment tests

- Keep three distinct Guitar/Bass/Ukulele apps with their own IDs, names and icons.
- Store builds are free demos. A permanent `full_access` purchase unlocks every
  instrument and feature within the app where it was bought; no cross-app sharing.
- Reuse the website's modal with native price, purchase and restoration actions.
- Separate explicit, fully unlocked Preview builds from Store packages.
- Preserve verified Android purchases offline without an arbitrary deadline,
  using encrypted proof bound to the app and product; handle refunds and outages.
- Build and validate each app's Android packages and iOS simulator target in CI.
- See the Google Play and Apple billing guides for external configuration and
  real purchase tests required before publication.

## App v1

First installable version of the Android app, shipped as 3 separate debug
APKs built from the same `web/` code:

- 3 separate apps installable side by side: **Guitar Fretboard Hero**
  (`com.guitar.fretboardhero`), **Bass Fretboard Hero**
  (`com.bass.fretboardhero`), **Ukulele Fretboard Hero**
  (`com.ukulele.fretboardhero`).
- **100% offline**: all assets are bundled into the APK, no network request
  is needed to use Learn, Map, Circle of Fifths or Quiz.
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
