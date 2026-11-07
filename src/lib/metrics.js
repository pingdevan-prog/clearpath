// ---------------------------------------------------------------------------
// What a Clearpath review measures, and what every number means in words.
//
// Four scores out of 10 and one yes/no. That is the whole review, by design —
// a review you can finish in thirty seconds is a review people actually leave.
//
// Nothing here rates a teacher. There is no field for it, on purpose: teachers
// change, sections change, and a class should be judged on the class.
// ---------------------------------------------------------------------------

export const FACTORS = [
  {
    key: 'difficulty',
    label: 'Difficulty',
    short: 'Difficulty',
    question: 'How hard was it to earn an A?',
    hint: '1 = an easy A · 10 = an A is rare',
    polarity: 'cost',
    bands: [
      { max: 2, text: 'Easy A' },
      { max: 4, text: 'Light lift' },
      { max: 6, text: 'Work for it' },
      { max: 8, text: 'Real grind' },
      { max: 10, text: 'An A is rare' },
    ],
  },
  {
    key: 'workload',
    label: 'Homework load',
    short: 'Homework',
    question: 'How much work outside of class?',
    hint: '1 = almost none · 10 = it eats your nights',
    polarity: 'cost',
    bands: [
      { max: 2, text: 'Almost none' },
      { max: 4, text: 'Light' },
      { max: 6, text: 'Manageable' },
      { max: 8, text: 'Heavy' },
      { max: 10, text: 'Eats your nights' },
    ],
  },
  {
    key: 'fun',
    label: 'Fun',
    short: 'Fun',
    question: 'Did you enjoy being in this class?',
    hint: '1 = dreaded it · 10 = best part of the day',
    polarity: 'benefit',
    bands: [
      { max: 2, text: 'Dreaded it' },
      { max: 4, text: 'Pretty dull' },
      { max: 6, text: 'Some good days' },
      { max: 8, text: 'Genuinely fun' },
      { max: 10, text: 'Best part of my day' },
    ],
  },
  {
    key: 'value',
    label: 'Worth it',
    short: 'Worth it',
    question: 'How much did you get out of it?',
    hint: '1 = learned nothing · 10 = changed how I think',
    polarity: 'benefit',
    bands: [
      { max: 2, text: 'Learned nothing' },
      { max: 4, text: 'Not much stuck' },
      { max: 6, text: 'Some of it stuck' },
      { max: 8, text: 'Learned a lot' },
      { max: 10, text: 'Changed how I think' },
    ],
  },
]

export const FACTOR_MAP = Object.fromEntries(FACTORS.map((f) => [f.key, f]))

export function bandLabel(key, value) {
  const f = FACTOR_MAP[key]
  if (!f || value == null) return ''
  const v = Math.round(value)
  return (f.bands.find((b) => v <= b.max) || f.bands[f.bands.length - 1]).text
}

// One ramp, one meaning, everywhere in the app:
// cool = light / good, warm = heavy / watch out. For "benefit" factors the
// input is flipped, so a high Fun reads cool and a low Fun reads hot.
export const RAMP = [
  '#14A08A',
  '#29A472',
  '#50A95B',
  '#7CAE48',
  '#A3AF3B',
  '#C6A435',
  '#DE8C35',
  '#E6713C',
  '#DE5440',
  '#CE3B3F',
]

export function toneFor(key, value) {
  const f = FACTOR_MAP[key]
  const v = Math.max(1, Math.min(10, Math.round(value ?? 5)))
  const idx = f && f.polarity === 'benefit' ? 11 - v : v
  return RAMP[idx - 1]
}

export function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

// Neutral tone for "no score yet". A CSS colour so it follows light and dark.
export const NO_TONE = 'rgb(var(--c-muted))'

/** How a course reads at a glance, from the share who would take it again. */
export function verdictFor(share) {
  if (share == null) return { text: 'No verdict yet', tone: NO_TONE }
  if (share >= 0.85) return { text: 'Take it', tone: RAMP[0] }
  if (share >= 0.6) return { text: 'Worth it', tone: RAMP[2] }
  if (share >= 0.4) return { text: 'Divided', tone: RAMP[5] }
  if (share >= 0.2) return { text: 'Think twice', tone: RAMP[7] }
  return { text: 'Most regret it', tone: RAMP[9] }
}

