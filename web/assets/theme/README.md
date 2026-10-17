# Shared UI font

`barlow-condensed-500.woff2` and `barlow-condensed-800.woff2` are the full
Barlow Condensed Medium and ExtraBold fonts, converted losslessly from the
Google Fonts TTF distribution to WOFF2 with FontTools.

Source: https://github.com/google/fonts/tree/main/ofl/barlowcondensed

License: [SIL Open Font License 1.1](OFL-BarlowCondensed.txt).

Keep the full character set when updating these files. The previous ASCII-only
subset forced accents (é, à, etc.) and currency symbols (€) into a different
fallback font. Both weights are bundled locally for the website and native app;
no remote font service is used. CJK and Hindi keep their existing locale fonts.
