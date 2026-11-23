# The player page, version 2: built from the owner's references (the game's Chief Profile
# and wosoracle's player page) and from the decisions in notes/design-decisions.md.
#
# Order: the header (owner's rules, unchanged), the key figures right under it the way
# wosoracle shows them (label, the value large, the rank small under it), then how the
# chief fights (troops, arena team), the Labyrinth areas, and Your accounts (decided:
# every account side by side, the one the person is on lit, tapping one switches to it;
# this is also the swap, so the page has no separate swap control).
# Computer: the key figures fill the header row to the right of the alliance, on the
# picture's top and bottom edges. Below it two sides: troops over the Labyrinth (three
# columns each, so they line up), the arena team over Your accounts.
import re, pathlib
here = pathlib.Path(__file__).resolve().parent
top = (here / 'topbar.html').read_text()

PENCIL = ('<svg class="pen" viewBox="0 0 24 24" aria-label="Edit"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" '
          'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>')

CHIEFS = {
  'jump': dict(name='JumpMstr', id='177097599', power='3.21B', power_rank=2, foundry='15,230', rank='R4',
               logo='dvl.png', tag='DVL', updated='Updated 12 min ago',
               fc=10, troops=[('Infantry', 'infantry-exalted', 'Exalted · Lvl. 3'), ('Lancer', 'lancer-exalted', 'Exalted · Lvl. 3'), ('Marksmen', 'marksmen-exalted', 'Exalted · Lvl. 2')],
               heroes=[(50041, 10, 80, 5), (50044, 10, 80, 5), (50045, 10, 80, 5), (50043, 10, 80, 5), (50046, 10, 80, 5)],
               lab=[('Land of Heroes', '57-4', 1), ('Cave of Monsters', '20-10', 4), ('Charm Mine', '25-10', 3),
                    ('Research Center', '30-2', 1), ('Gear Forge', '25-10', 3), ('Gaia Heart', '64-5', 2)],
               figures=[('Kill Count', '130.2M', 30), ('Furnace Level', 'FC10', 3), ('The Labyrinth', '2,191', 1), ('Migrant Score', '7.12M', 2)],
               accounts=[('dvl.png', 'DVL', 'Main', 'JumpMstr', '177097599', '3.21B', True),
                         ('dvl.png', 'dvl', 'Alt', 'Jumpy', '241886031', '412M', False),
                         ('dvl.png', 'dvl', 'Farm', 'JumpFarm', '252110947', '38M', False)]),
  'long': dict(name='༺TAGERMXY 2༻ᴵᴿᴬᵟ', id='176411497', power='276M', power_rank=88, foundry='', rank='R1',
               logo=None, tag='dvl', updated='Updated 46 min ago',
               fc=8, troops=[('Infantry', 'infantry-t10', 'Tier 10'), ('Lancer', 'lancer-t10', 'Tier 10'), ('Marksmen', 'marksmen-t10', 'Tier 10')],
               heroes=[(50021, 4, 60, 4), (50024, 3, 60, 4), (50025, 0, 50, 3), (50023, 2, 60, 4), (50026, 0, 50, 3)],
               lab=[('Land of Heroes', '22-1', 61), ('Cave of Monsters', '8-6', 74), ('Charm Mine', '10-2', 58),
                    ('Research Center', '12-9', 66), ('Gear Forge', '9-5', 80), ('Gaia Heart', '21-3', 70)],
               figures=[('Kill Count', '8.4M', 214), ('Furnace Level', 'FC8', 120), ('The Labyrinth', '388', 71), ('Migrant Score', '310K', 96)],
               accounts=[('dvl.png', 'DVL', 'Main', 'TagerMain', '166204381', '1.02B', False),
                         (None, 'dvl', 'Alt', '༺TAGERMXY 2༻ᴵᴿᴬᵟ', '176411497', '276M', True)]),
}

def logo_of(file, tag, cls):
    return f'<img class="{cls}" src="images/alliances/{file}" alt="">' if file else f'<span class="{cls} none">{tag[0].upper()}</span>'

def figure(label, value, rank):
    r = f'<span class="r">#{rank}</span>' if rank else ''
    return f'<div class="fig"><span class="cap">{label}</span><span class="v"><b>{value}</b>{r}</span></div>'

