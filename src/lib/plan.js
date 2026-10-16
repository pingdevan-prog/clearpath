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
 * What to flag on one planned course: a grade the catalog does not open it to,
 * and prerequisites that are not scheduled in an earlier year.
 */
export function warningsFor(course, grade, plan, index) {
  const warnings = []

  if (course.grades?.length && !course.grades.includes(grade)) {
    const range =
      course.grades.length === 1
        ? `grade ${course.grades[0]}`
        : `grades ${course.grades[0]}–${course.grades[course.grades.length - 1]}`
    warnings.push({ kind: 'grade', text: `Catalog opens this to ${range}` })
  }

  const named = coursesNamedIn(course.prereq, index)
  if (named.length) {
    const earlier = new Set()
    const sameYear = new Set()
    for (const g of PLAN_GRADES) {
      for (const id of plan[g]) {
        if (g < grade) earlier.add(id)
        else if (g === grade) sameYear.add(id)
      }
    }
    const met = named.some((n) => earlier.has(n.id))
    if (!met) {
      const concurrent = named.find((n) => sameYear.has(n.id))
      if (concurrent) {
        warnings.push({ kind: 'prereq', text: `${concurrent.name} is scheduled the same year` })
      } else {
        warnings.push({
          kind: 'prereq',
          text: `Needs ${named[0].name} first, and it is not in an earlier year`,
        })
      }
    }
  }

  return warnings
}

export function creditsOf(course) {
  return course.credits?.length ? Math.max(...course.credits) : 0
}
