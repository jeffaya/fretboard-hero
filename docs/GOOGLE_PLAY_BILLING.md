# Google Play: free download and permanent unlock

## Commercial model

| Store app | Android package | In-app product |
| --- | --- | --- |
| Guitar Fretboard Hero | `com.guitar.fretboardhero` | `full_access` |
| Bass Fretboard Hero | `com.bass.fretboardhero` | `full_access` |
| Ukulele Fretboard Hero | `com.ukulele.fretboardhero` | `full_access` |

Upload one AAB per app, containing both the demo and full experience. There is no
separate demo/full AAB. Each app is free to download. One non-consumable purchase
unlocks all notes, keys, major/minor, positions and learning modes for **all three
instruments within that installed app**. Switching instruments does not require
another purchase. This is a permanent purchase, not a subscription.

Purchases are scoped to the installed package and Google Play account. Buying
in the guitar app does not automatically unlock the separately installed bass
or ukulele app. State this clearly in store descriptions; direct existing buyers
to the instrument selector inside their purchased app.

## Play Console setup (required before release)

1. Configure each app as free to download and complete its store/account setup.
2. In each app, create a one-time product with product ID **`full_access`**.
3. Create an active permanent **buy** purchase option whose ID is **`buy`**.
   Set the price and available countries, and activate the product/option.
   Use one standard permanent offer; rentals and preorders are deliberately
   rejected by this integration. The displayed price comes from Google Play.
4. Enable the Google Play Android Developer API in your Google Cloud project.
   Create a dedicated service account and invite its email in Play Console
   Users and permissions, scoped to these three apps. Grant the permissions
   needed to view purchase/order information and manage orders (including
   acknowledgement). Follow Google's current API setup guidance below.
5. Generate a service-account JSON key and keep it outside this repository.
   It is a backend credential: never bundle it in the APK, site config or JS.
6. Add license testers and an internal testing track. Upload signed AABs with
   a version code greater than the last upload, then install through the
   testing opt-in link with an authorized Google account.

Official references:
- https://developer.android.com/google/play/billing/one-time-products
- https://developers.google.com/android-publisher/getting_started
- https://developer.android.com/google/play/billing/test

## Verification backend (required before release)

The existing Cloudflare Worker serves
`POST https://fretboard-hero.com/api/billing/google/verify` before static assets.
It verifies package/product/token with Google, acknowledges a completed purchase,
and never consumes it. Pending, canceled, consumed or invalid purchases do not
unlock. Upstream failures return a generic error, not a successful entitlement.

In the Cloudflare account/environment that serves the official domain, configure
these two Worker secrets using Wrangler's interactive input:

```sh
npx wrangler secret put PLAY_SERVICE_ACCOUNT_EMAIL
npx wrangler secret put PLAY_SERVICE_ACCOUNT_PRIVATE_KEY
```

For the email, paste the service account JSON's `client_email` value. For the
private key, paste the decoded `private_key` value, including its PKCS8
`BEGIN PRIVATE KEY`/`END PRIVATE KEY` lines. The server also accepts escaped
newlines. Do not paste the entire JSON document or put credentials in Git.
Deploy the updated Worker through the existing deployment workflow after review.
Confirm the production route is active before distributing the paid flow.
Missing credentials or insufficient Google permissions prevent verification.

Requests are bounded, package/product allowlisted, and rate-limited to 30 per
minute per IP. Browser-origin requests are rejected: this endpoint is used by
the native Android HTTP client. The endpoint does not log purchase tokens or
upstream error bodies. CORS rejection is not authentication; access is granted
only after Google validates the purchase token for the requested package.

## App behavior

Android sync sets `nativeBilling: true`, `unlocked: false`, and removes the web
testing override. The plugin uses the installed Android package, never the
selected instrument, for verification. The shared unlock modal presents Google's
localized price, a purchase button and Restore purchases. Home also provides
Restore purchases. A verified access change reloads the app so all existing
access controls use the new entitlement.

The app checks purchases on launch, returning to the foreground, and every
15 minutes while visible. Pending payments unlock only after completion and
verification. Restore supports reinstalling with the purchasing Google account.
The backend acknowledges purchases only after they enter PURCHASED state.

A locally cached entitlement allows offline access for up to **seven days since
the last successful server verification**. It is stored in Android no-backup
storage and is not extended on errors. A definitive loss of ownership removes
access immediately on the next check. Refund/revocation while offline can remain
unnoticed for the grace period; this implementation does not use real-time
Developer Notifications. A device clock rollback before the verification time
invalidates the cache. Like other client-side content gates, this does not claim
to make bundled static content impossible to extract from a modified APK.

The web demo and its store links are unchanged. iOS StoreKit is not implemented;
explicit `sync-web.ps1 -Platform iOS` retains the existing unlocked bundle and
must not be treated as an iOS freemium purchase implementation.

## Build and validation

```powershell
.\scripts\build-all.ps1 -BuildType Release -Format Both -VersionCode 3 -VersionName 1.2.0
```

The version values above are examples; choose values above existing releases.
Signing instructions remain in [Android distribution](TECHNICAL.md#android-distribution-apk--aab).
If you have previously sold an app as a paid download or distributed paid full
APKs, decide how to honor those customers before replacing their access with
this model: no legacy-purchase migration is included.

Automated checks:

```sh
node --test server/tests/*.test.mjs web/tests/*.test.cjs app/tests/*.test.js
```

These cover server verification/acknowledgement, invalid and pending purchases,
Google errors, all package IDs, frontend purchase/restore states, cache expiry,
and existing demo/routine behavior. Google responses and native bridge calls
are mocked; they do not prove a real transaction succeeds.

Before production, test on a physical Android device through the internal track,
for **each package**:

- Localized price and purchase sheet; successful purchase unlocks all instruments.
- Cancellation leaves demo usable; delayed payment stays locked until approved.
- Closing/reopening during payment and already-owned purchases restore correctly.
- Reinstall and Restore purchases using the purchasing account.
- Refund/revoke, then restore: access returns to demo.
- Offline startup within grace; expired cache returns to demo without payment loss.
- Google/API outage shows a retry message, preserves only unexpired cached access.
- A different Play account/package does not inherit another package's purchase.
- Portrait and landscape layouts on phone/tablet, including the unlock modal.

A real signed Android build and Play transaction must be validated in that track;
backend credentials, active products and tester accounts are external setup steps.
