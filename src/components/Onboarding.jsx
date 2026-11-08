import { useEffect, useMemo, useState } from 'react'
import { AVATAR_COLORS } from '../data/schools'
import { ROLES, profileSubtitle } from '../lib/metrics'
import { Avatar, ClassYearSelect, Icon, Mark, SchoolTile, tick } from './Bits'

/**
 * First run: make a profile, then add your school. Two steps, nothing optional
 * dressed up as required.
 */
export function Onboarding({ schools, onCreateProfile, profile, onAddSchool, onOpenSchool, myschools, suggested }) {
  // Someone who just signed in with Google has already seen the pitch on the
  // sign-in screen, so send them straight to making their profile.
  const [step, setStep] = useState(profile ? 'school' : suggested ? 'profile' : 'welcome')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [step])

  if (step === 'welcome') return <Welcome onStart={() => setStep('profile')} />
  if (step === 'profile')
    return (
      <ProfileStep
        suggested={suggested}
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
    ['Scores, not rumors', 'Difficulty, homework, fun and worth it, each out of 10, from students who finished the class.', 'math', '#12A37F'],
    ['Every class in the catalog', 'All 306 Westlake courses with their real prerequisites and course descriptions.', 'book', '#2F7BEA'],
    ['Never the teacher', 'Clearpath rates the class. There is no field for rating a person, on purpose.', 'heart', '#E0457B'],
  ]
  return (
    <Shell>
      <div className="animate-rise-in">
        <Mark size={62} />
        <h1 className="mt-7 text-[40px] font-bold leading-[1.04] text-ink">
          Pick next year
          <br />
          with the facts.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
          Clearpath is a course review app for your school, written by the students who already took
          the class. No more picking a schedule off a rumor and regretting it in October.
        </p>
        <div className="mt-8 space-y-4">
          {lines.map(([title, body, icon, hue], i) => (
            <div
              key={title}
              className="flex animate-rise-in gap-3.5"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span
                className="dept-soft dept-ink grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ '--dept': hue }}
                aria-hidden
              >
                <Icon name={icon} size={20} stroke={1.9} />
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-ink">{title}</h2>
                <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onStart} className="btn-primary mt-9 w-full">
          Create your profile
          <Icon name="arrow-right" size={17} stroke={2.2} />
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

function ProfileStep({ onDone, suggested }) {
  const [name, setName] = useState(suggested?.displayName || '')
  const [handle, setHandle] = useState('')
  const [handleEdited, setHandleEdited] = useState(false)
  const [role, setRole] = useState(null)
  const [classYear, setClassYear] = useState(null)
  const [color, setColor] = useState(AVATAR_COLORS[0])

  const effectiveHandle = handleEdited ? handle : handleFrom(name)
  // A class year is only asked of, and only required of, students.
  const ready =
    name.trim().length >= 2 &&
    effectiveHandle.length >= 3 &&
    role &&
    (role !== 'student' || classYear)

  const preview = { name: name.trim() || 'Your name', color, role, classYear }

  return (
    <Shell>
      <div className="animate-rise-in">
        <StepBars step={1} />
        <h1 className="mt-4 text-[30px] font-bold leading-tight text-ink">Make your profile</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {suggested
            ? 'Pulled from your Google account. Change anything you like. Your name is never attached to a review unless you choose to attach it.'
            : 'Your name is never attached to a review unless you choose to attach it. Reviews post anonymously by default.'}
        </p>

        <div className="card mt-7 p-5">
          <div className="flex items-center gap-4">
            <Avatar profile={preview} size={58} className="transition-colors duration-300" />
            <div className="min-w-0">
              <div className="truncate text-[17px] font-bold text-ink">{preview.name}</div>
              <div className="truncate text-[13.5px] text-muted">@{effectiveHandle || 'username'}</div>
              {profileSubtitle(preview) && (
                <div className="truncate text-[13.5px] text-muted">{profileSubtitle(preview)}</div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="cp-name">
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
              <label className="label" htmlFor="cp-handle">
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
              <div className="label">I am a</div>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      tick()
                      setRole(r.value)
                      if (r.value !== 'student') setClassYear(null)
                    }}
                    aria-pressed={role === r.value}
                    className={`relative rounded-2xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.97] ${
                      role === r.value
                        ? 'border-brand bg-brand-wash shadow-card ring-1 ring-brand'
                        : 'border-line bg-surface hover:border-brand/40'
                    }`}
                  >
                    {role === r.value && (
                      <span className="absolute right-2.5 top-2.5 grid h-5 w-5 animate-pop-in place-items-center rounded-full bg-brand text-white">
                        <Icon name="check" size={12} stroke={3} />
                      </span>
                    )}
                    <span className="block text-[14.5px] font-semibold text-ink">{r.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">{r.blurb}</span>
                  </button>
                ))}
              </div>
            </div>

            {role === 'student' && (
              <div className="animate-rise-in">
                <label className="label" htmlFor="cp-class">
                  Class
                </label>
                <div className="mt-1.5">
                  <ClassYearSelect id="cp-class" value={classYear} onChange={setClassYear} />
                </div>
                <p className="mt-1.5 text-[12.5px] leading-snug text-muted">
                  The year you graduate, or graduated. Middle schoolers and alumni are welcome. Your grade
                  moves up on its own each school year.
                </p>
              </div>
            )}
            <div>
              <div className="label">Profile color</div>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use color ${c}`}
                    aria-pressed={color === c}
                    onClick={() => {
                      tick()
                      setColor(c)
                    }}
                    className={`grid h-9 w-9 place-items-center rounded-full text-white transition-transform duration-200 ease-out active:scale-90 ${
                      color === c ? 'scale-110 ring-2 ring-ink/60 ring-offset-2 ring-offset-surface' : 'hover:scale-105'
                    }`}
                    style={{ background: c }}
                  >
                    {color === c && <Icon name="check" size={16} stroke={2.8} className="animate-pop-in" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={() =>
            onDone({
              name: name.trim(),
              handle: effectiveHandle,
              role,
              classYear: role === 'student' ? classYear : null,
              grade: null,
              color,
            })
          }
          className="btn-primary mt-6 w-full"
        >
          Continue
          <Icon name="arrow-right" size={17} stroke={2.2} />
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
            <StepBars step={2} />
            <h1 className="mt-4 text-[30px] font-bold leading-tight text-ink">Add your school</h1>
          </div>
          <Avatar profile={profile} size={46} />
        </div>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
          Reviews only mean something next to the other classes at the same school, so Clearpath
          keeps every school separate. Add yours to open it.
        </p>

        <div className="relative mt-6">
          <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="field pl-11"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search schools or districts"
          />
        </div>

        <div className="mt-4 space-y-2.5">
          {results.map((school) => (
            <div
              key={school.id}
              className={`card flex items-center gap-3.5 p-3.5 transition-[border-color,box-shadow] duration-300 ${
                added.has(school.id) ? 'border-brand/50 ring-1 ring-brand/40' : ''
              }`}
            >
              <SchoolTile school={school} size={46} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-[15.5px] font-semibold text-ink">{school.name}</span>
                  {school.catalog ? (
                    <span className="inline-flex items-center rounded-md bg-good-soft px-1.5 py-0.5 text-[11.5px] font-semibold text-good-ink">
                      Catalog ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-sunk px-1.5 py-0.5 text-[11.5px] font-semibold text-muted">
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
                onClick={() => {
                  tick(12)
                  onAddSchool(school.id)
                }}
                disabled={added.has(school.id)}
                className={`chip shrink-0 ${added.has(school.id) ? 'chip-on' : ''}`}
              >
                {added.has(school.id) ? (
                  <>
                    <Icon name="check" size={14} stroke={2.6} className="animate-pop-in" />
                    Added
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={14} stroke={2.6} />
                    Add
                  </>
                )}
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
            <button type="button" onClick={() => onOpenSchool(openable.id)} className="btn-primary w-full animate-pop-in">
              Open {openable.short}
              <Icon name="arrow-right" size={17} stroke={2.2} />
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}

/** Two short bars instead of a "Step 1 of 2" label above the heading. */
function StepBars({ step }) {
  return (
    <div className="flex gap-1.5" role="img" aria-label={`Step ${step} of 2`}>
      {[1, 2].map((n) => (
        <span key={n} className={`h-1.5 w-8 rounded-full ${n <= step ? 'bg-brand' : 'bg-line'}`} />
      ))}
    </div>
  )
}
