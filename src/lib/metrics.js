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

/** How a course reads at a glance, from the share who would take it again. */
export function verdictFor(share) {
  if (share == null) return { text: 'No verdict yet', tone: '#747B91' }
  if (share >= 0.85) return { text: 'Take it', tone: '#0E9F7E' }
  if (share >= 0.6) return { text: 'Worth it', tone: '#50A95B' }
  if (share >= 0.4) return { text: 'Divided', tone: '#C6A435' }
  if (share >= 0.2) return { text: 'Think twice', tone: '#E6713C' }
  return { text: 'Most regret it', tone: '#CE3B3F' }
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

export const SCHOOL_YEARS = ['2026–27', '2025–26', '2024–25', '2023–24', '2022–23']

// Averages stay hidden under this many reviews. Two opinions is not a pattern,
// and a wrong average is worse than no average.
export const MIN_REVIEWS = 3

export const LEVELS = ['AP', 'Post AP', 'Dual credit', 'Honors', 'On-level', 'Modified', 'Alternate']

export const LEVEL_STYLE = {
  AP: 'bg-brand-soft text-brand-deep',
  'Post AP': 'bg-brand-soft text-brand-deep',
  'Dual credit': 'bg-brand-soft text-brand-deep',
  Honors: 'bg-good-soft text-good',
  'On-level': 'bg-sunk text-ink-2',
  Modified: 'bg-sunk text-muted',
  Alternate: 'bg-sunk text-muted',
}

export const DEPT_META = {
  'Language Arts': { short: 'English', hue: '#5B6CF0' },
  Mathematics: { short: 'Math', hue: '#4F46E5' },
  Science: { short: 'Science', hue: '#0E9F7E' },
  'Social Studies': { short: 'Social Studies', hue: '#C77A2A' },
  'World Languages': { short: 'Languages', hue: '#2D8FD5' },
  'Fine Arts': { short: 'Fine Arts', hue: '#B94BC4' },
  'Technology & Career Education': { short: 'Tech & Career', hue: '#2FA3A8' },
  'Health and PE': { short: 'Health & PE', hue: '#D9534A' },
  'Miscellaneous Electives': { short: 'Other', hue: '#747B91' },
  'Special Education': { short: 'Special Ed', hue: '#7A6FD4' },
}

export function deptHue(dept) {
  return (DEPT_META[dept] || { hue: '#747B91' }).hue
}

export function deptShort(dept) {
  return (DEPT_META[dept] || { short: dept }).short
}
