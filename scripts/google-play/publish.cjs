const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const instruments = require('../../app/instruments.json');
const { readNotes } = require('./notes.cjs');

const api = 'https://androidpublisher.googleapis.com';
const prefix = '/androidpublisher/v3/applications/';
const states = {
  DRAFT: ['Draft in Play Console', false],
  NOT_SENT_FOR_REVIEW: ['Action required — open Publishing overview and select Send for review', false],
  IN_REVIEW: ['In review', true],
  APPROVED_NOT_PUBLISHED: ['Approved — open Publishing overview to publish', true],
  NOT_APPROVED: ['Rejected — review the decision in Play Console', false],
  PUBLISHED: ['Published on this track', true]
};

function playClient(token) {
  return async (method, endpoint, body) => {
    const binary = Buffer.isBuffer(body);
    const headers = { Authorization: 'Bearer ' + token };
    if (body !== undefined) headers['Content-Type'] = binary ? 'application/octet-stream' : 'application/json';
    const response = await fetch(api + endpoint, {
      method, headers, body: binary ? body : JSON.stringify(body),
      redirect: 'error', signal: AbortSignal.timeout(binary ? 600_000 : 60_000)
    });
    const text = await response.text();
    if (!response.ok) {
      let message;
      try { message = JSON.parse(text).error.message; } catch { /* Some upload errors have no JSON body. */ }
      throw Error('Google Play HTTP ' + response.status + ': ' + (message || response.statusText));
    }
    return text ? JSON.parse(text) : {};
  };
}

function legacyReleaseName(sha, version, code) {
  const buildId = createHash('sha256').update([sha, version, code].join('/')).digest('hex').slice(0, 20);
  return (version + ' (' + code + ')').slice(0, 28) + ' @' + buildId;
}

function releaseName(version, code) {
  return code + ' (' + version.slice(0, 50 - String(code).length - 3) + ')';
}

function matchesArchivedBundle(env, digest, gh = args => execFileSync('gh', args, { encoding: 'utf8' })) {
  // Signing a rebuild can change its bytes. Compare Play's digest to an original
  // signed bundle from the same workflow, source commit, instrument and version.
  const history = JSON.parse(env.BUILD_HISTORY || '[]');
  const builds = history.filter(b => b.main && b.run !== env.GITHUB_RUN_ID && b.sha === env.GITHUB_SHA &&
    b.name === env.VERSION_NAME && String(b.code) === env.VERSION_CODE &&
    (b.instrument === 'all' || b.instrument === env.BUILD_INSTRUMENT));
  for (const b of builds) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'play-bundle-'));
    try {
      const artifact = 'fretboard-hero-android-' + b.instrument + '-' + b.name + '-' + b.code;
      const endpoint = 'repos/' + env.GITHUB_REPOSITORY + '/actions/runs/' + b.run + '/artifacts?name=' + encodeURIComponent(artifact);
      const { artifacts } = JSON.parse(gh(['api', endpoint]));
      if (!artifacts.some(a => a.name === artifact && !a.expired)) continue;
      gh(['run', 'download', b.run, '-R', env.GITHUB_REPOSITORY, '-n', artifact, '-D', directory]);
      const file = path.join(directory, 'fretboard-hero-' + env.BUILD_INSTRUMENT + '-store-release.aab');
      if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') === digest) return true;
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
  return false;
}

