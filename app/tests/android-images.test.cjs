const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { validateImages } = require('../../scripts/validate-android-images.cjs');

const root = path.resolve(__dirname, '../..');

test('all instrument icons fully decode', async () => {
  const icons = ['guitar', 'bass', 'ukulele'].map(key =>
    path.join(root, 'web/assets/instruments', key, 'icon-1024.png'));
  assert.equal(await validateImages(icons), 3);
});

test('rejects the truncated guitar PNG even though its header is valid', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'android-images-'));
  try {
    const source = await fs.readFile(path.join(root, 'web/assets/instruments/guitar/icon-1024.png'));
    const broken = path.join(temp, 'truncated.png');
    // The old file ended here, inside IDAT, with the full IHDR still intact.
    await fs.writeFile(broken, source.subarray(0, 589961));
    await assert.rejects(validateImages([broken]), /Invalid Android image/);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test('rejects empty generated resources before packaging', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'android-images-'));
  try {
    const density = path.join(temp, 'mipmap-hdpi');
    await fs.mkdir(density);
    await fs.writeFile(path.join(density, 'ic_launcher_foreground.png'), '');
    await assert.rejects(validateImages([temp]), /Invalid Android image/);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});
