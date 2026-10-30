// ---------------------------------------------------------------------------
// What a student is aiming at, and which parts of the catalog serve it.
//
// Deliberately NOT a claim about admissions. Nothing here predicts whether a
// schedule gets anyone into anywhere — it maps a stated interest onto the
// departments and courses at this school that lead that way, and it says so
// on screen.
// ---------------------------------------------------------------------------

export const GOALS = [
  {
    id: 'engineering',
    label: 'Engineering',
    blurb: 'Mechanical, electrical, civil, aerospace',
    depts: ['Mathematics', 'Science', 'Technology & Career Education'],
    groups: ['STEM & Engineering'],
    seeds: [
      'ap-calculus-ab',
      'ap-calculus-bc',
      'ap-physics-1',
      'ap-physics-c',
      'engineering',
      'robotics-ii',
      'principles-of-applied-engineering-and-tech',
      '3d-cad-engineering-design-and-presentation',
    ],
    rigor: 'challenge',
  },
  {
    id: 'cs',
    label: 'Computer science',
    blurb: 'Software, data, cybersecurity',
    depts: ['Mathematics', 'Technology & Career Education'],
    groups: ['Information Technology'],
    seeds: [
      'ap-computer-science-a',
      'ap-computer-science-principles',
      'ap-calculus-ab',
      'ap-statistics',
      'computer-science-ii',
      'ap-cybersecurity',
      'video-game-design',
    ],
    rigor: 'challenge',
  },
  {
    id: 'health',
    label: 'Medicine or health',
    blurb: 'Pre-med, nursing, kinesiology, public health',
    depts: ['Science', 'Technology & Career Education'],
    groups: ['Health Science'],
    seeds: [
      'ap-biology',
      'ap-chemistry',
      'anatomy-and-physiology-honors',
      'chemistry-i-honors',
      'medical-terminology',
      'principles-of-health-science',
      'kinesiology',
      'ap-psychology',
    ],
    rigor: 'challenge',
  },
  {
    id: 'business',
    label: 'Business',
    blurb: 'Finance, marketing, entrepreneurship',
    depts: ['Social Studies', 'Technology & Career Education', 'Mathematics'],
    groups: ['Business & Marketing'],
    seeds: [
      'business-incubator',
      'accounting',
      'ap-macroeconomics',
      'ap-microeconomics',
      'ap-statistics',
      'principles-of-business-marketing-and-finance',
      'business-acceleratoredu',
      'personal-financial-literacy',
    ],
    rigor: 'balanced',
  },
  {
    id: 'law',
    label: 'Law, policy or politics',
    blurb: 'Pre-law, government, international relations',
    depts: ['Social Studies', 'Language Arts'],
    seeds: [
      'ap-united-states-government',
      'ap-comparative-government',
      'debate-i',
      'debate-ii',
      'ap-united-states-history',
      'ap-language-and-composition-ap-english-iii',
      'model-united-nations-sptss',
      'business-law',
    ],
    rigor: 'challenge',
  },
  {
    id: 'arts',
    label: 'Art, design or performance',
    blurb: 'Studio art, film, theatre, music, design',
    depts: ['Fine Arts'],
    groups: ['Arts, A/V & Communications'],
    seeds: [
      'ap-2-d-art-and-design',
      'ap-drawing',
      'art-i-foundations-of-art-with-emphasis-on-painting-and-drawing',
      'film-1-film-production',
      'theatre-arts-i',
      'digital-graphics-and-animation-i',
      'ap-art-history',
    ],
    rigor: 'balanced',
  },
  {
    id: 'writing',
    label: 'Writing, media or journalism',
    blurb: 'English, communications, film studies',
    depts: ['Language Arts'],
    seeds: [
      'ap-language-and-composition-ap-english-iii',
      'ap-english-literature-and-composition-ap-english-iv',
      'journalism',
      'news-media-i',
      'yearbook-i',
      'creative-writing-i',
      'independent-journalism',
    ],
    rigor: 'balanced',
  },
  {
    id: 'undecided',
    label: 'Not sure yet',
    blurb: 'Keep options open across the board',
    depts: [],
    seeds: [],
    rigor: 'balanced',
  },
]

export const GOAL_MAP = Object.fromEntries(GOALS.map((g) => [g.id, g]))

