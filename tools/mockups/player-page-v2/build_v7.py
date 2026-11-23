# The player page, version 7, phone only. Version 6 with the leaderboards centred: each of
# the nine is its name on two lines, its value, and its rank under it, so they read as nine
# separate things (her note of 23 Nov, 23:06).
# Also (23:07): the hero's class as a mark in the portrait's corner instead of written under it.
# The game's class icons are not in the repo, so the app draws stand-ins: a shield, a spear, a bow.
# Also (23:09): no arrow on The Labyrinth; a "Labyrinth details" line under it opens its areas.
# Version 6: Version 5 with the rank (R4) beside the name
# instead of the ID (her note of 23 Nov, 23:05).
# Version 5: Version 4 with her notes of 23 Nov, 23:02: the hero
# level and widget on one line like "Exalted · Lvl. 3", and the leaderboards as a 3x3 grid,
# grouped by kind, The Labyrinth the ninth, on the bottom line.
# Version 4 (her notes of 23 Nov, 22:22-22:32):
# - The picture a little taller than the text beside it, the text centred on it, both from
#   the same left edge.
# - The alliance as a small badge in the top right: a smaller logo with its tag close under it.
# - Furnace level without its rank: the game's FC badge on the picture's corner.
# - The account's photos on a bar under the header; tapping one swaps to it.
# - Troops centred, names in small capitals as wide as the picture (the widest one), and
#   the tier and skill level written without the red.
# - Arena team: the class in much smaller capitals, the widget level under it, the hero
#   level kept quiet on the portrait. Hero names come from the state leaderboards, which
#   carry hero numbers with names; a hero with no known name keeps the drawn head.
# - Leaderboards: The Labyrinth total on the bottom line, opening to its six areas only
#   when tapped. Kill Count and Migrant Score are gone. A pair with nothing in
#   it (the player is not in that board's top 100) is left out.
# Player data is the real game data (read 23 Nov 17:10 UTC); foundry power, skill levels and
# the linked accounts are site data, made up for the mockup.
import re, pathlib
here = pathlib.Path(__file__).resolve().parent
top = (here / 'topbar.html').read_text()

PENCIL = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" '
          'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>')
REFRESH = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" fill="none" '
           'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
