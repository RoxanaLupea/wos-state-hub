# Foundry's legion times on the Battle row (Roxanne, 28 Nov: "show me how add time, add legion would show on the
# battle"). Legions under Battle as "DVL · Legion 1" (no pill), the add button on the Battle row, Results alone in the
# head once a legion's time has passed. Phone, laptop, monitor. Pictures go to /tmp/fbt.
import sys, json, os, re
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot, page
from playwright.sync_api import sync_playwright

PREFS = {'categories': ['state','alliance','personal','deals'], 'hiddenEvents': [], 'followedScheduleIds': [], 'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = "key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key); document.body.appendChild(b); b.click(); b.remove(); }"
old = open(os.path.join(os.path.dirname(__file__), 'foundry-legion-times.py')).read()
RESULTS_BUTTON = re.search(r"const resultsButton = `(.*?)`;", old).group(1)

MOCK = r"""
([state, resultsButton]) => {
  const panel = document.querySelector('.event-page');
  const style = document.createElement('style');
  style.textContent = `
    .event-page .legion-name { font-size: 12px; font-weight: 600; color: var(--text); }
    .event-page .legion-name b { font-weight: 800; }
    .event-page .legion-name.waiting { color: var(--text-muted); }
    .event-page .battle-add { margin-left: 16px; padding: 4px; margin-top: -6px; margin-bottom: -6px; border: none; background: none; cursor: pointer; }
    .event-page .battle-add svg { display: block; width: 24px; height: 24px; }
    .event-page .tree-label.with-add { display: flex; align-items: center; }
    .event-page .mock-time { width: 3.4em; height: 22px; padding: 0 4px; font-size: 12px; font-weight: 700; text-align: center; color: var(--text); margin-left: auto; display: block; }
    .event-page .legion-picks { display: flex; flex-direction: column; gap: 2px; }
    .event-page .legion-picks .pick-words { gap: 0 14px; }
    .event-page .legion-picks .pick-word { font-size: 12px; padding: 2px 0; }
    .event-page .edit-actions { display: flex; gap: 18px; }
  `;
  document.head.appendChild(style);
  const lineIcon = (id, d) => `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--word-tint)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><path d="${d}" fill="none" stroke="url(#${id})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // The clock with a plus (the Times icon): adding a legion is adding a time (Roxanne, 28 Nov: "Put the time thing").
  const addButton = `<button type="button" class="battle-add" aria-label="Add a legion's time"><svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="add-times-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--event-color)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#add-times-colour)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="9.5"/><path d="M14 8.5V14l3.5 2.5"/></g><circle cx="24.5" cy="23.5" r="6" fill="var(--event-color)"/><path d="M24.5 20.5v6M21.5 23.5h6" stroke="#0B1222" stroke-width="2" stroke-linecap="round"/></svg></button>`;
  const actions = `<span class="edit-actions"><button type="button" class="quiet-word cancel">${lineIcon('m-cancel','M6 6l12 12M18 6L6 18')}<span class="words">Cancel</span></button>` +
    `<button type="button" class="quiet-word confirm">${lineIcon('m-save','M4.5 12.5l5 5L19.5 6.5')}<span class="words">Save</span></button></span>`;

  // The saved times (database, from Ace007's chat): DVL Legion 1 14:00, DVL Legion 2 19:00.
  const legions = [ { tag: 'DVL', legion: 'Legion 1', time: '14:00' }, { tag: 'DVL', legion: 'Legion 2', time: '19:00' } ];
  const editing = state === 'add';
  const shown = editing ? legions.concat([{ tag: 'dvl', legion: 'Legion 1', time: '', fresh: true }]) : legions;

  // Results alone in the head, once a legion's time has passed.
  panel.querySelector('.row-buttons').innerHTML = state === 'results' ? resultsButton : '';

  const rows = Array.from(panel.querySelectorAll('.event-tree > .tree-row'));
  const battle = rows.find(r => r.querySelector('.tree-label')?.textContent.trim().toLowerCase() === 'battle');
  const battleLine = battle.querySelector('.tree-line');
  const below = /--line-below:([^;"]*)/.exec(battleLine.getAttribute('style'))[1];
  const lineStyle = `--line-above:${below};--line-below:${below}`;
  const dot = battle.querySelector('.tree-dot').style.background;
  const label = battle.querySelector('.tree-label');
  label.classList.add('with-add'); label.insertAdjacentHTML('beforeend', addButton);

  const picks = (choices, picked) => `<span class="pick-words">${choices.map(c => `<button type="button" class="pick-word${c === picked ? ' on' : ''}">${c}</button>`).join('')}</span>`;
  const rowHtml = (one, i) => {
    const when = editing ? `<input class="svs-field mock-time" value="${one.time}" placeholder="--:--">` : `<span>${one.time}</span>`;
    const name = editing
      ? `<span class="legion-picks">${picks(['DVL', 'dvl'], one.tag)}${picks(['Legion 1', 'Legion 2'], one.legion)}</span>`
      : `<span class="legion-name"><b>${one.tag}</b> · ${one.legion}</span>`;
    const pin = state === 'results' && i === 0 ? '<span class="pin-mark"></span>' : '';
    return `<div class="tree-row nested${editing ? ' editing-row' : ''}"><span class="tree-when">${when}</span>` +
      `<span class="tree-line" style="${lineStyle}"><span class="tree-step-dot" style="background:${one.fresh ? 'transparent' : dot};${one.fresh ? 'box-shadow: inset 0 0 0 1.5px ' + dot : ''}"></span></span>` +
      `<span class="tree-label">${name}</span><span></span></div>`;
  };
  const save = editing ? `<div class="tree-row nested"><span class="tree-when"></span><span class="tree-line" style="${lineStyle}"></span><span class="tree-label">${actions}</span><span></span></div>` : '';
  battle.insertAdjacentHTML('afterend', shown.map(rowHtml).join('') + save);
  // After a legion's time: the pin moves to the legion playing now (DVL · Legion 1 at 14:00).
  if (state === 'results') {
    const pin = panel.querySelector('.tree-label .pin-icon, .tree-label svg:not(.line-icon)');
    const target = Array.from(panel.querySelectorAll('.tree-row.nested .tree-label'))[0];
    if (pin && target) target.insertBefore(pin, target.firstChild);
  }
}
"""
HEIGHT = """() => { const body = document.querySelector('.event-page-body'); const panel = document.querySelector('.event-page');
  return body && panel ? panel.getBoundingClientRect().top + window.scrollY + (panel.scrollHeight - body.clientHeight) + body.scrollHeight + 40 : 0 }"""

os.makedirs('/tmp/fbt', exist_ok=True)
shoot.serve('/tmp/rb', 8835)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for W, H, S, tag in [(384, 832, 2.8125, 'phone'), (1536, 864, 1.25, 'laptop'), (2560, 1440, 1, 'monitor')]:
        for state in ['view', 'add', 'results']:
            pg = page.open_site(b, 8835, W, H, S)
            pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
            pg.evaluate(OPEN, 's-foundry|2026-11-23'); pg.clock.run_for(1500)
            pg.evaluate(MOCK, [state, RESULTS_BUTTON]); pg.clock.run_for(500)
            pg.screenshot(path=f'/tmp/fbt/foundry-battle-{state}-{tag}.png'); pg.close()
    b.close()
