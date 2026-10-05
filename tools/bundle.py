# 1つのHTMLにまとめる：python3 tools/bundle.py → dist/manabi-dragon.html
# JS（assets/questions/game）をHTMLに埋めこみ、画像はWebPに変換して埋めこむ
import base64, io, os, re, sys
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
html = open('index.html', encoding='utf-8').read()
imgs = {}
for d, _, fs in os.walk('images'):
    for f in fs:
        if not f.endswith('.png') or f.startswith('icon-512'): continue
        p = os.path.join(d, f).replace(os.sep, '/')
        im = Image.open(p); buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=82, method=6)
        imgs[p] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
js = 'window.__IMG=' + repr(imgs).replace("'", '"') + ';'
def inline(name): return '<script>\n' + open(name, encoding='utf-8').read().replace('</script', '<\\/script') + '\n</script>'
html = html.replace('<script src="assets.js"></script>', '<script>' + js + '</script>\n' + inline('assets.js'))
html = html.replace('<script src="questions.js"></script>', inline('questions.js'))
html = html.replace('<script src="game.js"></script>', inline('game.js'))
html = re.sub(r'<link rel="manifest"[^>]*>\n?', '', html)
icon = imgs.get('images/icon-192.png', '')
html = html.replace('href="images/icon-192.png"', f'href="{icon}"')
# フォント（使う文字だけにしぼったもの）も埋めこむ → ネットにつながらなくてもドット文字になる
fp = 'fonts/DotGothic16-sub.woff'
if os.path.exists(fp):
    furi = 'data:font/woff;base64,' + base64.b64encode(open(fp, 'rb').read()).decode()
    html = html.replace('url("fonts/DotGothic16-sub.woff") format("woff"),url("fonts/DotGothic16-Regular.ttf")', f'url("{furi}") format("woff")')
    html = re.sub(r'<link rel="preconnect" href="https://fonts.googleapis.com">\n?', '', html)
    html = re.sub(r'<link href="https://fonts.googleapis.com[^>]*>\n?', '', html)
os.makedirs('dist', exist_ok=True)
out = 'dist/manabi-dragon.html'
open(out, 'w', encoding='utf-8').write(html)
print(out, round(os.path.getsize(out) / 1e6, 1), 'MB', len(imgs), 'images')
