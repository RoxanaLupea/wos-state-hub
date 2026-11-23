# Opens a built copy of the site in Chrome and saves full-screen screenshots.
# Usage, from the repo root:
#   python3 tools/render/shoot.py <built folder> '<steps as JSON>'
# Each step: {"width": 1440, "height": 900, "file": "/path/out.png",
#             "actions": [["click", ".bar[data-event-type=hellfire]"]], "full": false}
# Actions: ["click", selector], ["click-top", selector] (clicks near the top left, past
# the white lines), ["scroll", selector, pixels], ["window-scroll", pixels].
# The site's fonts cannot load here, so a stand-in font is used; pictures are served
# from public/images, and only for the address the live site uses (this repo's
# public/images on GitHub), so a picture missing there is missing here too. Every
# picture the page asked for and did not get is listed after the shots.
import re, sys, json, threading, functools, http.server
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parents[2]
IMAGES = REPO_ROOT / 'public' / 'images'
PORT = 8702

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def serve(folder, port):
    handler = functools.partial(QuietHandler, directory=folder)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

# Pictures the page asked for and did not get.
missing_pictures = set()

def answer_image(route):
    match = re.search(r'/RoxanaLupea/wos-state-hub/main/public/images/(.+)$', route.request.url)
    path = IMAGES / match.group(1) if match else None
    if path and path.exists():
        route.fulfill(path=str(path), content_type='image/png')
    else:
        missing_pictures.add(route.request.url)
        route.fulfill(status=404, body='')

def open_page(browser, url, width, height):
    page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=2)
    page.route('**/fonts.googleapis.com/**', lambda route: route.abort())
    page.route('**/fonts.gstatic.com/**', lambda route: route.abort())
    page.route('**/raw.githubusercontent.com/**', answer_image)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)
    page.wait_for_selector('.calendar-panel', timeout=15000)
    page.wait_for_timeout(800)
    return page, errors

if __name__ == '__main__':
    serve(sys.argv[1], PORT)
    steps = json.loads(sys.argv[2])
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for step in steps:
            page, errors = open_page(browser, f'http://127.0.0.1:{PORT}/', step['width'], step['height'])
            for action in step.get('actions', []):
                kind, value = action[0], action[1]
                if kind == 'click':
                    page.locator(value).first.click()
                elif kind == 'click-top':
                    page.locator(value).first.click(position={'x': 20, 'y': 10})
                elif kind == 'scroll':
                    page.locator(value).first.evaluate(f'element => element.scrollTop = {action[2]}')
                elif kind == 'window-scroll':
                    page.evaluate(f'window.scrollTo(0, {value})')
                page.wait_for_timeout(500)
            page.screenshot(path=step['file'], full_page=step.get('full', False))
            print(step['file'], 'errors:', errors)
            page.close()
        browser.close()
    print('missing pictures:', len(missing_pictures))
    for url in sorted(missing_pictures):
        print('  ', url)