def page(c):
    first = next(ch for ch in c['name'] if ch.isalnum()).upper()
    foundry = f'<span class="foundry"><img src="images/events/foundry.png" alt="Foundry">{c["foundry"]}</span>' if c['foundry'] else ''
    figures = ''.join(figure(*f) for f in c['figures'])
    header = f"""
 <header class="chief">
  <div class="pic">{first}</div>
  <div class="who">
   <div class="name">{c['name']}</div>
   <div class="id"><span class="k">ID</span> {c['id']}<span class="rank">{c['rank']}</span></div>
   <div class="power"><b>{c['power']}</b><span class="pr">#{c['power_rank']}</span>{foundry}</div>
  </div>
  <div class="badge">{logo_of(c['logo'], c['tag'], 'logo')}<span class="tag">{c['tag']}</span></div>
  <div class="figs">{figures}</div>
 </header>"""
    troops = ''.join(f'<div class="item"><div class="art troop"><img class="p" src="images/troops/{k}.png" alt=""><img class="fc" src="images/troops/fc{c["fc"]}.png" alt=""></div>'
                     f'<div class="l1">{n}</div><div class="l2{" ex" if "Exalted" in t else ""}">{t}</div></div>' for n, k, t in c['troops'])
    heroes = ''.join(f'<div class="item"><div class="art hero">' + (f'<span class="eg">EG {eg}</span>' if eg else '') +
                     f'<span class="stars">{"★" * st}</span></div><div class="l1 unk">{h}</div><div class="l2">Lv. {lv}</div></div>'
                     for h, eg, lv, st in c['heroes'])
    lab = ''.join(figure(*a).replace('class="fig"', 'class="fig area"') for a in c['lab'])
    accounts = ''.join(
        f'<div class="acc{" on" if on else ""}">{logo_of(f, t, "alogo")}<div class="at"><span class="kind">{kind}</span>'
        f'<span class="an">{n}</span><span class="ai">{i}</span><span class="ap">{p}</span></div></div>'
        for f, t, kind, n, i, p, on in c['accounts'])
    accounts += '<div class="acc add"><span class="plus">+</span><div class="at"><span class="an">Add</span></div></div>'
    # The pencil sets the skill levels, which only Exalted troops have.
    pen = f'<span class="end">{PENCIL}</span>' if any('Exalted' in t for _, _, t in c['troops']) else ''
    return f"""<div class="pp">{header}
 <div class="body">
  <section class="troops"><h2>Troops{pen}</h2><div class="items three">{troops}</div></section>
  <section class="arena"><h2>Arena team</h2><div class="items five">{heroes}</div></section>
  <section class="lab"><h2>The Labyrinth</h2><div class="areas">{lab}</div></section>
  <section class="accounts"><h2>Your accounts</h2><div class="accs">{accounts}</div></section>
 </div>
 <p class="when">{c['updated']}</p>
</div>"""

