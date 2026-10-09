# Guided Daily Routine

Opening Daily Routine starts microphone capture by default, subject to the browser/device permission prompt. The microphone switch beside Note, Key and Tuner can turn it off, including while a permission request is pending. Its explicit on/off choice is saved locally for future entries and replay, independently of the tuner setting. No capture starts on the homepage. When permission is denied or capture is disabled, the routine retains plain, non-interactive tablature and a manual Next button. The existing demo/premium choices are unchanged.

With the microphone on, the current fret number has a fixed cyan highlight with the same illuminated-border treatment as the site controls. No pulse or surrounding halo is rendered. All notes in a triad or chord light together. Accepted positions stay green and an animated path leads to the next target, including a continuous route around wrapped staves on narrow screens. The current target scrolls into view. Scale, bass arpeggio and pentatonic exercises write the descending passage as additional columns after the ascent, in both microphone and offline modes, without repeating the turning note. Progression always reads left to right and then continues on the next staff; no target or path moves backwards over earlier columns. Progress persists when toggling the microphone or changing screen size; returning to a completed exercise restarts its guide.

Finishing the targets advances to the next exercise after a 750 ms “Well played!” interstitial. Manual Next uses the same transition and remains available when detection does not pick up the instrument. Double presses cannot skip exercises. Choosing a step, changing the key, replaying or leaving cancels a pending transition. Existing routine completion/replay and premium key restrictions remain in place. Reduced motion removes path and success-message animation while retaining the fixed highlight and brief success message.

## Local capture and lifecycle

`core/microphone.js` owns the sole microphone stream used by both tuner and routine. It connects an input source to an analyser, never to speakers. It contains no recorder, audio persistence, upload or third-party model call. Stop, navigation away, tuner opening, page hide/background, native background, track end and audio-context interruption release the stream and context. A late permission grant after leaving is immediately released. Backgrounding/interruption does not automatically resume capture. Opening a function or replaying the routine again follows its saved microphone preference and requires any applicable system permission. The permission itself is never bypassed or stored as a granted flag.

The shared microphone lifecycle replaces the tuner's former duplicate capture implementation; its existing single-string selection, smoothing and tuning display are preserved. iOS's permission explanation now mentions daily practice as well as tuning. Existing Android RECORD_AUDIO remains sufficient. Rebuild native apps for the updated iOS wording.

## Detection

Single targets reuse the YIN detector, checking the absolute pitch within 38 cents. The routine extends its search ceiling to 1500 Hz for high ukulele frets; the tuner's default is unchanged. Chords use a separate polyphonic detector: interpolated spectral peaks from a 16384-sample Web Audio FFT, a small dictionary of harmonic envelopes for **all playable pitches**, and a non-negative sparse spectral fit. Expected pitches, including their octaves, must all appear together, with no other significant fitted pitches. Duplicated unisons are treated as one acoustic pitch. This validates the displayed voicing, rather than only its chord name or root.

Matching must remain consecutive for at least 190 ms for a single note or 360 ms for a chord. Errors and analysis gaps reset the hold. The same pitch in successive fingerings requires a release or new attack, so a held note cannot clear multiple targets. At 48 kHz, the chord analysis window spans about 341 ms; this plus the stability gate means chord feedback is deliberately slower than a raw tuning reading.

The spectral fit is a lightweight approximation, not a general transcription model. Harmonic overlap, very quiet strings, distortion, room noise, strong resonance and microphone processing can cause missed or incorrect matches. Identical pitches on different strings cannot establish physical fingering. The Continue/Next fallback is intentional. Real guitar, bass and ukulele testing on Android and iOS is still needed before making accuracy claims; synthetic tests do not establish real-room performance.

Design references (no external source code or models copied): [Web Audio analyser specification](https://www.w3.org/TR/webaudio/#AnalyserNode), [NNLS Chroma's harmonic-dictionary approach](https://github.com/c4dm/nnls-chroma/blob/master/README).

## Verification

Run `node --test web/tests/*.test.cjs`.

Tests cover simultaneous voicings at 44.1/48 kHz, detuning, unequal string levels, stronger second harmonics, background noise, wrong thirds, missing/extra notes, wrong octaves, sequential arpeggiation, silence, held/rearticulated notes, forward reading of the written return passage, saved microphone preferences, high ukulele notes, transition cancellation and stream ownership/permission/lifecycle races. Existing routine generation, access, localization and tuner regression tests are retained.

Browser QA routes synthesized notes and simultaneous chords through an actual MediaStream and Web Audio analyser. It checks all five exercises through completion/replay on guitar, bass and ukulele, all displayed CAGED shapes, rejection of wrong notes/major chords/arpeggiation, interstitials, manual bypass, tuner handoff and cleanup. Responsive checks cover guitar/bass/ukulele across phone portrait, phone landscape, tablet and desktop, including reduced motion and translated controls. The QA sample also checks 432 generated polyphonic voicings across every key and quality. No physical microphone or native-device accuracy is claimed by these checks.
