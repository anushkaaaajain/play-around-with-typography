#!/usr/bin/env python3
"""Packs every font in ./fonts into fonts-data.js so the Type library works when you open
fonts.html directly from disk or from any host, with no download step.

Run it again after adding or replacing a font file:   python3 build-fonts.py
"""
import base64, json, os
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'fonts')
data = {}
for name in sorted(os.listdir(src)):
    if name.lower().endswith(('.otf', '.ttf', '.woff', '.woff2')):
        data[name] = base64.b64encode(open(os.path.join(src, name), 'rb').read()).decode('ascii')
with open(os.path.join(here, 'fonts-data.js'), 'w') as f:
    f.write('window.FONT_DATA = ' + json.dumps(data) + ';\n')
print(f'Packed {len(data)} fonts into fonts-data.js')
