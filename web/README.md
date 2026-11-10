## CSS ownership

The stylesheet order is explicit in `index.html`. Layout rules are split by responsibility:

| File | Owns |
| --- | --- |
| `styles.css` | Shared tokens, reset and application shell |
| `controls.css` | Navigation, adaptive toolbars, selects and drawers |
| `fretboard.css` | Shared neck layout and Learn legend |
| `quiz.css` | Quiz HUD, feedback, result dialogs and rank ladder |
| `circle.css` | Circle of fifths layout |
| `home.css` | Home composition and instrument selection |
| `footer.css` | Shared home and guide footer |
| `theme.css` | Shared typography, surfaces and button variants |
| `routine.css`, `premium.css`, `locales.css`, `tuner.css` | Feature-specific presentation |

Home keeps branding on the left and activities on the right in landscape, with the same blocks stacked in portrait. Instrument selection lives below the brand; language selection shares the footer with Privacy policy and the web demo's Get the app link. Secondary home actions belong in this shared footer, not in an extra menu row; Get the app opens the existing download dialog and stays absent from native apps and unlocked previews. The bottoms of both landscape columns align; the whole composition stays vertically centered when it fits. At 1000 px wide and 740 px high or above in landscape, all six menu cards use full-width rows and the instrument selector anchors the bottom of the brand column. Shorter landscape screens retain the compact card grid and a smaller logo. The tuner has a dedicated first card; Practice groups Daily Routine, Learn and Quiz, while Explore groups the map and circle. Home layout and instrument selection belong in `home.css`; shared footer links belong in `footer.css`; the upward language popover belongs in `locales.css` and `core/i18n.js`. The tuner binds the static `data-open-tuner` card and the existing routine shortcut. Language controls stay in the footer at every breakpoint.

Edit the owning component and its responsive rule instead of appending a new versioned override to the global stylesheet. Keep intentional state selectors (active, locked, hidden, focus, reduced motion) explicit. The remaining `!important` declarations protect typography, hidden content and reduced-motion preferences; avoid adding them to layout rules.

The shared access modal adapts to its platform: the website keeps the motivational pitch below the heading and states that downloading is free directly on each store button, without a separate badge or purchase copy. The native app shows the price, purchase/restore actions and the full-access purchase scope. Both store-button captions are translated in all eleven interface languages; they describe the download, not full access.

The compact drawer and inline toolbar breakpoints are shared with `core/controls.js` and `app.js`. Preserve their behavior when changing CSS. Android applies real system/keyboard insets outside the WebView; `data-native-insets="android"` scopes the remaining content spacing and is stamped by `scripts/sync-web.ps1` before first paint. The website and iOS keep the existing spacing. The script copies every stylesheet into native builds; generated `app/www` must not be edited.

For CSS changes, compare Home, Learn/Map controls, Daily Routine completion/replay, Circle, Quiz/results, Premium, language menu and Tuner on portrait and landscape viewports. Include all three instruments and a non-Latin locale. Refresh changed CSS URLs in `index.html`; refresh the bootstrap/app URL when JavaScript changes.

Pentatonic position guides are owned by `core/pentatonic-renderer.js` and `fretboard.css`. They form one linear strip below the horizontal neck or beside the vertical neck. Shared fret space is divided between neighbouring positions, with a small gap between each closing/opening bracket. The strip is computed before filtering so isolated positions stay in the same place. Note geometry remains unchanged. The SVG reserves room for the guides while keeping badge text at a readable screen size. Short landscape phones scroll vertically to preserve neck size. The stage resize observer updates the guide layout when controls or orientation change.

The Quiz screen has an explicit viewport height (`100dvh`, with a `100vh` fallback),
so its flex stage receives a definite remaining height below navigation, HUD and
question. On portrait phones and tablets, the SVG is absolutely positioned inside
that stage with explicit percentage width and height. Keep this separate from the
SVG's intrinsic flex sizing: an auto width and percentage height can leave the neck
invisible in WebKit. The existing viewBox preserves the neck's aspect ratio and the
resize handler rebuilds its geometry after rotation. Check first start, replay and
portrait/landscape rotation on iPhone and iPad when changing this layout.

