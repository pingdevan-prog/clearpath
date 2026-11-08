import { useState } from 'react'
import { CATALOG_SOURCE } from '../data/courses'
import { FACTORS, MIN_REVIEWS, RAMP, toneFor, deptHue, deptShort } from '../lib/metrics'
import { creditLabel, gradeLabel, ordinal } from '../lib/stats'
import {
  Avatar,
  BackButton,
  CompareButton,
  DeptBadge,
  Icon,
  LevelPill,
  NeedsMoreReviews,
  SampleChip,
  ScoreBar,
  TagRow,
  TakeAgainDial,
} from './Bits'

export function CourseView({ course, stats, reviews, compared, onToggleCompare, onBack, onWrite }) {
  const [showAll, setShowAll] = useState(false)
  const s = stats
  const withNotes = reviews.filter((r) => r.note)
  const visible = showAll ? reviews : reviews.slice(0, 6)

  return (
    <div className="wrap py-5 sm:py-8">
      <BackButton onClick={onBack} label="All classes" />

      {/* The header takes the department's colour, so every class page feels like its subject. */}
      <header
        className="dept-soft relative mt-3 overflow-hidden rounded-4xl p-5 sm:p-7"
        style={{ '--dept': deptHue(course.dept) }}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <DeptBadge dept={course.dept} size={52} onTint className="hidden sm:grid" />
            <div className="min-w-0 flex-1">
              <p className="dept-ink text-[13px] font-semibold">
                {deptShort(course.dept)}
                {course.group && course.group !== course.dept ? ` · ${course.group}` : ''}
              </p>
              <h1 className="mt-1 text-[27px] font-bold leading-[1.1] text-ink sm:text-[36px]">{course.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13.5px] text-ink-2">
                <LevelPill level={course.level} />
                <span>{gradeLabel(course.grades)}</span>
                {creditLabel(course.credits) && <span>· {creditLabel(course.credits)}</span>}
                {course.code && <span className="tnum">· {course.code}</span>}
                {course.fee && <span>· Course fee</span>}
              </div>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <CompareButton on={compared} onClick={onToggleCompare} big />
            <button type="button" className="btn-primary flex-1 sm:flex-none" onClick={() => onWrite(course.id)}>
              <Icon name="pen" size={17} />
              Review this class
            </button>
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
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
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[13px] text-muted">
                <span>
                  <span className="tnum font-semibold text-ink-2">{s.count}</span> reviews
                </span>
                {s.hoursMode && (
                  <span>
                    Usually <span className="font-semibold text-ink-2">{s.hoursMode} hrs/week</span> outside class
                  </span>
                )}
                {s.divisiveness > 0.7 && (
                  <span className="tone-text font-semibold" style={{ '--tone': RAMP[6] }}>
                    Students are split on this one
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[17px] font-bold text-ink">Not enough reviews yet</h2>
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
            <h2 className="text-[15px] font-bold text-ink">Before you can take it</h2>
            <div className="mt-3.5 space-y-3">
              <Fact label="Prerequisite">
                {course.prereq && course.prereq !== 'None' ? (
                  <span className="text-ink">{course.prereq}</span>
                ) : course.prereq === 'None' ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-good-ink">
                    <Icon name="check" size={16} stroke={2.4} />
                    None. Open to anyone in the grade range
                  </span>
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
        </section>
      </div>

      {/* The catalog's own description */}
      <section className="card mt-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-[15px] font-bold text-ink">What the course is</h2>
          <span className="text-[12px] text-muted">From the {CATALOG_SOURCE.school} catalog</span>
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
            invented to fill the gap. Ask a counselor, or review it yourself once you have taken it.
          </p>
        )}
      </section>

      {/* What it's like day to day */}
      {s.hasEnough && s.tags.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="text-[15px] font-bold text-ink">What it's like day to day</h2>
          <p className="mt-1 text-[13px] text-muted">
            What students tagged, and the share who tagged it.
          </p>
          <div className="mt-3.5">
            <TagRow tags={s.tags} limit={8} />
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-9">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[20px] font-bold text-ink">
            {reviews.length ? `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}` : 'Reviews'}
          </h2>
          {withNotes.length > 0 && (
            <span className="text-[13px] text-muted">
              {withNotes.length} with something written
            </span>
          )}
        </div>

        {!reviews.length ? (
          <div className="card mt-3 px-5 py-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
              <Icon name="pen" size={22} />
            </span>
            <h3 className="mt-4 text-[16px] font-bold text-ink">Nobody has reviewed this yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
              If you have taken {course.name}, you are the one person who can fix that. Four taps and
              a yes or no.
            </p>
            <button type="button" className="btn-primary mt-5" onClick={() => onWrite(course.id)}>
              Be the first review
              <Icon name="arrow-right" size={17} stroke={2.2} />
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
      <span className="pt-px text-[13px] font-medium text-muted">{label}</span>
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
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${
            review.takeAgain ? 'bg-good-soft text-good-ink' : 'bg-warn-soft text-warn-ink'
          }`}
        >
          <Icon name={review.takeAgain ? 'check' : 'x'} size={13} stroke={2.6} />
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
                <span className="tone-text tnum text-[16px] font-bold leading-none" style={{ '--tone': tone }}>
                  {typeof v === 'number' ? v : '–'}
                </span>
                <span className="text-[10.5px] text-muted">/10</span>
              </div>
              <div className="mt-1 text-[12px] font-medium text-muted">{f.short}</div>
            </div>
          )
        })}
      </div>

      {review.note && (
        <p className="mt-3.5 border-t border-line pt-3 text-[14.5px] leading-relaxed text-ink-2">{review.note}</p>
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
