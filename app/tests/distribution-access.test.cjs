const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {crc32} = require('node:zlib');

const root = path.resolve(__dirname, '../..');
const pwsh = process.env.PWSH || 'pwsh';
const instruments = ['guitar', 'bass-4', 'ukulele'];
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'app/instruments.json')));
const appId = (instrument, profile) => catalog[instrument].appId + (profile === 'Preview' ? '.preview' : '');
function run(script, args) {
  const result = spawnSync(pwsh, ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', path.isAbsolute(script) ? script : path.join(root, 'scripts', script), ...args], {encoding: 'utf8', env: {...process.env, POWERSHELL_TELEMETRY_OPTOUT: 'true', DOTNET_CLI_TELEMETRY_OPTOUT: 'true'}});
  if (result.error) throw result.error;
  return {status: result.status, output: result.stdout + result.stderr};
}
function temporary(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fretboard-paid-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  return dir;
}
function write(root, name, content) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, content);
  return file;
}

// Tiny stored ZIP fixtures exercise the same archive reader as real APKs/AABs.
function zip(entries) {
  const local = [], central = []; let offset = 0;
  for (const [name, text] of entries) {
    const filename = Buffer.from(name), data = Buffer.from(text), checksum = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4);
    header.writeUInt32LE(checksum, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt32LE(checksum, 16); record.writeUInt32LE(data.length, 20); record.writeUInt32LE(data.length, 24); record.writeUInt16LE(filename.length, 28); record.writeUInt32LE(offset, 42);
    local.push(header, filename, data); central.push(record, filename); offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

test('Real sync separates Store and Preview on both platforms and preserves the web demo', t => {
  const dir = temporary(t);
  const original = fs.readFileSync(path.join(root, 'web/site.config.json'));
  write(dir, 'web/site.config.json', original);
  write(dir, 'app/instruments.json', JSON.stringify(catalog));
  write(dir, 'web/index.html', fs.readFileSync(path.join(root, 'web/index.html')));
  const sharedAssets = ['bootstrap.js', 'home.js', 'core/access.js', 'core/native-billing.js', 'theme.css', 'locales.css', ...fs.readdirSync(path.join(root, 'web/assets/fonts')).filter(name => name.startsWith('noto-')).map(name => 'assets/fonts/' + name), 'routine.css', 'core/routine-encouragement.js', 'core/i18n.js', ...fs.readdirSync(path.join(root, 'web/locales')).filter(name => name.endsWith('.json')).map(name => 'locales/' + name), 'core/microphone.js', 'core/routine-echo.js', 'core/routine-rhythm-audio.js', 'core/routine-session.js', 'core/routine-melody.js', 'core/routine-exercises.js', 'core/routine-renderer.js'];
  for (const file of sharedAssets) write(dir, `web/${file}`, fs.readFileSync(path.join(root, 'web', file)));
  write(dir, 'app/native-assets/capacitor-bridge.js', fs.readFileSync(path.join(root, 'app/native-assets/capacitor-bridge.js')));
  fs.mkdirSync(path.join(dir, 'app/resources'), {recursive: true});
  fs.mkdirSync(path.join(dir, 'app/ios/App/App/Assets.xcassets/AppIcon.appiconset'), {recursive: true});
  for (const icon of ['guitar', 'bass', 'ukulele']) write(dir, `web/assets/instruments/${icon}/icon-1024.png`, Buffer.from(icon));
  // Reuse the same directory: an iOS/demo build must not contaminate Android.
  for (const profile of ['Preview', 'Store']) for (const platform of ['iOS', 'Android']) for (const instrument of instruments) {
    const result = run('sync-web.ps1', ['-Instrument', instrument, '-RepoPath', dir, '-Platform', platform, '-Profile', profile]);
    assert.equal(result.status, 0, result.output);
    const config = JSON.parse(fs.readFileSync(path.join(dir, 'app/www/site.config.json'), 'utf8'));
    assert.equal(config.instrument, instrument);
    assert.equal(config.appId, appId(instrument, profile));
    for (const icon of ['app/resources/icon.png', 'app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png']) {
      assert.equal(fs.readFileSync(path.join(dir, icon), 'utf8'), catalog[instrument].iconKey);
    }
    for (const file of sharedAssets) assert.deepEqual(fs.readFileSync(path.join(dir, 'app/www', file)), fs.readFileSync(path.join(root, 'web', file)), `${platform} ${instrument}: ${file} must match the website`);
    assert.equal(config.accessProfile, profile);
    assert.equal(config.unlocked, profile === 'Preview');
    assert.equal(config.nativeBilling, profile === 'Store');
    assert.equal(Object.hasOwn(config, 'testKeyHash'), false);
    assert.deepEqual(config.stores, JSON.parse(original).stores);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'web/site.config.json')), original);
  }
});

