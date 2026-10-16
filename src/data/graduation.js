// ---------------------------------------------------------------------------
// What Westlake actually requires to graduate.
//
// Taken from the published graduation requirements page:
// https://whs.eanesisd.net/coursecatalog/info/graduation-requirements
// "Foundation Program + Multidisciplinary Endorsement with the Distinguished
// Level of Achievement (26 credits)", which is what Westlake students are
// defaulted to.
//
// The four-year plan uses this as a rough progress check, not as advice. Which
// specific course satisfies which requirement has exceptions a counselor knows
// and this file does not, so every screen that shows it says so.
// ---------------------------------------------------------------------------

export const PLAN_NAME = 'Foundation + Multidisciplinary Endorsement, Distinguished'
export const PLAN_URL = 'https://whs.eanesisd.net/coursecatalog/info/graduation-requirements'
export const TOTAL_CREDITS = 26

export const REQUIREMENTS = [
  { key: 'english', label: 'English', credits: 4, note: 'English I–IV. Journalism, yearbook and other LA electives count as electives.' },
  { key: 'math', label: 'Mathematics', credits: 4, note: 'Algebra I, Geometry, Algebra II, then Precalculus or Statistics.' },
  { key: 'science', label: 'Science', credits: 4, note: 'Biology, IPC or Chemistry, then Chemistry, Physics or another approved science.' },
  { key: 'social', label: 'Social Studies', credits: 4, note: 'World Geography, World History, U.S. History, Economics and Government.' },
  { key: 'language', label: 'World Language', credits: 2, note: 'Two credits in the same language.' },
  { key: 'pe', label: 'P.E.', credits: 1, note: 'Athletics, cheerleading, dance, marching band or PE.' },
  { key: 'health', label: 'Health', credits: 0.5, note: 'Health or Health Science.' },
  { key: 'arts', label: 'Fine Arts', credits: 1, note: 'Art, band, choir, orchestra, theatre, dance, AP Music Theory or AP Art History.' },
  { key: 'elective', label: 'Electives', credits: 5.5, note: 'Everything else. The ones you pick are what earn the endorsement.' },
]

export const REQUIREMENT_MAP = Object.fromEntries(REQUIREMENTS.map((r) => [r.key, r]))

/**
 * Which graduation bucket a course most likely counts for.
 *
 * An approximation on purpose: the catalog carries exceptions (a language arts
 * elective that does not satisfy the English requirement, a science elective
 * that does) and the plan screen tells the student their counselor decides.
 */
export function bucketFor(course) {
  const name = course.name.toLowerCase()
  switch (course.dept) {
    case 'Language Arts':
      return course.group === 'Core English' ? 'english' : 'elective'
    case 'Mathematics':
      return 'math'
    case 'Science':
      return 'science'
    case 'Social Studies':
      return course.group === 'Core Social Studies' ? 'social' : 'elective'
    case 'World Languages':
      return 'language'
    case 'Fine Arts':
      return 'arts'
    case 'Health and PE':
      return name.includes('health') ? 'health' : 'pe'
    default:
      return 'elective'
  }
}

/** Credits earned per bucket, plus the running total, for a set of courses. */
export function tallyCredits(courses) {
  const byBucket = Object.fromEntries(REQUIREMENTS.map((r) => [r.key, 0]))
  let total = 0
  for (const course of courses) {
    const credit = course.credits?.length ? Math.max(...course.credits) : 0
    byBucket[bucketFor(course)] += credit
    total += credit
  }
  return { byBucket, total }
}
