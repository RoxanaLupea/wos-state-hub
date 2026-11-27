# Usage: python3 tools/render/scroll-audit.py <built folder> <out folder> <port>
# Every box whose content is taller than it must scroll (no scrollbar shown); nothing may be
# cut off; boxes with a background must not touch each other. Phone and computer, every page.
import sys, json
# Calendar controls: this month, other months, week view; computer and phone.
import sys, json
sys.path.insert(0, __import__('os').path.dirname(__file__))
import shoot
from playwright.sync_api import sync_playwright
build, out, port = sys.argv[1], sys.argv[2], int(sys.argv[3])
shoot.serve(build, port)
session = json.dumps({"user": {"id": "1096141f-8fab-4476-9b28-f707e86731da", "user_metadata": {"full_name": "Roxanne"}}})
FIXED = '2026-11-26T17:50:00Z'
def page(b, w, h, dpr):
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=dpr)
    pg.clock.install(time=FIXED); pg.clock.pause_at(FIXED)
    pg.add_init_script(f"window.localStorage.setItem('standInSession', {json.dumps(session)})")
    font_css = ("@font-face{font-family:'Roboto';font-style:normal;font-weight:400 900;src:url(http://127.0.0.1:%d/fonts/roboto.ttf) format('truetype');}"
                "@font-face{font-family:'Montserrat';font-style:normal;font-weight:700;src:url(http://127.0.0.1:%d/fonts/montserrat.ttf) format('truetype');}") % (port, port)
    pg.route('**/fonts.googleapis.com/**', (lambda css: lambda r: r.fulfill(status=200, content_type='text/css', body=css))(font_css))
    pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    pg.route('**/raw.githubusercontent.com/**', shoot.answer_image)
    pg.route('**/gof-formal-avatar.akamaized.net/**', lambda r: r.fulfill(status=404, body=b''))
    pg.on('pageerror', lambda e: print('ERR', e))
    pg.goto(f'http://127.0.0.1:{port}/'); pg.clock.run_for(3000)
    pg.wait_for_selector('.calendar-panel', timeout=15000); pg.clock.run_for(2000)
    return pg
def click(pg, sel):
    pg.evaluate(f"document.querySelector('{sel}').click()"); pg.clock.run_for(1500)
def info(pg, tag):
    print(tag, pg.evaluate('''() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right), Math.round(b.top), Math.round(b.bottom)]; };
      return {title: document.querySelector('.period-title')?.textContent, t: r('.period-title'), pin: r('.today-button'), prev: r('.step-arrow[data-step="-1"]'), next: r('.step-arrow[data-step="1"]')}; }'''))

def nav(section, sub=None):
    acts = [f".nav-tab[data-page={section}]"]
    if sub: acts.append(f".section-tab[data-sub-page={sub}]")
    return acts
