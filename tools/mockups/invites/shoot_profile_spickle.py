import sys, json, pathlib
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot
from playwright.sync_api import sync_playwright
shoot.serve('/tmp/render-profile', 8714)
session = json.dumps({"user": {"id": "00000000-0000-0000-0000-00000000aaaa", "user_metadata": {"full_name": "TestPlayer"}}})
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 1000}, device_scale_factor=2)
    pg.add_init_script(f"window.localStorage.setItem('standInSession', {json.dumps(session)})")
    pg.route('**/raw.githubusercontent.com/**', shoot.answer_image)
    pg.goto('http://127.0.0.1:8714/'); pg.wait_for_selector('.calendar-panel', timeout=15000); pg.wait_for_timeout(600)
    pg.locator('[data-account-menu]').first.click(); pg.wait_for_timeout(300)
    pg.locator('.account-menu [data-page="player"]').first.click(); pg.wait_for_timeout(900)
    pg.evaluate("""() => {
      // Seen by an admin on the Invites page: not their own account, so no Edit, Add or update reminders.
      document.querySelectorAll('.pp .char-actions, .pp .remind, .pp .troops h2 button').forEach(e => e.remove());
      const sec = document.createElement('section'); sec.className = 'boards';
      sec.innerHTML = '<h2>Transfer</h2><div class="grid">' +
        [['Kills', '4.53M'], ['Labyrinth', '1,275'], ['Migrant score', '1.3M']].map(([c, v]) => `<div class="board"><span class="cap">${c}</span><span class="v">${v}</span></div>`).join('') + '</div>';
      const troops = document.querySelector('.pp .troops'); troops.parentNode.insertBefore(sec, troops);
      document.querySelector('.top-bar') && (document.querySelector('.top-bar').style.display = 'none');

    }""")
    pg.add_style_tag(content='html, body, #app, .app, .page, .player-page, .admin-page, .pp { background: transparent !important; } .app::before, .app::after, body::before, body::after { display: none !important; }')
    pg.wait_for_timeout(400)
    el = pg.locator('.pp').first
    el.screenshot(path='/tmp/render-build/images/profile-spickle.png', omit_background=True)
    print(el.bounding_box())
    b.close()
