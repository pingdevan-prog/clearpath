// ---------------------------------------------------------------------------
// Turning what a student types into an answer built from real data.
//
// Every number here comes from the catalog or from student reviews. Nothing is
// generated prose about a course — if Clearpath does not know, it says so,
// because a confident wrong answer about a prerequisite costs someone a year.
// ---------------------------------------------------------------------------

import { COURSES, COURSE_MAP } from '../data/courses'
import { REQUIREMENTS, bucketFor, tallyCredits } from '../data/graduation'
import { GOALS, INTERESTS, RIGOR, tierForCollege } from '../data/pathways'
import { buildNameIndex, coursesNamedIn, creditsOf } from './plan'
import { buildPlan, rankCourses } from './advisor'
import { MIN_REVIEWS } from './metrics'
import { PLAN_GRADES } from './store'

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Find a course the student named, longest match wins. */
export function findCourse(text) {
  const t = norm(text)
  let best = null
  for (const c of COURSES) {
    const n = norm(c.name)
    if (n.length < 5) continue
    if (t.includes(n) && (!best || n.length > norm(best.name).length)) best = c
  }
  if (best) return best
  // Try the course code, e.g. "SC315".
  const code = t.match(/\b([a-z]{2}\s?\d{3}[a-z]?)\b/)
  if (code) {
    const want = code[1].replace(/\s/g, '').toUpperCase()
    return COURSES.find((c) => (c.code || '').toUpperCase() === want) || null
  }
  return null
}

/** Pull preferences out of a sentence. */
export function readPrefs(text, current = {}) {
  const t = norm(text)
  const prefs = { interests: [], ...current }

  for (const g of GOALS) {
    const words = {
      engineering: ['engineer', 'engineering', 'mechanical', 'aerospace', 'civil'],
      cs: ['computer science', 'software', 'coding', 'programming', 'cs', 'cyber', 'data science'],
      health: ['med', 'medicine', 'doctor', 'nurse', 'pre med', 'premed', 'health', 'dentist', 'vet'],
      business: ['business', 'finance', 'marketing', 'entrepreneur', 'accounting', 'economics major'],
      law: ['law', 'lawyer', 'attorney', 'politics', 'political science', 'government major', 'policy'],
      arts: ['art', 'design', 'theatre', 'theater', 'music', 'film', 'animation', 'studio'],
      writing: ['writing', 'journalism', 'english major', 'communications', 'media'],
      undecided: ['undecided', 'not sure', 'no idea', 'dont know', 'keep options'],
    }[g.id]
    if (words?.some((w) => t.includes(w))) {
      prefs.goal = g.id
      break
    }
  }

  for (const i of INTERESTS) {
    const words = {
      stem: ['stem', 'science', 'math', 'maths'],
      arts: ['arts', 'creative', 'drawing', 'painting'],
      humanities: ['humanities', 'history', 'english', 'reading'],
      languages: ['language', 'spanish', 'french', 'latin', 'chinese'],
      business: ['business'],
      health: ['health', 'medical'],
      handson: ['hands on', 'hands-on', 'building', 'making', 'projects'],
      sports: ['sports', 'athletics', 'pe'],
    }[i.id]
    if (words?.some((w) => t.includes(w)) && !prefs.interests.includes(i.id)) {
      prefs.interests.push(i.id)
    }
  }

  if (/\b(hard|hardest|rigor|rigour|challenge|challenging|difficult|tough|ap heavy)\b/.test(t)) {
    prefs.rigor = 'challenge'
  }
  if (/\b(easy|easiest|light|chill|relaxed|manageable|low stress|gpa)\b/.test(t)) {
    prefs.rigor = 'light'
  }
  if (/\b(balanced|balance|mix|moderate)\b/.test(t)) prefs.rigor = 'balanced'
  if (/\b(low work|little work|less work|light work|low homework|no homework|least homework)\b/.test(t)) {
    prefs.lowWork = true
  }

  const tier = tierForCollege(text)
  if (tier) {
    prefs.college = tier.id
    prefs.rigor = prefs.rigor || tier.rigor
    prefs.collegeNote = tier.note
  }

  for (const fam of ['Spanish', 'French', 'Latin', 'Chinese', 'American Sign Language']) {
    if (t.includes(norm(fam))) prefs.language = fam
  }

  if (!prefs.rigor) prefs.rigor = 'balanced'
  if (!prefs.goal) prefs.goal = 'undecided'
  return prefs
}

function reviewLine(stats) {
  if (!stats || !stats.hasEnough) {
    return stats?.count
      ? `Only ${stats.count} of ${MIN_REVIEWS} reviews, so no scores yet.`
      : 'Nobody has reviewed it yet.'
  }
  const a = stats.averages
  return `${Math.round(stats.takeAgain * 100)}% would take it again. Difficulty ${a.difficulty.toFixed(
    1
  )}, homework ${a.workload.toFixed(1)}, fun ${a.fun.toFixed(1)}, worth it ${a.value.toFixed(
    1
  )} — from ${stats.count} reviews.`
}

