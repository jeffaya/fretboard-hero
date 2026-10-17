# Google Play: three free apps with a permanent unlock per app

## Distribution and purchase scope

`app/instruments.json` is the source of truth for the three application identities:

| Application | Initial instrument | Android package / iOS bundle ID |
| --- | --- | --- |
| Guitar Fretboard Hero | guitar | `com.guitar.fretboardhero` |
| Bass Fretboard Hero | bass-4 | `com.bass.fretboardhero` |
| Ukulele Fretboard Hero | ukulele | `com.ukulele.fretboardhero` |

Each application has its own name, launcher icon, store listing, data and purchases.
Each contains the same shared engine and all three instruments. The last selected
instrument is remembered locally; switching it never changes the installed app ID.

All apps are free to download and start in demo mode. One permanent, non-consumable
`full_access` purchase unlocks every instrument, note, key, position, mode and premium
routine **inside the application where it was purchased**. It is not a subscription.
For example, a Guitar buyer can play bass inside Guitar without installing Bass.
The separate Bass and Ukulele apps do not inherit that purchase. Android purchases
are not shared with Apple. No Fretboard Hero account or URL license key is required.
The pre-release rule “every APK/AAB is already paid” is replaced by explicit profiles.

## User interface: one shared modal

`web/core/access.js` mounts the same modal and design-system styles on web and native.
On the website it displays the selected instrument's Google Play / App Store links,
plus QR codes on desktop. Inside a Store app, `native-billing.js` supplies the localized
price, native purchase action, restoration and purchase status in that same modal.
Native purchase buttons do not redirect to an external payment page. Preview builds
are already unlocked and do not call the billing plugins.

## Configure Play Console and Cloudflare

For **each** of the three package IDs above:

1. Create/use the corresponding app record, set its download price to free, and use
   its instrument-specific name, icon, screenshots and listing.
2. Create a one-time, permanent non-consumable product with exact ID `full_access`.
   Create a **buy** purchase option with exact ID `buy`. Set the price, countries,
   localized title/description, then activate the product and option. The description
   must explain that all instruments are included within this app. Do not use a rental,
   preorder, consumable or subscription. The app reads the price from Google.
3. Complete the account's required payments, tax and banking configuration.
4. Enable Google Play Android Developer API and create a service account. Invite its
   email in Play Console and grant purchase/order access to all three applications.
   Never put its private key on a device or in git.
5. Add `PLAY_SERVICE_ACCOUNT_EMAIL` and `PLAY_SERVICE_ACCOUNT_PRIVATE_KEY` as secrets
   on the Cloudflare Worker. The latter accepts PEM with real or escaped newlines.
6. Deploy the updated Worker before distributing these Store builds. It serves
   `POST https://fretboard-hero.com/api/billing/google/verify` and returns the verified
   `packageName`, `productId`, `unlocked` and `status`. The native app rejects a response
   for a different app/product. Deployment through main does not create the secrets.
7. Build signed Store AABs and upload each to its matching internal test track. Add
   license testers, opt in and install using each Play test link with the test account.

These external account settings are not configured or verified by source-code tests.
The real iOS store URLs must also be supplied; empty URLs disable their web buttons.
Android destinations in `web/site.config.json` point to the corresponding three apps.

## Store and Preview builds

```powershell
# Three signed APKs + three AABs, built sequentially.
.\scripts\build-all.ps1 -Profile Store -BuildType Release -Format Both -VersionCode 7 -VersionName 1.1.0

# One fully unlocked preview, with a separate installation identity.
.\scripts\build-instrument.ps1 -Instrument guitar -Profile Preview -BuildType Debug -Format Apk -VersionCode 7 -VersionName 1.1.0
```

Use a version code above the last uploaded code for each app. Store is the default,
including Debug builds. Preview must be explicit and appends `.preview` to that app's
ID and ` Preview` to its name. Preview never enables billing. Both profiles remove
`testKeyHash`; the URL testing key remains website-only.

Output: `dist/fretboard-hero-<instrument>-<store|preview>-<debug|release>.<apk|aab>`.
For example: `dist/fretboard-hero-bass-4-store-release.aab`.
Each build checks the final APK/AAB's web access configuration and native Capacitor
identity before exporting it. The archive must contain exactly one of each config,
with matching app ID, default instrument and profile. A stale or mixed package fails.
The native manifest identity and signatures are also checked in CI for each APK.
Build sequentially within one checkout: all variants reuse the same native tree.

## Verification, offline use and restoration

The native plugin gets the installed package ID from Android, never from the selected
instrument. The backend allowlists the three apps and verifies the token against that
exact package and `full_access` using Google's API. It acknowledges purchases and never
consumes them. Tokens and raw Google errors are not logged or sent back to JavaScript.

After HTTPS verification, Android stores the token in an AES-GCM authenticated file
under `getNoBackupFilesDir()`, with its key in Android Keystore. Authentication binds
the proof to the package and product; copying it to another app does not unlock it.
Atomic writes preserve existing purchases on write failure. The old plaintext cache
is not imported. A verified permanent purchase has no offline expiry.

Launch/resume checks refresh ownership. Empty Play queries trigger verification of
the previous token before revocation. Network errors, pending payments and malformed
responses preserve existing verified access. Confirmed refunds/revocations clear it;
detection requires a successful online check. New pending/cancelled payments do not
create access. Restore purchases is available even when unlocked.

After payment, ownership reconciliation runs independently of the outstanding
purchase callback. Returning from the store, a purchase-change event or restored
connectivity triggers a silent check, even if `purchase()` has not settled. A failed
verification or pending result also starts recovery automatically: one immediate
check, then up to five retries after 1, 2, 5, 10 and 20 seconds (plus request time).
Retries pause in the background, coalesce overlapping events and stop on verified
ownership or cancellation. Pending/cancelled payments never grant access, and silent
checks preserve the visible payment feedback. iOS uses its silent `refresh` method,
not the account-synchronizing Restore action.

Once native verification changes ownership, the WebView reloads automatically once
to rebuild the immutable access model from the verified native cache. The user does
not need to close the application. This is an internal page refresh, not an in-place
update of an ongoing exercise. Late callbacks cannot trigger a second reload.
Deploying the Worker alone does not update this bundled JavaScript: rebuild the
Store AAB with a higher version code and install that update through Play testing.

Reinstallation, cleared app data or a new device requires an online restore with the
purchasing Google account **in the same app**. No proof is transferred in Android backup.

## Validation before publication

Automated checks run the real sync/preparation scripts for both profiles and all apps,
verify final archive fixtures, exercise cross-app purchase boundaries and compile/test
the native encrypted cache. CI builds Store APK/AAB and Preview APK for all three apps;
iOS is compiled separately. Tests mock store responses: they do not prove live payments.

On internal testing, verify each app: fresh demo, price, successful purchase, cancellation,
pending completion, interruption after payment, reinstall/restore, offline restart,
server outage, refund/revoke and repurchase. After purchase, switch through all three
instruments and check full access. Install another app and confirm it stays in demo
without its own purchase. Also check microphone behavior on a device.

For post-payment recovery specifically, keep the app open after a new test purchase
and confirm that the paywall clears automatically. Repeat with delayed payment
completion and a temporary verification outage, then restore connectivity without
force-closing the app. Check that cancellation and still-pending payments stay locked.
Use a fresh test purchase/account or refund/revoke the existing test entitlement;
an already-owned item only exercises restoration, not a new payment callback.

References:
- https://developer.android.com/google/play/billing/integrate
- https://developer.android.com/google/play/billing/security
- https://developer.android.com/google/play/billing/test
- https://developer.android.com/privacy-and-security/keystore
