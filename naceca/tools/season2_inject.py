#!/usr/bin/env python3
"""Add NACECA Season 2 ("Operation Upstream") to a built NACECA page.

Usage:
    python3 -I tools/season2_inject.py <built page.html> <out.html> [--kit <kit root>] [--stream <out dir>]

What it does to the page (nothing else is touched):
  1. puts the Season 2 scenes (art/season2/env/<key>.glb, <key>_lm.webp, <key>.json) into the
     page's `const ART_INLINE = {...};` table as env_<key>_glb / _lm / _max / _meta, the same
     keys the engine's ENVART reads for the Season 1 scenes;
  2. appends the Season 2 layer before the last </body>: its two stylesheets, then
     `window.NACECA_MANIFEST = null` (no packs) unless one is already set, then every script in
     LAYER order, each in its own <script> with a `/* ---------- season2/<file> ---------- */` header.
     A file that fails `node --check` stops the build (node must be on PATH);
  3. with --stream, also writes a streamed copy to <out dir>: the page (~3 MB) plus
     a_<pack>-<hash>.js packs that s2_stream.js fetches when a scene needs them.

Call inject(html, kit_root) from another build script to do the same in memory.
"""
import sys, os, re, json, base64, hashlib, shutil, subprocess

LAYER_CSS = ['s2.css', 's2_court.css']
LAYER = ['s2_stream.js', 's2_mtex_a.js', 's2_mtex_b.js', 's2_mtex_c.js', 's2_core.js', 's2_world.js',
         's2_dlg_a.js', 's2_dlg_b.js', 's2_dlg_c.js', 's2_court_data.js', 's2_sources.js', 's2_court.js',
         's2_case09.js', 's2_case10.js', 's2_case11.js', 's2_case12.js', 's2_case13.js', 's2_case13b.js',
         's2_case14.js', 's2_case15.js', 's2_hubs.js', 's2_merge.js', 's2_boot.js']
MANIFEST_NULL = '<script>window.NACECA_MANIFEST = window.NACECA_MANIFEST || null;</script>'

def _art_bounds(doc):
    i = doc.index('const ART_INLINE = '); j = doc.index('\n', i); return i, j

def add_art(doc, kit):
    env_dir = os.path.join(kit, 'art', 'season2', 'env')
    i, j = _art_bounds(doc)
    art = json.loads(doc[i + len('const ART_INLINE = '):j].rstrip().rstrip(';'))
    added = []
    for f in sorted(os.listdir(env_dir)):
        if not f.endswith('.json'): continue
        key = f[:-5]; meta = json.load(open(os.path.join(env_dir, f)))
        glb = meta.pop('glb', key); lm = meta.pop('lm', key + '_lm')
        art['env_%s_glb' % key] = base64.b64encode(open(os.path.join(env_dir, glb + '.glb'), 'rb').read()).decode()
        art['env_%s_lm' % key] = 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(env_dir, lm + '.webp'), 'rb').read()).decode()
        art['env_%s_max' % key] = meta.pop('max', 1.0)
        art['env_%s_meta' % key] = meta
        added.append(key)
    return doc[:i] + 'const ART_INLINE = ' + json.dumps(art, separators=(',', ':')) + ';' + doc[j:], added

def layer_html(kit):
    src = os.path.join(kit, 'src', 'season2'); parts = []
    for f in LAYER_CSS:
        p = os.path.join(src, f)
        if os.path.exists(p): parts.append('<style id="season2-%s">\n%s\n</style>' % (f[:-4], open(p, encoding='utf-8').read()))
    parts.append(MANIFEST_NULL)
    for f in LAYER:
        p = os.path.join(src, f)
        if not os.path.exists(p): sys.exit('season2: missing ' + p)
        chk = subprocess.run(['node', '--check', p], capture_output=True, text=True)
        if chk.returncode != 0: sys.exit('season2: syntax error in %s\n%s' % (f, chk.stderr))
        code = open(p, encoding='utf-8').read()
        if '</script' in code.lower(): sys.exit('season2: %s contains a closing script tag' % f)
        parts.append('<script>/* ---------- season2/%s ---------- */\n%s\n</script>' % (f, code))
    return '\n'.join(parts) + '\n'

