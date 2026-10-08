# Interface languages

The website and the Android/iOS bundles share `web/core/i18n.js` and the static
catalogs in `web/locales/`. There is no translation API, runtime font-provider
request or recurring localization service dependency.

Supported locales: English `en`, Spanish `es`, French `fr`, German `de`, Japanese
`ja`, Korean `ko`, Simplified Chinese `zh-CN`, Brazilian Portuguese `pt-BR`, Hindi
`hi`, and Indonesian `id`. Regional variants match the base language (`fr-CA`,
`es-MX`, etc.). Portuguese maps to Brazilian Portuguese. All Chinese preferences
currently map to Simplified Chinese; Traditional Chinese is not included.

## Selection

Priority is a supported `?lang=` URL parameter, then the saved manual selection,
then the first supported entry in `navigator.languages`, then English. A failed
catalog load also falls back to English instead of blocking the app.

The home language selector shows flags **and native language names**, and offers
Automatic to remove the saved preference. Choices persist in localStorage across
visits and instrument changes. The language URL parameter keeps selection usable
when storage is blocked. A selection reloads the application from Home.
Automatic mode responds to browser language-change events.

Android declares the locale list for system per-app language settings. iOS lists
supported localizations in Info.plist because resources are managed by the web
bundle, rather than `.lproj` files. Native web sync copies all catalogs and fonts,
so native translations do not need a separate server. OS purchase sheets and
store prices remain controlled by Apple/Google and the customer's store account.

## Coverage and notation

Catalogs cover home menus, Learn controls and hints, Map, Circle of Fifths,
all five Routine steps/instructions, completion, quiz instructions/results/ranks,
share text, unlock dialogs, native billing feedback and accessibility labels.
Numbers in quiz scores use the selected locale. Product brand names and musical
notation remain unchanged: A, C#, chord symbols, Roman degrees, CAGED, strings
and fret numbers are not replaced with solfège or localized identifiers.

The existing renderers use English source strings as stable catalog keys. Exact
strings and bounded parameter templates are translated at text/accessible-label
boundaries. A MutationObserver processes only changed text nodes and the four
presentation attributes (aria-label, title, placeholder, alt). It never rewrites
HTML, musical state, element IDs, data attributes, input values or event handlers.
This also covers native error strings delivered asynchronously. Text that leaves
the DOM (sharing) is explicitly translated. No translated HTML is executed.

Document language, title, description and structured metadata follow the selected
language in the browser. Existing static social image artwork and crawler-first
metadata remain English; this change does not create translated marketing images,
store listings or language-specific SEO routes. Logos retain their brand names.

## Maintenance

All ten JSON files must have identical English keys and preserve the same named
`{placeholders}`. Add complete messages, rather than concatenating translated word
fragments where word order differs. Musical and purchase state values stay in
English identifiers internally. Unknown text falls back to its English source.
After adding a native error message or renderer text, add it to every catalog.

Japanese, Korean, Chinese and Hindi use locally bundled Noto font subsets with
500/800 weights and SIL OFL licenses in `web/assets/fonts`. Regenerate subsets
with `python scripts/subset-locale-fonts.py` (requires fonttools and network at
development time) after extending those catalogs. System fonts cover flags and
unlisted glyphs. Existing Latin typography remains in use.

Validation:

```sh
node --test server/tests/*.test.mjs web/tests/*.test.cjs app/tests/*.test.js
```

Tests check language negotiation, manual/URL precedence, fallback, catalog parity,
placeholder preservation, notation, dynamic phrases and repeated-pass stability.
Browser checks exercised all ten languages through every screen and Routine
completion, plus persisted selection, automatic reset, quiz completion and a
mocked Japanese StoreKit purchase. Phone portrait/landscape, tablet and desktop
were checked; native device language settings still need release-device QA.
