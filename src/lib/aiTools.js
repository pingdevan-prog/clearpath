// ---------------------------------------------------------------------------
// What the advisor can actually do.
//
// The model never answers from memory about this school. Every fact it states
// has to come back from one of these tools, which read the real catalog, the
// real reviews and the student's real plan. That is the whole safety story: a
// model cannot hallucinate a course that does not exist if the only way it can
// name one is to look it up.
//
// These run in the BROWSER, not in the worker — the catalog and the student's
// plan live here, and nothing about them needs to leave the device.
// ---------------------------------------------------------------------------

import { COURSES, COURSE_MAP } from '../data/courses'
import { REQUIREMENTS, tallyCredits } from '../data/graduation'
import { GOALS, INTERESTS, RIGOR } from '../data/pathways'
import { buildPlan, rankCourses } from './advisor'
import { baseNames, buildNameIndex, coursesNamedIn, creditsOf } from './plan'
import { MIN_REVIEWS } from './metrics'
import { PLAN_GRADES } from './store'

/** Everything the model is allowed to ask for. */
export const TOOLS = [
  {
    name: 'search_courses',
    description:
      'Search the course catalog. Use this whenever the student mentions a subject, a department, or a kind of class. Returns matching courses with their level, grades, credits, prerequisites and review scores.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to match in the course name or description' },
        dept: {
          type: 'string',
          description: 'Limit to one department',
          enum: [
            'Language Arts',
            'Mathematics',
            'Science',
            'Social Studies',
            'World Languages',
            'Fine Arts',
            'Technology & Career Education',
            'Health and PE',
            'Miscellaneous Electives',
          ],
        },
        level: { type: 'string', enum: ['AP', 'Honors', 'On-level', 'Dual credit', 'Post AP'] },
        grade: { type: 'integer', description: 'Only courses open to this grade', minimum: 9, maximum: 12 },
        max_difficulty: { type: 'number', description: 'Only courses students rate at or below this difficulty, 1-10' },
        max_workload: { type: 'number', description: 'Only courses at or below this homework score, 1-10' },
        limit: { type: 'integer', description: 'How many to return, default 10', minimum: 1, maximum: 25 },
      },
      additionalProperties: false,
    },
    strict: false,
  },
  {
    name: 'get_course',
    description:
      'Everything about one course: full description, prerequisites, credits, grades, and the full review breakdown. Call this before saying anything specific about a class.',
    input_schema: {
      type: 'object',
      properties: { course_id: { type: 'string' }, course_name: { type: 'string' } },
      additionalProperties: false,
    },
  },
  {
    name: 'get_my_plan',
    description:
      "The student's current four year plan, their grade and role, credits so far, and which graduation requirements are still short. Call this before giving any advice that depends on what they have already chosen.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'build_schedule',
    description:
      'Build a complete four year plan. Fills every graduation requirement first, respects every prerequisite, then uses the preferences given. Returns the plan with a reason for each course. Use this when the student wants a schedule built rather than a single recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        goal: { type: 'string', enum: GOALS.map((g) => g.id), description: 'What they want to study' },
        rigor: { type: 'string', enum: RIGOR.map((r) => r.id), description: 'challenge, balanced or light' },
        interests: { type: 'array', items: { type: 'string', enum: INTERESTS.map((i) => i.id) } },
        low_work: { type: 'boolean', description: 'Prefer courses students rate low on homework' },
        language: { type: 'string', description: 'Which world language, e.g. Spanish' },
        keep_existing: { type: 'boolean', description: 'Keep what is already in their plan, default true' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'rank_courses',
    description:
      'Rank courses by what students reported: easiest, hardest, least homework, most fun, most recommended. Only includes courses with enough reviews to have scores.',
    input_schema: {
      type: 'object',
      properties: {
        by: { type: 'string', enum: ['easiest', 'hardest', 'least_homework', 'most_fun', 'most_recommended'] },
        dept: { type: 'string' },
        grade: { type: 'integer', minimum: 9, maximum: 12 },
        limit: { type: 'integer', minimum: 1, maximum: 15 },
      },
      required: ['by'],
      additionalProperties: false,
    },
  },
  {
    name: 'check_prerequisites',
    description:
      'What a course requires, and whether the student is on track for it given their plan. Also returns what the course itself unlocks.',
    input_schema: {
      type: 'object',
      properties: { course_id: { type: 'string' }, course_name: { type: 'string' } },
      additionalProperties: false,
    },
  },
]

