# Rebuilding the course catalog

`src/data/courses.js` is generated. If Westlake updates its catalog, regenerate it:

```bash
cd scripts/catalog
./fetch.sh            # downloads the department pages into pages/
python3 parse.py      # pages/*.html  -> raw.json   (one record per catalog post)
python3 transform.py  # raw.json      -> courses.json (clean names, levels, prereqs)
python3 emit.py       # courses.json  -> ../../src/data/courses.js
```

Each step prints a count so a silent failure is obvious. `transform.py` holds the
hand-written bits: the nine courses the catalog lists without ever rendering a
description, the department each cross-listed course belongs to, and the rules for
turning `AP BIOLOGY - SC315 (AP-BIO)` into `AP Biology`.

Nothing here invents content. A course with no published description ships with an
empty `summary`, and the app says so on the page instead of filling the gap.
