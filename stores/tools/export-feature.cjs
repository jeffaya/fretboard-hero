const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const rules = require('../google-play/requirements.json');
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../google-play/guitar/en-US');
const instrument = path.basename(path.dirname(out));
const locale = path.basename(out);
const file = 'icon/feature-graphic-1024x500.png';
(async () => {
  if (!['guitar', 'bass', 'ukulele'].includes(instrument)) throw new Error(`No shared OG asset for instrument: ${instrument}`);
  const localizedMaster = path.join(out, 'source/feature-master-fr.png');
  const input = locale === 'fr-FR' ? localizedMaster : path.resolve(__dirname, '../../web/assets/instruments', instrument, 'og.png');
  // Localized store banners must not overwrite the website's shared English OG image.
  const bytes = locale === 'fr-FR'
    ? await sharp(input).resize(...rules.commonAssets[file].dimensions, { fit: 'cover', position: 'centre' })
      .toColourspace('srgb').removeAlpha().png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
    : fs.readFileSync(input);
  const m = await sharp(bytes, { failOn: 'warning' }).metadata();
  const rule = rules.commonAssets[file];
  if (m.width !== rule.dimensions[0] || m.height !== rule.dimensions[1] || m.format !== 'png' || m.hasAlpha || m.channels !== 3 || m.depth !== 'uchar' || bytes.length > rule.maxBytes) {
    throw new Error('Feature image must be an opaque RGB PNG, 1024 x 500, within the feature graphic size limit.');
  }
  await sharp(bytes, { failOn: 'warning' }).stats();
  const output = path.join(out, file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output + '.tmp', bytes);
  fs.renameSync(output + '.tmp', output);
  console.log(JSON.stringify({ instrument, file: path.relative(path.resolve(__dirname, '../..'), output), width: m.width, height: m.height, bytes: bytes.length, copiedFrom: path.relative(path.resolve(__dirname, '../..'), input) }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
