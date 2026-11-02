#!/usr/bin/env python3
"""Rakit src/template.html menjadi dua keluaran:
  dist/index.html            -> satu berkas mandiri (semua pustaka & data di dalam; jalan tanpa internet)
  dist/lensa-intensitas.html -> versi ringan; pustaka dimuat dari CDN (perlu internet)
Jalankan lewat `npm run build` (membundel Three.js & docx dulu ke build/)."""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
NM = ROOT / 'node_modules'
B = ROOT / 'build'
rd = lambda p: pathlib.Path(p).read_text(encoding='utf-8')
tpl = rd(ROOT / 'src/template.html')
data = {'/*PLACES*/': rd(ROOT / 'data/places.json'), '/*PROV*/': rd(ROOT / 'data/prov.json')}
V = {'leaflet': '1.9.4', 'three': '0.187.0', 'xlsx': '0.18.5', 'mammoth': '1.13.0', 'pdfjs': '3.11.174', 'docx': '9.15.1'}

def common(t):
    for k, v in data.items():
        t = t.replace(k, v)
    return t

def offline(t):
    t = t.replace('/*LEAFLET_CSS*/', rd(NM / 'leaflet/dist/leaflet.css'))
    t = re.sub(r'url\(images/[^)]+\)', 'none', t)
    t = t.replace('/*LEAFLET_JS*/', rd(NM / 'leaflet/dist/leaflet.js'))
    t = t.replace('/*THREE_JS*/', rd(B / 'gl.js'))
    libs = '\n'.join(rd(p) for p in [NM / 'xlsx/dist/xlsx.full.min.js', NM / 'mammoth/mammoth.browser.min.js', NM / 'pdfjs-dist/build/pdf.min.js', B / 'docx.min.js'])
    libs = libs.replace('\ufffd', '\\ufffd')  # tabel codepage SheetJS: tulis U+FFFD sebagai escape JS
    t = t.replace('/*LIBS_JS*/', libs)
    t = t.replace('/*PDF_WORKER_INLINE*/', rd(NM / 'pdfjs-dist/build/pdf.worker.min.js'))
    t = t.replace("'/*PDF_WORKER_URL*/'", 'null')
    return t

def cdn(t):
    t = t.replace('<style>/*LEAFLET_CSS*/</style>', f'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/{V["leaflet"]}/leaflet.min.css">')
    t = t.replace('<script>/*LEAFLET_JS*/</script>', f'<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/{V["leaflet"]}/leaflet.min.js"></script>')
    th = f'https://cdn.jsdelivr.net/npm/three@{V["three"]}'
    t = t.replace('<script>/*THREE_JS*/</script>',
        f'<script type="importmap">{{"imports":{{"three":"{th}/build/three.module.js","three/addons/":"{th}/examples/jsm/"}}}}</script>\n'
        "<script type=\"module\">import * as THREE from 'three'; import {OrbitControls} from 'three/addons/controls/OrbitControls.js'; import {Sky} from 'three/addons/objects/Sky.js'; import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js'; import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'; Object.assign(window,{THREE,OrbitControls,Sky,RoomEnvironment,mergeGeometries});</script>")
    j = 'https://cdn.jsdelivr.net/npm'
    t = t.replace('<script>/*LIBS_JS*/</script>', '\n'.join(f'<script src="{u}"></script>' for u in [
        f'{j}/xlsx@{V["xlsx"]}/dist/xlsx.full.min.js', f'{j}/mammoth@{V["mammoth"]}/mammoth.browser.min.js',
        f'{j}/pdfjs-dist@{V["pdfjs"]}/build/pdf.min.js', f'{j}/docx@{V["docx"]}/dist/index.iife.js']))
    t = t.replace('/*PDF_WORKER_INLINE*/', '')
    t = t.replace("'/*PDF_WORKER_URL*/'", f"'{j}/pdfjs-dist@{V['pdfjs']}/build/pdf.worker.min.js'")
    # app script runs after the Three.js module
    t = t.replace('<script>\n"use strict";', '<script type="module">\n"use strict";', 1)
    return t

(ROOT / 'dist').mkdir(exist_ok=True)
for name, fn in [('index.html', offline), ('lensa-intensitas.html', cdn)]:
    out = fn(common(tpl))
    assert '/*' + 'LIBS_JS' + '*/' not in out and '/*PLACES*/' not in out
    (ROOT / 'dist' / name).write_text(out, encoding='utf-8')
    print(name, round(len(out.encode()) / 1024), 'KB')
