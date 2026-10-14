# Android: already-paid APKs and AABs

## Access contract

Every Android package produced by this repository is already paid for. This
applies to APK and AAB, Debug and Release, guitar, bass and ukulele.

| Store app | Android package | Access |
| --- | --- | --- |
| Guitar Fretboard Hero | `com.guitar.fretboardhero` | Full |
| Bass Fretboard Hero | `com.bass.fretboardhero` | Full |
| Ukulele Fretboard Hero | `com.ukulele.fretboardhero` | Full |

Owners must have all notes, keys, positions, learning modes, Circle of Fifths
and Daily Routine options from the first launch. Switching instruments within
the app keeps full access. An empty or expired legacy purchase cache, no network,
or unavailable Google Play must not lock the app or request another payment.
There are no Android in-app purchase or restore buttons in this distribution.

`scripts/sync-web.ps1 -Platform Android` writes `unlocked: true` and
`nativeBilling: false`, and removes `testKeyHash`. The bootstrap uses the full
access policy and never initializes the billing bridge. Web remains a demo;
iOS retains its separate [StoreKit flow](APPLE_BILLING.md).

## Build and package guard

```powershell
.\scripts\build-all.ps1 -BuildType Release -Format Both -VersionCode 3 -VersionName 1.2.0
```

Version values are examples; increase the version code above existing releases.
Use the existing signing key and application ID when updating customers' apps.
See [Android distribution](TECHNICAL.md#android-distribution-apk--aab).

`scripts/validate-android-access.ps1` checks the generated configuration and then
the actual `assets/public/site.config.json` in each APK, or
`base/assets/public/site.config.json` in each AAB, before copying to `dist/`.
Missing/duplicate configuration, wrong instrument, demo access, billing enabled,
non-boolean flags or a web test key fail the build. These checks cover both
Debug and Release outputs because they share the same packaging code.

To inspect an existing package independently:

```powershell
.\scripts\validate-android-access.ps1 -Path .\dist\fretboard-hero-guitar-debug.apk -Instrument guitar
```

## Regression tests

From the repository root, with Node 22+ and PowerShell 7 on PATH:

```sh
node --test web/tests/*.test.cjs app/tests/*.test.cjs app/tests/*.test.js server/tests/*.test.mjs
```

Set `PWSH` to the PowerShell executable if it is not on PATH. The suite exercises
the real sync script for all instruments, including switching from iOS to
Android, and validates good and deliberately broken APK/AAB archive fixtures.
Startup tests execute bootstrap, access and billing together with an unavailable
store and fresh, expired or previously unlocked caches. They assert full access,
no billing calls, no reload and no purchase controls/status messages.
Both the PR check and the Android release workflow run these tests.

On a device, verify a fresh install and an update over the previous APK, then
restart offline and check Learn, Map, Circle and Daily Routine. Automated tests
do not establish real-device installation or production signing compatibility.

## Retained legacy billing code

The Android `PlayBillingPlugin`, verification backend and their tests remain in
the repository for the older in-app-purchase implementation. They are inactive
in paid Android builds. Do not enable `nativeBilling` to work around a build or
store setup issue: that would ask existing owners to pay again. Their cached
entitlement is not used by the current paid distribution. Backend payment
credentials and a `full_access` product are not prerequisites for full access
in these APKs/AABs.
