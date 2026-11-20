const fs = require('node:fs');
const path = require('node:path');
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

async function publish({ appId, track, version, code, sha, bundle, notes, request, wait = delay }) {
  if (!['internal', 'production'].includes(track)) throw Error('Expected an internal or production track');
  if (!/^[1-9]\d*$/.test(code) || Number(code) > 2100000000) throw Error('Invalid version code');
  if (!/^[0-9a-f]{40}$/.test(sha)) throw Error('Missing build commit');
  const base = prefix + encodeURIComponent(appId);
  const name = version + ' (' + code + ') ' + sha;
  const digest = createHash('sha256').update(bundle).digest('hex');
  const hasCode = release => release.versionCodes?.some(c => String(c) === code);
  const matchesBundle = item => String(item?.versionCode) === code && item.sha256 === digest;
  const release = { name, status: 'completed', versionCodes: [code], releaseNotes: notes };
  const lifecycle = async () => {
    const { releases = [] } = await request('GET', base + '/tracks/' + track + '/releases');
    return releases.find(r => r.activeArtifacts?.some(a => String(a.versionCode) === code));
  };
  const stateOf = summary => states[summary?.releaseLifecycleState?.replace(/^RELEASE_LIFECYCLE_STATE_/, '')];
  // Pending edits may not appear in the editable track snapshot yet.
  const previous = await lifecycle();
  const previousState = stateOf(previous);
  if (previous?.releaseName === name && previousState && !previous.releaseLifecycleState.endsWith('_DRAFT')) {
    return { message: 'Already submitted · ' + previousState[0], ok: previousState[1] };
  }
  const edit = await request('POST', base + '/edits', {});
  const editPath = base + '/edits/' + encodeURIComponent(edit.id);
  let committed = false;
  let operation = 'Submitted';
  try {
    const { tracks = [] } = await request('GET', editPath + '/tracks');
    const target = tracks.find(t => t.track === track)?.releases || [];
    if (target.some(r => r.versionCodes?.some(c => Number(c) > Number(code)))) {
      throw Error('The selected track already contains a newer version code.');
    }
    const { bundles = [] } = await request('GET', editPath + '/bundles');
    const existing = bundles.find(b => String(b.versionCode) === code);
    // Signed rebuilds can differ byte-for-byte. A previous release made by this
    // workflow records the exact source commit, version name and code in its name.
    const sameBuild = tracks.some(t => t.releases?.some(r => r.name === name && hasCode(r)));
    if (existing && !matchesBundle(existing) && !sameBuild) {
      throw Error('This version code belongs to another build. Choose a higher code or use the original signed bundle.');
    }
    if (target.some(r => r.status === 'completed' && hasCode(r)) && (sameBuild || matchesBundle(existing))) {
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

  // The commit response is an AppEdit, not a publication status. Read Google's
  // lifecycle for this version code on this track. Approval may take days.
  let lastReadError;
  for (const pause of [0, 2000, 5000, 10000]) {
    if (pause) await wait(pause);
    try {
      const state = stateOf(await lifecycle());
      if (state) return { message: operation + ' · ' + state[0], ok: state[1] };
    } catch (error) {
      lastReadError = error.message;
    }
  }
  if (lastReadError) console.warn('Lifecycle lookup:', lastReadError);
  return { message: operation + ' · Google has not confirmed the lifecycle yet. Check Publishing overview or rerun this instrument.', ok: false };
}

async function main() {
  const env = process.env;
  const instrument = env.BUILD_INSTRUMENT;
  if (!Object.hasOwn(instruments, instrument)) throw Error('Select one instrument to publish');
  const appId = instruments[instrument].appId;
  const notes = readNotes(env.VERSION_NAME, instrument)[instrument];
  let result;
  try {
    if (!env.PLAY_ACCESS_TOKEN) throw Error('Missing Google Play access token');
    const bundle = fs.readFileSync(path.join('dist', 'fretboard-hero-' + instrument + '-store-release.aab'));
    result = await publish({ appId, track: env.PLAY_TRACK, version: env.VERSION_NAME, code: env.VERSION_CODE,
      sha: env.GITHUB_SHA, bundle, notes, request: playClient(env.PLAY_ACCESS_TOKEN) });
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
module.exports = { publish };
