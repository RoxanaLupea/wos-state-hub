# Helpers for full-screen renders of a build: open the site signed in as a player, at a
# fixed time, on a phone or a computer.
#   from page import open_site, click
#   pg = open_site(browser, build_port, 384, 832, 2.8125)   # phone (1080 x 2340)
#   pg = open_site(browser, build_port, 1920, 950, 1)        # computer
# Serve the build first with shoot.serve(build_folder, port). The player is the id in
# RENDER_USER_ID (Roxanne's account id is in tools/render/data/, never committed).
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import shoot

FIXED_TIME = os.environ.get('RENDER_TIME', '2026-11-26T17:50:00Z')

def open_site(browser, port, width, height, scale):
    session = json.dumps({'user': {'id': os.environ.get('RENDER_USER_ID', ''),
                                   'user_metadata': {'full_name': 'Roxanne'}}})
    pg = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=scale)
    pg.clock.install(time=FIXED_TIME); pg.clock.pause_at(FIXED_TIME)
    pg.add_init_script(f"window.localStorage.setItem('standInSession', {json.dumps(session)})")
    fonts = ("@font-face{font-family:'Roboto';font-weight:400 900;src:url(http://127.0.0.1:%d/fonts/roboto.ttf)}"
             "@font-face{font-family:'Montserrat';font-weight:700;src:url(http://127.0.0.1:%d/fonts/montserrat.ttf)}") % (port, port)
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=fonts))
    pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    pg.route('**/raw.githubusercontent.com/**', shoot.answer_image)
    pg.route('**/gof-formal-avatar.akamaized.net/**', lambda r: r.fulfill(status=404, body=b''))
    pg.on('pageerror', lambda error: print('page error:', error))
    pg.goto(f'http://127.0.0.1:{port}/'); pg.clock.run_for(3000)
    pg.wait_for_selector('.calendar-panel', timeout=15000); pg.clock.run_for(2000)
    return pg

def click(pg, selector):
    pg.evaluate(f"document.querySelector({json.dumps(selector)}).click()"); pg.clock.run_for(1500)