CSS = """
.pp { --edge: 16px; --pic: 80px; width: 100%; max-width: 1080px; margin: 0 auto; padding: 22px var(--edge) 28px; box-sizing: border-box; color: var(--text); }
.pp h2 { display: flex; align-items: center; margin: 0 0 14px; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); }
.pp h2 .end { margin-left: auto; display: flex; }
.pen { width: 18px; height: 18px; color: var(--text-muted); }

/* Header: the owner's rules. Picture | name, ID, power | alliance. */
.chief { display: grid; grid-template-columns: var(--pic) minmax(0, 1fr) auto; grid-template-rows: var(--pic) auto; column-gap: 14px; }
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

/* Key figures (from wosoracle), two by two: the label, then the value with its rank small
   after it, written the way the power is written in the header. */
.figs { grid-column: 1 / -1; margin-top: 28px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 12px; }
.fig { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.fig .cap { font-size: 12px; font-weight: 700; color: var(--text-muted); line-height: 1.2; }
.fig .v { font-size: 22px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.fig .r { margin-left: 6px; font-size: 12px; color: var(--accent); }

/* Troops and the arena team: art, a name, one detail line, the same for every item. */
.body { margin-top: 34px; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "troops" "arena" "lab" "accounts"; row-gap: 34px; }
.troops { grid-area: troops; } .arena { grid-area: arena; } .lab { grid-area: lab; } .accounts { grid-area: accounts; }
.items { display: grid; column-gap: 8px; }
.items.three { grid-template-columns: repeat(3, minmax(0, 1fr)); } .items.five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.item { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; }
.art { width: 60px; height: 60px; position: relative; display: flex; align-items: center; justify-content: center; }
.art.troop { margin-left: 4px; } .art.troop .p { height: 60px; }
.art.troop .fc { position: absolute; top: -3px; left: -4px; height: 24px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.5)); }
.art .eg { position: absolute; top: 4px; left: 4px; font-size: 10px; font-weight: 800; line-height: 1; padding: 3px 4px; border-radius: 5px; background: rgba(0,0,0,.45); color: var(--fc-gold); }
.art.hero { border-radius: 14px; background: var(--glass-strong); box-shadow: 0 0 0 1px var(--glass-border); align-items: flex-end; }
.art.hero .stars { font-size: 9px; letter-spacing: 1px; color: var(--fc-gold); margin-bottom: 5px; }
.l1 { font-size: 12px; font-weight: 800; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.l1.unk { color: var(--text-faint); }
.l2 { font-size: 11px; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
.l2.ex { color: var(--exalted); }

/* The Labyrinth areas: the same figure as the key figures, smaller. */
.areas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px 8px; }
.fig.area .cap { min-height: 0; }
.fig.area .v { font-size: 19px; }

/* Your accounts: side by side, the one the person is on lit. */
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

.when { margin: 30px 0 0; font-size: 12px; font-weight: 600; color: var(--text-faint); }

@media (min-width: 900px) {
  .pp { --edge: 28px; --pic: 104px; padding-top: 34px; }
  /* The key figures take the rest of the header row, on the picture's top and bottom edges. */
  .chief { grid-template-columns: var(--pic) auto auto minmax(0, 1fr); grid-template-rows: var(--pic); column-gap: 22px; }
  .who { max-width: 430px; } .badge { margin-left: 26px; }
  .figs { grid-column: auto; margin: 0 0 0 56px; height: var(--pic); align-content: space-between; row-gap: 0; column-gap: 36px; justify-self: end; grid-template-columns: repeat(2, auto); }
  .figs .fig { gap: 10px; }
  .fig .cap { font-size: 12px; } .fig .v { font-size: 25px; } .fig .r { font-size: 13px; }
  .name { font-size: 34px; } .id { font-size: 16px; } .power { font-size: 42px; } .power .pr { font-size: 15px; } .foundry { font-size: 19px; } .foundry img { height: 24px; vertical-align: -4px; }
  .pic { font-size: 46px; border-radius: 22px; }
  .badge { width: 64px; } .badge .logo { height: 68px; } .badge .logo.none { width: 58px; height: 58px; font-size: 24px; border-radius: 14px; } .tag { font-size: 15px; }
  .body { margin-top: 48px; grid-template-columns: minmax(0, 3fr) minmax(0, 5fr); grid-template-areas: "troops arena" "lab accounts"; column-gap: 64px; row-gap: 48px; }
  .art { width: 72px; height: 72px; } .art.troop .p { height: 72px; } .art.troop .fc { height: 30px; }
  .l1 { font-size: 13px; } .l2 { font-size: 12px; }
  .fig.area .v { font-size: 22px; }
  .accs { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .when { margin-top: 40px; }
}
"""
SCRIPT = """<script>
// A long name (up to 16 characters) gets smaller until it fits.
for (const name of Array.from(document.querySelectorAll('.name'))) {
  let size = parseFloat(getComputedStyle(name).fontSize);
  while (name.scrollWidth > name.clientWidth + 0.5 && size > 9) { size -= 0.25; name.style.fontSize = size + 'px'; }
}
</script>"""
for key, c in CHIEFS.items():
    bar = re.sub(r'(<span class="me-name">)[^<]*', r'\g<1>' + c['name'], top)
    html = ('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<link rel="stylesheet" href="main.css"><style>' + CSS + '</style></head><body><div id="app" class="app">' + bar +
            '<main>' + page(c) + '</main></div>' + SCRIPT + '</body></html>')
    (here / f'v2-{key}.html').write_text(html)
print('built')
