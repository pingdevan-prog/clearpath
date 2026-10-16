import { useMemo, useState } from 'react'
import { AVATAR_COLORS } from '../data/schools'
import { GRADE_LEVELS, FACTORS, toneFor } from '../lib/metrics'
import { ordinal } from '../lib/stats'
import { SAMPLE_COURSE_COUNT } from '../data/sampleReviews'
import { Avatar, BackButton, Empty, SchoolTile, Toggle } from './Bits'

export function ProfileView({
  profile,
  mySchools,
  activeSchool,
  myReviews,
  courseName,
  samplesOn,
  onSaveProfile,
  onSwitchSchool,
  onRemoveSchool,
  onAddSchools,
  onDeleteReview,
  onToggleSamples,
  onReset,
  onOpenCourse,
}) {
  const [editing, setEditing] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="mx-auto max-w-2xl">
        {/* Profile */}
        <section className="card p-5">
          {editing ? (
            <ProfileEditor
              profile={profile}
              onCancel={() => setEditing(false)}
              onSave={(next) => {
                onSaveProfile(next)
                setEditing(false)
              }}
            />
          ) : (
            <div className="flex items-center gap-4">
              <Avatar profile={profile} size={62} />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[22px] font-semibold tracking-[-0.025em] text-ink">
                  {profile.name}
                </h1>
                <p className="truncate text-[13.5px] text-muted">
                  @{profile.handle} · {profile.grade}th grade
                </p>
              </div>
              <button type="button" className="chip shrink-0" onClick={() => setEditing(true)}>
                Edit
              </button>
            </div>
          )}
        </section>

        {/* Schools */}
        <section className="card mt-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-ink">Your schools</h2>
            <button
              type="button"
              onClick={onAddSchools}
              className="text-[13px] font-semibold text-brand hover:text-brand-deep"
            >
              Add school
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {mySchools.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <SchoolTile school={s} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-ink">{s.name}</div>
                  <div className="truncate text-[12.5px] text-muted">
                    {s.catalog ? s.district : 'Catalog not added yet'}
                  </div>
                </div>
                {activeSchool?.id === s.id ? (
                  <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-brand-deep">
                    Open
                  </span>
                ) : (
                  <button type="button" className="chip shrink-0" onClick={() => onSwitchSchool(s.id)}>
                    Switch
                  </button>
                )}
                {mySchools.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveSchool(s.id)}
                    className="shrink-0 rounded-full p-1.5 text-muted hover:text-warn"
                    aria-label={`Remove ${s.name}`}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Your reviews */}
        <section className="mt-6">
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
            Your reviews {myReviews.length > 0 && <span className="text-muted">({myReviews.length})</span>}
          </h2>
          {!myReviews.length ? (
            <div className="card mt-3 px-5 py-9 text-center">
              <h3 className="text-[16px] font-semibold text-ink">You have not written one yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                Every class you review is one an underclassman does not have to guess about.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {myReviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => onOpenCourse(r.courseId)} className="min-w-0 text-left">
                      <div className="truncate text-[15.5px] font-semibold text-ink hover:text-brand">
                        {courseName(r.courseId)}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-muted">
                        {r.anon === false ? 'Posted with your name' : 'Posted anonymously'}
                        {r.gradeTaken ? ` · ${ordinal(r.gradeTaken)} grade` : ''}
                        {r.year ? ` · ${r.year}` : ''}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReview(r.id)}
                      className="shrink-0 text-[12.5px] font-semibold text-muted hover:text-warn"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {FACTORS.map((f) => {
                      const v = r.scores?.[f.key]
                      return (
                        <div key={f.key}>
                          <div className="tnum text-[15px] font-semibold leading-none" style={{ color: toneFor(f.key, v) }}>
                            {typeof v === 'number' ? v : '—'}
                          </div>
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                            {f.short}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {r.note && <p className="mt-3 border-t border-line pt-3 text-[13.5px] leading-relaxed text-ink-2">{r.note}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Settings */}
        <section className="card mt-6 divide-y divide-line">
          <div className="p-5">
            <Toggle
              on={samplesOn}
              onChange={onToggleSamples}
              label="Show sample reviews"
              description={`Fills ${SAMPLE_COURSE_COUNT} classes with clearly labelled example reviews so you can see how a reviewed class looks. Nothing here is real student opinion, and a banner says so while it is on.`}
            />
          </div>
          <div className="p-5">
            <h3 className="text-[15px] font-semibold text-ink">How Clearpath handles reviews</h3>
            <ul className="mt-2.5 space-y-2 text-[13.5px] leading-relaxed text-muted">
              <li>
                <span className="font-semibold text-ink-2">No teacher ratings.</span> The class is
                rated, never the person teaching it. There is no field for it anywhere.
              </li>
              <li>
                <span className="font-semibold text-ink-2">Anonymous by default.</span> Your name is
                only attached if you turn it on for that review.
              </li>
              <li>
                <span className="font-semibold text-ink-2">No thin averages.</span> Under three
                reviews a class shows words instead of numbers.
              </li>
              <li>
                <span className="font-semibold text-ink-2">On this device.</span> Your profile and
                reviews are stored in this browser, not on a server.
              </li>
            </ul>
          </div>
          <div className="p-5">
            {confirmReset ? (
              <div>
                <h3 className="text-[15px] font-semibold text-warn">Erase everything?</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  Your profile, your schools and every review you wrote on this device. This cannot be
                  undone.
                </p>
                <div className="mt-3 flex gap-2.5">
                  <button
                    type="button"
                    className="btn-ghost !border-warn/40 !text-warn"
                    onClick={() => {
                      onReset()
                      setConfirmReset(false)
                    }}
                  >
                    Yes, erase it
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-[13.5px] font-semibold text-muted hover:text-warn"
              >
                Start over on this device
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function ProfileEditor({ profile, onSave, onCancel }) {
  const [name, setName] = useState(profile.name)
  const [grade, setGrade] = useState(profile.grade)
  const [color, setColor] = useState(profile.color)
  const ready = name.trim().length >= 2 && grade

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar profile={{ name, color }} size={56} />
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </div>
      <div className="mt-4">
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
      <div className="mt-4">
        <div className="eyebrow">Color</div>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Use color ${c}`}
              className={`h-8 w-8 rounded-full ${color === c ? 'ring-2 ring-ink/70 ring-offset-2' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 flex gap-2.5">
        <button type="button" className="btn-primary" disabled={!ready} onClick={() => onSave({ name: name.trim(), grade, color })}>
          Save
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/** The "add another school" screen, reachable from the switcher and your profile. */
export function SchoolsView({ schools, mySchools, activeSchool, onAdd, onOpen, onBack }) {
  const [query, setQuery] = useState('')
  const added = new Set(mySchools.map((s) => s.id))

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

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="mx-auto max-w-2xl">
        <BackButton onClick={onBack} label="Back" />
        <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Schools
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Clearpath keeps every school separate, because a class only means something next to the
          other classes at the same school.
        </p>

        <input
          className="field mt-5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search schools or districts"
        />

        <div className="mt-4 space-y-2.5">
          {results.map((school) => (
            <div key={school.id} className="card flex items-center gap-3.5 p-3.5">
              <SchoolTile school={school} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-[15px] font-semibold text-ink">{school.name}</span>
                  {school.catalog ? (
                    <span className="rounded-md bg-good-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.09em] text-good">
                      Catalog ready
                    </span>
                  ) : (
                    <span className="rounded-md bg-sunk px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.09em] text-muted">
                      Not added yet
                    </span>
                  )}
                </div>
                <div className="truncate text-[12.5px] text-muted">
                  {school.district} · {school.city}
                </div>
              </div>
              {added.has(school.id) ? (
                activeSchool?.id === school.id ? (
                  <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-brand-deep">
                    Open
                  </span>
                ) : (
                  <button type="button" className="chip shrink-0" onClick={() => onOpen(school.id)}>
                    Open
                  </button>
                )
              ) : (
                <button type="button" className="chip shrink-0" onClick={() => onAdd(school.id)}>
                  Add
                </button>
              )}
            </div>
          ))}
          {!results.length && (
            <Empty
              title="No school matches that"
              body="Clearpath starts with Austin-area high schools. Loading a new school means entering its whole course catalog, which is the part that takes a human."
            />
          )}
        </div>
      </div>
    </div>
  )
}
