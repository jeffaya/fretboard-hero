# Guided Daily Routine

Opening Daily Routine starts microphone capture by default, subject to the browser/device permission prompt. The microphone switch beside Note, Key and Tuner can turn it off, including while a permission request is pending. Its explicit on/off choice is saved locally for future entries and replay, independently of the tuner setting. No capture starts on the homepage. When permission is denied or capture is disabled, the routine retains plain, non-interactive tablature and a manual Next button. The existing demo/premium choices are unchanged.

With the microphone on, the current fret number has a fixed cyan highlight with the same illuminated-border treatment as the site controls. No pulse or surrounding halo is rendered. All notes in a triad or chord light together. Accepted positions stay green and an animated path leads to the next target, including a continuous route around wrapped staves on narrow screens. The current target scrolls into view. Scale, bass arpeggio and pentatonic exercises write the descending passage as additional columns after the ascent, in both microphone and offline modes, without repeating the turning note. Progression always reads left to right and then continues on the next staff; no target or path moves backwards over earlier columns. Progress persists when toggling the microphone or changing screen size; returning to a completed exercise restarts its guide.

Finishing the targets advances to the next exercise after a 750 ms “Well played!” interstitial. Manual Next uses the same transition and remains available when detection does not pick up the instrument. Double presses cannot skip exercises. Choosing a step, changing the key, replaying or leaving cancels a pending transition. Existing routine completion/replay and premium key restrictions remain in place. Reduced motion removes path and success-message animation while retaining the fixed highlight and brief success message.

## Local capture and lifecycle

`core/microphone.js` owns the sole microphone stream used by both tuner and routine. It connects an input source to an analyser, never to speakers. It contains no recorder, audio persistence, upload or third-party model call. Stop, navigation away, tuner opening, page hide/background, native background, track end and audio-context interruption release the stream and context. A late permission grant after leaving is immediately released. Backgrounding/interruption does not automatically resume capture. Opening a function or replaying the routine again follows its saved microphone preference and requires any applicable system permission. The permission itself is never bypassed or stored as a granted flag.

The shared microphone lifecycle replaces the tuner's former duplicate capture implementation; its existing single-string selection, smoothing and tuning display are preserved. iOS's permission explanation now mentions daily practice as well as tuning. Existing Android RECORD_AUDIO remains sufficient. Rebuild native apps for the updated iOS wording.

## Detection

Single targets reuse the YIN detector, checking the absolute pitch within 38 cents. The routine extends its search ceiling to 1500 Hz for high ukulele frets; the tuner's default is unchanged. Chords use a separate polyphonic detector: interpolated spectral peaks from a 16384-sample Web Audio FFT, a small dictionary of harmonic envelopes (including notches caused by different plucking positions) for **all playable pitches**, and a non-negative sparse spectral fit. Every required chord tone must appear together in the current analysis frame, and the lowest detected pitch must match the displayed bass. This distinguishes major/minor and bass inversions. Octave doublings are not required individually: their overlapping partials cannot be separated reliably with this lightweight detector. Small fitting artefacts are tolerated, and upper integer partials of the written notes are not treated as extra strings. Significant foreign tones in the written register still reject the chord. This validates the chord and its bass, not every physical string or doubled octave.

The shared input floor is 0.0005 RMS (previously 0.004), so soft fingerpicking reaches analysis instead of being discarded. Chord FFT peaks are admitted down to −85 dB (previously −70 dB); the harmonic fit still checks all playable pitches, and chord validation requires its tones and bass. Repeated-note attacks use a relative level rise without an absolute loudness requirement. This does not amplify the microphone or relax single-note pitch accuracy. Broadband noise and isolated taps still need to pass the pitch/harmonic analysis and stability gate.

Matching must remain consecutive for at least 190 ms for a single note or 160 ms for a chord (three complete matching frames at the 80 ms analysis cadence). Errors and analysis gaps reset the hold. The same pitch, or the same chord tones and bass in successive shapes, requires a release or new attack, so a held chord cannot clear multiple CAGED shapes merely because their octave doublings differ. At 48 kHz, the chord analysis window spans about 341 ms; this plus the stability gate means chord feedback is deliberately slower than a raw tuning reading.

The spectral fit is a lightweight approximation, not a general transcription model. Harmonic overlap, very quiet strings, distortion, room noise, strong resonance and microphone processing can cause missed or incorrect matches. Identical pitches on different strings cannot establish physical fingering. The Continue/Next fallback is intentional. Real guitar, bass and ukulele testing on Android and iOS is still needed before making phone-accuracy claims. The recorded-guitar checks below improve timbre coverage but do not establish performance in the user’s room.

Design references (no external source code or models copied): [Web Audio analyser specification](https://www.w3.org/TR/webaudio/#AnalyserNode), [NNLS Chroma's harmonic-dictionary approach](https://github.com/c4dm/nnls-chroma/blob/master/README).

## Verification

Run `node --test web/tests/*.test.cjs`.

Tests cover simultaneous voicings at 44.1/48 kHz, detuning, unequal string levels, stronger second harmonics, background noise, wrong thirds, missing chord tones, extra foreign notes, wrong bass octaves, sequential arpeggiation, silence, held/rearticulated notes, forward reading of the written return passage, saved microphone preferences, high ukulele notes, transition cancellation and stream ownership/permission/lifecycle races. Existing routine generation, access, localization and tuner regression tests are retained.

Browser QA routes synthesized notes and simultaneous chords through an actual MediaStream and Web Audio analyser. It checks all five exercises through completion/replay on guitar, bass and ukulele, all displayed CAGED shapes, rejection of wrong notes/major chords/arpeggiation, interstitials, manual bypass, tuner handoff and cleanup. Responsive checks cover guitar/bass/ukulele across phone portrait, phone landscape, tablet and desktop, including reduced motion and translated controls. The QA sample also checks 432 generated polyphonic voicings across every key and quality. No native-device or user-phone microphone accuracy is claimed by these checks.

## Recorded guitar evaluation

Source: [IDMT-SMT-Guitar, version 2](https://zenodo.org/records/7544110), Fraunhofer IDMT, Christian Kehling, Andreas Männchen and Arndt Eppler (CC BY-NC-ND 4.0, evaluation only). Audio and annotations are not bundled or served by the application.

The comparison uses all 88 major/minor chord WAV/XML pairs in dataset1’s `Fender Strat Clean Neck SC Chords` and `Ibanez Power Strat Clean Bridge HU Chords` folders. Each 44.1 kHz recording is analyzed with the same 16384-sample Blackman FFT, every 80 ms from 0.56 s through 1.84 s. Success requires the live stability gate, not just one matching frame. Before the chord changes, 8/88 recordings passed. With the revised detector and gate, 84/88 pass; all 88 corresponding opposite-third candidates are rejected. Four recordings still fail, so this is not a claim of complete recognition.

A separate fingerstyle check uses the simultaneous three-tone passages in dataset2 `FS_Lick7_FN` at 5.9545/6.9355 s and `FS_Lick10_FN` at 7.4939/10.96 s, using XML note onsets/offsets. All four passages pass, including a chord lasting about 0.4 s; altered-tone candidates are rejected.

To reproduce the 88-clip check with a separately obtained dataset:

```sh
node web/tests/check-recorded-chords.cjs /path/to/IDMT-SMT-GUITAR_V2
```