// What a class is like day to day. Course shape only — never the teacher.
export const COURSE_TAGS = [
  'Fast pace',
  'Test heavy',
  'Lots of projects',
  'Heavy reading',
  'Lots of writing',
  'Memorization heavy',
  'Hands-on labs',
  'Group work',
  'Problem sets',
  'Creative freedom',
  'Good for college apps',
  'Easy to fall behind',
]

export const HOURS_BUCKETS = ['<1', '1–3', '3–5', '5+']

export const GRADE_LEVELS = [9, 10, 11, 12]

// Who you are on Clearpath. Only a student has a grade; everyone else is just
// here to read, which is why the grade picker appears for one of these.
export const ROLES = [
  { value: 'student', label: 'Student', blurb: 'I take classes here' },
  { value: 'educator', label: 'Educator', blurb: 'I teach or counsel here' },
  { value: 'parent', label: 'Parent', blurb: 'My child goes here' },
  { value: 'other', label: 'Other', blurb: 'Something else' },
]

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.value, r]))

export function roleLabel(role) {
  return ROLE_MAP[role]?.label || null
}

/** How a profile reads under its name: "11th grade", "Educator", or nothing. */
export function profileSubtitle(profile) {
  if (!profile) return ''
  if (profile.role === 'student' || (!profile.role && profile.grade)) {
    return profile.grade ? `${profile.grade}th grade` : 'Student'
  }
  return roleLabel(profile.role) || ''
}

export const SCHOOL_YEARS = ['2026–27', '2025–26', '2024–25', '2023–24', '2022–23']

// Averages stay hidden under this many reviews. Two opinions is not a pattern,
// and a wrong average is worse than no average.
export const MIN_REVIEWS = 3

export const LEVELS = ['AP', 'Post AP', 'Dual credit', 'Honors', 'On-level', 'Modified', 'Alternate']

export const LEVEL_STYLE = {
  AP: 'bg-brand-soft text-brand-deep',
  'Post AP': 'bg-brand-soft text-brand-deep',
  'Dual credit': 'bg-brand-soft text-brand-deep',
  Honors: 'bg-good-soft text-good-ink',
  'On-level': 'bg-sunk text-ink-2',
  Modified: 'bg-sunk text-muted',
  Alternate: 'bg-sunk text-muted',
}

// Every department gets its own colour so the catalog reads at a glance.
// Hues are spread around the wheel and kept clear of the brand indigo.
export const DEPT_META = {
  'Language Arts': { short: 'English', hue: '#E0457B', icon: 'book' },
  Mathematics: { short: 'Math', hue: '#2F7BEA', icon: 'math' },
  Science: { short: 'Science', hue: '#12A37F', icon: 'flask' },
  'Social Studies': { short: 'Social Studies', hue: '#E08A1E', icon: 'globe' },
  'World Languages': { short: 'Languages', hue: '#0EA2C0', icon: 'speech' },
  'Fine Arts': { short: 'Fine Arts', hue: '#B44FD6', icon: 'palette' },
  'Technology & Career Education': { short: 'Tech & Career', hue: '#7FA52A', icon: 'chip' },
  'Health and PE': { short: 'Health & PE', hue: '#EF5B3F', icon: 'heart' },
  'Miscellaneous Electives': { short: 'Other', hue: '#7C8399', icon: 'spark' },
  'Special Education': { short: 'Special Ed', hue: '#8A6CF0', icon: 'hands' },
}

const DEPT_FALLBACK = { hue: '#7C8399', icon: 'spark' }

export function deptHue(dept) {
  return (DEPT_META[dept] || DEPT_FALLBACK).hue
}

export function deptIcon(dept) {
  return (DEPT_META[dept] || DEPT_FALLBACK).icon
}

export function deptShort(dept) {
  return (DEPT_META[dept] || { short: dept }).short
}
