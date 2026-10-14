# Guided Daily Routine

Opening Daily Routine starts microphone capture by default, subject to the browser/device permission prompt. The unboxed microphone switch beside the listening status, immediately above the tablature, can turn it off, including while a permission request is pending. It stays visible when capture is off or unavailable on phone, tablet and desktop; it is no longer in the setup drawer. The note counter remains on the right. Permission denial, unsupported capture and unavailable hardware each have a short, localized red status message. Turning capture on again clears the error styling while permission is pending. The microphone row is hidden on completion and restored when revisiting an exercise or replaying. Its explicit on/off choice is saved locally for future entries and replay, independently of the tuner setting. No capture starts on the homepage. When permission is denied or capture is disabled, the routine retains plain, non-interactive tablature and a manual Next button. The existing demo/premium choices are unchanged.

With the microphone on, the current fret number has a bright fuchsia (the shared #e927ff accent) filled face, white digits, a matching neon-fuchsia outline and a fixed fuchsia halo. The fuchsia target remains distinct from the dark green faces of accepted notes; the target does not pulse. All notes in a triad or chord light together. Accepted positions stay green and an animated path leads to the next target, including a continuous route around wrapped staves on narrow screens. The current target scrolls into view. Scale, bass arpeggio and pentatonic exercises write the descending passage as additional columns after the ascent, in both microphone and offline modes, without repeating the turning note. Progression always reads left to right and then continues on the next staff; no target or path moves backwards over earlier columns. Progress persists when toggling the microphone or changing screen size; returning to a completed exercise restarts its guide.

Finishing the targets advances to the next exercise after a 750 ms “Well played!” interstitial. Manual Next uses the same transition and remains available when detection does not pick up the instrument. Double presses cannot skip exercises. Choosing a step, changing the key, replaying or leaving cancels a pending transition. Existing routine completion/replay and premium key restrictions remain in place. Reduced motion removes path and success-message animation while retaining the fixed highlight and brief success message.

The exercise heading retains programmatic focus for assistive navigation but has no visible outline. The target notes remain the visual guide, and interactive controls retain their keyboard focus indicators.

## Guitar triad journey

The guitar triad exercise traverses GBE (strings 3–2–1), then DGB (4–3–2), then ADG (5–4–3). The EAD bass group is intentionally excluded. Each group starts with the nearest playable close-position triad, including open strings where applicable, and visits every successive inversion whose notes fit within frets 0–15. The root and major/minor quality stay the same throughout. Bass and ukulele keep their existing three-inversion exercises.

Between each pair of triads, a separate target asks for the **third of the upcoming voicing**. The source note belongs to the previous triad on the same string; the displayed fret arrow gives the optional slide movement. A minor uses C, A major uses C#, and spelling preserves the diatonic third even for E# or double sharps. Sliding is optional: only the arrival note is evaluated, not the physical gesture or string used.

One string group is played at a time, while all six guitar strings remain visible on every tablature staff. String labels use their localized note names without numeric suffixes. The GBE/DGB/ADG pills are removed; the notes themselves show the active strings. Inversion names and CAGED references remain above the columns. CAGED labels are calculated from exact matching three-string fragments of the existing templates, including degree identity and the minor-third adjustment. Shared fragments show both forms (for example C / D); no label is forced when there is no exact match. These are relationships to a parent shape, not a requirement to play its full chord.

With the microphone on, all triad tones must sound together, then each intervening third must sound alone. The liaison reuses the pitch detector and additionally checks the harmonic fit for a single pitch, so playing the next full triad cannot replace the isolated-note target. Other single-note exercises and full-chord matching rules are unchanged. As with the rest of the detector, harmonic ambiguity and residual ringing can affect recognition; muting the other strings helps isolate the liaison.

Completing a group advances automatically after the existing short success transition. Manual **Next strings** completes the current group and moves to the next; the third group's Next moves to the chord exercise. The overall Triads step is complete only after all three groups have been traversed. Group/note progress survives microphone toggling and navigation to an unfinished exercise. Reopening a completed exercise or replaying the routine starts again at GBE. All new copy is localized in the 11 supported languages.

## Scales and diagonal pentatonics

`RoutineMelody` builds the annotated single-note journeys. Scale remains the full major or natural minor scale on every instrument. It now uses one stable, compact octave in each key, starting on the lowest playable root; guitar starts on the low E string. The selection prefers a small fret span and a root near the lower end of that span. The seven degrees, correctly spelled note names (including E♯/B♯), and repeated octave root are written above the tablature.

The outward and return passages are two named sections: **Ascending** (eight notes) and **Returning** (seven). The turning note is played once. The return is still read left to right; its instruction changes accordingly. Section completion uses the existing automatic transition or the manual **Return** button. Only the completed return marks the Scale step complete.

Guitar Penta replaces a randomly chosen box with one diagonal per routine. Diagonal 1 uses two notes on the lower string and three on the next; diagonal 2 uses three then two. Each repeats exactly the same five pitch classes and intervals an octave higher on E/A, D/G and B/e. In A minor, these motifs are G–A–C–D–E and C–D–E–G–A. The three framed blocks identify these repeated cells, while P1–P5 retain the existing Learn box numbering. They are not three new position numbers. The first A minor route crosses P5 → P1 → P2 → P3. Each block labels its actual box transition, and a slash links the two same-string notes at the shift. Major uses the corresponding relative-minor geometry with major note names and degrees.

These complete three-block diagonals use the instrument's full fret range when needed (A minor diagonal 2 reaches fret 17; all standard guitar keys fit by fret 20). The triad and scale exercises retain their fret-15 limit. Bass/ukulele retain their existing pentatonic boxes and now expose their position label.

The guitar diagonal alternates on routine entry and replay, with the next variant saved locally per instrument. Root/quality changes, section navigation, resizing and microphone toggles preserve the chosen variant. Blocked storage falls back to in-session alternation. All six guitar strings remain visible in each staff. On narrow screens, the three blocks wrap individually; automatic following keeps the active block, its heading and its strings in view. Notes are validated through the existing single-pitch gate, including arrival after a slide; physical sliding and the string used cannot be inferred from a single pitch. No gesture detector or rhythm requirement is added.

The ascent has 15 notes and the return 14. The peak is not replayed. The return reverses the same fingerings and slides. All instructions, directions, block labels, degrees and accessible descriptions are localized in the 11 languages. The former random guitar box path and unused scale instruction are removed.

Tests cover every key/quality, both diagonal variants, exact octave repetition, five distinct tones per block, membership in the labelled positions, two-fret slides in both directions, stable scale spellings and fingerings, session/reload alternation, blocked storage and section completion. Browser QA includes phone/tablet/desktop layouts, translations, bass/ukulele and synthesized single notes through a real Web Audio MediaStream/analyser; this does not establish accuracy on a physical guitar microphone.

## Guitar right-hand warm-up

The guitar's fourth stage is **Rhythm**. Any chord, open strings, or muted strings can be used. There is no harmony, bass, stroke-direction, palm-mute-quality or accent-strength requirement in this stage. Bass arpeggios, ukulele chords and guitar triads retain their existing pitch validation.

`routine-patterns.js` owns a fixed catalogue of ten motifs. In its notation, spaces separate quarter-note beats, `-` means no attack, D/U give the suggested direction, d/u are palm-muted, x is percussive, and > accents the following stroke. These symbols guide the hand; the audio score judges attack timing only.

| ID | Level | Subdivisions per beat | Fixed motif |
| --- | --- | --- | --- |
| pulse | Basic | 2 | D- D- D- D- |
| rock-eighths | Basic | 2 | DD DD DD DD |
| alternate | Basic | 2 | DU DU DU DU |
| folk | Intermediate | 2 | D- DU D- DU |
| pop | Intermediate | 2 | D- DU -U DU |
| offbeat | Intermediate | 2 | -U -U -U -U |
| percussive | Intermediate | 2 | DU xU DU xU |
| palm | Advanced | 2 | du >DU du >DU du >DU -U >DU |
| gallop | Advanced | 4 | D-DU D-DU D-DU D-DU |
| syncopated | Advanced | 4 | D-DU DUD- D-D- D-DU xx>Dx D>UxU >DxDU Dx>DU |

The first half of `syncopated` and the `gallop` reproduce the D/U rhythms in the user's supplied references. The eight-beat funk and palm-mute combinations are practice arrangements. The catalogue is a pedagogical selection, not a measured popularity ranking. Teaching references consulted:

- [Andy Guitar strumming course](https://www.andyguitar.co.uk/courses/strumming-course): quarter/eighth notes, offbeats, omitted strokes and sixteenths.
- [Good Guitarist's common pop/folk pattern](https://goodguitarist.com/most-common-guitar-strumming-pattern/).
- [Guitareo's five essential patterns](https://www.guitarlessons.com/guitar-lessons/guitar-lessons-for-beginners/5-essential-strumming-patterns): alternate strumming and percussive hits on 2 and 4.
- [Palm muting](https://www.guitarlessons.com/guitar-lessons/guitar-technique/how-to-palm-mute-guitar/) and [Sound Guitar Lessons](https://www.soundguitarlessons.com/blog/top-guitar-strumming-patterns): palm mute, gallop and funk sixteenths.

One motif per level forms each routine. Each stays selected for two routine entries/replays before rotating; every fourth routine may review a difficult, not recently selected motif. All ten remain reachable. Only guitar entries advance this rotation. Completed and attempted repeats are stored locally under `fretboard-rhythm-practice-v1`; invalid/blocked storage falls back to memory. Key changes preserve the current selection.

Tempo defaults to **80 BPM** with selectable values from 20 to 120. Practice and Listen start immediately, without a count-in. The pattern loops continuously with one magenta active arrow; every other arrow stays white. Sixteenth patterns wrap by complete beats on small screens. Main stages and pattern stages share the `.ui-steps` / `.ui-step` design: numbered slate cards, magenta active state, mint completion check and visible keyboard focus for stage buttons. Pattern steps remain noninteractive. The shared cyan legend sits below the card, in the same position as every other routine. It explains down/up strokes, muted hits, palm muting, accents, beat numbers, offbeats, beams, gaps and the magenta current stroke; sixteenth motifs also explain e/a. Next always stays centered in the shared action area below the legend, with the same dimensions and styling as the other exercises. The card shows successful repeats out of three and explains automatic advancement; with the mic off or Listen active, it explains why progress is suspended. Microphone/status, BPM and Listen share the toolbar, with no duplicate Start/Pause control.

`RoutineRhythm` supplies both display position and onset grading using one monotonic clock. Excellent is within ±5% of a quarter-note beat, Good within ±10%, Early/Late within ±20%; the accepted window is capped to 45% of the shortest attack gap to prevent ambiguous adjacent sixteenths. More distant attacks receive Too early/Too late. At 80 BPM, Excellent is ±37.5 ms. Grades appear next to the relevant arrow, with reduced-motion support. Duplicate detections cannot increase the score. Extra attacks outside the timing window count against the repeat, so strumming indiscriminately through the gaps cannot clear a sparse pattern.

A complete motif repeat succeeds at 75% or more, using expected attacks plus extra mistimed attacks as the denominator. **Three successful complete repeats accumulate**, including across failed repeats. Four-beat motifs require at least 12 beats; eight-beat motifs require at least 24. Failures never remove successful repeats. A 100 ms delivery grace period allows the microphone's last pre-boundary frame to arrive. Next skips the current pattern; after the third, it advances to the next routine stage. With the microphone off, the loop continues without invented successes or automatic completion. Tempo changes, preview and stage navigation retain the phase and previously successful repeats. A partially unmonitored repeat is discarded when the microphone changes. Backgrounding and tuner opening pause the rhythm; returning or closing the tuner resumes the visual exercise, without automatically restarting microphone capture. Stalled frames freeze elapsed gaps instead of racing past the player.

`RoutineGuide.createStrumGate` evaluates DC-corrected RMS in 10 ms windows. Entry, resets and capture gaps over 100 ms seed the noise floor and 120 ms decaying peak envelope from the existing audio buffer without emitting hits: a sound already present is not a fresh attack. The noise estimate follows the lower quartile of the last 400 ms, with smoothing; it stops adapting for 800 ms after an attack so ringing guitar tails and fast repeated strums do not become the noise floor. Candidates must exceed both three times the ambient floor (minimum RMS 0.0005) and 1.45 times the peak envelope. A second 10 ms window confirms sustained energy, rejecting isolated electrical clicks. Grading retains the first window's timestamp; there is no visual countdown or pitch/chord confirmation. Input polling is 20 ms for strumming and 80 ms for pitch exercises. The refractory period follows the shortest attack interval, bounded to 60–150 ms, preserving fast muted sixteenths.

Regression tests cover fluctuating room noise, hum/DC offset, isolated clicks, slowly rising noise, capture resets, lingering sound on resume, weak strums over noise and fast ringing/muted strokes at 44.1 and 48 kHz. The session test verifies no grades or successful repeats appear with ambient input, including after a tempo change. These are synthetic signals, not validation on every physical microphone. An onset detector cannot reliably distinguish a loud unrelated transient (such as a clap) from a percussive muted strum; hardware input latency also remains relevant.

`routine-rhythm-audio.js` synthesizes short filtered noise attacks locally for Listen, varying duration/timbre for percussive and palm-muted strokes and volume for accents. Audio is scheduled ahead on the Web Audio clock while the same displayed rhythm clock drives the arrows. Listen pauses practice and suspends all scoring, then loops until stopped. Stopping resumes practice immediately. An unavailable audio preview also returns to practice, and a tempo change stops preview and resumes practice at the selected tempo. The first preview stroke is scheduled at position zero before the animation frame, so it is not skipped. Skip, navigation, tuner opening and backgrounding stop all scheduled preview sources and close their output context. No audio assets or microphone recordings are stored.

The former chord progression generation, scrolling six-string rhythm tablature, delayed harmonic confirmation, relaxed-bass detector option, measure-skip control, chord-status UI, obsolete styles and translation keys have been removed. The other stages' green played notes and chord recognition remain intact.

## Local capture and lifecycle

`core/microphone.js` owns the sole microphone stream used by both tuner and routine. It connects an input source to an analyser, never to speakers. It contains no recorder, audio persistence, upload or third-party model call. Stop, navigation away, tuner opening, page hide/background, native background, track end and audio-context interruption release the stream and context. A late permission grant after leaving is immediately released. Backgrounding/interruption does not automatically resume capture. Opening a function or replaying the routine again follows its saved microphone preference and requires any applicable system permission. The permission itself is never bypassed or stored as a granted flag.

The shared microphone lifecycle replaces the tuner's former duplicate capture implementation; its existing single-string selection, smoothing and tuning display are preserved. iOS's permission explanation now mentions daily practice as well as tuning. Existing Android RECORD_AUDIO remains sufficient. Rebuild native apps for the updated iOS wording.

## Detection

Single targets reuse the YIN detector, checking the absolute pitch within 38 cents. The routine extends its search ceiling to 1500 Hz for high ukulele frets; the tuner's default is unchanged. Chords use a separate polyphonic detector: interpolated spectral peaks from a 16384-sample Web Audio FFT, a small dictionary of harmonic envelopes (including notches caused by different plucking positions) for **all playable pitches**, and a non-negative sparse spectral fit. Every required chord tone must appear together in the current analysis frame. The lowest detected pitch must match the displayed bass. This distinguishes major/minor and bass inversions. Octave doublings are not required individually: their overlapping partials cannot be separated reliably with this lightweight detector. Small fitting artefacts are tolerated, and upper integer partials of the written notes are not treated as extra strings. Significant foreign tones in the written register still reject the chord. This validates the chord and its bass, not every physical string or doubled octave.

The shared input floor is 0.0005 RMS (previously 0.004), so soft fingerpicking reaches analysis instead of being discarded. Chord FFT peaks are admitted down to −85 dB (previously −70 dB); the harmonic fit still checks all playable pitches, and chord validation requires its tones and bass. Repeated-note attacks use a relative level rise without an absolute loudness requirement. This does not amplify the microphone or relax single-note pitch accuracy. In pitch exercises, broadband noise and isolated taps still need to pass the pitch/harmonic analysis and stability gate.

Matching must remain consecutive for at least 190 ms for a single note or 160 ms for a chord (three complete matching frames at the 80 ms analysis cadence). Errors and analysis gaps reset the hold. The same pitch, or the same chord tones and bass in successive shapes, requires a release or new attack, so a held chord cannot clear successive targets merely because their octave doublings differ. Guitar strumming uses the separate attack gate described above. At 48 kHz, the chord analysis window spans about 341 ms; this plus the stability gate means chord feedback is deliberately slower than a raw tuning reading.

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