/**
 * Answer one message.
 *
 * Returns { text, courses, plan, prefs, chips } — the UI decides how to draw
 * each part, and anything absent is simply not shown.
 */
export function answer(text, ctx) {
  const t = norm(text)
  const { statsByCourse, plan, profile } = ctx
  const named = findCourse(text)

  // ---------------------------------------------------------- build a plan
  if (
    /\b(build|make|plan|schedule|create|design|give me)\b/.test(t) &&
    /\b(schedule|plan|classes|courses|year|years)\b/.test(t)
  ) {
    const prefs = readPrefs(text, ctx.prefs)
    const result = buildPlan(prefs, { statsByCourse, existingPlan: plan })
    const goal = GOALS.find((g) => g.id === prefs.goal)
    const rigor = RIGOR.find((r) => r.id === prefs.rigor)
    const bits = [
      goal && goal.id !== 'undecided' ? `aimed at ${goal.label.toLowerCase()}` : null,
      rigor ? rigor.label.toLowerCase() : null,
      prefs.lowWork ? 'leaning to lighter homework' : null,
    ].filter(Boolean)
    return {
      text:
        `Here is a four year plan ${bits.join(', ')}. ` +
        (result.kept ? `I kept the ${result.kept} ${result.kept === 1 ? 'class' : 'classes'} you already had and added ${result.added.length}. ` : '') +
        `It comes to ${result.tally.total} credits.` +
        (result.gaps.length
          ? ` Still short on ${result.gaps.map((g) => `${g.label} (${g.short})`).join(', ')}.`
          : ' Every graduation requirement is covered.') +
        (prefs.collegeNote ? `\n\n${prefs.collegeNote}` : ''),
      plan: result,
      prefs,
    }
  }

  // ------------------------------------------------- graduation progress
  if (/\b(graduate|graduation|on track|credits|requirements|enough)\b/.test(t)) {
    const courses = PLAN_GRADES.flatMap((g) => (plan?.[g] || []).map((id) => COURSE_MAP[id])).filter(Boolean)
    if (!courses.length) {
      return {
        text:
          'Your plan is empty, so there is nothing to check yet. Tell me what you are aiming at and I will build you one — try "build me a schedule for engineering".',
        chips: ['Build me a schedule', 'What do I need to graduate?'],
      }
    }
    const tally = tallyCredits(courses)
    const short = REQUIREMENTS.filter((r) => (tally.byBucket[r.key] || 0) < r.credits)
    return {
      text:
        `You have ${tally.total} credits planned out of 26.\n\n` +
        (short.length
          ? short
              .map(
                (r) =>
                  `• ${r.label}: ${tally.byBucket[r.key] || 0} of ${r.credits} — ${
                    Math.round((r.credits - (tally.byBucket[r.key] || 0)) * 10) / 10
                  } short`
              )
              .join('\n')
          : 'Every requirement is covered.') +
        '\n\nThis is a rough check against the plan Westlake publishes. Your counsellor has the final word.',
    }
  }

  // --------------------------------------------------- one named course
  if (named && /\b(prereq\w*|need\w*|require\w*|before|take first|qualify)\b/.test(t)) {
    const index = buildNameIndex(COURSES)
    const needs = coursesNamedIn(named.prereq, index)
    return {
      text:
        named.prereq && named.prereq !== 'None'
          ? `${named.name} lists: ${named.prereq}`
          : named.prereq === 'None'
          ? `${named.name} has no prerequisites — it is open to ${
              named.grades.length ? `grades ${named.grades.join(', ')}` : 'any grade'
            }.`
          : `The catalog does not list a prerequisite for ${named.name}.`,
      courses: needs.map((n) => COURSE_MAP[n.id]).filter(Boolean),
    }
  }

  if (named && /\b(unlock\w*|lead\w*|after|next|then what)\b/.test(t)) {
    const index = buildNameIndex(COURSES)
    const opens = COURSES.filter(
      (c) => c.id !== named.id && coursesNamedIn(c.prereq, index).some((n) => n.id === named.id)
    )
    return {
      text: opens.length
        ? `${named.name} is a prerequisite for ${opens.length} ${opens.length === 1 ? 'course' : 'courses'}.`
        : `Nothing in the catalog lists ${named.name} as a prerequisite.`,
      courses: opens.slice(0, 8),
    }
  }

  if (named) {
    const stats = statsByCourse[named.id]
    return {
      text:
        `**${named.name}** — ${named.dept}${named.group ? `, ${named.group}` : ''}, ${named.level}.\n\n` +
        `${reviewLine(stats)}\n\n` +
        (named.prereq && named.prereq !== 'None' ? `Prerequisite: ${named.prereq}\n\n` : '') +
        (named.summary ? named.summary.split('\n\n')[0] : 'The catalog publishes no description for this one.'),
      courses: [named],
    }
  }

  // ------------------------------------------------- ranked recommendations
  const wantsEasy = /\b(easy|easiest|light|lightest|chill|low stress|manageable)\b/.test(t)
  const wantsHard = /\b(hard|hardest|difficult|toughest|challenging|rigorous)\b/.test(t)
  const wantsFun = /\b(fun|enjoy|best|favourite|favorite|love)\b/.test(t)
  const wantsLowWork = /\b(low work|least homework|little homework|less work|light homework|no homework)\b/.test(t)

  if (wantsEasy || wantsHard || wantsFun || wantsLowWork) {
    const prefs = readPrefs(text, ctx.prefs)
    const deptWord = COURSES.find((c) => t.includes(norm(c.dept)))?.dept
    const groupWord = COURSES.find((c) => c.group && t.includes(norm(c.group)))?.group
    const scoredOnly = (c, stats) => {
      if (deptWord && c.dept !== deptWord) return false
      if (groupWord && c.group !== groupWord) return false
      return stats?.hasEnough
    }
    let list = rankCourses(prefs, { statsByCourse, filter: scoredOnly, limit: 30 })
    if (wantsHard) list.sort((a, b) => (b.review?.difficulty ?? 0) - (a.review?.difficulty ?? 0))
    else if (wantsEasy) list.sort((a, b) => (a.review?.difficulty ?? 10) - (b.review?.difficulty ?? 10))
    else if (wantsLowWork) list.sort((a, b) => (a.review?.workload ?? 10) - (b.review?.workload ?? 10))
    else if (wantsFun) list.sort((a, b) => (b.review?.fun ?? 0) - (a.review?.fun ?? 0))

    const what = wantsHard ? 'hardest' : wantsEasy ? 'easiest' : wantsLowWork ? 'lightest on homework' : 'most fun'
    const where = groupWord || deptWord || 'classes'
    if (!list.length) {
      return {
        text: `No ${where === 'classes' ? 'class' : where} has ${MIN_REVIEWS} reviews yet, so I have nothing to rank. Clearpath hides scores under ${MIN_REVIEWS} reviews rather than guess.`,
      }
    }
    return {
      text: `The ${what} ${where === 'classes' ? 'classes' : where} students have actually scored:`,
      courses: list.slice(0, 6).map((r) => r.course),
      scored: list.slice(0, 6),
    }
  }

  // ---------------------------------------------------------- what next
  if (/\b(what should i take|recommend|suggest|good for me|ideas)\b/.test(t)) {
    const prefs = readPrefs(text, ctx.prefs)
    const taken = new Set(PLAN_GRADES.flatMap((g) => plan?.[g] || []))
    const grade = profile?.grade || 10
    const list = rankCourses(prefs, {
      statsByCourse,
      filter: (c) => !taken.has(c.id) && (!c.grades.length || c.grades.includes(grade)),
      limit: 6,
    })
    return {
      text: `Based on what you have told me, these fit you best${profile?.grade ? ` for ${grade}th grade` : ''}:`,
      courses: list.map((r) => r.course),
      scored: list,
      prefs,
    }
  }

  // ------------------------------------------------------------- fallback
  return {
    text:
      "I can work from the catalog and from what students wrote in their reviews. Try asking me to build a schedule, or about any class by name.",
    chips: [
      'Build me a schedule for engineering',
      'Which science class is easiest?',
      'What are the prerequisites for AP Chemistry?',
      'What do I need to graduate?',
    ],
  }
}

/** The starters shown before anyone types anything. */
export const STARTERS = [
  { label: 'Build my whole schedule', text: 'Build me a four year schedule' },
  { label: 'I want to study engineering', text: 'Build me a schedule for engineering' },
  { label: 'I want to get into UT Austin', text: 'Build me a schedule to get into UT Austin' },
  { label: 'Give me low homework classes', text: 'Which classes have the least homework?' },
  { label: 'Challenge me', text: 'Build me the most challenging schedule I can handle' },
  { label: 'Keep it light', text: 'Build me a light schedule with low stress classes' },
  { label: 'I love STEM', text: 'Build me a schedule, I love STEM' },
  { label: 'I love the arts', text: 'Build me a schedule, I love arts classes' },
  { label: 'Easiest science?', text: 'Which science class is easiest?' },
  { label: 'Most fun classes', text: 'What are the most fun classes?' },
  { label: 'Am I on track?', text: 'What do I still need to graduate?' },
  { label: 'Prerequisites for a class', text: 'What are the prerequisites for AP Chemistry?' },
]