CHEVRON = ('<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" '
           'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
HEAD = ('<svg class="sil" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="15" r="7"/>'
        '<path d="M6 38c1-9 7-14 14-14s13 5 14 14z"/></svg>')
# Hero numbers with names, as the state leaderboards give them (Hero Power board).
HERO_NAMES = {50019: 'wuming', 50032: 'edith', 50041: 'gregory', 50043: 'blanchette', 50044: 'eleonora', 50046: 'rufus'}

def short(n):
    for size, unit in ((1e9, 'B'), (1e6, 'M'), (1e3, 'K')):
        if n >= size:
            v = n / size
            return (f'{v:.2f}' if v < 10 else f'{v:.1f}' if v < 100 else f'{v:.0f}') + unit
    return f'{n:,}'

JUMP_LAB = [('Land of Heroes', '57-4', 1), ('Cave of Monsters', '20-10', 4), ('Charm Mine', '25-10', 3),
            ('Research Center', '30-2', 1), ('Gear Forge', '25-10', 3), ('Gaia Heart', '64-5', 2)]
JUMP = dict(name='JumpMstr', id='177097599', power=3214244229, power_rank=2, foundry='15,230', rank='R4', fc=10,
            logo='dvl.png', tag='DVL', own=True,
            troops=[('Infantry', 'infantry', 12, 10), ('Lancer', 'lancer', 12, 10), ('Marksmen', 'marksmen', 12, 10)],
            skills=[3, 3, 2],
            heroes=[(50041, 'Infantry', 10, 80, 5), (50044, 'Infantry', 10, 80, 5), (50045, 'Lancer', 10, 80, 5),
                    (50043, 'Marksman', 10, 80, 5), (50046, 'Marksman', 10, 80, 5)],
            boards={'Chief Gear Power': (short(33048000), 3), 'Chief Charm Power': (short(44880000), 2),
                    'Total Pet Power': (short(53504160), 4), 'Total Expert Power': (short(84064500), 3),
                    'Research Power': (short(157133698), 1), 'Exploration Stage': ('733', 2), 'Island Prosperity': ('451,700', 1)},
            lab_total=(2191, 1), lab=JUMP_LAB,
            fresh=('Updated 53 min ago', 'Refresh at 18:10', False),
            accounts=[('J', 'JumpMstr', True), ('J', 'Jumpy', False), ('J', 'JumpFarm', False)])

KAPS = dict(name='Ҟ Ⱥ ꓅ˢ ᵇᵃᵇʸᴰᵒᵐ¹', id='604609180', power=202745508, power_rank=498, foundry='', rank='R3', fc=5,
            logo=None, tag='dvl', own=True,
            troops=[('Infantry', 'infantry', 10, 4), ('Lancer', 'lancer', 10, 4), ('Marksmen', 'marksmen', 10, 4)],
            skills=[None, None, None],
            heroes=[(50034, 'Infantry', 2, 80, 4), (50044, 'Infantry', 4, 78, 4), (50043, 'Marksman', 4, 78, 5),
                    (50039, 'Lancer', 3, 78, 4), (50046, 'Marksman', 3, 78, 4)],
            boards={}, lab_total=(1217, 382),
            lab=[('Land of Heroes', '43-3', None), ('Cave of Monsters', '12-5', None), ('Charm Mine', '12-8', None),
                 ('Research Center', '10-3', None), ('Gear Forge', '16-9', None), ('Gaia Heart', '31-9', None)],
            fresh=('Updated 2 h ago', 'Refresh', True),
            accounts=[('K', 'Kaps', False), ('Ҟ', 'Ҟ Ⱥ ꓅ˢ ᵇᵃᵇʸᴰᵒᵐ¹', True)])

KEEPER = dict(name='KeeperOfSecrets', id='252273018', power=196772850, power_rank=510, foundry='', rank='R1', fc=8,
              logo=None, tag='dvl', own=False, troops=None, skills=[None, None, None],
              heroes=[(50034, 'Infantry', 4, 77, 5), (50014, 'Lancer', 1, 80, 4), (50019, 'Infantry', 3, 75, 3),
                      (50030, 'Lancer', 0, 76, 4), (50033, 'Marksman', 4, 77, 5)],
              boards={}, lab_total=(1090, 441),
              lab=[('Land of Heroes', '32-3', None), ('Cave of Monsters', '14-1', None), ('Charm Mine', '12-8', None),
                   ('Research Center', '9-9', None), ('Gear Forge', '14-6', None), ('Gaia Heart', '31-3', None)],
              fresh=('Updated 53 min ago', 'Refresh at 18:10', False), accounts=[])

CLASS_MARK = {
  'Infantry': '<svg class="cm" viewBox="0 0 24 24" aria-label="Infantry"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z"/></svg>',
  'Lancer': '<svg class="cm" viewBox="0 0 24 24" aria-label="Lancer"><path d="M3 21L14 10" fill="none" stroke-width="2.6" stroke-linecap="round"/><path d="M11.5 8.5l4 4" fill="none" stroke-width="2.2" stroke-linecap="round"/><path d="M21.5 2.5c0 4.5-2.2 8-5.6 9.4l-3.8-3.8C13.5 4.7 17 2.5 21.5 2.5z" stroke="none"/></svg>',
  'Marksman': '<svg class="cm" viewBox="0 0 24 24" aria-label="Marksman"><path d="M8 2c11 3 11 17 0 20" fill="none" stroke-width="2.6" stroke-linecap="round"/><path d="M8 2v20" fill="none" stroke-width="1.1"/><path d="M2 12h16" fill="none" stroke-width="2" stroke-linecap="round"/><path d="M22.5 12L17 8.5v7z" stroke="none"/></svg>',
}
GRID = ['Chief Gear Power', 'Chief Charm Power', 'Hero Equip Power',
        'Total Pet Power', 'Total Expert Power', 'Research Power',
        'The Labyrinth', 'Exploration Stage', 'Island Prosperity']
GEAR = ('<svg class="wg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.3 2h3.4l.5 2.6 1.8.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.8 2.6.5v3.4l-2.6.5-.8 1.8 1.5 2.2-2.4 2.4-2.2-1.5-1.8.8-.5 2.6h-3.4l-.5-2.6-1.8-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.8L2 13.7v-3.4l2.6-.5.8-1.8-1.5-2.2 2.4-2.4 2.2 1.5 1.8-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>')
TIER = {10: ('t10', 'Tier 10'), 11: ('helios', 'Helios'), 12: ('exalted', 'Exalted')}

def board(label, value, rank, cls='board', chevron=''):
    # A board: its name on two lines (split before the last word), its value, its rank under it.
    first, _, last = label.rpartition(' ')
    v = value if value is not None else '<span class="empty">–</span>'
    r = f'#{rank}' if rank else ''
    return (f'<span class="cap">{first}<br>{last}{chevron}</span><span class="v">{v}</span><span class="r">{r}</span>')

def fig(label, value, rank, cls='fig'):
    r = f'<span class="r">#{rank}</span>' if rank else ''
    v = value if value is not None else '<span class="empty">–</span>'
    return f'<div class="{cls}"><span class="cap">{label}</span><span class="v"><b>{v}</b>{r}</span></div>'

def troops_part(c, mode, changed_to=None):
    if c['troops'] is None:
        return '<section class="troops"><h2>Troops</h2><p class="nodata">The game data has no troops for this chief.</p></section>'
    exalted = [t[2] == 12 for t in c['troops']]
    skills = list(c['skills'])
    if mode == 'edit':
        rows = ''
        for i, (n, k, tier, fcl) in enumerate(c['troops']):
            if not exalted[i]:
                continue
            level = changed_to[i] if changed_to else skills[i]
            opts = ''.join(f'<button type="button" class="lvl{" on" if v == level else ""}">{"None" if v is None else f"Lvl. {v}"}</button>'
                           for v in (None, 1, 2, 3))
            rows += (f'<div class="erow"><div class="art troop small"><img class="p" src="images/troops/{k}-exalted.png" alt="">'
                     f'<img class="fc" src="images/troops/fc{fcl}.png" alt=""></div>'
                     f'<span class="tname">{n}</span><div class="lvls">{opts}</div></div>')
        save_on = changed_to is not None and changed_to != skills
        return (f'<section class="troops open"><h2>Troops<span class="end"><button class="pen on" type="button" aria-label="Close">{PENCIL}</button></span></h2>'
                f'<div class="erows">{rows}</div><div class="saverow"><button type="button" class="ghost-button">Cancel</button>'
                f'<button type="button" class="primary-button save"{"" if save_on else " disabled"}>Save</button></div></section>')
    items = ''
    for i, (n, k, tier, fcl) in enumerate(c['troops']):
        key, word = TIER[tier]
        detail = f'<span class="q">{word}</span>'
        if tier == 12 and skills[i]:
            detail += f'<span class="s">Lvl. {skills[i]}</span>'
        items += (f'<div class="item"><div class="art troop"><img class="p" src="images/troops/{k}-{key}.png" alt="">'
                  f'<img class="fc" src="images/troops/fc{fcl}.png" alt=""></div>'
                  f'<span class="tname">{n}</span><span class="detail">{detail}</span></div>')
    pen = f'<span class="end"><button class="pen" type="button" aria-label="Set skill levels">{PENCIL}</button></span>' if any(exalted) and c['own'] else ''
    ask = ''
    if mode == 'ask':
        ask = '<button type="button" class="ask">Set the skill levels of your Exalted troops.</button>'
    if mode == 'before':
        ask = '<p class="note">Before State of Power on Mon 30 Nov, check that the skill levels of your Exalted troops are up to date.</p>'
    return f'<section class="troops"><h2>Troops{pen}</h2><div class="items three">{items}</div>{ask}</section>'

def page(c, mode='', changed_to=None, leave=False, lab_open=False):
    first = next(ch for ch in c['name'] if ch.isalnum()).upper()
    foundry = f'<span class="foundry"><img src="images/events/foundry.png" alt="Foundry">{c["foundry"]}</span>' if c['foundry'] else ''
    logo = f'<img class="logo" src="images/alliances/{c["logo"]}" alt="">' if c['logo'] else f'<span class="logo none">{c["tag"][0].upper()}</span>'
    header = f"""
 <header class="chief">
  <div class="pic"><span>{first}</span><img class="fc" src="images/troops/fc{c['fc']}.png" alt="FC{c['fc']}"></div>
  <div class="who">
   <div class="name">{c['name']}<span class="rank">{c['rank']}</span></div>
   <div class="id"><span class="k">ID</span> {c['id']}</div>
   <div class="power"><b>{short(c['power'])}</b><span class="pr">#{c['power_rank']}</span>{foundry}</div>
  </div>
  <div class="badge">{logo}<span class="tag">{c['tag']}</span></div>
 </header>"""
    bar = ''
    if c['own'] and c['accounts']:
        bar = ('<nav class="accbar" aria-label="Your accounts">' +
               ''.join(f'<button type="button" class="ph{" on" if on else ""}" aria-label="{n}">{l}</button>' for l, n, on in c['accounts']) +
               '<button type="button" class="ph add" aria-label="Add an account">+</button></nav>')
    heroes = ''
    for hid, cls, eg, lv, st in c['heroes']:
        name = HERO_NAMES.get(hid)
        art = f'<img class="hp" src="images/heroes/{name}.png" alt="{name}">' if name else HEAD
        widget = f'<span class="s">{GEAR}{eg}</span>' if eg else ''
        heroes += (f'<div class="item"><div class="art hero{" known" if name else ""}">{art}'
                   f'{CLASS_MARK[cls]}<span class="stars">{"★" * st}<i>{"★" * (5 - st)}</i></span></div>'
                   f'<span class="detail"><span class="q">Lv. {lv}</span>{widget}</span></div>')
    cells = ''
    for name in GRID:
        if name == 'The Labyrinth':
            total, total_rank = c['lab_total']
            cells += '<div class="board">' + board('The Labyrinth', f'{total:,}', total_rank) + '</div>'
        else:
            value, rank = c['boards'].get(name, (None, None))
            cells += '<div class="board">' + board(name, value, rank) + '</div>'
    areas = ''.join('<div class="board area">' + board(n, v, r) + '</div>' for n, v, r in c['lab'])
    rows = f'<div class="grid">{cells}</div>'
    # Under The Labyrinth: the line that opens its areas, and closes them again.
    details = (f'<div class="labmore"><button type="button" class="more" aria-expanded="{str(lab_open).lower()}">'
               f'Labyrinth details</button></div>')
    lab = details + (f'<div class="areas">{areas}</div>' if lab_open else '')
    when, button, active = c['fresh']
    fresh = (f'<p class="fresh">{when}<button type="button" class="refresh{" on" if active else ""}"{"" if active else " disabled"}>'
             f'{REFRESH}{button}</button></p>')
    prompt = ('<div class="leave"><div class="leave-box glass" role="dialog"><p>Save your changes before you leave?</p>'
              '<div class="leave-actions"><button type="button" class="ghost-button">Cancel</button>'
              '<button type="button" class="primary-button">Save</button></div></div></div>') if leave else ''
    return f"""<div class="pp">{header}{bar}
 <div class="body">
  {troops_part(c, mode, changed_to)}
  <section class="arena"><h2>Arena team</h2><div class="items five">{heroes}</div></section>
  <section class="boards"><h2>Leaderboards</h2>{rows}{lab}</section>
 </div>
 {fresh}
</div>{prompt}"""

CSS = """
.pp { --edge: 16px; --text-h: 78px; --pic: 90px; width: 100%; margin: 0 auto; padding: 22px var(--edge) 28px; box-sizing: border-box; color: var(--text); }
.pp h2 { display: flex; align-items: center; min-height: 32px; margin: 0 0 12px; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); }
.pp h2 .end { margin-left: auto; display: flex; align-items: center; }
.pen { width: 32px; height: 32px; margin-right: -7px; padding: 0; display: flex; align-items: center; justify-content: center; border: none; background: none; color: var(--text-muted); cursor: pointer; }
.pen svg { width: 18px; height: 18px; } .pen.on { color: var(--accent); }

/* Header. The picture a little taller than the text, the text centred on it; the alliance
   a small badge in the top right. */
.chief { display: grid; grid-template-columns: var(--pic) minmax(0, 1fr) auto; column-gap: 14px; align-items: center; }
.pic { position: relative; width: var(--pic); height: var(--pic); border-radius: 20px; background: var(--glass-strong); display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 800; color: var(--text-muted); box-shadow: 0 0 0 1px var(--glass-border), 0 8px 20px rgba(0,0,0,.4); }
.pic .fc { position: absolute; right: -4px; bottom: -5px; height: 28px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.55)); }
.who { min-width: 0; height: var(--text-h); display: flex; flex-direction: column; justify-content: space-between; }
.name, .id, .power, .tag, .fig .cap, .fig .v { text-box: trim-both cap alphabetic; }
.name { font-size: 24px; font-weight: 800; line-height: 1.1; white-space: nowrap; }
.id { font-size: 14px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.id .k { color: var(--text-faint); font-weight: 800; letter-spacing: .06em; }
/* The rank is the person's: a small label beside the name, level with the top of its capitals. */
.name .rank { margin-left: 7px; font-size: 12px; color: var(--accent); font-weight: 800; letter-spacing: .04em; vertical-align: top; position: relative; top: 0; }
.power { font-size: 30px; font-weight: 800; line-height: 1.1; white-space: nowrap; font-variant-numeric: tabular-nums; }
.power .pr { margin-left: 6px; font-size: 13px; color: var(--accent); }
.foundry { margin-left: 14px; font-size: 15px; color: var(--text-muted); }
.foundry img { height: 19px; vertical-align: -3px; margin-right: 4px; }
.badge { align-self: start; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.badge .logo { height: 36px; display: block; }
.badge .logo.none { width: 32px; height: 32px; border-radius: 9px; font-size: 15px; }
.logo.none { background: var(--glass-strong); box-shadow: 0 0 0 1px var(--glass-border); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-muted); }
.tag { font-family: var(--tag-font); font-size: 11px; font-weight: 800; letter-spacing: .08em; line-height: 1.1; }

/* The account's photos; the one shown is ringed, tapping another swaps to it. */
.accbar { display: flex; gap: 10px; margin-top: 18px; }
.ph { width: 40px; height: 40px; padding: 0; border: none; border-radius: 11px; background: var(--glass-strong); box-shadow: 0 0 0 1px var(--glass-border);
  font: inherit; font-size: 17px; font-weight: 800; color: var(--text-muted); cursor: pointer; }
.ph.on { color: var(--text); box-shadow: 0 0 0 2px var(--accent), 0 0 12px color-mix(in srgb, var(--accent) 40%, transparent); }
.ph.add { background: none; font-size: 22px; font-weight: 600; }

.body { margin-top: 30px; display: flex; flex-direction: column; gap: 30px; }
.items { display: grid; column-gap: 8px; }
.items.three { grid-template-columns: repeat(3, minmax(0, 1fr)); } .items.five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.item { display: flex; flex-direction: column; align-items: center; gap: 7px; min-width: 0; }
.art { width: 60px; height: 60px; position: relative; display: flex; align-items: center; justify-content: center; flex: none; }
.art.troop .p { height: 60px; }
.art.troop .fc { position: absolute; top: -3px; left: -8px; height: 24px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); }
/* Troop names in capitals, all at one size: the widest is as wide as the picture. */
.tname { display: block; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; line-height: 1; white-space: nowrap; color: var(--text); }
.detail { font-size: 11px; font-weight: 700; white-space: nowrap; line-height: 1.2; }
.detail .q { color: var(--text-faint); } .detail .s { color: var(--text); }
.detail .q + .s::before { content: ' · '; color: var(--text-faint); }
.detail .empty { color: var(--text-faint); }
.nodata { margin: 0; font-size: 13px; font-weight: 600; color: var(--text-faint); }

.art.hero { border-radius: 14px; background: var(--glass-strong); box-shadow: 0 0 0 1px var(--glass-border); overflow: hidden; }
.art.hero .hp { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.art.hero .sil { position: absolute; left: 50%; bottom: 0; width: 46px; height: 46px; transform: translateX(-50%); fill: var(--text-faint); opacity: .28; }
.art.hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,12,24,.78), transparent 42%), linear-gradient(to bottom, rgba(8,12,24,.7), transparent 32%); }
.art.hero .stars { position: absolute; bottom: 4px; left: 0; right: 0; z-index: 1; text-align: center; font-size: 9px; letter-spacing: 1px; color: var(--fc-gold); }
.art.hero .stars i { font-style: normal; color: var(--text-faint); opacity: .5; }
.arena .detail { font-size: 10px; }
.detail .wg { width: 10px; height: 10px; margin-right: 2px; vertical-align: -1px; color: var(--text-muted); }
.art.hero .cm { position: absolute; top: 4px; left: 4px; z-index: 1; width: 14px; height: 14px; fill: var(--text); stroke: var(--text); filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.9)); }

.ask, .note { display: block; margin: 16px auto 0; padding: 0; border: none; background: none; text-align: center; font: inherit; font-size: 13px; font-weight: 700; line-height: 1.45; color: var(--accent); }
.ask { cursor: pointer; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, var(--accent) 45%, transparent); }

/* Setting the skill levels: each Exalted troop with its toggle, lit like the site's other switches. */
.erows { display: flex; flex-direction: column; gap: 12px; }
.erow { display: flex; align-items: center; gap: 12px; }
.art.troop.small { width: 44px; height: 44px; margin-left: 8px; } .art.troop.small .p { height: 44px; } .art.troop.small .fc { height: 19px; top: -3px; left: -7px; }
.erow .tname { flex: 1; min-width: 0; font-size: 11px; }
.lvls { flex: none; display: flex; padding: 3px; gap: 2px; border-radius: 12px; border: 1px solid var(--glass-border); background: var(--glass); }
.lvl { min-width: 47px; height: 30px; padding: 0 6px; border: none; border-radius: 9px; background: none; color: var(--text-muted); font: inherit; font-size: 12px; font-weight: 700; white-space: nowrap; }
.lvl.on { background: var(--accent); color: var(--accent-ink); font-weight: 800; box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent); }
.saverow { display: flex; justify-content: center; gap: 10px; margin-top: 18px; }
.saverow button { min-width: 110px; }
.save:disabled { background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-faint); }

/* Leaderboards: three rows of three, by kind: two rows of power, then The Labyrinth with
   Exploration Stage beside it and Island Prosperity. Each board is centred in its column:
   its name on two lines, its value, its rank under it. The Labyrinth opens its areas under
   the grid, drawn the same way, smaller. */
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px 12px; }
.board { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; }
.board .cap { font-size: 11px; font-weight: 700; line-height: 1.25; color: var(--text-muted); }
.board .v { margin-top: 7px; font-size: 20px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.board .r { margin-top: 3px; min-height: 14px; font-size: 11px; font-weight: 800; line-height: 1.25; color: var(--accent); }
.board .empty { color: var(--text-faint); }
.labmore { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 12px; margin-top: 12px; }
.more { justify-self: center; padding: 0; border: none; background: none; font: inherit; font-size: 12px; font-weight: 800; color: var(--accent); white-space: nowrap; cursor: pointer;
  text-decoration: underline; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.areas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px 12px; margin-top: 30px; }
.board.area .cap { font-size: 10.5px; }
.board.area .v { font-size: 16px; }

.fresh { margin: 32px 0 0; font-size: 13px; font-weight: 600; color: var(--text-faint); line-height: 1; }
.refresh { margin-left: 12px; padding: 0; border: none; background: none; font: inherit; font-weight: 800; color: var(--text-faint); }
.refresh svg { width: 13px; height: 13px; margin-right: 5px; vertical-align: -1px; }
.refresh.on { color: var(--accent); cursor: pointer; }

.leave { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(5, 8, 16, 0.55); }
.leave-box { background: color-mix(in srgb, var(--page-color) 90%, transparent); width: min(380px, 100%); padding: 22px 20px 18px; display: flex; flex-direction: column; gap: 18px; }
.leave-box p { margin: 0; text-align: center; font-size: 17px; font-weight: 700; }
.leave-actions { display: flex; gap: 10px; } .leave-actions button { flex: 1; min-height: 44px; }
"""
SCRIPT = """<script>
for (const name of Array.from(document.querySelectorAll('.name'))) {
  let size = parseFloat(getComputedStyle(name).fontSize);
  while (name.scrollWidth > name.clientWidth + 0.5 && size > 9) { size -= 0.25; name.style.fontSize = size + 'px'; }
}
// The troop names share one size, set so the widest is exactly as wide as the picture.
const names = Array.from(document.querySelectorAll('.items.three .tname'));
if (names.length) {
  const art = document.querySelector('.items.three .art').getBoundingClientRect().width;
  for (const one of names) one.style.fontSize = '20px';
  const widest = Math.max(...names.map(one => one.getBoundingClientRect().width));
  for (const one of names) one.style.fontSize = (20 * art / widest) + 'px';
}
</script>"""

PAGES = {
  'jump': (JUMP, dict()),
  'jump-lab': (JUMP, dict(lab_open=True)),
  'jump-ask': (dict(JUMP, skills=[None, None, None]), dict(mode='ask')),
  'jump-before': (dict(JUMP, skills=[2, 3, 2]), dict(mode='before')),
  'jump-edit': (JUMP, dict(mode='edit', changed_to=[3, 3, 3])),
  'jump-leave': (JUMP, dict(mode='edit', changed_to=[3, 3, 3], leave=True)),
  'kaps': (KAPS, dict()),
  'keeper': (KEEPER, dict()),
}
for key, (c, opts) in PAGES.items():
    viewer = c['name'] if c['own'] else 'Innocent_Terry_'
    bar = re.sub(r'(<span class="me-name">)[^<]*', r'\g<1>' + viewer, top)
    html = ('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<link rel="stylesheet" href="main.css"><style>' + CSS + '</style></head><body><div id="app" class="app">' + bar +
            '<main class="page" data-section="player">' + page(c, **opts) + '</main></div>' + SCRIPT + '</body></html>')
    (here / f'v7-{key}.html').write_text(html)
print('built', len(PAGES))
