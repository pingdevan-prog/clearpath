import { useMemo, useState } from 'react'
import {
  COURSE_TAGS,
  FACTORS,
  GRADE_LEVELS,
  HOURS_BUCKETS,
  SCHOOL_YEARS,
  MIN_REVIEWS,
  bandLabel,
  RAMP,
  deptHue,
  toneFor,
} from '../lib/metrics'
import { ordinal } from '../lib/stats'
import { Avatar, BackButton, DeptBadge, Empty, Icon, LevelPill, tick } from './Bits'

const NOTE_LIMIT = 400
const STEPS = ['Class', 'Scores', 'Details', 'Post']

/**
 * Four steps, one question each screen. Only the class and "would you take it
 * again" are required; every score and every detail can be skipped, because a
 * review someone abandons helps nobody.
 */
export function ReviewForm({ courses, statsByCourse, initialCourseId, profile, onSubmit, onCancel, onOpenCourse }) {
  const [step, setStep] = useState(initialCourseId ? 1 : 0)
  const [courseId, setCourseId] = useState(initialCourseId || null)
  const [scores, setScores] = useState({})
  const [takeAgain, setTakeAgain] = useState(null)
  const [hours, setHours] = useState(null)
  const [gradeTaken, setGradeTaken] = useState(profile?.grade ?? null)
  const [year, setYear] = useState(SCHOOL_YEARS[1])
  const [tags, setTags] = useState([])
  const [note, setNote] = useState('')
  const [anon, setAnon] = useState(true)
  const [done, setDone] = useState(null)

  const course = courses.find((c) => c.id === courseId) || null

  const canContinue =
    (step === 0 && !!course) || (step === 1 && typeof takeAgain === 'boolean') || step === 2 || step === 3

  const goTo = (next) => {
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => {
    setDone(null)
    setCourseId(null)
    setScores({})
    setTakeAgain(null)
    setHours(null)
    setTags([])
    setNote('')
    setAnon(true)
    setStep(0)
  }

  const submit = () => {
    const result = onSubmit({
      courseId: course.id,
      scores,
      takeAgain,
      hours,
      gradeTaken,
      year,
      tags,
      note,
      anon,
    })
    setDone({ id: course.id, name: course.name, count: result.count })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!courses.length) {
    return (
      <div className="wrap py-10">
        <Empty
          title="No catalog to review"
          body="Switch to a school with its course catalog loaded and you can review any class in it."
        />
      </div>
    )
  }

  if (done) {
    return <Confirmation done={done} onOpenCourse={() => onOpenCourse(done.id)} onAgain={reset} />
  }

  return (
    <div className="pb-32 sm:pb-28">
      <div className="wrap pt-5 sm:pt-8">
        <BackButton onClick={onCancel} label="Cancel" />

        <div className="mt-3 max-w-2xl">
          <h1 className="text-[27px] font-bold leading-tight text-ink sm:text-[34px]">Review a class you took</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            Takes about a minute. Rate the class, not the teacher. There is no field for that here, and that is on
            purpose.
          </p>
        </div>

        <Progress step={step} onJump={(i) => i < step && goTo(i)} />
      </div>

      <div className="wrap mt-6">
        <div key={step} className="animate-sheet-up">
          {step === 0 && (
            <ClassStep
              courses={courses}
              statsByCourse={statsByCourse}
              selected={courseId}
              onSelect={(id) => setCourseId(id)}
            />
          )}
          {step === 1 && (
            <ScoreStep
              scores={scores}
              takeAgain={takeAgain}
              setTakeAgain={setTakeAgain}
              onChange={(key, value) => setScores((prev) => ({ ...prev, [key]: value }))}
            />
          )}
          {step === 2 && (
            <DetailStep
              hours={hours}
              setHours={setHours}
              gradeTaken={gradeTaken}
              setGradeTaken={setGradeTaken}
              year={year}
              setYear={setYear}
              tags={tags}
              toggleTag={(t) =>
                setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
              }
            />
          )}
          {step === 3 && (
            <PostStep
              note={note}
              setNote={setNote}
              anon={anon}
              setAnon={setAnon}
              profile={profile}
              course={course}
              scores={scores}
              takeAgain={takeAgain}
              tags={tags}
              hours={hours}
              gradeTaken={gradeTaken}
              year={year}
            />
          )}
        </div>
      </div>

      {/* ------------------------------------------- Sticky step controls */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-surface/90 px-4 pt-3 shadow-bar backdrop-blur-xl backdrop-saturate-150 sm:px-7">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => (step === 0 ? onCancel() : goTo(step - 1))}
            className="btn-ghost py-2.5"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {step === 1 && typeof takeAgain !== 'boolean' && (
              <span className="hidden text-[12.5px] text-muted sm:block">
                Answer the required question to continue
              </span>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={() => goTo(3)}
                className="hidden text-[13px] font-medium text-muted underline underline-offset-4 hover:text-brand-ink sm:block"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => (step === 3 ? submit() : goTo(step + 1))}
              className="btn-primary py-2.5"
            >
              {step === 3 ? 'Post review' : 'Continue'}
              <Icon name={step === 3 ? 'check' : 'arrow-right'} size={17} stroke={2.3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Progress({ step, onJump }) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'todo'
          return (
            <button
              key={label}
              type="button"
              onClick={() => onJump(i)}
              disabled={i >= step}
              className={`flex-1 text-left ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${
                    state === 'current' ? 'bg-brand-mid' : 'bg-brand'
                  }`}
                  style={{ width: state === 'todo' ? '0%' : '100%' }}
                />
              </div>
              <div
                className={`mt-2 text-[12px] font-semibold transition-colors ${
                  state === 'todo' ? 'text-muted' : 'text-brand-ink'
                }`}
              >
                <span className="tnum">{i + 1}</span>
                <span className={`ml-1.5 ${state === 'current' ? 'inline' : 'hidden sm:inline'}`}>{label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* --------------------------------------------------- Step 1: pick a class */
function ClassStep({ courses, statsByCourse, selected, onSelect }) {
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return [...courses]
        .sort((a, b) => (statsByCourse[b.id]?.count || 0) - (statsByCourse[a.id]?.count || 0) || a.name.localeCompare(b.name))
        .slice(0, 24)
    }
    return courses
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.code || '').toLowerCase().includes(q) ||
          c.dept.toLowerCase().includes(q)
      )
      .slice(0, 36)
  }, [courses, statsByCourse, query])

  return (
    <section>
      <h2 className="text-[21px] font-bold text-ink">Which class are you reviewing?</h2>
      <label className="relative mt-4 block max-w-xl">
        <span className="sr-only">Search classes</span>
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing a class name"
          className="field pl-11"
        />
      </label>
      {!query.trim() && (
        <p className="mt-2 text-[12.5px] text-muted">Most reviewed first. Search for anything else.</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const on = selected === c.id
          const count = statsByCourse[c.id]?.count || 0
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                tick()
                onSelect(c.id)
              }}
              aria-pressed={on}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] ${
                on ? 'border-brand bg-brand-wash shadow-card ring-1 ring-brand' : 'border-line bg-surface hover:border-brand/40 hover:shadow-card'
              }`}
            >
              <DeptBadge dept={c.dept} size={38} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
                  <LevelPill level={c.level} />
                  {count === 0 ? 'No reviews yet' : `${count} ${count === 1 ? 'review' : 'reviews'}`}
                </span>
              </span>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-[background-color,border-color] duration-200 ${
                  on ? 'border-brand bg-brand text-white' : 'border-line text-transparent'
                }`}
              >
                {on && <Icon name="check" size={14} stroke={2.8} className="animate-pop-in" />}
              </span>
            </button>
          )
        })}
      </div>
      {!list.length && <p className="mt-6 text-[14px] text-muted">No class matches that. Try fewer words.</p>}
    </section>
  )
}

