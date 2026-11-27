import sys, json
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot, page
from playwright.sync_api import sync_playwright
PREFS = {'categories': ['state','alliance','personal','deals'], 'hiddenEvents': [], 'followedScheduleIds': [], 'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = "key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key); document.body.appendChild(b); b.click(); b.remove(); }"
MOCK = r"""
([option, state, openMenu]) => {
  const panel = document.querySelector('.event-page');
  const style = document.createElement('style');
  style.textContent = `
    .event-page .mock-tag { display:inline-block; box-sizing: content-box; width: var(--tag-width); text-align: center; font-family: var(--tag-font); font-size: 11.5px; font-weight: 800; letter-spacing: .06em; color: var(--c);
      padding: 2px 7px; border-radius: 999px; background: color-mix(in srgb, var(--c) 16%, transparent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent); margin-right: 8px; vertical-align: 1px; line-height: 1.2; }
    .event-page .mock-legion { display:flex; align-items:center; }
    .event-page .mock-time { width: 3.3em; height: 20px; padding: 0 4px; font-size: 13px; font-weight: 700; text-align: center; color: var(--text); }
    .event-page .tree-when .mock-time { margin-left: auto; display:block; }
    .event-page .schedule-row .mock-time { margin-left: 6px; }
    .event-page .mock-unset { color: var(--text-faint); }
    .event-page .mock-pick { position: relative; display: inline-flex; align-items: center; margin-right: 8px; }
    .event-page .mock-pick .mock-tag { margin-right: 0; padding-right: 17px; }
    .event-page .mock-caret { position: absolute; right: 6px; top: 50%; width: 7px; height: 7px; margin-top: -5px; border-right: 1.6px solid currentColor;
      border-bottom: 1.6px solid currentColor; transform: rotate(45deg); color: var(--c); opacity: .8; }
    .event-page .mock-legion-box { height: 20px; padding: 0 20px 0 6px; font-size: 12px; font-weight: 600; color: var(--text); position: relative;
      display: inline-flex; align-items: center; }
    .event-page .mock-legion-box .mock-caret { --c: var(--text-muted); }
    .event-page .mock-menu { position: absolute; left: 0; top: calc(100% + 6px); z-index: 5; display: flex; flex-direction: column; gap: 8px; padding: 10px 10px;
      border-radius: 10px; background: rgba(20, 30, 40, 0.92); box-shadow: 0 6px 18px rgba(0,0,0,.45), inset 0 0 0 1px var(--glass-border); }
    .event-page .mock-menu .mock-tag { margin-right: 0; }
    .event-page .mock-menu .chosen { box-shadow: inset 0 0 0 1.5px var(--c), 0 0 0 2px color-mix(in srgb, var(--c) 30%, transparent); }`;
  document.head.appendChild(style);
  const DVL = '#C2A4E8', ACADEMY = 'color-mix(in srgb, #C2A4E8 62%, white)';
  const legions = [
    { tag: 'dvl', c: ACADEMY, legion: 'Legion 1', time: '02:00' },
    { tag: 'DVL', c: DVL, legion: 'Legion 1', time: '14:00' },
    { tag: 'DVL', c: DVL, legion: 'Legion 2', time: '19:00' },
  ];
  const editing = state === 'edit';
  const shown = editing ? legions.concat([{ tag: 'dvl', c: ACADEMY, legion: 'Legion 2', time: '' }]) : legions;
  // One width for every tag: as wide as WWWW, measured in the tag's own font.
  const probe = document.createElement('span'); probe.className = 'mock-tag'; probe.style.cssText = 'position:absolute;visibility:hidden;width:auto';
  probe.textContent = 'WWWW'; panel.appendChild(probe); panel.style.setProperty('--tag-width', getComputedStyle(probe).width); probe.remove();
  const ALLIANCES = [{ tag: 'DVL', c: DVL }, { tag: 'dvl', c: ACADEMY }];
  const pill = one => `<span class="mock-tag" style="--c:${one.c}">${one.tag}</span>`;
  const pickTag = (one, open) => `<span class="mock-pick" style="--c:${one.c}"><span class="mock-tag svs-field" style="--c:${one.c};border:none;background:color-mix(in srgb, ${one.c} 16%, transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb, ${one.c} 70%, transparent)">${one.tag}</span><i class="mock-caret"></i>` +
    (open ? `<span class="mock-menu">${ALLIANCES.map(a => `<span class="mock-tag${a.tag === one.tag ? ' chosen' : ''}" style="--c:${a.c}">${a.tag}</span>`).join('')}</span>` : '') + '</span>';
  const pickLegion = one => `<span class="svs-field mock-legion-box">${one.legion}<i class="mock-caret"></i></span>`;
  const timeBox = one => `<input class="svs-field mock-time" value="${one.time}" placeholder="--:--">`;
  const lineIcon = (id, d) => `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--word-tint)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><path d="${d}" fill="none" stroke="url(#${id})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const actions = `<button type="button" class="quiet-word cancel">${lineIcon('m-cancel','M6 6l12 12M18 6L6 18')}<span class="words">Cancel</span></button>` +
    `<button type="button" class="quiet-word confirm">${lineIcon('m-save','M4.5 12.5l5 5L19.5 6.5')}<span class="words">Save</span></button>`;
  const timesButton = `<button type="button" class="add-results-top"><svg class="add-results-icon" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="add-times-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--event-color)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#add-times-colour)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="9.5"/><path d="M14 8.5V14l3.5 2.5"/></g><circle cx="24.5" cy="23.5" r="6" fill="var(--event-color)"/><path d="M24.5 20.5v6M21.5 23.5h6" stroke="#0B1222" stroke-width="2" stroke-linecap="round"/></svg><span>Times</span></button>`;
  const resultsButton = `<button type="button" class="add-results-top"><svg class="add-results-icon" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="add-results-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--event-color)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#add-results-colour)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h12v6a6 6 0 0 1-12 0z"/><path d="M9 7H5.5v1.5A4 4 0 0 0 9.5 12.5M21 7h3.5v1.5a4 4 0 0 1-4 4"/><path d="M15 17v4M10.5 25h9l-1-4h-7z"/></g><circle cx="24.5" cy="23.5" r="6" fill="var(--event-color)"/><path d="M24.5 20.5v6M21.5 23.5h6" stroke="#0B1222" stroke-width="2" stroke-linecap="round"/></svg><span>Results</span></button>`;
  panel.querySelector('.row-buttons').innerHTML = editing ? '' : state === 'results' ? resultsButton : timesButton;

  // Tabs: Mine and Alliance times go; option B gets Legions.
  const tabs = panel.querySelector('.info-tabs');
  const tabHtml = (id, label, on) => `<button type="button" class="info-tab" role="tab" aria-selected="${on}">${label}</button>`;
  const onLegions = option === 'B';
  const tabRow = option === 'A' ? tabHtml('timeline', 'Timeline', true)
    : tabHtml('timeline', 'Timeline', !onLegions) + tabHtml('legions', 'Legions', onLegions);
  const tabStyle = tabs.getAttribute('style');
  const showLine = option === 'B';
  const line = tabs.closest('.info-tab-line') ?? tabs;
  line.outerHTML = showLine ? `<div class="info-tab-line"><div class="info-tabs" role="tablist" style="${tabStyle}">${tabRow}</div>${editing ? `<span class="tab-actions">${actions}</span>` : ''}</div>` : '';

  const tree = panel.querySelector('.event-tree');
  if (option === 'A') {
    const rows = [...tree.children];
    const battle = rows[rows.length - 2], end = rows[rows.length - 1];
    const lineStyle = battle.querySelector('.tree-line').getAttribute('style').replace(/--line-above:[^;]*;/, '--line-above:' + /--line-below:([^;"]*)/.exec(battle.querySelector('.tree-line').getAttribute('style'))[1] + ';');
    const dot = battle.querySelector('.tree-dot').style.background;
    const html = shown.map(one => `<div class="tree-row nested"><span class="tree-when">${editing ? timeBox(one) : `<span>${one.time}</span>`}</span>` +
      `<span class="tree-line" style="${lineStyle}"><span class="tree-step-dot" style="background:${one.time ? dot : 'transparent'};${one.time ? '' : 'box-shadow: inset 0 0 0 1.5px ' + dot}"></span></span>` +
      `<span class="tree-label mock-legion${one.time ? '' : ' mock-unset'}">${editing ? pickTag(one, state === 'edit' && openMenu && one === shown[shown.length - 1]) + pickLegion(one) : pill(one) + one.legion}</span><span></span></div>`).join('');
    // While setting times on the timeline, Cancel and Save sit right under the legions, so nothing above moves.
    const save = editing ? `<div class="tree-row nested"><span class="tree-when"></span><span class="tree-line" style="${lineStyle}"></span>` +
      `<span class="tree-label" style="display:flex;gap:16px">${actions}</span><span></span></div>` : '';
    battle.insertAdjacentHTML('afterend', html + save);
    if (state === 'results') {
      const pin = panel.querySelector('.tree-label svg, .tree-label .pin-icon');
      const target = [...tree.querySelectorAll('.tree-row.nested')][1].querySelector('.tree-label');
      if (pin) target.insertBefore(pin, target.firstChild);
    }
  } else {
    const body = panel.querySelector('.event-page-body .event-tree')?.parentElement;
    const list = shown.map(one => `<div class="schedule-row"><span class="mock-legion${one.time ? '' : ' mock-unset'}">${pill(one)}${one.legion}</span>` +
      `<span class="schedule-when">Sun 29 Nov · ${editing ? timeBox(one) : one.time}</span></div>`).join('');
    tree.outerHTML = `<div class="event-alliance-times">${list}</div>`;
  }
}
"""
shoot.serve('/tmp/rb', 8821)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for option, state, menu, name in [('A','view',False,'A-view'),('A','edit',False,'A-edit'),('A','edit',True,'A-edit-pick'),('A','results',False,'A-results')]:
        pg = page.open_site(b, 8821, 384, 832, 2.8125)
        pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
        pg.evaluate(OPEN, 's-foundry|2026-11-23'); pg.clock.run_for(1500)
        pg.evaluate(MOCK, [option, state, menu]); pg.clock.run_for(500)
        pg.screenshot(path=f'/tmp/fmock/foundry-{name}.png'); pg.close()
    b.close()