## V10.6.3 — Instrument artwork

- Replaced hand-drawn instrument symbols with a single transparent WebP sprite reconstructed from the reference screenshot using image generation. It follows the reference silhouettes but is not a pixel-identical extraction of original assets.
- All four cells use the same fixed aspect ratio, avoiding the detached/offset necks in the earlier SVG drawings. Active glow remains CSS.

## V10.6.2 — Home cleanup

- Removed Settings/Statistics buttons, home dialog, related icon symbols and styles.
- Removed local progress counters, persistence, quiz/navigation tracking hooks and their obsolete tests. Quiz scoring remains unchanged.
- Home lights run automatically while the home is active; system reduced motion still disables them. Previous local animation preferences no longer affect the home.
- `home.js` now only handles the instrument dock.

## V10.6.1 — Refined concert artwork and responsive home

- Replaced CSS guitar/crowd approximations with one compressed WebP illustration and a transparent brush-lettered wordmark. Shared SVG symbol sprite adds filled gradient menu icons and distinct instrument silhouettes.
- Two locally hosted, Latin-subset Barlow Condensed WOFF2 fonts prevent the home typography from depending on third-party requests.
- No home streak/score tiles or footer slogan. Icon-to-copy spacing is 18px on phones, 24px on portrait tablets, and at least 10px in compact landscape.
- Portrait phone/tablet/monitor layouts remain centered. Landscape iPad/desktop layouts place the brand on the left and menu on the right. Short landscape phones use a two-column card grid. Small viewports scroll vertically when needed.
- Only two ambient lights animate transform/opacity, paused off-home; reduced motion and the home toggle disable animation. No animation framework, videos or canvas.
- Verified in headless Chromium at 393×873, 844×390, 768×1024, 1024×768, 1440×900, 900×1440 and 320×640. All four instrument navigation paths, settings and progress dialog passed without runtime errors.

## V10.6.0 — Neon backstage home

- Concert-style home drawn with CSS/SVG: moving lights, marker lettering, neon cards and instrument dock.
- The yellow Play card opens daily tablature learn. The Quiz card opens the separate 60-second challenge.
- Home counters and footer slogan are omitted; card icons have a dedicated 80px column plus text spacing.
- Settings toggle home animation; system reduced motion is always honored. Progress dialog shows real device-local statistics.
- Day streak counts opening Learn/Map/Circle or completing a quiz, using local calendar dates. Total/best score and run count update only once per completed quiz. No invented sample statistics or historical migration.
- Instrument choices survive reloads within the session; the deployed `site.config.json` remains the default for a new session. Product/instrument profiles, branding and metadata are reapplied on reload.
- Phone, landscape and desktop layouts scroll when needed. No edits to generated `app/www/`.

# Fretboard Hero — configuration de déploiement

Le même package peut être déployé sur les différents sites. Pour changer d'instrument, modifier **uniquement** `site.config.json`.

## Valeurs disponibles

| `instrument` | Instrument | Produit chargé |
|---|---|---|
| `guitar` | Guitare 6 cordes | Guitar Fretboard Hero |
| `bass-4` | Basse 4 cordes | Bass Fretboard Hero |
| `ukulele` | Ukulélé standard G C E A | Ukulele Fretboard Hero |

## Exemple — guitare

```json
{
  "instrument": "guitar"
}
```

## Exemple — basse

```json
{
  "instrument": "bass-4"
}
```

## Exemple — ukulélé

```json
{
  "instrument": "ukulele"
}
```

## Principe

`site.config.json` → profil `/instruments` → profil `/products` → moteur partagé `/core`.

Les différences propres à un instrument doivent rester dans `/instruments` ou `/products`. Le code de `/core` ne doit pas contenir de branche spéciale du type `if (instrument === "bass-4")`.

