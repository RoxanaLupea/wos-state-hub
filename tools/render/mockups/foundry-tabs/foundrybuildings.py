import sys, json
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot, page
from playwright.sync_api import sync_playwright
PREFS = {'categories': ['state','alliance','personal','deals'], 'hiddenEvents': [], 'followedScheduleIds': [], 'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = "key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key); document.body.appendChild(b); b.click(); b.remove(); }"
# Each building as the game's Building Details tab gives it (her screenshots, 27 Nov).
MOCK = r"""
([showTip]) => {
  const panel = document.querySelector('.event-page');
  const style = document.createElement('style');
  style.textContent = `
    .fbx { --pic: 54px; --label: 56px; --first: 92px; }
    .fbx .cols { display: grid; grid-template-columns: var(--label) minmax(var(--first), 1fr) minmax(0, 1fr); margin-left: calc(var(--pic) + 12px); padding-bottom: 8px;
      font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-faint); white-space: nowrap; }
    .fbx .b { display: grid; grid-template-columns: var(--pic) 1fr; column-gap: 12px; padding: 14px 0; border-top: 1px solid var(--glass-border); }
    .fbx .b:last-child { padding-bottom: 0; }
    .fbx .pic { width: var(--pic); height: calc(var(--pic) * 0.82); display: flex; align-items: center; justify-content: center; }
    .fbx .pic img { max-width: 100%; max-height: 100%; filter: drop-shadow(0 3px 5px rgba(0,0,0,.45)); }
    .fbx .name { font-size: 14.5px; font-weight: 800; color: var(--text); }
    .fbx .desc { margin-top: 3px; font-size: 12.5px; font-weight: 500; line-height: 1.4; color: var(--text-muted); }
    .fbx .pts { display: grid; grid-template-columns: var(--label) minmax(var(--first), 1fr) minmax(0, 1fr); row-gap: 5px; margin-top: 10px; align-items: center; }
    .fbx .pts em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .fbx .pts span { display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
    .fbx .pts span img { width: 16px; height: 16px; object-fit: contain; }
    .fbx .pts span small { font-size: 11.5px; font-weight: 700; color: var(--text-muted); margin-left: -3px; }
    .fbx .bonus { display: flex; align-items: center; gap: 14px; margin-top: 9px; }
    .fbx .bonus em { width: var(--label); flex: none; margin-right: -14px; font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .fbx .bonus .plan-tip { display: inline-flex; align-items: center; gap: 6px; }
    .fbx .bonus .plan-tip img { width: 24px; height: 24px; }
    .fbx .bonus .plan-tip > b { font-size: 14px; font-weight: 800; color: #86D45E; }
    .fbx .bonus .tip { left: -12px; right: auto; }
    .fbx .bonus .tip.shown { display: block; }
  `;
  document.head.appendChild(style);
  // the generic glass and the site's own colour for lines, as on Results
  panel.style.background = 'var(--glass)'; panel.style.boxShadow = 'var(--glass-shadow)';
  const tabRow = panel.querySelector('.info-tabs');
  tabRow.style.setProperty('--tab-color', 'var(--accent)');
  tabRow.innerHTML = ['Timeline', 'Rules', 'Buildings', 'Rewards', 'Results'].map(t => `<button type="button" class="info-tab" role="tab" aria-selected="${t === 'Buildings'}">${t}</button>`).join('');
  for (const edit of Array.from(panel.querySelectorAll('.edit-button'))) edit.style.setProperty('--edit-colour', 'var(--accent)');
  const A = './images/foundry/points-alliance.png', P = './images/foundry/points-personal.png';
  const bonus = (icon, value, words, open) => `<span class="plan-tip" tabindex="0"><img src="./images/foundry/${icon}.png" alt=""><b>${value}</b><span class="tip${open ? ' shown' : ''}">${words}: ${value}</span></span>`;
  const buildings = [
    ['imperial-foundry', 'Imperial Foundry', 'The empire is no more, but its Foundry still stands! Occupy it to obtain new weapons of war and Arsenal Points.', '9,000', '1,800', '4,500', '900', ''],
    ['prototype-site', 'Prototype Site I and II', 'Many of the Foundry\'s most famous weapons were tested in one of two Prototype Sites to the southwest and northeast.', '6,000', '1,200', '3,000', '600', ''],
    ['repair-facility', 'Repair Facility I to IV', 'Four smaller installations used to repair the Foundry\'s equipment, located in different corners of the facility.', '3,000', '600', '1,500', '300', ''],
    ['munitions-warehouse', 'Munitions Warehouse', 'The old Munitions Warehouse was a storage site for Foundry cannons. Surely whoever controls the Warehouse and its relics shall enjoy a great advantage.', '1,200', '240', '600', '120',
      bonus('bonus-damage-boost', '+15%', 'Troop damage boost', showTip) + bonus('bonus-damage-reduction', '-15%', 'Troop damage reduction')],
    ['mercenary-camp', 'Mercenary Camp', 'Mercenaries are always to be found wherever rumors of war and riches abound. Control the Mercenary Camp to dispatch up to four increasingly damaging strike teams against an enemy building, reducing enemy\'s Attack and Defense.', '1,200', '240', '600', '120', ''],
    ['transit-station', 'Transit Station', 'An essential transit hub for the Foundry, seize it to enjoy a shorter cooldown time for the free Advanced Teleporter.', '1,200', '240', '600', '120', bonus('bonus-teleport-cooldown', '-50%', 'Teleport cooldown reduction')],
    ['boiler-room', 'Boiler Room', 'The Boiler Room still works, miraculously! Take control to increase your Arsenal Point gains and obtain an additional battlefield boost.', '1,200', '240', '600', '120', bonus('bonus-control-time', '-50%', 'Reduced control time needed')],
  ];
  const pts = (img, v) => `<span><img src="${img}" alt="">${v}</span>`, per = (img, v) => `<span><img src="${img}" alt="">+${v}<small>/m</small></span>`;
  const html = `<div class="event-folds"><div class="points-list tab-page buildings-tab"><div class="fbx">` +
    `<div class="cols"><span></span><span>First control</span><span>Ongoing</span></div>` +
    buildings.map(([img, name, desc, a1, a2, p1, p2, bon]) => `<div class="b"><span class="pic"><img src="./images/foundry/${img}.png" alt=""></span><div>` +
      `<div class="name">${name}</div><div class="desc">${desc}</div>` +
      `<div class="pts"><em>Alliance</em>${pts(A, a1)}${per(A, a2)}<em>Personal</em>${pts(P, p1)}${per(P, p2)}</div>` +
      (bon ? `<div class="bonus"><em>Bonus</em>${bon}</div>` : '') + `</div></div>`).join('') +
    `</div></div></div>`;
  panel.querySelector('.event-page-body').innerHTML = html;
  // Foundry has no rule line (decided 28 Nov)
  for (const el of Array.from(panel.querySelectorAll('*'))) if (el.children.length === 0 && el.textContent.trim() === 'Be in the right alliance before registration ends.') el.remove();
  window.dispatchEvent(new Event('resize'));
  if (tabRow.scrollWidth > tabRow.clientWidth + 1) tabRow.classList.add('more-right');   // the row scrolls: fade at its edge, as the site does
}
"""
MEASURE = "() => { const body = document.querySelector('.event-page-body'); const panel = document.querySelector('.event-page'); return panel.getBoundingClientRect().top + window.scrollY + (panel.scrollHeight - body.clientHeight) + body.scrollHeight + 40 }"
shoot.serve('/tmp/rb', 8825)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for (W, H, S, tag, tip) in [(384, 832, 2.8125, 'phone', False), (384, 832, 2.8125, 'phone-hover', True), (1536, 864, 1.25, 'laptop', True), (2560, 1440, 1, 'monitor', True)]:
        pg = page.open_site(b, 8825, W, H, S)
        pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
        pg.evaluate(OPEN, 's-foundry|2026-11-09|ph5'); pg.clock.run_for(1500)
        pg.evaluate(MOCK, [tip]); pg.clock.run_for(800)
        if tag == 'phone':
            h = pg.evaluate(MEASURE); pg.set_viewport_size({'width': 384, 'height': max(832, int(h))}); pg.clock.run_for(500)
        if tag == 'phone-hover':
            pg.evaluate("() => { const t = document.querySelector('.tip.shown').closest('.b'); const body = document.querySelector('.event-page-body'); body.scrollTop = t.offsetTop - 120; }"); pg.clock.run_for(300)
        pg.screenshot(path=f'/tmp/fmock/foundry-buildings-{tag}.png'); pg.close()
    b.close()
