Approved icon artwork: user-provided three-pick sheet, exported without text or
floor reflections. `icon-source.png` preserves each approved tile. All web and
native sizes derive from it; maskable images use a 64% square safe area.

OG artwork (10.35.0): refreshed guitar, bass and ukulele compositions keep the
approved concert background, neon palette, brush wordmarks and instrument necks.
Six cards now lead with Tuner, then Daily Routine with live mic feedback, Learn,
Fretboard Map, Circle of Fifths and Quiz. Bass uses Arpeggios in the Learn card.
The built-in image generator produced all three edits; the guitar update served
as the layout reference for the two four-string variants. Exact prompts are in
`og-prompts.md`.

Exports: 1200×630 JPEG, quality 90, 4:4:4, stripped metadata. The OG/Twitter image
URLs use `?v=10.35.0` in the initial HTML, worker and client product profiles so
new crawls request the updated artwork. Platforms may still cache page previews
until they crawl the shared URL again.
