# Instrument tuner

The home footer contains Language and Tuner side by side. Available in demo and full access. The tuner follows the selected instrument's canonical course definitions: standard six-string guitar E2 A2 D3 G3 B3 E4, four-string bass E1 A1 D2 G2, reentrant ukulele G4 C4 E4 A4. Notes follow the selected UI language. Alternate tunings are not included.

Enable microphone explicitly. Automatic mode chooses the closest open string by absolute pitch; tapping a note beside the illustrated headstock locks that string. The Auto switch toggles automatic detection; switching it off keeps the last detected string (or the first string before detection). Note labels omit octave numbers; absolute pitches remain unchanged internally. The modal and action buttons reuse the shared ui-modal, ui-panel, ui-primary and ui-back roles. The large note is the target string, the frequency and signed cents are measured. Green means within ±5 cents of the target, A4=440 Hz. Play one open string at a time; automatic selection can choose the wrong target if a string is very far out of tune, so use manual selection in that case.

Audio is analyzed locally using Web Audio and a YIN-style normalized difference detector. Nothing is recorded or uploaded. Silence/weak signals are rejected and a five-frame median reduces flicker. Capture stops on close, native back, page hide or backgrounding. A late permission response after closing is released immediately. Permissions denied and missing capture APIs have recoverable messages.

Android declares RECORD_AUDIO and uses Capacitor's WebChromeClient runtime permission handling. iOS declares NSMicrophoneUsageDescription and uses WKWebView capture. Rebuild native apps to pick up these changes. Web capture requires HTTPS (localhost also works).

Validation: Node tests cover all open pitches at 44.1/48 kHz with stronger second harmonics and ± detuning, silence, octave distinction, plus existing regression tests. Browser QA uses synthetic microphone input for correct/flat/sharp, denial, late permissions and cleanup on all three instruments. Portrait, landscape, tablet and desktop layouts are checked.

Before store release, test real guitar, bass and ukulele microphones on Android and iPhone/iPad: grant/deny permissions, each open string, background/resume, close/reopen, unplug a microphone, and quiet/noisy rooms. Browser simulation does not establish real-device accuracy; low bass fundamentals and electric instruments at low acoustic volume especially need this validation.
