# Generates the start of src/ui/invites.css from the mockup's CSS: python3 -I mockup_css.py > /tmp/gen.css,
# then replace everything before "What the real page adds" in invites.css with it.
# Pulls the mockup's CSS out of invites_status.py and scopes every rule to the Invites and
# Records pages' root (.inv), so nothing leaks onto other pages.
import ast, re, sys
src = open('/home/claude/wos-state-hub/tools/mockups/invites/invites_status.py').read()
tree = ast.parse(src)
css_editing = css_main = None
for node in tree.body:
    if isinstance(node, ast.Assign) and getattr(node.targets[0], 'id', '') == 'CSS':
        # CSS = ('''edit''' if EDITING else '') + '''main'''
        left, right = node.value.left, node.value.right
        css_editing = left.body.value
        css_main = right.value
DROP = re.compile(r'(body:|\.ic\.open|\.ic\.gone(?![\w-])|\.av \.on-site(?![\w-])|\.sheet \.tdate|\.adding \.|\.ic\.adding|(?:\.twoline|\.v4|\.vst|\.cst|\.avst|\.mini|\.cards|\.ss|\.sl|\.views|\.ibar|\.icd|\.cd-s2|\.phone-stats|\.phases|\.ph|\.gc|\.mgr|\.mgrl|\.chev|\.more|\.st|\.copy|\.ctr|\.cls|\.pick-end|\.pk-count|\.remove-place|\.on-site|\.lists-panel|\.nav-title|\.pc-title|\.pcount|\.ptrk|\.rcard|\.rcol-old|\.pin-word|\.g-a|\.g-b|\.addline|\.cd-s|\.cd-u|\.rdate)(?![\w-]))')
def keep_out_of_profile(s):
    # The profile shown in a card on the page (.pp.in-card) keeps the profile's own look.
    m = re.search(r'(::?(before|after|placeholder|-webkit-[a-z-]+))$', s)
    if m: return s[:m.start()] + ':not(.in-card *)' + m.group(1)
    return s + ':not(.in-card *)'
def scope(selector, extra=''):
    s = keep_out_of_profile(selector.strip())
    if s.startswith('.work-page'):
        return '.inv' + extra + s
    return '.inv' + extra + ' ' + s
def transform(css, extra=''):
    out = []
    i = 0
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    def rules(block, indent=''):
        res = []
        pos = 0
        while True:
            m = re.search(r'([^{}]+)\{', block[pos:])
            if not m: break
            head = m.group(1).strip()
            start = pos + m.end()
            depth = 1; j = start
            while depth:
                if block[j] == '{': depth += 1
                elif block[j] == '}': depth -= 1
                j += 1
            body = block[start:j-1]
            pos = j
            if head.startswith('@media'):
                inner = rules(body, indent + '  ')
                if inner: res.append(f'{indent}{head} {{\n' + '\n'.join(inner) + f'\n{indent}}}')
                continue
            sels = [x for x in head.split(',') if x.strip() and not DROP.search(x)]
            if not sels or not body.strip(): continue
            res.append(indent + ', '.join(scope(x, extra) for x in sels) + ' {' + ' '.join(body.split()) + ' }')
        return res
    return rules(css)
print('/* Generated from the accepted mockup (tools/mockups/invites/invites_status.py), scoped to .inv. */')
MAIN = ('\n'.join(transform(css_main)).replace('s-done', 's-transferred').replace('s-rej', 's-rejected').replace('s-exp', 's-expired'))
EDIT = ('\n'.join(transform(css_editing, ':where(.editing)')).replace('s-done', 's-transferred').replace('s-rej', 's-rejected').replace('s-exp', 's-expired'))

print('/* Editing first, as the mockup had it, without adding to the rules\' weight. */')
print(EDIT)
print(MAIN)
