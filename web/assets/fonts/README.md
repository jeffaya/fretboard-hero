# Local interface fonts

The app bundles Noto subsets for its supported scripts at weights 500 and 800. Each subset has a corresponding SIL Open Font License in this directory. Latin text uses the existing Barlow Condensed theme font.

After editing translations, regenerate public pages with `node scripts/build-seo.mjs`, then run `python scripts/subset-locale-fonts.py` with the desired language codes. Without arguments it rebuilds all subsets. Font sources are downloaded from the Google Fonts repository during generation. The application serves the resulting fonts locally.
