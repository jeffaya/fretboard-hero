const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { readNotes } = require('../../scripts/google-play/notes.cjs');
const { publish, matchesArchivedBundle } = require('../../scripts/google-play/publish.cjs');

const sha = 'a'.repeat(40);
const bundle = Buffer.from('signed bundle fixture');
const artifact = { versionCode: 11, sha256: crypto.createHash('sha256').update(bundle).digest('hex') };
const buildId = crypto.createHash('sha256').update(sha + '/1.1.0/11').digest('hex').slice(0, 20);
const legacyName = '1.1.0 (11) @' + buildId;
const name = '11 (1.1.0)';
const notes = readNotes('1.1.0', 'all');
const base = '/androidpublisher/v3/applications/com.bass.fretboardhero';
const edit = base + '/edits/abc';
const commit = edit + ':commit?changesInReviewBehavior=ERROR_IF_IN_REVIEW';
const summary = state => ({ releaseName: name, activeArtifacts: [{ versionCode: 11 }], releaseLifecycleState: 'RELEASE_LIFECYCLE_STATE_' + state });

test('the initial version provides exactly the 14 listing locales for all three instruments', () => {
  const apps = require('../instruments.json');
  assert.deepEqual(Object.keys(notes), Object.keys(apps));
  for (const [id, records] of Object.entries(notes)) {
    const dir = path.join(__dirname, '../../stores/google-play', apps[id].iconKey);
    assert.equal(new Set(records.map(n => n.language)).size, 14);
    for (const { language } of records) assert(fs.existsSync(path.join(dir, language, 'alt-text.json')), language);
  }
});

test('resolves instrument overrides, requires an exact version and validates every selected note', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'play-notes-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const common = Object.fromEntries(notes.guitar.map(r => [r.language, r.text]));
  const save = extra => fs.writeFileSync(path.join(dir, '2.0.json'), JSON.stringify({ common, ...extra }));
  save({ 'bass-4': { 'fr-FR': 'Basse' } });
  const result = readNotes('2.0', 'all', dir);
  assert.equal(result['bass-4'].find(n => n.language === 'fr-FR').text, 'Basse');
  assert.deepEqual(result.guitar, notes.guitar);
  assert.throws(() => readNotes('2.1', 'all', dir), /ENOENT/);
  assert.throws(() => readNotes('../2.0', 'all', dir), /Invalid version/);
  save({ ukulele: { ar: '🎸'.repeat(501) } });
  assert.throws(() => readNotes('2.0', 'all', dir), /ukulele \/ ar/);
  delete common['bn-BD'];
  save({});
  assert.throws(() => readNotes('2.0', 'guitar', dir), /bn-BD/);
});

function play({
  bundles = [], tracks = [], before = [], after = [summary('IN_REVIEW')],
  uploaded = artifact, commitError, track = 'production', matchesArchive
} = {}) {
  const calls = [];
  const waits = [];
  let statusReads = 0;
  const request = async (method, url, body) => {
    calls.push({ method, url, body });
    if (url === base + '/tracks/' + track + '/releases') {
      if (statusReads++ === 0) return { releases: before };
      return { releases: typeof after === 'function' ? after(statusReads - 1) : after };
    }
    if (url === base + '/edits') return { id: 'abc' };
    if (url === edit + '/tracks') return { tracks };
    if (url === edit + '/bundles') return { bundles };
    if (url === '/upload' + edit + '/bundles?uploadType=media') { assert.equal(body, bundle); return uploaded; }
    if (method === 'PUT' && url === edit + '/tracks/' + track) return body;
    if (url === commit && commitError) throw Error(commitError);
    if (url === commit || url === commit + '&changesNotSentForReview=true' || (method === 'DELETE' && url === edit)) return {};
    throw Error('Unexpected request ' + method + ' ' + url);
  };
  const run = () => publish({ appId: 'com.bass.fretboardhero', track, version: '1.1.0', code: '11', sha, bundle, notes: notes['bass-4'], request, matchesArchive, wait: async ms => { waits.push(ms); } });
  return { calls, waits, run };
}

test('submits a verified bundle and localized notes, then checks the target code and track', async () => {
  for (const track of ['internal', 'production']) {
    const api = play({ track });
    assert.deepEqual(await api.run(), { ok: true, message: 'Submitted · In review' });
    const write = api.calls.find(c => c.method === 'PUT');
    assert.equal(write.url, edit + '/tracks/' + track);
    assert.deepEqual(write.body.releases[0], { name, status: 'completed', versionCodes: ['11'], releaseNotes: notes['bass-4'] });
    assert(api.calls.some(c => c.method === 'POST' && c.url === commit));
    assert(!api.calls.some(c => c.method === 'DELETE'));
  }
});

test('an in-review retry can recognise the old source-specific label from its summary', async () => {
  const api = play({ before: [{ ...summary('IN_REVIEW'), releaseName: legacyName }] });
  assert.equal((await api.run()).ok, true);
  assert.deepEqual(api.calls.map(c => c.method), ['GET']);
});

