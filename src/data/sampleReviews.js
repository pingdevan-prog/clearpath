// ---------------------------------------------------------------------------
// SAMPLE REVIEWS — not real student opinion.
//
// Clearpath ships with zero reviews, because a review site that invents its own
// reviews is worthless. But an empty app is impossible to show anyone, so this
// file can fill it with clearly labelled examples: Profile -> "Show sample
// reviews". Every review built here carries `sample: true`, every screen marks
// it, and a banner stays up the whole time it is switched on.
//
// Scores are generated from a seeded PRNG, so the examples are identical on
// every reload. Notes describe the course, never a teacher.
// ---------------------------------------------------------------------------

const PROFILES = [
  {
    id: 'ap-united-states-history',
    n: 9,
    scores: { difficulty: 8.4, workload: 8.1, fun: 6.4, value: 8.3 },
    again: 0.78,
    spread: 1.5,
    hours: '3–5',
    tags: ['Heavy reading', 'Test heavy', 'Lots of writing', 'Fast pace'],
    notes: [
      'The reading never stops, but you come out of it able to write an essay about almost anything. Start the DBQ practice early.',
      'Hardest class I took junior year and I would still take it again. Just do not fall behind on the chapter notes, you never catch up.',
      'Content is genuinely interesting. The amount of memorization for the period exams is the part nobody warns you about.',
      '',
      'Take it with a free period after if you can.',
    ],
  },
  {
    id: 'ap-world-history',
    n: 6,
    scores: { difficulty: 7.2, workload: 6.8, fun: 6.6, value: 7.6 },
    again: 0.83,
    spread: 1.4,
    hours: '3–5',
    tags: ['Heavy reading', 'Lots of writing', 'Test heavy'],
    notes: [
      'Good first AP. The essay format is the whole class, once it clicks the rest is just knowing the timeline.',
      'A lot of dates. A lot. But the units move fast enough that you are never bored.',
      '',
    ],
  },
  {
    id: 'ap-biology',
    n: 7,
    scores: { difficulty: 8.6, workload: 7.4, fun: 6.8, value: 8.1 },
    again: 0.71,
    spread: 1.8,
    hours: '3–5',
    tags: ['Test heavy', 'Hands-on labs', 'Memorization heavy', 'Fast pace'],
    notes: [
      'The labs are the best part and the unit tests are the worst part. Both are true.',
      'You need Biology I or Chemistry in your head already, it moves assuming you do.',
      'Free response questions are nothing like the homework. Practice them separately or the exam will surprise you.',
      '',
    ],
  },
  {
    id: 'ap-chemistry',
    n: 5,
    scores: { difficulty: 9.1, workload: 8.4, fun: 5.6, value: 8.0 },
    again: 0.6,
    spread: 2.1,
    hours: '5+',
    tags: ['Problem sets', 'Test heavy', 'Easy to fall behind', 'Fast pace'],
    notes: [
      'Genuinely hard. Equilibrium and acids/bases were brutal and the pace does not wait for you.',
      'If you liked stoichiometry in Chemistry I you will be fine. If you survived it, think about it.',
      'Worth it for the problem solving, not for a GPA bump.',
    ],
  },
  {
    id: 'ap-calculus-ab',
    n: 8,
    scores: { difficulty: 7.8, workload: 6.6, fun: 6.9, value: 8.6 },
    again: 0.88,
    spread: 1.3,
    hours: '3–5',
    tags: ['Problem sets', 'Fast pace', 'Test heavy'],
    notes: [
      'Precalculus prepares you better than you expect. Do every problem on the review packets and the tests feel familiar.',
      'The best math class I have taken here. Everything from Algebra II finally has a point.',
      '',
      'Bring the graphing calculator every day, it is not optional.',
    ],
  },
  {
    id: 'ap-calculus-bc',
    n: 4,
    scores: { difficulty: 9.0, workload: 7.8, fun: 7.2, value: 9.0 },
    again: 0.75,
    spread: 1.7,
    hours: '5+',
    tags: ['Fast pace', 'Problem sets', 'Easy to fall behind'],
    notes: [
      'It is AB plus a semester, in the same year. Series at the end is a different kind of hard.',
      'Take it if you actually like math. It is not a resume class.',
      '',
    ],
  },
  {
    id: 'ap-statistics',
    n: 6,
    scores: { difficulty: 5.4, workload: 4.8, fun: 7.0, value: 8.1 },
    again: 0.92,
    spread: 1.2,
    hours: '1–3',
    tags: ['Problem sets', 'Lots of writing', 'Good for college apps'],
    notes: [
      'The most useful math class in the building. Half of it is explaining your answer in a sentence, which is also the part people lose points on.',
      'Much lighter than Calculus but you cannot skim the vocabulary.',
      '',
    ],
  },
  {
    id: 'ap-language-and-composition-ap-english-iii',
    n: 8,
    scores: { difficulty: 7.4, workload: 7.6, fun: 6.0, value: 8.4 },
    again: 0.8,
    spread: 1.6,
    hours: '3–5',
    tags: ['Lots of writing', 'Heavy reading', 'Fast pace'],
    notes: [
      'You will write more than in any class so far and it genuinely makes you better at it by spring.',
      'The timed writings are the whole grade basically. Practice writing fast, not writing perfectly.',
      'Rhetorical analysis feels impossible for about six weeks and then it clicks.',
      '',
      '',
    ],
  },
  {
    id: 'ap-english-literature-and-composition-ap-english-iv',
    n: 4,
    scores: { difficulty: 7.0, workload: 7.2, fun: 6.4, value: 7.8 },
    again: 0.75,
    spread: 1.5,
    hours: '3–5',
    tags: ['Heavy reading', 'Lots of writing'],
    notes: [
      'Two hours of reading a week is the real number in the catalog and they mean it.',
      'Poetry unit decides your grade. Do not sleep on it.',
    ],
  },
  {
    id: 'ap-human-geography',
    n: 7,
    scores: { difficulty: 4.6, workload: 4.2, fun: 7.2, value: 7.0 },
    again: 0.86,
    spread: 1.3,
    hours: '1–3',
    tags: ['Memorization heavy', 'Good for college apps'],
    notes: [
      'Best freshman AP. Light homework, interesting units, and the exam is very doable if you know the vocab.',
      'Mostly definitions and models. Make a quizlet in September and you are set.',
      '',
    ],
  },
  {
    id: 'ap-psychology',
    n: 6,
    scores: { difficulty: 4.8, workload: 4.0, fun: 8.2, value: 7.6 },
    again: 0.94,
    spread: 1.1,
    hours: '1–3',
    tags: ['Memorization heavy', 'Good for college apps'],
    notes: [
      'Easiest AP that still teaches you something real. The units are short and actually fun to study.',
      'A lot of terms, almost no math, no projects. Take it.',
      '',
    ],
  },
  {
    id: 'ap-computer-science-a',
    n: 5,
    scores: { difficulty: 6.8, workload: 5.8, fun: 8.0, value: 8.8 },
    again: 0.9,
    spread: 1.4,
    hours: '3–5',
    tags: ['Problem sets', 'Lots of projects', 'Good for college apps'],
    notes: [
      'If you have never written code you can still do this, it starts from nothing. The labs are the fun part.',
      'Arrays and recursion are where people drop off. Do the practice sets twice.',
      '',
    ],
  },
  {
    id: 'ap-physics-1',
    n: 5,
    scores: { difficulty: 8.2, workload: 7.0, fun: 6.6, value: 8.0 },
    again: 0.7,
    spread: 1.9,
    hours: '3–5',
    tags: ['Problem sets', 'Hands-on labs', 'Test heavy'],
    notes: [
      'Conceptual questions are harder than the math. You can do the algebra and still miss the point.',
      'Labs make the units stick. Tests are a step up from anything in Chemistry I.',
      '',
    ],
  },
  {
    id: 'biology-i',
    n: 6,
    scores: { difficulty: 4.4, workload: 4.0, fun: 6.2, value: 6.4 },
    again: 0.8,
    spread: 1.3,
    hours: '1–3',
    tags: ['Hands-on labs', 'Memorization heavy'],
    notes: [
      'Gentle intro, good labs. Genetics is the only unit that gets people.',
      'Do the vocab as you go instead of before the test and the whole year is easy.',
      '',
    ],
  },
  {
    id: 'chemistry-i-honors',
    n: 6,
    scores: { difficulty: 7.2, workload: 6.4, fun: 5.8, value: 7.4 },
    again: 0.76,
    spread: 1.6,
    hours: '3–5',
    tags: ['Problem sets', 'Fast pace', 'Easy to fall behind'],
    notes: [
      'This is the class where honors stops being free. Stoichiometry decides your semester.',
      'Keep up with the practice problems nightly. Cramming does not work in this one.',
      '',
    ],
  },
  {
    id: 'algebra-ii-honors',
    n: 7,
    scores: { difficulty: 7.0, workload: 6.2, fun: 4.8, value: 7.2 },
    again: 0.72,
    spread: 1.5,
    hours: '3–5',
    tags: ['Problem sets', 'Fast pace', 'Test heavy'],
    notes: [
      'The pace roughly doubles from Geometry. Logs were the unit that almost got me.',
      'Tests pull straight from the review packet. Do all of it.',
      '',
      '',
    ],
  },
  {
    id: 'geometry',
    n: 5,
    scores: { difficulty: 5.0, workload: 4.2, fun: 5.2, value: 5.8 },
    again: 0.7,
    spread: 1.6,
    hours: '1–3',
    tags: ['Problem sets'],
    notes: [
      'Proofs either click or they do not, and there is not much in between.',
      'Nice break between Algebra I and Algebra II. Circles unit is the hard one.',
      '',
    ],
  },
  {
    id: 'precalculus',
    n: 5,
    scores: { difficulty: 6.4, workload: 5.6, fun: 5.4, value: 7.4 },
    again: 0.78,
    spread: 1.4,
    hours: '1–3',
    tags: ['Problem sets', 'Test heavy'],
    notes: [
      'Trig identities are the whole fall. Once you memorize them the rest of the year is calmer.',
      'Sets you up well for Calculus, which is the point of it.',
      '',
    ],
  },
  {
    id: 'english-ii-honors',
    n: 5,
    scores: { difficulty: 6.0, workload: 6.2, fun: 5.6, value: 7.0 },
    again: 0.78,
    spread: 1.4,
    hours: '1–3',
    tags: ['Heavy reading', 'Lots of writing'],
    notes: [
      'Good prep for AP Lang. The essay feedback cycle is where the class earns its keep.',
      'More reading than English I by a lot, but the books are better.',
      '',
    ],
  },
  {
    id: 'spanish-iii-honors',
    n: 4,
    scores: { difficulty: 6.6, workload: 5.4, fun: 6.8, value: 7.6 },
    again: 0.82,
    spread: 1.3,
    hours: '1–3',
    tags: ['Memorization heavy', 'Group work'],
    notes: [
      'Mostly in Spanish from day one, which is uncomfortable for a month and then fine.',
      'Subjunctive. That is the whole year in one word.',
    ],
  },
  {
    id: 'business-incubator',
    n: 6,
    scores: { difficulty: 5.2, workload: 5.0, fun: 8.8, value: 8.6 },
    again: 0.95,
    spread: 1.1,
    hours: '1–3',
    tags: ['Lots of projects', 'Group work', 'Creative freedom', 'Good for college apps'],
    notes: [
      'You build an actual business and pitch it. Nothing else in the building is like it.',
      'The work is real but it never feels like homework. Pick your team carefully.',
      'Best class I have taken. Also the one I talked about most in interviews.',
      '',
    ],
  },
  {
    id: 'theatre-arts-i',
    n: 4,
    scores: { difficulty: 2.8, workload: 2.4, fun: 8.6, value: 6.2 },
    again: 0.88,
    spread: 1.2,
    hours: '<1',
    tags: ['Group work', 'Creative freedom'],
    notes: [
      'Easy credit and genuinely a good hour of your day. You do have to perform in front of people.',
      'Zero homework, lots of improv.',
      '',
    ],
  },
  {
    id: 'art-i-foundations-of-art-with-emphasis-on-painting-and-drawing',
    n: 5,
    scores: { difficulty: 3.6, workload: 3.4, fun: 8.0, value: 6.8 },
    again: 0.86,
    spread: 1.2,
    hours: '1–3',
    tags: ['Lots of projects', 'Creative freedom'],
    notes: [
      'You do not need to be good at drawing already. Projects take longer at home than you plan for.',
      'Relaxing class with real skills at the end of it.',
      '',
    ],
  },
  {
    id: 'debate-i',
    n: 4,
    scores: { difficulty: 5.6, workload: 5.8, fun: 7.8, value: 8.4 },
    again: 0.85,
    spread: 1.3,
    hours: '3–5',
    tags: ['Lots of writing', 'Good for college apps', 'Fast pace'],
    notes: [
      'The tournaments are the class, and they are weekends. Know that going in.',
      'Made me a better writer and speaker than any English class did.',
      '',
    ],
  },
  {
    id: 'ap-environmental-science',
    n: 4,
    scores: { difficulty: 5.0, workload: 4.4, fun: 6.8, value: 6.6 },
    again: 0.8,
    spread: 1.4,
    hours: '1–3',
    tags: ['Memorization heavy', 'Hands-on labs'],
    notes: [
      'Lightest AP science by far. A lot of vocabulary and a few calculations.',
      'The field labs are great. The exam is mostly definitions.',
    ],
  },
  {
    id: 'economics',
    n: 3,
    scores: { difficulty: 3.4, workload: 3.0, fun: 5.4, value: 6.4 },
    again: 0.67,
    spread: 1.5,
    hours: '<1',
    tags: ['Memorization heavy'],
    notes: [
      'Semester class, fairly light. Useful for the personal finance half.',
      '',
    ],
  },
  {
    id: 'anatomy-and-physiology-honors',
    n: 5,
    scores: { difficulty: 7.0, workload: 6.0, fun: 7.8, value: 8.2 },
    again: 0.88,
    spread: 1.3,
    hours: '3–5',
    tags: ['Memorization heavy', 'Hands-on labs', 'Good for college apps'],
    notes: [
      'A huge amount of memorization and worth every minute if you want to do anything medical.',
      'The dissections are the reason to take it.',
      '',
    ],
  },
  {
    id: 'video-game-design',
    n: 3,
    scores: { difficulty: 4.2, workload: 3.8, fun: 8.4, value: 6.8 },
    again: 0.9,
    spread: 1.2,
    hours: '1–3',
    tags: ['Lots of projects', 'Creative freedom'],
    notes: [
      'You ship small games all year. Fun elective, light workload, good portfolio piece.',
      '',
    ],
  },
  {
    id: 'ap-united-states-government',
    n: 4,
    scores: { difficulty: 5.2, workload: 4.6, fun: 6.6, value: 7.4 },
    again: 0.82,
    spread: 1.3,
    hours: '1–3',
    tags: ['Heavy reading', 'Memorization heavy'],
    notes: [
      'One semester, so it moves. The court cases are most of the exam.',
      '',
    ],
  },
  {
    id: 'latin-i',
    n: 2,
    scores: { difficulty: 5.8, workload: 5.0, fun: 6.4, value: 6.6 },
    again: 0.5,
    spread: 1.6,
    hours: '1–3',
    tags: ['Memorization heavy'],
    notes: [
      'No speaking, all grammar and translation. If that sounds good to you it is a great class.',
      'Helped my English vocabulary more than I expected.',
    ],
  },
  {
    id: 'astronomy',
    n: 2,
    scores: { difficulty: 3.2, workload: 2.8, fun: 7.4, value: 5.8 },
    again: 0.5,
    spread: 1.3,
    hours: '<1',
    tags: ['Memorization heavy'],
    notes: ['Easy science credit and the night observations are fun.', ''],
  },
]

