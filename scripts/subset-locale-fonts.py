"""Regenerate the bundled Noto subsets after catalog changes.
Requires Python 3 and fonttools. Downloads fonts only at development time.
"""
import io
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FAMILIES = {'ja': 'Noto Sans JP', 'ko': 'Noto Sans KR', 'zh-CN': 'Noto Sans SC', 'hi': 'Noto Sans Devanagari'}
NATIVE_NAMES = {'ja': '日本語', 'ko': '한국어', 'zh-CN': '简体中文', 'hi': 'हिन्दी'}
for locale, family in FAMILIES.items():
    catalog = json.loads((ROOT / 'web/locales' / (locale + '.json')).read_text())
    chars = ''.join(sorted({char for text in [*catalog.values(), NATIVE_NAMES[locale]] for char in text if ord(char) > 127}))
    url = 'https://fonts.googleapis.com/css2?' + urllib.parse.urlencode({'family': family + ':wght@500;800', 'text': chars})
    with urllib.request.urlopen(url, timeout=60) as response:
        css = response.read().decode()
    for weight, source in re.findall(r'font-weight: (\d+);.*?url\(([^)]+)\)', css, re.S):
        with urllib.request.urlopen(source, timeout=60) as response:
            font = TTFont(io.BytesIO(response.read()))
        font.flavor = 'woff'
        path = ROOT / 'web/assets/fonts' / f'noto-{locale}-{weight}.woff'
        font.save(path)
        print(path.relative_to(ROOT))
