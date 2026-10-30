// ---------------------------------------------------------------------------
// The spine of a schedule: what everyone has to take, and in what order.
//
// A counsellor fills the required core first and lets electives take what is
// left. Doing it the other way round is how you reach senior year needing two
// credits of English, which is exactly what the first version of the planner
// did before this file existed.
//
// Most sequences are derived from the catalog's own grade ranges. Mathematics
// is listed without grades, so its ladder is written out — it is the one
// sequence every Westlake student follows in the same order.
// ---------------------------------------------------------------------------

/** Each rung lists its courses best-first for a student who wants rigor. */
export const MATH_LADDER = [
  { tier: 'Algebra I', options: ['algebra-i-honors', 'algebra-i'] },
  { tier: 'Geometry', options: ['geometry-honors', 'geometry'] },
  { tier: 'Algebra II', options: ['algebra-ii-honors', 'algebra-ii'] },
  {
    tier: 'Precalculus',
    options: ['ap-precalculus', 'precalculus', 'mathematical-models-with-applications'],
  },
  {
    tier: 'Calculus or Statistics',
    options: ['ap-calculus-bc', 'ap-calculus-ab', 'calculus', 'ap-statistics', 'statistics'],
  },
  {
    tier: 'Beyond',
    options: ['multivariable-calculus', 'linear-algebra', 'stats-2-beyond-ap-statistics'],
  },
]

/** Two credits of a world language have to be the same language. */
export const LANGUAGE_FAMILIES = {
  Spanish: ['spanish-i', 'spanish-ii', 'spanish-iii-honors', 'spanish-iii', 'ap-spanish-iv', 'ap-spanish-v'],
  French: ['french-i', 'french-ii', 'french-iii-honors', 'ap-french-language-and-culture-level-iv'],
  Latin: ['latin-i', 'latin-ii', 'latin-iii-honors', 'ap-latin-level-iv'],
  Chinese: ['chinese-i', 'chinese-ii', 'chinese-iii-honors', 'ap-chinese-language-and-culture-level-iv'],
  'American Sign Language': [
    'american-sign-language-i',
    'american-sign-language-ii',
    'american-sign-language-iii-honors',
    'american-sign-language-iv-honors',
  ],
}

/**
 * The required core, in the order it gets placed.
 *
 * `pick` says how to find candidates for a given grade:
 *   'byGrade'  - any course in this group the catalog opens to that grade
 *   'ladder'   - walk MATH_LADDER one rung a year
 *   'language' - two consecutive levels of one language
 */
export const CORE = [
  {
    bucket: 'english',
    label: 'English',
    pick: 'byGrade',
    group: 'Core English',
    perGrade: { 9: 1, 10: 1, 11: 1, 12: 1 },
    // English alone gets the relaxed prerequisite check. Dual Credit ENGL
    // 1301/1302 leads into AP English Literature, but the catalog's wording
    // ("English III or AP English Language & Composition") never says so, and
    // no amount of string matching will work it out. Science cannot have this:
    // Robotics III really does need Robotics II.
    relaxPrereq: true,
  },
  { bucket: 'math', label: 'Mathematics', pick: 'ladder', perGrade: { 9: 1, 10: 1, 11: 1, 12: 1 } },
  {
    bucket: 'science',
    label: 'Science',
    pick: 'byGrade',
    dept: 'Science',
    perGrade: { 9: 1, 10: 1, 11: 1, 12: 1 },
  },
  {
    bucket: 'social',
    label: 'Social Studies',
    pick: 'byGrade',
    group: 'Core Social Studies',
    perGrade: { 9: 1, 10: 1, 11: 1, 12: 1 },
  },
  { bucket: 'language', label: 'World Language', pick: 'language', credits: 2 },
  {
    bucket: 'arts',
    label: 'Fine Arts',
    pick: 'anyGrade',
    dept: 'Fine Arts',
    credits: 1,
  },
  {
    bucket: 'pe',
    label: 'P.E.',
    pick: 'fromList',
    options: ['pe-personal-fitness-and-team-sports', 'pe-yoga', 'outdoor-education'],
    credits: 1,
  },
  { bucket: 'health', label: 'Health', pick: 'fromList', options: ['health-education'], credits: 0.5 },
]