// ----------------------------------- helpers -----------------------------------

const norm = (s) =>
  (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

function resolveCourse({ course_id, course_name }) {
  if (course_id && COURSE_MAP[course_id]) return COURSE_MAP[course_id]
  const want = norm(course_name || course_id)
  if (!want) return null
  let best = null
  for (const c of COURSES) {
    const n = norm(c.name)
    if (n === want) return c
    if ((n.includes(want) || want.includes(n)) && n.length >= 4) {
      if (!best || Math.abs(n.length - want.length) < Math.abs(norm(best.name).length - want.length)) best = c
    }
  }
  return best
}

function reviewSummary(stats) {
  if (!stats || !stats.count) return { reviews: 0, note: 'No reviews yet' }
  if (!stats.hasEnough) {
    return { reviews: stats.count, note: `Only ${stats.count} of ${MIN_REVIEWS} reviews, scores hidden` }
  }
  const a = stats.averages
  return {
    reviews: stats.count,
    would_take_again_pct: Math.round(stats.takeAgain * 100),
    difficulty: round(a.difficulty),
    homework: round(a.workload),
    fun: round(a.fun),
    worth_it: round(a.value),
    typical_hours_per_week: stats.hoursMode,
    tagged: stats.tags.slice(0, 3).map((t) => t.tag),
  }
}

const round = (n) => (typeof n === 'number' ? Math.round(n * 10) / 10 : null)

function brief(course, stats) {
  return {
    id: course.id,
    name: course.name,
    dept: course.dept,
    group: course.group || null,
    level: course.level,
    grades: course.grades.length ? course.grades : 'not listed',
    credits: creditsOf(course),
    prerequisite: course.prereq || 'not listed',
    fee: !!course.fee,
    reviews: reviewSummary(stats),
  }
}

// ----------------------------------- runner -----------------------------------

/**
 * Run one tool call. `ctx` carries the live app state: review stats, the
 * student's plan and their profile.
 */
export function runTool(name, input, ctx) {
  const { statsByCourse, plan, profile } = ctx

  switch (name) {
    case 'search_courses': {
      const q = norm(input.query)
      let list = COURSES.filter((c) => {
        if (input.dept && c.dept !== input.dept) return false
        if (input.level && c.level !== input.level) return false
        if (input.grade && c.grades.length && !c.grades.includes(input.grade)) return false
        const s = statsByCourse[c.id]
        if (input.max_difficulty != null) {
          if (!s?.hasEnough || s.averages.difficulty > input.max_difficulty) return false
        }
        if (input.max_workload != null) {
          if (!s?.hasEnough || s.averages.workload > input.max_workload) return false
        }
        if (!q) return true
        return (
          norm(c.name).includes(q) ||
          norm(c.group || '').includes(q) ||
          norm(c.dept).includes(q) ||
          norm(c.summary).includes(q)
        )
      })
      const limit = Math.min(input.limit || 10, 25)
      const filteredOnReviews = input.max_difficulty != null || input.max_workload != null
      return {
        found: list.length,
        showing: Math.min(list.length, limit),
        courses: list.slice(0, limit).map((c) => brief(c, statsByCourse[c.id])),
        ...(filteredOnReviews
          ? {
              note: `A difficulty or homework filter only matches courses with at least ${MIN_REVIEWS} reviews, so unreviewed courses are excluded. Search again without the filter if that looks too thin, and say which ones have no scores yet.`,
            }
          : {}),
      }
    }

    case 'get_course': {
      const course = resolveCourse(input)
      if (!course) return { error: 'No course in this catalog matches that. Try search_courses.' }
      return {
        ...brief(course, statsByCourse[course.id]),
        description: course.summary || 'The catalog publishes no description for this course.',
        note: course.note || null,
        also_counts_in: course.alsoIn || [],
      }
    }

    case 'get_my_plan': {
      const courses = PLAN_GRADES.flatMap((g) =>
        (plan?.[g] || []).map((id) => COURSE_MAP[id]).filter(Boolean)
      )
      const tally = tallyCredits(courses)
      const byYear = {}
      for (const g of PLAN_GRADES) {
        byYear[`grade_${g}`] = (plan?.[g] || [])
          .map((id) => COURSE_MAP[id])
          .filter(Boolean)
          .map((c) => ({ id: c.id, name: c.name, level: c.level, credits: creditsOf(c) }))
      }
      return {
        student: {
          name: profile?.name || null,
          role: profile?.role || null,
          grade: profile?.grade || null,
        },
        plan: byYear,
        credits_planned: tally.total,
        credits_required: 26,
        still_short: REQUIREMENTS.filter((r) => (tally.byBucket[r.key] || 0) < r.credits).map((r) => ({
          requirement: r.label,
          have: tally.byBucket[r.key] || 0,
          need: r.credits,
        })),
      }
    }

    case 'build_schedule': {
      const prefs = {
        goal: input.goal || 'undecided',
        rigor: input.rigor || 'balanced',
        interests: input.interests || [],
        lowWork: !!input.low_work,
        language: input.language,
      }
      const existing = input.keep_existing === false ? { 9: [], 10: [], 11: [], 12: [] } : plan
      const result = buildPlan(prefs, { statsByCourse, existingPlan: existing })
      return {
        proposed_plan: Object.fromEntries(
          PLAN_GRADES.map((g) => [
            `grade_${g}`,
            result.years[g].map((id) => {
              const c = COURSE_MAP[id]
              const why = result.added.find((a) => a.course.id === id)?.reasons?.[0]
              return { id, name: c.name, level: c.level, credits: creditsOf(c), why: why || 'Already in your plan' }
            }),
          ])
        ),
        total_credits: result.tally.total,
        requirements_still_short: result.gaps.map((g) => `${g.label} (${g.short})`),
        kept_from_existing: result.kept,
        added: result.added.length,
        // The UI renders an "Use this plan" button from this.
        _render: { type: 'plan', plan: result },
      }
    }

    case 'rank_courses': {
      const by = input.by
      const list = rankCourses(
        { rigor: 'balanced', interests: [], goal: 'undecided' },
        {
          statsByCourse,
          filter: (c, s) => {
            if (input.dept && c.dept !== input.dept) return false
            if (input.grade && c.grades.length && !c.grades.includes(input.grade)) return false
            return s?.hasEnough
          },
          limit: 60,
        }
      )
      const key = {
        easiest: (r) => r.review.difficulty,
        hardest: (r) => -r.review.difficulty,
        least_homework: (r) => r.review.workload,
        most_fun: (r) => -r.review.fun,
        most_recommended: (r) => -r.review.takeAgain,
      }[by]
      list.sort((a, b) => key(a) - key(b))
      const limit = Math.min(input.limit || 6, 15)
      if (!list.length) {
        return {
          courses: [],
          note: `No course matching that has ${MIN_REVIEWS} reviews yet, so there is nothing to rank. Say so rather than guessing.`,
        }
      }
      return { ranked_by: by, courses: list.slice(0, limit).map((r) => brief(r.course, statsByCourse[r.course.id])) }
    }

    case 'check_prerequisites': {
      const course = resolveCourse(input)
      if (!course) return { error: 'No course in this catalog matches that.' }
      const index = buildNameIndex(COURSES)
      const needs = coursesNamedIn(course.prereq, index)
      // Same name matching the planner uses: English I Honors satisfies a
      // prerequisite naming English I.
      const at = {}
      const planAliases = new Map()
      for (const g of PLAN_GRADES) {
        for (const id of plan?.[g] || []) {
          at[id] = g
          const c = COURSE_MAP[id]
          if (c) for (const alias of baseNames(c.name)) planAliases.set(alias, g)
        }
      }
      const whereIs = (n) => {
        if (at[n.id]) return `grade ${at[n.id]}`
        for (const alias of baseNames(n.name)) {
          if (planAliases.has(alias)) return `grade ${planAliases.get(alias)}`
        }
        return 'not in your plan'
      }
      const unlocks = COURSES.filter(
        (c) => c.id !== course.id && coursesNamedIn(c.prereq, index).some((n) => n.id === course.id)
      )
      return {
        course: course.name,
        prerequisite_text: course.prereq || 'not listed',
        named_courses: needs.map((n) => ({ name: n.name, in_your_plan: whereIs(n) })),
        open_to_grades: course.grades.length ? course.grades : 'not listed',
        unlocks: unlocks.slice(0, 10).map((c) => c.name),
      }
    }

    default:
      return { error: `Unknown tool ${name}` }
  }
}