// Interests are lighter than a goal: a flavour, not a destination.
export const INTERESTS = [
  { id: 'stem', label: 'STEM', depts: ['Mathematics', 'Science'], groups: ['STEM & Engineering', 'Information Technology'] },
  { id: 'arts', label: 'Arts', depts: ['Fine Arts'], groups: ['Arts, A/V & Communications'] },
  { id: 'humanities', label: 'Humanities', depts: ['Language Arts', 'Social Studies'] },
  { id: 'languages', label: 'Languages', depts: ['World Languages'] },
  { id: 'business', label: 'Business', depts: [], groups: ['Business & Marketing'] },
  { id: 'health', label: 'Health', depts: [], groups: ['Health Science'] },
  { id: 'handson', label: 'Hands on', depts: [], groups: ['STEM & Engineering', 'Arts, A/V & Communications', 'Hospitality & Human Services'] },
  { id: 'sports', label: 'Sports', depts: ['Health and PE'] },
]

export const INTEREST_MAP = Object.fromEntries(INTERESTS.map((i) => [i.id, i]))

/**
 * How demanding a schedule to aim for.
 *
 * Framed as course load, never as an admissions prediction. "Selective schools
 * look at rigor" is true and sayable; "this gets you into Rice" is not.
 */
export const RIGOR = [
  {
    id: 'challenge',
    label: 'Challenge me',
    blurb: 'As many AP and honors as fit',
    apTarget: { 9: 2, 10: 3, 11: 4, 12: 4 },
    maxDifficulty: 10,
    maxWorkload: 10,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    blurb: 'A few hard ones, room to breathe',
    apTarget: { 9: 1, 10: 2, 11: 2, 12: 2 },
    maxDifficulty: 8.5,
    maxWorkload: 8,
  },
  {
    id: 'light',
    label: 'Keep it light',
    blurb: 'On-level where I can',
    apTarget: { 9: 0, 10: 0, 11: 1, 12: 1 },
    maxDifficulty: 6.5,
    maxWorkload: 6,
  },
]

export const RIGOR_MAP = Object.fromEntries(RIGOR.map((r) => [r.id, r]))

// What a stated college ambition means for course load, and nothing more.
export const COLLEGE_TIERS = [
  {
    id: 'selective',
    label: 'Highly selective',
    blurb: 'Ivies, Stanford, MIT, Rice',
    rigor: 'challenge',
    note: 'Selective schools read your transcript against what your school offers, so this leans hard into AP and honors. It is about course rigor — nothing here predicts an admissions decision.',
  },
  {
    id: 'flagship',
    label: 'State flagship',
    blurb: 'UT Austin, Texas A&M',
    rigor: 'challenge',
    note: 'Texas flagships weigh class rank and rigor heavily, so this keeps a strong AP core while protecting your GPA.',
  },
  {
    id: 'fouryear',
    label: 'A good four year school',
    blurb: 'Most state and private universities',
    rigor: 'balanced',
    note: 'A solid core with a few APs in what you are actually good at tends to travel further than a punishing schedule you cannot sustain.',
  },
  {
    id: 'open',
    label: 'Community college or undecided',
    blurb: 'Keep the door open, stay sane',
    rigor: 'light',
    note: 'This keeps you on track to graduate with room for the electives you actually want.',
  },
]

export const TIER_MAP = Object.fromEntries(COLLEGE_TIERS.map((t) => [t.id, t]))

// Typed college names map to a load profile. The named schools are examples of
// a tier, not a database of admissions requirements.
const COLLEGE_HINTS = [
  { tier: 'selective', words: ['ivy', 'harvard', 'yale', 'princeton', 'stanford', 'mit', 'caltech', 'rice', 'duke', 'columbia', 'brown', 'cornell', 'dartmouth', 'upenn', 'penn', 'chicago', 'northwestern', 'vanderbilt', 'johns hopkins', 'berkeley', 'ucla'] },
  { tier: 'flagship', words: ['ut austin', 'ut-austin', 'university of texas', 'texas a&m', 'a&m', 'tamu', 'flagship', 'michigan', 'georgia tech', 'purdue', 'virginia', 'unc', 'wisconsin', 'illinois'] },
  { tier: 'fouryear', words: ['texas state', 'texas tech', 'baylor', 'smu', 'tcu', 'houston', 'state school', 'four year', 'university'] },
  { tier: 'open', words: ['community', 'acc', 'austin community', 'two year', 'trade', 'undecided'] },
]

/** Best guess at what a typed college name implies for course load. */
export function tierForCollege(text) {
  const t = (text || '').toLowerCase()
  for (const hint of COLLEGE_HINTS) {
    if (hint.words.some((w) => t.includes(w))) return TIER_MAP[hint.tier]
  }
  return null
}
