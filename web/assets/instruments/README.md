Approved icon artwork: user-provided three-pick sheet, exported without text or
floor reflections. `icon-source.png` preserves each approved tile. All web and
native sizes derive from it; maskable images use a 64% square safe area.

The guitar, bass and ukulele OG images all show Tuner, Daily Routine with live mic
feedback, Learn, Fretboard Map, Circle of Fifths and Quiz. Bass uses Arpeggios.
The approved artwork was already updated; this export aligns site, app and store.

The canonical share asset is `og.png`: **1024 × 500, opaque RGB PNG**. The store
feature graphic is an exact file copy. `og.jpg` remains at the same dimensions
for legacy links. Current OG/Twitter URLs use `og.png?v=20261014.2` in initial HTML,
the worker and client profiles. Native builds copy these files from `web/` through
`scripts/sync-web.ps1`; do not maintain separate native artwork.

Rebuild with `npm --prefix stores/tools ci` and `node stores/tools/export-og.cjs`.
Masters and export details: [tools/assets/og/README.md](../../../tools/assets/og/README.md).
The original image-generation prompts remain in `og-prompts.md` as provenance;
the common-size export does not generate or replace any lettering.
