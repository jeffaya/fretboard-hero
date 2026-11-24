# Public lessons and search discovery

The guides are lessons with initial HTML and inline SVG diagrams. They do not
require JavaScript to read. The interactive chord selector progressively enhances
the initial G chord families; it does not gate the lessons behind app access.

## Sources and shared components

- `scripts/lessons/translations.mjs`: full copy for all 14 app languages. Every
  language has seven topics: overview, notes, pentatonic, triads, chords, routine and reading tablature.
- `web/core/guide-routes.js`: one route registry for Home and the page generator,
  covering guitar, four-string bass and high-G ukulele. Existing English/French
  URLs are retained. Other languages use stable English topic slugs.
- `scripts/lessons/render.mjs`: lesson structure, instrument-specific instruction,
  diagrams and the initial chord explorer.
- `web/core/chord-library.js`: standard tuning, musical spelling and curated
  movable/open grips for 12 roots and 12 chord qualities. Guitar and ukulele each
  have at least two shapes per combination. The conventional open C7 omits its
  fifth. Bass uses chord-tone maps for arpeggios, not guitar chord grips.
- `web/core/lesson-diagrams.js`: the same SVG renderer at build time and in the
  interactive selector. String order, open/muted strings, frets and barres come
  from the voicing data. High-G ukulele is explicitly re-entrant.
- `scripts/pages/components.mjs` and `web/core/document-branding.js`: common
  public header and product-branding logic for guides and Privacy. The static
  guide already has the correct product wordmark and favicon before scripts run.
- `scripts/seo/content.mjs`: About pages in English, French, Arabic, Bengali and Russian.
- `scripts/pages/privacy-content.html`: legal text in 14 languages.

- `scripts/pages/document-shell.mjs` and `web/core/document-shell.js`: one shared
  footer, language picker and app dialog for guides and Privacy. Language is never
  in the header; no-JavaScript footer links still work.
- `scripts/lessons/curriculum.mjs`: expanded explanations, worked exercises,
  common errors, success checks and notation glossary, translated in all locales.
- `scripts/lessons/tablature.mjs`: original, rhythmically explicit SVG examples
  with a text equivalent, separate bars on mobile and instrument-specific tuning.
- `scripts/lessons/tab-orientation.mjs`: a three-step neck-to-tab illustration,
  translated in all 14 languages. The same geometry rotates 90° counterclockwise,
  preserving string order; the open string and frets 2/3 match the reading exercise.
- [Guide research](GUIDE-RESEARCH.md) records the three references for each
  instrument and topic, the search method and the limitations of the sources.

## Generation and verification

```sh
node scripts/build-seo.mjs
node scripts/build-seo.mjs --check
node --test web/tests/lesson-tablature.test.cjs web/tests/seo.test.cjs web/tests/chord-library.test.cjs web/tests/guide.test.cjs web/tests/privacy.test.cjs web/tests/home-purchases.test.cjs
```

The generator produces 294 lesson pages, five About pages, Privacy, the interactive route
translations and the sitemap. Each lesson has reciprocal `hreflang` links for all 14 languages,
a unique canonical, localized metadata, structured data and instrument-aware
exercise/Privacy links. There is no author byline or promotional sidebar. The
Try action remains in the hero; the only download entry is the common footer.

Each interactive screen has a canonical URL for each instrument and language.
For example, the Russian bass tuner uses `/tuner?instrument=bass-4&lang=ru`.
The same screen without `lang` is its `x-default` and supports automatic language
selection. The Worker, browser navigation and sitemap share the URL builder in
`web/core/route-seo.js`. Lesson and About entries use the same modification date
in the sitemap and their structured data.

The page route is authoritative for its language and instrument. Saved app
preferences cannot change the content/branding of a directly opened lesson.
The Music theory card on Home opens the section for the selected language and instrument.
The lesson header links back to Home, where readers can switch instruments.
Native apps open the same public guide in the external browser.

Chord selection is bookmarkable with validated `root=0..11`. All 12 chord
families are displayed together, with localized names, tones and positions.
Legacy `quality` parameters are removed without losing the selected root.
Changing the lesson language preserves the selected root. Each instrument’s chord URL also accepts a root directly.
These parameters do not create new canonical pages or bypass paid app features.

## Fonts and future translations

After changing copy, rebuild the HTML, then run:

```sh
python scripts/subset-locale-fonts.py
```

This downloads full public Noto font binaries from fixed URLs and subsets them
**locally** using the app catalogs, lesson text and Privacy articles. No project
text or character list is sent to a font service. Commit the WOFF output and bump
its cache versions. The runtime uses local fonts only.

Add a language to the app and the route registry together, and provide every
lesson/UI field before generation. Tests compare language coverage with the app
catalog and reject missing or reused English paragraphs. Musical symbols and
international note names are intentionally shared.

## Browser coverage

`tests/browser/seo.spec.cjs` covers Home entry, external native links, initial
HTML without JavaScript, header branding, exercise links, shared footer dialog,
chord selection, keyboard operation, query restoration and switching instruments via Home. Run the Chromium/Firefox/WebKit projects as described in TESTING.md.
A Node run cannot establish the mobile layout or native Safari behavior.