Le fichier de configuration est chargé avec `cache: "no-store"` afin qu'un changement de configuration ne reste pas bloqué par le cache du navigateur.

Si la valeur `instrument` est inconnue, le bootstrap affiche une erreur de configuration explicite au lieu de lancer silencieusement un autre instrument.

## État des profils

`guitar` est le profil de référence à tester pour la non-régression V10.3.

`bass-4` et `ukulele` sont déjà sélectionnables par le bootstrap afin de valider l'architecture, mais leurs contenus pédagogiques spécifiques ne sont pas encore déclarés production-complets. Le changement de configuration ne doit jamais être interprété comme une validation musicale de ces deux produits.


## Architecture V10.3

The application shell is shared. Instrument selection remains controlled only by `site.config.json`.

Reusable learn modes live in `/modes`. Instrument profiles only declare which plugins they expose and their instrument-specific context. Fretboard Map is rendered by `/core/fretboard-map.js`. Quiz timing/scoring limits and ranks belong to the product profile.

Architecture rule: adding or switching an instrument must not require an `if (instrument === ...)` branch in `/core`.


## V10.4 — Product identity

The selected instrument now also selects the complete product identity: Home branding, Home copy, SEO metadata, canonical URL, Open Graph/Twitter metadata, structured data, share identity, PWA name/manifest and configurable asset paths.

Product names are intentionally:
- Guitar Fretboard Hero
- Bass Fretboard Hero
- Ukulele Fretboard Hero

The deployment rule remains: same package everywhere; edit only `site.config.json`.


## V10.4.2 — Completed instrument profiles

- `bass-4`: pentatonic P1–P5, triads, arpeggios, Bass-specific quiz ranks.
- `ukulele`: pentatonic P1–P5 for re-entrant G C E A, triads, chord families, arpeggios, Ukulele-specific quiz ranks.

The product names remain Guitar Fretboard Hero, Bass Fretboard Hero and Ukulele Fretboard Hero. String/course count stays an instrument-profile detail.

## Release notes

### V10.52.0 — Shared guide footer and download dialog

- All public guide pages use the homepage footer markup, stylesheet, language
  picker and download entry. Language selection links to the matching French or
  English article; both remain available without JavaScript.
- Guide Get the app buttons open the existing download dialog in place, with the
  same homepage skill list and store configuration. Article HTML, canonical URLs
  and exercise links stay intact; the full app is not bootstrapped on a guide.
- Modal close buttons use a fine white cross at the top right, without a visible
  background or border. The invisible 44 px target remains keyboard accessible.
- Privacy's document language menu has a distinct class so it cannot override
  the shared footer popover styles.

### V10.51.0 — Root octave paths

- Guitar Daily Routine connects roots in two movable octave shapes, for all twelve
  notes in either quality. A uses E5–D7–B10 and A12–G14–e17, each out and back.
- Each path has a guided pass followed by a memory pass. Keep the starting fret
  visible; reveal played notes with microphone progression or use Show frets for
  manual practice. Preserve each pass through resize, audio toggles and navigation.
- Skip one string, move two frets, then three across the G–B tuning offset. Start
  on a fretted root, and omit an entire path if it exceeds the instrument range.
- Bass and ukulele keep their existing root exercise. Copy is translated into
  all eleven interface languages; native bundles use the same web sources.

## V10.49.21 — Pentatonic round trips and hands-free tablature following

- Choose one of the two reference diagonals randomly per routine. In A minor,
  keep the exact frets 3–12 or 8–17, with slides on the outward and return passages.
- Center the active tablature staff in the routine's scroll container when it
  leaves the visible area. Follow the target note on short landscape screens,
  respect reduced motion and leave already visible staves still.
- Mark roots with `1 ~` and a localized sustain cue. Require a slightly longer
  matching root note in either direction; no BPM or required vibrato gesture.
