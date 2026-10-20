# Shared OG and Google Play artwork

`guitar.jpg`, `bass.jpg` and `ukulele.jpg` preserve the approved 1200 × 630 masters
that already include Tuner and five other feature cards. They are export sources,
not files served by the website or copied into a native app.

Run from the repository root:

```sh
npm --prefix stores/tools ci
node stores/tools/export-og.cjs
node stores/tools/validate.cjs
```

The exporter preserves proportions and crops the decorative top/bottom margins
to 1024 × 500. All text and all six feature cards remain in view. It writes:

- `web/assets/instruments/<instrument>/og.png`: opaque RGB PNG for the Google Play export.
- `web/assets/instruments/<instrument>/og.jpg`: lightweight JPEG for social previews.
- `stores/google-play/<instrument>/en-US/icon/feature-graphic-1024x500.png`: exact copy of the canonical PNG.

For a new graphic, replace the corresponding master, run the exporter, inspect the
result and update the image URL version in initial HTML, product profiles and the
worker. Re-run each complete listing's validation after changing store files.
The bass and ukulele folders currently contain only their feature graphic.

Native Android/iOS preparation runs `scripts/sync-web.ps1`, which recreates
`app/www/` from `web/`, including all three instruments' images. Do not edit a
second native master. Run the usual native build to include updated web assets
in an APK/AAB or iOS app; changing these files does not update installed binaries.

Initial HTML, worker metadata and client product profiles all use the JPEG and
declare `image/jpeg` with its actual 1024 × 500 dimensions. The existing JPEGs
are 238–246 KB, compared with 776–796 KB for the PNGs. Keep JPEG exports below
our 300 KB sharing budget; `web/tests/open-graph.test.cjs` checks file size,
format and agreement between the metadata layers. PNG store exports are separate.
Social services may crop previews or retain an already-shared URL until they
crawl it again. After deployment, check a newly pasted link in WhatsApp; automated
metadata checks do not establish that the messaging app has refreshed its cache.
Reference: https://ogp.me/#structured