/* ------------------------------------------------- Step 2: the sliders */
function ScoreStep({ scores, takeAgain, setTakeAgain, onChange }) {
  return (
    <section>
      <h2 className="text-[21px] font-bold text-ink">Score the class</h2>
      <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-muted">
        Drag or tap anywhere on a track. Only the first question is required, the rest you can skip.
      </p>

      <div className="mt-6">
        <TakeAgainCard value={takeAgain} onChange={setTakeAgain} />
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {FACTORS.map((factor, i) => (
          <FactorSlider
            key={factor.key}
            factor={factor}
            value={scores[factor.key]}
            onChange={(v) => onChange(factor.key, v)}
            index={i}
          />
        ))}
      </div>
    </section>
  )
}

/** The one required answer, and the number every other screen leads with. */
function TakeAgainCard({ value, onChange }) {
  const answered = typeof value === 'boolean'
  const pick = (v) => {
    tick(12)
    onChange(v)
  }
  return (
    <div
      className={`rounded-xl2 border bg-surface p-5 shadow-card transition-colors duration-300 ${
        answered ? 'border-line' : 'border-brand/40'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-ink">
            Overall
            <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-brand-deep">
              Required
            </span>
          </h3>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            Knowing what you know now, would you take this class again?
          </p>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => pick(true)}
          aria-pressed={value === true}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-[15px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] ${
            value === true
              ? 'border-good bg-good text-white shadow-card'
              : 'border-line bg-surface text-ink-2 hover:border-good/50 hover:text-good-ink'
          }`}
        >
          {value === true && <Icon name="check" size={18} stroke={2.6} className="animate-pop-in" />}
          Yes, I would
        </button>
        <button
          type="button"
          onClick={() => pick(false)}
          aria-pressed={value === false}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-[15px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] ${
            value === false
              ? 'border-warn bg-warn text-white shadow-card'
              : 'border-line bg-surface text-ink-2 hover:border-warn/50 hover:text-warn-ink'
          }`}
        >
          {value === false && <Icon name="x" size={18} stroke={2.6} className="animate-pop-in" />}
          No, I regret it
        </button>
      </div>

      <div className="mt-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[12.5px] font-semibold transition-colors duration-200 ${
            !answered ? 'bg-sunk text-muted' : value ? 'bg-good-soft text-good-ink' : 'bg-warn-soft text-warn-ink'
          }`}
        >
          {answered ? (value ? 'Glad I took it' : 'Wish I had not') : 'Not answered yet'}
        </span>
      </div>
    </div>
  )
}