- Preserve the selected diagonal through settings, navigation and microphone
  toggles. Refresh script and locale URLs for existing installations.
- Cover exact fingerings, transposition, complete microphone-driven round trips,
  root holds, scroll geometry and all eleven languages with automated tests.

### V10.49.13 — Release cleanup

- Audit all 12 stylesheets and all 51 first-party runtime web scripts, including
  their dynamically generated classes and state-dependent rules.
- Consolidate shared CSS tokens and typography declarations; remove an overridden
  icon border width and the obsolete default control-panel grid columns.
- Reuse the existing music-theory and quiz calculations in the application.
  Remove unused engine helpers, old home-copy/wordmark fields and unused quiz targets.
- Keep the checked-in PWA manifests as the installation source; remove the unused
  in-memory manifest and diagnostic branding global.
- Refresh changed asset URLs. See `docs/RELEASE_CLEANUP.md` for scope and validation.

### V10.49.12 — Instrument-aware privacy branding

- Privacy uses the existing Guitar, Bass or Ukulele wordmark and the same product
  profile viewport as the home. No new image assets.
- The bootstrap and Privacy share instrument selection in
  `core/instrument-selection.js`: URL, saved preference, then build default.
- The home passes both language and active instrument to the external privacy
  page. Language changes and return links preserve the instrument; the favicon,
  accessible brand name and document title follow it too.
- Clean up the privacy script's repeated DOM lookups and centralize language
  content lookup. Instrument validation stays in the shared selector.

### V10.49.11 — Localized privacy policy

- Replace the plain-text privacy header with the existing neon wordmark and a
  compact, keyboard-accessible language selector matching the approved preview.
- Publish the complete policy in all eleven app languages, with a readable static
  fallback and one selected language at a time when JavaScript is available.
- Clarify Lifetime Access, verification/restoration, local purchase proof and error
  diagnostics alongside microphone processing, retention, deletion and user rights.
- Carry the app language into its public privacy link and preserve legacy anchors.

### V10.49.10 — Visible billing errors

- Group explicit catalog, purchase, verification and restoration failures in a red
  panel with an alert icon, an operation-specific title and guidance in all eleven
  languages. SDK details are nested inside and collapsed for every new error.
- Keep pending/cancelled payments and successful checks as normal status messages.
  Retrying clears stale feedback; background checks preserve the visible error and
  an expanded disclosure until ownership is verified or another explicit action runs.

### V10.49.9 — Diagnose Google Play connection failures

- Keep the SDK error code and message in an optional Error details section,
  translated in all eleven interface languages. Support text is rendered as text.
- Retry transient Android setup/catalog errors at most twice before opening payment;
  do not replay billing refusals, payment callbacks or the payment sheet itself.
- Fetch a missing catalog and continue buying on the same click, with duplicate taps
  blocked and existing paid access preserved. Silent catalog checks retain visible errors.
- Native diagnostic codes require a new Store AAB/APK; see the Google Play billing guide.

### V10.49.8 — Recover store purchases without closing the app
- Check verified native ownership independently of an outstanding purchase callback
  when returning from the store or receiving transaction updates.
- Retry transient verification failures and pending purchases with bounded backoff;
  retain payment feedback, never unlock from an unverified payment, and coalesce events.
- Refresh the WebView once when verified access changes. Native apps need a new
  Store build; publishing the website/Worker does not update bundled JavaScript.

### V10.45.0 — Play along with the rhythm example
- Listen now keeps microphone grading and successful-repeat progression active, using the same clock as the audio and highlighted arrows.
- Pause silences the example; restarting Listen joins the current phase without losing played hits or successful repeats. Audio that is unavailable or waiting for a gesture no longer blocks playing.
- Rhythm requests browser echo cancellation; other exercises retain raw input. Updated the eleven languages with a play-along/headphone hint and removed the obsolete pause-before-playing guidance and separate preview clock.
- Regression coverage includes PCM play-along, automatic advancement, silence, tempo and sound changes, and microphone constraint/lifecycle races. Physical speaker echo and device latency still depend on the browser and hardware.

