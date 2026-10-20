const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
const repo = path.resolve(__dirname, '../..');
const dimensions = require('../google-play/requirements.json').commonAssets['icon/feature-graphic-1024x500.png'].dimensions;
(async () => {
  for (const instrument of ['guitar', 'bass', 'ukulele']) {
    const source = path.join(repo, 'tools/assets/og', `${instrument}.jpg`);
    const destination = path.join(repo, 'web/assets/instruments', instrument);
    // Crop only the decorative top/bottom margins; preserve proportions and all six cards.
    const pixels = await sharp(source).resize(...dimensions, { fit: 'cover', position: 'centre' })
      .toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const image = () => sharp(pixels.data, { raw: pixels.info });
    await image().png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toFile(path.join(destination, 'og.png'));
    // Lightweight JPEG for social previews; PNG remains the Google Play source.
    await image().jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toFile(path.join(destination, 'og.jpg'));
    execFileSync(process.execPath, [path.join(__dirname, 'export-feature.cjs'), path.join(repo, 'stores/google-play', instrument, 'en-US')], { stdio: 'inherit' });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
