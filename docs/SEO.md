# Public search pages

The application remains at `/`. Searchable guitar guides are static HTML under
`/en/guitar/` and `/fr/guitare/`; about pages live at `/en/about/` and `/fr/a-propos/`.
They work without JavaScript, with localized content, canonical URLs, reciprocal
`hreflang`, social metadata and JSON-LD. Public guides link to the same application
using `instrument`, `lang`, `screen` and optional `mode` query parameters. Entry
routes use existing screen/mode handlers and do not grant access to paid features.

## Updating content

Edit `scripts/seo/content.mjs`, then run:

```sh
node scripts/build-seo.mjs
node scripts/build-seo.mjs --check
node --test web/tests/seo.test.cjs web/tests/open-graph.test.cjs
```

Commit the generated HTML and `web/sitemap.xml`. Deployment still serves `web/`
directly; it does not require another framework or a new runtime service. CI rejects
stale generated output. Update `reviewed` after a substantive content review, not
on every deployment. The sitemap includes only public canonical pages; exercise
query combinations and API endpoints are excluded. No speculative prices, review
scores or unavailable App Store links are emitted. The data describes the free
demo and paid access separately; it makes no ranking or rich-result guarantee.

`web/guides.css` is independent of the application styles. The application footer
links to both guide languages; native builds open those public URLs externally,
like the existing privacy link. The generated pages use the existing guitar share
artwork and an accessible SVG/table example for A minor pentatonic.

## Cloudflare and search consoles after deployment

These account-level tasks cannot be configured just by merging source code:

1. Verify the domain in Google Search Console and Bing Webmaster Tools, if not
   already verified. Submit `https://fretboard-hero.com/sitemap.xml` in each.
2. Confirm Cloudflare serves the checked-in `robots.txt`. Its managed robots and
   AI Crawl Control settings may add rules independently of the Worker. Check
   bot-management/WAF events for real, verified search crawlers. Allow legitimate
   Googlebot, Bingbot, OAI-SearchBot, PerplexityBot and Claude-SearchBot traffic to
   public pages; do not disable protection site-wide or trust a user-agent alone.
3. Check actual URL Inspection results for one French and one English guide,
   including rendered text, canonical selection and successful indexing. Merely
   fetching a URL with a spoofed bot user-agent does not establish bot access.
4. Inspect deployed directory URLs and sitemap responses. Cloudflare's default
   `auto-trailing-slash` serves `folder/index.html` at `folder/`; missing pages
   should retain a genuine 404 instead of returning the app shell.
5. Record an initial baseline: indexed guide pages, non-brand queries, clicks,
   visits from identifiable AI referrers, exercise starts and store visits. The
   PR does not install analytics, submit forms or create external accounts.
6. Review citations in Bing's AI Performance report and repeat a small, dated set
   of unbranded questions in search-enabled AI services. Responses are variable;
   one favorable answer is not a stable ranking. External reviews and teacher
   feedback remain separate editorial work.

Search crawling and model training are separate controls. The checked-in wildcard
robots group permits public pages and disallows `/api/`; it does not introduce a
new training opt-out policy. OAI-SearchBot controls OpenAI search crawling, while
GPTBot controls training-related crawling. robots.txt is not authorization for
access to private resources, which remain protected by server-side checks.

## Validation

`web/tests/seo.test.cjs` checks generated output, initial language/content, unique
canonicals, reciprocal alternate links, local link targets and sitemap scope.
`tests/browser/seo.spec.cjs` reads all 12 pages with JavaScript disabled, checks
mobile overflow and language navigation, then follows real guide CTAs into the
correct free-tier application screens. It also rejects unrecognized entry routes.

```sh
cd tests/browser
npm ci
npx playwright install chromium
npm test -- seo.spec.cjs --project=desktop-chromium --project=android-chromium
```

Official references:
- https://developers.openai.com/api/docs/bots
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