async function publish({ appId, track, version, code, sha, bundle, notes, request, wait = delay, matchesArchive = () => false }) {
  if (!['internal', 'production'].includes(track)) throw Error('Expected an internal or production track');
  if (!/^[1-9]\d*$/.test(code) || Number(code) > 2100000000) throw Error('Invalid version code');
  if (!/^[0-9a-f]{40}$/.test(sha)) throw Error('Missing build commit');
  const base = prefix + encodeURIComponent(appId);
  const name = releaseName(version, code);
  const legacyName = legacyReleaseName(sha, version, code);
  const digest = createHash('sha256').update(bundle).digest('hex');
  const hasCode = release => release.versionCodes?.some(c => String(c) === code);
  const matchesBundle = item => String(item?.versionCode) === code && item.sha256 === digest;
  const release = { name, status: 'completed', versionCodes: [code], releaseNotes: notes };
  const lifecycle = async () => {
    const { releases = [] } = await request('GET', base + '/tracks/' + track + '/releases');
    return releases.find(r => r.activeArtifacts?.some(a => String(a.versionCode) === code));
  };
  const stateOf = summary => summary?.releaseLifecycleState?.replace(/^RELEASE_LIFECYCLE_STATE_/, '');
  async function confirmStatus(operation, firstSummary) {
    const intervalMs = 30_000;
    const maxWaitMs = 15 * 60_000;
    let lastReadError;
    for (let elapsed = 0; elapsed <= maxWaitMs; elapsed += intervalMs) {
      if (elapsed) await wait(intervalMs);
      let summary;
      try {
        summary = elapsed === 0 && firstSummary ? firstSummary : await lifecycle();
      } catch (error) {
        lastReadError = error.message;
        continue;
      }
      const state = stateOf(summary);
      if (!states[state]) continue;
      // Play can report NOT_SENT_FOR_REVIEW immediately after accepting the edit.
      if (state === 'NOT_SENT_FOR_REVIEW' && elapsed < maxWaitMs) {
        if (elapsed === 0) console.log('Waiting for Google Play to confirm review for ' + appId + ' (' + code + ').');
        continue;
      }
      const [message, ok] = states[state];
      return { message: operation + ' · ' + message, ok };
    }
    if (lastReadError) console.warn('Lifecycle lookup:', lastReadError);
    return { message: operation + ' · Google has not confirmed the lifecycle yet. Check Publishing overview or rerun this instrument.', ok: false };
  }
  // Pending edits may not appear in the editable track snapshot yet.
  const previous = await lifecycle();
  const previousState = stateOf(previous);
  const previouslySubmitted = states[previousState] && previousState !== 'DRAFT';
  if (previous?.releaseName === legacyName && previouslySubmitted) {
    return confirmStatus('Already submitted', previous);
  }
  const edit = await request('POST', base + '/edits', {});
  const editPath = base + '/edits/' + encodeURIComponent(edit.id);
  let committed = false;
  let operation = 'Submitted';
  let verifiedSummary;
  try {
    const { tracks = [] } = await request('GET', editPath + '/tracks');
    const target = tracks.find(t => t.track === track)?.releases || [];
    if (target.some(r => r.versionCodes?.some(c => Number(c) > Number(code)))) {
      throw Error('The selected track already contains a newer version code.');
    }
    const { bundles = [] } = await request('GET', editPath + '/bundles');
    const existing = bundles.find(b => String(b.versionCode) === code);
    const legacyBuild = tracks.some(t => t.releases?.some(r => r.name === legacyName && hasCode(r)));
    if (existing && !matchesBundle(existing) && !legacyBuild && !matchesArchive(existing.sha256)) {
      throw Error('This version code belongs to another build. Choose a higher code or use the original signed bundle.');
    }
    if (previous?.releaseName === name && previouslySubmitted) {
      if (!existing) throw Error('Cannot verify the bundle for the existing Play release. Retry this instrument.');
      operation = 'Already submitted';
      verifiedSummary = previous;
    } else if (target.some(r => r.status === 'completed' && hasCode(r)) && (legacyBuild || existing)) {
      operation = 'Already on this track';
    } else {
      if (!existing) {
        const uploaded = await request('POST', '/upload' + editPath + '/bundles?uploadType=media', bundle);
        if (!matchesBundle(uploaded)) throw Error('Google Play returned a different version code or SHA-256 for the uploaded AAB.');
      } else {
        operation = 'Submitted using the existing Play bundle';
      }
      await request('PUT', editPath + '/tracks/' + track, { track, releases: [release] });
      const commit = editPath + ':commit?changesInReviewBehavior=ERROR_IF_IN_REVIEW';
      try {
        await request('POST', commit);
      } catch (error) {
        // Google can require a console submission after a rejected release.
        if (!/changesNotSentForReview.{0,40}true/i.test(error.message)) throw error;
        await request('POST', commit + '&changesNotSentForReview=true');
        committed = true;
        return { message: 'Saved — open Publishing overview and select Send for review', ok: false };
      }
      committed = true;
    }
  } finally {
    if (!committed) {
      await request('DELETE', editPath).catch(e => console.warn('Could not discard edit:', e.message));
    }
  }

  return confirmStatus(operation, verifiedSummary);
}

async function main() {
  const env = process.env;
  const instrument = env.BUILD_INSTRUMENT;
  if (!Object.hasOwn(instruments, instrument)) throw Error('Select one instrument to publish');
  const appId = instruments[instrument].appId;
  const notes = readNotes(env.VERSION_NAME, instrument, path.join('dist', 'release-notes'))[instrument];
  let result;
  try {
    if (!env.PLAY_ACCESS_TOKEN) throw Error('Missing Google Play access token');
    const bundle = fs.readFileSync(path.join('dist', 'fretboard-hero-' + instrument + '-store-release.aab'));
    result = await publish({ appId, track: env.PLAY_TRACK, version: env.VERSION_NAME, code: env.VERSION_CODE,
      sha: env.GITHUB_SHA, bundle, notes, request: playClient(env.PLAY_ACCESS_TOKEN),
      matchesArchive: digest => matchesArchivedBundle(env, digest) });
  } catch (error) {
    result = { ok: false, message: error.message };
  }
  const message = result.message.replace(/[\r\n]+/g, ' ');
  console.log(appId + ' · ' + env.PLAY_TRACK + ' · ' + message);
  if (env.GITHUB_STEP_SUMMARY) {
    const escaped = message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY, '### ' + instruments[instrument].name + '\n\n' +
      'Package `' + appId + '` · Track `' + env.PLAY_TRACK + '` · Version `' + env.VERSION_NAME + ' (' + env.VERSION_CODE + ')`\n\n' + escaped + '\n');
  }
  if (!result.ok) process.exitCode = 1;
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { publish, playClient, releaseName, legacyReleaseName, matchesArchivedBundle };
