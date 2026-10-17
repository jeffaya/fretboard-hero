# Privacy policy and Google Play release

## Policy and publication

The page is implemented at `web/privacy.html`. Cloudflare Workers static assets
serve this file at **https://fretboard-hero.com/privacy** with the existing default
HTML handling. No Worker route, authentication, PDF viewer, client-side router,
JavaScript, third-party font or external script is needed to read it.

French and English are both present in the initial HTML (`#fr` / `#en`). The home
screen links to the public URL; its label is translated in all 11 app languages.
The native build copies `web/`, so rebuilding each app includes the home link.
Already-installed APKs/AABs do not acquire this link from a website deployment.

The user confirmed the publisher/data controller as **Jean-François Seignemorte**,
acting personally in France, and selected **hello@fretboard-hero.com** as the
public privacy contact on 2026-10-14. Both language versions use this address.
The former contact placeholders and draft notice have been removed. Selecting
an address does not test mail delivery; this change does not configure email
routing, send test messages or publish a personal destination mailbox.

Release notes:

- Merge and deploy through the existing main-branch workflow, then check the
  public `/privacy` URL returns readable HTML. Rebuild the native apps to include
  the home link in installed versions.
- Production Cloudflare services, log retention, dashboard-injected analytics,
  cookies and applicable transfer safeguards are external account settings.
  The policy describes the known hosting/verification flow without inventing
  a fixed log retention period or claiming zero infrastructure logging. Review
  these settings and the support email provider when completing Data safety
  or changing the hosting/messaging configuration.
- Keep the policy aligned with the actual release SDKs, merged Android manifest
  and Play target audience. It does not invent an age restriction or claim
  Families compliance. Child-directed releases require the relevant additional
  checks if children are included in the selected target audience.
- Complete Data safety using the exact shipped build and provider configuration.
  The policy and code audit do not constitute a guarantee of regulatory
  compliance or Google Play approval.

## Data inventory checked against main

Baseline: `adaac07` (2026-10-14). Audit the current release again when behaviour,
SDKs or hosting settings change.

| Data | Actual implementation | Recipient / retention |
| --- | --- | --- |
| Microphone samples and spectrum | `web/core/microphone.js`; Web Audio, no recorder/upload | Device memory during listening; released on stop, hidden page, pagehide or native background event |
| Detected notes/chords/timing | Pitch/chord/routine engines | Local processing; no remote audio service |
| Language | `web/core/i18n.js`, `fretboard-language` | Local storage until replaced/cleared |
| Microphone choice | `fretboard-tuner-microphone`, `fretboard-routine-microphone` | Local storage until replaced/cleared |
| Instrument selection | `fretboard-instrument` (legacy session fallback) | Local storage until replaced/cleared |
| Exercise alternation | `fretboard-routine-diagonal-*` | Local storage |
| Rhythm progression | `web/core/routine-patterns.js`, `fretboard-rhythm-practice-v1` | Local attempt/success/round counters; not uploaded |
| Google purchase proof | Android `PlayBillingPlugin`, `server/play-billing.mjs` | Package ID, product ID, token sent over HTTPS to Cloudflare Worker and verified with Google |
| Purchase response | Google Android Publisher API | Worker inspects purchase/acknowledgement/consumption state; no purchase database or token logging in source |
| Android offline entitlement | Native no-backup file | Server-verified purchase token encrypted/authenticated with Android Keystore, bound to package/product; no offline expiry; cleared on confirmed revocation or app data removal |
| iOS purchase entitlement | `StoreBillingPlugin.swift` | Verified StoreKit transactions; no forwarding to Android backend |
| IP address / request metadata | Cloudflare network and `PLAY_BILLING_LIMITER` | IP used for rate limiting (30 requests per 60 seconds); infrastructure retention must be checked separately |
| System backup | Android `allowBackup=true`; OS settings | Some local data may be backed up or transferred; no-backup Android entitlement excluded |
| Support email | External to app; `hello@fretboard-hero.com` selected by publisher | Address, content, optional attachments; verify actual mail provider and operational deletion practices |

The source has no Fretboard Hero account registration, remote progression sync,
advertising SDK, advertising identifier, Firebase Analytics or crash-reporting
SDK. Fonts and QR-code generation are bundled locally. These findings concern
the repository, not uninspected production dashboard integrations.

## Play Console: avoid a blanket “no data collected” answer

The audio stays on the device, but the Android purchase proof leaves it. The Data
safety declaration must cover relevant off-device processing and SDK behaviour.

| Topic | Guidance from this implementation |
| --- | --- |
| Audio | Local microphone processing is not off-device audio collection. Keep the microphone permission and disclosures accurate. |
| Purchase history | Review and declare the Google purchase proof/verification flow under financial information → purchase history as appropriate to the shipped integration. Do not equate lack of a database with lack of collection. |
| Ephemeral processing | The Worker processes tokens in memory, but that alone does not establish ephemeral processing across Google and all infrastructure. Inspect provider retention before choosing this answer. |
| IP / other technical information | Review the exact SDK and Cloudflare behaviour and map retained information to the current Console categories and purposes. Do not invent location collection from a permission the app does not request. |
| Sharing | Transfers to a service provider can qualify for a specific Data safety exception; inspect the actual relationship and conditions. The privacy policy still explains the recipients. |
| Required/optional | Microphone and purchases are optional for demo use; verification is necessary for purchased access. Answer at each data-type level. |
| Purpose | App functionality and purchase fulfilment; abuse/fraud prevention for technical checks. No advertising purpose found in source. |
| Deletion | Local clearing instructions are provided. No app account exists. Store transaction records and system backups have separate lifecycles. |

## Sources consulted

- Google Play User Data (policy, in-app link, contact, retention and deletion):
  https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play Data safety (on-device, ephemeral processing, purchases and sharing):
  https://support.google.com/googleplay/android-developer/answer/10787469
- CNIL transparency guidance:
  https://www.cnil.fr/fr/passer-laction/rgpd-exemples-de-mentions-dinformation
- Cloudflare privacy/retention:
  https://www.cloudflare.com/privacypolicy/
- Cloudflare static HTML routes:
  https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/

Do not promise a specific infrastructure retention period without checking the
production settings. Keep this inventory, the public policy and store forms in
sync when releasing authentication, analytics, cloud sync or new SDKs.