STATES = [
    ('calendar', []), ('calendar-week', ['[data-view=week]']), ('calendar-year', ['[data-view=year]']),
    ('event-ac', ['.bar[data-event-type="alliance-championship"]']),
    ('event-ac-rules', ['.bar[data-event-type="alliance-championship"]', '.info-tab:nth-child(2)']),
    ('event-ac-rewards', ['.bar[data-event-type="alliance-championship"]', '.info-tab:nth-child(3)']),
    ('event-svs', ['.bar.parts-bar']), ('event-svs-results', ['.bar.parts-bar', '.info-tab:last-child']),
    ('day', ['.day-box.today']), ('filters', ['.filters-button']), ('account-menu', ['[data-account-menu]']),
    ('fortress-phase', nav('fortress', 'phase')), ('fortress-season', nav('fortress', 'season')), ('fortress-rewards', nav('fortress', 'rewards')),
    ('transfers-timeline', nav('transfers', 'timeline')), ('invites', nav('transfers', 'invites')),
    ('invites-profile', nav('transfers', 'invites') + ['[data-invite-profile]']),
    ('invites-details', nav('transfers', 'invites') + ['[data-invites-details]']),
    ('invites-edit', nav('transfers', 'invites') + ['[data-invites-edit="open"]']),
    ('invites-newgroup', nav('transfers', 'invites') + ['[data-invites-edit="open"]', '[data-invite-group]', '[data-invite-join$="|new"]']),
    ('invites-add', nav('transfers', 'invites') + ['[data-invites-add]']),
    ('records', nav('transfers', 'records')), ('records-profile', nav('transfers', 'records') + ['[data-invite-profile]']),
    ('state', nav('state')), ('alliance-times', nav('alliance', 'times')), ('alliance-members', nav('alliance', 'members')),
    ('map', nav('map')), ('profile', ['[data-account-menu]', '.account-menu [data-page="player"]']),
]
JS = r'''() => {
  const out = { clipped: [], bars: [], offscreen: [], touching: [] };
  const vis = e => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const name = e => (e.tagName.toLowerCase() + '.' + String(e.className).trim().split(/\s+/).slice(0, 3).join('.')).slice(0, 70);
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e)) continue;
    const c = getComputedStyle(e);
    const tall = e.scrollHeight - e.clientHeight;
    if ((c.overflowY === 'hidden' || c.overflowY === 'clip') && tall > 6 && e.clientHeight > 44 && !/ellipsis/.test(c.textOverflow)) {
      // only when the hidden part holds something: a child reaching below the box
      const r = e.getBoundingClientRect();
      const below = Array.from(e.querySelectorAll('*')).some(k => { const kr = k.getBoundingClientRect(); return vis(k) && kr.height > 4 && kr.top > r.bottom - 2 && (k.textContent.trim() || k.tagName === 'IMG'); });
      if (below) out.clipped.push(name(e) + ' ' + e.clientHeight + '/' + e.scrollHeight);
    }
    if ((c.overflowY === 'auto' || c.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 1) {
      const bar = e.offsetWidth - e.clientWidth - parseFloat(c.borderLeftWidth) - parseFloat(c.borderRightWidth);
      if (bar > 0.5) out.bars.push(name(e) + ' bar ' + bar.toFixed(0));
    }
    if (c.position === 'fixed') {
      const r = e.getBoundingClientRect();
      if (r.bottom > innerHeight + 2 && r.height > 40 && c.overflowY !== 'auto' && c.overflowY !== 'scroll') out.offscreen.push(name(e) + ' bottom ' + Math.round(r.bottom));
    }
  }
  // boxes with their own background or border, one right under or beside the next, with no space
  const boxed = e => { const c = getComputedStyle(e); const bg = c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.backgroundImage !== 'none'; const bd = parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none' && c.borderTopColor !== 'rgba(0, 0, 0, 0)'; return bg || bd; };
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e) || !boxed(e)) continue;
    const n = e.nextElementSibling; if (!n || !vis(n) || !boxed(n)) continue;
    const a = e.getBoundingClientRect(), b = n.getBoundingClientRect();
    if (a.height < 14 || b.height < 14 || a.width < 14 || b.width < 14) continue;
    const vgap = b.top - a.bottom, hgap = b.left - a.right;
    const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 10;
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 10;
    if ((overlapX && vgap >= -0.5 && vgap < 1.5) || (overlapY && hgap >= -0.5 && hgap < 1.5)) out.touching.push(name(e) + ' + ' + name(n));
  }
  for (const k of Object.keys(out)) out[k] = Array.from(new Set(out[k]));
  return out; }'''
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for w, h, d, kind in [(384, 832, 2.8125, 'phone'), (1920, 950, 1, 'pc')]:
        for name, acts in STATES:
            pg = page(b, w, h, d)
            ok = True
            for sel in acts:
                try: pg.locator(sel).first.click(timeout=2500); pg.clock.run_for(1200)
                except Exception: ok = False
            res = pg.evaluate(JS)
            flags = {k: v for k, v in res.items() if v}
            if flags or not ok: print(kind, name, '' if ok else '(could not open)', json.dumps(flags, ensure_ascii=False))
            pg.close()
    b.close()
