const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {crc32} = require('node:zlib');

const script = path.resolve(__dirname, '../../scripts/validate-android-mapping.ps1');
const entryPath = 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map';
const billingClass = 'com.guitar.fretboardhero.PlayBillingPlugin';
const methods = ['cachedState', 'price', 'purchase', 'restore'];
const mapping = '# compiler: R8\n# compiler_version: 8.13\n' + billingClass + ' -> ' + billingClass + ':\n' +
  methods.map((name, i) => `    ${i + 1}:${i + 1}:void ${name}(com.getcapacitor.PluginCall):${20 + i}:${20 + i} -> ${name}\n`).join('') +
  'com.guitar.fretboardhero.VerifiedPurchaseCache -> a.b:\n    void clear() -> a\n';

// Stored ZIP fixtures exercise the production .NET archive reader, including
// duplicate entries (which object-based ZIP builders would silently overwrite).
function zip(entries) {
  const local = [], central = []; let offset = 0;
  for (const [name, text] of entries) {
    const filename = Buffer.from(name), data = Buffer.from(text), checksum = crc32(data);
    const header = Buffer.alloc(30), record = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4);
    header.writeUInt32LE(checksum, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt32LE(checksum, 16); record.writeUInt32LE(data.length, 20); record.writeUInt32LE(data.length, 24); record.writeUInt16LE(filename.length, 28); record.writeUInt32LE(offset, 42);
    local.push(header, filename, data); central.push(record, filename); offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

function fixture(t, extension = 'aab', text = mapping) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fretboard-mapping-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const bundle = path.join(dir, 'app.' + extension), sidecar = path.join(dir, 'mapping.txt');
  fs.writeFileSync(sidecar, text);
  const writeBundle = entries => fs.writeFileSync(bundle, zip(entries));
  writeBundle(extension === 'aab' ? [[entryPath, text]] : []);
  return {bundle, sidecar, writeBundle, run() {
    const result = spawnSync(process.env.PWSH || 'pwsh', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', script, '-Path', bundle, '-MappingPath', sidecar], {
      encoding: 'utf8', env: {...process.env, POWERSHELL_TELEMETRY_OPTOUT: 'true', DOTNET_CLI_TELEMETRY_OPTOUT: 'true'}
    });
    if (result.error) throw result.error;
    return {status: result.status, output: result.stdout + result.stderr};
  }};
}

test('release AAB accepts its exact R8 mapping with preserved billing entry points', t => {
  const f = fixture(t), result = f.run();
  assert.equal(result.status, 0, result.output);
});

test('Windows CRLF mappings and mappings without source line ranges are accepted', t => {
  const text = mapping.replace(/\d+:\d+:void/g, 'void').replace(/\):\d+:\d+/g, ')').replaceAll('\n', '\r\n');
  const result = fixture(t, 'aab', text).run();
  assert.equal(result.status, 0, result.output);
});

test('APK-only release requires a sidecar but no embedded AAB metadata', t => {
  const f = fixture(t, 'apk');
  assert.equal(f.run().status, 0);
  fs.unlinkSync(f.sidecar);
  const result = f.run();
  assert.notEqual(result.status, 0); assert.match(result.output, /mapping.txt is missing/);
});

test('empty, placeholder and header-only mappings cannot pass', t => {
  for (const value of ['', 'placeholder', '# compiler: R8\n']) {
    const result = fixture(t, 'aab', value).run();
    assert.notEqual(result.status, 0); assert.match(result.output, /non-empty R8 mapping/);
  }
});

test('missing and duplicate embedded AAB mappings are rejected', t => {
  const f = fixture(t);
  for (const entries of [[], [[entryPath, mapping], [entryPath, mapping]]]) {
    f.writeBundle(entries);
    const result = f.run();
    assert.notEqual(result.status, 0); assert.match(result.output, /exactly one embedded/);
  }
});

test('a mapping from a different build is rejected', t => {
  const f = fixture(t);
  f.writeBundle([[entryPath, mapping.replace(' -> a.b:', ' -> a.c:')]]);
  const result = f.run();
  assert.notEqual(result.status, 0); assert.match(result.output, /different builds/);
});

test('a removed or renamed native billing plugin is rejected', t => {
  for (const value of [mapping.replace(`${billingClass} -> ${billingClass}`, `${billingClass} -> a.c`), mapping.replace(billingClass, 'other.Plugin')]) {
    const result = fixture(t, 'aab', value).run();
    assert.notEqual(result.status, 0); assert.match(result.output, /PlayBillingPlugin was removed or renamed/);
  }
});

test('each billing entry point must retain its name within the billing class', t => {
  for (const name of methods) {
    const result = fixture(t, 'aab', mapping.replace(` -> ${name}\n`, ' -> a\n')).run();
    assert.notEqual(result.status, 0); assert.ok(result.output.includes(`PlayBilling.${name} was removed or renamed`), result.output);
  }
  // A same-name method on another class must not hide the missing entry point.
  const line = mapping.split('\n').find(line => line.includes('void restore('));
  const result = fixture(t, 'aab', mapping.replace(line + '\n', '') + line + '\n').run();
  assert.notEqual(result.status, 0); assert.match(result.output, /PlayBilling.restore was removed or renamed/);
});

test('missing packages and invalid AAB archives fail validation', t => {
  const f = fixture(t);
  fs.unlinkSync(f.bundle); assert.notEqual(f.run().status, 0);
  fs.writeFileSync(f.bundle, 'not a ZIP'); assert.notEqual(f.run().status, 0);
});
