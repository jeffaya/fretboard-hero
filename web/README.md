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
- The yellow Play card opens daily tablature practice. The Quiz card opens the separate 60-second challenge.
- Home counters and footer slogan are omitted; card icons have a dedicated 80px column plus text spacing.
- Settings toggle home animation; system reduced motion is always honored. Progress dialog shows real device-local statistics.
- Day streak counts opening Practice/Map/Circle or completing a quiz, using local calendar dates. Total/best score and run count update only once per completed quiz. No invented sample statistics or historical migration.
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

Reusable practice modes live in `/modes`. Instrument profiles only declare which plugins they expose and their instrument-specific context. Fretboard Map is rendered by `/core/fretboard-map.js`. Quiz timing/scoring limits and ranks belong to the product profile.

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
- Fixed the V10.4.6 regression that forced Practice and Fretboard Map controls into the hamburger drawer on tablet/desktop.
- Restored the V9.3/V10.4.5 adaptive control contract: full buttons when space allows, progressive per-group selects when width tightens, hamburger drawer only on compact/mobile viewports.
- Kept the universal compact header without overriding responsive drawer/toolbar behavior.
- Fixed Back alignment by making Back, title and contextual hamburger real cells of the same header grid; removed absolute positioning from those header items.
- Practice keeps the simplified key title and active-mode context line.



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
- Added Circle of Fifths as the fourth learning area on Home: Practice → Fretboard Map → Circle of Fifths → Quiz.
- Added a reusable pure theory core for the 12 major keys, relative minors, key signatures, major scales, diatonic chords and common progressions.
- Added a responsive interactive SVG Circle of Fifths renderer.
- Added selected-key information and a shared Fretboard Core scale view for the active instrument.
- Responsive layout: vertical learning flow on mobile/tablet portrait; Circle + harmony information side-by-side on wider tablet/desktop; fretboard below.
- Existing V10.4.9 Practice, Map, Quiz, header and adaptive controls behavior remain unchanged.


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
- No changes to Circle theory, fretboard engines, instrument profiles, Practice, Map or Quiz.

## V10.5.4 — Shared degree/chord component

- Diatonic Chords and Common Progressions now reuse the same degree/chord visual component.
- Common Progressions displays both the Roman-numeral degree and its actual chord for the selected key, while preserving the pink progression arrows.
- No changes to Circle theory, fretboard rendering, responsive drawer behavior, Practice, Map, or Quiz.

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
- Shared Fretboard Core: fret numbers are larger, heavier and high-contrast across Practice, Fretboard Map, Circle of Fifths and Quiz.
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

## Play — daily tablature practice

The yellow home card opens Play; Quiz remains available through its own card. Play provides self-assessed major/minor pentatonic licks for Guitar, Bass and Ukulele, with Blues/Rock/Melodic variations and four levels. The initial catalog contains four authored base phrases per instrument and quality. Style/level transformations and uniform fret transposition preserve the phrase's fingering; these are original exercises, not transcriptions of songs. There is no audio, microphone or automatic assessment.

`core/play-exercises.js` owns phrase data and transposition, `play-renderer.js` draws readable tablature and beat positions, and `play-session.js` handles choices and local completion storage. Play uses the shared responsive drawer and select controls; `play.css` owns its composition and `theme.css` supplies shared materials. Tablature adapts to the available width with fixed-size readable fret labels. Completed exercises are stored on this device under `fretboard-play-v1`; changing instruments keeps separate completion identities.

Run the music and self-assessment checks from the repository root:

```sh
node --test web/tests/play-exercises.test.cjs
```

### Instrument identity assets (10.22)

Production: https://fretboard-hero.com/. Guitar uses `/`, bass uses
`/?instrument=bass-4`, and ukulele uses `/?instrument=ukulele`. Explicit links
select the instrument before session preferences. Score sharing removes testing
keys and preserves only the selected instrument.

`assets/instruments/{guitar,bass,ukulele}/` owns each approved pick icon source,
16–1024 px icon exports, iPhone/iPad touch icons (120/152/167/180), maskable PWA
icons, lightweight loader WebP and 1200×630 OG JPEG. Rebuild icons with
`python tools/generate-instrument-icons.py` from the repository root (Pillow).
An optional instrument argument also refreshes checked-in native icons.
Android builds use each instrument's 1024 px source; `sync-web.ps1` copies the
selected source to the universal iOS AppIcon and Capacitor resource.

The approved guitar OG is reused; bass/ukulele variants were produced with the
built-in image generator, preserving the five menus, concert setting and neon
composition while changing the instrument name, tagline and neck to four strings.

The loader crossfades the three picks with a small rotation and neon halo. It is
hidden by the existing bootstrap completion signal, without a minimum delay.
Reduced-motion mode shows three static icons. Application layout rules are unchanged.

`worker.js` rewrites the initial HTML metadata for social crawlers, which do not
execute client JavaScript. Wrangler's `ASSETS` binding serves all other files.
Deploy through the existing main-branch Cloudflare workflow; a plain static
server only provides the default guitar metadata until JavaScript runs.
