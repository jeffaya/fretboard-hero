"""Rebuild web icons from approved per-instrument sources (requires Pillow).
Usage: python tools/generate-instrument-icons.py [guitar|bass|ukulele]
The optional argument also refreshes checked-in native launcher resources.
Android release builds regenerate launchers from icon-1024.png via Capacitor.
"""
from pathlib import Path
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SIZES = [16, 32, 48, 64, 96, 128, 144, 152, 180, 192, 256, 384, 512]

def scaled(source, size, fraction=1):
    image = Image.new('RGB', (size, size), '#030415')
    edge = round(size * fraction)
    image.paste(source.resize((edge, edge), Image.Resampling.LANCZOS), ((size-edge)//2, (size-edge)//2))
    return image

for key in ('guitar', 'bass', 'ukulele'):
    folder = ROOT / 'web/assets/instruments' / key
    source = Image.open(folder / 'icon-source.png').convert('RGB')
    outputs = {f'favicon-{n}.png': (n, 1) for n in SIZES}
    outputs.update({f'apple-touch-icon-{n}.png': (n, 1) for n in (120, 152, 167, 180)})
    outputs['apple-touch-icon.png'] = (180, 1)
    for n in (192, 512, 1024):
        outputs[f'icon-{n}.png'] = (n, 1)
    for n in (192, 512):
        outputs[f'android-chrome-{n}x{n}.png'] = (n, 1)
        outputs[f'icon-maskable-{n}.png'] = (n, .64)
    for name, (size, fraction) in outputs.items():
        scaled(source, size, fraction).save(folder / name, optimize=True)
    scaled(source, 256).save(folder / 'favicon.ico', sizes=[(n,n) for n in (16,32,48,64,128,256)])
    scaled(source, 160).save(folder / 'loader.webp', quality=85, method=6)
    if len(sys.argv) > 1 and sys.argv[1] == key:
        scaled(source, 1024).save(ROOT / 'app/resources/icon.png', optimize=True)
        scaled(source, 1024).save(ROOT / 'app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', optimize=True)
        for path in (ROOT / 'app/android/app/src/main/res').glob('mipmap-*/ic_launcher*.png'):
            size = Image.open(path).width
            if 'background' in path.name:
                image = Image.new('RGB', (size, size), '#030415')
            else:
                image = scaled(source, size, .60 if 'foreground' in path.name else .82 if 'round' in path.name else 1)
            image.save(path, optimize=True)