for (const format of ['apk', 'aab']) for (const profile of ['Store','Preview']) test(`Final ${format.toUpperCase()} gate rejects mixed profiles (${profile})`, t => {
  const dir = temporary(t), file = path.join(dir, `app.${format}`);
  const entry = `${format === 'aab' ? 'base/' : ''}assets/public/site.config.json`;
  const nativeEntry = `${format === 'aab' ? 'base/' : ''}assets/capacitor.config.json`;
  const native = instrument => [nativeEntry, JSON.stringify({appId: appId(instrument, profile)})];
  const config = {instrument: 'guitar', appId: appId('guitar', profile), accessProfile: profile, unlocked: profile === 'Preview', nativeBilling: profile === 'Store'};
  const validate = (instrument='guitar', expectedProfile=profile) => run('validate-android-access.ps1', ['-Path', file, '-Instrument', instrument, '-Profile', expectedProfile]);
  for (const instrument of instruments) {
    fs.writeFileSync(file, zip([[entry, JSON.stringify({...config, instrument, appId: appId(instrument, profile)})], native(instrument)]));
    const result = validate(instrument); assert.equal(result.status, 0, result.output);
    assert.notEqual(validate(instrument, profile === 'Store' ? 'Preview' : 'Store').status, 0);
    for (const other of instruments.filter(value => value !== instrument)) assert.notEqual(validate(other).status, 0);
  }
  const invalid = [
    {...config, unlocked: !config.unlocked}, {...config, nativeBilling: !config.nativeBilling},
    {...config, unlocked: 'true'}, {...config, nativeBilling: 'false'},
    {...config, unlocked: undefined}, {...config, nativeBilling: undefined},
    {...config, accessProfile: undefined}, {...config, instrument: 'ukulele'}, {...config, testKeyHash: null},
    {...config, appId: appId('bass-4', profile)}, {...config, appId: undefined},
  ];
  for (const value of invalid) {
    fs.writeFileSync(file, zip([[entry, JSON.stringify(value)], native('guitar')]));
    const result = validate();assert.notEqual(result.status, 0, JSON.stringify(value));
    assert.match(result.output, /Refusing to distribute the wrong access profile/);
  }
  for (const entries of [[], [[entry, '{broken']], [[entry, JSON.stringify(config)], [entry, JSON.stringify(config)]]]) {
    fs.writeFileSync(file, zip(entries));assert.notEqual(validate().status, 0);
  }
  for (const nativeEntries of [[], [native('bass-4')], [native('guitar'),native('guitar')], [[nativeEntry,'{broken']]]) {
    fs.writeFileSync(file, zip([[entry, JSON.stringify(config)], ...nativeEntries]));assert.notEqual(validate().status, 0);
  }
});

test('iOS preparation switches bundle ID, display name, icon and access together for each application', t => {
  const dir=temporary(t);
  for (const file of ['app/instruments.json','app/capacitor.config.json','app/ios/App/App.xcodeproj/project.pbxproj','app/ios/App/App/Info.plist','app/native-assets/capacitor-bridge.js','web/site.config.json','web/index.html']) write(dir,file,fs.readFileSync(path.join(root,file)));
  fs.mkdirSync(path.join(dir,'app/resources'),{recursive:true});
  fs.mkdirSync(path.join(dir,'app/ios/App/App/Assets.xcassets/AppIcon.appiconset'),{recursive:true});
  for (const item of Object.values(catalog)) write(dir,`web/assets/instruments/${item.iconKey}/icon-1024.png`,item.iconKey);
  const script=write(dir,'prepare-test.ps1',`param($Instrument,$Profile,$RepoPath)\nfunction npx { $global:LASTEXITCODE = 0 }\n& '${path.join(root,'scripts/prepare-ios.ps1').replace(/'/g,"''")}' -Instrument $Instrument -Profile $Profile -RepoPath $RepoPath\n`);
  for (const profile of ['Preview','Store']) for (const instrument of instruments) {
    const result=run(script,['-Instrument',instrument,'-Profile',profile,'-RepoPath',dir]);assert.equal(result.status,0,result.output);
    const config=JSON.parse(fs.readFileSync(path.join(dir,'app/capacitor.config.json'))), expected=appId(instrument,profile);
    assert.equal(config.appId,expected);assert.equal(config.appName,catalog[instrument].name+(profile==='Preview'?' Preview':''));
    const project=fs.readFileSync(path.join(dir,'app/ios/App/App.xcodeproj/project.pbxproj'),'utf8');
    const ids=[...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map(m=>m[1]);assert.ok(ids.length>=2);assert.ok(ids.every(id=>id===expected));
    assert.match(fs.readFileSync(path.join(dir,'app/ios/App/App/Info.plist'),'utf8'),new RegExp(`<string>${config.appName}</string>`));
    assert.equal(fs.readFileSync(path.join(dir,'app/resources/icon.png'),'utf8'),catalog[instrument].iconKey);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'app/www/site.config.json'))).appId,expected);
  }
});

test('Build-all calls each application once with all build options, and stops on a failure', t => {
  const dir=temporary(t);write(dir,'app/instruments.json',JSON.stringify(catalog));
  write(dir,'scripts/build-instrument.ps1',`param($Instrument,$RepoPath,$Profile,$BuildType,$Format,$VersionCode,$VersionName)\n$PSBoundParameters | ConvertTo-Json -Compress | Add-Content (Join-Path $RepoPath 'calls.jsonl')\nif ((Test-Path (Join-Path $RepoPath 'fail-bass')) -and $Instrument -eq 'bass-4') { throw 'Simulated build failure' }\n`);
  const args=['-RepoPath',dir,'-Profile','Store','-BuildType','Release','-Format','Both','-VersionCode','9','-VersionName','1.1.0'];
  let result=run('build-all.ps1',args);assert.equal(result.status,0,result.output);
  const calls=()=>fs.readFileSync(path.join(dir,'calls.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
  assert.deepEqual(calls().map(c=>c.Instrument),instruments);
  for(const c of calls()){assert.equal(c.Profile,'Store');assert.equal(c.BuildType,'Release');assert.equal(c.Format,'Both');assert.equal(c.VersionCode,9);assert.equal(c.VersionName,'1.1.0')}
  fs.unlinkSync(path.join(dir,'calls.jsonl'));write(dir,'fail-bass','');result=run('build-all.ps1',args);
  assert.notEqual(result.status,0);assert.deepEqual(calls().map(c=>c.Instrument),['guitar','bass-4']);
});
