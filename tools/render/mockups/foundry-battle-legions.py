# Foundry's legions under Battle (Roxanne, 28 Nov): every member shows or hides legions in their own timeline with an eye,
# and opens "Other legions" to add another alliance's legion; R4s and admins get Edit on the Battle row, which opens every
# legion in place (time box), a bin after each name that asks in the site's pop-up,
# "Add legion" after the last one, then Cancel and Save. Phone, laptop, monitor. Pictures go to /tmp/fbl.
import sys, json, os, re
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot, page
from playwright.sync_api import sync_playwright

PREFS = {'categories': ['state','alliance','personal','deals'], 'hiddenEvents': [], 'followedScheduleIds': [], 'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = "key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key); document.body.appendChild(b); b.click(); b.remove(); }"
SRC = '/home/claude/wos-state-hub/src/ui/'
EDIT_ICON = re.search(r"export const EDIT_ICON = ('.*?');\n", open(SRC + 'edit-forms.ts').read(), re.S).group(1)
EDIT_ICON = eval(EDIT_ICON.replace("' +\n  '", ''))

MOCK = r"""
([state, EDIT_ICON]) => {
  const panel = document.querySelector('.event-page');
  const style = document.createElement('style');
  style.textContent = `
    .event-page .legion-name { font-size: 12px; font-weight: 600; color: var(--text); }
    .event-page .legion-name b { font-weight: 800; }
    .event-page .legion-name.hidden-legion { color: var(--text-faint); }
    .event-page .legion-after { display: inline-flex; align-items: center; gap: 10px; white-space: nowrap; }
    .event-page .tree-label > .pick-words .pick-word { font-size: 12px; font-weight: 600; }
    .event-page .tree-label > .pick-words .pick-word.on { font-weight: 800; }
    .event-page .tree-label.legion-cell { flex: 1; min-width: 0; }
    .event-page .eye { display: inline-flex; padding: 2px; border: none; background: none; cursor: pointer; }
    .event-page .eye svg { width: 18px; height: 18px; display: block; }
    .event-page .with-edit { display: flex; align-items: center; gap: 20px; }
    .event-page .mock-time { width: 3.4em; height: 22px; padding: 0 4px; font-size: 12px; font-weight: 700; text-align: center; color: var(--text); margin-left: auto; display: block; }
    .event-page .legion-picks { display: flex; flex-direction: column; gap: 2px; flex: none; }
    .event-page .legion-label.editing { flex-wrap: wrap; row-gap: 2px; }
    .event-page .legion-label.editing .legion-remove { margin-left: auto; }
    .event-page .legion-picks .pick-words { gap: 0 14px; }
    .event-page .legion-picks .pick-word { font-size: 12px; font-weight: 600; padding: 2px 0; }
    .event-page .legion-picks .pick-word.on { font-weight: 800; }
    .event-page .edit-actions { display: flex; gap: 22px; }
    .event-page .legion-remove { padding: 2px 0; flex: none; }
    .event-page .legion-remove .line-icon { width: 16px; height: 16px; }
    .event-page .legion-remove .words { font-size: 11px; }
    .event-page .others-head { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); }
    .event-page .other-legions { display: inline-flex; align-items: center; gap: 7px; }
    .event-page .other-legions .fold { width: 12px; height: 12px; }
  `;
  document.head.appendChild(style);
  const lineIcon = (id, d, w = 2.4) => `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--word-tint)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><path d="${d}" fill="none" stroke="url(#${id})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const EYE = 'M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z';
  const EYE_OFF = EYE + 'M4 4l16 16';
  let n = 0;
  const eye = shown => `<button type="button" class="eye" aria-label="${shown ? 'Hide from my timeline' : 'Show in my timeline'}" style="--word-tint: ${shown ? 'var(--accent)' : 'var(--text-faint)'}">` +
    lineIcon('m-eye-' + (n++), shown ? EYE : EYE_OFF, 2) + '</button>';
  const quiet = (cls, tint, id, d, word, disabled) => `<button type="button" class="quiet-word ${cls}" style="--word-tint: ${tint}"${disabled ? ' disabled' : ''}>${lineIcon(id, d)}<span class="words">${word}</span></button>`;
  const CROSS = 'M6 6l12 12M18 6L6 18', BIN = 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10.2 11v5M13.8 11v5', TICK = 'M4.5 12.5l5 5L19.5 6.5';
  const CLOCK_ADD = `<svg class="edit-icon" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="add-times-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--event-color)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#add-times-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="9.5"/><path d="M14 8.5V14l3.5 2.5"/></g><circle cx="24.5" cy="23.5" r="6" fill="var(--event-color)"/><path d="M24.5 20.5v6M21.5 23.5h6" stroke="#0B1222" stroke-width="2" stroke-linecap="round"/></svg>`;

  // Our alliance's legions (saved: DVL Legion 1 14:00, DVL Legion 2 19:00). Others are SAMPLE rows: no other alliance has times yet.
  const ours = [ { tag: 'DVL', legion: 'Legion 1', time: '14:00' }, { tag: 'DVL', legion: 'Legion 2', time: '19:00' } ];
  const others = [ { tag: 'RUU', legion: 'Legion 1', time: '13:00' }, { tag: 'TOP', legion: 'Legion 1', time: '14:00' },
                   { tag: 'SKY', legion: 'Legion 1', time: '15:00' }, { tag: 'TOP', legion: 'Legion 2', time: '19:00' } ];
  const byTime = list => list.slice().sort((a, b) => a.time.localeCompare(b.time) || a.tag.localeCompare(b.tag));
  const isR4 = state.startsWith('r4');
  const editing = ['r4-edit', 'r4-add', 'r4-remove'].includes(state);
  const choosing = state === 'choose';
  // What a member follows: their alliance's legions by default; in 'after' they added TOP · Legion 1 and hid DVL · Legion 2.
  let followed = ours.slice();
  if (state === 'after') followed = byTime([ours[0], others[1]]);

  panel.querySelector('.row-buttons').innerHTML = '';
  const rows = Array.from(panel.querySelectorAll('.event-tree > .tree-row'));
  const battle = rows.find(r => r.querySelector('.tree-label')?.textContent.trim().toLowerCase() === 'battle');
  const below = /--line-below:([^;"]*)/.exec(battle.querySelector('.tree-line').getAttribute('style'))[1];
  const lineStyle = `--line-above:${below};--line-below:${below}`;
  const dot = battle.querySelector('.tree-dot').style.background;
  const label = battle.querySelector('.tree-label');
  if (isR4 && !editing) { label.classList.add('with-edit'); label.insertAdjacentHTML('beforeend', `<button type="button" class="edit-button">${EDIT_ICON}<span><span class="words">Edit</span></span></button>`); }

  const row = (when, dotStyle, inner) => `<div class="tree-row nested"><span class="tree-when">${when}</span>` +
    `<span class="tree-line" style="${lineStyle}">${dotStyle === null ? '' : `<span class="tree-step-dot" style="${dotStyle}"></span>`}</span>` +
    `<span class="tree-label">${inner}</span><span></span></div>`;
  const solid = `background:${dot}`, hollow = `background:transparent;box-shadow: inset 0 0 0 1.5px ${dot}`;
  const name = (one, faint) => `<span class="legion-name${faint ? ' hidden-legion' : ''}"><b>${one.tag}</b> · ${one.legion}</span>`;
  const after = inner => `<span class="legion-after">${inner}</span>`;

  let html = '';
  if (editing) {
    // Saved legions stay what they are: only the time changes, or the bin removes them (second tap, no pop-up).
    ours.forEach((one, i) => {
      const bin = `<button type="button" class="quiet-word remove legion-remove" style="--word-tint: var(--notice-red)" aria-label="Remove ${one.tag} · ${one.legion}">${lineIcon('m-bin-' + i, BIN)}</button>`;
      html += row(`<input class="svs-field mock-time" value="${one.time}">`, solid, after(name(one) + bin));
    });
    if (state === 'r4-add') {
      // The new row: the alliance and the legion picked separately, suggested on the first one not set yet
      // (DVL has both, so dvl · Legion 1 comes picked).
      const picks = (choices, chosen) => `<span class="pick-words">${choices.map(c => `<button type="button" class="pick-word${c === chosen ? ' on' : ''}">${c}</button>`).join('')}</span>`;
      html += row(`<input class="svs-field mock-time" value="" placeholder="--:--">`, hollow,
        `<span class="legion-picks">${picks(['DVL', 'dvl'], 'dvl')}${picks(['Legion 1', 'Legion 2'], 'Legion 1')}</span>`);
    }
    html += row('', null, `<button type="button" class="edit-button" style="--edit-colour: var(--event-color)">${CLOCK_ADD}<span><span class="words">Add legion</span></span></button>`);
    html += row('', null, `<span class="edit-actions">${quiet('cancel', 'var(--notice-red)', 'm-cancel', CROSS, 'Cancel')}${quiet('confirm', 'var(--save-green)', 'm-save', TICK, 'Save', state !== 'r4-add')}</span>`);
  } else if (choosing) {
    // Choosing: every legion of every alliance in time order, an eye right after each name; on = in my timeline.
    const all = byTime(ours.map(o => ({ ...o, on: o.legion === 'Legion 1' })).concat(others.map(o => ({ ...o, on: o.tag === 'TOP' && o.legion === 'Legion 1' }))));
    all.forEach(one => { html += row(`<span>${one.time}</span>`, one.on ? solid : hollow, after(name(one, !one.on) + eye(one.on))); });
    html += row('', null, `<button type="button" class="quiet-word other-legions" style="--word-tint: var(--save-green)">${lineIcon('m-done', TICK)}<span class="words">Done</span></button>`);
  } else {
    // Viewing: only the legions I follow, nothing faint, no eyes; "Follow another legion" under them opens the choosing.
    followed.forEach(one => { html += row(`<span>${one.time}</span>`, solid, name(one)); });
    html += row('', null, `<button type="button" class="quiet-word other-legions" style="--word-tint: var(--accent)">${lineIcon('m-choose', EYE, 2)}<span class="words">Follow another legion</span></button>`);
  }
  battle.insertAdjacentHTML('afterend', html);
  // Tapping a bin asks in the site's pop-up, as everywhere (Roxanne, 28 Nov).
  if (state === 'r4-remove') document.body.insertAdjacentHTML('beforeend', '<div class="leave-prompt"><div class="leave-prompt-box glass" role="dialog" aria-modal="true">' +
    '<p class="leave-prompt-text">Are you sure you want to remove <span style="white-space:nowrap">DVL · Legion 2</span>?</p>' +
    '<div class="leave-prompt-actions"><button type="button" class="ghost-button">Cancel</button><button type="button" class="danger-button">Remove</button></div></div></div>');
}
"""

os.makedirs('/tmp/fbl', exist_ok=True)
shoot.serve('/tmp/rb', 8836)
STATES = ['member', 'choose', 'after', 'r4', 'r4-edit', 'r4-remove', 'r4-add']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for W, H, S, tag in [(384, 832, 2.8125, 'phone'), (1536, 864, 1.25, 'laptop'), (2560, 1440, 1, 'monitor')]:
        for state in STATES:
            pg = page.open_site(b, 8836, W, H, S)
            pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
            pg.evaluate(OPEN, 's-foundry|2026-11-23'); pg.clock.run_for(1500)
            pg.evaluate(MOCK, [state, EDIT_ICON]); pg.clock.run_for(500)
            pg.screenshot(path=f'/tmp/fbl/foundry-legions-{state}-{tag}.png'); pg.close()
    b.close()
