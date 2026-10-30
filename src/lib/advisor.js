// ---------------------------------------------------------------------------
// The schedule engine.
//
// Given what a student wants, this picks real courses out of the real catalog
// and lays them across four years. It is deterministic on purpose: it cannot
// invent a course that does not exist, cannot put AP Calculus before Algebra
// II, and cannot forget the half credit of Health you need to graduate. Every
// pick carries the reason it was picked, because advice you cannot interrogate
// is not advice.
//
// Review scores feed straight in: "low workload" means the homework average
// students actually reported, not a guess from the course title.
// ---------------------------------------------------------------------------

import { COURSES, COURSE_MAP } from '../data/courses'
import { REQUIREMENTS, bucketFor, tallyCredits } from '../data/graduation'
import { GOAL_MAP, INTEREST_MAP, RIGOR_MAP } from '../data/pathways'
import { CORE, LANGUAGE_FAMILIES, MATH_LADDER } from '../data/sequences'
import { MIN_REVIEWS } from './metrics'
import { buildNameIndex, coursesNamedIn, creditsOf, prereqSatisfiedBy } from './plan'
import { PLAN_GRADES } from './store'

// A full year at Westlake is 7 periods; 6.5 credits leaves room for a free
// period or a half credit course without overfilling the year.
const CREDITS_PER_YEAR = 6.5
const MAX_PER_YEAR = 8

// Courses nobody is picking off a recommendation screen.
const EXCLUDED_DEPTS = new Set(['Special Education'])
const EXCLUDED_GROUPS = new Set(['Athletics'])

function selectable(course) {
  if (EXCLUDED_DEPTS.has(course.dept)) return false
  if (EXCLUDED_GROUPS.has(course.group)) return false
  if (course.level === 'Modified' || course.level === 'Alternate') return false
  if (/excused period|office aide|peer partners/i.test(course.name)) return false
  return true
}

const AP_LEVELS = new Set(['AP', 'Post AP', 'Dual credit'])

/** What the reviews say, or null where too few students have spoken. */
function reviewView(stats) {
  if (!stats || !stats.hasEnough) return null
  return {
    difficulty: stats.averages.difficulty,
    workload: stats.averages.workload,
    fun: stats.averages.fun,
    value: stats.averages.value,
    takeAgain: stats.takeAgain,
    count: stats.count,
  }
}

/** Difficulty guess for a course nobody has reviewed, from its level. */
function assumedDifficulty(course) {
  if (AP_LEVELS.has(course.level)) return 8
  if (course.level === 'Honors') return 6.5
  return 4.5
}

/**
 * Score one course against what the student asked for.
 * Returns { score, reasons } — reasons are shown to the student verbatim.
 */
export function scoreCourse(course, prefs, stats, context) {
  const reasons = []
  let score = 0

  const rv = reviewView(stats)
  const rigor = RIGOR_MAP[prefs.rigor] || RIGOR_MAP.balanced
  const goal = GOAL_MAP[prefs.goal]

  // --- what they are aiming at -------------------------------------------
  if (goal) {
    if (goal.seeds.includes(course.id)) {
      score += 55
      reasons.push(`A core ${goal.label.toLowerCase()} course`)
    } else if (goal.groups?.includes(course.group)) {
      score += 26
      reasons.push(`${course.group} lines up with ${goal.label.toLowerCase()}`)
    } else if (goal.depts.includes(course.dept)) {
      score += 16
      reasons.push(`${course.dept} supports ${goal.label.toLowerCase()}`)
    }
  }

  // --- what they like ------------------------------------------------------
  for (const id of prefs.interests || []) {
    const interest = INTEREST_MAP[id]
    if (!interest) continue
    if (interest.groups?.includes(course.group) || interest.depts.includes(course.dept)) {
      score += 18
      reasons.push(`You said you like ${interest.label.toLowerCase()}`)
      break
    }
  }

  // --- how hard they want it ----------------------------------------------
  const difficulty = rv ? rv.difficulty : assumedDifficulty(course)
  if (prefs.rigor === 'challenge' && AP_LEVELS.has(course.level)) {
    score += 22
    reasons.push('AP, which is the rigor you asked for')
  }
  if (prefs.rigor === 'light') {
    if (AP_LEVELS.has(course.level)) score -= 30
    if (difficulty <= 5) {
      score += 18
      reasons.push(rv ? `Students rate it ${difficulty.toFixed(1)}/10 for difficulty` : 'On-level pace')
    }
  }
  if (difficulty > rigor.maxDifficulty) {
    score -= (difficulty - rigor.maxDifficulty) * 14
  }

  // --- workload ------------------------------------------------------------
  if (prefs.lowWork) {
    if (rv) {
      if (rv.workload <= 5) {
        score += 30
        reasons.push(`Only ${rv.workload.toFixed(1)}/10 homework from ${rv.count} reviews`)
      } else if (rv.workload > rigor.maxWorkload) {
        score -= (rv.workload - rigor.maxWorkload) * 16
      }
    } else if (!AP_LEVELS.has(course.level)) {
      score += 6
    }
  }

  // --- what students actually thought -------------------------------------
  if (rv) {
    score += (rv.takeAgain - 0.5) * 36
    score += (rv.fun - 5) * 2.4
    score += (rv.value - 5) * 2.4
    if (rv.takeAgain >= 0.85) reasons.push(`${Math.round(rv.takeAgain * 100)}% would take it again`)
    else if (rv.takeAgain <= 0.4) reasons.push(`Only ${Math.round(rv.takeAgain * 100)}% would retake it`)
    if (rv.fun >= 8) reasons.push(`Rated ${rv.fun.toFixed(1)}/10 for fun`)
  }

  // --- graduation --------------------------------------------------------
  const bucket = bucketFor(course)
  const need = context?.needed?.[bucket]
  if (need > 0) {
    score += Math.min(44, 14 + need * 8)
    const label = REQUIREMENTS.find((r) => r.key === bucket)?.label || bucket
    reasons.push(`You still need ${fmtCredits(need)} of ${label}`)
  } else if (bucket === 'elective') {
    score += 2
  } else {
    score -= 6
  }

  if (course.fee) score -= 3

  return { score, reasons: reasons.slice(0, 3), difficulty, review: rv }
}

