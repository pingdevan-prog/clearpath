import json, re, os, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
recs = json.load(open(HERE + '/raw.json'))

# --- the 9 courses the catalog lists but never renders a description for ---
EXTRA = [
    dict(id='5627', title='PUBLIC SPEAKING LA510 (PUBSPKG)', dept='Language Arts', sub='electives',
         tags=['Credit: 1', 'Fee', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
    dict(id='4184', title='WATER POLO Boys', dept='Health and PE', sub='athletics',
         tags=['Credit: 1', 'Fee', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
    dict(id='4183', title='WATER POLO Girls', dept='Health and PE', sub='athletics',
         tags=['Credit: 1', 'Fee', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
    dict(id='3932', title='Chemistry Modified - SE322', dept='Special Education', sub='motified',
         tags=['Grade 10', 'Grade 11', 'Grade 12']),
    dict(id='3931', title='SOCIAL MEDIA MARKETING TC654B', dept='Technology & Career Education', sub='bus',
         tags=['Credit: .5', 'Grade 11', 'Grade 12']),
    dict(id='3930', title='PATH to College and Career ALT', dept='Special Education', sub='alternate',
         tags=['Credit: 1', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
    dict(id='2299', title='READING IMPROVEMENT ALTERNATE', dept='Special Education', sub='alternate',
         tags=['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
    dict(id='2298', title='READING SEMINAR', dept='Language Arts', sub='electives',
         tags=['Credit: 1', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
    dict(id='280', title='SWIFT CODING - TC280 (TACSI)', dept='Technology & Career Education', sub='it',
         tags=['Credit: 1', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'HONORS']),
]
for e in EXTRA:
    recs.append({'id': e['id'], 'title': e['title'], 'body': '', 'tags': e['tags'],
                 'cats': [], 'tagids': [], 'depts': [e['dept']], 'subs': [e['sub']]})

SUB_LABEL = {
    'courses': 'Core English', 'electives': 'Electives', 'science-courses': 'Core Science',
    'social-studies-courses': 'Core Social Studies', 'social-studies-electives': 'Electives',
    'asl': 'American Sign Language', 'chinese': 'Chinese', 'french': 'French',
    'latin': 'Latin', 'span': 'Spanish', 'arthistory': 'Art History', 'band': 'Band',
    'chor': 'Choir', 'color-guard-eve': 'Color Guard', 'dance': 'Dance',
    'orchestra': 'Orchestra', 'techth': 'Technical Theatre', 'th': 'Theatre Arts',
    'va': 'Visual Arts', 'other-music-electives': 'Other Music', 'bus': 'Business & Marketing',
    'hosp': 'Hospitality & Human Services', 'aav': 'Arts, A/V & Communications',
    'it': 'Information Technology', 'cd': 'Career Development', 'stem': 'STEM & Engineering',
    'healthsci': 'Health Science', 'health': 'Health & PE', 'athletics': 'Athletics',
    'motified': 'Modified', 'alternate': 'Alternate',
}

CODE_RE = re.compile(r'\b(?:[A-Z]{2}\s?\d{2,4}[A-Z]?|\d{3}[A-Z])\b')
KEEP = {
    'AP', 'IB', 'ASL', 'PE', 'CAD', 'STEM', 'AVID', 'GT', 'UT', 'US', 'U.S.', 'ACC', 'ROTC',
    'DNA', 'CTE', 'JV', '2D', '3D', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'AB',
    'BC', 'PALS', 'PATH', 'ALT', 'TV', 'A/V', 'EVE', 'LOTE', 'IPC', 'ACT', 'SAT', 'OSHA',
    'CERT', 'ENGL', 'HS',
}
FIXED = {'ONRAMPS': 'OnRamps', 'MCDONALDS': "McDonald's"}
LOWER = {'and', 'or', 'of', 'the', 'a', 'an', 'in', 'on', 'for', 'to', 'with', 'at',
         'from', 'by', 'as', 'into', 'per'}


def smart_title(s):
    """Recase the catalog's SHOUTING TITLES word by word, leaving mixed case alone."""
    return ' '.join(recase_word(w, i == 0) for i, w in enumerate(s.split(' ')))


def recase_word(word, first):
    if not word:
        return word
    # Recurse through separators so "DRAWING/PAINTING" and "PRE-AP" both work.
    for sep in ('/', '—', '–', '-'):
        if sep in word and len(word) > 1:
            return sep.join(recase_word(p, first and i == 0) for i, p in enumerate(word.split(sep)))
    core = word.strip('.,:;()&!*?"\'~')
    if not core:
        return word
    at = word.index(core)
    lead, tail = word[:at], word[at + len(core):]
    if core.upper() in FIXED:
        new = FIXED[core.upper()]
    elif core.upper() in KEEP:
        new = core.upper()
    elif not core.isupper():
        new = core                      # already mixed case: trust the catalog
    elif len(core) == 1:
        new = core.upper()
    elif core.lower() in LOWER and not first:
        new = core.lower()
    elif any(ch.isdigit() for ch in core):
        new = core.upper()
    else:
        new = core[0].upper() + core[1:].lower()
    return lead + new + tail


def clean_title(raw):
    t = raw.replace('&amp;', '&').strip()
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'([A-Za-z])\(', r'\1 (', t)          # "PHYSIOLOGY(Honors)"
    t = re.sub(r'([A-Za-z])[—–]([A-Za-z])', r'\1 — \2', t)  # "ACADEMY—CULINARY"
    hits = list(CODE_RE.finditer(t))
    if hits:
        t = t[:hits[0].start()]
    t = re.sub(r'[\s\-–—:,./*~]+$', '', t).strip()
    # Unbalanced "(" left behind by cutting a code out of a parenthetical.
    if t.count('(') > t.count(')'):
        t = t[:t.rindex('(')]
    t = re.sub(r'[\s\-–—:,./*]+$', '', t).strip()
    # Trailing all-caps abbreviation parenthetical, e.g. "(SPORTMD1, SPORTMD2)".
    m = re.search(r'\s*\(([^()a-z]*(?:and [^()a-z]*)?)\)$', t)
    if m and any(ch.isdigit() for ch in m.group(1)):
        t = t[:m.start()].strip()
    t = re.sub(r'[\s\-–—:,./*~]+$', '', t).strip()
    return smart_title(t)


def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return s


def course_code(raw):
    hits = CODE_RE.findall(raw)
    return hits[0].replace(' ', '') if hits else None


HEADER_RE = re.compile(
    r'^\s*(credit|credits|grade|grades|grade level|prerequisite|prerequisites|pre-requisite|'
    r'co-requisite|corequisite|recommended prerequisite|note|notes|fee|fees|course numbers|'
    r'course number|duration|length)\s*:\s*(.*)$', re.I)


def parse_body(body):
    """Split the catalog body into its labelled header lines and the description."""
    fields = {}
    desc_lines = []
    cur = None
    for line in body.split('\n'):
        m = HEADER_RE.match(line)
        if m:
            cur = m.group(1).lower()
            fields.setdefault(cur, []).append(m.group(2).strip())
            continue
        if not line.strip():
            cur = None
            desc_lines.append('')
            continue
        if cur and len(desc_lines) == 0:
            # Continuation of a header line (wrapped prerequisite text).
            fields[cur][-1] = (fields[cur][-1] + ' ' + line.strip()).strip()
            continue
        cur = None
        desc_lines.append(line.strip())
    desc = '\n'.join(desc_lines).strip()
    desc = re.sub(r'\n{3,}', '\n\n', desc)
    return fields, desc


def grades_from(tags, fields):
    g = sorted({int(m.group(1)) for t in tags for m in [re.match(r'Grade (\d+)', t)] if m})
    if g:
        return g
    raw = ' '.join(fields.get('grade', []) + fields.get('grades', []) + fields.get('grade level', []))
    nums = [int(n) for n in re.findall(r'\b(9|10|11|12)\b', raw)]
    if len(nums) == 2 and nums[0] < nums[1] and '-' in raw:
        return list(range(nums[0], nums[1] + 1))
    return sorted(set(nums))


def credit_from(tags, fields):
    vals = []
    for t in tags:
        m = re.match(r'Credit: ([\d.]+)', t)
        if m:
            vals.append(float(m.group(1)))
    if not vals:
        for raw in fields.get('credit', []) + fields.get('credits', []):
            for n in re.findall(r'\d*\.?\d+', raw):
                try:
                    vals.append(float(n))
                except ValueError:
                    pass
    vals = sorted(set(vals))
    return vals


def prereq_from(tags, fields):
    parts = []
    for key in ('prerequisite', 'prerequisites', 'pre-requisite', 'recommended prerequisite'):
        parts += fields.get(key, [])
    txt = ' '.join(p for p in parts if p).strip()
    if not txt and 'Prerequisite: None' in tags:
        txt = 'None'
    txt = re.sub(r'\s+', ' ', txt).strip(' .;')
    if not txt:
        return None
    if re.fullmatch(r'(none|n/a|no prerequisite[s]?)', txt, re.I):
        return 'None'
    return txt


def level_for(name, tags, dept):
    upper = name.upper()
    if 'Post AP' in tags:
        return 'Post AP'
    if 'AP' in tags or upper.startswith('AP ') or ' AP ' in upper:
        return 'AP'
    if 'Dual Credit' in tags or 'OnRamps' in tags or 'OnRamps' in name or 'Dual' in upper:
        return 'Dual credit'
    if 'HONORS' in tags or 'HONORS' in upper or 'Honors' in name:
        return 'Honors'
    if 'MODIFIED' in upper:
        return 'Modified'
    if 'ALTERNATE' in upper or upper.endswith(' ALT'):
        return 'Alternate'
    if dept == 'Special Education':
        return 'Modified'
    return 'On-level'


CODE_DEPT = {
    'MA': 'Mathematics', 'SC': 'Science', 'LA': 'Language Arts', 'SS': 'Social Studies',
    'FL': 'World Languages', 'VA': 'Fine Arts', 'PA': 'Fine Arts',
    'TC': 'Technology & Career Education', 'PE': 'Health and PE', 'AT': 'Health and PE',
    'SE': 'Special Education',
}

courses = []
seen_slugs = {}
for r in recs:
    name = clean_title(r['title'])
    code = course_code(r['title'])
    # A cross-listed course belongs to the department its course code comes from.
    dept = r['depts'][0]
    if len(r['depts']) > 1 and code:
        home = CODE_DEPT.get(code[:2].upper())
        if home in r['depts']:
            dept = home
    sub = r['subs'][0] if r['subs'] else ''
    if dept != r['depts'][0]:
        order = {'Science': ['science-courses', 'electives'], 'Social Studies': ['social-studies-courses'],
                 'Health and PE': ['health'], 'Language Arts': ['electives']}.get(dept, [])
        for cand in order:
            if cand in r['subs']:
                sub = cand
                break
    fields, desc = parse_body(r['body'])
    tags = r['tags']
    slug = slugify(name) or 'course-' + r['id']
    if slug in seen_slugs:
        slug = f"{slug}-{r['id']}"
    seen_slugs[slug] = True
    note = ' '.join(fields.get('note', []) + fields.get('notes', [])).strip() or None
    courses.append({
        'id': slug,
        'pid': r['id'],
        'name': name,
        'code': code,
        'dept': dept,
        'alsoIn': [d for d in r['depts'] if d != dept],
        'group': SUB_LABEL.get(sub, ''),
        'grades': grades_from(tags, fields),
        'credits': credit_from(tags, fields),
        'prereq': prereq_from(tags, fields),
        'level': level_for(name, tags, dept),
        'fee': 'Fee' in tags,
        'summary': desc,
        'note': note,
        'flags': [t for t in tags if t in ('Elective', 'New Course', 'Articulated College Credit',
                                           'Dual Credit', 'OnRamps', 'Post AP')],
    })

courses.sort(key=lambda c: (c['dept'], c['group'], c['name']))
json.dump(courses, open(HERE + '/courses.json', 'w'), indent=1)

print('courses:', len(courses))
print('no summary:', sum(1 for c in courses if not c['summary']))
print('no prereq field:', sum(1 for c in courses if not c['prereq']))
print('no grades:', sum(1 for c in courses if not c['grades']))
print('no credits:', sum(1 for c in courses if not c['credits']))
import collections
print(collections.Counter(c['dept'] for c in courses))
print(collections.Counter(c['level'] for c in courses))
