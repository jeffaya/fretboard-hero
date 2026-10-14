# Store assets

Dedicated distribution-listing assets. These files are separate from the shipped web app and native build resources.

## Structure

| Path | Purpose |
| --- | --- |
| `google-play/guitar/en-US/` | First draft: Guitar Fretboard Hero, English (United States) |
| `google-play/bass/` | Reserved for the bass listing |
| `google-play/ukulele/` | Reserved for the ukulele listing |
| `tools/` | Capture, render and validation scripts |

Future Apple listings belong in `apple-app-store/<instrument>/<locale>/`. That directory is intentionally not populated in this first Google Play draft.

Each locale has `README.md`, plain-text listing fields, `icon/`, `phone/`, `tablet-7/`, `tablet-10/`, `desktop/`, and `android-xr/`. Upload files from the device folders in numeric order. `source/` contains editable artwork and capture evidence; it is not an upload folder.

Start with [the Android format reference](google-play/README.md), then [the English guitar upload guide](google-play/guitar/en-US/README.md). Its Android XR section is explicitly a draft because it has not been captured in an XR runtime.

## Rebuild

From the repository root:

```sh
npm --prefix stores/tools install
npx --prefix stores/tools playwright install chromium
node stores/tools/capture.cjs
node stores/tools/render.cjs
node stores/tools/export-feature.cjs
node stores/tools/validate.cjs
```

The tools require Node.js and the dependencies in `tools/package.json`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing Chromium executable; otherwise Playwright uses its installed browser. `STORE_DEVICE=phone` (or `tablet-7`, `tablet-10`, `desktop`, `android-xr-console`) limits a capture run.

The capture server only binds localhost. It serves the current `web/` source and supplies an unlocked configuration **only to the capture browser**. It does not edit `web/site.config.json`, modify billing or make purchases. Captures use the real app renderer and interactions. Synthetic audio is routed through the app's actual microphone detector for the feedback and tuner states. This is not an audio-accuracy or hardware-compatibility certification.

The phone artwork keeps the approved continuous ribbon and eight English messages. The screen inserts are refreshed from the local app. Tablet and desktop uploads show the interface directly, in their own emulated viewports, without marketing text or a phone frame.

The feature graphic is generated artwork, not a screenshot. Its source and prompt are retained under the locale's `source/` directory. All other screenshots show the app's actual UI.

The common Android specifications live in `google-play/requirements.json`. Each locale’s `validation.json` is a generated inventory of its current files, not an input to the validator.
