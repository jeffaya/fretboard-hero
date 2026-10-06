# Production artwork

All raster artwork was generated/edited with the built-in imagegen tool from the supplied visual reference and exported as optimized WebP. Controls remain native DOM and icons.svg is a reusable SVG symbol sprite.

- guitar-wordmark-v2.webp, bass-wordmark-v2.webp, ukulele-wordmark-v2.webp: 900×550 transparent logos. White italic dry-brush lettering, violet/hot-pink glow, three lines with the instrument prominently above FRETBOARD / HERO. Each product declares its logo in assets.heroLogo. Only the active logo is loaded.
- ../theme/concert-crowd.webp: 1280×853 shared concert crowd, haze and magenta/cyan projectors, no instrument or UI. Exercises dim this same artwork.
- instruments.webp: 768×256 transparent sprite containing exactly Guitar, Bass and Ukulele. Independent SVG viewports share a 190×253.3333 aspect ratio, centered on measured alpha silhouette bounds. No additional instrument artwork remains in the sprite.
- ../theme/barlow-condensed-500.woff2 and barlow-condensed-800.woff2: self-hosted Latin subsets; license in ../theme/OFL-Barlow.txt.

## Final prompts

Logos (one imagegen call per instrument): exact three-line text GUITAR, BASS or UKULELE / FRETBOARD / HERO. Match reference sharp italic dry-brush rock lettering angled upward, white cores, violet and hot-pink neon glow, pointed underline. Prominent instrument first line; transparent background, no instrument, frame or extra text.

Background edit: remove the entire guitar; restore coherent concert atmosphere and audience. Preserve midnight navy, magenta/cyan beams, smoky haze and silhouetted crowd. No musical instrument, text, logo or UI.

Sprite edit: preserve the three diagonal silver-blue Guitar/Bass/Ukulele illustrations, remove unused artwork, transparent background and clean separated silhouettes. The illustrations are generated reconstructions, not lossless crops of original source artwork.

V10.8.2: repaired clipped HERO brush strokes and underline using imagegen edits on square transparent canvases. Optimized exports retain the complete visible glow and reserve at least 24px transparent margin on all edges. Versioned filenames prevent reusing cached earlier artwork.
