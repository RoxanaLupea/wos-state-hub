# The player page, version 3. Starts from version 2 and her decisions:
# - Order (her direction, 23 Nov): the header, then troops, then the arena team, then the
#   leaderboards. Version 2 had moved the key figures above the troops; they go back down.
# - The Labyrinth total sits on its own title row, over its six areas, so it shows once.
# - The arena team shows what the game data has: the hero's class (from its gear), EG level,
#   stars and level. Hero names wait for a list from hero numbers to names.
# - "Updated" and Refresh: on a computer at the right of the header, on a phone at the end.
# - States: default, a skill level never set, skill levels being set, leaving with changes,
#   an alt in an academy with no logo, someone else's profile with no troops in the data.
# Your accounts is drawn as in version 2 until Roxanne says which of her two versions stands.
# Player data is the real game data from game_players (read 23 Nov 17:10 UTC); foundry
# power, skill levels and the accounts are site data, made up for the mockup.
import re, pathlib
here = pathlib.Path(__file__).resolve().parent
top = (here / 'topbar.html').read_text()

PENCIL = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" '
          'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>')
REFRESH = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" fill="none" '
           'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
# Drawn by the app, since the data has no hero picture: a head and shoulders.
HERO = ('<svg class="sil" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="15" r="7"/>'
        '<path d="M6 38c1-9 7-14 14-14s13 5 14 14z"/></svg>')

def short(n):
    """Three significant figures: 3.21B, 130M, 7.12M, 30.3K."""
    for size, unit in ((1e9, 'B'), (1e6, 'M'), (1e3, 'K')):
        if n >= size:
            v = n / size
            text = f'{v:.2f}' if v < 10 else f'{v:.1f}' if v < 100 else f'{v:.0f}'
            return text + unit
    return str(n)

def fc(furnace):
    return f'FC{(furnace - 30) // 5}' if furnace > 30 else str(furnace)

JUMP_LAB = [('Land of Heroes', '57-4', 1), ('Cave of Monsters', '20-10', 4), ('Charm Mine', '25-10', 3),
            ('Research Center', '30-2', 1), ('Gear Forge', '25-10', 3), ('Gaia Heart', '64-5', 2)]
JUMP = dict(name='JumpMstr', id='177097599', power=3214244229, power_rank=2, foundry='15,230', rank='R4',
            logo='dvl.png', tag='DVL', own=True,
            troops=[('Infantry', 'infantry', 12, 10), ('Lancer', 'lancer', 12, 10), ('Marksmen', 'marksmen', 12, 10)],
            skills=[3, 3, 2],
            heroes=[('Infantry', 10, 80, 5), ('Infantry', 10, 80, 5), ('Lancer', 10, 80, 5), ('Marksman', 10, 80, 5), ('Marksman', 10, 80, 5)],
            boards=[('Kill Count', 130154565, 30), ('Furnace Level', 80, 3), ('Migrant Score', 7119250, 2)],
            lab_total=(2191, 1), lab=JUMP_LAB,
            fresh=('Updated 53 min ago', 'Refresh at 18:10', False),
            accounts=[('dvl.png', 'DVL', 'Main', 'JumpMstr', '177097599', '3.21B', True),
                      ('dvl.png', 'dvl', 'Alt', 'Jumpy', '241886031', '412M', False),
                      ('dvl.png', 'dvl', 'Farm', 'JumpFarm', '252110947', '38.0M', False)])

