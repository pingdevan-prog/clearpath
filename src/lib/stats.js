import { FACTORS, HOURS_BUCKETS, MIN_REVIEWS } from './metrics'

/** Everything a screen needs to know about one course's reviews, in one pass. */
export function summarize(reviews) {
  const count = reviews.length
  const averages = {}

  for (const f of FACTORS) {
    let sum = 0
    let n = 0
    for (const r of reviews) {
      const v = r.scores?.[f.key]
      if (typeof v === 'number') {
        sum += v
        n += 1
      }
    }
    averages[f.key] = n ? sum / n : null
  }

  let againYes = 0
  let againTotal = 0
  for (const r of reviews) {
    if (typeof r.takeAgain === 'boolean') {
      againTotal += 1
      if (r.takeAgain) againYes += 1
    }
  }

  const tagCounts = new Map()
  for (const r of reviews) {
    for (const tag of r.tags || []) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
  }
  const tags = [...tagCounts.entries()]
    .map(([tag, n]) => ({ tag, count: n, share: count ? n / count : 0 }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))

  const hourCounts = new Map()
  for (const r of reviews) {
    if (r.hours) hourCounts.set(r.hours, (hourCounts.get(r.hours) || 0) + 1)
  }
  let hoursMode = null
  let hoursModeCount = 0
  for (const bucket of HOURS_BUCKETS) {
    const n = hourCounts.get(bucket) || 0
    if (n > hoursModeCount) {
      hoursMode = bucket
      hoursModeCount = n
    }
  }
  const hoursReported = [...hourCounts.values()].reduce((a, b) => a + b, 0)

  // How split the class is on "would you take it again", 0–1.
  let divisiveness = 0
  if (againTotal >= MIN_REVIEWS) {
    const share = againYes / againTotal
    divisiveness = 1 - Math.abs(share - 0.5) * 2
  }

  return {
    count,
    hasEnough: count >= MIN_REVIEWS,
    averages,
    takeAgain: againTotal ? againYes / againTotal : null,
    takeAgainCount: againTotal,
    tags,
    hoursMode,
    hoursShare: hoursReported ? hoursModeCount / hoursReported : 0,
    divisiveness,
    hasSample: reviews.some((r) => r.sample),
  }
}

export function ordinal(n) {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export function creditLabel(credits) {
  if (!credits || !credits.length) return null
  const fmt = (c) => (Number.isInteger(c) ? String(c) : String(c).replace(/^0/, ''))
  return credits.map(fmt).join(' or ') + ' credit'
}

export function gradeLabel(grades) {
  if (!grades || !grades.length) return 'Grades not listed'
  if (grades.length === 1) return `Grade ${grades[0]}`
  const run = grades.every((g, i) => i === 0 || g === grades[i - 1] + 1)
  return run ? `Grades ${grades[0]}–${grades[grades.length - 1]}` : `Grades ${grades.join(', ')}`
}
