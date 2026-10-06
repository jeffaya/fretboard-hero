# Home assets

Illustration and wordmark were generated using the built-in image generation tool from the user-supplied Fretboard Hero reference, then resized and encoded as WebP. They contain no clickable controls. The wordmark is a transparent raster asset rather than a font substitution or SVG trace. Original generation outputs remain in scratch; production WebP assets are checked into this project.

- `../theme/concert-stage.webp`: 1280×853, 55,000 bytes; black superstrat guitar on the right, dark concert stage, magenta/cyan lighting, silhouetted audience, no text/UI.
- `hero-wordmark.webp`: 900×450, 123,308 bytes; FRETBOARD / HERO in sharp white brush lettering with violet/pink glow and underline, transparent background.
- `icons.svg`: reusable vector symbols with filled shapes/gradients. No icon dependency.
- `../theme/barlow-condensed-500.woff2` and `../theme/barlow-condensed-800.woff2`: subset Latin Barlow Condensed. Google Fonts source; license in `../theme/OFL-Barlow.txt`.

## Final generation prompts

Background: Production background artwork only. Landscape 1536×1024. Detailed realistic black superstrat electric guitar at right edge, tilted slightly clockwise, entire neck and body visible, convincing frets, strings, tuning pegs and pickups. Left/center negative space for separate logo. Midnight navy concert stage, electric-blue/cyan spotlights, magenta-violet beams, purple haze, understated audience silhouettes at bottom. Match reference's neon rock aesthetic. Guitar in rightmost 30%; edges fade into near-black navy. No UI, text, logo, icons, borders, status bar or phone frame.

Wordmark: Standalone FRETBOARD / HERO lettering only on a truly transparent background. Match reference's sharp, strongly italic dry-brush uppercase rock lettering angled upward to the right around nine degrees. First line wide, HERO larger below. White cores, violet upper glow, hot pink HERO glow, thin pointed white/pink underline. No guitar, scene, UI, frame or extra words.

## Instrument sprite (V10.6.3)

`instruments.webp` is a transparent 1024×341 WebP sprite (64302 bytes). Four cells preserve the source sheet aspect ratio in a 42×56 CSS display box. Image generation was asked to extract and restore the four instrument illustrations from the bottom of the supplied screenshot, retain their silhouettes and continuous neck/body geometry, remove labels/background/UI, center the four cells, and normalize to silver-blue. The model reconstructed the artwork; this is not a lossless crop or the original source assets. The first three retain diagonal poses; 12-string remains upright.

V10.6.4: the built-in image editing tool cleaned disconnected bright pixels, specifically the dots above-left of the ukulele and 12-string illustrations. The production sprite keeps the same 1024×341 dimensions and CSS placement.

V10.6.6: the apparent white dots were neighboring headstock pixels bleeding into the shifted sprite viewport. Ukulele and 12-string now clip 12% from each horizontal edge; their own silhouettes lie inside this interval. This is a CSS crop fix, not an image-regeneration change.

V10.6.7: replaced background-position and clip-path adjustments with four independent SVG image viewports sharing the same WebP. Viewports are centered on measured alpha silhouette bounds and share a 220×293.3333 aspect ratio. This preserves complete silhouettes, including the ukulele, and centers the upright 12-string without exposing neighboring cells.
