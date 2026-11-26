const fs = require('node:fs');
const instruments = require('../../app/instruments.json');

const maxCode = 2100000000;
const title = /^Generate Android App · (all|guitar|bass-4|ukulele) · versionName (\S+) · versionCode (\d+)(?: ·|$)/;
const job = /^Build (all|guitar|bass-4|ukulele) · versionName (\S+) · versionCode (\d+)$/;

async function* pages(get, path, key) {
  for (let page = 1; ; page++) {
    const rows = (await get(path + (path.includes('?') ? '&' : '?') + 'per_page=100&page=' + page))[key];
    yield* rows;
    if (rows.length < 100) return;
  }
}

async function buildHistory(get, currentId, branch = 'main') {
  const records = [];
  const runs = pages(get, '/actions/workflows/generate-android-app.yml/runs?event=workflow_dispatch&branch=' + encodeURIComponent(branch), 'workflow_runs');
  for await (const run of runs) {
    const sameRun = String(run.id) === currentId;
    if (!sameRun && run.status !== 'completed') continue;
    let match = title.exec(run.display_title);
    if (sameRun || !match || match[2] === 'auto' || run.conclusion !== 'success') {
      match = null;
      for await (const item of pages(get, '/actions/runs/' + run.id + '/jobs?filter=all', 'jobs')) {
        if (item.conclusion !== 'success') continue;
        match = job.exec(item.name) || (item.name === 'build' && title.exec(run.display_title));
        if (match) break;
      }
    }
    if (match) records.push({ instrument: match[1], name: match[2], code: Number(match[3]), sha: run.head_sha, run: String(run.id), main: run.head_branch === 'main' });
  }
  return records;
}

function resolveVersion(rawCode, rawName, history) {
  if (!rawCode && !history.length) throw Error('No previous Android build found. Enter the first version code.');
  const code = rawCode || String(Math.max(...history.map(entry => entry.code)) + 1);
  if (!/^[1-9]\d{0,9}$/.test(code) || Number(code) > maxCode) throw Error('Invalid Android version code: ' + code);
  const digits = code.padStart(2, '0');
  const major = digits.slice(0, -2) || '1';
  const name = rawName || [major, digits.at(-2), digits.at(-1)].join('.');
  if (!/^[0-9]+\.[0-9]+(?:\.[0-9]+)?(?:[.-][A-Za-z0-9]+)*$/.test(name)) throw Error('Invalid public version name: ' + name);
  return { code, name };
}

async function main() {
  const env = process.env;
  const get = async path => {
    const res = await fetch(env.GITHUB_API_URL + '/repos/' + env.GITHUB_REPOSITORY + path, {
      headers: { Authorization: 'Bearer ' + env.GH_TOKEN }, signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) throw Error('GitHub build history: ' + res.status + ' ' + path);
    return res.json();
  };
  const history = await buildHistory(get, env.GITHUB_RUN_ID);
  // A branch-only build may use the same counter without advancing production.
  if (env.GITHUB_REF_TYPE === 'branch' && env.GITHUB_REF_NAME !== 'main') {
    history.push(...await buildHistory(get, env.GITHUB_RUN_ID, env.GITHUB_REF_NAME));
  }
  const previousAttempt = history.find(b => b.run === env.GITHUB_RUN_ID);
  const { code, name } = previousAttempt || resolveVersion(env.VERSION_CODE, env.VERSION_NAME, history);
  const ids = env.BUILD_INSTRUMENT === 'all' ? Object.keys(instruments) : [env.BUILD_INSTRUMENT];
  const include = ids.map(id => {
    if (!Object.hasOwn(instruments, id)) throw Error('Unknown instrument: ' + id);
    return { instrument: id, environment: 'google-play-' + instruments[id].iconKey };
  });
  if (env.PLAY_TRACK !== 'build-only' && env.GITHUB_REF !== 'refs/heads/main') throw Error('Select main to publish to Google Play.');
  fs.appendFileSync(env.GITHUB_OUTPUT, [
    'code=' + code, 'name=' + name, 'matrix=' + JSON.stringify({ include }), 'history=' + JSON.stringify(history), ''
  ].join('\n'));
  fs.appendFileSync(env.GITHUB_STEP_SUMMARY, 'Android **' + name + '** · versionCode **' + code + '**\n');
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { buildHistory, resolveVersion };
