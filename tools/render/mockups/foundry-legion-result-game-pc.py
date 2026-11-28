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
    .fb { position: relative; margin-top: 2px; isolation: isolate; --w: 300px; }
    .fb .art { position: absolute; left: 0; top: 0; z-index: -1; overflow: visible; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.22)); }
    .fb .blur { position: absolute; left: 0; top: 0; z-index: -2; backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%); }
    .fb .verdict { position: absolute; left: 0; right: 0; z-index: 4; display: flex; justify-content: center; }
    .fb .verdict::before { content: ''; position: absolute; left: 4%; right: 4%; top: -10px; bottom: -10px; z-index: -1;
      background: radial-gradient(closest-side, var(--glow), transparent); }
    .fb .verdict b { font-size: calc(var(--w) * 0.078); font-weight: 900; font-style: italic; color: var(--word); text-shadow: 0 0 10px var(--glow), 0 2px 3px rgba(0,0,0,.4); }
    .fb .vs { align-self: center; z-index: 3; padding: 0.06em 0.12em; font-size: calc(var(--w) * 0.10); font-weight: 900; font-style: italic;
      letter-spacing: -0.02em; background: linear-gradient(180deg, #FFFFFF 25%, #D6ECFF 60%, #A9D2F2); -webkit-background-clip: text; background-clip: text; color: transparent;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,.45)); }
    .fb .sides { position: relative; display: grid; grid-template-columns: 1fr auto 1fr; column-gap: 0; padding: 0 26px; }
    .fb .side { display: flex; flex-direction: column; align-items: flex-start; text-align: left; min-width: 0; }
    .fb .side.theirs { align-items: flex-end; text-align: right; }
    .fb .flag { height: calc(var(--w) * 0.17); display: flex; align-items: flex-end; }
    .fb .flag img { height: 100%; }
    .fb .pennant { width: calc(var(--w) * 0.12); height: calc(var(--w) * 0.155); display: flex; align-items: center; justify-content: center; padding-bottom: 6px; box-sizing: border-box;
      clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%); background: rgba(225,90,70,0.75); font-size: 11px; font-weight: 900; color: #fff; }
    .fb .side b { margin-top: 5px; font-size: 15px; font-weight: 800; color: #fff; white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,.35); }
    .fb .side small { margin-top: 1px; font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .fb .totals { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 10px 14px 0; }
    .fb .totals strong { display: flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 5px 12px; border-radius: 8px; font-size: 21px; font-weight: 900; color: #F4CF63;
      font-variant-numeric: tabular-nums; text-shadow: 0 1px 2px rgba(0,0,0,.3); }
    .fb .totals strong.ours { background: rgba(79,120,200,0.42); padding-left: 9px; } .fb .totals strong.theirs { background: rgba(215,70,55,0.38); justify-content: flex-end; }
    .fb .totals svg { width: 15px; height: 15px; flex: none; }
    .fb .rows { display: flex; flex-direction: column; gap: 6px; margin: 12px 14px 0; }
    .fb .row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 31px; padding: 0 12px; border-radius: 10px; background: rgba(10, 14, 26, 0.40); }
    .fb .row span { font-size: 15px; font-weight: 800; color: #F4CF63; font-variant-numeric: tabular-nums; }
    .fb .row span:last-child { text-align: right; }
    .fb .row em { font-style: normal; font-size: 11.5px; font-weight: 700; color: #fff; text-align: center; padding: 0 6px; }
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
    .fr2 .fr2-mvps-title { margin-top: 22px; text-align: center; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
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
    `<div class="fb" style="--word:${won ? '#F6D66A' : '#FFC2B6'};--glow:${won ? 'rgba(240,200,90,0.55)' : 'rgba(230,80,60,0.55)'}">` +
    `<svg class="art"></svg><div class="verdict"><b>${won ? 'Victory!' : 'Defeat'}</b></div>` +
    `<div class="sides"><span class="side"><b>#1458 [DVL]</b><small>DEVILEMPIRE</small></span><div class="vs">VS</div>` +
    `<span class="side theirs"><b>[MIS] #1040</b><small>LegacyofMisfits</small></span></div>` +
    `<div class="totals"><strong class="ours"><svg viewBox="0 0 16 16" aria-hidden="true"><g transform="rotate(-40 8 8)"><rect x="5.5" y="5" width="5" height="9" rx="1" fill="#E9B44C"/><path d="M5.5 6 Q8 -1 10.5 6 Z" fill="#F6D27A"/><rect x="5.5" y="11.5" width="5" height="1.2" fill="#B9852A"/></g></svg>${won ? '456,304' : '239,370'}</strong><strong class="theirs"><svg viewBox="0 0 16 16" aria-hidden="true"><g transform="rotate(-40 8 8)"><rect x="5.5" y="5" width="5" height="9" rx="1" fill="#E9B44C"/><path d="M5.5 6 Q8 -1 10.5 6 Z" fill="#F6D27A"/><rect x="5.5" y="11.5" width="5" height="1.2" fill="#B9852A"/></g></svg>${won ? '36,068' : '296,020'}</strong></div>` +
    `<div class="rows">` + [['391,354','Control Rewards','10,316','188,420','251,930'],['48,696','Gathering Rewards','15,652','41,310','29,870'],['16,254','Loot Rewards','10,100','9,640','14,220'],['62.1M','KO Rewards','27.9M','31.4M','48.9M'],['00:43:51','Foundry Control','00:00:00','00:12:05','00:31:46']].map(([a1, l, b1, a2, b2]) => `<div class="row"><span>${won ? a1 : a2}</span><em>${l}</em><span>${won ? b1 : b2}</span></div>`).join('') + `</div></div>` +
    `<div class="fr2-mvps-title">MVPs</div><div class="fr2-mvps ${layout}">` +
    [['Control', 0, 'Roxanne', '96,300'], ['Gathering', 1, 'Kael', '12,480'], ['Loot', 2, 'Moonfang', '4,210'], ['KO', 3, 'Blitz', '18.2M']].map(([what, i, n, a]) =>
      `<div class="fr2-star"><span class="what">${what}</span><span class="pic">${img(i)}</span><span class="name"><i>[DVL]</i>${n}</span><span class="amount">${a}</span></div>`).join('') + '</div>' +
    `<details class="points-list fr-members"${open ? ' open' : ''}><summary><h3 class="panel-title part-title" style="margin:0">Members<b></b></h3><span style="margin-left:auto;margin-right:14px;color:var(--text-muted);font-size:13px;font-weight:700">12</span></summary>` +
    `<div class="fr-list">${members}</div></details></div></div></div>`;
  panel.querySelector('.event-page-body').innerHTML = html;
  const fb = panel.querySelector('.fb');
  if (fb) {
    // The game's victory screen, measured from its own picture: two halves meeting in the middle, each one's top
    // flat to about a third of the width, then rounding into a 45-degree slope down to the middle; the light glass
    // diamond with VS sits high in that V with a gap all round; the bottom a shallow V the whole width.
    const W = fb.clientWidth; fb.style.setProperty('--w', W + 'px');
    const over = W * 0.13;                       // room above the halves for the diamond and Victory
    fb.style.paddingTop = (over + W * 0.035) + 'px';
    const H = fb.scrollHeight + W * 0.30;        // the halves end below the last row, in their V
    fb.style.height = H + 'px'; fb.style.marginBottom = -(W * 0.30) + 'px';   // the fade runs on behind the MVPs
    const cx = W / 2, top = over, flat = W * 0.37, vDepth = W * 0.075, bDepth = 0, bottom = H;
    const half = (pts, radii) => { const n = pts.length; let d = '';
      for (let i = 0; i < n; i++) { const p = pts[i], pr = pts[(i + n - 1) % n], nx = pts[(i + 1) % n], r = radii[i];
        const tw = (a, b, len) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; const k = Math.min(len, l / 2) / l; return [a[0] + dx * k, a[1] + dy * k]; };
        const a1 = tw(p, pr, r), b1 = tw(p, nx, r);
        d += (i ? 'L' : 'M') + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + ' Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + b1[0].toFixed(1) + ' ' + b1[1].toFixed(1) + ' '; }
      return d + 'Z'; };
    const left = half([[0, top], [flat, top], [cx, top + vDepth], [cx, bottom], [0, bottom]], [30, 5, 0, 0, 0]);
    const right = half([[W, top], [W - flat, top], [cx, top + vDepth], [cx, bottom], [W, bottom]], [30, 5, 0, 0, 0]);
    // the diamond: a third of the width across, centred a little below the halves' top line
    const dc = top + W * 0.135, dr = W * 0.105;
    const diamond = half([[cx, dc - dr], [cx + dr, dc], [cx, dc + dr], [cx - dr, dc]], [12, 12, 12, 12]);
    const art = fb.querySelector('.art'); art.setAttribute('width', W); art.setAttribute('height', H); art.setAttribute('viewBox', `0 0 ${W} ${H}`);
    art.innerHTML = `<defs>
      <linearGradient id="gl" x1="1" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="rgb(124,157,214)" stop-opacity="0.44"/><stop offset="0.55" stop-color="rgb(79,120,200)" stop-opacity="0.32"/><stop offset="1" stop-color="rgb(60,95,170)" stop-opacity="0.36"/></linearGradient>
      <linearGradient id="gr" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="rgb(245,120,95)" stop-opacity="0.42"/><stop offset="0.55" stop-color="rgb(190,60,46)" stop-opacity="0.30"/><stop offset="1" stop-color="rgb(160,44,36)" stop-opacity="0.34"/></linearGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.10"/><stop offset="0.3" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="shade" cx="0.5" cy="0.2" r="0.85"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.08"/></radialGradient>
      <radialGradient id="light" cx="0.5" cy="0.08" r="0.55"><stop offset="0" stop-color="#fff" stop-opacity="0.20"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="streak" x1="0" y1="0" x2="1" y2="1"><stop offset="0.30" stop-color="#fff" stop-opacity="0"/><stop offset="0.40" stop-color="#fff" stop-opacity="0.07"/><stop offset="0.47" stop-color="#fff" stop-opacity="0"/><stop offset="0.62" stop-color="#fff" stop-opacity="0"/><stop offset="0.66" stop-color="#fff" stop-opacity="0.04"/><stop offset="0.70" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <clipPath id="both"><path d="${left}"/><path d="${right}"/></clipPath>
      <linearGradient id="fadeg" gradientUnits="userSpaceOnUse" x1="0" y1="${H - W * 0.36}" x2="0" y2="${H}"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#fadeg)"/></mask></defs><g mask="url(#fade)">
      <path d="${left}" fill="url(#gl)"/><path d="${right}" fill="url(#gr)"/>
      <rect x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#shade)" clip-path="url(#both)"/>
      <rect x="0" y="${top}" width="${W}" height="${H - top}" fill="#fff" filter="url(#grain)" clip-path="url(#both)"/>
      <rect x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#sheen)" clip-path="url(#both)"/>
      <rect x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#light)" clip-path="url(#both)"/>
      <rect x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#streak)" clip-path="url(#both)"/>

      </g>`;
    // the glass: what is behind the halves and the diamond is blurred, as our panels do
    let blur = fb.querySelector('.blur'); if (!blur) { blur = document.createElement('div'); blur.className = 'blur'; fb.prepend(blur); }
    blur.style.width = W + 'px'; blur.style.height = H + 'px'; blur.style.display = 'none'; blur.style.clipPath = `path('${left} ${right} ${diamond}')`; blur.style.webkitMaskImage = blur.style.maskImage = `linear-gradient(#000 ${H - W * 0.36}px, transparent ${H}px)`;
    // VS is slanted: centre its letters, not its box, on the seam
    { const vs = fb.querySelector('.vs'); const range = document.createRange(); range.selectNodeContents(vs);
      const ink = range.getBoundingClientRect(), fbBox = fb.getBoundingClientRect();
      vs.style.transform = `translateX(${(cx - (ink.left + ink.width / 2 - fbBox.left)).toFixed(1)}px)`; }
    const verdict = fb.querySelector('.verdict'); verdict.style.top = (top - W * 0.125) + 'px';
  }
  // The result picks the accent: green on a win, red on a defeat, for everything that accents it.
  const accent = won ? '#9CC07A' : '#E0503A';
  const legionRow = panel.querySelector('.legion-tabs');
  // Foundry: the generic glass panel, not taking the event's colour
  panel.style.background = 'var(--glass)'; panel.style.boxShadow = 'var(--glass-shadow)';
  // and its lines in the site's own colour too: the tab underlines, Edit and the Members arrow
  panel.style.setProperty('--fold-color', 'var(--accent)');
  for (const tabs of Array.from(panel.querySelectorAll('.info-tabs'))) tabs.style.setProperty('--tab-color', 'var(--accent)');
  for (const edit of Array.from(panel.querySelectorAll('.edit-button'))) edit.style.setProperty('--edit-colour', 'var(--accent)');
  const result = panel.querySelector('.fr2'); result.classList.add('system-' + system); result.style.setProperty('--accent', accent);
  panel.querySelector('.event-folds').style.setProperty('--fold-color', 'var(--accent)');
  const row = panel.querySelector('.legion-tabs');
  const fits = () => [...row.children].every(tab => tab.scrollWidth <= tab.clientWidth + 1) && row.scrollWidth <= row.clientWidth + 1;
  if (!fits()) for (const tab of row.children) tab.textContent = tab.dataset.short;
}
"""
shoot.serve('/tmp/rb', 8823)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for (W,H,S,tag) in [(1536,864,1.25,'laptop'),(2560,1440,1,'monitor')]:
      for open_, sep, count, won, system, name in [('strip', '·', 3, True, 'A', 'game-' + tag)]:
        pg = page.open_site(b, 8823, W, H, S)
        pg.evaluate(f"window.localStorage.setItem('stateHub.preferences', {json.dumps(json.dumps(PREFS))})"); pg.reload(); pg.clock.run_for(3000); pg.wait_for_selector('.calendar-panel'); pg.clock.run_for(2000)
        pg.evaluate(OPEN, 's-foundry|2026-11-09|ph5'); pg.clock.run_for(1500)
        pg.evaluate(MOCK, [False, open_, sep, count, won, system]); pg.clock.run_for(600)
        print(pg.evaluate('''() => { const top = document.querySelector('.event-page').getBoundingClientRect().top; const r = e => { const b = e.getBoundingClientRect(); return Math.round(b.top - top) + '-' + Math.round(b.bottom - top); };
          const q = s => document.querySelector(s); return ['.legion-tabs','.verdict b','.fb .sides','.fb .totals','.fb .rows','.fr2-mvps-title','.fr2-mvps','.fr-members','.event-page-body','.event-page'].map(s => s + ' ' + (q(s) ? r(q(s)) : '-')).join('\\n') }'''))
        h = pg.evaluate("() => { const body = document.querySelector('.event-page-body'); const panel = document.querySelector('.event-page'); return panel.getBoundingClientRect().top + window.scrollY + (panel.scrollHeight - body.clientHeight) + body.scrollHeight + 40 }")
        pass
        pg.screenshot(path=f'/tmp/fmock/foundry-result-{name}.png'); pg.close()
    b.close()
