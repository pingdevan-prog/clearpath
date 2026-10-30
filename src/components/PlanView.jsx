import { useMemo, useState } from 'react'
import { PLAN_GRADES } from '../lib/store'
import { buildNameIndex, creditsOf, warningsFor } from '../lib/plan'
import { PLAN_NAME, PLAN_URL, REQUIREMENTS, TOTAL_CREDITS, tallyCredits } from '../data/graduation'
import { MIN_REVIEWS, deptHue, deptShort, verdictFor } from '../lib/metrics'
import { gradeLabel } from '../lib/stats'
import { DeptTag, Empty, LevelPill } from './Bits'
import { Advisor } from './Advisor'

const GRADE_NAMES = { 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' }

/**
 * Four years on one screen. Put every class you took and every class you are
 * thinking about into the year you would take it, and the plan checks the two
 * things people get wrong: prerequisites in the wrong order, and credits that
 * do not add up by senior year.
 */
export function PlanView({
  courses,
  courseMap,
  statsByCourse,
  plan,
  profile,
  onAdd,
  onRemove,
  onMove,
  onClear,
  onApplyPlan,
  onOpenCourse,
}) {
  const [picking, setPicking] = useState(null) // the grade being added to
  const [confirmClear, setConfirmClear] = useState(false)
  const [advisorOpen, setAdvisorOpen] = useState(false)

  const index = useMemo(() => buildNameIndex(courses), [courses])

  const planned = useMemo(() => {
    const out = {}
    for (const g of PLAN_GRADES) out[g] = plan[g].map((id) => courseMap[id]).filter(Boolean)
    return out
  }, [plan, courseMap])

  const all = PLAN_GRADES.flatMap((g) => planned[g])
  const tally = useMemo(() => tallyCredits(all), [all])
  const totalWarnings = useMemo(
    () =>
      PLAN_GRADES.reduce(
        (n, g) => n + planned[g].reduce((m, c) => m + warningsFor(c, g, plan, index).length, 0),
        0
      ),
    [planned, plan, index]
  )

  if (!courses.length) {
    return (
      <div className="wrap py-10">
        <Empty
          title="No catalog loaded"
          body="Switch to a school with its courses loaded to plan your four years."
        />
      </div>
    )
  }

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[32px]">
            Your four year plan
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
            Every class you have taken and every one you are thinking about, in the year you would
            take it. Clearpath checks the prerequisites and counts the credits as you go.
          </p>
        </div>
        {all.length > 0 && (
          <div className="flex items-center gap-3">
            {confirmClear ? (
              <>
                <button
                  type="button"
                  className="text-[13px] font-semibold text-warn"
                  onClick={() => {
                    onClear()
                    setConfirmClear(false)
                  }}
                >
                  Yes, empty it
                </button>
                <button type="button" className="text-[13px] font-semibold text-muted" onClick={() => setConfirmClear(false)}>
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                className="text-[13px] font-semibold text-muted hover:text-warn"
                onClick={() => setConfirmClear(true)}
              >
                Clear plan
              </button>
            )}
          </div>
        )}
      </div>

      {/* The advisor sits above the years: it is the fastest way to fill them. */}
      <section className="mt-6">
        {advisorOpen ? (
          <Advisor
            statsByCourse={statsByCourse}
            plan={plan}
            profile={profile}
            onApplyPlan={onApplyPlan}
            onOpenCourse={onOpenCourse}
            onClose={() => setAdvisorOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdvisorOpen(true)}
            className="card flex w-full items-center gap-3.5 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-brand">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="2">
                <path
                  d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-semibold text-ink">
                Ask the advisor to build it for you
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                Tell it what you want to study, how hard you want to work, or what you like. It reads
                every review and every prerequisite.
              </span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-brand">Open</span>
          </button>
        )}
      </section>

      <CreditSummary tally={tally} warnings={totalWarnings} planned={all.length} />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_GRADES.map((grade) => (
          <YearColumn
            key={grade}
            grade={grade}
            courses={planned[grade]}
            plan={plan}
            index={index}
            statsByCourse={statsByCourse}
            onAdd={() => setPicking(grade)}
            onRemove={(id) => onRemove(grade, id)}
            onMove={(id, to) => onMove(id, to)}
            onOpenCourse={onOpenCourse}
          />
        ))}
      </div>

      {picking !== null && (
        <ClassPicker
          grade={picking}
          courses={courses}
          statsByCourse={statsByCourse}
          taken={PLAN_GRADES.flatMap((g) => plan[g])}
          onPick={(id) => {
            onAdd(picking, id)
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}

      <p className="mt-8 text-[12px] leading-relaxed text-muted">
        Credits are checked against the{' '}
        <a href={PLAN_URL} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-brand-deep">
          {PLAN_NAME}
        </a>{' '}
        plan Westlake publishes, {TOTAL_CREDITS} credits in all. Which course counts for which
        requirement has exceptions this app does not know, so treat this as a draft to bring to your
        counselor, not as the final word.
      </p>
    </div>
  )
}

function CreditSummary({ tally, warnings, planned }) {
  const pct = Math.min(1, tally.total / TOTAL_CREDITS)
  return (
    <section className="card mt-6 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Credits planned</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="tnum text-[32px] font-semibold leading-none text-ink">{fmt(tally.total)}</span>
            <span className="text-[15px] text-muted">of {TOTAL_CREDITS}</span>
          </div>
        </div>
        <div className="text-right">
          {planned === 0 ? (
            <span className="text-[13px] text-muted">Nothing planned yet</span>
          ) : warnings > 0 ? (
            <span className="text-[13px] font-semibold text-scale-7">
              {warnings} thing{warnings === 1 ? '' : 's'} to check
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-good">Nothing flagged</span>
          )}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sunk">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {REQUIREMENTS.map((req) => {
          const got = tally.byBucket[req.key] || 0
          const done = got >= req.credits
          return (
            <div key={req.key} title={req.note}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] font-medium text-ink-2">{req.label}</span>
                <span className={`tnum text-[12px] font-semibold ${done ? 'text-good' : 'text-muted'}`}>
                  {fmt(got)}/{fmt(req.credits)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunk">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${Math.min(1, got / req.credits) * 100}%`,
                    background: done ? '#0E9F7E' : '#6D66EE',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function YearColumn({ grade, courses, plan, index, statsByCourse, onAdd, onRemove, onMove, onOpenCourse }) {
  const credits = courses.reduce((n, c) => n + creditsOf(c), 0)
  return (
    <section className="card flex flex-col p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-ink">{grade}th grade</h2>
          <p className="text-[12px] text-muted">{GRADE_NAMES[grade]} year</p>
        </div>
        <span className="tnum shrink-0 rounded-full bg-sunk px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">
          {fmt(credits)} cr
        </span>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        {courses.map((course) => (
          <PlannedCourse
            key={course.id}
            course={course}
            grade={grade}
            warnings={warningsFor(course, grade, plan, index)}
            stats={statsByCourse[course.id]}
            onRemove={() => onRemove(course.id)}
            onMove={(to) => onMove(course.id, to)}
            onOpen={() => onOpenCourse(course.id)}
          />
        ))}
        {!courses.length && (
          <p className="rounded-2xl border border-dashed border-line px-3 py-6 text-center text-[12.5px] leading-snug text-muted">
            Nothing here yet.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-2.5 text-[13px] font-semibold text-muted transition-colors hover:border-brand/50 hover:bg-brand-wash hover:text-brand"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M10 5v10M5 10h10" strokeLinecap="round" />
        </svg>
        Add a class
      </button>
    </section>
  )
}

function PlannedCourse({ course, grade, warnings, stats, onRemove, onMove, onOpen }) {
  const [menu, setMenu] = useState(false)
  const s = stats || { count: 0, hasEnough: false }
  const verdict = verdictFor(s.hasEnough ? s.takeAgain : null)
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: deptHue(course.dept) }} />
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {deptShort(course.dept)}
            </span>
          </span>
          <span className="mt-1 block text-[14px] font-semibold leading-snug text-ink hover:text-brand">
            {course.name}
          </span>
        </button>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="rounded-full p-1 text-muted hover:text-ink"
            aria-label={`Options for ${course.name}`}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <circle cx="10" cy="5" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="15" r="1.5" />
            </svg>
          </button>
          {menu && (
            <div className="absolute right-0 top-7 z-20 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-lift animate-pop-in">
              <div className="eyebrow border-b border-line px-3 py-2">Move to</div>
              {PLAN_GRADES.filter((g) => g !== grade).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    onMove(g)
                    setMenu(false)
                  }}
                  className="block w-full px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-brand-wash"
                >
                  {g}th grade
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onRemove()
                  setMenu(false)
                }}
                className="block w-full border-t border-line px-3 py-2 text-left text-[13px] font-semibold text-warn hover:bg-warn-soft"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
        <LevelPill level={course.level} />
        <span className="tnum">{fmt(creditsOf(course))} cr</span>
        {s.hasEnough && (
          <span className="font-semibold" style={{ color: verdict.tone }}>
            · {Math.round(s.takeAgain * 100)}% retake
          </span>
        )}
        {!s.hasEnough && s.count > 0 && <span>· {s.count} of {MIN_REVIEWS} reviews</span>}
      </div>

      {warnings.map((w) => (
        <div
          key={w.text}
          className="mt-2 flex items-start gap-1.5 rounded-lg bg-warn-soft px-2 py-1.5 text-[11.5px] leading-snug text-warn"
        >
          <svg viewBox="0 0 20 20" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 6.5v4.5M10 13.8v.2" strokeLinecap="round" />
            <circle cx="10" cy="10" r="7.5" />
          </svg>
          {w.text}
        </div>
      ))}
    </div>
  )
}

function ClassPicker({ grade, courses, statsByCourse, taken, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const [anyGrade, setAnyGrade] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    let pool = courses.filter((c) => !taken.includes(c.id))
    if (!anyGrade) pool = pool.filter((c) => !c.grades.length || c.grades.includes(grade))
    const list = q
      ? pool.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.code || '').toLowerCase().includes(q) ||
            c.dept.toLowerCase().includes(q)
        )
      : [...pool].sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name))
    return list.slice(0, 60)
  }, [courses, taken, query, grade, anyGrade])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/35 backdrop-blur-sm sm:items-center sm:p-6" role="dialog">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-4xl bg-surface shadow-lift animate-sheet-up sm:rounded-4xl">
        <div className="border-b border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-semibold text-ink">Add to {grade}th grade</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted hover:text-ink">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <input
            className="field mt-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classes"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setAnyGrade((v) => !v)}
            className={`chip mt-2.5 ${anyGrade ? 'chip-on' : ''}`}
          >
            {anyGrade ? 'Showing every class' : `Only classes open to ${grade}th`}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-brand-wash"
            >
              <span className="min-w-0">
                <DeptTag dept={c.dept} group={deptShort(c.dept)} />
                <span className="mt-0.5 block truncate text-[14.5px] font-semibold text-ink">{c.name}</span>
                <span className="block truncate text-[12px] text-muted">
                  {gradeLabel(c.grades)} · {fmt(creditsOf(c))} cr ·{' '}
                  {statsByCourse[c.id]?.count || 0} reviews
                </span>
              </span>
              <LevelPill level={c.level} />
            </button>
          ))}
          {!results.length && (
            <p className="px-4 py-8 text-center text-[13.5px] text-muted">
              Nothing matches that{anyGrade ? '' : ` for ${grade}th grade`}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(n).replace(/^0/, '')
}
