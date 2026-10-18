# CSS and JavaScript release cleanup — 2026-10-18

Baseline: PR #108 commit `44f23988f2f57c54d7d4f4dd9cd7cf9ef3bd81a8`.
This pass covers the whole application, including its existing Privacy changes.

## Scope and findings

Reviewed all 12 web stylesheets and all 51 first-party runtime web JavaScript
files, plus the native bridge, billing Worker/server and JavaScript tooling.
All 88 JavaScript source, test and tool files pass syntax checks.
The bundled QR library is retained as a vendor dependency.

CSS references were checked against static HTML and JavaScript-generated markup.
The existing responsive, hidden/open, focus, print and reduced-motion rules are
active; they are retained. Selector names missing from initial HTML alone are
not evidence of dead CSS.

| Area | Cleanup | Behaviour preserved |
| --- | --- | --- |
| Shared CSS | Combine the three unconditional token blocks and identical HTML/body typography declarations. | Every selector/property/value/media tuple remains the same. |
| Controls CSS | Express the final 2 px icon border directly; remove default grid columns that are inert under flex/block/contents and overridden by every grid variant. | Existing desktop, tablet and compact control layouts. |
| Application calculations | Call the shared degree, pentatonic and quiz-target functions instead of local duplicates. | 384 before/after musical results agree across all 12 roots, both qualities, all pitch classes and quiz targets. |
| Engine interfaces | Remove unused string ratio, profile accessor and multiplier helpers. | Callers continue using the existing profile, registry and scoring APIs. |
| Product profiles | Remove unused old home copy, wordmark text arrays, quiz targets and redundant PWA metadata. | Existing logos, product names, store identity, SEO, ranks and active quiz options. |
| PWA setup | Remove a generated manifest object and branding diagnostic global with no consumers. | The same instrument-specific checked-in manifest URLs are still selected. |
| Store tooling | Remove one unused Node filesystem import. | Existing export workflow. |

No image asset or translation has been changed. Asset query versions are updated
for the changed styles, bootstrap, shared modules, application and product profiles.

## Verification

- `node --test web/tests/*.test.cjs app/tests/capacitor-bridge.test.js server/tests/*.test.mjs`:
  **328 passed, 0 failed**.
- Existing coverage includes native ownership and restore flows, all distribution
  defaults and active instruments, microphone/audio processing, routines,
  translations, Privacy navigation and the native back-button bridge.
- Before/after comparison of the real product-shell code and all three product
  profiles produces identical DOM branding, metadata and manifest links.
- Shared CSS consolidation preserves the selector/property/value/media records;
  the two control declaration simplifications were reviewed separately.
- JavaScript syntax and `git diff --check` pass.
- GitHub's Windows `Tests` workflow runs the complete suite, including native
  packaging and PowerShell checks. Those packaging tests cannot run in this local
  environment, which lacks PowerShell and native image dependencies.

Browser rendering has not been revalidated locally: the available browser rejects
local-file navigation. After deployment, check Home, Learn/Map, Daily Routine,
Circle, Quiz/results, purchases, language selection, Privacy and Tuner on a phone
and desktop, including portrait/landscape, all three instruments and a non-Latin
locale. This is the remaining visual release check.
