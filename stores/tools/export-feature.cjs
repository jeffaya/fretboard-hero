const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const rules = require('../google-play/requirements.json');
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../google-play/guitar/en-US');
const file = 'icon/feature-graphic-1024x500.png';
const [width, height] = rules.commonAssets[file].dimensions;
(async () => {
  const output = path.join(out, file);
  const bytes = await sharp(path.join(out, 'source/feature-graphic-original.png')).rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#03051b' }).toColourspace('srgb').removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toBuffer();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output + '.tmp', bytes);
  fs.renameSync(output + '.tmp', output);
  console.log(JSON.stringify({ file: output, width, height, bytes: bytes.length, alpha: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
