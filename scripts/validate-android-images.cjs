// Decode the pixels, not just the header: truncated PNGs can have valid metadata.
// Resolve Sharp from the app's installed asset generator (no extra dependency).
const fs = require('node:fs/promises');
const path = require('node:path');
const { createRequire } = require('node:module');

async function validateImages(inputs) {
  const appRequire = createRequire(path.join(__dirname, '../app/package.json'));
  let sharp;
  try {
    sharp = createRequire(appRequire.resolve('@capacitor/assets'))('sharp');
  } catch {
    throw new Error('Android asset dependencies are missing. Run npm ci in app/ first.');
  }

  async function collect(input) {
    const stat = await fs.stat(input);
    if (!stat.isDirectory()) return [input];
    const entries = await fs.readdir(input, { withFileTypes: true });
    const files = await Promise.all(entries
      .filter(entry => entry.isDirectory() || entry.name.endsWith('.png'))
      .map(entry => collect(path.join(input, entry.name))));
    return files.flat();
  }

  const files = (await Promise.all(inputs.map(collect))).flat();
  if (!files.length) throw new Error('No Android images found to validate.');
  for (const file of files) {
    try {
      await sharp(file, { failOn: 'warning' }).raw().toBuffer();
    } catch (error) {
      throw new Error(`Invalid Android image: ${file}\n${error.message}`);
    }
  }
  return files.length;
}

module.exports = { validateImages };
if (require.main === module) {
  validateImages(process.argv.slice(2))
    .then(count => console.log(`Validated ${count} Android image(s).`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
