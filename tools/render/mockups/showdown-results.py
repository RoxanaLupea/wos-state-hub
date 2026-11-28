# Showdown's Results tab (Roxanne, 28 Nov night): the Total score table we had, changed as she said.
import sys, json
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot, page
from playwright.sync_api import sync_playwright
PREFS = {'categories': ['state','alliance','personal','deals'], 'hiddenEvents': [], 'followedScheduleIds': [], 'calendarView': 'month', 'timeMode': 'game', 'myAllianceId': 'dvl'}
OPEN = "key => { const b = document.createElement('button'); b.setAttribute('data-open-event', key); document.body.appendChild(b); b.click(); b.remove(); }"
MOCK = r"""
() => {
  const panel = document.querySelector('.event-page');
  const style = document.createElement('style');
  style.textContent = `
    .sd .score-head { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); align-items: baseline; row-gap: 2px; column-gap: 8px; padding: 4px 4px 14px; }
    .sd .tag { font-size: 21px; font-weight: 900; letter-spacing: .02em; }
    .sd .tag.us { color: #8EC5FF; } .sd .tag.them { color: #F2A0A0; text-align: right; }
    .sd .total { display: flex; align-items: center; gap: 6px; font-size: 22px; font-weight: 900; white-space: nowrap; align-self: center; }
    .sd .total .us { color: #8EC5FF; } .sd .total .them { color: #F2A0A0; } .sd .total .dash { color: var(--text-faint); }
    .sd .total img { width: 22px; height: 22px; object-fit: contain; }
    .sd .names { grid-column: 1 / 4; display: flex; justify-content: space-between; gap: 12px; }
    .sd .name { font-size: 12.5px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
    .sd .name.them { text-align: right; }
    .sd .name b { font-weight: 700; color: var(--text-faint); }
    .sd table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .sd th { padding: 6px 4px; text-align: left; font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--text-faint); white-space: nowrap; }
    .sd td { padding: 9px 3px; border-top: 1px solid var(--glass-border); vertical-align: middle; }
    .sd .stage { width: 22px; text-align: center; font-weight: 800; color: var(--text-faint); }
    .sd .day b { display: block; font-weight: 600; color: var(--text); }
    .sd .day small { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .sd .day small .us { color: #8EC5FF; } .sd .day small .them { color: #F2A0A0; } .sd .day small .dash { color: var(--text-faint); }
    .sd .num { width: 28px; text-align: center; font-weight: 800; }
    .sd th.num img { width: 18px; height: 18px; object-fit: contain; vertical-align: -4px; }
    .sd .who { width: 34px; font-weight: 800; } .sd .who.us { color: #8EC5FF; } .sd .who.them { color: #F2A0A0; } .sd .who.tie { color: var(--text-muted); }
    .sd .mvp { white-space: nowrap; }
    .sd .mvp .p { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; line-height: 1.2; color: var(--text); }
    .sd .mvp .p + .p { margin-top: 4px; }
    .sd .mvp .pic { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex: none; }
    .sd .mvp .pic img { width: 100%; height: 100%; object-fit: cover; }
    .sd .mvp i { display: block; font-style: normal; font-size: 10.5px; color: var(--text-muted); }
    .sd .days { display: flex; flex-direction: column; gap: 18px; margin-top: 4px; }
    .sd .line1 { display: grid; grid-template-columns: 60px minmax(0, 1fr) 60px; align-items: baseline; }
    .sd .line1 > span { font-size: 15px; font-weight: 800; color: var(--text-faint); font-variant-numeric: tabular-nums; }
    .sd .line1 > span.led { color: var(--text); }
    .sd .line1 > span:last-child { text-align: right; }
    .sd .dname { font-size: 12.5px; font-weight: 700; color: var(--text-muted); text-align: center; }
    .sd .day-item .svs-split { margin-top: 5px; }
    .sd .line2 { display: grid; grid-template-columns: 60px minmax(0, 1fr) 60px; align-items: center; margin-top: 7px; }
    .sd .line2 > .p { justify-self: center; }
    .sd .line2 > span:last-child { justify-self: end; }
    .sd .horns { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 800; color: #F4CF63; }
    .sd .horns img { width: 18px; height: 18px; object-fit: contain; }
    .sd .line2 .p { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text); }
    .sd .line2 .pic { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex: none; }
    .sd .line2 .pic img { width: 100%; height: 100%; object-fit: cover; }
    .sd .line2 .p i { font-style: normal; color: var(--text-muted); }
  `;
  document.head.appendChild(style);
  // one Results tab instead of Total score and Results
  const tabs = panel.querySelector('.info-tabs');
  const tabStyle = tabs.getAttribute('style');
  (tabs.closest('.info-tab-line') ?? tabs).outerHTML = `<div class="info-tab-line"><div class="info-tabs" role="tablist" style="${tabStyle}">` +
    ['Timeline', 'Rules', 'Rewards', 'Results'].map(t => `<button type="button" class="info-tab" role="tab" aria-selected="${t === 'Results'}">${t}</button>`).join('') + '</div>' +
    `<span class="tab-actions"><button type="button" class="edit-button"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span><span class="words">Edit</span></span></button></span></div>`;
  panel.querySelector('.row-buttons')?.replaceChildren();
  const horn = '<img src="./images/items/horn-gold.webp" alt="">';
  const pics = ['heroes/jeronimo', 'heroes/natalia', 'heroes/molly', 'heroes/zinman', 'heroes/gordon', 'heroes/hector', 'heroes/flint'];
  const user = (i, tag, n) => `<span class="p"><span class="pic"><img src="./images/${pics[i]}.webp" alt=""></span><span><i>[${tag}]</i>${n}</span></span>`;
  // day, its horns, the winner, our points, theirs, its MVPs
  const days = [['Rise of the City', 1, 'us', '18.4M', '15.2M', [[0, 'DVL', 'Roxanne']]], ['Hero Development', 2, 'them', '9.6M', '12.1M', [[5, 'MIS', 'Starling']]],
    ['Pet Training', 2, 'us', '14.0M', '8.7M', [[2, 'DVL', 'Moonfang']]], ['Gear Enhancement', 2, 'tie', '11.3M', '11.3M', [[6, 'MIS', 'Noirin']]],
    ['Trade Dominion', 2, 'us', '20.7M', '16.9M', [[0, 'DVL', 'Roxanne']]], ['Full-Scale Competition', 4, 'us', '35.2M', '28.4M', [[1, 'DVL', 'Kael']]]];
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const html = '<div class="event-folds"><div class="points-list tab-page results-tab"><div class="sd">' +
    '<div class="score-head"><span class="tag us">DVL</span>' +
    `<span class="total">${horn}<span class="us">9</span><span class="dash">–</span><span class="them">2</span>${horn}</span><span class="tag them">MIS</span>` +
    '<span class="names"><span class="name">DEVILEMPIRE <b>#1458</b></span><span class="name them">LegacyofMisfits <b>#1040</b></span></span></div>' +
    '<div class="days">' + days.map(([day, worth, who, ours, theirs, mvps]) => {
      const value = v => parseFloat(v);
      const share = (100 * value(ours) / (value(ours) + value(theirs))).toFixed(1);
      const [p, tag, n] = mvps[0];
      const won = side => who === side ? `<span class="horns">${worth}${horn}</span>` : '<span></span>';
      return `<div class="day-item"><div class="line1"><span class="${value(ours) >= value(theirs) ? 'led' : ''}">${ours}</span>` +
        `<b class="dname">${day}</b><span class="${value(theirs) >= value(ours) ? 'led' : ''}">${theirs}</span></div>` +
        `<div class="svs-split" style="--share:${share}"></div>` +
        `<div class="line2">${won('us')}${user(p, tag, n)}${won('them')}</div></div>`; }).join('') + '</div>' +
    '</div></div></div>';
  panel.querySelector('.event-page-body').innerHTML = html;
}
"""
MEASURE = "() => { const body = document.querySelector('.event-page-body'); const panel = document.querySelector('.event-page'); return panel.getBoundingClientRect().top + window.scrollY + (panel.scrollHeight - body.clientHeight) + body.scrollHeight + 40 }"
shoot.serve('/tmp/rb', 8836)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for (W, H, S, tag) in [(384, 832, 2.8125, 'phone'), (1536, 864, 1.25, 'laptop'), (2560, 1440, 1, 'monitor')]:
        pg = page.open_site(b, 8836, W, H, S)
        pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
        pg.evaluate(OPEN, 's-showdown|2026-11-09'); pg.clock.run_for(1200)
        pg.evaluate(MOCK); pg.clock.run_for(600)
        if tag == 'phone':
            h = pg.evaluate(MEASURE); pg.set_viewport_size({'width': 384, 'height': max(832, int(h))}); pg.clock.run_for(500)
        pg.evaluate("() => { for (const i of Array.from(document.images)) i.loading = 'eager'; }"); pg.wait_for_timeout(1200); pg.clock.run_for(300)
        pg.screenshot(path=f'/tmp/fmock/showdown-score-{tag}.png'); pg.close()
    b.close()
