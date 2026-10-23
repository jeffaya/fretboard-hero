# Store assets

Dedicated distribution-listing assets. These files are separate from the shipped web app and native build resources.

## Structure

| Path | Purpose |
| --- | --- |
| `google-play/guitar/` | Guitar Fretboard Hero listing copy and alt text in all 11 app languages; visuals in `en-US/` and `fr-FR/` |
| `google-play/bass/` | Bass Fretboard Hero listing copy and alt text in all 11 app languages; English visuals in `en-US/` |
| `google-play/ukulele/` | Ukulele Fretboard Hero listing copy and alt text in all 11 app languages; English visuals in `en-US/` |
| `tools/` | Capture, render and validation scripts |

Future Apple listings belong in `apple-app-store/<instrument>/<locale>/`. That directory is intentionally not populated in this first Google Play draft.

Every locale for guitar, bass and ukulele has `README.md` with copyable listing fields and `alt-text.json`. The guitar `en-US/` and `fr-FR/`, bass `en-US/`, and ukulele `en-US/` listings additionally contain `icon/`, `phone/`, `tablet-7/`, `tablet-10/`, `desktop/`, and `android-xr/`. The other nine guitar languages currently contain text only; their localized images are pending. Bass and ukulele now have complete English series with instrument-specific four-string captures and checked English alt text. Their other ten locales still have text only; those draft alt texts must be checked against future localized images. Upload files from the device folders in numeric order. `source/` contains editable artwork and capture evidence; it is not an upload folder.

Start with [the Android format reference](google-play/README.md), then the language index for [guitar](google-play/guitar/README.md), [bass](google-play/bass/README.md) or [ukulele](google-play/ukulele/README.md). The [English](google-play/guitar/en-US/README.md) and [French](google-play/guitar/fr-FR/README.md) guitar upload guides cover their visuals; Android XR remains a 2D draft because it has not been captured in an XR runtime.

## Rebuild

From the repository root:

```sh
npm --prefix stores/tools ci
npx --prefix stores/tools playwright install chromium
node stores/tools/capture.cjs
node stores/tools/render.cjs
node stores/tools/export-feature.cjs stores/google-play/guitar/en-US
node stores/tools/export-icon.cjs
node stores/tools/validate.cjs
```

For French exports, set `STORE_LOCALE=fr-FR` when running `capture.cjs`, `render.cjs` and `export-icon.cjs`, and pass `stores/google-play/guitar/fr-FR` to `export-feature.cjs` and `validate.cjs`. Set `STORE_INSTRUMENT=bass` or `STORE_INSTRUMENT=ukulele` with `STORE_LOCALE=en-US` to rebuild the corresponding English series. The manual **Google Play visual export** workflow accepts an instrument and locale and produces the same files as a downloadable artifact. Bass and ukulele currently have English artwork only.

The tools require Node.js and the dependencies in `tools/package.json`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing Chromium executable; otherwise Playwright uses its installed browser. `STORE_DEVICE=phone` (or `tablet-7`, `tablet-10`, `desktop`, `android-xr-console`) limits a capture run.

The capture server only binds localhost. It serves the current `web/` source and supplies an unlocked configuration **only to the capture browser**. It does not edit `web/site.config.json`, modify billing or make purchases. Captures use the real app renderer and interactions, checking the active instrument ID, string count and language on every output. Quiz answers follow the active tuning; audio feedback uses the actual first root target, and the tuner uses the open A at 110 Hz (guitar), 55 Hz (bass) or 440 Hz (ukulele). Synthetic audio is routed through the app's actual microphone detector for the feedback and tuner states. This is not an audio-accuracy or hardware-compatibility certification.

The phone artwork keeps the approved continuous ribbon and eight localized messages. The screen inserts are refreshed from the local app. Bass and ukulele reuse the approved shared ribbon, feature icons and fonts; their wordmarks use the same instrument-specific crop of `web/assets/home/product-wordmarks.webp` as the application. Tablet and desktop uploads show the interface directly, in their own emulated viewports, without marketing text or a phone frame.

English feature graphics are exact copies of the shared `web/assets/instruments/<instrument>/og.png` (1024 × 500). Their masters and provenance are documented in `tools/assets/og/README.md`. The French guitar banner uses its localized `source/feature-master-fr.png`; its prompt and provenance are recorded alongside it. Website OG images remain unchanged. All app screenshots show the actual UI.

The common Android specifications live in `google-play/requirements.json`. Each locale’s `validation.json` is a generated inventory of its current files, not an input to the validator.

