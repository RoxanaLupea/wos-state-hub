import sys, json
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot, page
from playwright.sync_api import sync_playwright
PREFS = {'categories': ['state','alliance','personal','deals'], 'hiddenEvents': [], 'followedScheduleIds': [], 'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = "key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key); document.body.appendChild(b); b.click(); b.remove(); }"
MOCK = r"""
([open, layout, sep, count, won, system]) => {
  const legions = [['DVL', 1], ['DVL', 2], ['dvl', 1], ['dvl', 2]].slice(0, count);
  const panel = document.querySelector('.event-page');
  const style = document.createElement('style');
  style.textContent = `
    .fr2 { --ev: #9CC07A; --ev-dark: #6E9A55; --gold: #E8F2DE; }
    .fr2 .fr2-field { margin-top: 2px; }
    .fr2 .fr2-result { text-align: center; font-size: 22px; font-weight: 900; font-style: italic; letter-spacing: .02em; color: var(--ev); line-height: 1; }
    .fr2 .fr2-when { text-align: center; margin-top: 6px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .fr2 .fr2-sides { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 14px; }
    .fr2 .fr2-side { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; text-align: center; }
    .fr2 .fr2-side b { font-size: 17px; font-weight: 800; color: var(--text); white-space: nowrap; } .fr2 .fr2-side.theirs b { color: var(--text-muted); }
    .fr2 .fr2-side small { font-size: 11.5px; font-weight: 600; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .fr2 .fr2-vs { font-size: 18px; font-weight: 900; font-style: italic; color: var(--text-faint); padding: 0 8px; }
    .fr2 .fr2-totals { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 14px; }
    .fr2 .fr2-totals strong { font-size: 24px; font-weight: 900; color: var(--ev); font-variant-numeric: tabular-nums; text-align: center; line-height: 1; } .fr2 .fr2-totals strong:last-child { color: var(--text-faint); }
    .fr2 .fr2-totals span { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); text-align: center; line-height: 1.2; padding: 0 6px; }
    .fr2 .fr2-bands { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
    .fr2 .fr2-band { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 34px; padding: 0 12px; border-radius: 10px; background: rgba(255,255,255,0.06); }
    .fr2 .fr2-band > span { font-size: 15px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
    .fr2 .fr2-band > span.behind { color: var(--text-faint); }
    .fr2 .fr2-band > span:last-child { text-align: right; }

    .fr2 .fr2-band > em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-muted); text-align: center; padding: 0 6px; }
    .fr2 .fr2-mvp { display: flex; align-items: center; gap: 7px; margin: 6px 0 2px 6px; }
    .fr2 .fr2-mvp .pic { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex: none; box-shadow: 0 0 0 1.5px var(--ev); }
    .fr2 .fr2-mvp .pic img { width: 100%; height: 100%; object-fit: cover; }
    .fr2 .fr2-mvp .mvp { font-size: 9.5px; font-weight: 900; letter-spacing: .06em; color: var(--ev); }
    .fr2 .fr2-mvp .name { font-size: 12.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fr2 .fr2-mvp .name i { font-style: normal; color: var(--text-muted); font-weight: 700; }
    .fr2 .fr2-mvp .amount { margin-left: auto; margin-right: 6px; font-size: 12.5px; font-weight: 800; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .fr2 details.fr-members { margin-top: 22px; }
    .fr2.system-A .fr2-totals strong:first-child { color: var(--accent); }
    .fr2.system-bands .fr2-totals strong:first-child, .fr2.system-glow .fr2-totals strong:first-child { color: var(--accent); }
    .fr2.system-bands .fr2-band { background: color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.04)); }
    .fr2.system-glow { position: relative; isolation: isolate; }
    .fr2.system-glow::before { content: ''; position: absolute; left: 0; right: 0; top: -40px; height: 300px; z-index: -1; pointer-events: none;
      background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 34%, transparent), transparent); }
    .fr2.system-B .fr2-totals strong:first-child, .fr2.system-B .fr2-totals.lost strong:first-child, .fr2.system-B .fr2-band > span:first-child { color: #9CC07A; }
    .fr2.system-B .fr2-totals strong:last-child, .fr2.system-B .fr2-totals.lost strong:last-child, .fr2.system-B .fr2-band > span:last-child { color: var(--notice-red); }
    .fr2.system-B .fr2-band > span.behind, .fr2.system-B .fr2-totals strong.behind { opacity: .5; }
    .fr2 .fr2-head { display: grid; grid-template-columns: auto minmax(0,1fr) auto minmax(0,1fr) auto; align-items: center; column-gap: 6px; margin-top: 14px; }
    .fr2 .fr2-head .state { font-size: 14px; font-weight: 800; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .fr2 .fr2-result.lost { color: var(--notice-red); }
    .fr2 .fr2-totals.lost strong:first-child { color: var(--notice-red); }
    .fr2 .fr2-totals.lost strong:last-child { color: var(--text); }
    .fr2 .fr2-mvps-title { margin-top: 22px; text-align: center; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
    .fr2 .fr2-mvps { margin-top: 12px; display: grid; }
    .fr2 .fr2-mvps.strip { grid-template-columns: repeat(4, minmax(0, 1fr)); column-gap: 6px; }
    .fr2 .fr2-mvps.grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 10px; }
    .fr2 .fr2-star { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; }
    .fr2 .fr2-star .what { font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); }
    .fr2 .fr2-star .pic { margin-top: 7px; width: 46px; height: 46px; border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 2px rgba(255,255,255,0.35); }
    .fr2 .fr2-mvps.grid .fr2-star .pic { width: 54px; height: 54px; }
    .fr2 .fr2-star .pic img { width: 100%; height: 100%; object-fit: cover; }
    .fr2 .fr2-star .name { margin-top: 7px; font-size: 12.5px; font-weight: 700; line-height: 1.25; color: var(--text); max-width: 100%; overflow-wrap: anywhere; }
    .fr2 .fr2-star .name i { display: block; font-style: normal; color: var(--text-muted); }
    .fr2 .fr2-star .amount { margin-top: 2px; font-size: 13px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
    .fr2 details.fr-members > summary { list-style: none; display: flex; align-items: center; cursor: pointer; }
    .fr2 details.fr-members > summary::-webkit-details-marker { display: none; }
    .fr2 .fr-list { display: flex; flex-direction: column; gap: 8px; margin: 12px 12px 0 12px !important; padding: 0 !important; }
    .fr2 .fr-member { display: grid; grid-template-columns: 22px 26px minmax(0,1fr) auto; align-items: center; column-gap: 8px; }
    .fr2 .fr-member > span:first-child { font-size: 12px; font-weight: 800; color: var(--text-muted); text-align: right; }
    .fr2 .fr-pic { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; }
    .fr2 .fr-pic img { width: 100%; height: 100%; object-fit: cover; }
    .fr2 .fr-name { font-size: 13px; font-weight: 600; color: var(--text); }
    .fr2 .fr-name i { font-style: normal; color: var(--text-muted); font-weight: 700; }
    .fr2 .fr-amount { font-size: 13px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
    .fr2 .fr-member.zero .fr-amount { color: var(--text-faint); }
    .event-page .legion-tabs .info-tab { white-space: nowrap; padding-left: 4px; padding-right: 4px; }
    .event-page .legion-tabs .lt-tag { display:inline-block; box-sizing: content-box; width: var(--tag-width, 34px); text-align:center; text-transform: none; font-family: var(--tag-font);
      font-size: 10.5px; font-weight: 800; letter-spacing: .05em; color: var(--c); padding: 1px 5px; border-radius: 999px;
      background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent); }`;
  document.head.appendChild(style);
  panel.querySelector('.row-buttons').innerHTML = '';
  const note = [...panel.querySelectorAll('p, div, span')].find(e => e.children.length === 0 && e.textContent.trim() === 'Be in the right alliance before registration ends.');
  if (note) note.remove();
  const tabs = panel.querySelector('.info-tabs');
  const tabStyle = tabs.getAttribute('style');
  (tabs.closest('.info-tab-line') ?? tabs).outerHTML = `<div class="info-tab-line"><div class="info-tabs" role="tablist" style="${tabStyle}">` +
    `<button type="button" class="info-tab" role="tab" aria-selected="false">Timeline</button><button type="button" class="info-tab" role="tab" aria-selected="true">Results</button></div>` +
    `<span class="tab-actions"><button type="button" class="edit-button"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span><span class="words">Edit</span></span></button></span></div>`;
  const DVL = '#C2A4E8', ACADEMY = 'color-mix(in srgb, #C2A4E8 62%, white)';
  const pics = ['heroes/jeronimo', 'heroes/natalia', 'heroes/molly', 'heroes/zinman', 'heroes/gordon', 'heroes/hector', 'heroes/flint', 'heroes/philly', 'heroes/alonso', 'heroes/logan', 'heroes/mia', 'heroes/greg'];
  const img = i => `<img src="./images/${pics[i % pics.length]}.webp" alt="">`;
  const LOST = { 'Control Rewards': ['188,420', '251,930', false], 'Gathering Rewards': ['41,310', '29,870', true], 'Loot Rewards': ['9,640', '14,220', false],
    'KO Rewards': ['31.4M', '48.9M', false], 'Foundry Control': ['00:12:05', '00:31:46', false], 'Mercenary Sieges': ['1', '3', false] };
  const band = (a, label, b, x, mvp) => won ? bandOf(a, label, b, true, mvp) : bandOf(LOST[label][0], label, LOST[label][1], LOST[label][2], mvp);
  const bandOf = (ours, label, theirs, oursLeads, mvp) => `<div><div class="fr2-band"><span class="${oursLeads ? '' : 'behind'}">${ours}</span><em>${label}</em><span class="${oursLeads ? 'behind' : ''}">${theirs}</span></div>` +
    (mvp ? `<div class="fr2-mvp"><span class="pic">${img(mvp[0])}</span><span class="mvp">MVP</span><span class="name"><i>[DVL]</i>${mvp[1]}</span><span class="amount">${mvp[2]}</span></div>` : '') + '</div>';
  const names = ['Roxanne', 'Kael', 'Moonfang', 'Blitz', 'Ivy', 'Sora', 'Tundra Rex', 'Nyx', 'Odin', 'Pixel', 'Grizz', 'Lumen'];
  const points = [182400, 151230, 120880, 98410, 87300, 66120, 51900, 40450, 31220, 22800, 12050, 0];
  const members = names.map((n, i) => `<div class="fr-member${points[i] ? '' : ' zero'}"><span>${i + 1}</span><span class="fr-pic">${img(i)}</span><span class="fr-name"><i>[DVL]</i>${n}</span><span class="fr-amount">${points[i].toLocaleString('en-US')}</span></div>`).join('');
  const legionTabs = `<div class="info-tabs rank-tabs sub-tabs legion-tabs" role="tablist" style="${tabStyle}">` +
    legions.map(([tag, n], i) => `<button type="button" class="info-tab" role="tab" aria-selected="${i === 0}" data-short="${tag} ${sep} L${n}">${tag} ${sep} Legion ${n}</button>`).join('') + '</div>';
  const probe = document.createElement('span'); probe.className = 'lt-tag'; probe.style.cssText = 'position:absolute;visibility:hidden;width:auto;font-size:10.5px;font-weight:800;padding:1px 5px'; probe.textContent = 'WWWW';
  document.body.appendChild(probe); panel.style.setProperty('--tag-width', getComputedStyle(probe).width); probe.remove();
  const html = `<div class="event-folds"><div class="points-list tab-page results-tab">${legionTabs}<div class="fr2">` +
    `<div class="fr2-field"><div class="fr2-result${won ? '' : ' lost'}">${won ? 'Victory' : 'Defeat'}</div>` +
    `<div class="fr2-sides"><span class="fr2-side"><b>#1458 [DVL]</b><small>DEVILEMPIRE</small></span><span class="fr2-vs">VS</span>` +
    `<span class="fr2-side theirs"><b>[MIS] #1040</b><small>LegacyofMisfits</small></span></div>` +
    `<div class="fr2-totals${won ? '' : ' lost'}"><strong class="${won ? '' : 'behind'}">${won ? '456,304' : '239,370'}</strong><span>Arsenal<br>Points</span><strong class="${won ? 'behind' : ''}">${won ? '36,068' : '296,020'}</strong></div>` +
    `<div class="fr2-bands">` +
    band('391,354', 'Control Rewards', '10,316', true) +
    band('48,696', 'Gathering Rewards', '15,652', true) +
    band('16,254', 'Loot Rewards', '10,100', true) +
    band('62.1M', 'KO Rewards', '27.9M', true) +
    band('00:43:51', 'Foundry Control', '00:00:00', true) +
    band('3', 'Mercenary Sieges', '1', true) + `</div></div>` +
    `<div class="fr2-mvps-title">MVPs</div><div class="fr2-mvps ${layout}">` +
    [['Control', 0, 'Roxanne', '96,300'], ['Gathering', 1, 'Kael', '12,480'], ['Loot', 2, 'Moonfang', '4,210'], ['KO', 3, 'Blitz', '18.2M']].map(([what, i, n, a]) =>
      `<div class="fr2-star"><span class="what">${what}</span><span class="pic">${img(i)}</span><span class="name"><i>[DVL]</i>${n}</span><span class="amount">${a}</span></div>`).join('') + '</div>' +
    `<details class="points-list fr-members"${open ? ' open' : ''}><summary><h3 class="panel-title part-title" style="margin:0">Members<b></b></h3><span style="margin-left:auto;margin-right:14px;color:var(--text-muted);font-size:13px;font-weight:700">12</span></summary>` +
    `<div class="fr-list">${members}</div></details></div></div></div>`;
  panel.querySelector('.event-page-body').innerHTML = html;
  // The result picks the accent: green on a win, red on a defeat, for everything that accents it.
  const accent = won ? '#9CC07A' : '#E0503A';
  const legionRow = panel.querySelector('.legion-tabs');
  const result = panel.querySelector('.fr2'); result.classList.add('system-' + system); result.style.setProperty('--accent', accent);
  panel.querySelector('.event-folds').style.setProperty('--fold-color', '#9CC07A');
  const row = panel.querySelector('.legion-tabs');
  const fits = () => [...row.children].every(tab => tab.scrollWidth <= tab.clientWidth + 1) && row.scrollWidth <= row.clientWidth + 1;
  if (!fits()) for (const tab of row.children) tab.textContent = tab.dataset.short;
}
"""
shoot.serve('/tmp/rb', 8823)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for open_, sep, count, won, system, name in [('strip', '·', 3, True, 'A', 'plain-members')]:
        pg = page.open_site(b, 8823, 384, 832, 2.8125)
        pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
        pg.evaluate(OPEN, 's-foundry|2026-11-09|ph5'); pg.clock.run_for(1500)
        pg.evaluate(MOCK, [name.endswith('members'), open_, sep, count, won, system]); pg.clock.run_for(600)
        h = pg.evaluate("() => { const body = document.querySelector('.event-page-body'); const panel = document.querySelector('.event-page'); return panel.getBoundingClientRect().top + window.scrollY + (panel.scrollHeight - body.clientHeight) + body.scrollHeight + 40 }")
        pg.set_viewport_size({'width': 384, 'height': max(832, int(h))}); pg.clock.run_for(500)
        pg.screenshot(path=f'/tmp/fmock/foundry-system-{name}.png'); pg.close()
    b.close()