### V10.44.1 — Rhythm playback controls
- Ordered the rhythm toolbar as playback button → BPM label → tempo selector.
- Replaced font-dependent play/pause characters with matching SVG icons, centered beside the existing translated label. Pause uses two clean, slightly rounded bars.
- Consolidated playback and mobile toolbar styles with their component rules; audio behavior and the default tempo remain unchanged.

### V10.44.0 — Footer language menu
- Moved language selection beside Privacy policy with a small globe, native language name and chevron, matching the footer link styling and retaining 44px touch targets.
- The dark translucent popover opens upward, with eleven languages, Automatic mode, a selected checkmark, scrolling, keyboard navigation and outside-click dismissal.
- Removed the old header selector layout, flag rendering, unused flag assets and redundant menu style overrides. Detection, saved preferences and URL precedence are preserved.

### V10.4.5
- Responsive CSS cleanup with no intentional visual or gameplay changes.
- Consolidated the mobile right-side hamburger/header layout into the canonical responsive control contract.
- Consolidated the right-anchored drawer behavior instead of keeping a late override patch.
- Removed redundant responsive override code and trailing CSS noise before adding new screens.


### V10.4.4
- Removed fullscreen button and fullscreen functionality.
- Mobile controls menu now uses the former fullscreen position on the right side of the header.
- The controls drawer is right-anchored and opens inward from right to left.
- Per-instrument SEO is configured for Guitar, Bass and Ukulele.
- Bass and Ukulele instrument profiles are supported from the same package through `site.config.json`.

### V10.4.7
- Fixed the V10.4.6 regression that forced Learn and Fretboard Map controls into the hamburger drawer on tablet/desktop.
- Restored the V9.3/V10.4.5 adaptive control contract: full buttons when space allows, progressive per-group selects when width tightens, hamburger drawer only on compact/mobile viewports.
- Kept the universal compact header without overriding responsive drawer/toolbar behavior.
- Fixed Back alignment by making Back, title and contextual hamburger real cells of the same header grid; removed absolute positioning from those header items.
- Learn keeps the simplified key title and active-mode context line.



### V10.4.8
- Moved each screen context into `section-heading` as a semantic `<small>` immediately after the title `<strong>`.
- Reordered the mobile header DOM to Back | section heading | Menu so the title is structurally centered between both controls.
- Replaced the custom inline Back SVG with the existing lightweight icon treatment and forced the Back glyph to white.
- Preserved the V9.3/V10.4.5 adaptive controls behavior: buttons → progressive selects → right-side hamburger only when required.


### V10.4.9
- Added horizontal breathing room to the inline responsive controls on tablet/desktop (20px side padding).
- No changes to responsive buttons → selects → right-side hamburger behavior.
- No changes to fretboard, theory, instruments, modes, products, or quiz mechanics.

### V10.5.0 — Circle of Fifths
- Added Circle of Fifths as the fourth learning area on Home: Learn → Fretboard Map → Circle of Fifths → Quiz.
- Added a reusable pure theory core for the 12 major keys, relative minors, key signatures, major scales, diatonic chords and common progressions.
- Added a responsive interactive SVG Circle of Fifths renderer.
- Added selected-key information and a shared Fretboard Core scale view for the active instrument.
- Responsive layout: vertical learning flow on mobile/tablet portrait; Circle + harmony information side-by-side on wider tablet/desktop; fretboard below.
- Existing V10.4.9 Learn, Map, Quiz, header and adaptive controls behavior remain unchanged.


## V10.5.1 — Circle responsive integration
- Circle now uses the exact shared V10.4.9 header contract.
- On compact widths, the Circle + selected-key theory panel moves into the right-hand hamburger drawer.
- The main compact view prioritizes the fretboard.
- Desktop keeps Circle + theory visible inline.
- No musical-engine changes.


