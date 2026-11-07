import { useMemo, useState } from 'react'
import { FACTORS, MIN_REVIEWS, NO_TONE, bandLabel, deptHue, deptShort, toneFor, verdictFor } from '../lib/metrics'
import { creditLabel, gradeLabel } from '../lib/stats'
import { DeptBadge, Empty, Icon, LevelPill, tick } from './Bits'

/** Two classes, side by side, on the things that decide it. */
export function CompareView({ courses, statsByCourse, compare, onSetCompare, onOpenCourse, onBrowse }) {
  const [picking, setPicking] = useState(null) // 0 | 1 | null

  const a = courses.find((c) => c.id === compare[0]) || null
  const b = courses.find((c) => c.id === compare[1]) || null

  const set = (slot, id) => {
    const next = [compare[0] || null, compare[1] || null]
    next[slot] = id
    onSetCompare(next.filter(Boolean))
    setPicking(null)
  }

  if (!courses.length) {
    return (
      <div className="wrap py-10">
        <Empty title="No catalog loaded" body="Switch to a school with its courses loaded to compare classes." />
      </div>
    )
  }

  return (
    <div className="wrap py-6 sm:py-9">
      <h1 className="text-[28px] font-bold leading-tight text-ink sm:text-[34px]">Compare two classes</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
        The choice is almost never "is this class good". It is "which of these two". Put them next to
        each other.
      </p>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <Slot course={a} stats={a && statsByCourse[a.id]} onPick={() => setPicking(0)} onClear={() => set(0, null)} />
        <Slot course={b} stats={b && statsByCourse[b.id]} onPick={() => setPicking(1)} onClear={() => set(1, null)} />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-[12px] font-bold text-ink-2 shadow-card"
        >
          vs
        </span>
      </div>

      {picking !== null && (
        <Picker
          courses={courses}
          statsByCourse={statsByCourse}
          taken={[compare[0], compare[1]].filter(Boolean)}
          onPick={(id) => set(picking, id)}
          onClose={() => setPicking(null)}
        />
      )}

      {a && b ? (
        <Comparison
          a={a}
          b={b}
          sa={statsByCourse[a.id]}
          sb={statsByCourse[b.id]}
          onOpenCourse={onOpenCourse}
        />
      ) : (
        <div className="card mt-4 px-5 py-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
            <svg viewBox="0 0 22 22" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
              <rect x="3" y="4" width="6.5" height="14" rx="2" />
              <rect x="12.5" y="4" width="6.5" height="9" rx="2" />
            </svg>
          </span>
          <h2 className="mt-4 text-[17px] font-bold text-ink">
            {a || b ? 'Pick one more class' : 'Pick two classes'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
            Tap an empty slot above, or hit the compare button on any class while you browse.
          </p>
          <button type="button" className="btn-ghost mt-5" onClick={onBrowse}>
            Browse classes
          </button>
        </div>
      )}
    </div>
  )
}

function Slot({ course, stats, onPick, onClear }) {
  if (!course) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="group flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-line bg-surface/60 px-4 py-6 text-center transition-[background-color,border-color,transform] duration-200 hover:border-brand/50 hover:bg-brand-wash active:scale-[0.98]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand-ink transition-transform duration-300 ease-out group-hover:scale-110">
          <Icon name="plus" size={18} stroke={2.4} />
        </span>
        <span className="text-[13.5px] font-semibold text-ink-2">Pick a class</span>
      </button>
    )
  }
  const verdict = verdictFor(stats?.hasEnough ? stats.takeAgain : null)
  return (
    <div className="card dept-glow flex min-h-[9rem] animate-pop-in flex-col p-4" style={{ '--dept': deptHue(course.dept) }}>
      <div className="flex items-start justify-between gap-2">
        <DeptBadge dept={course.dept} size={34} />
        <button
          type="button"
          onClick={onClear}
          className="-mr-1.5 -mt-1.5 shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-sunk hover:text-ink"
          aria-label={`Remove ${course.name}`}
        >
          <Icon name="x" size={16} stroke={2.2} />
        </button>
      </div>
      <p className="dept-ink mt-2.5 text-[12px] font-semibold" style={{ '--dept': deptHue(course.dept) }}>
        {deptShort(course.dept)}
      </p>
      <h2 className="mt-0.5 text-[15.5px] font-bold leading-snug tracking-[-0.015em] text-ink">{course.name}</h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
        <LevelPill level={course.level} />
        <span>{gradeLabel(course.grades)}</span>
      </div>
      <div className="mt-auto pt-3">
        <span className="tone-text text-[12.5px] font-bold" style={{ '--tone': verdict.tone }}>
          {verdict.text}
        </span>
        <span className="ml-1.5 text-[12px] text-muted">
          {stats?.count ? `· ${stats.count} reviews` : '· no reviews'}
        </span>
      </div>
      <button
        type="button"
        onClick={onPick}
        className="mt-2 inline-flex items-center gap-1 self-start rounded-full text-[12.5px] font-semibold text-brand-ink transition-colors hover:text-brand-deep"
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 7h11l-3-3M16 13H5l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Swap
      </button>
    </div>
  )
}

