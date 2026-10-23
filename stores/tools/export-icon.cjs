const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { instrument, out } = require('./listing.cjs');

(async () => {
  const input = path.resolve(__dirname, '../../web/assets/instruments', instrument, 'icon-512.png');
  const metadata = await sharp(input).metadata();
  if (metadata.width !== 512 || metadata.height !== 512) throw new Error('Expected the existing 512 × 512 instrument icon');
  // Keep the existing artwork and opaque background; the store profile expects
  // an explicit alpha channel, including when every alpha value is 255.
  const bytes = await sharp(input).toColourspace('srgb').ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
  const file = path.join(out, 'icon/app-icon-512x512.png');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  console.log(`Exported ${instrument} store icon as 512 × 512 RGBA PNG`);
})().catch(error => { console.error(error); process.exitCode = 1; });