## V10.5.2 — Circle learning tooltips
- Added tap/click help bubbles for Key Signature, Major Scale, Diatonic Chords and Common Progressions.
- Help works with mouse, touch and keyboard; only one explanation stays open and Escape/click outside closes it.
- Common Progressions includes a live example translated from Roman numerals to the actual chords of the selected key.
- No changes to Circle theory, fretboard engines, instrument profiles, Learn, Map or Quiz.

## V10.5.4 — Shared degree/chord component

- Diatonic Chords and Common Progressions now reuse the same degree/chord visual component.
- Common Progressions displays both the Roman-numeral degree and its actual chord for the selected key, while preserving the pink progression arrows.
- No changes to Circle theory, fretboard rendering, responsive drawer behavior, Learn, Map, or Quiz.

## V10.5.4 — Circle structural integration
- Circle now uses the exact shared application topbar contract; no Circle-specific header positioning.
- The theory panel (Selected Key, Key Signature, Major Scale, Diatonic Chords, Common Progressions) always remains normal page content.
- On compact layouts only the Circle key selector moves into the right-hand drawer; the educational content never becomes a menu.
- Desktop keeps Circle selector + theory side by side, with the fretboard below.
- Existing tooltips and shared degree/chord component are preserved.

## V10.5.5 — Quiz multiplier scoring
- Quiz scoring now strongly rewards accurate streaks: ×1 = 100, ×2 = 250, ×3 = 500, ×4 = 800, ×5 = 1,200 points per correct answer.
- A wrong answer still resets the multiplier to ×1; no extra penalty was added.
- Rank thresholds are unchanged so the new scoring curve can be evaluated before recalibrating the ladder.
- The score curve is product-configurable and shared by Guitar, Bass and Ukulele.

## V10.5.6 — Progressive Quiz Neck

- Quiz fret range now expands from successful answers rather than the multiplier.
- 0–4 correct: frets 0–5; 5–9: 0–7; 10–14: 0–9; 15–19: 0–12; 20+: 0–15.
- The question remains random inside the currently unlocked neck area.
- Keeps the V10.5.5 multiplier scoring unchanged.
## V10.5.7 — Fret number readability
- Shared Fretboard Core: fret numbers are larger, heavier and high-contrast across Learn, Fretboard Map, Circle of Fifths and Quiz.
- Added compact dark badges behind fret labels for immediate recognition on mobile and desktop.
- Fret 12 is emphasized as the main octave landmark.
- Fretboard geometry, note positions, strings and inlays are unchanged.



## V10.5.8 — Quiz relevant quality
- Quiz no longer generates or displays MAJOR/MINOR for ROOT and 5TH questions because those targets are quality-independent.
- MAJOR/MINOR is generated and displayed only for 3RD questions, where it changes the answer (3 vs flat 3).

## V10.8.0 — Three-product identity

- Guitar, Bass and Ukulele each use a transparent brush-neon logo with a prominent instrument name.
- A shared concert crowd background contains no instrument.
- Home dock order is determined by the original site configuration: configured instrument first, then remaining instruments in Guitar/Bass/Ukulele order. Session switching updates the active product without changing dock order.
- Invalid saved instrument selections are cleared before bootstrap.
- Supported profiles, manifests, metadata, icon artwork and fretboard rendering now cover the three products only.

## Daily Routine

The joypad card opens five self-assessed exercises in one key: root notes, a complete major/natural minor scale, three triad inversions, chord shapes (CAGED for guitar, ukulele shapes, arpeggios for bass), and a pentatonic position. Each visit chooses a random root and new positions; the shared NOTE and KEY controls allow changes and restart the five steps. The demo provides all five exercises in A minor. Other keys use the existing unlock dialog. Next advances; Done shows completion. There is no microphone, automatic scoring, timer, or stored completion history.