function Picker({ courses, statsByCourse, taken, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = courses.filter((c) => !taken.includes(c.id))
    const list = q
      ? pool.filter((c) => c.name.toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q))
      : [...pool].sort(
          (x, y) => (statsByCourse[y.id]?.count || 0) - (statsByCourse[x.id]?.count || 0) || x.name.localeCompare(y.name)
        )
    return list.slice(0, 40)
  }, [courses, statsByCourse, query, taken])

  return (
    <div
      className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Pick a class"
    >
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="relative flex max-h-[85vh] w-full max-w-lg animate-sheet-up flex-col overflow-hidden rounded-t-4xl bg-raised shadow-lift sm:rounded-4xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="border-b border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[17px] font-bold text-ink">Pick a class</h3>
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
          {!query && <p className="mt-2 text-[12px] text-muted">Most reviewed first.</p>}
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
                  {deptShort(c.dept)} · {statsByCourse[c.id]?.count || 0} reviews
                </span>
              </span>
              <LevelPill level={c.level} />
            </button>
          ))}
          {!results.length && <p className="px-4 py-8 text-center text-[13.5px] text-muted">Nothing matches that.</p>}
        </div>
      </div>
    </div>
  )
}

function Comparison({ a, b, sa, sb, onOpenCourse }) {
  const bothScored = sa.hasEnough && sb.hasEnough

  return (
    <div className="mt-4 space-y-4">
      {bothScored && (
        <section className="flex gap-3.5 rounded-xl2 border border-brand/15 bg-brand-wash p-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-glow">
            <Icon name="sparkle" size={18} stroke={2} />
          </span>
          <p className="text-[15.5px] leading-relaxed text-ink">{takeaway(a, b, sa, sb)}</p>
        </section>
      )}

      <section className="card">
        <div className="sticky top-14 z-10 grid grid-cols-2 gap-3 rounded-t-xl2 border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur-xl sm:px-5">
          {[a, b].map((c) => (
            <div key={c.id} className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: deptHue(c.dept) }} />
              <span className="truncate text-[13px] font-bold text-ink">{c.name}</span>
            </div>
          ))}
        </div>
        <Row label="Would take it again" first>
          {[
            [sa, a],
            [sb, b],
          ].map(([s], i) => {
            const v = s.hasEnough ? s.takeAgain : null
            const verdict = verdictFor(v)
            return (
              <div key={i}>
                <div className="tone-text-lg tnum text-[26px] font-bold leading-none" style={{ '--tone': verdict.tone }}>
                  {v == null ? '–' : `${Math.round(v * 100)}%`}
                </div>
                <div className="mt-1 text-[12px] text-muted">
                  {v == null ? `${s.count} of ${MIN_REVIEWS} reviews` : verdict.text}
                </div>
              </div>
            )
          })}
        </Row>

        {FACTORS.map((f) => (
          <Row key={f.key} label={f.label}>
            {[sa, sb].map((s, i) => {
              const v = s.hasEnough ? s.averages[f.key] : null
              const other = (i === 0 ? sb : sa).hasEnough ? (i === 0 ? sb : sa).averages[f.key] : null
              const better =
                v != null && other != null && v !== other
                  ? f.polarity === 'benefit'
                    ? v > other
                    : v < other
                  : false
              const tone = v == null ? NO_TONE : toneFor(f.key, v)
              return (
                <div key={i}>
                  <div className="flex items-center gap-1.5">
                    <span className="tone-text tnum text-[21px] font-bold leading-none" style={{ '--tone': tone }}>
                      {v == null ? '–' : v.toFixed(1)}
                    </span>
                    {better && (
                      <span className="inline-flex animate-pop-in items-center gap-0.5 rounded-full bg-good-soft px-1.5 py-0.5 text-[11px] font-bold text-good-ink">
                        <Icon name="check" size={11} stroke={3} />
                        {f.polarity === 'benefit' ? 'Higher' : 'Lighter'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunk">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: v == null ? '0%' : `${(v / 10) * 100}%`, background: tone }}
                    />
                  </div>
                  <div className="mt-1 text-[12px] text-muted">{v == null ? 'No scores yet' : bandLabel(f.key, v)}</div>
                </div>
              )
            })}
          </Row>
        ))}

        <Row label="Work outside class">
          {[sa, sb].map((s, i) => (
            <div key={i} className="text-[14px] text-ink-2">
              {s.hoursMode ? `${s.hoursMode} hrs/week` : <span className="text-muted">Not reported</span>}
            </div>
          ))}
        </Row>

        <Row label="What students tag it">
          {[sa, sb].map((s, i) => (
            <div key={i} className="flex flex-wrap gap-1.5">
              {s.tags.slice(0, 3).map((t) => (
                <span key={t.tag} className="rounded-full bg-sunk px-2 py-1 text-[11.5px] font-medium text-ink-2">
                  {t.tag}
                </span>
              ))}
              {!s.tags.length && <span className="text-[13px] text-muted">Nothing tagged</span>}
            </div>
          ))}
        </Row>

        <Row label="Prerequisite">
          {[a, b].map((c, i) => (
            <div key={i} className="text-[13.5px] leading-relaxed">
              {c.prereq && c.prereq !== 'None' ? (
                <span className="text-ink-2">{c.prereq}</span>
              ) : c.prereq === 'None' ? (
                <span className="font-semibold text-good-ink">None</span>
              ) : (
                <span className="text-muted">Not listed</span>
              )}
            </div>
          ))}
        </Row>

        <Row label="Open to">
          {[a, b].map((c, i) => (
            <div key={i} className="text-[13.5px] text-ink-2">
              {gradeLabel(c.grades)}
              {creditLabel(c.credits) ? ` · ${creditLabel(c.credits)}` : ''}
              {c.fee ? ' · Fee' : ''}
            </div>
          ))}
        </Row>

        <Row label="Course description" align="start">
          {[a, b].map((c, i) => (
            <div key={i}>
              <p className="clamp-3 text-[13px] leading-relaxed text-muted">
                {c.summary || 'The catalog does not publish a description for this course.'}
              </p>
              <button
                type="button"
                onClick={() => onOpenCourse(c.id)}
                className="group mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink transition-colors hover:text-brand-deep"
              >
                Open class
                <Icon name="arrow-right" size={15} stroke={2.2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </Row>
      </section>

      {!bothScored && (
        <p className="px-1 text-[13px] leading-relaxed text-muted">
          One of these does not have {MIN_REVIEWS} reviews yet, so its scores stay hidden. The
          catalog facts above still compare fine.
        </p>
      )}
    </div>
  )
}

function Row({ label, children, first = false, align = 'center' }) {
  return (
    <div className={`${first ? '' : 'border-t border-line'} px-4 py-4 sm:px-5`}>
      <div className="text-[13px] font-semibold text-muted">{label}</div>
      <div className={`mt-2 grid grid-cols-2 gap-3 ${align === 'start' ? 'items-start' : 'items-center'}`}>
        {children}
      </div>
    </div>
  )
}

/** One honest sentence about the trade between two classes. */
function takeaway(a, b, sa, sb) {
  const d = (key) => sa.averages[key] - sb.averages[key]
  const parts = []
  const harder = d('difficulty') > 0 ? a : b
  const hardGap = Math.abs(d('difficulty'))
  const workGap = Math.abs(d('workload'))
  const funner = d('fun') > 0 ? a : b
  const funGap = Math.abs(d('fun'))
  const againGap = (sa.takeAgain - sb.takeAgain) * 100

  if (hardGap >= 0.6) {
    parts.push(`${harder.name} is ${hardGap.toFixed(1)} points harder`)
    if (workGap >= 0.6) {
      const heavier = d('workload') > 0 ? a : b
      parts.push(
        heavier.id === harder.id
          ? `and ${workGap.toFixed(1)} more homework`
          : `but ${heavier.name} carries ${workGap.toFixed(1)} more homework`
      )
    }
  } else if (workGap >= 0.6) {
    const heavier = d('workload') > 0 ? a : b
    parts.push(`They are about equally hard, but ${heavier.name} is ${workGap.toFixed(1)} points more homework`)
  } else {
    parts.push('They score about the same on difficulty and homework')
  }

  let sentences = [`${parts.join(', ')}.`]
  if (funGap >= 0.8) sentences.push(`${funner.name} is the more enjoyable hour.`)

  let verdict
  if (Math.abs(againGap) < 8) {
    verdict = 'Students are about equally glad they took either one, so pick on fit, not on score.'
  } else {
    const winner = againGap > 0 ? a : b
    verdict = `${Math.round(Math.abs(againGap))}% more students would retake ${winner.name}.`
  }

  return [...sentences, verdict].join(' ')
}
