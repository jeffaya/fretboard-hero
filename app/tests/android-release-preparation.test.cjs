const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildHistory, resolveVersion } = require('../../scripts/google-play/version.cjs');
const { prepare, generateNotes, productionBuild } = require('../../scripts/google-play/prepare-notes.cjs');
const { releaseName } = require('../../scripts/google-play/publish.cjs');
const { readNotes } = require('../../scripts/google-play/notes.cjs');

test('next build code and dotted names preserve explicit overrides and Play limits', () => {
  for (const [code, name] of [[9,'1.0.9'],[10,'1.1.0'],[11,'1.1.1'],[20,'1.2.0'],[131,'1.3.1'],[201,'2.0.1']]) {
    assert.deepEqual(resolveVersion('', '', [{code: code - 1}]), {code: String(code), name});
  }
  assert.deepEqual(resolveVersion('45','3.0.0-rc1',[]), {code:'45', name:'3.0.0-rc1'});
  assert.throws(() => resolveVersion('', '', []), /first version code/);
  assert.throws(() => resolveVersion('', '', [{code:2100000000}]), /Invalid Android/);
  assert.throws(() => resolveVersion('-3','',[]), /Invalid Android/);
  assert.throws(() => resolveVersion('11','../1.1.1',[]), /Invalid public/);
});

test('read numeric legacy titles and completed build jobs including retries and partial failures', async () => {
  const title = 'Generate Android App · all · versionName ';
  const run = (id, text, conclusion, status = 'completed') => ({id, head_sha:String(id).repeat(40), head_branch:'main', display_title:title + text, status, conclusion});
  const runs = [
    run(5,'auto · versionCode auto', null, 'in_progress'),
    run(4,'auto · versionCode 12 · production','failure'),
    run(3,'auto · versionCode 11 · build-only','success'),
    run(2,'1.1.0 · versionCode 10','success'),
    run(1,'1.0.9 · versionCode 9','cancelled')
  ];
  const jobs = {
    5:[{name:'Build all · versionName 1.1.3 · versionCode 13',conclusion:'success'}],
    4:[{name:'Build all · versionName 1.1.2 · versionCode 12',conclusion:'success'}],
    3:[{name:'Build all · versionName 1.1.1 · versionCode 11',conclusion:'success'}],
    1:[{name:'build',conclusion:'cancelled'}]
  };
  const records = await buildHistory(async url => {
    if (url.includes('workflows/')) return {workflow_runs:runs};
    assert.match(url, /filter=all/);
    return {jobs:jobs[url.match(/runs\/(\d+)\/jobs/)[1]]};
  },'5');
  assert.deepEqual(records.map(b => [b.code,b.name]), [[13,'1.1.3'],[12,'1.1.2'],[11,'1.1.1'],[10,'1.1.0']]);
  assert.equal(records.find(b => b.run === '5').code,13);
});

test('baseline is a published build of the selected app, including legacy manual uploads', () => {
  const baseline = { instrument:'bass-4', main:true, name:'1.1.0', code:10, sha:'a'.repeat(40) };
  const release = {releaseName:'manual',releaseLifecycleState:'RELEASE_LIFECYCLE_STATE_PUBLISHED',activeArtifacts:[{versionCode:10}]};
  const pending = {...release,releaseLifecycleState:'RELEASE_LIFECYCLE_STATE_IN_REVIEW',activeArtifacts:[{versionCode:11}]};
  const historical = [baseline,{...baseline,instrument:'guitar',sha:'x'.repeat(40)}];
  assert.equal(productionBuild([pending,release],historical,'bass-4'),baseline.sha);
  assert.throws(() => productionBuild([pending],historical,'bass-4'), /No published/);
  const another = {...baseline,sha:'b'.repeat(40)};
  assert.throws(() => productionBuild([release],[baseline,another],'bass-4'), /Cannot match/);
  release.releaseName = releaseName(another.sha,another.name,another.code);
  assert.equal(productionBuild([release],[baseline,another],'bass-4'),another.sha);
  assert.throws(() => productionBuild([release],[baseline],'bass-4'), /Cannot match/);
});

test('build output preserves reviewed notes and generates 14 usable notes for later versions', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'play-build-notes-'));
  t.after(() => fs.rmSync(directory,{recursive:true,force:true}));
  const initial = readNotes('1.1.1','all');
  const changed = ['web/core/routine-exercises.js','web/fr/bass/triads/index.html','app/tests/android-images.test.cjs'];
  for (const [instrument, records] of Object.entries(initial)) {
    const reviewed = prepare({version:'1.1.1',instrument,directory,changes:() => assert.fail('Reviewed note must win')});
    assert.deepEqual(reviewed,records);
    const generated = prepare({version:'1.1.2',instrument,baseline:'a',head:'b',directory,changes:(base,head) => {
      assert.equal(base,'a'); assert.equal(head,'b'); return changed;
    }});
    assert.equal(generated.length,14);
    assert.deepEqual(readNotes('1.1.2',instrument,directory)[instrument],generated);
    const french = generated.find(n => n.language === 'fr-FR').text;
    assert.match(french,/Routine quotidienne/);
    assert.equal(french.includes('Théorie musicale'),instrument === 'bass-4');
  }
  const neutral = generateNotes('1.1.3',['.github/workflows/deploy.yml'],'guitar');
  assert.equal(neutral['fr-FR'],'Fretboard Hero 1.1.3 est disponible.');
});
