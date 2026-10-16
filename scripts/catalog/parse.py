import re, json, html, os, glob

DEPT = {
    'la': 'Language Arts', 'math': 'Mathematics', 'science': 'Science',
    'social-studies': 'Social Studies', 'fl': 'World Languages',
    'fine-arts': 'Fine Arts', 'cate': 'Technology & Career Education',
    'health-and-physical-education': 'Health and PE', 'sped': 'Special Education',
    'misc': 'Miscellaneous Electives',
}

def clean(s):
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'</p>', '\n\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    s = s.replace('\xa0', ' ').replace('’', "'").replace('‘', "'")
    s = s.replace('“', '"').replace('”', '"')
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()

out = {}
for path in sorted(glob.glob(os.path.dirname(os.path.abspath(__file__)) + '/pages/*.html')):
    slug = os.path.basename(path)[:-5]
    parts = slug.split('_')
    dept = DEPT.get(parts[0], parts[0])
    sub = parts[1] if len(parts) > 1 else ''
    h = open(path, encoding='utf-8', errors='replace').read()
    for m in re.finditer(r'<article class="([^"]*)" data-post-id="(\d+)".*?</article>', h, re.S):
        cls, pid, blob = m.group(1), m.group(2), m.group(0)
        tm = re.search(r'<div class="fsTitle[^"]*"[^>]*>(.*?)</div>', blob, re.S)
        bm = re.search(r'<div class="fsBody">(.*?)</div>', blob, re.S)
        tags = [clean(x) for x in re.findall(r'<li class="fsTag">(.*?)</li>', blob, re.S)]
        title = clean(tm.group(1)) if tm else ''
        body = clean(bm.group(1)) if bm else ''
        rec = out.setdefault(pid, {
            'id': pid, 'title': title, 'body': body, 'tags': tags,
            'cats': re.findall(r'fsCategory-(\d+)', cls),
            'tagids': re.findall(r'fsTag-(\d+)', cls),
            'depts': [], 'subs': [],
        })
        if dept not in rec['depts']:
            rec['depts'].append(dept)
        if sub and sub not in rec['subs']:
            rec['subs'].append(sub)
        if len(body) > len(rec['body']):
            rec['body'] = body

recs = list(out.values())
print('courses:', len(recs))
json.dump(recs, open(os.path.dirname(os.path.abspath(__file__)) + '/raw.json', 'w'), indent=1)

# how many have a prerequisite line
pr = sum(1 for r in recs if re.search(r'prerequisit', r['body'], re.I))
print('with prereq line:', pr)
print('empty body:', sum(1 for r in recs if not r['body']))
for r in recs[:3]:
    print('---', r['title'], r['depts'], r['subs'], r['tags'])
    print(r['body'][:400])