function FactorSlider({ factor, value, onChange, index }) {
  const answered = value != null
  const shown = answered ? value : 5
  const tone = answered ? toneFor(factor.key, shown) : 'color-mix(in oklab, rgb(var(--c-muted)) 55%, rgb(var(--c-surface)))'
  const pct = ((shown - 1) / 9) * 100
  const set = (v) => {
    if (v !== value) tick(6)
    onChange(v)
  }

  return (
    <div
      className={`animate-rise-in rounded-xl2 border p-5 transition-[background-color,border-color,box-shadow] duration-300 ${
        answered ? 'border-line bg-surface shadow-card' : 'border-dashed border-line bg-surface/60'
      }`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-ink">{factor.label}</h3>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{factor.question}</p>
        </div>
        <div className="shrink-0 text-right">
          <div
            key={answered ? shown : 'none'}
            className={`tnum text-[30px] font-bold leading-none ${answered ? 'tone-text-lg animate-nudge' : 'text-muted'}`}
            style={{ '--tone': tone }}
          >
            {answered ? shown : '–'}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <input
          className="slider"
          type="range"
          min="1"
          max="10"
          step="1"
          value={shown}
          aria-label={`${factor.label}: ${factor.question}`}
          aria-valuetext={answered ? `${shown} out of 10, ${bandLabel(factor.key, shown)}` : 'Not rated'}
          style={{ '--tone': tone, '--pct': `${pct}%` }}
          onChange={(e) => set(Number(e.target.value))}
          onPointerUp={(e) => set(Number(e.currentTarget.value))}
          onKeyUp={(e) => set(Number(e.currentTarget.value))}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[12.5px] font-semibold transition-colors duration-200 ${
            answered ? 'tone-soft tone-text' : 'bg-sunk text-muted'
          }`}
          style={{ '--tone': tone }}
        >
          {answered ? bandLabel(factor.key, shown) : 'Not rated yet'}
        </span>
        {answered && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[12.5px] font-medium text-muted underline underline-offset-4 hover:text-brand-ink"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------- Step 3: context and tags */
function DetailStep({ hours, setHours, gradeTaken, setGradeTaken, year, setYear, tags, toggleTag }) {
  return (
    <section>
      <h2 className="text-[21px] font-bold text-ink">A bit of context</h2>
      <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-muted">
        All optional. It helps people tell whether your review is about their situation.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Field label="Hours of work outside class" hint="per week">
          <div className="flex flex-wrap gap-2">
            {HOURS_BUCKETS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(hours === h ? null : h)}
                className={`chip ${hours === h ? 'chip-on' : ''}`}
              >
                {h}
              </button>
            ))}
          </div>
        </Field>

        <Field label="What grade were you in?">
          <div className="flex flex-wrap gap-2">
            {GRADE_LEVELS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeTaken(gradeTaken === g ? null : g)}
                className={`chip ${gradeTaken === g ? 'chip-on' : ''}`}
              >
                {g}th
              </button>
            ))}
          </div>
        </Field>

        <Field label="School year you took it">
          <div className="flex flex-wrap gap-2">
            {SCHOOL_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(year === y ? null : y)}
                className={`chip ${year === y ? 'chip-on' : ''}`}
              >
                {y}
              </button>
            ))}
          </div>
        </Field>

        <Field label="What was it like?" hint="pick any">
          <div className="flex flex-wrap gap-2">
            {COURSE_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`chip ${tags.includes(t) ? 'chip-on' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </section>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-[15px] font-bold text-ink">{label}</h3>
        {hint && <span className="text-[12px] text-muted">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

/* --------------------------- Step 4: the note, and whose name is on it */
function PostStep({
  note,
  setNote,
  anon,
  setAnon,
  profile,
  course,
  scores,
  takeAgain,
  tags,
  hours,
  gradeTaken,
  year,
}) {
  const left = NOTE_LIMIT - note.length
  const answered = FACTORS.filter((f) => scores[f.key] != null)

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
      <div>
        <h2 className="text-[21px] font-bold text-ink">What do you wish you had known?</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          The part scores cannot say. Optional, and the part people actually read.
        </p>
        <div className="mt-5">
          <textarea
            autoFocus
            value={note}
            maxLength={NOTE_LIMIT}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="What the tests are actually like, what to start early, who the class is a good fit for. Please leave teachers out of it."
            className="field resize-y leading-relaxed"
          />
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <span className="text-muted">Never about a teacher. The class only.</span>
            <span
              className={`tnum font-semibold ${left <= 20 ? 'text-warn-ink' : left <= 60 ? 'tone-text' : 'text-muted'}`}
              style={{ '--tone': RAMP[6] }}
            >
              {left}
            </span>
          </div>
        </div>

        {/* ----------------------------------------- Anonymous or not */}
        <div className="mt-8">
          <h3 className="text-[15px] font-bold text-ink">How should this post?</h3>
          <p className="mt-1 text-[13px] text-muted">
            Your choice, every single review. You can change it on the next one.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                tick()
                setAnon(true)
              }}
              aria-pressed={anon}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] ${
                anon ? 'border-brand bg-brand-wash shadow-card ring-1 ring-brand' : 'border-line bg-surface hover:border-brand/40'
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sunk text-muted">
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="10" cy="7.5" r="3" />
                  <path d="M4.5 16.5c1.1-2.7 3.1-3.9 5.5-3.9s4.4 1.2 5.5 3.9" strokeLinecap="round" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold text-ink">Anonymous</span>
                <span className="block text-[12.5px] leading-snug text-muted">
                  Shows as Anonymous. Nobody sees it was you.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                tick()
                setAnon(false)
              }}
              aria-pressed={!anon}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] ${
                !anon ? 'border-brand bg-brand-wash shadow-card ring-1 ring-brand' : 'border-line bg-surface hover:border-brand/40'
              }`}
            >
              <Avatar profile={profile} size={40} />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold text-ink">
                  Post as {profile?.name?.split(' ')[0] || 'me'}
                </span>
                <span className="block text-[12.5px] leading-snug text-muted">
                  Your name and grade show on the review.
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <aside
        className="card dept-glow p-5 lg:sticky lg:top-20"
        style={{ '--dept': deptHue(course?.dept) }}
        aria-label="Preview of your review"
      >
        <div className="flex items-start gap-3">
          {course && <DeptBadge dept={course.dept} size={40} />}
          <div className="min-w-0">
            <h3 className="text-[18px] font-bold leading-snug text-ink">{course?.name}</h3>
            <p className="mt-0.5 text-[12.5px] text-muted">How your review will look</p>
          </div>
        </div>

        <div className="mt-4">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-bold ${
              takeAgain ? 'bg-good-soft text-good-ink' : 'bg-warn-soft text-warn-ink'
            }`}
          >
            <Icon name={takeAgain ? 'check' : 'x'} size={13} stroke={2.6} />
            {takeAgain ? 'Would take it again' : 'Would not take it again'}
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {answered.map((factor) => {
            const value = scores[factor.key]
            const tone = toneFor(factor.key, value)
            return (
              <div key={factor.key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[12.5px] text-muted">{factor.short}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunk">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(value / 10) * 100}%`, background: tone }}
                  />
                </span>
                <span className="tone-text tnum w-5 text-right text-[13px] font-bold" style={{ '--tone': tone }}>
                  {value}
                </span>
              </div>
            )
          })}
          {!answered.length && (
            <p className="text-[13px] text-muted">No scores set, just your yes or no.</p>
          )}
        </div>

        <div className="mt-4 border-t border-line pt-4 text-[12.5px] leading-relaxed text-muted">
          {[gradeTaken && `${ordinal(gradeTaken)} grade`, year, hours && `${hours} hrs/wk`]
            .filter(Boolean)
            .join(' · ') || 'No context added'}
          {tags.length > 0 && <div className="mt-1.5">{tags.join(', ')}</div>}
          <div className="mt-1.5 font-semibold text-ink-2">
            Posting as {anon ? 'Anonymous' : profile?.name || 'you'}
          </div>
        </div>
      </aside>
    </section>
  )
}

/* ------------------------------------------------- Confirmation screen */
// Dots that fly out of the check, only on the review that unlocks a class's scores.
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + 0.26
  const dist = 62 + (i % 3) * 14
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist)}px`,
    color: RAMP[(i * 3) % RAMP.length],
    size: i % 2 ? 7 : 9,
    delay: 180 + (i % 4) * 30,
  }
})

function Confirmation({ done, onOpenCourse, onAgain }) {
  const crossed = done.count === MIN_REVIEWS
  return (
    <div className="wrap flex min-h-[65vh] flex-col items-center justify-center py-14 text-center">
      <div className="relative grid h-24 w-24 place-items-center">
        <span aria-hidden className="absolute inset-0 animate-ring rounded-full bg-good/30" />
        {crossed &&
          BURST.map((b, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute left-1/2 top-1/2 -ml-1 -mt-1 animate-burst rounded-full"
              style={{
                '--dx': b.dx,
                '--dy': b.dy,
                width: b.size,
                height: b.size,
                background: b.color,
                animationDelay: `${b.delay}ms`,
              }}
            />
          ))}
        <div className="relative grid h-20 w-20 animate-pop-in place-items-center rounded-full bg-good shadow-card">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-in"
              style={{ strokeDasharray: 24, '--len': 24 }}
            />
          </svg>
        </div>
      </div>

      <h1
        className="mt-7 max-w-xl animate-rise-in text-[28px] font-bold leading-tight text-ink sm:text-[36px]"
        style={{ animationDelay: '160ms' }}
      >
        You are the {ordinal(done.count)} student to review {done.name}.
      </h1>

      <p
        className="mt-4 max-w-md animate-rise-in text-[16px] leading-relaxed text-ink-2"
        style={{ animationDelay: '240ms' }}
      >
        {crossed
          ? `That makes three. ${done.name} now shows scores to everyone, and yours is what unlocked it.`
          : done.count < MIN_REVIEWS
          ? `${MIN_REVIEWS - done.count} more ${
              MIN_REVIEWS - done.count === 1 ? 'review' : 'reviews'
            } and this class starts showing scores to everyone.`
          : 'Your scores are now part of what every underclassman sees on this class.'}
      </p>

      {done.count < MIN_REVIEWS && (
        <div className="mt-5 flex animate-rise-in gap-1.5" style={{ animationDelay: '300ms' }} aria-hidden>
          {Array.from({ length: MIN_REVIEWS }).map((_, i) => (
            <span key={i} className={`h-2 w-8 rounded-full ${i < done.count ? 'bg-brand' : 'bg-line'}`} />
          ))}
        </div>
      )}

      <div className="mt-8 flex animate-rise-in flex-col gap-3 sm:flex-row" style={{ animationDelay: '340ms' }}>
        <button type="button" onClick={onOpenCourse} className="btn-primary">
          See the class
          <Icon name="arrow-right" size={17} stroke={2.2} />
        </button>
        <button type="button" onClick={onAgain} className="btn-ghost">
          Review another class
        </button>
      </div>
    </div>
  )
}
