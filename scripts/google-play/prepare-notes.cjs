const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const instruments = require('../../app/instruments.json');
const { readNotes, locales, notesDir } = require('./notes.cjs');
const { playClient, releaseName } = require('./publish.cjs');
const wording = require('./release-wording.json');

function productionBuild(releases, history, instrument) {
  const published = releases.filter(r => r.releaseLifecycleState === 'RELEASE_LIFECYCLE_STATE_PUBLISHED');
  const code = Math.max(...published.flatMap(r => (r.activeArtifacts || []).map(a => Number(a.versionCode))));
  if (!Number.isFinite(code)) throw Error('No published production baseline. Supply reviewed notes for the first release.');
  const candidates = history.filter(b => b.main && b.code === code && (b.instrument === 'all' || b.instrument === instrument));
  const release = published.find(r => r.activeArtifacts?.some(a => Number(a.versionCode) === code));
  // Manually uploaded releases predate the workflow label. Only accept an unambiguous build.
  const builds = / @[0-9a-f]{20}$/.test(release.releaseName)
    ? candidates.filter(b => releaseName(b.sha, b.name, b.code) === release.releaseName)
    : candidates;
  const shas = new Set(builds.map(build => build.sha));
  if (shas.size !== 1) throw Error('Cannot match the published production code ' + code + ' to one build. Supply reviewed notes for this version.');
  return [...shas][0];
}

const features = [
  [/^web\/(core\/routine-|routine\.css)/, 'Daily Routine'],
  [/^(scripts\/lessons\/|web\/(core\/(guide-|lesson-|music-theory)|guide\.js|[^/]+\/(guitar|bass|ukulele)\/))/, 'Music theory'],
  [/^web\/(modes\/chords|core\/chord-)/, 'Chords'],
  [/^web\/(modes\/arpeggios|core\/arpeggio-)/, 'Arpeggios'],
  [/^web\/(modes\/triads|core\/triad-)/, 'Triads'],
  [/^web\/(modes\/pentatonic|core\/pentatonic-)/, 'Pentatonic'],
  [/^web\/(quiz\.|core\/quiz-)/, 'Quiz'],
  [/^web\/(tuner\.|core\/tuning\.)/, 'Tuner'],
  [/^web\/(circle\.|core\/circle-)/, 'Circle of Fifths'],
  [/^web\/(fretboard\.|core\/fretboard-)/, 'Fretboard'],
  [/^web\/core\/(microphone|pitch-detector)\./, 'Microphone'],
  [/^web\/(locales\/|core\/i18n\.)/, 'Language'],
  [/^web\/(home[.]|index[.]html|core\/navigation[.])/, '{name} home'],
  [/^web\/(premium[.]|core\/(native-billing|access)[.])/, 'Unlock full access'],
  [/^web\/(instruments|products)\//, 'Learn']
];

function generateNotes(version, files, instrument) {
  const slug = instruments[instrument].iconKey;
  const relevant = files.filter(file => {
    const page = /^web\/[^/]+\/(guitar|bass|ukulele)\//.exec(file);
    const profile = /^web\/(?:instruments|products)\/(guitar|bass(?:-4)?|ukulele)(?:[.]js|-fretboard-hero[.]js)$/.exec(file);
    return (!page || page[1] === slug) && (!profile || [instrument, slug].includes(profile[1]));
  });
  const changed = features.filter(([pattern]) => relevant.some(file => pattern.test(file))).map(([, label]) => label);
  return Object.fromEntries(locales.map(locale => {
    const language = { 'pt-BR': 'pt-BR', 'zh-CN': 'zh-CN' }[locale] || locale.split('-')[0];
    const labels = require('../../web/locales/' + language + '.json');
    const { updated, release } = wording[locale];
    if (changed.some(key => !labels[key])) throw Error('Missing feature translation for ' + locale);
    const lines = changed.map(key => '- ' + labels[key].replace('{name}', 'Fretboard Hero'));
    const body = lines.length ? [updated, ...lines].join('\n') : release;
    return [locale, body.replace('{version}', version)];
  }));
}

function prepare({ version, instrument, baseline, head, directory, changes }) {
  const source = path.join(notesDir, version + '.json');
  let translated;
  if (fs.existsSync(source)) {
    const reviewed = readNotes(version, instrument);
    translated = Object.fromEntries(reviewed[instrument].map(note => [note.language, note.text]));
  } else {
    translated = generateNotes(version, changes(baseline, head), instrument);
  }
  const data = { [instrument]: translated };
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, version + '.json'), JSON.stringify(data, null, 2) + '\n');
  return readNotes(version, instrument, directory)[instrument];
}

async function main() {
  const env = process.env;
  const version = env.VERSION_NAME;
  const instrument = env.BUILD_INSTRUMENT;
  const app = instruments[instrument];
  const history = JSON.parse(env.BUILD_HISTORY);
  let baseline;
  if (!fs.existsSync(path.join(notesDir, version + '.json'))) {
    if (env.PLAY_ACCESS_TOKEN) {
      const request = playClient(env.PLAY_ACCESS_TOKEN);
      const {releases = []} = await request('GET', '/androidpublisher/v3/applications/' + app.appId + '/tracks/production/releases');
      baseline = productionBuild(releases, history, instrument);
    } else {
      // Without Play credentials a preview can only compare against the most recent known main build.
      baseline = history.find(b => b.main && (b.instrument === instrument || b.instrument === 'all'))?.sha;
      if (!baseline) throw Error('No earlier Android build for preview release notes.');
    }
  }
  const rows = prepare({version, instrument, baseline, head: env.GITHUB_SHA, directory: path.join('dist','release-notes'),
    changes: (base, head) => execFileSync('git', ['diff', '--name-only', '-z', base, head, '--'], {encoding: 'utf8'}).split('\0')
  });
  const french = rows.find(row => row.language === 'fr-FR').text;
  fs.appendFileSync(env.GITHUB_STEP_SUMMARY, '### ' + app.name + ' ' + version + ' (' + env.VERSION_CODE + ')\n\n' + french + '\n\n' +
    (baseline ? 'Compared with commit `' + baseline + '`.' : 'Reviewed release notes from the repository.') + '\n');
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { productionBuild, generateNotes, prepare };
