import { useState } from 'react'
import { CATALOG_SOURCE, COURSE_MAP } from '../data/courses'
import { FACTORS, MIN_REVIEWS, bandLabel, toneFor, deptHue } from '../lib/metrics'
import { creditLabel, gradeLabel, ordinal } from '../lib/stats'
import {
  Avatar,
  BackButton,
  CompareButton,
  DeptTag,
  LevelPill,
  NeedsMoreReviews,
  SampleChip,
  ScoreBar,
  TagRow,
  TakeAgainDial,
} from './Bits'

export function CourseView({ course, stats, reviews, compared, onToggleCompare, onBack, onWrite, onOpenCourse }) {
  const [showAll, setShowAll] = useState(false)
  const s = stats
  const withNotes = reviews.filter((r) => r.note)
  const visible = showAll ? reviews : reviews.slice(0, 6)

  // Other courses that name this one as a prerequisite — the next step up.
  const leadsTo = Object.values(COURSE_MAP)
    .filter((c) => c.id !== course.id && c.prereq && c.prereq !== 'None' && mentions(c.prereq, course.name))
    .slice(0, 6)

  return (
    <div className="wrap py-5 sm:py-8">
      <BackButton onClick={onBack} label="All classes" />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <DeptTag dept={course.dept} group={course.group ? `${course.dept} · ${course.group}` : course.dept} />
          <h1 className="mt-2 text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[34px]">
            {course.name}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13.5px] text-muted">
            <LevelPill level={course.level} />
            <span>{gradeLabel(course.grades)}</span>
            {creditLabel(course.credits) && <span>· {creditLabel(course.credits)}</span>}
            {course.code && <span>· {course.code}</span>}
            {course.fee && <span>· Course fee</span>}
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <CompareButton on={compared} onClick={onToggleCompare} />
          <button
            type="button"
            className="btn-primary flex-1 sm:flex-none"
            onClick={() => onWrite(course.id)}
          >
            Review this class
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        {/* Scores */}
        <section className="card p-5">
          {s.hasEnough ? (
            <>
              <TakeAgainDial share={s.takeAgain} count={s.takeAgainCount} />
              <div className="mt-6 space-y-4">
                {FACTORS.map((f, i) => (
                  <ScoreBar key={f.key} factorKey={f.key} value={s.averages[f.key]} delay={i * 90} size="lg" />
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[13px] text-muted">
                <span>
                  <span className="font-semibold text-ink-2">{s.count}</span> reviews
                </span>
                {s.hoursMode && (
                  <span>
                    Usually <span className="font-semibold text-ink-2">{s.hoursMode} hrs/week</span> outside class
                  </span>
                )}
                {s.divisiveness > 0.7 && <span className="font-semibold text-scale-6">Students are split on this one</span>}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[17px] font-semibold text-ink">Not enough reviews yet</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                Clearpath hides averages under {MIN_REVIEWS} reviews. A number built on one or two
                opinions is worse than no number at all, so here is what the school says about the
                class instead.
              </p>
              <div className="mt-4">
                <NeedsMoreReviews count={s.count} onWrite={() => onWrite(course.id)} />
              </div>
            </>
          )}
        </section>

        {/* Facts from the catalog */}
        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="text-[15px] font-semibold text-ink">Before you can take it</h2>
            <div className="mt-3 space-y-3">
              <Fact label="Prerequisite">
                {course.prereq && course.prereq !== 'None' ? (
                  <span className="text-ink">{course.prereq}</span>
                ) : course.prereq === 'None' ? (
                  <span className="text-good">None — open to anyone in the grade range</span>
                ) : (
                  <span className="text-muted">Not listed in the catalog</span>
                )}
              </Fact>
              <Fact label="Open to">{gradeLabel(course.grades)}</Fact>
              {creditLabel(course.credits) && <Fact label="Credit">{creditLabel(course.credits)}</Fact>}
              {course.note && <Fact label="Note">{course.note}</Fact>}
              {course.fee && <Fact label="Fee">This course charges a participation fee</Fact>}
              {course.alsoIn?.length > 0 && (
                <Fact label="Also counts in">{course.alsoIn.join(', ')}</Fact>
              )}
            </div>
          </div>

          {leadsTo.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[15px] font-semibold text-ink">This class unlocks</h2>
              <p className="mt-1 text-[13px] text-muted">Courses that list it as a prerequisite.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {leadsTo.map((c) => (
                  <button key={c.id} type="button" className="chip" onClick={() => onOpenCourse(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* The catalog's own description */}
      <section className="card mt-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-[15px] font-semibold text-ink">What the course is</h2>
          <span className="text-[11.5px] text-muted">From the {CATALOG_SOURCE.school} catalog</span>
        </div>
        {course.summary ? (
          <div className="mt-3 space-y-3">
            {course.summary.split('\n\n').map((para, i) => (
              <p key={i} className="text-[14.5px] leading-relaxed text-ink-2">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
            The catalog lists this course but does not publish a description for it. Nothing has been
            invented to fill the gap — ask a counselor, or review it yourself once you have taken it.
          </p>
        )}
      </section>

      {/* What it's like day to day */}
      {s.hasEnough && s.tags.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="text-[15px] font-semibold text-ink">What it's like day to day</h2>
          <p className="mt-1 text-[13px] text-muted">
            What students tagged, and the share who tagged it.
          </p>
          <div className="mt-3.5">
            <TagRow tags={s.tags} limit={8} />
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
            {reviews.length ? `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}` : 'Reviews'}
          </h2>
          {withNotes.length > 0 && (
            <span className="text-[13px] text-muted">
              {withNotes.length} with something written
            </span>
          )}
        </div>

        {!reviews.length ? (
          <div className="card mt-3 px-5 py-9 text-center">
            <h3 className="text-[16px] font-semibold text-ink">Nobody has reviewed this yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
              If you have taken {course.name}, you are the one person who can fix that. Four taps and
              a yes or no.
            </p>
            <button type="button" className="btn-primary mt-5" onClick={() => onWrite(course.id)}>
              Be the first review
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-3">
              {visible.map((r, i) => (
                <ReviewCard key={r.id} review={r} index={i} />
              ))}
            </div>
            {reviews.length > visible.length && (
              <div className="mt-4 flex justify-center">
                <button type="button" className="btn-ghost" onClick={() => setShowAll(true)}>
                  Show all {reviews.length} reviews
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Fact({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="eyebrow pt-0.5">{label}</span>
      <span className="text-[14px] leading-relaxed text-ink-2">{children}</span>
    </div>
  )
}

function ReviewCard({ review, index }) {
  const who = review.anon === false && review.author ? review.author : null
  return (
    <article className="card p-4 animate-rise-in" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {who ? (
            <Avatar profile={who} size={34} />
          ) : (
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-sunk text-muted">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="10" cy="7.5" r="3" />
                <path d="M4.5 16.5c1.1-2.7 3.1-3.9 5.5-3.9s4.4 1.2 5.5 3.9" strokeLinecap="round" />
              </svg>
            </span>
          )}
          <div className="text-[13px] leading-tight">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              {who ? who.name : 'Anonymous'}
              {review.sample && <SampleChip />}
            </div>
            <div className="text-muted">
              {review.gradeTaken ? `Took it in ${ordinal(review.gradeTaken)} grade` : 'Grade not given'}
              {review.year ? ` · ${review.year}` : ''}
            </div>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.07em]"
          style={{
            background: review.takeAgain ? '#DFF5EF' : '#FDECEA',
            color: review.takeAgain ? '#0E9F7E' : '#D9534A',
          }}
        >
          {review.takeAgain ? 'Would retake' : 'Would not retake'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {FACTORS.map((f) => {
          const v = review.scores?.[f.key]
          const tone = toneFor(f.key, v)
          return (
            <div key={f.key}>
              <div className="flex items-baseline gap-1">
                <span className="tnum text-[15px] font-semibold leading-none" style={{ color: tone }}>
                  {typeof v === 'number' ? v : '—'}
                </span>
                <span className="text-[10px] text-muted">/10</span>
              </div>
              <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                {f.short}
              </div>
            </div>
          )
        })}
      </div>

      {review.note && (
        <p className="mt-3 border-t border-line pt-3 text-[14px] leading-relaxed text-ink-2">{review.note}</p>
      )}

      {(review.tags?.length > 0 || review.hours) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {review.hours && (
            <span className="rounded-full bg-sunk px-2.5 py-1 text-[11.5px] font-medium text-ink-2">
              {review.hours} hrs/week
            </span>
          )}
          {review.tags?.map((t) => (
            <span key={t} className="rounded-full bg-sunk px-2.5 py-1 text-[11.5px] font-medium text-ink-2">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

/** Loose match: does this prerequisite text name that course? */
function mentions(prereq, name) {
  const p = prereq.toLowerCase()
  const n = name.toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').trim()
  if (n.length < 5) return false
  return p.includes(n)
}
