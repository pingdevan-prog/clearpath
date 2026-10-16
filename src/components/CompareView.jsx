import { useMemo, useState } from 'react'
import { FACTORS, MIN_REVIEWS, bandLabel, deptShort, toneFor, verdictFor } from '../lib/metrics'
import { creditLabel, gradeLabel } from '../lib/stats'
import { DeptTag, Empty, LevelPill } from './Bits'

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
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[32px]">
        Compare two classes
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
        The choice is almost never "is this class good". It is "which of these two". Put them next to
        each other.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Slot course={a} stats={a && statsByCourse[a.id]} onPick={() => setPicking(0)} onClear={() => set(0, null)} />
        <Slot course={b} stats={b && statsByCourse[b.id]} onPick={() => setPicking(1)} onClear={() => set(1, null)} />
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
          <h2 className="text-[17px] font-semibold text-ink">
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
        className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-line bg-surface/60 px-4 py-6 text-center transition-colors hover:border-brand/50 hover:bg-brand-wash"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-[13.5px] font-semibold text-ink-2">Pick a class</span>
      </button>
    )
  }
  const verdict = verdictFor(stats?.hasEnough ? stats.takeAgain : null)
  return (
    <div className="card flex min-h-[7.5rem] flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <DeptTag dept={course.dept} group={deptShort(course.dept)} />
        <button
          type="button"
          onClick={onClear}
          className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-muted hover:text-ink"
          aria-label="Remove"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <h2 className="mt-1.5 text-[15.5px] font-semibold leading-snug tracking-[-0.015em] text-ink">
        {course.name}
      </h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
        <LevelPill level={course.level} />
        <span>{gradeLabel(course.grades)}</span>
      </div>
      <div className="mt-auto pt-3">
        <span className="text-[12.5px] font-semibold" style={{ color: verdict.tone }}>
          {verdict.text}
        </span>
        <span className="ml-1.5 text-[12px] text-muted">
          {stats?.count ? `· ${stats.count} reviews` : '· no reviews'}
        </span>
      </div>
      <button type="button" onClick={onPick} className="mt-2 text-left text-[12.5px] font-semibold text-brand">
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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/35 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-4xl bg-surface shadow-lift animate-sheet-up sm:rounded-4xl">
        <div className="border-b border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-semibold text-ink">Pick a class</h3>
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
          {!query && <p className="mt-2 text-[12px] text-muted">Most reviewed first.</p>}
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
                <span className="block truncate text-[14.5px] font-semibold text-ink">{c.name}</span>
                <span className="block truncate text-[12px] text-muted">
                  {c.group || c.dept} · {statsByCourse[c.id]?.count || 0} reviews
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
        <section className="card p-5">
          <div className="eyebrow">The short version</div>
          <p className="mt-2 text-[16px] leading-relaxed text-ink">{takeaway(a, b, sa, sb)}</p>
        </section>
      )}

      <section className="card overflow-hidden">
        <Row label="Would take it again" first>
          {[
            [sa, a],
            [sb, b],
          ].map(([s], i) => {
            const v = s.hasEnough ? s.takeAgain : null
            const verdict = verdictFor(v)
            return (
              <div key={i}>
                <div className="tnum text-[24px] font-semibold leading-none" style={{ color: verdict.tone }}>
                  {v == null ? '—' : `${Math.round(v * 100)}%`}
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
              const tone = v == null ? '#CDD2DE' : toneFor(f.key, v)
              return (
                <div key={i}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="tnum text-[20px] font-semibold leading-none" style={{ color: tone }}>
                      {v == null ? '—' : v.toFixed(1)}
                    </span>
                    {better && (
                      <span className="rounded-full bg-good-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.07em] text-good">
                        {f.polarity === 'benefit' ? 'Higher' : 'Lighter'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunk">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
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
                <span className="font-medium text-good">None</span>
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
                className="mt-2 text-[12.5px] font-semibold text-brand hover:text-brand-deep"
              >
                Open class →
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
    <div className={`${first ? '' : 'border-t border-line'} px-4 py-3.5 sm:px-5`}>
      <div className="eyebrow">{label}</div>
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