function fmtCredits(n) {
  return Number.isInteger(n) ? `${n} credit${n === 1 ? '' : 's'}` : `${String(n).replace(/^0/, '')} credits`
}

/** Is this course's prerequisite satisfied by something in an earlier year? */
function prereqMet(course, grade, placed, index, opts = {}) {
  const result = prereqSatisfiedBy(course, grade, (id) => placed.get(id) ?? null, index, COURSE_MAP)
  if (result.ok) return result

  // Core sequences only: any earlier course in the same subject counts. This
  // is how Dual Credit English leads into AP English Literature, which no
  // amount of string matching on the catalog's prose would work out.
  if (opts.sameBucketCounts) {
    const bucket = bucketFor(course)
    for (const [id, g] of placed) {
      if (g < grade && COURSE_MAP[id] && bucketFor(COURSE_MAP[id]) === bucket) {
        return { ok: true, relaxed: true }
      }
    }
  }
  return result
}

function gradeOk(course, grade) {
  return !course.grades?.length || course.grades.includes(grade)
}

/**
 * Build a four year plan.
 *
 * Keeps anything already in the student's plan, fills the rest. Walks the
 * years in order so a prerequisite taken in 9th can unlock a course in 10th.
 */
export function buildPlan(prefs, { statsByCourse, existingPlan, startGrade = 9 }) {
  const index = buildNameIndex(COURSES)
  const rigor = RIGOR_MAP[prefs.rigor] || RIGOR_MAP.balanced

  const placed = new Map()
  const years = {}
  for (const g of PLAN_GRADES) {
    years[g] = []
    for (const id of existingPlan?.[g] || []) {
      if (COURSE_MAP[id]) {
        years[g].push(COURSE_MAP[id])
        placed.set(id, g)
      }
    }
  }

  const added = []
  const editable = PLAN_GRADES.filter((g) => g >= startGrade)

  const creditsIn = (g) => years[g].reduce((n, c) => n + creditsOf(c), 0)
  const hasRoom = (g) => creditsIn(g) < CREDITS_PER_YEAR && years[g].length < MAX_PER_YEAR
  const apIn = (g) => years[g].filter((c) => AP_LEVELS.has(c.level)).length

  const place = (course, grade, why) => {
    years[grade].push(course)
    placed.set(course.id, grade)
    added.push({ grade, course, reasons: [why], review: reviewView(statsByCourse[course.id]) })
  }

  /** Of these candidates, the one this student should take. */
  const pickBest = (candidates, grade, relax = false) => {
    let best = null
    for (const course of candidates) {
      if (!course || placed.has(course.id) || !selectable(course)) continue
      if (!gradeOk(course, grade)) continue
      if (!prereqMet(course, grade, placed, index, { sameBucketCounts: relax }).ok) continue
      let s = 0
      // A course the catalog opens to one grade is that grade's course;
      // one open to 10-12 is an elective that happens to fit.
      if (course.grades?.length) s += (5 - course.grades.length) * 9
      // The spine wants full credits, not half-credit fillers.
      s += creditsOf(course) * 10
      const isAP = AP_LEVELS.has(course.level)
      if (prefs.rigor === 'challenge') s += isAP ? 40 : course.level === 'Honors' ? 22 : 0
      if (prefs.rigor === 'balanced') s += isAP ? 10 : course.level === 'Honors' ? 18 : 6
      if (prefs.rigor === 'light') s += isAP ? -30 : course.level === 'Honors' ? -8 : 20
      if (isAP && apIn(grade) >= (rigor.apTarget[grade] ?? 2)) s -= 34
      const rv = reviewView(statsByCourse[course.id])
      if (rv) {
        s += (rv.takeAgain - 0.5) * 20
        if (prefs.lowWork) s += (6 - rv.workload) * 5
        s += (rv.fun - 5) * 1.5
      }
      for (const id of prefs.interests || []) {
        const it = INTEREST_MAP[id]
        if (it && (it.groups?.includes(course.group) || it.depts.includes(course.dept))) s += 10
      }
      const goal = GOAL_MAP[prefs.goal]
      if (goal?.seeds.includes(course.id)) s += 30
      if (s > (best?.s ?? -Infinity)) best = { course, s }
    }
    return best?.course || null
  }

  // ---------------------------------------------------------------- phase 1
  // The required core, placed before anything competes for the slot.
  for (const req of CORE) {
    if (req.pick === 'byGrade' || req.pick === 'anyGrade') {
      const pool = COURSES.filter(
        (c) => selectable(c) && (req.group ? c.group === req.group : c.dept === req.dept)
      )
      if (req.pick === 'byGrade') {
        for (const grade of editable) {
          if (!(req.perGrade?.[grade] > 0)) continue
          if (years[grade].some((c) => bucketFor(c) === req.bucket)) continue
          if (!hasRoom(grade)) continue
          const chosen = pickBest(pool, grade, req.relaxPrereq)
          if (chosen) place(chosen, grade, `${req.label}: required every year`)
        }
      } else {
        const have = PLAN_GRADES.flatMap((g) => years[g])
          .filter((c) => bucketFor(c) === req.bucket)
          .reduce((n, c) => n + creditsOf(c), 0)
        if (have < (req.credits || 1)) {
          for (const grade of editable) {
            if (!hasRoom(grade)) continue
            const chosen = pickBest(pool, grade, req.relaxPrereq)
            if (chosen) {
              place(chosen, grade, `${req.label}: ${fmtCredits(req.credits)} to graduate`)
              break
            }
          }
        }
      }
    }

    if (req.pick === 'ladder') {
      // Walk the maths ladder one rung a year, starting past anything already
      // in the plan.
      let rung = 0
      const taken = new Set([...placed.keys()])
      while (rung < MATH_LADDER.length && MATH_LADDER[rung].options.some((id) => taken.has(id))) rung += 1
      for (const grade of editable) {
        if (years[grade].some((c) => bucketFor(c) === 'math')) continue
        if (!hasRoom(grade) || rung >= MATH_LADDER.length) continue
        const chosen = pickBest(
          MATH_LADDER[rung].options.map((id) => COURSE_MAP[id]),
          grade
        )
        if (chosen) {
          place(chosen, grade, `Maths sequence: ${MATH_LADDER[rung].tier}`)
          rung += 1
        }
      }
    }

    if (req.pick === 'language') {
      const have = PLAN_GRADES.flatMap((g) => years[g]).filter((c) => bucketFor(c) === 'language')
      let need = (req.credits || 2) - have.reduce((n, c) => n + creditsOf(c), 0)
      if (need > 0) {
        const started = Object.entries(LANGUAGE_FAMILIES).find(([, ids]) =>
          have.some((c) => ids.includes(c.id))
        )
        const family =
          started?.[0] ||
          (prefs.language && LANGUAGE_FAMILIES[prefs.language] ? prefs.language : 'Spanish')
        const ladder = (LANGUAGE_FAMILIES[family] || []).map((id) => COURSE_MAP[id]).filter(Boolean)
        // Walk it in order: Spanish I, then Spanish II. Never I then III.
        let rung = 0
        while (rung < ladder.length && placed.has(ladder[rung].id)) rung += 1
        for (const grade of editable) {
          if (need <= 0 || rung >= ladder.length) break
          if (!hasRoom(grade)) continue
          const course = ladder[rung]
          if (placed.has(course.id) || !gradeOk(course, grade)) continue
          if (!prereqMet(course, grade, placed, index).ok) continue
          place(course, grade, `World Language: 2 credits in ${family}`)
          need -= creditsOf(course)
          rung += 1
        }
      }
    }

    if (req.pick === 'fromList') {
      const have = PLAN_GRADES.flatMap((g) => years[g])
        .filter((c) => bucketFor(c) === req.bucket)
        .reduce((n, c) => n + creditsOf(c), 0)
      if (have < (req.credits || 1)) {
        for (const grade of editable) {
          if (!hasRoom(grade)) continue
          const chosen = pickBest(
            req.options.map((id) => COURSE_MAP[id]),
            grade
          )
          if (chosen) {
            place(chosen, grade, `${req.label}: ${fmtCredits(req.credits)} to graduate`)
            break
          }
        }
      }
    }
  }

  // Some requirements need more than one course in a year: senior Social
  // Studies is half a credit of Government plus half of Economics.
  for (const req of CORE) {
    if (req.pick !== 'byGrade') continue
    const target = Object.values(req.perGrade || {}).reduce((a, b) => a + b, 0)
    let have = PLAN_GRADES.flatMap((g) => years[g])
      .filter((c) => bucketFor(c) === req.bucket)
      .reduce((n, c) => n + creditsOf(c), 0)
    if (have >= target) continue
    const pool = COURSES.filter(
      (c) => selectable(c) && (req.group ? c.group === req.group : c.dept === req.dept)
    )
    let guard = 0
    while (have < target && guard++ < 6) {
      let done = false
      for (const grade of [...editable].reverse()) {
        if (!hasRoom(grade)) continue
        const chosen = pickBest(pool, grade, req.relaxPrereq)
        if (chosen) {
          place(chosen, grade, `${req.label}: still ${fmtCredits(target - have)} short`)
          have += creditsOf(chosen)
          done = true
          break
        }
      }
      if (!done) break
    }
  }

  // ---------------------------------------------------------------- phase 2
  // Electives fill whatever room is left, by what the student asked for.
  const pool = COURSES.filter(selectable)
  for (const grade of editable) {
    let guard = 0
    while (hasRoom(grade) && guard++ < 30) {
      const sofar = PLAN_GRADES.flatMap((g) => years[g])
      const tally = tallyCredits(sofar)
      const needed = {}
      for (const r of REQUIREMENTS) needed[r.key] = Math.max(0, r.credits - (tally.byBucket[r.key] || 0))

      let best = null
      for (const course of pool) {
        if (placed.has(course.id)) continue
        if (!gradeOk(course, grade)) continue
        const pre = prereqMet(course, grade, placed, index)
        if (!pre.ok) continue
        if (AP_LEVELS.has(course.level) && apIn(grade) >= (rigor.apTarget[grade] ?? 2)) continue
        const { score, reasons, review } = scoreCourse(course, prefs, statsByCourse[course.id], { needed })
        if (score > (best?.score ?? -Infinity)) best = { course, score, reasons, review }
      }
      if (!best || best.score < -30) break
      years[grade].push(best.course)
      placed.set(best.course.id, grade)
      added.push({ grade, course: best.course, reasons: best.reasons, review: best.review })
    }
  }

  const all = PLAN_GRADES.flatMap((g) => years[g])
  const tally = tallyCredits(all)
  const gaps = REQUIREMENTS.filter((r) => (tally.byBucket[r.key] || 0) < r.credits).map((r) => ({
    label: r.label,
    short: Math.round((r.credits - (tally.byBucket[r.key] || 0)) * 10) / 10,
  }))

  return {
    years: Object.fromEntries(PLAN_GRADES.map((g) => [g, years[g].map((c) => c.id)])),
    added,
    tally,
    gaps,
    kept: all.length - added.length,
  }
}

/**
 * Rank courses for a one-off question ("easiest science", "most fun elective").
 */
export function rankCourses(prefs, { statsByCourse, filter, limit = 6, context = {} }) {
  const scored = []
  for (const course of COURSES) {
    if (!selectable(course)) continue
    if (filter && !filter(course, statsByCourse[course.id])) continue
    const { score, reasons, review, difficulty } = scoreCourse(
      course,
      prefs,
      statsByCourse[course.id],
      context
    )
    scored.push({ course, score, reasons, review, difficulty })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

/** Courses a student is eligible for right now, given what they have taken. */
export function eligibleNow(grade, planIds) {
  const index = buildNameIndex(COURSES)
  const placed = new Map()
  for (const g of PLAN_GRADES) {
    for (const id of planIds?.[g] || []) placed.set(id, g)
  }
  return COURSES.filter(
    (c) => selectable(c) && gradeOk(c, grade) && !placed.has(c.id) && prereqMet(c, grade, placed, index).ok
  )
}

export { MIN_REVIEWS, selectable, AP_LEVELS, reviewView }
