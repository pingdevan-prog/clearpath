import { useEffect, useMemo, useState } from 'react'
import { CATALOG_SOURCE, DEPARTMENTS } from '../data/courses'
import { GRADE_LEVELS, LEVELS, MIN_REVIEWS, deptHue, deptShort, verdictFor } from '../lib/metrics'
import { creditLabel, gradeLabel } from '../lib/stats'
import { CompareButton, DeptBadge, Empty, Icon, LevelPill, MiniScores, SchoolTile } from './Bits'

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
  const [sort, setSort] = useState('reviews')
  const [showFilters, setShowFilters] = useState(false)
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

  const filterCount = (dept ? 1 : 0) + (level ? 1 : 0) + (grade ? 1 : 0) + (reviewedOnly ? 1 : 0)
  const filtersOn = filterCount > 0 || query.trim()
  const clearAll = () => {
    setQuery('')
    setDept(null)
    setLevel(null)
    setGrade(null)
    setReviewedOnly(false)
  }

  // The shelf: classes students would take again, best first.
  const loved = useMemo(
    () =>
      courses
        .filter((c) => statsByCourse[c.id]?.hasEnough && statsByCourse[c.id].takeAgain >= 0.6)
        .sort(
          (a, b) =>
            statsByCourse[b.id].takeAgain - statsByCourse[a.id].takeAgain ||
            statsByCourse[b.id].count - statsByCourse[a.id].count
        )
        .slice(0, 10),
    [courses, statsByCourse]
  )

  if (!school.catalog) {
    return (
      <div className="wrap py-10">
        <Empty
          title={`${school.name} is not loaded yet`}
          body={`Clearpath needs ${school.short}'s course catalog before reviews mean anything: every class, its prerequisites and its description. Westlake is loaded today. Open it to see how the whole thing works.`}
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
    <div className="wrap pb-6 pt-5 sm:pb-9 sm:pt-8">
      <div className="flex items-center gap-3.5 sm:gap-4">
        <SchoolTile school={school} size={46} className="sm:h-[54px] sm:w-[54px]" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold leading-tight text-ink sm:text-[30px]">{school.name}</h1>
          <p className="mt-0.5 text-[13px] text-muted sm:text-[14px]">
            <span className="tnum font-semibold text-ink-2">{courses.length}</span> classes ·{' '}
            <span className="tnum font-semibold text-ink-2">{totals.reviews}</span>{' '}
            {totals.reviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <button type="button" onClick={() => onWriteReview(null)} className="btn-primary hidden sm:inline-flex">
          <Icon name="pen" size={17} />
          Review a class
        </button>
      </div>

      {/* Search stays pinned; filters fold away so classes get the screen. */}
      <div className="sticky top-14 z-20 -mx-4 mt-4 bg-bg/85 px-4 pb-2.5 pt-2.5 backdrop-blur-xl sm:-mx-7 sm:mt-6 sm:px-7">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field pl-11 pr-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${courses.length} classes`}
              aria-label="Search courses"
              type="search"
              enterKeyHint="search"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted transition-colors hover:bg-sunk hover:text-ink"
                aria-label="Clear search"
              >
                <Icon name="x" size={16} stroke={2.2} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`relative inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 text-[14px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 ${
              showFilters || filterCount
                ? 'border-brand/40 bg-brand-soft text-brand-deep'
                : 'border-line bg-surface text-ink-2 hover:border-brand/40'
            }`}
          >
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
              <path d="M3.5 6h13M6 10h8M8.5 14h3" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {filterCount > 0 && (
              <span
                key={filterCount}
                className="inline-flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white"
              >
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-2.5 animate-rise-in space-y-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card">
            <FilterRow label="Department">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => setDept(dept === d.name ? null : d.name)}
                  className={`chip ${dept === d.name ? 'chip-on' : ''}`}
                >
                  {deptShort(d.name)}
                </button>
              ))}
            </FilterRow>
            <FilterRow label="Level">
              {LEVELS.map((l) => (
                <button key={l} type="button" onClick={() => setLevel(level === l ? null : l)} className={`chip ${level === l ? 'chip-on' : ''}`}>
                  {l}
                </button>
              ))}
            </FilterRow>
            <FilterRow label="Grade">
              {GRADE_LEVELS.map((g) => (
                <button key={g} type="button" onClick={() => setGrade(grade === g ? null : g)} className={`chip ${grade === g ? 'chip-on' : ''}`}>
                  {g}th
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReviewedOnly((v) => !v)}
                className={`chip ${reviewedOnly ? 'chip-on' : ''}`}
              >
                Has reviews
              </button>
            </FilterRow>
          </div>
        )}

        {!showFilters && filterCount > 0 && (
          <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {dept && <ActiveChip label={deptShort(dept)} onClear={() => setDept(null)} />}
            {level && <ActiveChip label={level} onClear={() => setLevel(null)} />}
            {grade && <ActiveChip label={`${grade}th grade`} onClear={() => setGrade(null)} />}
            {reviewedOnly && <ActiveChip label="Has reviews" onClear={() => setReviewedOnly(false)} />}
          </div>
        )}
      </div>

      {!filtersOn && (
        <>
          <section className="mt-4 sm:mt-5" aria-label="Departments">
            <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
              {DEPARTMENTS.map((d, i) => (
                <DeptTile key={d.name} dept={d} delay={i * 35} onPick={() => setDept(d.name)} />
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="loved-title">
            <div className="flex items-end justify-between gap-3">
              <h2 id="loved-title" className="section-title">
                Students love these
              </h2>
              {loved.length > 2 && (
                <button
                  type="button"
                  onClick={() => setSort('recommended')}
                  className="text-[13px] font-semibold text-brand-ink transition-colors hover:text-brand-deep"
                >
                  Sort all by this
                </button>
              )}
            </div>
            {loved.length ? (
              <div className="no-scrollbar -mx-4 mt-3 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {loved.map((c, i) => (
                  <LovedCard
                    key={c.id}
                    course={c}
                    stats={statsByCourse[c.id]}
                    delay={i * 50}
                    onOpen={() => onOpenCourse(c.id)}
                    className={i >= 4 ? 'sm:hidden' : ''}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-4 rounded-xl2 bg-brand p-5 text-white shadow-glow sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[16px] font-bold">No class has {MIN_REVIEWS} reviews yet.</p>
                  <p className="mt-1 text-[14px] leading-snug text-white/95">
                    Scores unlock at {MIN_REVIEWS}. A thirty second review from you gets the first class there.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onWriteReview(null)}
                  className="btn shrink-0 bg-white text-brand hover:bg-white/90"
                >
                  <Icon name="pen" size={17} />
                  Review a class
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 ${filtersOn ? 'mt-3' : 'mt-8'}`}>
        {filtersOn ? (
          <p className="text-[13.5px] text-muted">
            <span className="tnum font-semibold text-ink-2">{filtered.length}</span> {filtered.length === 1 ? 'class' : 'classes'}
            <button
              type="button"
              onClick={clearAll}
              className="ml-2 font-semibold text-brand-ink transition-colors hover:text-brand-deep"
            >
              Clear all
            </button>
          </p>
        ) : (
          <h2 className="section-title">All classes</h2>
        )}
        <label className="relative flex items-center gap-2 text-[13px] text-muted">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-full border border-line bg-surface py-1.5 pl-3 pr-8 text-[13px] font-semibold text-ink-2 transition-colors hover:border-brand/40"
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={14} stroke={2.2} className="pointer-events-none absolute right-2.5 text-muted" />
        </label>
      </div>

      {!filtered.length ? (
        <div className="mt-4">
          <Empty
            icon="search"
            title="Nothing matches that"
            body="Try a shorter search, or clear the filters. Every class in the catalog is in here, including the ones nobody has reviewed yet."
            action={
              <button type="button" className="btn-ghost" onClick={clearAll}>
                Clear search and filters
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.slice(0, limit).map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                stats={statsByCourse[course.id]}
                compared={compare.includes(course.id)}
                delay={Math.min(i, 10) * 30}
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
                <Icon name="chevron-down" size={16} stroke={2.2} />
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-12 max-w-2xl text-[12.5px] leading-relaxed text-muted">
        Course names, prerequisites, credits and descriptions come from the{' '}
        <a
          href={CATALOG_SOURCE.url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-ink underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
        >
          {CATALOG_SOURCE.school} course catalog
        </a>{' '}
        ({CATALOG_SOURCE.pulled}). Scores come from students. Clearpath is a student project and is not affiliated with
        Eanes ISD.
      </p>
    </div>
  )
}

function FilterRow({ label, children }) {
  return (
    <div className="sm:flex sm:items-start sm:gap-4">
      <div className="label mb-2 sm:mb-0 sm:w-24 sm:shrink-0 sm:pt-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function ActiveChip({ label, onClear }) {
  return (
    <button type="button" onClick={onClear} className="chip chip-on shrink-0 animate-pop-in pr-2" aria-label={`Remove filter ${label}`}>
      {label}
      <Icon name="x" size={14} stroke={2.4} className="opacity-80" />
    </button>
  )
}

function DeptTile({ dept, onPick, delay }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="dept-soft group flex w-[8.6rem] shrink-0 snap-start animate-rise-in flex-col items-start gap-3 rounded-xl2 p-3 text-left transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.97] sm:w-auto"
      style={{ '--dept': deptHue(dept.name), animationDelay: `${delay}ms` }}
    >
      <DeptBadge dept={dept.name} size={36} onTint className="transition-transform duration-300 ease-out group-hover:scale-105" />
      <span className="w-full">
        <span className="dept-ink block truncate text-[14px] font-bold">{deptShort(dept.name)}</span>
        <span className="tnum block text-[12px] text-ink-2/80">{dept.count} classes</span>
      </span>
    </button>
  )
}

function LovedCard({ course, stats, onOpen, delay, className = '' }) {
  const verdict = verdictFor(stats.takeAgain)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`card dept-glow group flex w-[15.5rem] shrink-0 snap-start animate-rise-in flex-col p-4 text-left transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98] sm:w-auto ${className}`}
      style={{ '--dept': deptHue(course.dept), animationDelay: `${delay}ms` }}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <DeptBadge dept={course.dept} size={36} />
        <span className="text-right">
          <span className="tone-text-lg tnum block text-[24px] font-bold leading-none tracking-tight" style={{ '--tone': verdict.tone }}>
            {Math.round(stats.takeAgain * 100)}%
          </span>
          <span className="mt-1 block text-[11.5px] text-muted">would retake</span>
        </span>
      </div>
      <h3 className="clamp-2 mt-3 text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-brand-ink">
        {course.name}
      </h3>
      <div className="mt-auto flex items-center gap-2 pt-3 text-[12px] text-muted">
        <LevelPill level={course.level} />
        <span className="tnum">{stats.count} reviews</span>
      </div>
    </button>
  )
}

export function CourseCard({ course, stats, compared, onToggleCompare, onOpen, onWrite, delay = 0 }) {
  const s = stats || { count: 0, hasEnough: false, averages: {}, takeAgain: null }
  const verdict = verdictFor(s.hasEnough ? s.takeAgain : null)
  const hasPrereq = course.prereq && course.prereq !== 'None'
  return (
    <article
      className="card dept-glow group relative flex animate-rise-in flex-col p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift"
      style={{ '--dept': deptHue(course.dept), animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <DeptBadge dept={course.dept} size={40} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            className="block text-left after:absolute after:inset-0 after:rounded-xl2 after:content-['']"
          >
            <h3 className="text-[16px] font-bold leading-snug tracking-[-0.015em] text-ink transition-colors group-hover:text-brand-ink">
              {course.name}
            </h3>
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            <LevelPill level={course.level} />
            <span>{gradeLabel(course.grades)}</span>
            {creditLabel(course.credits) && <span>· {creditLabel(course.credits)}</span>}
            {course.fee && <span>· Fee</span>}
          </div>
        </div>
        <CompareButton on={compared} onClick={onToggleCompare} className="relative z-10" />
      </div>

      <div className="mt-3.5 flex-1">
        {s.hasEnough ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span
                className="tone-soft tone-text inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold"
                style={{ '--tone': verdict.tone }}
              >
                {verdict.text}
                <span className="tnum font-semibold opacity-80">{Math.round(s.takeAgain * 100)}%</span>
              </span>
              <span className="tnum text-[12.5px] text-muted">{s.count} reviews</span>
            </div>
            <div className="mt-3.5">
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
            <p className="clamp-2 mt-2 text-[13px] leading-relaxed text-muted">
              {course.summary || 'The catalog does not publish a description for this course.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line/80 pt-3">
        <span className="min-w-0 truncate text-[12.5px] text-muted">
          {hasPrereq ? (
            <>
              <span className="font-semibold text-ink-2">Needs</span> {course.prereq}
            </>
          ) : (
            'No prerequisites'
          )}
        </span>
        {s.count ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-brand-ink">
            Open
            <Icon name="chevron-right" size={16} stroke={2.2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        ) : (
          <button
            type="button"
            onClick={onWrite}
            className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[12.5px] font-semibold text-brand-deep transition-[background-color,transform] duration-200 hover:bg-brand hover:text-white active:scale-95"
          >
            <Icon name="pen" size={14} stroke={2} />
            Be first
          </button>
        )}
      </div>
    </article>
  )
}