test('waits for review after the commit and on a retry of the same pending release', async () => {
  const pending = [summary('NOT_SENT_FOR_REVIEW')];
  const after = read => read < 8 ? pending : [summary('IN_REVIEW')];
  for (const before of [[], pending]) {
    const api = play({ before, after, bundles: before.length ? [artifact] : [] });
    assert.deepEqual(await api.run(), {
      ok: true, message: (before.length ? 'Already submitted' : 'Submitted') + ' · In review'
    });
    assert(api.waits.length >= 7);
    if (before.length) {
      assert(!api.calls.some(c => c.method === 'PUT' || c.url.includes(':commit') || c.url.startsWith('/upload')));
      assert(api.calls.some(c => c.method === 'DELETE'));
    }
    else assert.equal(api.calls.filter(c => c.url.includes(':commit')).length, 1);
  }
});

test('reports a persistent manual action after the polling window', async () => {
  const api = play({ after: [summary('NOT_SENT_FOR_REVIEW')] });
  assert.deepEqual(await api.run(), { ok: false, message: 'Submitted · Action required — open Publishing overview and select Send for review' });
  assert.equal(api.waits.reduce((total, ms) => total + ms, 0), 15 * 60_000);
});

test('promotes the original internal bundle without uploading a timestamped rebuild', async () => {
  const api = play({ bundles: [{ ...artifact, sha256: 'previous-build-hash' }], tracks: [
    { track: 'internal', releases: [{ name: legacyName, versionCodes: ['11'], status: 'completed' }] }
  ] });
  assert.match((await api.run()).message, /existing Play bundle/);
  assert(!api.calls.some(c => c.url.startsWith('/upload')));
});

test('promotes a short-labelled rebuild only when the original signed archive matches Play', async () => {
  const setup = { bundles: [{ ...artifact, sha256: 'original-checksum' }], tracks: [
    { track: 'internal', releases: [{ name, versionCodes: ['11'], status: 'completed' }] }
  ] };
  const verified = play({ ...setup, matchesArchive: digest => digest === 'original-checksum' });
  assert.match((await verified.run()).message, /existing Play bundle/);
  assert(!verified.calls.some(c => c.url.startsWith('/upload')));
  const collision = play({ ...setup, before: [summary('IN_REVIEW')] });
  await assert.rejects(collision.run(), /another build/);
  assert(!collision.calls.some(c => c.method === 'PUT' || c.url.includes(':commit')));
});

test('verifies the exact signed AAB from a matching earlier main run', () => {
  const record = { main: true, run: '41', sha, name: '1.1.0', code: 11, instrument: 'all' };
  const env = {
    GITHUB_RUN_ID: '42', GITHUB_SHA: sha, GITHUB_REPOSITORY: 'jeffaya/fretboard-hero',
    VERSION_CODE: '11', VERSION_NAME: '1.1.0', BUILD_INSTRUMENT: 'bass-4',
    BUILD_HISTORY: JSON.stringify([{ ...record, sha: 'b'.repeat(40) }, { ...record, main: false },
      { ...record, instrument: 'guitar' }, { ...record, run: '42' }, record])
  };
  const files = [];
  const name = 'fretboard-hero-android-all-1.1.0-11';
  const gh = args => {
    if (args[0] === 'api') {
      assert.equal(args[1], 'repos/jeffaya/fretboard-hero/actions/runs/41/artifacts?name=' + name);
      return JSON.stringify({ artifacts: [{ name, expired: false }] });
    }
    assert.deepEqual(args.slice(0, -1), ['run', 'download', '41', '-R', env.GITHUB_REPOSITORY, '-n', name, '-D']);
    const file = path.join(args.at(-1), 'fretboard-hero-bass-4-store-release.aab');
    fs.writeFileSync(file, bundle);
    files.push(file);
  };
  assert(matchesArchivedBundle(env, artifact.sha256, gh));
  assert.equal(matchesArchivedBundle(env, 'different', gh), false);
  assert.equal(files.length, 2);
  assert(files.every(file => !fs.existsSync(file)));
});

test('rejects code reuse, a newer target, and unexpected upload metadata before committing', async () => {
  for (const options of [
    { bundles: [{ ...artifact, sha256: 'different' }] },
    { tracks: [{ track: 'production', releases: [{ versionCodes: ['12'] }] }] },
    { uploaded: { ...artifact, versionCode: 12 } }
  ]) {
    const api = play(options);
    await assert.rejects(api.run());
    assert(!api.calls.some(c => c.method === 'PUT' || c.url.includes(':commit')));
    assert.equal(api.calls.at(-1).method, 'DELETE');
  }
});

test('reports manual review only when Play explicitly requests it, and keeps an ongoing review', async () => {
  const manual = play({ commitError: 'Please set the query parameter changesNotSentForReview to true.' });
  assert.deepEqual(await manual.run(), { ok: false, message: 'Saved — open Publishing overview and select Send for review' });
  assert.equal(manual.waits.length, 0);
  assert(manual.calls.at(-1).url.endsWith('changesNotSentForReview=true'));
  const busy = play({ commitError: 'You already have changes in review.' });
  await assert.rejects(busy.run(), /already have changes/);
  assert(!busy.calls.some(c => c.url.includes('changesNotSentForReview=true')));
});

test('reports actionable, available and unconfirmed states without confusing other version codes', async () => {
  for (const [state, ok] of [['NOT_APPROVED', false], ['NOT_SENT_FOR_REVIEW', false], ['APPROVED_NOT_PUBLISHED', true], ['PUBLISHED', true]]) {
    const api = play({ after: [summary(state)] });
    assert.equal((await api.run()).ok, ok);
  }
  const other = { ...summary('PUBLISHED'), activeArtifacts: [{ versionCode: 10 }] };
  const api = play({ after: [other] });
  assert.match((await api.run()).message, /not confirmed/);
});
