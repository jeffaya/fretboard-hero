# Local interface fonts

Noto Sans JP, KR, SC and Devanagari, weights 500 and 800, are distributed under
the accompanying SIL Open Font License files. These are WOFF subsets containing
the non-ASCII characters used by the corresponding JSON translation catalog.
Latin text continues to use the existing Barlow Condensed theme font. Country
flags and unsupported/new glyphs use system fallback fonts.

Sources: Google Fonts (`https://fonts.googleapis.com/css2` with a `text` subset),
Noto project. Bundled locally: there are no font-provider requests at runtime.
Regenerate subsets after adding translations with scripts/subset-locale-fonts.py.
