import { useMemo, useState } from 'react'
import { PLAN_GRADES } from '../lib/store'
import { buildNameIndex, creditsOf, warningsFor } from '../lib/plan'
import { PLAN_NAME, PLAN_URL, REQUIREMENTS, TOTAL_CREDITS, tallyCredits } from '../data/graduation'
import { MIN_REVIEWS, deptHue, deptShort, verdictFor } from '../lib/metrics'
import { gradeLabel } from '../lib/stats'
import { DeptBadge, Empty, Icon, LevelPill, tick } from './Bits'
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
  school,
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
        (n, g) => n + planned[g].reduce((m, c) => m + warningsFor(c, g, plan, index, courseMap).length, 0),
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
          <h1 className="text-[28px] font-bold leading-tight text-ink sm:text-[34px]">Your four year plan</h1>
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
                  className="rounded-full bg-warn-soft px-3 py-1.5 text-[13px] font-semibold text-warn-ink"
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
                className="text-[13px] font-semibold text-muted transition-colors hover:text-warn-ink"
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
            school={school}
            onApplyPlan={onApplyPlan}
            onAddToPlan={onAdd}
            onRemoveFromPlan={onRemove}
            onOpenCourse={onOpenCourse}
            onClose={() => setAdvisorOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdvisorOpen(true)}
            className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl2 bg-brand p-4 text-left text-white shadow-glow transition-[transform,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:bg-brand-press active:scale-[0.99] sm:p-5"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <Icon name="sparkle" size={24} stroke={1.9} />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-[16px] font-bold">Ask the advisor to build it for you</span>
              <span className="mt-0.5 block text-[13.5px] leading-snug text-white/95">
                Tell it what you want to study, how hard you want to work, or what you like. It reads every review and
                every prerequisite.
              </span>
            </span>
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
              <Icon name="arrow-right" size={18} stroke={2.2} />
            </span>
          </button>
        )}
      </section>

      <CreditSummary tally={tally} warnings={totalWarnings} courses={all} />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_GRADES.map((grade) => (
          <YearColumn
            key={grade}
            grade={grade}
            courses={planned[grade]}
            plan={plan}
            index={index}
            courseMap={courseMap}
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
        <a
          href={PLAN_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-ink underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
        >
          {PLAN_NAME}
        </a>{' '}
        plan Westlake publishes, {TOTAL_CREDITS} credits in all. Which course counts for which
        requirement has exceptions this app does not know, so treat this as a draft to bring to your
        counselor, not as the final word.
      </p>
    </div>
  )
}

function CreditSummary({ tally, warnings, courses }) {
  // Credits by department, so the bar shows what the four years are made of.
  const mix = useMemo(() => {
    const by = {}
    for (const c of courses) by[c.dept] = (by[c.dept] || 0) + creditsOf(c)
    return Object.entries(by)
      .filter(([, n]) => n > 0)
      .sort((x, y) => y[1] - x[1])
  }, [courses])

  return (
    <section className="card mt-4 p-5" aria-labelledby="credits-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="credits-title" className="section-title">
          Credits planned
        </h2>
        <p className="text-[13.5px] text-muted">
          <span className="tnum font-bold text-ink">{fmt(tally.total)}</span> of {TOTAL_CREDITS}
          {warnings > 0 && (
            <span>
              {' '}
              · {warnings} prerequisite {warnings === 1 ? 'note' : 'notes'}
            </span>
          )}
        </p>
      </div>

      <div className="mt-3.5 flex h-3 w-full gap-[3px] overflow-hidden rounded-full bg-sunk" role="img" aria-label="Credits by department">
        {mix.map(([dept, n]) => (
          <span
            key={dept}
            className="h-full transition-[width] duration-700 ease-out first:rounded-l-full last:rounded-r-full"
            style={{ width: `${Math.min(1, n / TOTAL_CREDITS) * 100}%`, background: deptHue(dept) }}
            title={`${deptShort(dept)}: ${fmt(n)} credits`}
          />
        ))}
      </div>
      {mix.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {mix.map(([dept, n]) => (
            <span key={dept} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: deptHue(dept) }} />
              {deptShort(dept)}
              <span className="tnum font-semibold text-muted">{fmt(n)}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-muted">Nothing planned yet. Add classes below, or ask the advisor.</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3.5 border-t border-line pt-4 sm:grid-cols-3 lg:grid-cols-5">
        {REQUIREMENTS.map((req) => {
          const got = tally.byBucket[req.key] || 0
          const done = got >= req.credits
          return (
            <div key={req.key} title={req.note}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] font-medium text-ink-2">{req.label}</span>
                <span
                  className={`tnum inline-flex items-center gap-0.5 text-[12px] font-semibold ${done ? 'text-good-ink' : 'text-muted'}`}
                >
                  {done && <Icon name="check" size={12} stroke={3} />}
                  {fmt(got)}/{fmt(req.credits)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunk">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${done ? 'bg-good' : 'bg-brand-mid'}`}
                  style={{ width: `${Math.min(1, got / req.credits) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function YearColumn({ grade, courses, plan, index, courseMap, statsByCourse, onAdd, onRemove, onMove, onOpenCourse }) {
  const credits = courses.reduce((n, c) => n + creditsOf(c), 0)
  return (
    <section className="flex flex-col rounded-xl2 border border-line/60 bg-sunk/60 p-3">
      <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="tnum grid h-9 w-9 place-items-center rounded-xl bg-surface text-[15px] font-bold text-brand-ink shadow-card">
            {grade}
          </span>
          <div>
            <h2 className="text-[15.5px] font-bold leading-tight text-ink">{grade}th grade</h2>
            <p className="text-[12px] text-muted">{GRADE_NAMES[grade]} year</p>
          </div>
        </div>
        <span className="tnum shrink-0 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink-2 shadow-card">
          {fmt(credits)} cr
        </span>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        {courses.map((course) => (
          <PlannedCourse
            key={course.id}
            course={course}
            grade={grade}
            warnings={warningsFor(course, grade, plan, index, courseMap)}
            stats={statsByCourse[course.id]}
            onRemove={() => onRemove(course.id)}
            onMove={(to) => onMove(course.id, to)}
            onOpen={() => onOpenCourse(course.id)}
          />
        ))}
        {!courses.length && (
          <p className="px-3 py-5 text-center text-[13px] leading-snug text-muted">Nothing here yet.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink/15 py-2.5 text-[13px] font-semibold text-ink-2 transition-[background-color,border-color,color,transform] duration-200 hover:border-brand/50 hover:bg-brand-wash hover:text-brand-ink active:scale-[0.98]"
      >
        <Icon name="plus" size={16} stroke={2.4} />
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
    <div className="group/item animate-rise-in rounded-2xl bg-surface p-3 shadow-card transition-shadow duration-200 hover:shadow-lift">
      <div className="flex items-start gap-2.5">
        <DeptBadge dept={course.dept} size={32} className="mt-0.5" />
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="block text-[14px] font-semibold leading-snug text-ink transition-colors hover:text-brand-ink">
            {course.name}
          </span>
          <span className="dept-ink block truncate text-[12px] font-medium" style={{ '--dept': deptHue(course.dept) }}>
            {deptShort(course.dept)}
          </span>
        </button>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-sunk hover:text-ink"
            aria-label={`Options for ${course.name}`}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <circle cx="10" cy="5" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="15" r="1.5" />
            </svg>
          </button>
          {menu && (
            <div className="absolute right-0 top-8 z-20 w-44 origin-top-right animate-pop-in overflow-hidden rounded-xl border border-line bg-raised shadow-lift">
              <div className="border-b border-line px-3 py-2 text-[12px] font-semibold text-muted">Move to</div>
              {PLAN_GRADES.filter((g) => g !== grade).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    tick()
                    onMove(g)
                    setMenu(false)
                  }}
                  className="block w-full px-3 py-2 text-left text-[13.5px] text-ink-2 transition-colors hover:bg-brand-wash"
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
                className="block w-full border-t border-line px-3 py-2 text-left text-[13.5px] font-semibold text-warn-ink transition-colors hover:bg-warn-soft"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-[42px] text-[12px] text-muted">
        <LevelPill level={course.level} />
        <span className="tnum">{fmt(creditsOf(course))} cr</span>
        {s.hasEnough && (
          <span className="tone-text font-semibold" style={{ '--tone': verdict.tone }}>
            · {Math.round(s.takeAgain * 100)}% retake
          </span>
        )}
        {!s.hasEnough && s.count > 0 && <span>· {s.count} of {MIN_REVIEWS} reviews</span>}
      </div>

      {warnings.map((w) => (
        <div
          key={w.text}
          className="cp-plan-note mt-1.5 flex items-start gap-1.5 pl-[42px] text-[12px] leading-snug text-muted"
        >
          <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-scale-6/70" aria-hidden />
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
    <div
      className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Add a class to ${grade}th grade`}
    >
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="relative flex max-h-[85vh] w-full max-w-lg animate-sheet-up flex-col overflow-hidden rounded-t-4xl bg-raised shadow-lift sm:rounded-4xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="border-b border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[17px] font-bold text-ink">Add to {grade}th grade</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted transition-colors hover:bg-sunk hover:text-ink"
              aria-label="Close"
            >
              <Icon name="x" size={18} stroke={2.2} />
            </button>
          </div>
          <div className="relative mt-3">
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field pl-11"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search classes"
              autoFocus
            />
          </div>
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
              onClick={() => {
                tick()
                onPick(c.id)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-wash"
            >
              <DeptBadge dept={c.dept} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold text-ink">{c.name}</span>
                <span className="block truncate text-[12.5px] text-muted">
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
