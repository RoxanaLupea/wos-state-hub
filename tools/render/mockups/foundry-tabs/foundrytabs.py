import sys, json
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot, page
from playwright.sync_api import sync_playwright
PREFS = {'categories': ['state','alliance','personal','deals'], 'hiddenEvents': [], 'followedScheduleIds': [], 'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = "key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key); document.body.appendChild(b); b.click(); b.remove(); }"
# The generic glass panel with the site's own colour for its lines (decided on Results), and a Buildings tab after Rules.
DRESS = r"""
() => {
  const panel = document.querySelector('.event-page');
  panel.style.background = 'var(--glass)'; panel.style.boxShadow = 'var(--glass-shadow)';
  panel.style.setProperty('--fold-color', 'var(--accent)');
  for (const f of Array.from(panel.querySelectorAll('.event-folds'))) f.style.setProperty('--fold-color', 'var(--accent)');
  for (const tabs of Array.from(panel.querySelectorAll('.info-tabs'))) tabs.style.setProperty('--tab-color', 'var(--accent)');
  for (const edit of Array.from(panel.querySelectorAll('.edit-button'))) edit.style.setProperty('--edit-colour', 'var(--accent)');
  // Foundry has no Alliance times and no Mine tab (decided 27 Nov night)
  for (const id of ['alliance-times', 'mine']) panel.querySelector(`.info-tab[data-info-tab="${id}"]`)?.remove();
  // every alliance member gets these, by Legion 1's result
  for (const h of Array.from(panel.querySelectorAll('*'))) if (h.children.length === 0 && h.textContent.trim() === 'Legion members') h.textContent = "Alliance members, by Legion 1's result";
  const rules = panel.querySelector('.info-tab[data-info-tab="rules"]');
  if (rules && !panel.querySelector('.info-tab[data-info-tab="buildings"]')) rules.insertAdjacentHTML('afterend', '<button type="button" class="info-tab" role="tab" data-info-tab="buildings" aria-selected="false">Buildings</button>');
  if (!panel.querySelector('.info-tab[data-info-tab="results"]')) panel.querySelector('.info-tabs').insertAdjacentHTML('beforeend', '<button type="button" class="info-tab" role="tab" aria-selected="false">Results</button>');
  // Foundry's rewards split 4 and 3 by colour (Roxanne, 28 Nov): the alliance's gold and purple first, its blue
  // under them; a combatant's gold first, the purple and blue under them.
  for (const line of Array.from(new Set(Array.from(panel.querySelectorAll('.reward-tile')).map(t => t.parentElement)))) {
    const tiles = Array.from(line.querySelectorAll(':scope > .reward-tile'));
    line.querySelector(':scope > .reward-break')?.remove();
    const personal = Boolean(line.closest('.combatant-ranges'));
    const at = tiles.findIndex(t => personal ? !t.classList.contains('tile-orange') : t.classList.contains('tile-blue'));
    if (at > 0) tiles[at].insertAdjacentHTML('beforebegin', '<span class="reward-break"></span>');
  }
  const row = panel.querySelector('.info-tabs'); if (row.scrollWidth > row.clientWidth + 1) row.classList.add('more-right');
}
"""
MEASURE = "() => { const body = document.querySelector('.event-page-body'); const panel = document.querySelector('.event-page'); return panel.getBoundingClientRect().top + window.scrollY + (panel.scrollHeight - body.clientHeight) + body.scrollHeight + 40 }"
shoot.serve('/tmp/rbf', 8827)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for tab in ['rules', 'rewards']:
        for (W, H, S, tag) in [(384, 832, 2.8125, 'phone'), (1536, 864, 1.25, 'laptop'), (2560, 1440, 1, 'monitor')]:
            pg = page.open_site(b, 8827, W, H, S)
            pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
            pg.evaluate(OPEN, 's-foundry|2026-11-09|ph5'); pg.clock.run_for(1500)
            print(tab, tag, pg.evaluate("() => Array.from(document.querySelectorAll('.event-page .info-tab')).map(t => t.textContent).join(',')"))
            pg.click(f'.event-page .info-tab[data-info-tab="{tab}"]'); pg.clock.run_for(800)
            pg.evaluate(DRESS); pg.clock.run_for(400)
            if tag == 'phone':
                h = pg.evaluate(MEASURE); pg.set_viewport_size({'width': 384, 'height': max(832, int(h))}); pg.clock.run_for(500); pg.evaluate(DRESS)
            pg.screenshot(path=f'/tmp/fmock/foundry-{tab}-{tag}.png'); pg.close()
    b.close()
