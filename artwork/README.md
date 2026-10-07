# Approved neon branding

`icons-approved.png` is the approved three-instrument artwork, without labels or floor reflections. The three OG sources retain the approved home-inspired composition, with the corresponding logo and fretboard.

Rebuild all deliverables from these sources:

```sh
python -m pip install Pillow
python scripts/generate-branding.py
```

The script exports square opaque 1024px masters, all favicon sizes, Apple touch icons, ICO containers, standard/maskable PWA icons, and 1200×630 JPEG social cards. Maskable icons keep the pick inside the safe central circle. The source sheet must remain 2170×725 unless its crop definitions are updated.

It also generates the small instrument loader GIF from the existing home instrument sprite, with a static WebP alternative for reduced motion. Native resource/icon and checked-in iOS/Android launchers follow the current `app/capacitor.config.json` instrument. The variant build script regenerates both platforms from the selected instrument's 1024px master.
