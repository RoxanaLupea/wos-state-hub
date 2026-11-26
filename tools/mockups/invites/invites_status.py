# Draft of the Invites page's player card, drawn into the real site copy (phone).
import sys, json, html
sys.path.insert(0, '/home/claude/wos-state-hub/tools/render')
import shoot
from playwright.sync_api import sync_playwright

TROOP_FILE = {'infantry': 'infantry', 'lancer': 'lancer', 'marksman': 'marksmen'}
def tier_file(kind, tier):
    word = 'exalted' if tier >= 12 else 'helios' if tier == 11 else 't10'
    return f"images/troops/{TROOP_FILE[kind]}-{word}.webp"
def short(n, decimals=2):
    n = float(n)
    if n >= 1e9: return f"{n/1e9:.{decimals}f}".rstrip('0').rstrip('.') + 'B'
    if n >= 1e6: return (f"{n/1e6:.2f}" if n < 1e7 else f"{n/1e6:.1f}").rstrip('0').rstrip('.') + 'M'
    if n >= 1e3: return f"{n/1e3:.1f}".rstrip('0').rstrip('.') + 'K'
    return str(int(n))
def fc(furnace):
    return max(1, min(10, (int(furnace) - 30) // 5))

CAP = 1e9
LINKED = {151288720, 135786444}  # site accounts (Roxanne, Tif)
MARK = 'mark-d'
LINK_ICON = '<svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="link-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#link-colour)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></g></svg>'
CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#0B1222" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5l4 4 8-9"/></g></svg>'
COPY_ICON = '<svg class="cp" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="copy-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#copy-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/></g></svg>'
OPEN_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="open-icon-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#open-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-3"/><path d="M14.5 3.5h6v6"/><path d="M20.5 3.5L11.5 12.5"/></g></svg>'
OPEN_IDS = set()
COMPACT = 'compact' in sys.argv

SKILLS = {151288720: (3, 3, 3), 135786444: (3, 3, 3), 171969415: (2, 1, 0)}  # Lordy's are sample values to show the colours  # Exalted skill levels set on the site
# name, id, state, power, kills, labyrinth, migrant, furnace, troops (inf, lan, mark as tier/fc), contact, group
SPECIAL = [
  ('Lȏ̈яᴅ DαԀԀყ Tıғ', 135786444, 1252, 2853577537, 457835910, 2264, 7860255, 80, '12/10 12/10 12/10', ('ally', 'DVL'), None),
  ('Lordy', 171969415, 1252, 1409250644, 362035310, 2090, 5606105, 80, '12/10 12/10 12/10', ('ally', 'DVL'), None),
  ('вαву тιғ', 203436673, 1252, 1454489398, 136847538, 2079, 5673535, 80, '12/10 12/10 12/10', ('ally', 'DVL'), None),
]
INVITES = [
  ('Roxanne', 151288720, 1252, 1108698817, 372062108, 1986, 4476438, 80, '12/10 12/10 12/10', ('ally', 'DVL'), None),
  ('Mr Boombastic', 152637698, 1252, 1010847465, 268807363, 1956, 4389144, 80, '12/10 12/10 12/10', ('ally', 'DVL'), 'b'),
  ('HSU', 144327574, 1252, 1114894248, 126905469, 1956, 4249320, 80, '12/10 12/10 12/10', ('ally', 'DVL'), 'b'),
  ('Evelyn', 185811207, 1427, 806355375, 16350651, 1531, 1986460, 80, '10/10 10/9 11/10', ('ally', 'DVL'), 'a'),
  ('Brender', 186958172, 1427, 818187249, 7984813, 1601, 2096291, 80, '11/10 10/10 11/10', ('ally', 'DVL'), 'a'),
  ('Spickle', 186204736, 1427, 439018862, 4531386, 1275, 1303688, 76, '10/9 10/8 11/9', ('ally', 'DVL'), 'a'),
  ('Acy', 187711805, 1427, 615550814, 5049888, 1467, 1637078, 78, '11/9 10/9 11/9', ('ally', 'TOP'), 'a'),
  ('El Norr', 185532586, 1427, 1000996211, 140834907, 1873, 3937835, 80, '12/10 12/10 12/10', ('ally', 'TOP'), 'a'),
  ('冷泠丶', 177941370, 1302, 687331139, 2773364, 1445, 1537817, 79, '10/9 10/9 11/9', ('person', '利姆魯', 'RUU'), None),
  ('westeros', 197643235, 1427, 705190934, 6695267, 1311, 1488458, 80, '11/10 10/10 11/10', ('person', 'Kat', 'DVL'), None),
]
GROUP_OVERRIDE = {}
if 'palette' in sys.argv:
    GROUP_OVERRIDE = {r[1]: str(k + 1) for k, r in enumerate(INVITES[:8])}
    GROUP_OVERRIDE.update({INVITES[8][1]: None, INVITES[9][1]: None})
if 'small' in sys.argv:
    order = ['1', '1', '2', '2', '2', '3', '3', '4', '4', None]
    GROUP_OVERRIDE = {r[1]: order[k] for k, r in enumerate(INVITES)}
    GROUP_OVERRIDE.update({SPECIAL[0][1]: '5', SPECIAL[1][1]: '5', SPECIAL[2][1]: None})
ALLY = {'DVL': '#C2A4E8', 'TOP': '#93B4F5', 'RUU': '#E7A278'}

ROMAN = {10: 'X', 11: 'XI', 12: 'XII'}
def troop_text(troops, skills):
    parts = []
    for index, t in enumerate(troops.split()):
        tier = int(t.split('/')[0])
        level = f'<i>· {skills[index]}</i>' if skills and tier >= 12 else ''
        parts.append(f'<span>T{tier}{level}</span>')
    return ''.join(parts)

STATUS = {135786444: 'done', 171969415: 'sent', 203436673: 'ready', 151288720: 'over', 185811207: 'sent', 177941370: 'rej', 152637698: 'over', 144327574: 'over', 186958172: 'sent', 186204736: 'ready', 187711805: 'ready', 185532586: 'over', 197643235: 'ready'}
OVER = 'over' in sys.argv
STATUS_WORD = {'ready': 'Ready', 'over': 'Over cap', 'sent': 'Sent', 'done': 'Transferred', 'rej': 'Rejected', 'exp': 'Expired'}
POP_ID = int(next((a[4:] for a in sys.argv if a.startswith('pop=')), '185811207'))
CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 9.5L12 5l4.5 4.5M7.5 14.5L12 19l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ADD_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="add-icon-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><path d="M12 4.5v15M4.5 12h15" fill="none" stroke="url(#add-icon-colour)" stroke-width="2.2" stroke-linecap="round"/></svg>'
def lineIcon(i, path):
    return f'<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="{i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--quiet-tint)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><path d="{path}" fill="none" stroke="url(#{i})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CANCEL_ICON = lineIcon('cancel-icon-colour', 'M6 6l12 12M18 6L6 18')
EDITING = 'editing' in sys.argv
REMOVED = set()
FLAGGED = {187711805: 'Rejected our invite in the October transfer'} if 'flags' in sys.argv else {}
TIP_DONE = 'tips' in sys.argv
GRIP = '<svg class="grip" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12M6 12h12M6 16h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
PROF = 'spickle' if 'spickle' in sys.argv else 'tif'
PROF_ID = 203436673 if 'baby' in sys.argv else 186204736 if PROF == 'spickle' else 135786444
PROF_RGB = '127,200,242'
SELECTED = {177941370, 197643235} if 'select' in sys.argv else set()
EDIT_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="edit-icon-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#edit-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-4.5"/><path d="M17.6 3.2a2.3 2.3 0 0 1 3.2 3.2L12 15.2l-4.2 1 1-4.2z"/></g></svg>'
BIN_ICON = lineIcon('bin-icon-colour', 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10.2 11v5M13.8 11v5')
SAVE_ICON = lineIcon('save-icon-colour', 'M4.5 12.5l5 5L19.5 6.5')

ST_PATH = {
  'ready': 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM8 12.3l2.8 2.8L16.2 9.6',
  'over': 'M12 19.5V7M6.5 12.5L12 7l5.5 5.5M5 4h14',
  'sent': 'M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z',
  'done': 'M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14M4 12h11M11 8l4 4-4 4',
  'rej': 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM9 9l6 6M15 9l-6 6',
  'exp': 'M7 3.5h10M7 20.5h10M8 3.5c0 4 8 5 8 8.5s-8 4.5-8 8.5M16 3.5c0 4-8 5-8 8.5s8 4.5 8 8.5',
}
import itertools
ICON_COUNT = itertools.count()
def st_icon(k):
    n = next(ICON_COUNT)
    return f'<svg class="sti" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="st-{k}-{n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--sc)"/><stop offset="1" style="stop-color: color-mix(in srgb, var(--sc) 35%, var(--text))"/></linearGradient></defs><path d="{ST_PATH[k]}" fill="none" stroke="url(#st-{k}-{n})" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

GPICK_ID = 177941370 if 'gpick' in sys.argv else 0
def group_pick(pid):
    def faces(names, colour):
        return '<span class="gfaces">' + ''.join(f'<i style="--gc:{colour}">{n[0]}</i>' for n in names[:3]) + '</span>'
    rows = [
        ('<span class="gnew">' + ADD_ICON + '</span>', '<span class="gname">New group</span>', ''),
        (faces(['Evelyn', 'Brender', 'Spickle'], '#6FD3C6'), '<span class="gname">Evelyn, Brender, Spickle <em>+2</em></span>', '#6FD3C6'),
        (faces(['Mr Boombastic', 'HSU'], '#E88FB4'), '<span class="gname">Mr Boombastic, HSU</span>', '#E88FB4'),
    ]
    return '<div class="pick gpick">' + ''.join(f'<button type="button" class="opt gopt" style="--gc:{c or "transparent"}">{a}{b}</button>' for a, b, c in rows) + '</div>'

WARN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4L21 19.5H3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 10v4.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/></svg>'
def FLAG_HTML(pid):
    tip = f'<span class="tip"><b>Flagged</b>{html.escape(FLAGGED[pid])}<em>Open the entry</em></span>' if 'fliptip' in sys.argv else ''
    return f'<span class="flag">{WARN}{tip}</span>'

def status_chip(pid, group=None):
    if EDITING:
        if pid in REMOVED:
            return f'<span class="stw"><button type="button" class="quiet neutral">{lineIcon("undo-colour-" + str(next(ICON_COUNT)), "M9 14L4.5 9.5 9 5M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3")}<span class="words">Keep</span></button></span>'
        n = next(ICON_COUNT)
        gpop = group_pick(pid) if pid == GPICK_ID else ''
        grp_icon = lineIcon("grp-colour-" + str(n), "M8.5 5.3a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 0 0 0-6.4zM16 6.9a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 0 0 0-5.2zM3 19c0-3.2 2.5-5.5 5.5-5.5S14 15.8 14 19M14.5 14.2c.5-.2 1-.3 1.5-.3 2.6 0 4.5 2 4.5 4.6")
        grp_btn = (f'<button type="button" class="quiet neutral group-act">{grp_icon}<span class="words">Leave group</span></button>' if group
                   else f'<button type="button" class="quiet group-act{" open" if gpop else ""}">{grp_icon}<span class="words">Add to group</span></button>')
        return (f'<span class="stw eacts">{grp_btn}'
                f'<button type="button" class="quiet cancel remove">{lineIcon("bin-colour-" + str(n), "M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10.2 11v5M13.8 11v5")}<span class="words">Remove</span></button>{gpop}</span>')
    return status_chip_view(pid)

OVER_STATUS = {135786444: 'done', 171969415: 'done', 203436673: 'exp', 151288720: 'done', 152637698: 'done', 144327574: 'exp', 185811207: 'done', 186958172: 'done', 186204736: 'rej', 187711805: 'exp', 185532586: 'done', 177941370: 'done', 197643235: 'done'}
def status_chip_view(pid):
    if FUTURE: return ''
    s = OVER_STATUS.get(pid, 'exp') if OVER else STATUS.get(pid, 'none')
    pop = ''
    if pid == POP_ID:
        pop = '<div class="pick">' + ''.join(
            f'<button type="button" class="opt s-{k}{" on" if k == s else ""}"><span class="ow">{st_icon(k)}<span>{w}</span></span>{TICK if k == s else ""}</button>'
            for k, w in STATUS_WORD.items()) + '</div>'
    tip = '<span class="tip tip-left"><b>Transferred</b>6 Dec 2026, 00:14 UTC</span>' if TIP_DONE and s == 'done' else ''
    return f'<span class="stw"><button type="button" class="stc s-{s}{" open" if pop else ""}">{st_icon(s)}<span class="words">{STATUS_WORD[s]}</span></button>{pop}{tip}</span>'

def adding_row():
    return f'''<div class="ic adding">
  <div class="av"><span>M</span></div>
  <div class="who">
    <div class="addline"><input class="info-field id-entry" value="152637698" aria-label="In-game ID">
      <span class="edit-actions"><button type="button" class="quiet cancel">{CANCEL_ICON}<span class="words">Cancel</span></button><button type="button" class="quiet confirm">{SAVE_ICON}<span class="words">Save</span></button></span></div>
    <div class="found"><b>Mr Boombastic</b><img class="ffc" src="images/troops/fc10.webp"><span>#1252</span><span class="hot">1.01B</span></div>
  </div>
</div>'''

COPIED_ID = 152637698
COPIED_ICON = '<svg class="cp" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" fill="none" stroke="var(--section)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="7.5" y="7.5" width="14" height="14" rx="3" fill="var(--section)"/><path d="M11 14.6l2.4 2.4 4.4-4.8" fill="none" stroke="#0B1222" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
COPIED_BTN = '<button type="button" class="copy-p copied" aria-label="Copied">' + COPIED_ICON + '</button>'
STATE_OPT = next((a[6:] for a in sys.argv if a.startswith('state=')), '')
def card(p, special, extra=''):
    name, pid, state, power, kills, lab, mig, furnace, troops, contact, group = p
    if pid in GROUP_OVERRIDE: group = GROUP_OVERRIDE[pid]
    over = (not special) and power > CAP
    status = status_chip(pid, group)
    tr = ''
    skills = SKILLS.get(pid)
    for index, (kind, t) in enumerate(zip(['infantry', 'lancer', 'marksman'], troops.split())):
        tier, tfc = map(int, t.split('/'))
        badge = f'<span class="sk l{skills[index]}"><b>{skills[index]}</b></span>' if skills and tier >= 12 else ''
        tr += f'<span class="tp"><img class="p" src="{tier_file(kind, tier)}"><img class="f" src="images/troops/fc{tfc}.webp">{badge}</span>'
    if contact[0] == 'ally':
        con = f'<span class="tag" style="--c:{ALLY[contact[1]]}">{contact[1]}</span>'
    else:
        con = f'<span class="via">{html.escape(contact[1])}</span><span class="tag" style="--c:{ALLY[contact[2]]}">{contact[2]}</span>'
    ring = f' grouped g-{group}' if group else ''
    opened = ' open' if pid in OPEN_IDS else ''
    gone = (' gone-row' if EDITING and pid in REMOVED else '') + (' picked' if pid in SELECTED else '') + (' viewing' if 'profile' in sys.argv and pid == PROF_ID else '')
    return f'''<div class="ic{ring}{opened}{gone}{extra}">
  {('<i class="grp">' + GRIP + '</i>') if 'grips' in sys.argv else ''}<div class="av"><span>{html.escape(name.strip()[0])}</span><i class="pf">{OPEN_ICON}</i>{('<i class="avst">' + str(state) + '</i>') if STATE_OPT == 'pic' else ''}{('<i class="on-site">' + LINK_ICON + '</i>') if pid in LINKED and MARK == 'mark-c' else ''}</div>
  <div class="who">
    <div class="nm"><b>{html.escape(name)}</b>{('<i class="on-site-name">' + LINK_ICON + '</i>') if pid in LINKED and MARK == 'mark-d' else ''}<img class="ffc" src="images/troops/fc{fc(furnace)}.webp"></div>
    {('<div class="id idnew"><span class="st8">#' + str(state) + '</span><span class="idg">' + str(pid) + '</span>' + (COPIED_BTN if pid == COPIED_ID else '<button type="button" class="copy-p" aria-label="Copy the player\'s ID">' + COPY_ICON + '</button>') + '</div>') if 'idline' in sys.argv else ('<div class="id"><button type="button" class="copy"><b>' + str(pid) + '</b>' + COPY_ICON + '</button><span class="st8">#' + str(state) + '</span></div>')}
    <div class="pw{' hot' if over else ''}">{short(power, 3 if over and round(power/1e9, 2) == CAP/1e9 else 2)}<span class="pst">#{state}</span></div>
  </div>
  <div class="ctr">{troop_text(troops, SKILLS.get(pid))}</div><div class="cfc"><img src="images/troops/fc{fc(furnace)}.webp" alt="FC {fc(furnace)}"></div><div class="cstc">{state}</div>
  <div class="cn k">{short(kills)}</div><div class="cn l">{lab:,}</div><div class="cn t">{short(mig)}</div>
  <div class="cpw{' hot' if over else ''}">{'' if EDITING else '<span class="pwn">' + (FLAG_HTML(pid) if pid in FLAGGED else '') + short(power, 3 if over and round(power/1e9, 2) == CAP/1e9 else 2) + '</span>'}{status_chip(pid, group)}</div>
  <div class="side">{status}<div class="con{' editable' if EDITING else ''}">{con}{('<span class="cst">#' + str(state) + '</span>') if STATE_OPT == 'tag' else ''}</div></div>

  <div class="line2"><div class="troops">{tr}</div>
  <div class="vals{' v4' if STATE_OPT == 'stat' else ''}">
    {('<div class="vst"><i>State</i><b>' + str(state) + '</b></div>') if STATE_OPT == 'stat' else ''}<div><i>Kills</i><b>{short(kills)}</b></div>
    <div><i>Labyrinth</i><b>{lab:,}</b></div>
    <div><i>Transfer</i><b>{short(mig)}</b></div>
  </div></div>

</div>'''

def section(title, color, count, rows, special=False, empty=None, compact=False, add=False, adding=False):
    def edge(i):
        G = lambda r: GROUP_OVERRIDE.get(r[1], r[-1]) if r[1] in GROUP_OVERRIDE else r[-1]
        g = G(rows[i])
        if not g: return ''
        first = i == 0 or G(rows[i-1]) != g
        last = i == len(rows) - 1 or G(rows[i+1]) != g
        return (' g-first' if first else '') + (' g-last' if last else '')
    body = (adding_row() if adding else '') + (''.join(card(r, special, edge(i)) for i, r in enumerate(rows)) if rows else f'<p class="empty">{empty}</p>')
    head = '' if not compact else ('<div class="chd"><span></span><span></span><span class="fch">FC</span><span>Kills</span><span>Labyrinth</span><span>Transfer</span><span class="sth">State</span><span>Power</span><span></span></div>' if 'idline' in sys.argv else '<div class="chd"><span></span><span></span><span class="cls"><img src="images/troops/infantry-class.webp" title="Infantry"><img src="images/troops/lancer-class.webp" title="Lancer"><img src="images/troops/marksmen-class.webp" title="Marksmen"></span><span>Kills</span><span>Labyrinth</span><span>Transfer</span><span>Power</span><span></span></div>') if rows else ''
    icons = view_icons(compact)
    addb = f'<button type="button" class="edit-button add-player">{ADD_ICON}<span><span class="words">Add</span></span></button>' if add else ''
    return f'<section class="il{" cmp" if compact else ""}" style="--lc:{color}"><h2><span>{title} · {count}</span><span class="hr">{addb}{icons}</span></h2>{head}{body}</section>'

def stat_cell(k, n):
    return f'<div class="sc s-{k}"><span class="stc s-{k}">{st_icon(k)}<span class="words">{STATUS_WORD[k]}</span></span><b>{n}</b></div>'
STATS_HTML = None
def ring(colour, used, total, left):
    import math
    r = 26; c = 2 * math.pi * r; f = used / total
    arc = '' if used == 0 else (f'<circle cx="32" cy="32" r="{r}" fill="none" stroke="{colour}" stroke-width="6" stroke-linecap="round" stroke-dasharray="{c*f:.1f} {c:.1f}" transform="rotate(-90 32 32)" style="filter: drop-shadow(0 0 4px {colour}88)"/>')
    return (f'<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="{r}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="6"/>{arc}</svg>'
            f'<b class="rn">{left}</b>')
STATUS_COUNTS = [('done', 9), ('rej', 1), ('exp', 3)] if OVER else [('ready', 4), ('over', 4), ('sent', 3), ('done', 1), ('rej', 1), ('exp', 0)]
FUTURE = 'future' in sys.argv
PHASE = 'future' if FUTURE else ('over' if OVER else ('open' if 'openphase' in sys.argv else 'inv'))
DATE_TEXT = '3 Jan 2027' if FUTURE else '6 Dec 2026'
ARR_L = '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="arr-l-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><path d="M14.5 6l-6 6 6 6" fill="none" stroke="url(#arr-l-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARR_R = '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="arr-r-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><path d="M9.5 6l6 6-6 6" fill="none" stroke="url(#arr-r-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
def date_line():
    pin = '<button type="button" class="quiet-button today-button pin-cur' + ('' if FUTURE else ' dim') + '" aria-label="Current transfer" title="Back to the current transfer"><svg class="line-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="pin-cur-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#pin-cur-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.6c-.6-.5-7-6.3-7-11.6a7 7 0 0 1 14 0c0 5.3-6.4 11.1-7 11.6z"/><circle cx="12" cy="10" r="2.8"/></g></svg></button>'
    return f'<div class="tdate"><span>{DATE_TEXT}</span><span class="tarrs">{pin}<button type="button" class="tarr{"" if FUTURE else " dim"}">{ARR_L}</button><button type="button" class="tarr">{ARR_R}</button></span></div>'
PHASE_NAME = {'inv': 'Invitation transfer', 'open': 'Open transfer', 'over': 'Transfer', 'future': 'Upcoming transfer'}
TIME_TEXT = 'Over' if PHASE == 'over' else ('22h 05m' if PHASE == 'open' else ('' if PHASE == 'future' else '1d 14h 20m'))
TIME_NOTE = 'ended 7 Dec' if PHASE == 'over' else ('until the transfer ends' if PHASE == 'open' else 'until the open transfer')
def track():
    a = {'inv': ('on', '', '62%', '0%'), 'open': ('past', 'on', '100%', '35%'), 'over': ('past', 'past', '100%', '100%')}[PHASE]
    return (f'<div class="trk"><span class="tw {a[0]}">Invitation</span><span class="tb"><i style="--f:{a[2]}"></i><b></b><i style="--f:{a[3]}"></i></span>'
            f'<span class="tw {a[1]}">Open</span></div>')
def stats():
    total = sum(n for _, n in STATUS_COUNTS)
    bar = ''.join(f'<i class="s-{k}" style="flex:{n}"></i>' for k, n in STATUS_COUNTS if n)
    return ('<aside class="stats"><div class="pc-title"><span class="cd-k">' + PHASE_NAME[PHASE] + '</span><b>' + TIME_TEXT + '</b></div><section class="glass tstat gold">'
      '<div class="cd">' + date_line() + '<div class="cd-ph">' + PHASE_NAME[PHASE] + '</div><div class="cd-v">' + TIME_TEXT + '</div>'
      + '<dl class="facts">'
      '<dt>Transfer<br>manager</dt>' + ('<dd class="who-m tbd">After SvS</dd>' if FUTURE else '<dd class="who-m"><span class="mp">L</span><b>Lȏ̈яᴅ DαԀԀყ Tıғ</b><span class="tag" style="--c:#C2A4E8">DVL</span></dd>') + '</dl>'
      '<div class="gcp"><div><i>Group</i><b>1190–1552</b></div><div><i>Power cap</i><b>1.0B</b></div></div></div>'
      + (('<h3>Arrived</h3><div class="pl">'
      f'<div class="pc" style="--lc:#F0D99D"><i>Special</i><div class="rw">{ring("#F0D99D", 2, 3, 2)}</div><em>of 3</em></div>'
      f'<div class="pc" style="--lc:#B0AAF1"><i>Ordinary</i><div class="rw">{ring("#B0AAF1", 5, 35, 5)}</div><em>of 35</em></div>'
      f'<div class="pc" style="--lc:#8BB7F4"><i>Open</i><div class="rw">{ring("#8BB7F4", 2, 20, 2)}</div><em>of 20</em></div></div>'
      '<div class="never"><b>11</b><span>invites sent</span></div>') if OVER else
      ('<h3>Available invites</h3><div class="pl">'
      f'<div class="pc" style="--lc:#F0D99D"><i>Special</i><div class="rw">{ring("#F0D99D", 0, 3, 3) if FUTURE else ring("#F0D99D", 3, 3, 0)}</div><em>of 3</em></div>'
      f'<div class="pc" style="--lc:#B0AAF1"><i>Ordinary</i><div class="rw">{ring("#B0AAF1", 2, 35, 33) if FUTURE else ring("#B0AAF1", 10, 35, 25)}</div><em>of 35</em></div>'
      f'<div class="pc" style="--lc:#8BB7F4"><i>Open</i><div class="rw">{ring("#8BB7F4", 0, 20, 20)}</div><em>of 20</em></div></div>'))
      + ('' if FUTURE else f'<h3>Status</h3><div class="sbar">{bar}</div><div class="sg">' + ''.join(stat_cell(k, n) for k, n in STATUS_COUNTS) + '</div>')
      + '</section></aside>')
def view_icons(compact):
    return '<div class="view-icons"><button type="button" class="view-icon" aria-pressed="' + ('true' if compact else 'false') + '" title="Compact">' + '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="view-compact-colour" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#view-compact-colour)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6.5" r="1.6" fill="url(#view-compact-colour)" stroke="none"/><path d="M9 6.5 h11"/><circle cx="5" cy="12" r="1.6" fill="url(#view-compact-colour)" stroke="none"/><path d="M9 12 h11"/><circle cx="5" cy="17.5" r="1.6" fill="url(#view-compact-colour)" stroke="none"/><path d="M9 17.5 h11"/></g></svg>' + '</button><button type="button" class="view-icon" aria-pressed="' + ('false' if compact else 'true') + '" title="Details">' + '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="view-details-colour" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#view-details-colour)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="7.5" rx="2"/><rect x="3.5" y="13" width="17" height="7.5" rx="2"/><circle cx="7" cy="7.25" r="1.6" fill="url(#view-details-colour)" stroke="none"/><circle cx="7" cy="16.75" r="1.6" fill="url(#view-details-colour)" stroke="none"/><path d="M10.5 7.25h6.5M10.5 16.75h6.5"/></g></svg>' + '</button></div>'
ADDSTATE = next((a[9:] for a in sys.argv if a.startswith('addstate=')), 'ok')
def add_popup(state):
    found = '<div class="found"><div class="pic">M</div><div class="who"><div class="name">Mr Boombastic</div><div class="power"><b>1.01B</b><span class="pst">#1252</span></div></div></div>'
    note = ''; idv = '152637698'; special_dis = ' disabled'; ordinary = ' selected'; openw = ''; ordis = ''
    save = '<button type="button" class="primary-button save">Save</button>'
    contact = ('<div class="contact-in"><input class="info-field" placeholder="Contact (alliance or player)" value="DV"><div class="sugg">'
               '<button type="button" class="sg-row on"><span class="tag" style="--c:#C2A4E8">DVL</span><span>Alliance in 1458</span></button>'
               '<button type="button" class="sg-row"><i>K</i><span>Kat</span><span class="tag" style="--c:#C2A4E8">DVL</span></button>'
               '<button type="button" class="sg-row"><i>D</i><span>Dvorak</span><span class="tag" style="--c:#93B4F5">TOP</span></button></div></div>')
    if state == 'missing':
        found = ''; idv = '15263769'; contact = ''
        note = '<p class="add-answer problem">Still not found after 3 tries. You can add the ID anyway; the details fill in once the game finds it.</p>'
        save = '<button type="button" class="primary-button save">Add anyway</button>'
    elif state == 'listed':
        contact = ''
        note = '<p class="add-answer problem">Already in Ordinary Invites.</p>'
        save = '<button type="button" class="primary-button save" disabled>Save</button>'
    elif state == 'black':
        contact = ''
        note = '<p class="add-answer warn">Blacklisted: left with the bank during the October transfer. Saving adds the player flagged.</p>'
    elif state == 'full':
        contact = ''; ordinary = ''; openw = ' selected'; ordis = ' disabled'
        note = '<p class="add-answer">Ordinary Invites is full, so the player goes to Open Transfer until it is clarified.</p>'
    if state != 'contact': contact = ''
    lists = (f'<div class="kind-words" role="group" aria-label="List"><button type="button" class="kind-word"{special_dis}>Special</button>'
             f'<button type="button" class="kind-word{ordinary}"{ordis}>Ordinary</button><button type="button" class="kind-word{openw}">Open</button></div>') if state != 'missing' and state != 'listed' else ''
    return ('<div class="leave-prompt"><div class="leave-prompt-box glass add-invite" role="dialog" aria-modal="true">'
            '<div class="pp adding"><section class="add"><h2>Add player</h2>'
            f'<div class="add-id"><input class="info-field id-entry" inputmode="numeric" placeholder="In-game ID" value="{idv}"></div>'
            + found + note + contact + lists +
            f'<div class="saverow"><button type="button" class="ghost-button">Cancel</button>{save}</div>'
            '</section></div></div></div>')
POPUP = add_popup(ADDSTATE)
OPEN_DROP = """<section class="il drop cmp" style="--lc:#8BB7F4"><h2><span>OPEN TRANSFER · 0/20</span></h2><div class="land"></div>@@LIFTED@@</section>
"""
ASK = """<div class="leave-prompt"><div class="leave-prompt-box glass" role="dialog" aria-modal="true"><p class="leave-prompt-text">Are you sure you want to remove Roxanne?</p><div class="leave-prompt-actions"><button type="button" class="ghost-button">Cancel</button><button type="button" class="danger-button">Remove</button></div></div></div>"""
TOPS_VIEW = f'<span class="tops"><button type="button" class="edit-button add-player">{ADD_ICON}<span><span class="words">Add</span></span></button><button type="button" class="edit-button">{EDIT_ICON}<span><span class="words">Edit</span></span></button></span>'
GROUP_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="group-icon-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#group-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8.5" r="3.2"/><circle cx="16" cy="9.5" r="2.6"/><path d="M3 19c0-3.2 2.5-5.5 5.5-5.5S14 15.8 14 19"/><path d="M14.5 14.2c.5-.2 1-.3 1.5-.3 2.6 0 4.5 2 4.5 4.6"/></g></svg>'
TOPS_EDIT = f'<span class="tops edit-actions"><button type="button" class="quiet cancel">{CANCEL_ICON}<span class="words">Cancel</span></button><button type="button" class="quiet confirm">{SAVE_ICON}<span class="words">Save</span></button></span>'
TOPS = TOPS_EDIT if EDITING else TOPS_VIEW
RMV = """<div class="leave-prompt"><div class="leave-prompt-box glass add-invite" role="dialog" aria-modal="true">
<div class="pp adding"><section class="add"><h2>Remove player</h2>
<div class="found"><div class="pic">R</div><div class="who"><div class="name">Roxanne</div><div class="id"><span class="idg">151288720</span></div><div class="power"><b>1.11B</b><span class="pst">#1252</span></div></div></div>
<div class="saverow"><button type="button" class="ghost-button">Cancel</button><button type="button" class="danger-button">Remove</button></div>
</section></div></div></div>"""
PICKBAR = f'<div class="pickbar leave-prompt-box glass"><button type="button" class="edit-button">{GROUP_ICON}<span><span class="words">Group</span></span></button></div>'
NG_PEOPLE = ['Lȏ̈яᴅ DαԀԀყ Tıғ', 'Lordy', 'вαву тιғ', 'Roxanne', 'Mr Boombastic', 'HSU']
NG_CUSTOM = 'ngcustom' in sys.argv
NG_ALL = [('Roxanne', 0), ('Mr Boombastic', 0), ('HSU', 0), ('Evelyn', 1), ('Brender', 1), ('Spickle', 0), ('Acy', 0), ('El Norr', 0), ('冷泠丶', 0), ('westeros', 1)]
NG_CUSTOM_HTML = '<div class="ng-list">' + ''.join(f'<button type="button" class="ng-pick{" on" if on else ""}"><i>{html.escape(n[0])}</i><span>{html.escape(n)}</span><b></b></button>' for n, on in NG_ALL) + '</div>'
NEWGROUP = ('<div class="leave-prompt"><div class="leave-prompt-box glass add-invite ng" role="dialog" aria-modal="true"><div class="pp adding"><section class="add">'
  '<h2>New group</h2>' +
  ('<div class="kind-words ng-how"><button type="button" class="kind-word selected">Custom</button><button type="button" class="kind-word">State</button><button type="button" class="kind-word">Contact</button></div>' + NG_CUSTOM_HTML if NG_CUSTOM else
  '<div class="kind-words ng-how"><button type="button" class="kind-word">Custom</button><button type="button" class="kind-word selected">State</button><button type="button" class="kind-word">Contact</button></div>'
  '<div class="ng-opts"><button type="button" class="ng-opt on">#1252</button><button type="button" class="ng-opt">#1427</button><button type="button" class="ng-opt">#1302</button></div>'
  '<div class="ng-who">' + ''.join(f'<div class="ng-p"><i>{html.escape(n.strip()[0])}</i><span>{html.escape(n)}</span></div>' for n in NG_PEOPLE) + '</div>') +
  '<div class="saverow"><button type="button" class="ghost-button">Cancel</button><button type="button" class="primary-button save">Create</button></div>'
  '</section></div></div></div>')
STATS_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="view-stats-colour" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#view-stats-colour)" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 8 8h-8z" fill="url(#view-stats-colour)" stroke="none"/></g></svg>'
LIST_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="view-list-colour" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#view-list-colour)" stroke-width="1.8" stroke-linecap="round"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></g></svg>'
SWAP = '<span class="view-icons swap"><button type="button" class="view-icon" aria-pressed="' + ('false' if 'phstats' in sys.argv else 'true') + '" title="Lists">' + LIST_ICON + '</button><button type="button" class="view-icon" aria-pressed="' + ('true' if 'phstats' in sys.argv else 'false') + '" title="Statistics">' + STATS_ICON + '</button></span>'
DETAILS_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="details-icon-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#details-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12h8.5"/></g></svg>'
DETAILS_BTN = '<button type="button" class="edit-button details-btn" aria-label="Details">' + DETAILS_ICON + '<span><span class="words">Details</span></span></button>'
PIN_PHONE = '<button type="button" class="quiet-button pin-cur" aria-label="Current transfer"><svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="pin-ph-colour" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs><g fill="none" stroke="url(#pin-ph-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.6c-.6-.5-7-6.3-7-11.6a7 7 0 0 1 14 0c0 5.3-6.4 11.1-7 11.6z"/><circle cx="12" cy="10" r="2.8"/></g></svg></button>'
PAGE = f'''
<div class="pbar phone-only"><div class="ptitle"><span class="cd-k">{PHASE_NAME[PHASE]}</span><b>{DATE_TEXT if FUTURE else TIME_TEXT}{PIN_PHONE if FUTURE else ""}</b></div><span class="ph-ctl">{TOPS}{DETAILS_BTN}</span></div>
{'<div class="leave-prompt sheet-wrap phone-only"><div class="sheet">' + stats() + '</div></div>' if 'sheet' in sys.argv else ''}
{'' if 'phstats' in sys.argv else (section('SPECIAL INVITES', '#F0D99D', '0/3', [], True, empty='No one yet.', compact=False) if FUTURE else section('SPECIAL INVITES', '#F0D99D', '3/3', SPECIAL, True, compact=False))}
{'' if 'phstats' in sys.argv else section('ORDINARY INVITES', '#B0AAF1', ('2/35' if FUTURE else '8/35' if OVER else '10/35'), ([INVITES[3], INVITES[4]] if FUTURE else [INVITES[0], INVITES[8]] if 'drag' in sys.argv else ([INVITES[0], INVITES[1], INVITES[2], INVITES[3], INVITES[4], INVITES[5], INVITES[6], INVITES[7]] if OVER else [INVITES[0], INVITES[1], INVITES[2], INVITES[3], INVITES[4], INVITES[5], INVITES[6], INVITES[7], INVITES[8], INVITES[9]])), compact=True, add=False, adding=False)}
{section('OPEN TRANSFER', '#8BB7F4', '2/20', [INVITES[8], INVITES[9]], compact=True) if OVER and 'phstats' not in sys.argv else ''}{OPEN_DROP.replace('@@LIFTED@@', card(INVITES[3], False).replace('class="ic', 'class="ic lifted', 1)) if 'drag' in sys.argv else ''}
{POPUP if 'popup' in sys.argv else ''}{ASK if 'ask' in sys.argv else ''}{RMV if 'rmv' in sys.argv else ''}{PICKBAR if SELECTED else ''}{NEWGROUP if 'ngroup' in sys.argv else ''}

'''
CARD_PAL = [('Teal','95,208,194'),('Pink','238,143,184'),('Sky','127,200,242'),('Coral','244,160,126'),('Violet','169,155,245'),('Aqua','111,214,236'),('Orchid','217,139,230'),('Cobalt','124,146,245')]
CARDS = '<aside class="stats cards">' + ''.join(f'<section class="glass mini" style="background:linear-gradient(135deg,rgba({c},0.30),rgba({c},0.04) 65%),var(--glass);box-shadow:inset 0 1px 0 rgba(255,255,255,0.14),inset 0 -3px 0 rgba({c},0.8),0 10px 26px rgba({c},0.14);"><b>{n}</b><span>Labyrinth</span><i>1,275</i></section>' for n, c in CARD_PAL) + '</aside>'
LHEAD = '<div class="lhead">' + date_line() + TOPS + '</div>'
RECORDS = 'records' in sys.argv
def rec_card(date, mgr, mtag, mcol, arrived, sent, counts, pin=False):
    st = ''.join(f'<span class="rs s-{k}">{st_icon(k)}<b>{n}</b></span>' for k, n in counts)
    ar = ''.join(f'<span class="ra" style="--lc:{c}"><b>{a}</b>/{t}</span>' for c, a, t in [('#F0D99D', arrived[0], 3), ('#B0AAF1', arrived[1], 35), ('#8BB7F4', arrived[2], 20)])
    return ('<div class="rhead">'
      f'<div class="rl1"><b class="rd">{date}</b>{PIN_PHONE if pin else ""}<span class="rgc">1190–1552 · 1.0B</span><span class="rst">{st}</span></div>'
      f'<div class="rl2"><span class="rmg"><span class="mp">{mgr[0]}</span><b>{html.escape(mgr)}</b><span class="tag" style="--c:{mcol}">{mtag}</span></span>'
      f'<span class="rar">{ar}<span class="rsent"><b>{sent}</b> sent</span></span></div>'
      '</div>')
def rec_lists(sp, od, op):
    out = ''
    for title, col, rows, tot in [('SPECIAL INVITES', '#F0D99D', sp, 3), ('ORDINARY INVITES', '#B0AAF1', od, 35), ('OPEN TRANSFER', '#8BB7F4', op, 20)]:
        if rows: out += section(title, col, f'{len(rows)}/{tot}', rows, title.startswith('SPECIAL'), compact=True)
    return out
REC_DEC = (rec_card('6 Dec 2026', 'Lȏ̈яᴅ DαԀԀყ Tıғ', 'DVL', '#C2A4E8', (2, 5, 2), 11, [('done', 9), ('rej', 1), ('exp', 3)]),
           rec_lists([SPECIAL[0], SPECIAL[1]], [INVITES[0], INVITES[1], INVITES[3], INVITES[4], INVITES[7]], [INVITES[8], INVITES[9]]))
REC_NOV = (rec_card('1 Nov 2026', 'Roxanne', 'DVL', '#C2A4E8', (1, 3, 1), 8, [('done', 5), ('rej', 0), ('exp', 3)], pin='rec=nov' in sys.argv),
           rec_lists([SPECIAL[2]], [INVITES[2], INVITES[5], INVITES[6]], [INVITES[9]]))
REC_NAV = f'<div class="lhead rnav"><div class="tdate"><span class="tarrs"><button type="button" class="tarr">{ARR_L}</button><button type="button" class="tarr dim">{ARR_R}</button></span></div></div>'
REC_OCT = (rec_card('4 Oct 2026', 'Roxanne', 'DVL', '#C2A4E8', (2, 4, 0), 9, [('done', 6), ('rej', 1), ('exp', 2)]),
           rec_lists([SPECIAL[1], SPECIAL[2]], [INVITES[6], INVITES[7], INVITES[2], INVITES[5]], []))
REC_SEP = (rec_card('6 Sep 2026', 'Lȏ̈яᴅ DαԀԀყ Tıғ', 'DVL', '#C2A4E8', (1, 2, 1), 5, [('done', 4), ('rej', 0), ('exp', 1)]),
           rec_lists([SPECIAL[0]], [INVITES[3], INVITES[4]], [INVITES[8]]))
REC_ONE = {'dec': REC_DEC, 'nov': REC_NOV}.get(next((a[4:] for a in sys.argv if a.startswith('rec=')), 'dec'))
REC_PHONE = '<div class="rcols"><div class="rcol">' + REC_ONE[0] + REC_ONE[1] + '</div></div>'
REC_PAGE = ('<div class="rscroll"><div class="rcols">' + ''.join(f'<div class="rcol">{c}{l}</div>' for c, l in [REC_DEC, REC_NOV, REC_OCT, REC_SEP]) + '</div></div>')
WIDE_PAGE = ('<div class="two lists-panel"><section class="glass lists-card"><div class="lists">' + PAGE + '</div></section>' if 'panel' in sys.argv else '<div class="two"><div class="lists">' + LHEAD + PAGE + '</div>') + (CARDS if 'cards' in sys.argv else '<aside class="stats prof"><section class="glass prof-card" style="background:linear-gradient(135deg,rgba(' + PROF_RGB + ',0.30),rgba(' + PROF_RGB + ',0.04) 65%),var(--glass);box-shadow:inset 0 1px 0 rgba(255,255,255,0.14),inset 0 -3px 0 rgba(' + PROF_RGB + ',0.8),0 10px 26px rgba(' + PROF_RGB + ',0.14);"><img src="images/profile-' + PROF + '.png" alt=""></section></aside>' if 'profile' in sys.argv else stats()) + '</div>'

CSS = ('''
.cmp .ic { grid-template-columns: 40px minmax(0, 1fr) 104px 72px !important; }
.cmp .cpw { align-items: flex-start !important; }
.cmp .side { align-items: stretch; }
.cmp .con.editable { align-items: center; }
.cmp .st8 { display: none; }
.two .cmp:has(.idnew) .chd span:nth-child(7) { visibility: visible !important; }
.two .cmp:has(.idnew) .chd span:nth-child(8) { visibility: hidden !important; }
@media (max-width: 999px) { .cmp:has(.idnew) .con.editable { padding: 4px; } }
@media (min-width: 1000px) { .two .cmp .ic, .two .cmp .chd { grid-template-columns: 40px minmax(0, 1fr) 164px 58px 64px 58px 104px 72px !important; } .two .cmp .chd span:nth-child(7) { visibility: hidden; } .two .il:not(.cmp) .ic { grid-template-columns: 48px minmax(0, 1fr) auto auto 104px 72px !important; } }
''' if EDITING else '') + '''
.work-page { padding: 1px 16px 40px; gap: 0; }
.cd { text-align: center; margin: 6px 0 25px; }
.cd-k { font-size: 12px; font-weight: 800; letter-spacing: .14em; color: color-mix(in srgb, var(--section) 70%, var(--text-muted)); }
.cd-v { font-size: 30px; font-weight: 900; color: var(--text); margin-top: 4px; letter-spacing: .02em; }
.cd-s { font-size: 12px; font-weight: 600; color: var(--text-faint); margin-top: 4px; }
.il { margin-bottom: 15px; }
.il h2 { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 1px; padding-bottom: 8px;
  border-bottom: 2px solid var(--lc); font-size: 14px; font-weight: 800; letter-spacing: .14em; color: var(--lc); }
.il h2 { align-items: center; }
.il h2 .view-icons { margin: -6px 0 -4px; }
.ic { display: grid; grid-template-columns: 50px 1fr auto; column-gap: 12px; row-gap: 7px; align-items: center;
  padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.07); }
.av { width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,.10); display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 800; color: var(--text-muted); }
.ic.grouped { --gshade: linear-gradient(90deg, color-mix(in srgb, var(--gc) 30%, transparent), transparent 160px); margin-left: -10px !important; padding-left: 10px !important; background: var(--gshade); }
.ic.grouped.g-first { border-top-left-radius: 14px; }
.ic.grouped.g-last { border-bottom-left-radius: 14px; }
.ic.grouped .av { box-shadow: inset 0 0 0 2px var(--gc), 0 0 8px color-mix(in srgb, var(--gc) 45%, transparent); }
.g-a { --gc: #6FD3C6; } .g-b { --gc: #E88FB4; }
/* Eight group colours; neighbouring groups never share one. */
.g-1 { --gc: #5FD0C2; } .g-2 { --gc: #EE8FB8; } .g-3 { --gc: #7FC8F2; } .g-4 { --gc: #F4A07E; }
.g-5 { --gc: #A99BF5; } .g-6 { --gc: #6FD6EC; } .g-7 { --gc: #D98BE6; } .g-8 { --gc: #7C92F5; }
.who { min-width: 0; }
.nm { display: flex; align-items: center; gap: 6px; }
.nm b { font-size: 17px; font-weight: 900; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ffc { height: 18px; }
.id { font-size: 12px; font-weight: 600; color: var(--text-faint); margin-top: 2px; }
.pw { font-size: 17px; font-weight: 800; line-height: 1.1; color: var(--text); margin-top: 3px; font-variant-numeric: tabular-nums; }
.pw.hot { color: var(--danger); }
.side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; white-space: nowrap; }
.st { font-size: 12px; font-weight: 700; color: var(--text-faint); }
.st.over { color: var(--danger); }
.line2 { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; }
.troops { display: flex; gap: 5px; }
.tp { position: relative; width: 40px; height: 42px; display: flex; align-items: flex-end; justify-content: center; }
.tp .p { height: 40px; }
.tp .f { position: absolute; top: -1px; left: -3px; height: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
.vals { display: grid; grid-template-columns: 64px 74px 64px; column-gap: 6px; }
.vals div { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.vals i { font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-faint); line-height: 11px; }
.vals b { font-size: 15px; font-weight: 800; color: var(--text); line-height: 17px; }
.vals b.hot { color: var(--danger); }
/* Skill level colours: 3 red, 2 orange, 1 yellow, 0 (set to None) purple. */
.sk.l3 { --sk1: #FF7A66; --sk2: #E8322A; --sk3: #BE1E1E; --skr1: #FFD9D2; --skr2: #E58A80; }
.sk.l2 { --sk1: #FF9A45; --sk2: #F05A1E; --sk3: #D8401A; --skr1: #FFE2C7; --skr2: #EC9B5E; }
.sk.l1 { --sk1: #FFD266; --sk2: #F5AE1F; --sk3: #EB9614; --skr1: #FFF5DC; --skr2: #F2CF86; }
.sk.l0 { --sk1: #B99CF6; --sk2: #8D66E2; --sk3: #7149CF; --skr1: #F3ECFF; --skr2: #BCA8EE; }
/* The skill level, the counterpart of the FC badge: the FC10 badge's hexagon and colours without its flower,
   a gold rim around a red stone that warms to orange at the edge, the same size as the FC badge. */
.sk { position: absolute; left: -2px; bottom: 1px; width: 13px; height: 14.5px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(var(--skr1), var(--skr2)); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.5)); }
.sk::before { content: ''; position: absolute; inset: 1.2px; background: radial-gradient(circle at 50% 38%, var(--sk1), var(--sk2) 58%, var(--sk3));
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); }
.sk b { position: relative; top: 1px; font-size: 8.5px; font-weight: 900; line-height: 1; color: #FFFFFF;
  text-shadow: 1px 0 0 #4A1A0C, -1px 0 0 #4A1A0C, 0 1px 0 #4A1A0C, 0 -1px 0 #4A1A0C; }
.con { display: flex; align-items: center; gap: 8px; }
.via { font-size: 13px; font-weight: 700; color: var(--text-muted); }
.tag { font-size: 12px; font-weight: 800; letter-spacing: .06em; color: var(--c); padding: 3px 8px; border-radius: 999px;
  background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent); }
.stats { display: none; }
@media (min-width: 1000px) {
  .work-page { padding: 0 0 60px; gap: 0; max-width: 1180px; margin: 0 auto; }
  .il h2 { margin-bottom: 4px; }
  .phone-only { display: none; }
  .two { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); column-gap: 44px; margin-top: 3px; }
  .il { margin-bottom: 17px; }
  /* One line: the card's parts side by side, at the phone's sizes. */
  .ic { grid-template-columns: 60px minmax(0, 1fr) auto auto 96px; column-gap: 22px; }
  .ic .av { grid-column: 1; grid-row: 1; }
  .ic .who { grid-column: 2; grid-row: 1; }
  .ic .line2 { display: contents; }
  .ic .troops { grid-column: 3; grid-row: 1; }
  .ic .vals { grid-column: 4; grid-row: 1; }
  .ic .side { grid-column: 5; grid-row: 1; }
  .ic .chev { grid-column: 6; grid-row: 1; }
  .ic .more { grid-column: 1 / -1 !important; grid-row: 2; }
  /* Balanced height: picture, name block and troops about the same height. */
  .ic { grid-template-columns: 48px minmax(0, 1fr) auto auto 96px 14px; padding: 8px 0; }
  .ic.open .more { display: none !important; }
  .ic .line2 { display: contents; }
  .ic.open .side { flex-direction: column; }
  .ic .av { width: 48px; height: 48px; }
  .ic .nm b { font-size: 17px; }
  .ic .id { margin-top: 1px; }
  .ic .pw { font-size: 15px; margin-top: 1px; }
  .ic .tp { width: 46px; height: 48px; }
  .ic .tp .p { height: 46px; }
  .stats { display: block; }
  .stats .cd { margin: 0 0 30px; }
  .stats h3 { margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,.10); font-size: 14px; font-weight: 800; letter-spacing: .14em;
    color: color-mix(in srgb, var(--section) 70%, var(--text-muted)); }
  .sl { display: grid; grid-template-columns: 1fr auto 30px; align-items: baseline; column-gap: 6px; padding: 6px 0; }
  .sl span { font-size: 14px; font-weight: 700; color: var(--lc); }
  .sl b { font-size: 24px; font-weight: 900; color: var(--text); }
  .sl i { font-style: normal; font-size: 12px; font-weight: 600; color: var(--text-faint); }
  .sl em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-muted); text-align: right; }
  .stats h3 + .sl { margin-top: 0; }
  .stats h3 ~ h3 { margin-top: 30px; }
  .ss { display: grid; grid-template-columns: repeat(3, 1fr); row-gap: 14px; }
  .ss div { display: flex; flex-direction: column; gap: 2px; }
  .ss i { font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-faint); }
  .ss b { font-size: 24px; font-weight: 900; color: var(--text); }
  .ss b.hot { color: var(--danger); }
}
.ic:last-child { border-bottom: none; }
.ic { grid-template-columns: 50px 1fr auto; }
.ic.open .more { display: flex; justify-content: flex-end; grid-column: 1 / -1; margin-top: -2px; }
.chev { width: 14px; height: 14px; color: var(--text-faint); transition: transform .2s; }
.ic.open .chev { transform: rotate(180deg); }
.line2 { grid-column: 1 / -1; }
.views { display: flex; justify-content: center; align-items: baseline; gap: 10px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; }
.views b { font-weight: 700; color: var(--text-muted); }
.views b.on { font-weight: 800; color: var(--section); }
.views span { color: var(--text-faint); }
.ibar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.icd { display: flex; flex-direction: column; gap: 2px; }
.icd .cd-k { font-size: 11px; font-weight: 800; letter-spacing: .14em; color: color-mix(in srgb, var(--section) 70%, var(--text-muted)); }
.icd b { font-size: 22px; font-weight: 900; color: var(--text); line-height: 1.1; }
.cd-s2 { font-size: 12px; font-weight: 600; color: var(--text-faint); margin: 4px 0 25px; }
.cmp .ic { grid-template-columns: 34px minmax(0, 1fr) 84px 70px; column-gap: 10px; padding: 7px 0; row-gap: 0; }
.cmp .ic .line2 { display: none !important; }
.cmp .av { width: 34px; height: 34px; font-size: 13px; }
.cmp .av .pf { display: none; }
.cmp .nm b { font-size: 15px; }
.cmp .ffc { height: 15px; }
.cmp .id { margin-top: 1px; }
.cmp .copy b { font-size: 12.5px; }
.cmp .copy .cp { width: 13px; height: 13px; }
.cmp .who .pw { display: none; }
.cmp .cpw { display: block !important; grid-column: 3; grid-row: 1; text-align: right; font-size: 15px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.cmp .cpw.hot { color: var(--danger); }
.cmp .cpw small { display: block; font-size: 11.5px; font-weight: 700; color: var(--text-faint); margin-top: 1px; }
.cmp .cpw small.over { color: var(--danger); }
.cmp .side { grid-column: 4; grid-row: 1; }
.cmp .side .st { display: none; }
.cmp .side { align-items: flex-end; }
.cmp .con { flex-direction: column; align-items: flex-end; gap: 2px; }
.cmp .via { font-size: 11.5px; line-height: 1; }
.cpw { display: none; }
.ctr, .cn, .chd { display: none; }
@media (min-width: 1000px) {
  .two .cmp .ic { grid-template-columns: 34px minmax(0, 1fr) 164px 58px 64px 58px 80px 80px; column-gap: 12px; padding: 5px 0; }
  .two .cmp .chd + .ic { padding-top: 2px; }
  .two .cmp .ic > * { grid-row: 1; }
  .two .cmp .ctr { display: flex; gap: 6px; grid-column: 3; font-size: 13px; font-weight: 800; color: var(--text); letter-spacing: .02em; }
  .two .cmp .ctr span { width: 50px; text-align: center; white-space: nowrap; }
  .two .cmp .chd .cls { display: flex; gap: 6px; }
  .two .cmp .chd .cls img { width: 50px; height: 17px; object-fit: contain; opacity: .75; }
  .two .cmp .ctr i { font-style: normal; font-size: 12px; font-weight: 600; color: var(--text-faint); margin-left: 3px; }
  .two .cmp .cn { display: block; text-align: center; font-size: 14px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
  .two .cmp .ic .av { grid-column: 1; } .two .cmp .ic .who { grid-column: 2; } .two .cmp .ic .ctr { grid-column: 3; }
  .two .cmp .ic .cn.k { grid-column: 4; } .two .cmp .ic .cn.l { grid-column: 5; } .two .cmp .ic .cn.t { grid-column: 6; }
  .two .cmp .ic .cpw { grid-column: 7; } .two .cmp .ic .side { grid-column: 8; }
  .two .cmp .chd { display: grid; grid-template-columns: 34px minmax(0, 1fr) 164px 58px 64px 58px 80px 80px; column-gap: 12px; padding: 8px 0 0; align-items: center; line-height: 17px;
    font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
  .two .cmp .chd span:nth-child(n+4):nth-child(-n+6) { text-align: center; }
  .two .cmp .chd span:nth-child(7) { text-align: right; }
}
@media (min-width: 1000px) { .ibar.phone-only, .cd-s2.phone-only { display: none; } }
.av { position: relative; }
.av .pf { position: absolute; right: -3px; bottom: -3px; width: 20px; height: 20px; border-radius: 50%; background: #18213A;
  box-shadow: 0 0 0 1.5px rgba(255,255,255,.14); display: flex; align-items: center; justify-content: center; --edit-colour: var(--section); }
.av .pf svg { width: 12px; height: 12px; }
.id { display: flex; align-items: center; gap: 8px; }
.copy { display: inline-flex; align-items: center; gap: 5px; padding: 0; border: none; background: none; font: inherit; cursor: pointer; }
.copy b { font-size: 13.5px; font-weight: 700; color: var(--text); letter-spacing: .02em; font-variant-numeric: tabular-nums; }
.copy .cp { width: 15px; height: 15px; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--section) 45%, transparent)); }
.nm .lk { width: 15px; height: 15px; flex: none; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--section) 50%, transparent)); }
.nm .on-site-name { display: flex; align-self: flex-end; margin: 0 0 1px -4px; opacity: .6; }
.nm .on-site-name .lk { width: 11px; height: 11px; filter: none; }
.nm .on-site-name .lk g { stroke: var(--text-muted); }
.cmp .nm .on-site-name .lk { width: 10px; height: 10px; }
.av .on-site { position: absolute; right: -2px; top: -2px; display: flex; opacity: .6; }
.av .on-site .lk { width: 12px; height: 12px; filter: drop-shadow(0 0 1.5px #0B1222) drop-shadow(0 0 1px #0B1222); }
.av .on-site .lk g { stroke: var(--text-muted); }
.cmp .av .on-site { right: -3px; top: -3px; }
.cmp .av .on-site .lk { width: 10px; height: 10px; }
.st8 { font-size: 12px; font-weight: 600; color: var(--text-faint); }
@media (min-width: 1000px) {
  .two .ic { grid-template-columns: 48px minmax(0, 1fr) auto auto 96px; }
  .two .ic .line2 { display: contents; }
  .two .ic .troops { grid-column: 3; grid-row: 1; }
  .two .ic .vals { grid-column: 4; grid-row: 1; }
  .two .ic .side { grid-column: 5; grid-row: 1; }
  .two .ic .chev { grid-column: 6; grid-row: 1; }
}
/* The title line: Add, then the views. */
.il h2 .hr { display: flex; align-items: center; gap: 14px; }
.il h2 .add-player { --edit-colour: var(--lc); }
/* The status: a word in its colour with an arrow, in a small glass box, so it reads as something to tap. */
.stw { position: relative; display: inline-flex; }
.stc { display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 6px 0 9px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--glass-border); background: var(--glass); font: inherit; font-size: 12.5px; font-weight: 700; letter-spacing: 0;
  color: var(--sc); white-space: nowrap; }
.stc svg { width: 13px; height: 13px; color: var(--text-faint); }
.stc.open { border-color: color-mix(in srgb, var(--sc) 55%, transparent); background: var(--glass-strong); }
.stc.open svg { transform: rotate(180deg); }
.s-not { --sc: var(--text-muted); } .s-sent { --sc: var(--text); } .s-rev { --sc: var(--notice-red); } .s-done { --sc: var(--save-green); }
/* The choices open under the status, over the rows below. */
.pick { position: absolute; z-index: 20; top: calc(100% + 6px); right: 0; width: 168px; padding: 5px; border-radius: 12px;
  background: #18213A; border: 1px solid var(--glass-border); box-shadow: 0 12px 28px rgba(0,0,0,.55); display: flex; flex-direction: column; }
.opt { display: flex; align-items: center; justify-content: space-between; height: 40px; padding: 0 10px; border: none; border-radius: 8px;
  background: none; font: inherit; font-size: 14px; font-weight: 700; color: var(--sc); cursor: pointer; text-align: left; }
.opt.on { background: var(--glass); }
.opt svg { width: 16px; height: 16px; color: var(--sc); }
.side { align-items: flex-end; }
.cmp .side .stw { display: none; }
.cmp .cpw { display: flex !important; flex-direction: column; align-items: flex-end; gap: 3px; }
.cmp .cpw .stc { height: 22px; font-size: 11.5px; padding: 0 4px 0 7px; border-radius: 7px; }
.cmp .cpw .stc svg { width: 11px; height: 11px; }
.cmp .ic { grid-template-columns: 34px minmax(0, 1fr) 84px 64px; }
.cmp .ic { padding: 8px 0; }
/* Adding a player: the ID in a glass field with Cancel and Save beside it; the read fills the picture and the line under it. */
.ic.adding .who { grid-column: 2 / -1; }
.addline { display: flex; align-items: center; gap: 14px; }
.addline .info-field { width: 150px; max-width: none; height: 34px; font-size: 15px; text-align: left; padding: 0 10px; border-color: color-mix(in srgb, var(--lc) 60%, transparent); }
.addline .edit-actions { margin: 0; }
.ic.adding .edit-actions { display: inline-flex; align-items: center; gap: 16px; }
.ic.adding .quiet { display: inline-flex; align-items: center; gap: 6px; padding: 4px 0; border: none; background: none; font: inherit; font-size: 12.5px; font-weight: 700; line-height: 1; color: var(--text-muted); cursor: pointer; }
.ic.adding .quiet .line-icon { width: 15px; height: 15px; }
.ic.adding .quiet .words { background: linear-gradient(90deg, color-mix(in srgb, var(--quiet-tint) 45%, var(--text)), var(--text)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.ic.adding .quiet.cancel { --quiet-tint: var(--notice-red); } .ic.adding .quiet.confirm { --quiet-tint: var(--save-green); }
.ic.adding .found { display: flex; align-items: center; gap: 6px; margin-top: 5px; font-size: 12px; font-weight: 600; color: var(--text-faint); }
.ic.adding .found b { font-size: 13.5px; font-weight: 800; color: var(--text); }
.ic.adding .found .ffc { height: 15px; }
.ic.adding .found .hot { color: var(--danger); font-weight: 800; }
@media (min-width: 1000px) {
  .two .cmp .ic { grid-template-columns: 34px minmax(0, 1fr) 164px 58px 64px 58px 84px 76px; }
  .two .cmp .chd { grid-template-columns: 34px minmax(0, 1fr) 164px 58px 64px 58px 84px 76px; }
  .two .cmp .ic.adding .who { grid-column: 2 / -1; }
  .pick { width: 156px; } .opt { height: 34px; font-size: 13.5px; }
  .pickbar { left: calc(50% - 211px); right: auto; width: 220px; transform: translateX(-50%); }
  .work-page { padding-left: 12px !important; padding-right: 12px !important; max-width: 1204px !important; }
}

.add-invite { width: 100%; max-width: 400px; }
.add-invite .pp.adding { padding: 0 !important; margin: 0; }
.add-invite .add { gap: 0; }
.add-invite .add h2 { margin: 0 0 15px; padding: 0; }
.add-invite .add-id + .found { margin-top: 15px; }
.add-invite .found + .kind-words { margin-top: 20px; }
.add-invite .kind-words + .saverow { margin-top: 15px; }
.add-invite .found + .saverow { margin-top: 20px; }
.kind-word:disabled { opacity: .35; cursor: default; }

.add-invite .saverow .danger-button { min-width: 110px; }

/* The status: the word in its colour with small up and down arrows, no box. */
.stc { height: auto; padding: 2px 0; border: none; background: none; gap: 3px; }
.stc svg { width: 14px; height: 14px; color: var(--sc); opacity: .7; }
.stc.open { background: none; }
.stc.open svg { transform: none; opacity: 1; }
.s-none, .s-over { --sc: var(--text-muted); }
.s-over.opt { --sc: var(--danger); }
.s-rej { --sc: var(--notice-red); } .s-exp { --sc: var(--text-faint); }
.cmp .cpw .stc { height: auto; padding: 0; font-size: 12px; }
.cmp .cpw .stc svg { width: 12px; height: 12px; }
.ibar .add-player { --edit-colour: var(--section); }
/* Dragging: the row lifts and follows the finger; a line shows where it lands. */
.drop { margin-bottom: 120px; } .drop .land { display: none; } .drop h2 { margin-bottom: 0; box-shadow: 0 6px 12px -6px var(--lc); border-bottom-width: 3px; }
.ic.lifted { position: relative; --lift: 10px; z-index: 30; margin: 0 -6px; padding-left: 6px; padding-right: 6px; border-radius: 14px; border-bottom-color: transparent;
  background: #1B2440; box-shadow: 0 14px 34px rgba(0,0,0,.6), 0 0 0 1px var(--glass-border); transform: translateY(var(--lift, 0)) scale(1.02); }
.ic.gone { opacity: .25; }
.land { height: 3px; margin-top: 14px; border-radius: 2px; background: var(--lc); box-shadow: 0 0 10px color-mix(in srgb, var(--lc) 60%, transparent); }
.remove-place { position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; height: 84px; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(to top, color-mix(in srgb, var(--notice-red) 34%, #0B1222), transparent); color: #FFB3A6; font-size: 15px; font-weight: 800; }
.remove-place svg { width: 20px; height: 20px; }

/* The status, drawn like the site's Edit and Add buttons: an icon and a word, both in the status's colour. */
.stc { gap: 6px; padding: 3px 0; }
.stc .sti { width: 16px; height: 16px; opacity: 1; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--sc) 45%, transparent)); }
.stc .words { background: linear-gradient(90deg, color-mix(in srgb, var(--sc) 80%, var(--text)), color-mix(in srgb, var(--sc) 35%, var(--text)));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
.stc.open .sti { transform: none; }
.s-ready { --sc: #8FD3F0; } .s-over { --sc: var(--danger); } .s-sent { --sc: var(--section); }
.s-done { --sc: var(--save-green); } .s-rej { --sc: var(--notice-red); } .s-exp { --sc: var(--text-faint); }
.s-over.opt { --sc: var(--danger); }
.opt .ow { display: inline-flex; align-items: center; gap: 9px; }
.opt .sti { width: 17px; height: 17px; }
.opt > svg { color: var(--text-muted); }
.cmp .cpw .stc { font-size: 12px; gap: 5px; }
.cmp .cpw .stc .sti { width: 14px; height: 14px; }
.work-page.extra { padding-bottom: 190px !important; }

/* Remove, last in the list under its own line, drawn like the profile's Remove. */
.pick-end { margin: 5px 5px 0; padding: 9px 5px 4px; border-top: 1px solid var(--glass-border); }
.pick .quiet { display: inline-flex; align-items: center; gap: 7px; padding: 4px 0; border: none; background: none; font: inherit; font-size: 13.5px; font-weight: 700; line-height: 1; cursor: pointer; --quiet-tint: var(--notice-red); }
.pick .quiet .line-icon { width: 17px; height: 17px; }
.pick .quiet .words { background: linear-gradient(90deg, color-mix(in srgb, var(--quiet-tint) 45%, var(--text)), var(--text)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

.tops { display: inline-flex; align-items: center; gap: 18px; --edit-colour: var(--section); }
.tops .edit-button { --edit-colour: var(--section); }
.quiet { display: inline-flex; align-items: center; gap: 6px; padding: 4px 0; border: none; background: none; font: inherit; font-size: 12.5px; font-weight: 700; letter-spacing: 0; text-transform: none; line-height: 1; cursor: pointer; white-space: nowrap; }
.quiet .line-icon { width: 15px; height: 15px; }
.quiet .words { background: linear-gradient(90deg, color-mix(in srgb, var(--quiet-tint) 45%, var(--text)), var(--text)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.quiet.cancel { --quiet-tint: var(--notice-red); } .quiet.confirm { --quiet-tint: var(--save-green); } .quiet.neutral { --quiet-tint: var(--text-faint); }
.tops .quiet { font-size: 13.5px; } .tops .quiet .line-icon { width: 17px; height: 17px; }
.ic.gone-row > :not(.cpw):not(.side) { opacity: .3; }
.ic.gone-row .cpw .pwn, .ic.gone-row .side .con { opacity: .3; }

/* Editing: tapping a picture picks the player; a picked picture gets a ring and a tick. */
.ic.picked .av { box-shadow: inset 0 0 0 2px var(--text); }
.ic.picked .av::after { content: ''; position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--section) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 12.5l4 4 8-9' fill='none' stroke='%230B1222' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 13px no-repeat;
  box-shadow: 0 0 0 2px #0B1222; }
.tops.edit-actions { gap: 18px; }

/* While players are picked, a bar at the bottom of the screen holds Group, so it is always in reach. */
.pickbar { position: fixed; z-index: 40; left: 16px; right: 16px; bottom: 16px; width: auto; max-width: 420px; margin: 0 auto; padding: 12px 18px;
  flex-direction: row; align-items: center; justify-content: center; max-width: 220px; box-shadow: 0 12px 30px rgba(0,0,0,.5); }
.pk-count { font-size: 13.5px; font-weight: 700; color: var(--text-muted); }
.pk-count b { color: var(--text); font-weight: 900; font-size: 15px; margin-right: 3px; }
.pickbar .edit-button { --edit-colour: var(--section); font-size: 14px; }
.pickbar .edit-button .edit-icon { width: 19px; height: 19px; }

/* Editing: Add to group and Remove side by side where the status was. */
.eacts { gap: 14px; align-items: center; }
.quiet.group-act { --quiet-tint: var(--section); }
.quiet.group-act.open .words { -webkit-text-fill-color: var(--text); }
.cmp .cpw .eacts .quiet { font-size: 12px; }
.eacts { flex-direction: column; align-items: flex-start; gap: 6px; }
.eacts .quiet { font-size: 12.5px !important; padding: 2px 0; }
.eacts .line-icon { width: 15px !important; height: 15px !important; }
.cmp .cpw { justify-content: center; }
/* While editing, the contact sits in a small box: it can be changed. */
.con.editable { padding: 4px 6px; margin: 0; border-radius: 9px; border: 1px solid var(--glass-border); background: var(--glass); }
/* Picking a group: groups have no name, so each shows its colour, its first faces and its names. */
.gpick { width: 290px; }
@media (max-width: 999px) { .gpick { right: auto; left: -168px; width: 358px; } }
.gopt { justify-content: flex-start; gap: 10px; height: 46px; color: var(--text); background: linear-gradient(90deg, color-mix(in srgb, var(--gc) 26%, transparent), transparent 120px); margin-bottom: 3px; }
.gopt:first-child { background: none; }
.gfaces { display: inline-flex; flex: none; width: 62px; }
.gfaces i { width: 26px; height: 26px; border-radius: 50%; margin-left: -8px; display: flex; align-items: center; justify-content: center; font-style: normal; font-size: 11px; font-weight: 800;
  color: var(--text-muted); background: #232D4A; box-shadow: inset 0 0 0 1.5px var(--gc), 0 0 0 2px #18213A; }
.gfaces i:first-child { margin-left: 0; }
.gnew { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; --edit-colour: var(--section); }
.gnew .edit-icon { width: 18px; height: 18px; }
.gname { font-size: 13.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.gname em { font-style: normal; color: var(--text-faint); }

/* Computer: the right side is the phone profile's width and look. */
@media (min-width: 1000px) {
  .two { grid-template-columns: minmax(0, 1fr) 390px !important; }
  .stats .cd { text-align: left; margin: 0 0 25px; }
  .stats .cd-k { font-size: 12px; }
  .stats .cd-v { font-size: 34px; margin-top: 2px; }
  .stats h3 { margin: 0 0 15px !important; padding: 0 !important; border: none !important; font-size: 14px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
    color: color-mix(in srgb, var(--section) 55%, var(--text-muted)) !important; }
  .stats h3 ~ h3 { margin-top: 25px !important; }
  .pl, .sg { display: grid; grid-template-columns: repeat(3, 1fr); }
  .sg { row-gap: 18px; }
  .pc, .sc { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .pc i { font-style: normal; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--lc); }
  .pc b, .sc b { font-size: 30px; font-weight: 900; line-height: 1.05; color: var(--text); font-variant-numeric: tabular-nums; }
  .pc em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-faint); }
  .sc .stc { font-size: 12.5px; cursor: default; }
  .sc .stc .sti { width: 15px; height: 15px; }
  .sc.s-over b { color: var(--danger); }
}
/* Compact: the picture is the tallest thing; every block beside it is two lines of the same height, centred on it. */
.cmp .av { width: 40px !important; height: 40px !important; font-size: 14px; }
.cmp .ic { grid-template-columns: 40px minmax(0, 1fr) 96px 64px; align-items: center; }
.cmp .nm { line-height: 19px; } .cmp .nm b { line-height: 19px; }
.cmp .id { margin-top: 1px; line-height: 17px; }
.cmp .cpw { gap: 1px !important; justify-content: center; }
.cmp .cpw .pwn { line-height: 19px; }
.cmp .cpw .stc { line-height: 17px; padding: 0 !important; }
.eacts { gap: 1px !important; }
.eacts .quiet { line-height: 18px; padding: 0 !important; }
.cmp .con { gap: 1px !important; }
.cmp .via { line-height: 14px; }
@media (min-width: 1000px) {
  .two .cmp .ic, .two .cmp .chd { grid-template-columns: 40px minmax(0, 1fr) 164px 58px 64px 58px 96px 64px !important; }
  /* Details: the status and the contact side by side, as in Compact. */
  .two .il:not(.cmp) .ic { grid-template-columns: 48px minmax(0, 1fr) auto auto 96px 64px !important; column-gap: 16px !important; }
  .two .il:not(.cmp) .ic .side { display: contents; }
  .two .il:not(.cmp) .ic .side .stw { grid-column: 5; grid-row: 1; justify-self: start; }
  .two .il:not(.cmp) .ic .side .con { grid-column: 6; grid-row: 1; justify-self: end; flex-direction: column; align-items: flex-end; gap: 2px; }
  .two .il:not(.cmp) .vals { grid-template-columns: 60px 66px 60px; column-gap: 4px; }
  .two .il:not(.cmp) .troops { gap: 4px; }
}

/* New group: how the group is made, then the choice, then exactly who goes in it. */
.ng { max-width: 420px !important; }
.ng .ng-how { align-self: stretch; justify-content: center; }
.ng .ng-how + .ng-opts { margin-top: 15px; }
.ng-opts { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
.ng-opt { height: 32px; padding: 0 14px; border-radius: 9px; border: 1px solid var(--glass-border); background: none; font: inherit; font-size: 14px; font-weight: 800;
  color: var(--text-muted); letter-spacing: .02em; cursor: pointer; }
.ng-opt.on { color: var(--text); border-color: color-mix(in srgb, var(--section) 70%, transparent); background: var(--glass-strong); }
.ng-opts + .ng-who { margin-top: 20px; }
.ng-who { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; padding: 0 6px; }
.ng-p { display: flex; align-items: center; gap: 9px; min-width: 0; }
.ng-p i { flex: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-style: normal; font-size: 12px;
  font-weight: 800; color: var(--text-muted); background: var(--glass-strong); }
.ng-p span { font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ng .ng-who + .saverow { margin-top: 25px !important; }
.ng .ng-opts + .ng-who { margin-top: 20px !important; }
.ng .ng-how + .ng-opts { margin-top: 15px !important; }

.stats.prof { position: relative; }
.two:has(.prof) { grid-template-columns: minmax(0, 1fr) 390px !important; }
.prof-card { padding: 0; overflow: hidden; }
.stats.prof img { display: block; width: 390px; margin: -7px 0 -13px; }
.prof-close { --quiet-tint: var(--text-faint); font-size: 13.5px !important; }
.prof-close .line-icon { width: 16px; height: 16px; }
/* The row whose profile is open: its own look kept, a thin border around it in its group's colour (or the text's). */
.ic.viewing { position: relative; }
.ic.grouped.viewing::after { left: 0; }
.ic.viewing::after { content: ''; position: absolute; inset: 0 -8px 0 -10px; border-radius: 12px; pointer-events: none;
  border: 1px solid color-mix(in srgb, var(--gc, var(--text)) 75%, transparent); }

/* Computer: the lists scroll in their own box and fade at the bottom, as the calendar does. */
@media (min-width: 1000px) {
  .work-page { overflow: visible !important; }
  .two { height: calc(100vh - 190px); align-items: start; }
  .lists { height: 100%; overflow-y: auto; scrollbar-gutter: stable; scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--accent) 35%, transparent) transparent; padding-right: 6px; margin-right: -14px;
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent);
    padding-left: 12px; margin-left: -12px; }
  .two:has(.prof) { align-items: stretch; }
  .stats.prof { height: 100%; }
  .prof-card { height: 100%; box-sizing: border-box; }
  .lists-panel .lists { padding: 15px 20px 0 26px; margin-right: 0; }
  .lists-panel .lists-card { margin-left: -26px; margin-right: -20px; }
  .lists-panel .lists-card { height: 100%; padding: 0; overflow: hidden; }
}

/* Computer, nothing opened: the transfer's numbers in a panel card, tinted with the page's two colours. */
@media (min-width: 1000px) {
  .two:has(.tstat) { align-items: stretch; }
  .stats:has(.tstat) { height: 100%; }
  /* Dark, so the icons and colours read; the page's gold only in its accents. */
  .tstat { height: 100%; box-sizing: border-box; padding: 18px 20px 15px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--section) 9%, transparent), transparent 55%), rgba(8, 12, 26, .62);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 -3px 0 color-mix(in srgb, var(--section) 75%, transparent), 0 10px 26px rgba(0,0,0,.35); }
  .tstat .cd-k, .tstat h3 { color: var(--section) !important; }
  /* Test: the event panels' tint in the page's gold, on the same dark ground. */
  .tstat.gold { background: linear-gradient(135deg, color-mix(in srgb, var(--section) 26%, transparent), color-mix(in srgb, var(--section) 3%, transparent) 65%), linear-gradient(rgba(4, 7, 16, .16), rgba(4, 7, 16, .16)), rgba(255, 255, 255, .035);
    border: 1px solid var(--glass-border); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 -3px 0 color-mix(in srgb, var(--section) 75%, transparent), 0 10px 26px rgba(0,0,0,.25); }
  .gc { display: flex; gap: 28px; margin-top: 14px; }
  .gc div { display: flex; flex-direction: column; gap: 2px; }
  .gc i { font-style: normal; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint); }
  .gc b { font-size: 18px; font-weight: 900; color: var(--text); font-variant-numeric: tabular-nums; }
  .tstat .cd { margin: 0 0 25px !important; }
  .tstat .cd-v { font-size: 40px !important; letter-spacing: .01em; }
  .phases { display: flex; gap: 6px; margin-top: 12px; }
  .ph { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .ph:first-child { flex: 1.6; }
  .ph i { position: relative; height: 6px; border-radius: 3px; background: rgba(255,255,255,.10); overflow: hidden; }
  .ph.on i::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--p); border-radius: 3px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--section) 60%, transparent), var(--section)); box-shadow: 0 0 8px var(--section); }
  .ph span { font-size: 11.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-faint); }
  .ph.on span { color: var(--text); }
  .tstat .cd-s { margin-top: 10px !important; }
  .rw { position: relative; width: 76px; height: 76px; margin: 6px 0 4px; }
  .ring { width: 76px; height: 76px; display: block; }
  .rn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: var(--text); }
  .pc b:not(.rn) { display: none; }
  .sbar { display: flex; gap: 3px; height: 8px; margin-bottom: 20px; }
  .tstat .sg { row-gap: 22px; }
  .sbar i { border-radius: 4px; background: var(--sc); box-shadow: 0 0 6px color-mix(in srgb, var(--sc) 50%, transparent); }
  .sc b { font-size: 26px !important; }
}

.stats.cards { display: grid !important; grid-template-columns: 1fr 1fr; gap: 14px; align-content: start; }
.mini { padding: 15px 16px; display: flex; flex-direction: column; gap: 3px; }
.mini b { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
.mini span { font-size: 12px; font-weight: 700; color: var(--text-muted); }
.mini i { font-style: normal; font-size: 24px; font-weight: 900; color: var(--text); }

/* The contact centred in its own column. */
.cmp .side { align-items: center !important; justify-self: stretch; }
.cmp .con { align-items: center !important; }
@media (min-width: 1000px) {
  .two .il:not(.cmp) .ic .side .con { justify-self: stretch !important; align-items: center !important; }
}

/* Dragging: three lines before the picture, for those who may move players. */
.ic { position: relative; }
.grp { position: absolute; left: -28px; top: 50%; transform: translateY(-50%); display: flex; color: var(--text-faint); cursor: grab; }
.ic.grouped .grp { left: -18px; }
@media (min-width: 1000px) { .lists { padding-left: 40px !important; margin-left: -40px !important; } }
.grp .grip { width: 16px; height: 16px; }
.two .cmp .ic:has(.grp), .two .il .ic:has(.grp) { }
/* A flagged player: a warning before the power, the reason on hover. */
.flag { position: relative; display: inline-flex; vertical-align: -2px; margin-right: 5px; color: #F2B544; }
.flag svg { width: 15px; height: 15px; filter: drop-shadow(0 0 4px rgba(242,181,68,.5)); }
.tip { position: absolute; z-index: 30; bottom: calc(100% + 8px); right: -10px; width: max-content; max-width: 240px; padding: 9px 12px; border-radius: 10px;
  background: #18213A; border: 1px solid var(--glass-border); box-shadow: 0 10px 24px rgba(0,0,0,.5); text-align: left; white-space: normal;
  font-size: 12.5px; font-weight: 600; line-height: 1.35; color: var(--text-muted); }
.tip b { display: block; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text); margin-bottom: 2px; }
.tip em { display: block; font-style: normal; margin-top: 5px; color: var(--section); font-weight: 700; }
.flag .tip b { color: #F2B544; }
.tip-left { right: 0; }
.gc { gap: 22px !important; }
.mgr { display: inline-flex; align-items: center; gap: 6px; }
.mgr span { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; background: var(--glass-strong); color: var(--text-muted); }

/* Phone: Add and Edit as icons, then the swap between the lists and the statistics. */
.ph-ctl { display: inline-flex; align-items: center; gap: 12px; }
.icd .cd-k { letter-spacing: .1em !important; white-space: nowrap; }
.ph-ctl .tops { gap: 12px; }
.ph-ctl .tops .words { display: none; }
.ph-ctl .tops .edit-icon { width: 21px; height: 21px; }
.ph-ctl .swap { padding-left: 10px; border-left: 1px solid var(--glass-border); }
@media (min-width: 1000px) { .ph-ctl { display: none; } }
.phone-stats { margin-top: 20px; }
.phone-stats .stats { display: block !important; }
.phone-stats .tstat { padding: 18px 18px 15px; }
.phone-stats .tstat .cd-k, .phone-stats .tstat .cd-v { display: none; }
.phone-stats .phases { margin-top: 0; }
.phone-stats h3 { margin: 0 0 15px; font-size: 14px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--section); }
.phone-stats h3 ~ h3 { margin-top: 25px; }
.phone-stats .pl, .phone-stats .sg { display: grid; grid-template-columns: repeat(3, 1fr); }
.phone-stats .sg { row-gap: 20px; }
.phone-stats .pc, .phone-stats .sc { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.phone-stats .pc i { font-style: normal; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--lc); }
.phone-stats .pc em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-faint); }
.phone-stats .rw { position: relative; width: 72px; height: 72px; margin: 6px 0 4px; }
.phone-stats .ring { width: 72px; height: 72px; display: block; }
.phone-stats .rn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: var(--text); }
.phone-stats .sbar { display: flex; gap: 3px; height: 8px; margin-bottom: 18px; }
.phone-stats .sbar i { border-radius: 4px; background: var(--sc); }
.phone-stats .sc b { font-size: 24px; font-weight: 900; color: var(--text); }
.phone-stats .sc.s-over b { color: var(--danger); }
.phone-stats .sc .stc { font-size: 12.5px; }
.phone-stats .ph { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.phone-stats .ph:first-child { flex: 1.6; }
.phone-stats .ph i { position: relative; height: 6px; border-radius: 3px; background: rgba(255,255,255,.10); overflow: hidden; }
.phone-stats .ph.on i::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--p); border-radius: 3px; background: linear-gradient(90deg, color-mix(in srgb, var(--section) 60%, transparent), var(--section)); }
.phone-stats .ph span { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-faint); }
.phone-stats .ph.on span { color: var(--text); }
.phone-stats .phases { display: flex; gap: 6px; }
.phone-stats .gc { display: flex; gap: 18px; margin-top: 14px; }
.phone-stats .gc div { display: flex; flex-direction: column; gap: 2px; }
.phone-stats .gc i { font-style: normal; font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--text-faint); }
.phone-stats .gc b { font-size: 16px; font-weight: 900; color: var(--text); }
.phone-stats .cd { margin: 0 0 25px; }
.phone-stats .tstat.gold { background: linear-gradient(135deg, color-mix(in srgb, var(--section) 26%, transparent), color-mix(in srgb, var(--section) 3%, transparent) 65%), linear-gradient(rgba(4,7,16,.16), rgba(4,7,16,.16)), rgba(255,255,255,.035);
  border: 1px solid var(--glass-border); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 -3px 0 color-mix(in srgb, var(--section) 75%, transparent); }

/* Add pop-up: what the read found, a note when something is wrong, the contact with suggestions. */
.add-invite .found + .add-answer, .add-invite .add-id + .add-answer { margin-top: 15px; }
.add-invite .add-answer { padding: 0 8px; line-height: 1.4; }
.add-invite .add-answer.warn { color: #F2B544; }
.add-invite .add-answer + .kind-words, .add-invite .add-answer + .saverow, .add-invite .contact-in + .kind-words { margin-top: 20px !important; }
.add-invite .found + .contact-in { margin-top: 20px; }
.contact-in { position: relative; display: flex; flex-direction: column; align-items: center; }
.contact-in .info-field { max-width: 280px; font-size: 15px; height: 40px; text-align: left; letter-spacing: 0; border-color: color-mix(in srgb, var(--section) 60%, transparent); }
.sugg { width: 280px; margin-top: 6px; padding: 5px; border-radius: 11px; background: #18213A; border: 1px solid var(--glass-border); display: flex; flex-direction: column; }
.sg-row { display: flex; align-items: center; gap: 9px; height: 38px; padding: 0 9px; border: none; border-radius: 8px; background: none; font: inherit; font-size: 14px; font-weight: 700; color: var(--text); text-align: left; cursor: pointer; }
.sg-row.on { background: var(--glass); }
.sg-row i { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-style: normal; font-size: 11px; font-weight: 800; background: var(--glass-strong); color: var(--text-muted); }
.sg-row > span:not(.tag) { flex: 1; }
.sg-row .tag { padding: 2px 7px; font-size: 11.5px; }
.sg-row.on > span:not(.tag) { color: var(--text-muted); font-weight: 600; font-size: 12.5px; }

/* After the transfer: both phases full, then what came of it. */
.ph.done i { background: color-mix(in srgb, var(--section) 45%, transparent) !important; }
.ph.done span { color: var(--text-muted) !important; }
.never { display: flex; align-items: baseline; justify-content: center; gap: 8px; margin-top: 15px; }
.never b { font-size: 22px; font-weight: 900; color: var(--text); }
.never span { font-size: 13px; font-weight: 700; color: var(--text-muted); }
@media (min-width: 1000px) { .tstat .sg:has(> :nth-child(3):last-child) { grid-template-columns: repeat(3, 1fr); } }

/* Custom: every player on the lists, ticked one by one. */
.ng .ng-how + .ng-list { margin-top: 15px; }
.ng-list { display: flex; flex-direction: column; max-height: 300px; overflow: hidden; -webkit-mask-image: linear-gradient(#000 calc(100% - 22px), transparent); mask-image: linear-gradient(#000 calc(100% - 22px), transparent); }
.ng-pick { display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 8px; border: none; border-radius: 9px; background: none; font: inherit; color: var(--text); cursor: pointer; text-align: left; }
.ng-pick i { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-style: normal; font-size: 12px; font-weight: 800; background: var(--glass-strong); color: var(--text-muted); }
.ng-pick span { flex: 1; font-size: 14.5px; font-weight: 700; }
.ng-pick b { width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--glass-border); }
.ng-pick.on { background: var(--glass); }
.ng-pick.on b { box-shadow: none; background: var(--section) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 12.5l4 4 8-9' fill='none' stroke='%230B1222' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 14px no-repeat; }
.ng .ng-list + .saverow { margin-top: 20px !important; }

/* The transfer's head, centred: the phase, the time left, the group and cap on one line, the manager on the next. */
.tstat .cd { text-align: center; }
.tstat .phases { text-align: left; }
.gcl { margin-top: 14px; font-size: 19px; font-weight: 900; color: var(--text); font-variant-numeric: tabular-nums; }
.gcl span { margin: 0 10px; color: var(--section); }
.mgrl { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 10px; white-space: nowrap; }
.mgrl i { font-style: normal; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint); margin-right: 3px; }
.mgrl .mp { width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; background: var(--glass-strong); color: var(--text-muted); }
.mgrl b { font-size: 15px; font-weight: 800; color: var(--text); }
.mgrl .tag { padding: 2px 7px; font-size: 11px; }
.phone-stats .tstat .cd { margin-bottom: 25px; }
.phone-stats .gcl { margin-top: 14px; }

/* The phase is named in the head, so the bars carry no words. */
.ph span { display: none !important; }

/* The transfer's head: one track with the two phases named at its ends, the current one
   lit; under it the time left and what it runs until. Said once, nothing empty. */
.trk { display: flex; align-items: center; gap: 10px; }
.tw { font-size: 11.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint); white-space: nowrap; }
.tw.on { color: var(--section); }
.tw.past { color: var(--text-muted); }
.tb { flex: 1; display: flex; align-items: center; gap: 4px; }
.tb i { position: relative; flex: 1.6; height: 6px; border-radius: 3px; background: rgba(255,255,255,.10); overflow: hidden; }
.tb i + b + i { flex: 1; }
.tb i::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--f); border-radius: 3px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--section) 55%, transparent), var(--section)); box-shadow: 0 0 8px color-mix(in srgb, var(--section) 60%, transparent); }
.tb b { width: 2px; height: 12px; border-radius: 1px; background: rgba(255,255,255,.22); }
.tstat .cd .trk { margin-bottom: 14px; }
.tstat .cd-v { margin-top: 0 !important; line-height: 1.05; }
.cd-u { font-size: 12.5px; font-weight: 700; color: var(--text-muted); margin-top: 3px; }
.tstat .phases, .tstat .cd-k { display: none !important; }
/* Phone: the track across the page, the time under it beside the controls. */
.ptrk { margin: 4px 0 12px; }
.icd .cd-k { color: var(--section) !important; text-transform: uppercase; }
.ibar.phone-only { margin-bottom: 25px; }
.phone-stats .tstat .cd .trk, .phone-stats .tstat .cd-v, .phone-stats .tstat .cd-u { display: none !important; }
.phone-stats .tstat .gcl { margin-top: 0; }
@media (min-width: 1000px) { .ptrk { display: none; } }

/* The manager: the label on its own line, the name and alliance under it (names run to 16 characters). */
.mgrl { flex-direction: column; gap: 5px !important; }
.mgrl i { margin-right: 0 !important; }
.mgrl > div { display: flex !important; flex-direction: row !important; align-items: center; gap: 7px; }
/* Phone: the title is the track and the time; Details opens the card from the bottom, title and all. */
.details-btn { --edit-colour: var(--section); }
.ph-ctl .details-btn .words { display: none; }
.ph-ctl .details-btn .edit-icon { width: 21px; height: 21px; }
.sheet-wrap { align-items: flex-end !important; padding: 0 !important; }
.sheet { width: 100%; max-height: 90vh; overflow: auto; }
.sheet .stats { display: block !important; }
.sheet .tstat { border-radius: 22px 22px 0 0; padding: 26px 20px 24px; position: relative;
  background: linear-gradient(135deg, color-mix(in srgb, var(--section) 26%, transparent), color-mix(in srgb, var(--section) 3%, transparent) 65%), #1A2035 !important;
  border: none; box-shadow: inset 0 2px 0 var(--section), 0 -14px 34px rgba(0,0,0,.5) !important; }
.sheet .tstat::before { content: ''; position: absolute; top: 9px; left: 50%; width: 40px; height: 4px; margin-left: -20px; border-radius: 2px; background: rgba(255,255,255,.22); }
.sheet .cd { text-align: center; margin: 0 0 25px; }
.sheet .cd-v { font-size: 36px; font-weight: 900; color: var(--text); }
.sheet h3 { margin: 0 0 15px; font-size: 14px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--section); }
.sheet h3 ~ h3 { margin-top: 25px; }
.sheet .pl, .sheet .sg { display: grid; grid-template-columns: repeat(3, 1fr); }
.sheet .sg { row-gap: 18px; }
.sheet .pc, .sheet .sc { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.sheet .pc i { font-style: normal; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--lc); }
.sheet .pc em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-faint); }
.sheet .rw { position: relative; width: 70px; height: 70px; margin: 6px 0 4px; }
.sheet .ring { width: 70px; height: 70px; display: block; }
.sheet .rn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: var(--text); }
.sheet .sbar { display: flex; gap: 3px; height: 8px; margin-bottom: 18px; }
.sheet .sbar i { border-radius: 4px; background: var(--sc); }
.sheet .sc b { font-size: 24px; font-weight: 900; color: var(--text); }
.sheet .sc.s-over b { color: var(--danger); }
.sheet .sc .stc { font-size: 12.5px; }

/* The sheet starts under the phone's title, so it leaves out the phase and the time. */
.sheet .cd .trk, .sheet .cd-v { display: none !important; }
.sheet .gcl { margin-top: 0 !important; }
.sheet .tstat .cd { margin: 0 0 25px !important; }
.sheet .facts { margin-top: 0 !important; }

/* The transfer's facts: the label on the left, the value on the right. */
.facts { display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 16px; row-gap: 12px; margin: 0; text-align: left; }
.facts dt { font-size: 11.5px; font-weight: 800; letter-spacing: .1em; line-height: 1.25; text-transform: uppercase; color: var(--text-faint); }
.facts dd { margin: 0; justify-self: end; font-size: 18px; font-weight: 900; color: var(--text); font-variant-numeric: tabular-nums; white-space: nowrap; }
.facts .who-m { display: flex; align-items: center; gap: 8px; }
.facts .who-m b { font-size: 18px; font-weight: 800; }
.facts .who-m .mp { width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; background: var(--glass-strong); color: var(--text-muted); }
.facts .who-m .tag { padding: 2px 7px; font-size: 11.5px; }
.tstat .cd-v + .facts { margin-top: 22px; }

/* Group and power cap on one line, each with its label above. */
.gcp { display: flex; justify-content: space-between; margin: 0 0 14px; text-align: left; }
.gcp div { display: flex; flex-direction: column; gap: 3px; }
.gcp div + div { align-items: flex-end; }
.gcp i { font-style: normal; font-size: 11.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint); }
.gcp b { font-size: 18px; font-weight: 900; color: var(--text); font-variant-numeric: tabular-nums; }
.tstat .cd-v + .gcp { margin-top: 22px; }

/* Centred, as the head is (Roxanne, 26 Nov): group and cap side by side, the manager under them,
   the two-line label beside the name. */
.gcp { justify-content: center !important; gap: 44px; }
.gcp div, .gcp div + div { align-items: center !important; }
.facts { display: flex !important; justify-content: center; align-items: center; gap: 12px; }
.facts dd { justify-self: auto; }

/* Card spacing on what is drawn: 15 from the edge, connected parts close, 25 before each section title, 15 from a title to its content. */
@media (min-width: 1000px) { .tstat.gold { padding-top: 12px !important; } }
.tstat .cd .trk { margin-bottom: 6px !important; }
.tstat .cd-v + .gcp { margin-top: 16px !important; }
.gcp { margin-bottom: 9px !important; }
.tstat .cd { margin-bottom: 19px !important; }
.tstat h3 { margin-bottom: 12px !important; }
.tstat h3 ~ h3 { margin-top: 19px !important; }
.tstat .sbar { margin-bottom: 12px !important; }
.sheet .tstat { padding-top: 28px !important; padding-bottom: 12px !important; }
.sheet .tstat .cd-v + .gcp, .sheet .gcp { margin-top: 0 !important; }

/* Computer: the same title as the phone, above the card; the card holds only the facts. */
.pc-title { display: none; }
@media (min-width: 1000px) {
  .stats:has(.tstat) { display: flex !important; flex-direction: column; }
  .stats:has(.tstat) .tstat { flex: 1; min-height: 0; }
  .stats .pc-title { display: none !important; }
  .nav-title { display: flex; align-items: baseline; gap: 12px; white-space: nowrap; }
  .nav-title .cd-k { font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--section); }
  .nav-title b { font-size: 22px; font-weight: 900; color: var(--text); line-height: 1; }
  .tstat .cd .trk, .tstat .cd-v { display: none !important; }
  .tstat .cd-v + .gcp { margin-top: 0 !important; }
  .tstat.gold { padding-top: 15px !important; }
}

/* The card: the phase and the time centred at the top (computer), the manager, then group and cap,
   then the sections. On a phone the title is above, so the card starts with the manager. */
.cd-ph { font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--section); }
@media (min-width: 1000px) {
  .tstat .cd-v { display: block !important; font-size: 36px !important; margin-top: 4px !important; }
  .tstat .cd-v + .facts { margin-top: 18px !important; }
}
.facts + .gcp { margin-top: 15px !important; }
.tstat .gcp { margin-bottom: 0 !important; }
.sheet .cd-ph { display: none; }
.sheet .facts { margin-top: 0 !important; }

/* The transfer's date, with arrows to the transfers before and after it, as the calendar steps months. */
.tdate { display: flex; align-items: center; gap: 6px; }
.tdate span { font-size: 15px; font-weight: 800; color: var(--text); white-space: nowrap; }
.tarr { display: inline-flex; width: 26px; height: 26px; align-items: center; justify-content: center; padding: 0; border: none; border-radius: 8px; background: none; color: var(--text-muted); cursor: pointer; }
.tarr svg { width: 18px; height: 18px; }
.tstat .tdate { justify-content: center; margin-bottom: 10px; }
.icd .tdate { margin: 0 0 4px; }
.icd .tdate span { font-size: 14px; }
.sheet .tdate { display: none; }

/* A later transfer has no countdown: only its date and the word Upcoming. */
.cd-v:empty, .icd b:empty { display: none !important; }

/* Computer: the transfer's date above the lists, Add and Edit on its line (they belong to the lists);
   the card starts level with it and no longer shows the date. */
.lhead { display: none; }
@media (min-width: 1000px) {
  .lhead { display: flex; align-items: center; justify-content: space-between; margin: 0 0 22px; }
  .lhead .tdate { margin-left: 0; }
  .lhead .tdate span { font-size: 20px; font-weight: 800; }
  .lhead .tarr svg { width: 20px; height: 20px; }
  .tstat .tdate { display: none !important; }
  .tstat.gold { padding-top: 15px !important; }
}

/* A planning page: nothing before the current transfer, so its back arrow is not shown (its place kept). */
.tarr.off { display: none; }

/* The date stays on the lists' left edge; the arrows follow it, close together. */
.tdate { gap: 10px !important; }
.tarrs { display: inline-flex; gap: 2px; }

/* A later transfer's manager is known only after its SvS. */
.facts .who-m.tbd { font-size: 16px; font-weight: 700; color: var(--text-faint); }

/* The pin back to the current transfer, as the calendar's Today: shown only away from it; its word on a computer. */
.pin-cur { margin: 0 8px 0 0; order: 0 !important; display: inline-flex; padding: 0 3px; }
.tdate .pin-word { font-size: 13.5px !important; font-weight: 800 !important; }
.pin-cur svg { width: 19px; height: 19px; }
.icd .pin-word { display: none; }

/* Pin, back and next always in their places; what does nothing on the current transfer is dimmed, so nothing moves. */
.tarrs .dim { opacity: .28; pointer-events: none; }
.tarrs .pin-cur.dim { visibility: hidden; }
.tarrs { align-items: center; }
.tdate > span:first-child { min-width: 86px; font-variant-numeric: tabular-nums; }
@media (min-width: 1000px) { .lhead .tdate > span:first-child { min-width: 122px; } }

/* The arrows drawn as the pin is: the page's colour into white, with the same soft glow and size. */
.tarr svg { width: 19px !important; height: 19px !important; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--section) 55%, transparent)); }
.pin-cur svg { filter: drop-shadow(0 0 3px color-mix(in srgb, var(--section) 55%, transparent)); }

/* Phone: one controls row, as the calendar's (the date and its arrows on the left, Add, Edit and
   Details on the right, all on one centre line), then the phase and time centred under it. */
.pbar { display: flex; align-items: center; justify-content: space-between; height: 36px; margin: 0 0 12px; }
.pbar .tdate { margin: 0; }
.pbar .tdate span:first-child { font-size: 17px; }
.pbar .ph-ctl { gap: 16px; }
.pcount { display: flex; flex-direction: column; align-items: center; gap: 2px; margin: 0 0 25px; }
.pcount .cd-k { font-size: 11.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--section); }
.pcount b { font-size: 28px; font-weight: 900; color: var(--text); line-height: 1.1; }
.pcount b:empty { display: none; }
@media (min-width: 1000px) { .pbar, .pcount { display: none !important; } }

/* Phone title, two lines like a row: what it is (phase, and the date for the current one), then the one
   big thing (the countdown, or a later transfer's date). The actions sit centred on those two lines.
   Transfers change by swiping, as the calendar's months do; the pin joins the actions when away. */
.pbar { height: auto !important; margin: 0 0 25px !important; }
.ptitle { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ptitle .cd-k { font-size: 11.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--section); white-space: nowrap; }
.ptitle b { font-size: 26px; font-weight: 900; color: var(--text); line-height: 1.05; white-space: nowrap; }
.pbar .ph-ctl { gap: 16px !important; }
.pbar .pin-cur { margin: 0 0 0 10px; padding: 0; vertical-align: -2px; }
.ptitle b { display: inline-flex; align-items: center; }
.pbar .pin-cur svg { width: 21px !important; height: 21px !important; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--section) 55%, transparent)); }
.pcount { display: none !important; }

/* Records: two past transfers a page, newest first; each its card (date, manager, group and cap,
   who arrived, invites sent, how it ended) and who came, as they were then. */
.rnav { display: flex !important; justify-content: flex-start; margin: 0 0 15px !important; height: 26px; }
.rcols { display: grid; grid-template-columns: 1fr; gap: 25px; }
.rcol { min-width: 0; }
.rcard { margin-bottom: 25px; height: auto !important; flex: none !important; padding: 15px 18px 15px !important; }
.rcard h3 { margin: 25px 0 15px; font-size: 14px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--section); }
.rcard .pl, .rcard .sg { display: grid; grid-template-columns: repeat(3, 1fr); }
.rcard .pc, .rcard .sc { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.rcard .pc i { font-style: normal; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--lc); }
.rcard .pc em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--text-faint); }
.rcard .rw { position: relative; width: 64px; height: 64px; margin: 6px 0 4px; }
.rcard .ring { width: 64px; height: 64px; display: block; }
.rcard .rn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: var(--text); }
.rcard .sbar { display: flex; gap: 3px; height: 8px; margin-bottom: 12px; }
.rcard .sbar i { border-radius: 4px; background: var(--sc); }
.rcard .sc b { font-size: 22px; font-weight: 900; color: var(--text); }
.rcard .never { margin-top: 12px; }
.rcard .rdate { display: block !important; font-size: 28px !important; }
.rcard .cd { margin-bottom: 15px !important; text-align: center; }
.rcard .cd-v + .facts { margin-top: 0 !important; }
.rcol .stw { display: none !important; }
.rcard .tdate, .rcard .trk { display: none !important; }
@media (min-width: 1000px) {
  .rscroll { height: calc(100vh - 150px); overflow-y: auto; margin: 3px -6px 0 -12px; padding: 0 6px 0 12px; scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--accent) 35%, transparent) transparent;
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent); }
  .rcols { grid-template-columns: 1fr 1fr; column-gap: 44px; row-gap: 40px; align-items: start; }
  .rcol { overflow: visible; -webkit-mask-image: none !important; mask-image: none !important; padding: 0 !important; margin: 0 !important; }
  .rcol-old { overflow-y: auto; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--accent) 35%, transparent) transparent; padding: 0 6px 0 12px; margin-left: -12px;
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent); }
  .rnav { margin-top: 3px !important; }
  .rcol .cmp .ic { grid-template-columns: 40px minmax(0, 1fr) 96px 64px !important; }
  .rcol .chd { display: none !important; }
  .rcol .ctr, .rcol .cn { display: none !important; }
  .rcol .cmp .ic > * { grid-row: auto; }
  .rcol .cmp .ic .cpw { grid-column: 3; } .rcol .cmp .ic .side { grid-column: 4; }
}

/* A record's head, two lines: the date, group and cap, how it ended; the manager, who arrived from each
   list (in its colour) and the invites sent. */
.rhead { margin: 0 0 20px; padding-bottom: 12px; border-bottom: 1px solid var(--glass-border); }
.rl1, .rl2 { display: flex; align-items: center; gap: 12px; }
.rl2 { margin-top: 8px; }
.rd { font-size: 22px; font-weight: 900; color: var(--text); white-space: nowrap; }
.rgc { font-size: 13.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
.rst { margin-left: auto; display: inline-flex; gap: 12px; }
.rs { display: inline-flex; align-items: center; gap: 4px; }
.rs .sti { width: 15px; height: 15px; }
.rs b { font-size: 15px; font-weight: 900; color: var(--text); }
.rmg { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
.rmg .mp { width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; background: var(--glass-strong); color: var(--text-muted); flex: none; }
.rmg b { font-size: 14.5px; font-weight: 800; color: var(--text); white-space: nowrap; }
.rmg .tag { padding: 2px 7px; font-size: 11px; }
.rar { margin-left: auto; display: inline-flex; align-items: baseline; gap: 10px; white-space: nowrap; font-size: 12.5px; font-weight: 700; color: var(--text-faint); }
.ra b { font-size: 15px; font-weight: 900; color: var(--lc); }
.rsent { padding-left: 10px; border-left: 1px solid var(--glass-border); }
.rsent b { font-size: 15px; font-weight: 900; color: var(--text); }
@media (max-width: 999px) { .rgc { display: none; } .rcol + .rcol { margin-top: 15px; } }

/* The group shade stays inside the list's edges (Roxanne, 26 Nov): every row's content sits 10px in,
   grouped or not, so the picture has room and the rows still line up. */
.rcol .ic, .rcol .ic.grouped { margin-left: 0 !important; padding-left: 10px !important; }
.ic.viewing::after, .ic.grouped.viewing::after { left: 0 !important; right: 0 !important; }


/* Records only (Roxanne, 26 Nov): slightly smaller type and tighter rows, to see more at once. */
.rcol .cmp .ic { padding-top: 5px !important; padding-bottom: 5px !important; }
.rcol .cmp .av { width: 36px !important; height: 36px !important; font-size: 13px; }
.rcol .cmp .ic { grid-template-columns: 36px minmax(0, 1fr) 90px 60px !important; }
.rcol .nm b, .rcol .cmp .nm b { font-size: 14px !important; line-height: 18px; }
.rcol .copy b, .rcol .cmp .copy b { font-size: 12px !important; }
.rcol .st8 { font-size: 11.5px; }
.rcol .cmp .cpw .pwn { font-size: 14px; }
.rcol .il h2 { font-size: 13px; padding-bottom: 6px; }
.rcol .il { margin-bottom: 12px; }
.rcol .tag { font-size: 11px; padding: 2px 7px; }

/* Scrolled, the records fade in at the top too, as the calendar's weeks do. */
@media (min-width: 1000px) { .rscroll.more-above { -webkit-mask-image: linear-gradient(to bottom, transparent, #000 22px, #000 calc(100% - 22px), transparent); mask-image: linear-gradient(to bottom, transparent, #000 22px, #000 calc(100% - 22px), transparent); } }

/* The pin back to the most recent record: directly after the date, only away from it. */
.rl1 .pin-cur { margin: 0 0 0 -2px; padding: 0; }
.rl1 .pin-cur svg { width: 20px; height: 20px; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--section) 55%, transparent)); }

/* Proposal only (shown with idline): the state first, then the ID, then a bigger copy icon at the end. */
.idnew { gap: 8px; }
.idnew .st8 { order: 0; }
.idnew .copy { gap: 6px; }
.idnew .copy .cp { width: 18px !important; height: 18px !important; }
.cmp .idnew .copy .cp { width: 17px !important; height: 17px !important; }
@media (min-width: 1000px) {
}
@media (min-width: 1000px) { .idnew { gap: 6px !important; } .idnew .copy { gap: 5px !important; } .idnew .copy .cp, .cmp .idnew .copy .cp { width: 16px !important; height: 16px !important; } }

.il:not(.cmp) .idnew .st8 { display: none; }
.il:not(.cmp) .ic:has(.idnew) .pw .pst { display: inline; }
body:has(.cst, .avst, .vst) .pst, body:has(.cst, .avst, .vst) .idnew .st8 { display: none !important; }
@media (min-width: 1000px) {
  /* Fixed columns shared by every row, each part centred in its own column. */
  .two .il:not(.cmp) .ic:has(.idnew) { grid-template-columns: 48px minmax(0, 1fr) 136px 180px 94px 56px !important; column-gap: 7px !important; }
  .two .il:not(.cmp) .ic:has(.idnew) .vals { grid-template-columns: 56px 68px 56px; column-gap: 0; justify-self: center; }
  .two .il:not(.cmp) .ic:has(.idnew) .vals i { letter-spacing: .04em; }
  .two .il:not(.cmp) .ic:has(.idnew) .nm b { font-size: 14px; }
  .two .il:not(.cmp) .ic:has(.idnew) .troops { gap: 8px !important; }
  .two .il:not(.cmp) .ic:has(.idnew) .troops { justify-self: center; padding-left: 0 !important; }
  .two .il:not(.cmp) .ic:has(.idnew) .side .stw { justify-self: center !important; }
  .two .il:not(.cmp) .ic:has(.idnew) .side .con { justify-self: center !important; align-items: center !important; }
  .two .il:not(.cmp) .ic:has(.idnew) .troops { gap: 3px; }
  .two .il:not(.cmp) .ic:has(.idnew) .tp { width: 40px; height: 42px; }
  .two .il:not(.cmp) .ic:has(.idnew) .tp .p { height: 40px; }
  .two .il:not(.cmp) .ic:has(.idnew) .tp .f { height: 15px; }
  .two .il:not(.cmp) .ic:has(.idnew) .who { padding-right: 8px; }
  .two .il:not(.cmp) .ic:has(.idnew) .troops { padding-left: 4px; }
  .two .il:not(.cmp) .ic:has(.idnew) .side { justify-self: stretch; }
}
@media (min-width: 1000px) {
  /* Option B: the phone's Details card at the computer's width: name, ID and power on the first line with the
     status and contact on the right; troops and the three numbers on the second. */
  .twoline .two .il:not(.cmp) .ic:has(.idnew) { grid-template-columns: 56px minmax(0, 1fr) auto !important; column-gap: 14px !important; row-gap: 8px !important; padding: 10px 0 10px 10px !important; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .av { width: 56px; height: 56px; grid-column: 1; grid-row: 1; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .who { grid-column: 2; grid-row: 1; padding-right: 0; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .nm b { font-size: 17px; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .side { display: flex !important; grid-column: 3; grid-row: 1; flex-direction: column; align-items: flex-end; gap: 6px; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .side .stw, .twoline .two .il:not(.cmp) .ic:has(.idnew) .side .con { grid-column: auto !important; grid-row: auto !important; justify-self: auto !important; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .line2 { display: flex !important; grid-column: 1 / -1; grid-row: 2; justify-content: space-between; align-items: center; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .troops { grid-column: auto !important; grid-row: auto !important; gap: 10px !important; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .tp { width: 44px; height: 46px; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .tp .p { height: 44px; }
  .twoline .two .il:not(.cmp) .ic:has(.idnew) .vals { grid-column: auto !important; grid-row: auto !important; grid-template-columns: 90px 100px 90px; }
}
/* Proposal (idline): the player's FC shows only where the troops (each with its FC) do not. Details hides it;
   Compact on the computer shows the FC beside the name and drops the troop columns. */
.il:not(.cmp) .ic:has(.idnew) .nm .ffc { display: none; }
@media (min-width: 1000px) {
  .two .cmp:has(.idnew) .ic, .two .cmp:has(.idnew) .chd { grid-template-columns: 40px minmax(0, 1fr) 52px 70px 80px 70px 60px 96px 64px !important; }
  .two .cmp:has(.idnew) .ctr, .two .cmp:has(.idnew) .chd .cls { display: none !important; }
  .two .cmp:has(.idnew) .nm .ffc { display: none; }
  .two .cmp:has(.idnew) .cfc { display: flex !important; grid-column: 3 !important; justify-content: center; }
  .two .cmp:has(.idnew) .cfc img { height: 24px; }
  .two .cmp:has(.idnew) .cstc { display: block !important; grid-column: 7 !important; text-align: center; font-size: 14px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
  .two .cmp:has(.idnew) .ic .cn.k { grid-column: 4 !important; } .two .cmp:has(.idnew) .ic .cn.l { grid-column: 5 !important; } .two .cmp:has(.idnew) .ic .cn.t { grid-column: 6 !important; }
  .two .cmp:has(.idnew) .ic .cpw { grid-column: 8 !important; } .two .cmp:has(.idnew) .ic .side { grid-column: 9 !important; }
  .two .cmp:has(.idnew) .chd span { grid-column: auto !important; text-align: center; }
  .two .cmp:has(.idnew) .chd span:nth-child(8) { text-align: right; }
}
/* The ID quiet and grey; copying is the player's own button, bigger, at the end of the name block. */
.idg { font-size: 13px; font-weight: 600; color: var(--text-faint); font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.who:has(.copy-p) { padding-right: 0 !important; }
.copy-p { position: relative; display: flex; margin: 0 0 0 6px; padding: 0; border: none; background: none; cursor: pointer; }
/* The tap area is 40px, larger than the icon drawn. */
.copy-p::before { content: ''; position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; transform: translate(-50%, -50%); }
.copy-p .cp { width: 17px; height: 17px; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--section) 45%, transparent)); }
.cmp .copy-p .cp { width: 16px; height: 16px; }
.copy-p.copied .cp { width: 17px !important; height: 17px !important; }
/* The last player copied keeps the copied look until another is copied: the front square filled gold with a tick, and its ID lit. */

.copy-p.copied .cp { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--section) 75%, transparent)); }
/* Phone Details: the right column one fixed width, so the copy button sits in the same place on every row. */

.found .pst { display: inline !important; }
.pst { display: none; margin-left: 10px; font-size: 12px; font-weight: 600; color: var(--text-faint); }

.cfc, .cstc { display: none; }
/* No origin state in Compact (Roxanne, 26 Nov). */
.cmp .idnew .st8 { display: none !important; }

/* State options (proposal): 'tag' puts it under the alliance tag; 'pic' puts it on the picture. Either way it leaves the ID and power lines. */
.cst { display: block; margin-top: 3px; font-size: 11.5px; font-weight: 700; color: var(--text-faint); text-align: center; letter-spacing: .02em; }
.con:has(.cst) { flex-direction: column !important; align-items: center !important; gap: 0 !important; }
.avst { position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%); padding: 1px 6px; border-radius: 999px; font-style: normal;
  font-size: 10.5px; font-weight: 800; line-height: 14px; color: var(--text); background: #1B2440; box-shadow: 0 0 0 1.5px rgba(255,255,255,.16); letter-spacing: .02em; }
.cmp .avst { font-size: 9.5px; padding: 0 5px; bottom: -6px; }
.av:has(.avst) .pf { right: -6px; bottom: auto; top: -4px; }
.cmp .av:has(.avst) .pf { display: none; }

/* Option C: the state as one of the player's facts, labelled like Kills, Labyrinth and Transfer. */
.vals.v4 { grid-template-columns: 44px 58px 70px 58px !important; column-gap: 2px !important; }
@media (min-width: 1000px) {
  .two .il:not(.cmp) .ic:has(.v4) { grid-template-columns: 48px minmax(0, 1fr) 136px 236px 92px 48px !important; }
  .two .il:not(.cmp) .ic:has(.idnew) .vals.v4 { grid-template-columns: 50px 56px 68px 56px !important; }
}

/* Power is never red (Roxanne, 26 Nov: "don't make the power red"); the Over cap status says it. */
.pw.hot, .cpw.hot, .cmp .cpw.hot, .cpw.hot .pwn, .found .hot, .ic .hot { color: var(--text) !important; }

/* Phone Compact: the FC as its own column too, between the name block and the power. */
@media (max-width: 999px) {
  .cmp:has(.idnew) .ic { grid-template-columns: 40px calc(50% - 53px) 20px minmax(0, 1fr) 50px !important; column-gap: 6px !important; }
  .cmp:has(.idnew) .ic .cfc { justify-content: flex-start !important; margin-left: -2px; }
  .cmp:has(.idnew) .nm .ffc { display: none; }
  .cmp:has(.idnew) .cfc { display: flex !important; grid-column: 3; grid-row: 1; justify-content: center; }
  .cmp:has(.idnew) .cfc img { height: 22px; }
  .cmp:has(.idnew) .ic .cpw { grid-column: 4 !important; } .cmp:has(.idnew) .ic .side { grid-column: 5 !important; }
}

.empty { font-size: 13px; font-weight: 600; color: var(--text-faint); margin: 15px 0 25px; }
'''

shoot.serve('/tmp/render-build', 8712)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    numbers = [a for a in sys.argv[2:] if a.isdigit()]
    W, H = (int(numbers[0]), int(numbers[1])) if len(numbers) > 1 else (390, 844)
    page, errors = shoot.open_page(b, 'http://127.0.0.1:8712/#' + ('old' if 'oldshade' in sys.argv else '') + ('twoline' if 'twoline' in sys.argv else ''), W, H)
    page.click('.nav-tab[data-page=transfers]'); page.wait_for_timeout(600)
    page.click('.section-tab[data-sub-page=invites]'); page.wait_for_timeout(600)
    if RECORDS:
        page.click('.section-tab[data-sub-page=records]'); page.wait_for_timeout(500)
    page.evaluate("""([h, c, v]) => {
        document.querySelector('.work-page').innerHTML = h; if (!location.hash.includes('old')) document.querySelector('.work-page').classList.add('inset'); if (location.hash.includes('twoline')) document.querySelector('.work-page').classList.add('twoline'); const s = document.createElement('style'); s.textContent = c; document.head.appendChild(s);
        if (v) { const nav = document.querySelector('.section-nav'); nav.style.position = 'relative';
          const d = document.createElement('div'); d.innerHTML = v; const b = d.firstChild; b.style.position = 'absolute'; b.style.top = '50%';
          b.style.left = (document.querySelector('.lists .il h2').getBoundingClientRect().right - nav.getBoundingClientRect().left) + 'px'; b.style.transform = 'translate(-100%, -50%)'; nav.appendChild(b); }
    }""", [(REC_PAGE if W >= 1000 else REC_PHONE) if RECORDS else (WIDE_PAGE if W >= 1000 else PAGE), CSS, ''])
    page.wait_for_timeout(800)
    if 'twoline' in sys.argv: page.evaluate("document.querySelector('.work-page').classList.add('twoline')"); page.wait_for_timeout(200)
    if 'oldshade' in sys.argv: page.evaluate("document.querySelector('.work-page').classList.remove('inset')"); page.wait_for_timeout(200)
    if False:
        page.evaluate('''(h) => { const nav = document.querySelector('.section-nav'); const d = document.createElement('div'); d.innerHTML = h; const b = d.firstChild;
          const st = document.querySelector('.stats').getBoundingClientRect(); const nr = nav.getBoundingClientRect();
          b.style.position = 'absolute'; b.style.top = '50%'; b.style.left = (st.left - nr.left) + 'px'; b.style.transform = 'translateY(-50%)'; nav.appendChild(b); }''',
          '<div class="nav-title"><span class="cd-k">' + PHASE_NAME[PHASE] + '</span><b>' + TIME_TEXT + '</b></div>')
        page.wait_for_timeout(200)
    if 'profile' in sys.argv and W >= 1000:
        page.evaluate('''(h) => { const nav = document.querySelector('.section-nav'); const d = document.createElement('div'); d.innerHTML = h; const b = d.firstChild;
          b.style.position = 'absolute'; b.style.top = '50%'; b.style.left = (document.querySelector('.stats').getBoundingClientRect().right - nav.getBoundingClientRect().left) + 'px'; b.style.transform = 'translate(-100%, -50%)'; nav.appendChild(b); }''',
          '<button type="button" class="quiet neutral prof-close">' + CANCEL_ICON + '<span class="words">Close</span></button>')
        page.wait_for_timeout(200)
    if 'ord' in sys.argv: page.evaluate("window.scrollTo(0, document.querySelectorAll('.il')[1].getBoundingClientRect().top + window.scrollY - 130)"); page.wait_for_timeout(300)
    if 'drag' in sys.argv or 'bottom' in sys.argv: page.evaluate("document.querySelector('.work-page').classList.add('extra')"); page.evaluate("window.scrollTo(0, document.body.scrollHeight); document.querySelectorAll('.work-page, .page, .app').forEach(e => e.scrollTop = e.scrollHeight)"); page.wait_for_timeout(300)
    page.screenshot(path=sys.argv[1], full_page=W < 1000 and 'popup' not in sys.argv and 'ask' not in sys.argv and 'rmv' not in sys.argv and 'ngroup' not in sys.argv and 'sheet' not in sys.argv and 'drag' not in sys.argv and 'bottom' not in sys.argv and 'ord' not in sys.argv)
    print(errors)
    b.close()