`core/routine-exercises.js` composes the existing music engines, `routine-renderer.js` draws accessible tablature with root highlights and simultaneous chord columns, and `routine-session.js` manages the five steps. Tablature fits one staff when readable and wraps longer exercises without shrinking fret numbers. High-G ukulele scales use MIDI pitch order; pentatonic boxes follow string order. The shared drawer, selects, buttons and premium modal remain the source of UI components; `routine.css` owns composition only.

Run checks from the repository root:

```sh
node --test web/tests/*.test.cjs app/tests/*.test.js
```

### Instrument identity assets (10.22)

Production: https://fretboard-hero.com/. Guitar uses `/`, bass uses
`/?instrument=bass-4`, and ukulele uses `/?instrument=ukulele`. Explicit links
select the instrument before session preferences. Score sharing removes testing
keys and preserves only the selected instrument.

`assets/instruments/{guitar,bass,ukulele}/` owns each approved pick icon source,
16–1024 px icon exports, iPhone/iPad touch icons (120/152/167/180), maskable PWA
icons, lightweight loader WebP and 1024×500 OG PNG. Rebuild icons with
`python tools/generate-instrument-icons.py` from the repository root (Pillow).
An optional instrument argument also refreshes checked-in native icons.
Native builds use the application icon selected by `app/instruments.json`;
`sync-web.ps1` aligns the iOS AppIcon and Capacitor resource with it.

The 10.35.0 OG refresh uses the built-in image generator to preserve the approved
concert setting, neon palette and instrument branding across all three images.
Six cards now lead with Tuner and Daily Routine with live mic feedback, followed
by Learn, Fretboard Map, Circle of Fifths and Quiz. Bass retains its four-string
neck and uses Arpeggios in Learn; ukulele retains its wooden four-string neck.
Prompts and export details live in `assets/instruments/og-prompts.md` and the
adjacent README. OG/Twitter descriptions, image alt text and versioned image URLs
are updated in the static HTML, worker and client product profiles.

The loader crossfades the three picks with a small rotation and neon halo. It is
hidden by the existing bootstrap completion signal, without a minimum delay.
Reduced-motion mode shows three static icons. Application layout rules are unchanged.

`worker.js` rewrites the initial HTML metadata for social crawlers, which do not
execute client JavaScript. Wrangler's `ASSETS` binding serves all other files.
Deploy through the existing main-branch Cloudflare workflow; a plain static
server only provides the default guitar metadata until JavaScript runs.

### Learn menu (10.23)

The former Practice section is now Learn throughout its screen IDs, navigation,
JavaScript helpers and CSS selectors. `assets/home/learn.svg` is the shared pink
neon graduation cap. The locked-mode dialog copies this icon and the Learn label
from the home menu through `FretboardAccess.mount`; no duplicate menu list exists.
The current OG bitmap artwork also uses Learn. The generic practice wording
inside Play and Circle of Fifths is independent of the renamed section.

Shared OG/store graphics use `og.png` in each instrument asset directory. Rebuild all three and their exact store copies with `node stores/tools/export-og.cjs`. Native preparation copies these assets with the rest of `web/`. See [the export guide](../tools/assets/og/README.md).


## V10.48.0 — Three apps, a full-access purchase per app

- Free Store builds use the native Google Play / StoreKit payment sheet and localized price. One non-consumable purchase unlocks all three instruments and premium features within the purchased app, without cross-app or cross-store sharing.
- The website links to the matching Guitar, Bass or Ukulele app. The chosen universe is remembered across launches.
- Explicit Store and Preview build profiles use separate identities and final-archive validation. The build-all entry point produces all three applications sequentially.
- Android keeps an authenticated, encrypted, device-bound purchase proof with no seven-day expiry; proofs are bound to the app ID and product. Empty store queries and temporary outages do not revoke paid access; confirmed refunds do.
- Added native cache tests and purchase, restore, startup, instrument preference and packaging regressions. Configuration and real-store test instructions are in docs/GOOGLE_PLAY_BILLING.md and docs/APPLE_BILLING.md.
