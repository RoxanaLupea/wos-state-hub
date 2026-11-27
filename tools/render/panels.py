# Renders every event's panel, every tab, full height, and writes every panel's head, tabs
# and timeline rows as text. Run it before showing any panel change: a rule for panels is
# checked on every event, never only on the one being worked on (Roxanne, 27 Nov).
#
# Usage (after rebuild.sh, with RENDER_USER_ID set):
#   python3 tools/render/panels.py /tmp/rb OUT [width height scale] [--keys extra-key ...]
# Phone by default (384 x 832 at 2.8125). OUT gets one PNG per tab (event--tab.png),
# small/ copies 540 px wide for quick looks, keys.json and panels.txt.
# Every event seen from October to February is opened once; add other runs with --keys
# (for example "s-svsmm|2026-11-28" for an SvS with no results yet).
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
import shoot, page
from playwright.sync_api import sync_playwright
from PIL import Image

args = sys.argv[1:]
extra = args[args.index('--keys') + 1:] if '--keys' in args else []
args = args[:args.index('--keys')] if '--keys' in args else args
build, out = args[0], args[1]
W, H, S = (int(args[2]), int(args[3]), float(args[4])) if len(args) > 4 else (384, 832, 2.8125)
os.makedirs(os.path.join(out, 'small'), exist_ok=True)
PREFS = {'categories': ['state', 'alliance', 'personal', 'deals'], 'hiddenEvents': [], 'followedScheduleIds': [],
         'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = """key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key);
  document.body.appendChild(b); b.click(); b.remove(); }"""
READ = """() => ({
  head: document.querySelector('.event-page-head')?.innerText.replace(/\\n/g, ' | '),
  tabs: Array.from(document.querySelectorAll('.event-page .info-tabs:not(.rank-tabs) .info-tab')).map(t => t.getAttribute('data-info-tab')),
  rows: Array.from(document.querySelectorAll('.event-page .tree-row')).map(r => r.innerText.replace(/\\n/g, ' / ')) })"""
HEIGHT = """() => { const body = document.querySelector('.event-page-body'); const panel = document.querySelector('.event-page');
  return body && panel ? panel.getBoundingClientRect().top + window.scrollY + (panel.scrollHeight - body.clientHeight) + body.scrollHeight + 40 : 0 }"""

shoot.serve(build, 8800)
found, lines = {}, []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = page.open_site(browser, 8800, W, H, S)
    pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})")
    pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
    # Every event from October to February (the clock is fixed at RENDER_TIME, 26 Nov).
    for step in [-1, 1, 1, 1, 1]:
        for key, eventType in pg.evaluate("""() => Array.from(document.querySelectorAll('[data-open-event]')).map(e =>
            [e.getAttribute('data-open-event'), e.closest('[data-event-type]')?.getAttribute('data-event-type') || ''])"""):
            found.setdefault(eventType or key.split('|')[0], key)
        page.click(pg, f'[data-step="{step}"]')
    for key in extra: found[key] = key
    json.dump(found, open(os.path.join(out, 'keys.json'), 'w'), indent=1)
    for name, key in found.items():
        pg.evaluate(OPEN, key); pg.clock.run_for(1500)
        seen = pg.evaluate(READ)
        lines.append(f"== {name} ({key}) :: {seen['head']} :: {seen['tabs']}")
        lines += ['    ' + row for row in seen['rows']]
        for tab in seen['tabs'] or ['']:
            if tab: page.click(pg, f'.event-page .info-tab[data-info-tab="{tab}"]')
            pg.set_viewport_size({'width': W, 'height': max(H, int(pg.evaluate(HEIGHT)))}); pg.clock.run_for(500)
            file = f"{name}--{tab or 'only'}.png".replace('/', '_').replace('|', '_')
            pg.screenshot(path=os.path.join(out, file))
            pg.set_viewport_size({'width': W, 'height': H}); pg.clock.run_for(300)
            picture = Image.open(os.path.join(out, file))
            picture.resize((540, int(picture.height * 540 / picture.width))).save(os.path.join(out, 'small', file))
    browser.close()
open(os.path.join(out, 'panels.txt'), 'w').write('\n'.join(lines) + '\n')
print(len(found), 'panels; text in', os.path.join(out, 'panels.txt'))
