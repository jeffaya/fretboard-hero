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

- `web/assets/instruments/<instrument>/og.png`: canonical opaque RGB PNG.
- `web/assets/instruments/<instrument>/og.jpg`: JPEG for existing links.
- `stores/google-play/<instrument>/en-US/icon/feature-graphic-1024x500.png`: exact copy of the canonical PNG.

For a new graphic, replace the corresponding master, run the exporter, inspect the
result and update the image URL version in initial HTML, product profiles and the
worker. Re-run each complete listing's validation after changing store files.
The bass and ukulele folders currently contain only their feature graphic.

Native Android/iOS preparation runs `scripts/sync-web.ps1`, which recreates
`app/www/` from `web/`, including all three instruments' images. Do not edit a
second native master. Run the usual native build to include updated web assets
in an APK/AAB or iOS app; changing these files does not update installed binaries.

OG metadata declares the actual PNG type and 1024 × 500 dimensions. Social services
may crop previews or retain an already-shared URL until they crawl it again.
Reference: https://ogp.me/#structured
