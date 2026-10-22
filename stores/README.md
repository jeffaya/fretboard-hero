# Store assets

Dedicated distribution-listing assets. These files are separate from the shipped web app and native build resources.

## Structure

| Path | Purpose |
| --- | --- |
| `google-play/guitar/` | Guitar Fretboard Hero listing copy and alt text in all 11 app languages; visuals in `en-US/` and `fr-FR/` |
| `google-play/bass/` | Bass Fretboard Hero listing copy and draft alt text in all 11 app languages; existing English feature graphic; other visuals pending |
| `google-play/ukulele/` | Ukulele Fretboard Hero listing copy and draft alt text in all 11 app languages; existing English feature graphic; other visuals pending |
| `tools/` | Capture, render and validation scripts |

Future Apple listings belong in `apple-app-store/<instrument>/<locale>/`. That directory is intentionally not populated in this first Google Play draft.

Every locale for guitar, bass and ukulele has `README.md` with copyable listing fields and `alt-text.json`. The guitar `en-US/` and `fr-FR/` listings additionally contain `icon/`, `phone/`, `tablet-7/`, `tablet-10/`, `desktop/`, and `android-xr/`. The other nine guitar languages currently contain text only; their localized images are pending. Bass and ukulele each retain their existing English feature graphic; their remaining visuals are pending, and their draft alt text must be checked against the final images. Upload files from the device folders in numeric order. `source/` contains editable artwork and capture evidence; it is not an upload folder.

Start with [the Android format reference](google-play/README.md), then the language index for [guitar](google-play/guitar/README.md), [bass](google-play/bass/README.md) or [ukulele](google-play/ukulele/README.md). The [English](google-play/guitar/en-US/README.md) and [French](google-play/guitar/fr-FR/README.md) guitar upload guides cover their visuals; Android XR remains a 2D draft because it has not been captured in an XR runtime.

## Rebuild

From the repository root:

```sh
npm --prefix stores/tools ci
npx --prefix stores/tools playwright install chromium
node stores/tools/capture.cjs
node stores/tools/render.cjs
node stores/tools/export-feature.cjs stores/google-play/guitar/en-US
node stores/tools/validate.cjs
```

For French exports, set `STORE_LOCALE=fr-FR` when running `capture.cjs` and `render.cjs`, and pass `stores/google-play/guitar/fr-FR` to `export-feature.cjs` and `validate.cjs`. The manual **Google Play visual export** workflow produces the same files as a downloadable artifact.

The tools require Node.js and the dependencies in `tools/package.json`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing Chromium executable; otherwise Playwright uses its installed browser. `STORE_DEVICE=phone` (or `tablet-7`, `tablet-10`, `desktop`, `android-xr-console`) limits a capture run.

The capture server only binds localhost. It serves the current `web/` source and supplies an unlocked configuration **only to the capture browser**. It does not edit `web/site.config.json`, modify billing or make purchases. Captures use the real app renderer and interactions. Synthetic audio is routed through the app's actual microphone detector for the feedback and tuner states. This is not an audio-accuracy or hardware-compatibility certification.

The phone artwork keeps the approved continuous ribbon and eight localized messages. The screen inserts are refreshed from the local app. Tablet and desktop uploads show the interface directly, in their own emulated viewports, without marketing text or a phone frame.

English feature graphics are exact copies of the shared `web/assets/instruments/<instrument>/og.png` (1024 × 500). Their masters and provenance are documented in `tools/assets/og/README.md`. The French guitar banner uses its localized `source/feature-master-fr.png`; its prompt and provenance are recorded alongside it. Website OG images remain unchanged. All app screenshots show the actual UI.

The common Android specifications live in `google-play/requirements.json`. Each locale’s `validation.json` is a generated inventory of its current files, not an input to the validator.
