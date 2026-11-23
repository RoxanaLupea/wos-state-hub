# Clean screenshots of version 4 into screenshots/, and copies with guide lines on the
# picture's edges and the page edges into /tmp for checking (never sent).
import http.server, threading, functools, sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8786), functools.partial(Q, directory=str(HERE)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
LINES = """() => { const pic = document.querySelector('.pic').getBoundingClientRect(); const page = document.querySelector('.pp').getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(document.querySelector('.pp')).paddingLeft);
  const add = (css) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;z-index:99;background:cyan;' + css; document.body.appendChild(l); };
  for (const y of [pic.top, pic.bottom]) add(`left:0;right:0;top:${y + scrollY}px;height:1px`);
  for (const x of [page.left + pad, page.right - pad]) add(`top:0;height:${document.body.scrollHeight}px;left:${x}px;width:1px`); }"""
keys = sys.argv[1].split(',')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for key in keys:
        for w, h, tag in ((390, 844, 'phone'),):
            pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
            pg.route('**/fonts.googleapis.com/**', lambda r: r.abort()); pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
            pg.goto(f'http://127.0.0.1:8786/v15-{key}.html'); pg.wait_for_timeout(400)
            if 'leave' not in key: pg.set_viewport_size({'width': w, 'height': max(h, pg.evaluate('document.documentElement.scrollHeight'))}); pg.wait_for_timeout(200)
            else: pg.wait_for_timeout(100)
            pg.screenshot(path=str(HERE / 'screenshots' / f'v15-{key}-{tag}.png'), full_page='leave' not in key)
            over = pg.evaluate("""() => Array.from(document.querySelectorAll('.pp *')).filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map(e => e.className + ':' + e.textContent.slice(0,20))""")
            pg.evaluate(LINES)
            pg.screenshot(path=f'/tmp/v15-{key}-{tag}-check.png', full_page=True)
            print(key, tag, 'width', pg.evaluate('document.documentElement.scrollWidth'), 'cut:', over)
            pg.close()
    b.close()