KAPS = dict(name='Ҟ Ⱥ ꓅ˢ ᵇᵃᵇʸᴰᵒᵐ¹', id='604609180', power=202745508, power_rank=498, foundry='', rank='R3',
            logo=None, tag='dvl', own=True,
            troops=[('Infantry', 'infantry', 10, 4), ('Lancer', 'lancer', 10, 4), ('Marksmen', 'marksmen', 10, 4)],
            skills=[None, None, None],
            heroes=[('Infantry', 2, 80, 4), ('Infantry', 4, 78, 4), ('Marksman', 4, 78, 5), ('Lancer', 3, 78, 4), ('Marksman', 3, 78, 4)],
            boards=[('Kill Count', 30252, 2200), ('Furnace Level', 55, 678), ('Migrant Score', 669783, 376)],
            lab_total=(1217, 382),
            lab=[('Land of Heroes', '43-3', None), ('Cave of Monsters', '12-5', None), ('Charm Mine', '12-8', None),
                 ('Research Center', '10-3', None), ('Gear Forge', '16-9', None), ('Gaia Heart', '31-9', None)],
            fresh=('Updated 2 h ago', 'Refresh', True),
            accounts=[('dvl.png', 'DVL', 'Main', 'Kaps', '188420716', '1.04B', False),
                      (None, 'dvl', 'Alt', 'Ҟ Ⱥ ꓅ˢ ᵇᵃᵇʸᴰᵒᵐ¹', '604609180', '203M', True)])

KEEPER = dict(name='KeeperOfSecrets', id='252273018', power=196772850, power_rank=510, foundry='', rank='R1',
              logo=None, tag='dvl', own=False,
              troops=None, skills=[None, None, None],
              heroes=[('Infantry', 4, 77, 5), ('Lancer', 1, 80, 4), ('Infantry', 3, 75, 3), ('Lancer', 0, 76, 4), ('Marksman', 4, 77, 5)],
              boards=[('Kill Count', 715526, 878), ('Furnace Level', 70, 403), ('Migrant Score', None, None)],
              lab_total=(1090, 441),
              lab=[('Land of Heroes', '32-3', None), ('Cave of Monsters', '14-1', None), ('Charm Mine', '12-8', None),
                   ('Research Center', '9-9', None), ('Gear Forge', '14-6', None), ('Gaia Heart', '31-3', None)],
              fresh=('Updated 53 min ago', 'Refresh at 18:10', False), accounts=[])

TIER = {10: ('t10', 'Tier 10'), 11: ('helios', 'Helios'), 12: ('exalted', 'Exalted')}

def logo_of(file, tag, cls):
    return f'<img class="{cls}" src="images/alliances/{file}" alt="">' if file else f'<span class="{cls} none">{tag[0].upper()}</span>'

def figure(label, value, rank, cls='fig'):
    r = f'<span class="r">#{rank}</span>' if rank else ''
    v = value if value is not None else '<span class="empty">–</span>'
    return f'<div class="{cls}"><span class="cap">{label}</span><span class="v"><b>{v}</b>{r}</span></div>'

def fresh(c, where):
    when, button, active = c['fresh']
    return (f'<div class="fresh {where}"><span>{when}</span><button type="button" class="refresh{" on" if active else ""}"'
            f'{"" if active else " disabled"}>{REFRESH}{button}</button></div>')

