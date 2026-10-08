# App Store: permanent unlock on iPhone and iPad

The iOS app now starts in demo mode. Its shared paywall uses **StoreKit 2** to
purchase a non-consumable `full_access` product, display Apple's localized price,
and restore purchases. One purchase unlocks all notes, keys, modes and all three
instruments **inside that installed app**, without a subscription.

Three separate store apps can use the existing bundle IDs:

| App | Bundle ID | Product ID (in that app) |
| --- | --- | --- |
| Guitar Fretboard Hero | `com.guitar.fretboardhero` | `full_access` |
| Bass Fretboard Hero | `com.bass.fretboardhero` | `full_access` |
| Ukulele Fretboard Hero | `com.ukulele.fretboardhero` | `full_access` |

Purchases do not transfer automatically between these separate apps or from
Google Play. A buyer can use the instrument selector within the purchased app.
The same app supports both iPhone and iPad and restores with the purchasing
Apple Account. Store submission and approval are separate from this integration.

## App Store Connect setup

1. Register the explicit bundle IDs in your Apple Developer account and create
   the corresponding app records in App Store Connect.
2. Complete the required paid-app agreement, tax and banking setup, then set the
   app itself to free download.
3. For each app, create an In-App Purchase of type **Non-Consumable**, with the
   exact product ID `full_access`. Configure its price, availability,
   localization and review screenshot. Explain that it permanently unlocks
   all features and all instruments within that app.
4. In Xcode select your development team and signing profile. The target includes
   the In-App Purchase capability; confirm provisioning for the actual bundle ID.
5. Submit the first purchase product with its app version in App Store Connect.
   Configure Sandbox testers and use TestFlight before a production submission.

No Apple private key is embedded or required by this implementation. StoreKit
performs Apple's signed-transaction verification on device. The Google-only
Cloudflare route is not used for Apple purchases.

## Prepare and build

On a Mac with Xcode, Node 22+ and PowerShell 7 (`pwsh`):

```sh
cd app
npm ci
cd ..
pwsh -File scripts/prepare-ios.ps1 -Instrument guitar
open app/ios/App/App.xcodeproj
```

Use `bass-4` or `ukulele` for the other variants. The preparation script reuses
the web sync, enables native billing, removes the web preview key and aligns
Capacitor identity, Xcode bundle ID, display name and icon. Prepare/archive one
variant at a time: these scripts mutate the shared native working tree.

In Xcode set the marketing version and a new build number, select your team,
and archive for a generic iOS device. Distribute through Organizer to App Store
Connect. iOS uses an Xcode archive/IPA, not Android APK/AAB files. No certificate,
profile or App Store upload is supplied by this repository.

The **Check iOS build** GitHub workflow compiles the shared iPhone/iPad target
for the simulator without signing. It checks integration compilation, not real
payments or provisioning. All three variants share the same Swift implementation.

## Verification and lifecycle

`StoreBillingPlugin` accepts only verified StoreKit transactions for
`full_access` of type non-consumable. Current entitlements must be unrevoked;
unverified transactions never unlock. There is no writable JavaScript purchase
flag. Finished transactions remain restorable because this is non-consumable.

Startup and resume read `Transaction.currentEntitlements` silently, as do periodic
foreground checks. Only pressing **Restore purchases** calls `AppStore.sync()`,
which may ask the customer to authenticate. A transaction update listener handles
Ask to Buy, purchases completed outside the app and revocations. Updates received
while a purchase is open are rechecked when it finishes. Pending/canceled results
do not themselves grant access.

Offline entitlement uses StoreKit's locally available verified transaction data;
there is no extra seven-day cache like the Android implementation. Refund and
revocation detection depends on StoreKit receiving updated information. This
integration does not provide server notifications or cross-store account linking.

## Required device and payment tests before release

- In Xcode, create a StoreKit configuration with non-consumable `full_access` and
  attach it to the local Run scheme for simulated purchases. Do not select this
  local configuration when validating the real App Store Connect catalog.
- Test Sandbox/TestFlight for each bundle ID: localized price, completed purchase,
  canceled purchase, Ask to Buy pending/approval, interrupted purchase and restore.
- Check an unverified transaction never unlocks; refunds/revocations return to demo.
- Reinstall and restore with the purchasing Apple Account; test a different account.
- Switch among all three instruments after purchase and ensure access is retained.
- Test offline startup after purchase, unavailable catalog and disabled purchases.
- Check iPhone/iPad in portrait and landscape; back navigation and shared menus.

Automated JavaScript tests mock the native bridge, covering iOS routing, silent
refresh versus explicit restore, pending approvals and updates during purchase.
They do not validate Swift execution, signing or a real Apple transaction.

References:
- https://developer.apple.com/documentation/storekit/transaction
- https://developer.apple.com/documentation/storekit/transaction/currententitlements
- https://developer.apple.com/documentation/storekit/appstore/sync()
- https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/
- https://capacitorjs.com/docs/ios/custom-code
