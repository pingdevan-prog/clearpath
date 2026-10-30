// ---------------------------------------------------------------------------
// The four-year plan's own logic: which courses a prerequisite names, and what
// is worth warning a student about before they hand the plan to a counselor.
// ---------------------------------------------------------------------------

import { PLAN_GRADES } from './store'

// Short names match too much ("Dance" turns up inside unrelated sentences), so
// only names this long or longer are looked for inside prerequisite text.
const MIN_NAME = 6

/** Build the lookup once per catalog: longest names first, so matches are maximal. */
export function buildNameIndex(courses) {
  return courses
    .map((c) => ({ id: c.id, name: c.name, lower: normalize(c.name) }))
    .filter((c) => c.lower.length >= MIN_NAME)
    .sort((a, b) => b.lower.length - a.lower.length)
}

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Which catalog courses a prerequisite line actually names.
 * "Spanish III or III Honors" -> [Spanish III Honors, Spanish III]
 * "Teacher approval" -> []
 */
export function coursesNamedIn(prereq, index) {
  if (!prereq || prereq === 'None') return []
  const text = normalize(prereq)
  const found = []
  for (const entry of index) {
    if (!text.includes(entry.lower)) continue
    // Skip anything already covered by a longer match we took.
    if (found.some((f) => f.lower.includes(entry.lower))) continue
    found.push(entry)
    if (found.length >= 4) break
  }
  return found
}

/**
 * A course name with its level stripped off.
 *
 * "English I Honors" and "English I" are the same rung of the same sequence,
 * and "AP World History" is the course "World History" names as its
 * prerequisite. Matching on the bare name is what stops the planner telling a
 * student who took English I Honors that they are missing English I.
 */
function stripLevels(s) {
  return s
    .toLowerCase()
    .replace(/\b(ap|honors|honours|advanced|dual credit|pre-ap|preap|gt)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Every name a course answers to, with its level stripped off.
 *
 * "English I Honors" and "English I" are the same rung, and "AP World History"
 * is what "World History" means in a prerequisite. The parenthetical counts
 * too: "AP Language and Composition (AP English III)" IS English III, and the
 * catalog only says so inside the brackets.
 */
export function baseNames(name) {
  const out = new Set()
  out.add(stripLevels(name.replace(/\s*\(.*?\)\s*/g, ' ')))
  for (const m of name.matchAll(/\(([^)]+)\)/g)) {
    const inner = stripLevels(m[1])
    if (inner.length >= 4) out.add(inner)
  }
  out.delete('')
  return out
}

/** The primary name, for callers that want a single string. */
export function baseName(name) {
  return stripLevels(name.replace(/\s*\(.*?\)\s*/g, ' '))
}

/**
 * Is `course`'s prerequisite met by something scheduled before `grade`?
 *
 * `courseAt(id)` returns the grade a course is scheduled in, or null.
 * Returns { ok, via, sameYear } so callers can tell "not taken" from
 * "taken, but in the same year".
 */
export function prereqSatisfiedBy(course, grade, courseAt, index, courseMap) {
  // A course is never its own prerequisite. Some catalog entries mention their
  // own name in the prerequisite text ("If a student took ... AP Chemistry"),
  // and without this a class gets flagged for needing itself.
  const ownNames = baseNames(course.name)
  const named = coursesNamedIn(course.prereq, index).filter(
    (n) => n.id !== course.id && ![...baseNames(n.name)].some((b) => ownNames.has(b))
  )
  if (!named.length) return { ok: true }

  const earlierBases = new Set()
  const sameYearBases = new Set()
  for (const entry of index) {
    if (entry.id === course.id) continue
    const at = courseAt(entry.id)
    if (at == null) continue
    const names = baseNames(courseMap?.[entry.id]?.name || entry.name)
    for (const b of names) {
      if (at < grade) earlierBases.add(b)
      else if (at === grade) sameYearBases.add(b)
    }
  }
  const shares = (set, n) => [...baseNames(n.name)].some((b) => set.has(b))

  for (const n of named) {
    const at = courseAt(n.id)
    if (at != null && at < grade) return { ok: true, via: n }
    if (shares(earlierBases, n)) return { ok: true, via: n }
  }
  for (const n of named) {
    const at = courseAt(n.id)
    if ((at != null && at === grade) || shares(sameYearBases, n)) {
      return { ok: false, sameYear: n }
    }
  }
  return { ok: false, needs: named[0] }
}

/**
 * Light notes on one planned course: a grade the catalog does not list it for,
 * and a prerequisite that is not in an earlier year.
 *
 * These are notes, not errors. A student can plan any class in any year —
 * maybe they took the prerequisite over the summer, maybe a counsellor will
 * make an exception — so the planner mentions it once, quietly, and never
 * blocks anything.
 */
export function warningsFor(course, grade, plan, index, courseMap) {
  const warnings = []

  if (course.grades?.length && !course.grades.includes(grade)) {
    const range =
      course.grades.length === 1
        ? `grade ${course.grades[0]}`
        : `grades ${course.grades[0]}–${course.grades[course.grades.length - 1]}`
    warnings.push({ kind: 'grade', text: `The catalog lists this for ${range}` })
  }

  const at = (id) => {
    for (const g of PLAN_GRADES) {
      if ((plan[g] || []).includes(id)) return g
    }
    return null
  }
  const result = prereqSatisfiedBy(course, grade, at, index, courseMap)
  if (!result.ok) {
    if (result.sameYear) {
      warnings.push({
        kind: 'prereq',
        text: `Usually taken after ${result.sameYear.name}, which you have the same year`,
      })
    } else if (result.needs) {
      warnings.push({ kind: 'prereq', text: `Usually taken after ${result.needs.name}` })
    }
  }

  return warnings
}

export function creditsOf(course) {
  return course.credits?.length ? Math.max(...course.credits) : 0
}