def troops_part(c, mode, changed_to=None):
    if c['troops'] is None:
        return ('<section class="troops"><h2>Troops</h2>'
                '<p class="nodata">The game data has no troops for this chief.</p></section>')
    exalted = [t[2] == 12 for t in c['troops']]
    skills = list(c['skills'])
    if mode == 'edit':
        rows = ''
        for i, (n, k, tier, fcl) in enumerate(c['troops']):
            if not exalted[i]:
                continue
            level = changed_to[i] if changed_to else skills[i]
            opts = ''.join(f'<button type="button" class="lvl{" none" if v is None else ""}{" on" if v == level else ""}">'
                           f'{"None" if v is None else f"Lvl. {v}"}</button>' for v in (None, 1, 2, 3))
            rows += (f'<div class="erow"><div class="art troop small"><img class="p" src="images/troops/{k}-exalted.png" alt="">'
                     f'<img class="fc" src="images/troops/fc{fcl}.png" alt=""></div>'
                     f'<div class="et"><span class="l1">{n}</span><span class="l2 ex">Exalted</span></div>'
                     f'<div class="lvls">{opts}</div></div>')
        save_on = changed_to is not None and changed_to != skills
        return (f'<section class="troops open"><h2>Troops<span class="end"><button class="pen on" type="button" aria-label="Close">{PENCIL}</button></span></h2>'
                f'<div class="erows">{rows}</div><div class="saverow"><button type="button" class="ghost-button">Cancel</button>'
                f'<button type="button" class="primary-button save"{"" if save_on else " disabled"}>Save</button></div></section>')
    items = ''
    for i, (n, k, tier, fcl) in enumerate(c['troops']):
        key, word = TIER[tier]
        if tier == 12:
            word = f'Exalted · Lvl. {skills[i]}' if skills[i] else ('Exalted' if skills[i] is None else 'Exalted · None')
        items += (f'<div class="item"><div class="art troop"><img class="p" src="images/troops/{k}-{key}.png" alt="">'
                  f'<img class="fc" src="images/troops/fc{fcl}.png" alt=""></div>'
                  f'<div class="l1">{n}</div><div class="l2{" ex" if tier == 12 else ""}">{word}</div></div>')
    pen = f'<span class="end"><button class="pen" type="button" aria-label="Set skill levels">{PENCIL}</button></span>' if any(exalted) and c['own'] else ''
    ask = ''
    if mode == 'ask':
        ask = '<button type="button" class="ask">Set the skill levels of your Exalted troops.</button>'
    if mode == 'before':
        ask = '<p class="note">Before State of Power on Mon 30 Nov, check that the skill levels of your Exalted troops are up to date.</p>'
    return f'<section class="troops"><h2>Troops{pen}</h2><div class="items three">{items}</div>{ask}</section>'

def page(c, mode='', changed_to=None, leave=False):
    first = next(ch for ch in c['name'] if ch.isalnum()).upper()
    foundry = f'<span class="foundry"><img src="images/events/foundry.png" alt="Foundry">{c["foundry"]}</span>' if c['foundry'] else ''
    header = f"""
 <header class="chief">
  <div class="pic">{first}</div>
  <div class="who">
   <div class="name">{c['name']}</div>
   <div class="id"><span class="k">ID</span> {c['id']}<span class="rank">{c['rank']}</span></div>
   <div class="power"><b>{short(c['power'])}</b><span class="pr">#{c['power_rank']}</span>{foundry}</div>
  </div>
  <div class="badge">{logo_of(c['logo'], c['tag'], 'logo')}<span class="tag">{c['tag']}</span></div>
  {fresh(c, 'top')}
 </header>"""
    heroes = ''.join(f'<div class="item"><div class="art hero">{HERO}' + (f'<span class="eg">EG {eg}</span>' if eg else '') +
                     f'<span class="stars">{"★" * st}<i>{"★" * (5 - st)}</i></span></div>'
                     f'<div class="l1">{cls}</div><div class="l2">Lv. {lv}</div></div>'
                     for cls, eg, lv, st in c['heroes'])
    boards = ''.join(figure(n, (fc(v) if n == 'Furnace Level' else short(v)) if v is not None else None, r) for n, v, r in c['boards'])
    total, total_rank = c['lab_total']
    lab = ''.join(figure(n, v, r, 'fig area') for n, v, r in c['lab'])
    accounts = ''
    if c['own']:
        accs = ''.join(
            f'<div class="acc{" on" if on else ""}">{logo_of(f, t, "alogo")}<div class="at"><span class="kind">{kind}</span>'
            f'<span class="an">{n}</span><span class="ai">{i}</span><span class="ap">{p}</span></div></div>'
            for f, t, kind, n, i, p, on in c['accounts'])
        accs += '<div class="acc add"><span class="plus">+</span><div class="at"><span class="an">Add</span></div></div>'
        accounts = f'<section class="accounts"><h2>Your accounts</h2><div class="accs">{accs}</div></section>'
    prompt = ('<div class="leave"><div class="leave-box glass" role="dialog"><p>Save your changes before you leave?</p>'
              '<div class="leave-actions"><button type="button" class="ghost-button">Cancel</button>'
              '<button type="button" class="primary-button">Save</button></div></div></div>') if leave else ''
    return f"""<div class="pp{" other" if not c['own'] else ""}">{header}
 <div class="body">
  {troops_part(c, mode, changed_to)}
  <section class="arena"><h2>Arena team</h2><div class="items five">{heroes}</div></section>
  <section class="boards"><h2>Leaderboards</h2><div class="figs">{boards}</div></section>
  <section class="lab"><h2>The Labyrinth<span class="end total"><b>{total:,}</b><span class="r">#{total_rank}</span></span></h2><div class="areas">{lab}</div></section>
  {accounts}
 </div>
 {fresh(c, 'end')}
</div>{prompt}"""

