const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const rules = require('../google-play/requirements.json');
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../google-play/guitar/en-US');
const report = {
  schemaVersion: 2, generatedAt: new Date().toISOString(), status: 'pending',
  instrument: path.basename(path.dirname(out)), locale: path.basename(out),
  requirements: path.relative(out, path.resolve(__dirname, '../google-play/requirements.json')).split(path.sep).join('/'),
  scope: 'Measured current upload files only; source artwork and the previous validation.json are not inputs.',
  text: [], groups: [], assets: [], errors: [], warnings: [], xrStatus: 'Draft only; no XR runtime validation'
};
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ratioMatches = (w, h, ratios) => ratios.some(([a, b]) => w * b === h * a);
async function checkImage(file, rule, draft = false) {
  const asset = { file, status: 'failed', errors: [] };
  try {
    const data = fs.readFileSync(path.join(out, file));
    const m = await sharp(data, { failOn: 'warning' }).metadata();
    await sharp(data, { failOn: 'warning' }).stats(); // Decode the complete image, not just its header.
    Object.assign(asset, { width: m.width, height: m.height, bytes: data.length, format: m.format,
      alpha: m.hasAlpha, channels: m.channels, depth: m.depth, sha256: digest(data) });
    if (!rule.formats.includes(m.format)) asset.errors.push('Unsupported image format');
    if (data.length > rule.maxBytes) asset.errors.push(`File exceeds ${rule.maxBytes} bytes`);
    if (m.hasAlpha !== rule.alpha) asset.errors.push(`Alpha must be ${rule.alpha}`);
    if (m.depth !== 'uchar' || m.channels !== (rule.alpha ? 4 : 3)) asset.errors.push(`Expected 8-bit ${rule.alpha ? 'RGBA' : 'RGB'} pixels`);
    if (rule.dimensions && (m.width !== rule.dimensions[0] || m.height !== rule.dimensions[1])) asset.errors.push(`Expected ${rule.dimensions.join(' x ')}`);
    if (rule.minEdge && Math.min(m.width, m.height) < rule.minEdge) asset.errors.push('Image is too small');
    if (rule.maxEdge && Math.max(m.width, m.height) > rule.maxEdge) asset.errors.push('Image is too large');
    if (rule.ratios && !ratioMatches(m.width, m.height, rule.ratios)) asset.errors.push('Unsupported aspect ratio');
    const namedSize = /-(\d+)x(\d+)\.[^.]+$/.exec(file);
    if (namedSize && (Number(namedSize[1]) !== m.width || Number(namedSize[2]) !== m.height)) asset.errors.push('Filename dimensions do not match actual pixels');
    if (draft) {
      const xr = rules.xrHelp;
      asset.matchesPublishedXRDimensions = ratioMatches(m.width, m.height, [xr.ratio]) && m.width >= xr.minimum[0] && m.height >= xr.minimum[1] && data.length <= xr.maxBytes;
    }
    if (!asset.errors.length) asset.status = draft ? 'draft' : 'ready-for-review';
  } catch (error) { asset.errors.push(error.message); }
  report.errors.push(...asset.errors.map(error => `${file}: ${error}`));
  report.assets.push(asset);
}
async function main() {
  if (!fs.statSync(out).isDirectory()) throw new Error('Listing directory does not exist');
  for (const [file, limit] of Object.entries(rules.textLimits)) {
    try {
      let source = file;
      let bytes;
      if (fs.existsSync(path.join(out, file))) {
        bytes = fs.readFileSync(path.join(out, file));
      } else {
        // Listing copy may live exclusively in README after removing the .txt duplicates.
        const readme = fs.readFileSync(path.join(out, 'README.md'), 'utf8');
        const sections = { 'title.txt': "Nom de l'application", 'short-description.txt': 'Brève description', 'full-description.txt': 'Description complète' };
        const title = sections[file];
        const section = readme.split(/^### /m).find(part => part.startsWith(title + ' —'));
        const match = section && /```text\r?\n([\s\S]*?)\r?\n```/.exec(section);
        if (!match) throw new Error(`Missing ${file} and its README copy block`);
        source = 'README.md';
        bytes = Buffer.from(match[1], 'utf8');
      }
      const characters = [...bytes.toString('utf8').trimEnd()].length;
      const valid = characters > 0 && characters <= limit;
      report.text.push({ file: source, field: file, characters, limit, contentSha256: digest(bytes), status: valid ? 'passed' : 'failed' });
      if (!valid) report.errors.push(`${file}: expected 1–${limit} characters`);
    } catch (error) { report.errors.push(`${file}: ${error.message}`); }
  }
  for (const [file, rule] of Object.entries(rules.commonAssets)) await checkImage(file, rule);
  const expectedIcons = new Set(Object.keys(rules.commonAssets));
  if (fs.existsSync(path.join(out, 'icon'))) {
    for (const name of fs.readdirSync(path.join(out, 'icon'))) {
      if (/\.(png|jpe?g|webp)$/i.test(name) && !expectedIcons.has(`icon/${name}`)) report.errors.push(`icon/${name}: no validation rule; classify the asset before uploading`);
    }
  }
  for (const [folder, rule] of Object.entries(rules.screenshotGroups)) {
    const full = path.join(out, folder);
    if (!fs.existsSync(full)) { if (rule.required) report.errors.push(`${folder}: required screenshot folder is missing`); continue; }
    const entries = fs.readdirSync(full, { withFileTypes: true });
    const files = entries.filter(entry => entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name)).map(entry => entry.name).sort();
    const nested = entries.filter(entry => entry.isDirectory());
    if (nested.length) report.errors.push(`${folder}: unexpected nested folders: ${nested.map(entry => entry.name).join(', ')}`);
    report.groups.push({ folder, count: files.length, minCount: rule.minCount, maxCount: rule.maxCount, draft: !!rule.draft });
    if (files.length < rule.minCount || files.length > rule.maxCount) report.errors.push(`${folder}: expected ${rule.minCount}–${rule.maxCount} images, found ${files.length}`);
    for (const file of files) await checkImage(`${folder}/${file}`, rule, rule.draft);
    if (rule.recommendedMinCount && files.length < rule.recommendedMinCount) report.warnings.push(`${folder}: at least ${rule.recommendedMinCount} screenshots are recommended for promotion`);
  }
  try {
    const alt = JSON.parse(fs.readFileSync(path.join(out, 'alt-text.json'), 'utf8'));
    for (const [id, text] of Object.entries(alt)) if (typeof text !== 'string' || [...text].length > 140) report.errors.push(`${id}: invalid alt text or more than 140 characters`);
  } catch (error) { report.errors.push(`alt-text.json: ${error.message}`); }
  const xrAssets = report.assets.filter(asset => asset.file.startsWith('android-xr/'));
  if (xrAssets.length) {
    report.warnings.push('Android XR files are 2D drafts; headset/emulator compatibility remains unverified.');
    if (xrAssets.some(asset => !asset.matchesPublishedXRDimensions)) report.warnings.push('Current XR dimensions follow the photographed console, but not the published 8:5 XR guidance. Confirm the target before upload.');
  }
  report.status = report.errors.length ? 'failed' : report.warnings.length ? 'passed-with-warnings' : 'passed';
  report.summary = { images: report.assets.length, readyForReview: report.assets.filter(a => a.status === 'ready-for-review').length,
    drafts: report.assets.filter(a => a.status === 'draft').length, errors: report.errors.length, warnings: report.warnings.length };
  // Replace stale reports even on failure, so old success cannot survive a changed file.
  const target = path.join(out, 'validation.json');
  fs.writeFileSync(target + '.tmp', JSON.stringify(report, null, 2) + '\n');
  fs.renameSync(target + '.tmp', target);
  console.log(JSON.stringify({ status: report.status, ...report.summary, errors: report.errors, warnings: report.warnings }, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
