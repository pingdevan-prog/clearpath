import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'data', 'courses.js'))
cs = json.load(open(HERE + '/courses.json'))

CODE_LINE = re.compile(r'^[A-Z]{2}\d{3}[A-Z]?\s*\(')

def clean_summary(s):
    """Drop the course-number tables some entries open with."""
    paras = [p.strip() for p in s.split('\n\n')]
    keep = []
    for p in paras:
        if not keep and (CODE_LINE.match(p) or re.fullmatch(r'(?:[A-Z]{2}\d{3}[A-Z]?.*\n?)+', p)):
            continue
        if p:
            keep.append(re.sub(r'\n+', ' ', p))
    return '\n\n'.join(keep).strip()

DEPT_ORDER = ['Language Arts', 'Mathematics', 'Science', 'Social Studies', 'World Languages',
              'Fine Arts', 'Technology & Career Education', 'Health and PE',
              'Miscellaneous Electives', 'Special Education']

def key(c):
    return (DEPT_ORDER.index(c['dept']), c['group'], c['name'])

cs.sort(key=key)

def js(v):
    return json.dumps(v, ensure_ascii=False)

lines = [
    '// ---------------------------------------------------------------------------',
    '// Westlake High School course catalog.',
    '//',
    '// Pulled from the published WHS course catalog at',
    '// https://whs.eanesisd.net/coursecatalog/courses on 2026-10-15. Every course the',
    '// catalog lists is in here, with the prerequisites and the description the school',
    '// publishes, so a class with no student reviews yet still has something to read.',
    '//',
    '// Regenerate with scripts/catalog/build-catalog.py if the school updates the catalog.',
    '// `summary` is empty for the nine courses the catalog lists without a description;',
    '// the UI says so rather than inventing one.',
    '// ---------------------------------------------------------------------------',
    '',
    'export const CATALOG_SOURCE = {',
    '  school: "Westlake High School",',
    '  url: "https://whs.eanesisd.net/coursecatalog/courses",',
    '  pulled: "October 2026",',
    '}',
    '',
    'export const DEPARTMENTS = [',
]
for d in DEPT_ORDER:
    n = sum(1 for c in cs if c['dept'] == d)
    lines.append(f'  {{ name: {js(d)}, count: {n} }},')
lines.append(']')
lines.append('')
lines.append('export const COURSES = [')
for c in cs:
    s = clean_summary(c['summary'])
    parts = [
        f'    id: {js(c["id"])},',
        f'    name: {js(c["name"])},',
    ]
    if c['code']:
        parts.append(f'    code: {js(c["code"])},')
    parts.append(f'    dept: {js(c["dept"])},')
    if c['group']:
        parts.append(f'    group: {js(c["group"])},')
    parts.append(f'    level: {js(c["level"])},')
    parts.append(f'    grades: {js(c["grades"])},')
    parts.append(f'    credits: {js(c["credits"])},')
    parts.append(f'    prereq: {js(c["prereq"])},')
    if c['note']:
        parts.append(f'    note: {js(c["note"])},')
    if c['fee']:
        parts.append('    fee: true,')
    if c['alsoIn']:
        parts.append(f'    alsoIn: {js(c["alsoIn"])},')
    if c['flags']:
        parts.append(f'    flags: {js(c["flags"])},')
    parts.append(f'    summary: {js(s)},')
    lines.append('  {\n' + '\n'.join(parts) + '\n  },')
lines.append(']')
lines.append('')
lines.append('export const COURSE_MAP = Object.fromEntries(COURSES.map((c) => [c.id, c]))')
lines.append('')
open(OUT, 'w').write('\n'.join(lines))
print('wrote', OUT, os.path.getsize(OUT), 'bytes,', len(cs), 'courses')
print('empty summaries:', sum(1 for c in cs if not clean_summary(c['summary'])))
