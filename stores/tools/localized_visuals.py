"""Render a localized store listing from its localized copy and captured phone screens.
Usage: python stores/tools/localized_visuals.py bass de-DE
Needs Pillow with RAQM. Hindi and CJK use the Noto Sans system fonts (Debian:
fonts-noto-core, fonts-noto-cjk). Other locales use the listing's bundled fonts.
"""
import json
import re
import shutil
import sys
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
LISTINGS = ROOT / 'stores/google-play'
ASSETS = LISTINGS / 'guitar/en-US/source/layout/assets'
WORDMARKS = {'guitar': ASSETS / 'wordmark.png', 'bass': ROOT / 'web/assets/home/bass-wordmark.webp', 'ukulele': ROOT / 'web/assets/home/ukulele-wordmark.webp'}
IDS = ('01-routine', '02-triads', '03-pentatonic', '04-feedback',
       '05-quiz', '06-tuner', '07-map', '08-circle')
CJK = {'ja-JP': 0, 'ko-KR': 1, 'zh-CN': 2}
RESAMPLE = Image.Resampling.LANCZOS


@lru_cache(maxsize=120)
def font(locale, size, bold=True):
    weight = 'Bold' if bold else 'Regular'
    if locale in CJK:
        return ImageFont.truetype(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{weight}.ttc', size, index=CJK[locale])
    script = {'hi-IN':'Devanagari', 'ar':'Arabic', 'bn-BD':'Bengali', 'ru-RU':''}.get(locale)
    if script is not None:
        return ImageFont.truetype(f'/usr/share/fonts/truetype/noto/NotoSans{script}-{weight}.ttf', size)
    return ImageFont.truetype(str(ASSETS / ('headline.ttf' if bold else 'body.ttf')), size)


def fit(locale, lines, start, width, bold=True):
    for size in range(start, 7, -1):
        face = font(locale, size, bold)
        if all(face.getlength(line) <= width for line in lines):
            return face
    raise ValueError(f'Text too wide: {lines}')


def wrap(text, face, width, locale):
    joined = locale in ('ja-JP', 'zh-CN')
    pieces = list(text) if joined else text.split()
    sep = '' if joined else ' '
    lines, line = [], ''
    for piece in pieces:
        trial = sep.join((line, piece)) if line else piece
        if line and face.getlength(trial) > width:
            if joined and piece in '、。，！？・」』）' and len(line) > 1:
                # Keep closing punctuation with the preceding character.
                lines.append(line[:-1])
                line = line[-1] + piece
            else:
                lines.append(line)
                line = piece
        else:
            line = trial
    return lines + [line]


def alpha_asset(canvas, path, area):
    art = Image.open(path).convert('RGBA')
    art.thumbnail(area[2:], RESAMPLE)
    canvas.paste(art, area[:2], art)


def card(locale, theme, copy, screen, wordmark):
    width, height = 1080, 1920
    stage = Image.open(ROOT / 'web/assets/theme/concert-crowd.webp').convert('RGB')
    backdrop = ImageOps.fit(stage, (width, height), method=RESAMPLE)
    canvas = Image.blend(backdrop, Image.new('RGB', backdrop.size, '#03051b'), .72)
    d = ImageDraw.Draw(canvas)
    face = fit(locale, copy[:2], 90, 948)
    for index, title in enumerate(copy[:2]):
        d.text((1016 if locale == 'ar' else 64, 64 + index * 116), title, font=face, anchor='rt' if locale == 'ar' else 'lt', fill=('#ffffff', '#00e5ef')[index])
    subtitle = font(locale, 43)
    lines = wrap(copy[2], subtitle, 948, locale)
    assert len(lines) <= 3 and all(subtitle.getlength(s) <= 952 for s in lines), copy[2]
    for i, line in enumerate(lines):
        d.text((1016 if locale == 'ar' else 64, 360 + i * 66), line, font=subtitle, anchor='rt' if locale == 'ar' else 'lt', fill='white')
    alpha_asset(canvas, ASSETS / (theme + '-icon.png'), (44, 740, 256, 256))
    alpha_asset(canvas, wordmark, (54, 1630, 248, 226))
    # Keep the full viewport visible, including the tuner and the quiz HUD.
    x, y, w, h = 336, 600, 680, 1256
    d.rounded_rectangle((x, y, x+w-1, y+h-1), radius=32, fill='#78aeff')
    inner = Image.new('RGB', (w-8, h-8), '#070c1e')
    frame = ImageOps.contain(screen, inner.size, method=RESAMPLE)
    inner.paste(frame, ((inner.width-frame.width)//2, (inner.height-frame.height)//2 if theme=='06-tuner' else 0))
    mask = Image.new('L', inner.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, inner.width-1, inner.height-1), radius=27, fill=255)
    canvas.paste(inner, (x+4, y+4), mask)
    return canvas


def banner(locale, copy, master):
    # The English master has baked-in labels. Restore their panel backgrounds
    # from adjacent clean pixels, keeping the instrument, icons and neon outlines.
    canvas = Image.open(master / 'feature-graphic-1024x500.png').convert('RGB')
    original = canvas.copy()
    for y in range(261, 284):
        for x in range(128, 512):
            a = (y-260)/24
            c1, c2 = original.getpixel((x,260)), original.getpixel((x,284))
            canvas.putpixel((x,y), tuple(round((1-a)*p+a*q) for p,q in zip(c1,c2)))
    d = ImageDraw.Draw(canvas)
    title = copy['tagline']
    d.text((320, 272), title, font=fit(locale,[title],19,444), anchor='mm', fill='white')
    for (name, detail), (top, bottom) in zip(copy['menu'], [(44,99),(121,176),(198,252),(274,330),(351,406),(427,484)], strict=True):
        for y in range(top, bottom):
            left, right = original.getpixel((671,y)), original.getpixel((926,y))
            line = Image.new('RGB',(2,1));line.putdata([left,right])
            canvas.paste(line.resize((254,1),Image.Resampling.BILINEAR),(672,y))
        d.text((925 if locale=='ar' else 676,top+2), name, font=fit(locale,[name],26,249), anchor='rt' if locale=='ar' else 'lt', fill='white')
        d.text((925 if locale=='ar' else 676,top+34), detail, font=fit(locale,[detail],16,249,False), anchor='rt' if locale=='ar' else 'lt', fill='#e7edff')
    return canvas


def render(instrument, locale, banner_only=False):
    if instrument not in WORDMARKS:
        raise ValueError(f"Unsupported store instrument: {instrument}")
    if not re.fullmatch(r'[a-z]{2}(-[A-Z]{2})?', locale):
        raise ValueError('Invalid locale')
    out = LISTINGS / instrument / locale
    master = LISTINGS / instrument / 'en-US/icon'
    copy = json.loads((out/'source/copy.json').read_text(encoding='utf-8'))
    icon = out/'icon';icon.mkdir(exist_ok=True)
    shutil.copyfile(master / 'app-icon-512x512.png', icon/'app-icon-512x512.png')
    banner(locale, copy, master).save(icon/'feature-graphic-1024x500.png', optimize=True)
    if banner_only:
        return
    phone = out/'phone';phone.mkdir(exist_ok=True)
    overview = Image.new('RGB',(1440,1280))
    for i, (theme, captions) in enumerate(zip(IDS,copy['cards'],strict=True)):
        raw = next((out/'source/screens-phone').glob(f'{theme}-1080x1920.*'))
        with Image.open(raw) as screen:
            visual = card(locale, theme, captions, screen, WORDMARKS[instrument])
        visual.save(phone/f'{theme}-1080x1920.jpg',quality=92,optimize=True)
        overview.paste(visual.resize((360,640),RESAMPLE),((i%4)*360,(i//4)*640))
    overview.save(out/'overview-phone.jpg',quality=91,optimize=True)


if __name__ == '__main__':
    render(sys.argv[1], sys.argv[2], '--banner' in sys.argv[3:])