CSS = """
.pp { --edge: 16px; --pic: 80px; width: 100%; max-width: 1280px; margin: 0 auto; padding: 22px var(--edge) 28px; box-sizing: border-box; color: var(--text); }
.pp h2 { display: flex; align-items: center; min-height: 32px; margin: 0 0 12px; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); }
.pp h2 .end { margin-left: auto; display: flex; align-items: center; }
.pen { width: 32px; height: 32px; margin-right: -7px; padding: 0; display: flex; align-items: center; justify-content: center; border: none; background: none; color: var(--text-muted); cursor: pointer; }
.pen svg { width: 18px; height: 18px; }
.pen.on { color: var(--accent); }

/* Header: the owner's rules. Picture | name, ID, power | alliance. */
.chief { display: grid; grid-template-columns: var(--pic) minmax(0, 1fr) auto; column-gap: 14px; }
.pic { width: var(--pic); height: var(--pic); border-radius: 18px; background: var(--glass-strong); display: flex; align-items: center; justify-content: center;
  font-size: 34px; font-weight: 800; color: var(--text-muted); box-shadow: 0 0 0 1px var(--glass-border), 0 8px 20px rgba(0,0,0,.4); }
.who { min-width: 0; height: var(--pic); display: flex; flex-direction: column; justify-content: space-between; }
.name, .id, .power, .tag, .fig .cap, .fig .v { text-box: trim-both cap alphabetic; }
.name { font-size: 24px; font-weight: 800; line-height: 1.1; white-space: nowrap; }
.id { font-size: 14px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.id .k { color: var(--text-faint); font-weight: 800; letter-spacing: .06em; }
.id .rank { margin-left: 10px; color: var(--accent); font-weight: 800; letter-spacing: .04em; }
.power { font-size: 30px; font-weight: 800; line-height: 1.1; white-space: nowrap; font-variant-numeric: tabular-nums; }
.power .pr { margin-left: 6px; font-size: 13px; color: var(--accent); }
.foundry { margin-left: 14px; font-size: 15px; color: var(--text-muted); }
.foundry img { height: 19px; vertical-align: -3px; margin-right: 4px; }
.badge { width: 50px; height: var(--pic); display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
.badge .logo { height: 52px; display: block; }
.logo.none, .alogo.none { border-radius: 12px; background: var(--glass-strong); box-shadow: 0 0 0 1px var(--glass-border);
  display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-muted); }
.badge .logo.none { width: 46px; height: 46px; font-size: 20px; }
.tag { font-family: var(--tag-font); font-size: 13px; font-weight: 800; letter-spacing: .08em; line-height: 1.1; }

/* When the game data was read, and Refresh: lit when it can be used, otherwise the time it
   can be used again (the game is read at most once an hour). */
.fresh { display: block; text-box: trim-both cap alphabetic; line-height: 1; font-size: 13px; font-weight: 600; color: var(--text-faint); white-space: nowrap; }
.fresh.top { display: none; }
.fresh .refresh { margin-left: 12px; }
.fresh.end { margin-top: 32px; }
.refresh { display: inline; padding: 0; border: none; background: none; font: inherit; font-weight: 800; color: var(--text-faint); }
.refresh svg { width: 13px; height: 13px; margin-right: 5px; vertical-align: -1px; }
.refresh.on { color: var(--accent); cursor: pointer; }

/* The sections, in her order: troops, arena team, leaderboards. */
.body { margin-top: 32px; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "troops" "arena" "boards" "lab" "accounts"; row-gap: 30px; }
.troops { grid-area: troops; } .arena { grid-area: arena; } .boards { grid-area: boards; } .lab { grid-area: lab; } .accounts { grid-area: accounts; }
.items { display: grid; column-gap: 8px; }
.items.three { grid-template-columns: repeat(3, minmax(0, 1fr)); } .items.five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.item { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; }
.art { width: 60px; height: 60px; position: relative; display: flex; align-items: center; justify-content: center; flex: none; }
.art.troop { margin-left: 4px; } .art.troop .p { height: 60px; }
.art.troop .fc { position: absolute; top: -3px; left: -4px; height: 24px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); }
.art .eg { position: absolute; top: 4px; left: 4px; font-size: 10px; font-weight: 800; line-height: 1; padding: 3px 4px; border-radius: 5px; background: rgba(0,0,0,.45); color: var(--fc-gold); }
.art.hero { border-radius: 14px; background: var(--glass-strong); box-shadow: 0 0 0 1px var(--glass-border); align-items: flex-end; overflow: hidden; }
.art.hero .sil { position: absolute; left: 50%; bottom: 0; width: 46px; height: 46px; transform: translateX(-50%); fill: var(--text-faint); opacity: .28; }
.art.hero .stars { position: relative; font-size: 9px; letter-spacing: 1px; color: var(--fc-gold); margin-bottom: 5px; }
.art.hero .stars i { font-style: normal; color: var(--text-faint); opacity: .45; }
.l1 { font-size: 12px; font-weight: 800; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.l2 { font-size: 11px; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
.l2.ex { color: var(--exalted); }
.nodata { margin: 0; font-size: 13px; font-weight: 600; color: var(--text-faint); }

/* A skill level never set: one ask under the troops, which opens the same as the pencil.
   Before SvS and Tyrant: the note in the same place. */
.ask, .note { display: block; margin: 16px 0 0; padding: 0; border: none; background: none; text-align: left; font: inherit; font-size: 13px; font-weight: 700; line-height: 1.45; color: var(--accent); }
.ask { cursor: pointer; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, var(--accent) 45%, transparent); }

/* Setting the skill levels: each Exalted troop as a row with its toggle, None or one level lit. */
.erows { display: flex; flex-direction: column; gap: 12px; }
.erow { display: flex; align-items: center; gap: 12px; }
.art.troop.small { width: 44px; height: 44px; margin-left: 4px; } .art.troop.small .p { height: 44px; } .art.troop.small .fc { height: 19px; top: -3px; left: -5px; }
.et { display: flex; flex-direction: column; gap: 5px; min-width: 0; flex: 1; }
.lvls { display: flex; padding: 3px; gap: 2px; border-radius: 999px; border: 1px solid var(--glass-border); background: var(--glass); }
.lvl { min-width: 50px; height: 28px; padding: 0 7px; border: none; border-radius: 999px; background: none; color: var(--text-muted); font: inherit; font-size: 12px; font-weight: 800; white-space: nowrap; }
.lvl.on { color: var(--text); background: color-mix(in srgb, var(--exalted) 55%, transparent); box-shadow: 0 0 10px color-mix(in srgb, var(--exalted) 35%, transparent); }
.lvl.none.on { background: color-mix(in srgb, var(--text) 14%, transparent); box-shadow: none; }
.saverow { display: flex; justify-content: center; gap: 10px; margin-top: 18px; }
.saverow button { min-width: 110px; }
.save:disabled { background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-faint); }

/* Leaderboards: the label, then the value with its rank small after it, as the power. */
.figs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.fig { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.fig .cap { font-size: 12px; font-weight: 700; color: var(--text-muted); line-height: 1.2; white-space: nowrap; }
.fig .v { font-size: 20px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.fig .r, .total .r { margin-left: 5px; font-size: 12px; color: var(--accent); }
.fig .empty { color: var(--text-faint); }
.total { font-size: 16px; font-weight: 800; letter-spacing: 0; text-transform: none; color: var(--text); font-variant-numeric: tabular-nums; }
.areas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px 8px; }
.fig.area .v { font-size: 18px; }

/* Your accounts: as in version 2, until the open question is answered. */
.accs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; }
.acc { display: flex; gap: 10px; align-items: flex-start; min-width: 0; color: var(--text-muted); }
.acc .alogo { height: 34px; width: 34px; object-fit: contain; flex: none; }
.acc .alogo.none { font-size: 15px; border-radius: 9px; }
.acc .at { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.acc .kind { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint); }
.acc .an { font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.acc .ai, .acc .ap { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.acc.on { color: var(--text); } .acc.on .kind { color: var(--accent); }
.acc.add { align-items: center; }
.acc .plus { width: 34px; height: 34px; border-radius: 9px; box-shadow: 0 0 0 1px var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }

/* Leaving with changes not saved. */
.leave { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(5, 8, 16, 0.55); }
.leave-box { background: color-mix(in srgb, var(--page-color) 90%, transparent); width: min(380px, 100%); padding: 22px 20px 18px; display: flex; flex-direction: column; gap: 18px; }
.leave-box p { margin: 0; text-align: center; font-size: 17px; font-weight: 700; }
.leave-actions { display: flex; gap: 10px; } .leave-actions button { flex: 1; min-height: 44px; }

@media (min-width: 900px) {
  .pp { --edge: 28px; --pic: 104px; padding-top: 34px; }
  .chief { grid-template-columns: var(--pic) auto auto minmax(0, 1fr); column-gap: 22px; }
  .badge { margin-left: 26px; }
  .fresh.top { display: block; justify-self: end; align-self: start; }
  .fresh.end { display: none; }
  .name { font-size: 34px; } .id { font-size: 16px; } .power { font-size: 42px; } .power .pr { font-size: 15px; } .foundry { font-size: 19px; } .foundry img { height: 24px; vertical-align: -4px; }
  .pic { font-size: 46px; border-radius: 22px; }
  .badge { width: 64px; } .badge .logo { height: 68px; } .badge .logo.none { width: 58px; height: 58px; font-size: 24px; border-radius: 14px; } .tag { font-size: 15px; }
  /* Troops and the arena team on one line, their columns the same width, so three troops
     never take the room of five heroes; under each, its leaderboards. */
  .body { margin-top: 46px; grid-template-columns: minmax(0, 3fr) minmax(0, 5fr);
    grid-template-areas: "troops arena" "boards lab" "accounts accounts"; column-gap: 56px; row-gap: 44px; }
  .art { width: 72px; height: 72px; } .art.troop .p { height: 72px; } .art.troop .fc { height: 30px; }
  .art.hero .sil { width: 56px; height: 56px; }
  .l1 { font-size: 13px; } .l2 { font-size: 12px; }
  .fig .v { font-size: 22px; }
  .areas { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .fig.area .v { font-size: 20px; }
  .accs { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .saverow { justify-content: flex-start; }
}
"""
SCRIPT = """<script>
// A long name (up to 16 characters) gets smaller until it fits.
for (const name of Array.from(document.querySelectorAll('.name'))) {
  let size = parseFloat(getComputedStyle(name).fontSize);
  while (name.scrollWidth > name.clientWidth + 0.5 && size > 9) { size -= 0.25; name.style.fontSize = size + 'px'; }
}
</script>"""

PAGES = {
  'jump': (JUMP, dict()),
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
    (here / f'v3-{key}.html').write_text(html)
print('built', len(PAGES))
