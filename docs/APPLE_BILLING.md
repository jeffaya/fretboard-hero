# App Store: three apps, one permanent unlock per app

Publish separate Guitar, Bass and Ukulele Fretboard Hero apps. The identity and icon
for each build come from `app/instruments.json`:

| Application | Bundle ID |
| --- | --- |
| Guitar Fretboard Hero | `com.guitar.fretboardhero` |
| Bass Fretboard Hero | `com.bass.fretboardhero` |
| Ukulele Fretboard Hero | `com.ukulele.fretboardhero` |

Each supports iPhone and iPad, starts in its instrument's universe and remembers the
last selection. All three instruments share one verified entitlement **inside each
app**. A non-consumable `lifetime_access` purchase unlocks all notes, keys, modes and
premium routines there, without a subscription. It does not transfer to the other
apps or to Android. StoreKit scopes purchases to the installed application.

The website and native apps use the same modal from `web/core/access.js`. Website
buttons open the appropriate app's store listing; native buttons display Apple's
localized price, open its purchase sheet, and offer Restore purchases.

## App Store Connect setup — repeat for each app

1. Register the explicit bundle ID in the Apple Developer account and create its
   matching app record in App Store Connect.
2. Complete the required paid-app agreement, tax and banking setup. Make the download free.
3. Create an In-App Purchase of type **Non-Consumable**, exact product ID `lifetime_access`,
   within this app. Set its price, availability, localization and review screenshot.
   Describe the permanent access to all instruments within this app. The same product
   name in another app does not share ownership.
4. Select the development team and provisioning profile for the chosen bundle ID in
   Xcode. The target includes In-App Purchase capability.
5. Submit the first purchase product with its app version. Configure Sandbox testers
   and validate through TestFlight before submitting a production release.
6. Put each app's actual App Store URL in its instrument entry in
   `web/site.config.json`. Unconfigured URLs leave that web button disabled.

Google Play and the App Store use the same product identifier, `lifetime_access`.
Configure it separately in each app's store catalog before distributing rebuilt
Store apps. Updating this repository does not create or modify App Store Connect
products; the catalog and installed binary must agree on the identifier.

StoreKit 2 verifies Apple's signed transactions on device. No Apple private key is
embedded or required by this implementation; the Google verification Worker is not used.
Product identifiers are scoped to an app:
https://developer.apple.com/documentation/appstoreserverapi/productid

## Prepare and build

On a Mac with Xcode, Node 22+ and PowerShell 7:

```sh
cd app
npm ci --no-audit --no-fund
cd ..
pwsh -File scripts/prepare-ios.ps1 -Instrument guitar -Profile Store
open app/ios/App/App.xcodeproj
```

Use `guitar`, `bass-4` or `ukulele` to select the application identity, initial
instrument, name and icon. Store is the default: demo plus native billing, no web
preview key. Preview explicitly unlocks everything without billing and appends
`.preview` to this app's bundle ID. The scripts align Capacitor, Xcode, plist,
AppIcon and bundled web configuration. Prepare one app/profile at a time because
the native working tree is shared; never hand-edit generated `app/www`.

Set a new marketing/build version, select the signing team, archive for a generic
iOS device, then distribute to the matching App Store Connect record through Organizer.
Repeat for each application. iOS uses an archive/IPA, not Android APK/AAB files.
Certificates, provisioning and uploads are external configuration.

The iOS CI matrix compiles all three Store apps for the iPhone/iPad simulator without
signing. It validates compilation and identity, not real provisioning or payments.

## Purchase lifecycle

The shared `StoreBillingPlugin` accepts only verified StoreKit transactions for
`lifetime_access` of type non-consumable. Current entitlements must be unrevoked. There
is no writable JavaScript purchase flag. Completed transactions remain restorable.

Startup/resume and periodic foreground checks read `Transaction.currentEntitlements`
silently. Only a user restore calls `AppStore.sync()`, which may require authentication.
Transaction updates cover pending approval, purchases completed elsewhere and revocations.
Pending/cancelled results do not grant a new entitlement. Offline access uses StoreKit's
locally available verified transactions. Refund detection depends on updated store data.
There is no cross-app/cross-store account linking or server-notification integration.

## Required device tests

For each application, configure a local StoreKit test product or use Sandbox/TestFlight.
Do not attach a local StoreKit configuration when validating the real App Store catalog.
Verify: localized price, successful payment, cancellation, Ask to Buy pending/approval,
interrupted payment, restoration after reinstall with the same Apple Account, refunds,
offline startup, unavailable catalog and disabled purchases. Unverified transactions
must not unlock. After purchase, all three instruments must work inside that app while
the other installed apps retain their own purchase state. Check iPhone/iPad layouts.

JavaScript tests mock the native bridge and cover all application/instrument/platform
combinations, silent refresh and explicit restore. They do not prove a real transaction.

References:
- https://developer.apple.com/documentation/storekit/transaction/currententitlements
- https://developer.apple.com/documentation/storekit/appstore/sync()
- https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/
- https://capacitorjs.com/docs/ios/custom-code
