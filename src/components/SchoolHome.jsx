import { useEffect, useMemo, useState } from 'react'
import { CATALOG_SOURCE, DEPARTMENTS } from '../data/courses'
import { GRADE_LEVELS, LEVELS, MIN_REVIEWS, deptHue, verdictFor } from '../lib/metrics'
import { creditLabel, gradeLabel } from '../lib/stats'
import { CompareButton, DeptTag, Empty, LevelPill, MiniScores, SchoolTile } from './Bits'

const SORTS = [
  { value: 'name', label: 'A–Z' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'recommended', label: 'Most recommended' },
  { value: 'easiest', label: 'Lightest load' },
  { value: 'hardest', label: 'Hardest' },
]

const PAGE = 40

export function SchoolHome({
  school,
  courses,
  statsByCourse,
  compare,
  onToggleCompare,
  onOpenCourse,
  onWriteReview,
  onAddSchool,
}) {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState(null)
  const [level, setLevel] = useState(null)
  const [grade, setGrade] = useState(null)
  const [reviewedOnly, setReviewedOnly] = useState(false)
  const [sort, setSort] = useState('name')
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => {
    setLimit(PAGE)
  }, [query, dept, level, grade, reviewedOnly, sort])

  const totals = useMemo(() => {
    let reviews = 0
    let reviewed = 0
    for (const c of courses) {
      const s = statsByCourse[c.id]
      if (s?.count) {
        reviews += s.count
        reviewed += 1
      }
    }
    return { reviews, reviewed }
  }, [courses, statsByCourse])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = courses.filter((c) => {
      if (dept && c.dept !== dept) return false
      if (level && c.level !== level) return false
      if (grade && c.grades.length && !c.grades.includes(grade)) return false
      if (reviewedOnly && !(statsByCourse[c.id]?.count > 0)) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.group || '').toLowerCase().includes(q) ||
        c.dept.toLowerCase().includes(q) ||
        (c.prereq || '').toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
      )
    })

    const stat = (c) => statsByCourse[c.id] || { count: 0 }
    const enough = (c) => stat(c).count >= MIN_REVIEWS
    list = [...list]
    if (sort === 'reviews') {
      list.sort((a, b) => stat(b).count - stat(a).count || a.name.localeCompare(b.name))
    } else if (sort === 'recommended') {
      list.sort((a, b) => {
        if (enough(a) !== enough(b)) return enough(a) ? -1 : 1
        return (stat(b).takeAgain ?? -1) - (stat(a).takeAgain ?? -1) || a.name.localeCompare(b.name)
      })
    } else if (sort === 'easiest' || sort === 'hardest') {
      const load = (c) => {
        const s = stat(c)
        if (!enough(c)) return null
        return (s.averages.difficulty + s.averages.workload) / 2
      }
      list.sort((a, b) => {
        const la = load(a)
        const lb = load(b)
        if (la == null && lb == null) return a.name.localeCompare(b.name)
        if (la == null) return 1
        if (lb == null) return -1
        return sort === 'easiest' ? la - lb : lb - la
      })
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [courses, statsByCourse, query, dept, level, grade, reviewedOnly, sort])

  const filtersOn = dept || level || grade || reviewedOnly || query.trim()

  if (!school.catalog) {
    return (
      <div className="wrap py-10">
        <Empty
          title={`${school.name} is not loaded yet`}
          body={`Clearpath needs ${school.short}'s course catalog before reviews mean anything — every class, its prerequisites and its description. Westlake is loaded today. Add it to see how the whole thing works.`}
          action={
            <button type="button" className="btn-primary" onClick={() => onAddSchool('westlake')}>
              Open Westlake instead
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="flex flex-wrap items-center gap-4">
        <SchoolTile school={school} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[29px]">
            {school.name}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            {courses.length} courses · {totals.reviews} {totals.reviews === 1 ? 'review' : 'reviews'} across{' '}
            {totals.reviewed} {totals.reviewed === 1 ? 'class' : 'classes'}
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="sticky top-14 z-20 -mx-4 mt-5 bg-bg/85 px-4 pb-3 pt-3 backdrop-blur-xl sm:-mx-7 sm:px-7">
        <div className="relative">
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5L17 17" strokeLinecap="round" />
          </svg>
          <input
            className="field pl-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 306 classes, prerequisites, descriptions"
            aria-label="Search courses"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 sm:-mx-7 sm:px-7">
          <button type="button" onClick={() => setDept(null)} className={`chip ${!dept ? 'chip-on' : ''}`}>
            All departments
          </button>
          {DEPARTMENTS.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => setDept(dept === d.name ? null : d.name)}
              className={`chip ${dept === d.name ? 'chip-on' : ''}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: dept === d.name ? 'rgba(255,255,255,0.8)' : deptHue(d.name) }}
              />
              {d.name}
              <span className="tnum text-[11px] opacity-60">{d.count}</span>
            </button>
          ))}
        </div>

        <div className="no-scrollbar -mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 sm:-mx-7 sm:px-7">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(level === l ? null : l)}
              className={`chip ${level === l ? 'chip-on' : ''}`}
            >
              {l}
            </button>
          ))}
          <span className="h-5 w-px shrink-0 bg-line" />
          {GRADE_LEVELS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(grade === g ? null : g)}
              className={`chip ${grade === g ? 'chip-on' : ''}`}
            >
              {g}th
            </button>
          ))}
          <span className="h-5 w-px shrink-0 bg-line" />
          <button
            type="button"
            onClick={() => setReviewedOnly((v) => !v)}
            className={`chip ${reviewedOnly ? 'chip-on' : ''}`}
          >
            Has reviews
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          {filtered.length} {filtered.length === 1 ? 'class' : 'classes'}
          {filtersOn && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setDept(null)
                setLevel(null)
                setGrade(null)
                setReviewedOnly(false)
              }}
              className="ml-2 font-semibold text-brand hover:text-brand-deep"
            >
              Clear filters
            </button>
          )}
        </p>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-2"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!filtered.length ? (
        <div className="mt-4">
          <Empty
            title="Nothing matches that"
            body="Try a shorter search, or clear the filters. Every class in the Westlake catalog is in here, including the ones nobody has reviewed yet."
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.slice(0, limit).map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                stats={statsByCourse[course.id]}
                compared={compare.includes(course.id)}
                delay={Math.min(i, 12) * 28}
                onToggleCompare={() => onToggleCompare(course.id)}
                onOpen={() => onOpenCourse(course.id)}
                onWrite={() => onWriteReview(course.id)}
              />
            ))}
          </div>
          {filtered.length > limit && (
            <div className="mt-6 flex justify-center">
              <button type="button" className="btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
                Show {Math.min(PAGE, filtered.length - limit)} more
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-10 text-[12px] leading-relaxed text-muted">
        Course names, prerequisites, credits and descriptions come from the{' '}
        <a
          href={CATALOG_SOURCE.url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand hover:text-brand-deep"
        >
          {CATALOG_SOURCE.school} course catalog
        </a>{' '}
        ({CATALOG_SOURCE.pulled}). Scores come from students. Clearpath is a student project and is
        not affiliated with Eanes ISD.
      </p>
    </div>
  )
}

export function CourseCard({ course, stats, compared, onToggleCompare, onOpen, onWrite, delay = 0 }) {
  const s = stats || { count: 0, hasEnough: false, averages: {}, takeAgain: null }
  const verdict = verdictFor(s.hasEnough ? s.takeAgain : null)
  return (
    <article
      className="card flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift animate-rise-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <DeptTag dept={course.dept} group={course.group || course.dept} />
          <button type="button" onClick={onOpen} className="mt-1.5 block text-left">
            <h3 className="text-[16.5px] font-semibold leading-snug tracking-[-0.015em] text-ink hover:text-brand">
              {course.name}
            </h3>
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            <LevelPill level={course.level} />
            <span>{gradeLabel(course.grades)}</span>
            {creditLabel(course.credits) && <span>· {creditLabel(course.credits)}</span>}
            {course.fee && <span>· Fee</span>}
          </div>
        </div>
        <CompareButton on={compared} onClick={onToggleCompare} />
      </div>

      <div className="mt-3.5 flex-1">
        {s.hasEnough ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-semibold" style={{ color: verdict.tone }}>
                {verdict.text}
              </span>
              <span className="tnum text-[12.5px] text-muted">
                {Math.round(s.takeAgain * 100)}% would retake · {s.count} reviews
              </span>
            </div>
            <div className="mt-3">
              <MiniScores averages={s.averages} delay={delay + 60} />
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="flex gap-1" aria-hidden>
                {Array.from({ length: MIN_REVIEWS }).map((_, i) => (
                  <span key={i} className={`h-1.5 w-3.5 rounded-full ${i < s.count ? 'bg-brand' : 'bg-line'}`} />
                ))}
              </span>
              <span className="text-[12.5px] font-semibold text-ink-2">
                {s.count === 0 ? 'No reviews yet' : `${s.count} of ${MIN_REVIEWS} reviews`}
              </span>
            </div>
            <p className="clamp-3 mt-2 text-[13px] leading-relaxed text-muted">
              {course.summary || 'The catalog does not publish a description for this course.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="min-w-0 truncate text-[12px] text-muted">
          {course.prereq && course.prereq !== 'None' ? (
            <>
              <span className="font-semibold text-ink-2">Needs:</span> {course.prereq}
            </>
          ) : (
            'No prerequisites'
          )}
        </span>
        <button
          type="button"
          onClick={s.count ? onOpen : onWrite}
          className="shrink-0 text-[13px] font-semibold text-brand hover:text-brand-deep"
        >
          {s.count ? 'Open' : 'Be first'}
        </button>
      </div>
    </article>
  )
}
