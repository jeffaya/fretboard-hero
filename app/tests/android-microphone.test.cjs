const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const manifestPath = path.join(root, 'app/android/app/src/main/AndroidManifest.xml');
const source = fs.readFileSync(manifestPath, 'utf8');
const permissionTag = name => `<uses-permission android:name="android.permission.${name}" />`;
function validate(file) {
  const result = spawnSync(process.env.PWSH || 'pwsh', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File',
    path.join(root, 'scripts/validate-android-microphone.ps1'), '-Path', file], {encoding: 'utf8'});
  if (result.error) throw result.error;
  return {status: result.status, output: result.stdout + result.stderr};
}

test('The Android manifest provides both permissions requested by the installed Capacitor audio bridge', () => {
  // Check the actual dependency contract: its callback denies the WebView request
  // if any requested Android permission is missing, even if RECORD_AUDIO is granted.
  const bridgePath = require.resolve('@capacitor/android/capacitor/src/main/java/com/getcapacitor/BridgeWebChromeClient.java');
  const bridge = fs.readFileSync(bridgePath, 'utf8');
  const audio = bridge.match(/if\s*\([^\n]*AUDIO_CAPTURE[^\n]*\)\s*\{([^}]+)\}/);
  assert.ok(audio, 'Review the microphone permission contract after a Capacitor update');
  const requested = [...audio[1].matchAll(/permissionList\.add\(Manifest\.permission\.(\w+)\)/g)].map(match => match[1]).sort();
  assert.deepEqual(requested, ['MODIFY_AUDIO_SETTINGS', 'RECORD_AUDIO']);
  const result = validate(manifestPath);
  assert.equal(result.status, 0, result.output);
});

for (const permission of ['MODIFY_AUDIO_SETTINGS', 'RECORD_AUDIO']) {
  for (const mutation of ['missing', 'commented', 'sdk-limited', 'removed-by-merger']) {
    test(`Build guard rejects ${permission} when ${mutation}`, t => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fretboard-microphone-'));
      t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
      const tag = permissionTag(permission);
      assert.ok(source.includes(tag));
      const replacement = mutation === 'missing' ? '' : mutation === 'commented' ? `<!-- ${tag} -->` :
        tag.replace(' />', mutation === 'sdk-limited' ? ' android:maxSdkVersion="28" />' : ' tools:node="remove" />');
      const xml = source.replace(tag, replacement).replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ');
      const file = path.join(dir, 'AndroidManifest.xml');
      fs.writeFileSync(file, xml);
      const result = validate(file);
      assert.notEqual(result.status, 0, 'Invalid microphone manifest must stop the build');
      assert.match(result.output, new RegExp(`android\\.permission\\.${permission}`));
    });
  }
}
