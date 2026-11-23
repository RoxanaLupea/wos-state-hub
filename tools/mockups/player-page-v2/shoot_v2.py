# Clean screenshots, and for my own check the same with guide lines on the picture's edges.
import http.server, threading, functools, sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8773), functools.partial(Q, directory=str(HERE)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
LINES = """() => { const pic = document.querySelector('.pic').getBoundingClientRect(); const page = document.querySelector('.pp').getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(document.querySelector('.pp')).paddingLeft);
  const add = (css) => { const l = document.createElement('div'); l.style.cssText = 'position:absolute;z-index:99;background:cyan;' + css; document.body.appendChild(l); };
  for (const y of [pic.top, pic.bottom]) add(`left:0;right:0;top:${y + scrollY}px;height:1px`);
  for (const x of [page.left + pad, page.right - pad]) add(`top:0;height:${document.body.scrollHeight}px;left:${x}px;width:1px`); }"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for key in ('jump', 'long'):
        for w, h, tag in ((390, 844, 'phone'), (1440, 900, 'pc')):
            pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
            pg.route('**/fonts.googleapis.com/**', lambda r: r.abort()); pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
            pg.goto(f'http://127.0.0.1:8773/v2-{key}.html'); pg.wait_for_timeout(400)
            # The background is sized to the window; make the window as tall as the page so a
            # full-page shot shows it the way a scrolling player sees it, with no seam.
            pg.set_viewport_size({'width': w, 'height': max(h, pg.evaluate('document.documentElement.scrollHeight'))}); pg.wait_for_timeout(200)
            pg.screenshot(path=str(HERE / 'screenshots' / f'v2-{key}-{tag}.png'), full_page=True)
            pg.evaluate(LINES)
            pg.screenshot(path=f'/tmp/v2-{key}-{tag}-check.png', full_page=True)
            print(key, tag, 'page width', pg.evaluate('document.documentElement.scrollWidth'))
            pg.close()
    b.close()
