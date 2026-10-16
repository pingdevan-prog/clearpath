import { useEffect, useMemo, useState } from 'react'
import { AVATAR_COLORS } from '../data/schools'
import { GRADE_LEVELS } from '../lib/metrics'
import { Avatar, Logo, Mark, SchoolTile } from './Bits'

/**
 * First run: make a profile, then add your school. Two steps, nothing optional
 * dressed up as required.
 */
export function Onboarding({ schools, onCreateProfile, profile, onAddSchool, onOpenSchool, myschools }) {
  const [step, setStep] = useState(profile ? 'school' : 'welcome')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [step])

  if (step === 'welcome') return <Welcome onStart={() => setStep('profile')} />
  if (step === 'profile')
    return (
      <ProfileStep
        onDone={(p) => {
          onCreateProfile(p)
          setStep('school')
        }}
      />
    )
  return (
    <SchoolStep
      schools={schools}
      profile={profile}
      myschools={myschools}
      onAddSchool={onAddSchool}
      onOpenSchool={onOpenSchool}
    />
  )
}

function Shell({ children, wide = false }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="wrap flex-1 py-10 sm:py-16">
        <div className={`mx-auto w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>{children}</div>
      </div>
    </div>
  )
}

function Welcome({ onStart }) {
  const lines = [
    ['Scores, not rumors', 'Difficulty, homework, fun and worth it, each out of 10, from students who finished the class.'],
    ['Every class in the catalog', 'All 306 Westlake courses with their real prerequisites and course descriptions.'],
    ['Never the teacher', 'Clearpath rates the class. There is no field for rating a person, on purpose.'],
  ]
  return (
    <Shell>
      <div className="animate-rise-in">
        <Mark size={62} />
        <h1 className="mt-7 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
          Pick next year
          <br />
          with the facts.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
          Clearpath is a course review app for your school, written by the students who already took
          the class. No more picking a schedule off a rumor and regretting it in October.
        </p>
        <div className="mt-8 space-y-4">
          {lines.map(([title, body], i) => (
            <div
              key={title}
              className="flex gap-3.5 animate-rise-in"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
              <div>
                <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
                <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onStart} className="btn-primary mt-9 w-full">
          Create your profile
        </button>
        <p className="mt-3 text-center text-[12.5px] text-muted">
          Takes about thirty seconds. Everything stays on this device.
        </p>
      </div>
    </Shell>
  )
}

function handleFrom(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16)
}

function ProfileStep({ onDone }) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [handleEdited, setHandleEdited] = useState(false)
  const [grade, setGrade] = useState(null)
  const [color, setColor] = useState(AVATAR_COLORS[0])

  const effectiveHandle = handleEdited ? handle : handleFrom(name)
  const ready = name.trim().length >= 2 && effectiveHandle.length >= 3 && grade

  const preview = { name: name.trim() || 'Your name', color }

  return (
    <Shell>
      <div className="animate-rise-in">
        <div className="eyebrow">Step 1 of 2</div>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Make your profile
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Your name is never attached to a review unless you choose to attach it. Reviews post
          anonymously by default.
        </p>

        <div className="card mt-7 p-5">
          <div className="flex items-center gap-4">
            <Avatar profile={preview} size={58} />
            <div className="min-w-0">
              <div className="truncate text-[17px] font-semibold text-ink">{preview.name}</div>
              <div className="truncate text-[13.5px] text-muted">
                @{effectiveHandle || 'username'}
                {grade ? ` · ${grade}th grade` : ''}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="eyebrow" htmlFor="cp-name">
                Name
              </label>
              <input
                id="cp-name"
                className="field mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Devan Rajesh"
                autoComplete="name"
                maxLength={40}
              />
            </div>
            <div>
              <label className="eyebrow" htmlFor="cp-handle">
                Username
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-muted">
                  @
                </span>
                <input
                  id="cp-handle"
                  className="field pl-9"
                  value={effectiveHandle}
                  onChange={(e) => {
                    setHandleEdited(true)
                    setHandle(handleFrom(e.target.value))
                  }}
                  placeholder="username"
                  maxLength={16}
                />
              </div>
            </div>
            <div>
              <div className="eyebrow">Grade</div>
              <div className="mt-1.5 flex gap-2">
                {GRADE_LEVELS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`chip flex-1 justify-center ${grade === g ? 'chip-on' : ''}`}
                  >
                    {g}th
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow">Profile color</div>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use color ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-9 w-9 rounded-full transition-transform duration-150 active:scale-90 ${
                      color === c ? 'ring-2 ring-offset-2 ring-ink/70' : ''
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={() => onDone({ name: name.trim(), handle: effectiveHandle, grade, color })}
          className="btn-primary mt-6 w-full"
        >
          Continue
        </button>
      </div>
    </Shell>
  )
}

function SchoolStep({ schools, profile, myschools, onAddSchool, onOpenSchool }) {
  const [query, setQuery] = useState('')
  const added = new Set(myschools.map((s) => s.id))

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? schools.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.district.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q)
        )
      : schools
    return [...list].sort((a, b) => Number(b.catalog) - Number(a.catalog) || a.name.localeCompare(b.name))
  }, [schools, query])

  const openable = myschools.find((s) => s.catalog) || myschools[0]

  return (
    <Shell wide>
      <div className="animate-rise-in">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Step 2 of 2</div>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink">
              Add your school
            </h1>
          </div>
          <Avatar profile={profile} size={46} />
        </div>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
          Reviews only mean something next to the other classes at the same school, so Clearpath
          keeps every school separate. Add yours to open it.
        </p>

        <div className="relative mt-6">
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
            placeholder="Search schools or districts"
          />
        </div>

        <div className="mt-4 space-y-2.5">
          {results.map((school) => (
            <div key={school.id} className="card flex items-center gap-3.5 p-3.5">
              <SchoolTile school={school} size={46} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-[15.5px] font-semibold text-ink">{school.name}</span>
                  {school.catalog ? (
                    <span className="inline-flex items-center rounded-md bg-good-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.09em] text-good">
                      Catalog ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-sunk px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted">
                      Not added yet
                    </span>
                  )}
                </div>
                <div className="truncate text-[13px] text-muted">
                  {school.district} · {school.city}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAddSchool(school.id)}
                disabled={added.has(school.id)}
                className={`chip shrink-0 ${added.has(school.id) ? 'chip-on' : ''}`}
              >
                {added.has(school.id) ? 'Added' : 'Add'}
              </button>
            </div>
          ))}
          {!results.length && (
            <div className="card px-5 py-8 text-center">
              <p className="text-[14px] font-semibold text-ink">No school matches that.</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
                Clearpath starts with Austin-area high schools. Adding a new school means loading its
                course catalog, which is the part that takes a human.
              </p>
            </div>
          )}
        </div>

        {openable && (
          <div className="sticky bottom-4 mt-6">
            <button type="button" onClick={() => onOpenSchool(openable.id)} className="btn-primary w-full">
              Open {openable.short}
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