def inject(doc, kit):
    if 'season2/s2_core.js' in doc: sys.exit('season2: this page already has Season 2')
    doc, added = add_art(doc, kit)
    k = doc.rindex('</body>')
    doc = doc[:k] + layer_html(kit) + doc[k:]
    return doc, added

# ---------- the streamed copy: heavy values move into packs fetched on demand ----------
# (the same split the Season 2 build used: core, mansion, env_<scene>, music_<track>, portraits, portraits_old)
def _obj_bounds(d, head):
    i = d.index(head); j = d.index('\n};', i) + 3; return i, j

def stream(doc, out_dir):
    import io
    if os.path.isdir(out_dir): shutil.rmtree(out_dir)
    os.makedirs(out_dir)
    packs = {}
    def put(pack, key, val): packs.setdefault(pack, {})[key] = val
    i, j = _art_bounds(doc)
    A = json.loads(doc[i + len('const ART_INLINE = '):j].rstrip().rstrip(';'))
    keep = {}
    for key, val in A.items():
        if not isinstance(val, str) or len(val) < 4096: keep[key] = val; continue
        m = re.match(r'env_(\w+?)_(glb|lm)$', key)
        if m: put('env_' + m.group(1), key, val)
        elif key.startswith('mansion_'): put('mansion', key, val)
        else: put('core', key, val)
    doc = doc[:i] + 'const ART_INLINE = ' + json.dumps(keep, separators=(',', ':')) + ';' + doc[j:]
    mi, mj = _obj_bounds(doc, 'const MUSIC_INLINE = {')
    for name, b64 in re.findall(r'^\s+(\w+): "([A-Za-z0-9+/=]+)",?$', doc[mi:mj], re.M): put('music_' + name, name, b64)
    doc = doc[:mi] + 'const MUSIC_INLINE = {};' + doc[mj:]
    pi, pj = _obj_bounds(doc, 'const PORTRAIT_ART = {')
    for key, val in re.findall(r'^\s+(\w+): "(data:[^"]+)",?$', doc[pi:pj], re.M): put('portraits', key, val)
    doc = doc[:pi] + 'const PORTRAIT_ART = {};' + doc[pj:]
    ai = doc.index('const ASSETS = {'); aj = doc.index('\n};', ai) + 3
    assets = json.loads(doc[ai + len('const ASSETS = '):aj - 1])
    for key, val in assets.get('portraits', {}).items(): put('portraits_old', key, val)
    assets['portraits'] = {}
    try:                                   # the title badge stays inline, as WebP
        from PIL import Image
        b = assets['title']['naceca_badge']; raw = base64.b64decode(b.split(',', 1)[1])
        im = Image.open(io.BytesIO(raw)); buf = io.BytesIO(); im.save(buf, 'WEBP', quality=90, method=6)
        assets['title']['naceca_badge'] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    except Exception as e:
        print('season2: badge kept as PNG:', e)
    doc = doc[:ai] + 'const ASSETS = ' + json.dumps(assets) + ';' + doc[aj:]
    man = {'v': 'season2', 'packs': {}}
    for name, data in sorted(packs.items()):
        body = 'NACECA_PACK(' + json.dumps(name) + ',' + json.dumps(data, separators=(',', ':')) + ');\n'
        h = hashlib.sha1(body.encode()).hexdigest()[:8]
        fn = 'a_%s-%s.js' % (name, h)
        open(os.path.join(out_dir, fn), 'w', encoding='utf-8').write(body)
        man['packs'][name] = {'f': fn, 'b': len(body.encode())}
    if doc.count(MANIFEST_NULL) != 1: sys.exit('season2: manifest slot missing')
    doc = doc.replace(MANIFEST_NULL, '<script>window.NACECA_MANIFEST = ' + json.dumps(man, separators=(',', ':')) + ';</script>')
    open(os.path.join(out_dir, 'naceca.html'), 'w', encoding='utf-8').write(doc)
    return man

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) < 2: sys.exit(__doc__)
    kit = a[a.index('--kit') + 1] if '--kit' in a else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    doc = open(a[0], encoding='utf-8').read()
    doc, added = inject(doc, kit)
    open(a[1], 'w', encoding='utf-8').write(doc)
    print('season2: scenes', added, '· page', '%.2f MB' % (len(doc.encode()) / 1e6))
    if '--stream' in a:
        man = stream(doc, a[a.index('--stream') + 1])
        print('season2: streamed', len(man['packs']), 'packs')
