"""Rebuild local Noto subsets for app catalogs, lessons and Privacy.
Run after `node scripts/build-seo.mjs`. Requires fonttools and curl.
Fonts are fetched only during development; readers never contact a font service.
"""
import html
import io
import json
from pathlib import Path
import re
import subprocess
import sys
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FAMILIES = {'ja': 'Noto Sans JP', 'ko': 'Noto Sans KR', 'zh-CN': 'Noto Sans SC', 'hi': 'Noto Sans Devanagari', 'ar': 'Noto Sans Arabic', 'bn': 'Noto Sans Bengali', 'ru': 'Noto Sans'}
NATIVE_NAMES = {'ja': '日本語', 'ko': '한국어', 'zh-CN': '简体中文', 'hi': 'हिन्दी', 'ar': 'العربية', 'bn': 'বাংলা', 'ru': 'Русский'}

def download(url):
    return subprocess.check_output(['curl', '-fsSL', '--retry', '2', '--max-time', '45', url])

def visible_text(source):
    source = re.sub(r'<script\b[\s\S]*?</script>', '', source)
    return html.unescape(re.sub(r'<[^>]*>', ' ', source))

policy = (ROOT / 'web/privacy.html').read_text()
lesson_copy = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {copy,lessonCopy} from './scripts/lessons/translations.mjs'; console.log(JSON.stringify(Object.fromEntries(Object.keys(copy).map(l=>[l,lessonCopy(l)]))))"], cwd=ROOT))
for locale in sys.argv[1:] or FAMILIES:
    catalog = json.loads((ROOT / 'web/locales' / (locale + '.json')).read_text())
    texts = [*catalog.values(), NATIVE_NAMES[locale], json.dumps(lesson_copy[locale], ensure_ascii=False)]
    texts.extend(visible_text(file.read_text()) for file in (ROOT / 'web' / locale).rglob('*.html'))
    article = re.search(r'<article[^>]*lang="' + re.escape(locale) + r'"[^>]*>([\s\S]*?)</article>', policy)
    if article:
        texts.append(visible_text(article[1]))
    chars = ''.join(sorted({char for text in texts for char in text if ord(char) > 127}))
    # Only a fixed, public font URL leaves this process. Lesson characters never
    # enter a request URL or body; subsetting happens entirely on this machine.
    slug = {'ja': 'notosansjp', 'ko': 'notosanskr', 'zh-CN': 'notosanssc', 'hi': 'notosansdevanagari', 'ar': 'notosansarabic', 'bn': 'notosansbengali', 'ru': 'notosans'}[locale]
    filename = {'ja': 'NotoSansJP%5Bwght%5D.ttf', 'ko': 'NotoSansKR%5Bwght%5D.ttf', 'zh-CN': 'NotoSansSC%5Bwght%5D.ttf', 'hi': 'NotoSansDevanagari%5Bwdth,wght%5D.ttf', 'ar': 'NotoSansArabic%5Bwdth,wght%5D.ttf', 'bn': 'NotoSansBengali%5Bwdth,wght%5D.ttf', 'ru': 'NotoSans%5Bwdth,wght%5D.ttf'}[locale]
    source = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{slug}/{filename}'
    full_font = download(source)
    for weight in [500, 800]:
        font = TTFont(io.BytesIO(full_font))
        axes = {'wght': weight}
        if any(axis.axisTag == 'wdth' for axis in font['fvar'].axes):
            axes['wdth'] = 100
        instantiateVariableFont(font, axes, inplace=True)
        options = subset.Options()
        options.layout_features = ['*']
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(text=chars)
        subsetter.subset(font)
        font.flavor = 'woff'
        output = ROOT / 'web/assets/fonts' / f'noto-{locale}-{weight}.woff'
        font.save(output)
        print(output.relative_to(ROOT), flush=True)
