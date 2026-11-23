# Screenshots signed in as the test player (see add-test-player.py), opening the profile
# from the menu under the name first unless a step says "start": "calendar". Each step:
# {"file", "width", "height", "full" (whole page), "actions": [["click", selector],
# ["fill", selector, text], ["press", selector, key], ["scroll", pixels]]}.
# Usage: python3 tools/render/shoot-player.py /tmp/render-build '[{...}, ...]'
import sys, json
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import shoot
from playwright.sync_api import sync_playwright
shoot.serve(sys.argv[1], shoot.PORT)
session = json.dumps({"user": {"id": "00000000-0000-0000-0000-00000000aaaa", "user_metadata": {"full_name": "Roxa"}}})
steps = json.loads(sys.argv[2])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for s in steps:
        pg = b.new_page(viewport={'width': s['width'], 'height': s['height']}, device_scale_factor=2)
        pg.add_init_script(f"window.localStorage.setItem('standInSession', {json.dumps(session)})")
        pg.route('**/fonts.googleapis.com/**', lambda r: r.abort()); pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
        pg.route('**/raw.githubusercontent.com/**', shoot.answer_image)
        errors = []; pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(f'http://127.0.0.1:{shoot.PORT}/'); pg.wait_for_selector('.calendar-panel', timeout=15000); pg.wait_for_timeout(600)
        if s.get('start', 'player') == 'player':
            pg.locator('[data-account-menu]').first.click(); pg.wait_for_timeout(300)
            pg.locator('.account-menu [data-page="player"]').first.click(); pg.wait_for_timeout(800)
        for a in s.get('actions', []):
            if a[0] == 'click': pg.locator(a[1]).first.click()
            elif a[0] == 'fill': pg.locator(a[1]).first.fill(a[2])
            elif a[0] == 'press': pg.locator(a[1]).first.press(a[2])
            elif a[0] == 'scroll': pg.evaluate(f'window.scrollTo(0, {a[1]}); document.querySelectorAll(".admin-page").forEach(e => e.scrollTo(0, {a[1]}))')
            pg.wait_for_timeout(400)
        pg.screenshot(path=s['file'], full_page=s.get('full', False))
        print(s['file'], 'errors:', errors); pg.close()
    b.close()
print('missing pictures:', len(shoot.missing_pictures))
for url in sorted(shoot.missing_pictures): print('  ', url)