// A tiny seeded PRNG so the examples never shuffle between reloads.
function mulberry32(seed) {
  return function next() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function clamp10(n) {
  return Math.max(1, Math.min(10, Math.round(n)))
}

const YEARS = ['2025–26', '2024–25', '2023–24']
const BASE_TIME = Date.parse('2026-09-01T12:00:00Z')

/** Build the labelled example reviews. Same output every time. */
export function buildSampleReviews(schoolId = 'westlake') {
  const out = []
  for (const p of PROFILES) {
    const rand = mulberry32(hash(p.id))
    for (let i = 0; i < p.n; i += 1) {
      const scores = {}
      for (const [key, center] of Object.entries(p.scores)) {
        const jitter = (rand() + rand() - 1) * (p.spread || 1.4)
        scores[key] = clamp10(center + jitter)
      }
      const tags = p.tags.filter(() => rand() < 0.55)
      if (!tags.length && p.tags.length) tags.push(p.tags[Math.floor(rand() * p.tags.length)])
      out.push({
        id: `sample-${p.id}-${i}`,
        schoolId,
        courseId: p.id,
        scores,
        takeAgain: rand() < p.again,
        hours: p.hours,
        tags,
        note: (p.notes[i] || '').trim(),
        gradeTaken: 9 + Math.floor(rand() * 4),
        year: YEARS[Math.floor(rand() * YEARS.length)],
        anon: true,
        author: null,
        sample: true,
        createdAt: BASE_TIME - i * 86400000 - Math.floor(rand() * 86400000),
      })
    }
  }
  return out
}

export const SAMPLE_COURSE_COUNT = PROFILES.length
