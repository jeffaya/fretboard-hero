"""Rebuild approved branding. Requires Pillow: python -m pip install Pillow."""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'web'
ART = ROOT / 'artwork'
BACKGROUND = '#05070b'
RESAMPLE = Image.Resampling.LANCZOS
SIZES = (16, 32, 48, 64, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512)


def save(image, destination, **options):
    # Encode fully before replacing a file, so previews/builds never read a
    # half-written image during regeneration.
    destination = Path(destination)
    output = BytesIO()
    image.save(output, format=Image.registered_extensions()[destination.suffix], **options)
    data = output.getvalue()
    with Image.open(BytesIO(data)) as check:
        check.load()
    temporary = destination.with_name(destination.name + '.tmp')
    temporary.write_bytes(data)
    temporary.replace(destination)


def square(source, box):
    # Preserve the approved artwork; crop each icon with even safe margins.
    out = Image.new('RGB', (670, 670), BACKGROUND)
    out.paste(source.crop((box, 0, box + 670, 650)), (0, 20))
    return out.resize((1024, 1024), RESAMPLE)


def generate():
    source = Image.open(ART / 'icons-approved.png').convert('RGB')
    # Source is 2170 x 725; never silently use these crops with another image.
    assert source.size == (2170, 725), source.size
    for key, left in [('guitar', 75), ('bass', 750), ('ukulele', 1425)]:
        folder = WEB / 'assets/icons' / key
        folder.mkdir(parents=True, exist_ok=True)
        master = square(source, left)
        save(master, folder / 'icon-1024.png', optimize=True)
        for size in SIZES:
            save(master.resize((size, size), RESAMPLE), folder / f'favicon-{size}.png', optimize=True)
        for size in (192, 512):
            icon = master.resize((size, size), RESAMPLE)
            save(icon, folder / f'icon-{size}.png', optimize=True)
            save(icon, folder / f'android-chrome-{size}x{size}.png', optimize=True)
            # Entire icon within the guaranteed 80% diameter maskable safe circle.
            masked = Image.new('RGB', (size, size), BACKGROUND)
            inner = round(size * .70)
            masked.paste(master.resize((inner, inner), RESAMPLE), ((size-inner)//2, (size-inner)//2))
            save(masked, folder / f'icon-maskable-{size}.png', optimize=True)
        save(master.resize((180, 180), RESAMPLE), folder / 'apple-touch-icon.png', optimize=True)
        save(master, folder / 'favicon.ico', sizes=[(n, n) for n in (16, 32, 48, 64)], bitmap_format='png')
        og = ImageOps.fit(Image.open(ART / f'og-{key}.png').convert('RGB'), (1200, 630), method=RESAMPLE)
        save(og, WEB / f'assets/og/{key}.jpg', quality=92, optimize=True)
    # Default native resource follows the currently checked-in native product;
    # build-instrument.ps1 replaces it for each instrument before generation.
    import json
    native = json.loads((ROOT / 'app/capacitor.config.json').read_text(encoding='utf-8-sig'))
    catalog = json.loads((ROOT / 'app/instruments.json').read_text())
    key = next((v['iconKey'] for v in catalog.values() if v['appId'] == native['appId']), 'guitar')
    icon = Image.open(WEB / f'assets/icons/{key}/icon-1024.png')
    save(icon, ROOT / 'app/resources/icon.png')
    ios = ROOT / 'app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
    save(icon, ios)
    # Keep a manual native build coherent with capacitor.config.json as well.
    # Variant builds regenerate these again from their selected source.
    for density, scale in [('ldpi', .75), ('mdpi', 1), ('hdpi', 1.5), ('xhdpi', 2), ('xxhdpi', 3), ('xxxhdpi', 4)]:
        folder = ROOT / f'app/android/app/src/main/res/mipmap-{density}'
        folder.mkdir(parents=True, exist_ok=True)
        size = round(48 * scale)
        for name in ('ic_launcher', 'ic_launcher_round'):
            save(icon.resize((size, size), RESAMPLE), folder / f'{name}.png', optimize=True)
        size = round(108 * scale)
        save(icon.resize((size, size), RESAMPLE), folder / 'ic_launcher_foreground.png', optimize=True)
        save(Image.new('RGB', (size, size), BACKGROUND), folder / 'ic_launcher_background.png', optimize=True)

    # A small real GIF cycles the actual home instruments, not platform emoji.
    sprite = Image.open(WEB / 'assets/home/instruments.webp').convert('RGBA')
    instruments = [sprite.crop((i*256, 0, (i+1)*256, 244)) for i in range(3)]
    frames = []
    for instrument in instruments:
        for step in range(16):
            t = step / 16
            fade = min(1, t / .18, (1-t) / .18)
            frame = Image.new('RGB', (192, 192), BACKGROUND)
            image = ImageOps.contain(instrument, (156, 156), method=RESAMPLE)
            image = image.rotate(8 * (t - .5), resample=Image.Resampling.BICUBIC, expand=False)
            image.putalpha(image.getchannel('A').point(lambda a: round(a*fade)))
            frame.paste(image, ((192-image.width)//2, (192-image.height)//2), image)
            frames.append(frame)
    folder = WEB / 'assets/loading'
    folder.mkdir(parents=True, exist_ok=True)
    save(frames[8], folder / 'instrument-static.webp', quality=90)
    save(frames[0], folder / 'instruments.gif', save_all=True, append_images=frames[1:], duration=60, loop=0, optimize=True)
    print('Branding rebuilt: three icon families, three 1200x630 cards, loader and native sources.')


if __name__ == '__main__':
    generate()
