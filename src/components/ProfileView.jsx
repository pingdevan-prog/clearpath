import { useMemo, useState } from 'react'
import { AVATAR_COLORS } from '../data/schools'
import { GRADE_LEVELS, FACTORS, ROLES, profileSubtitle, toneFor } from '../lib/metrics'
import { ordinal } from '../lib/stats'
import { COURSE_MAP } from '../data/courses'
import { SAMPLE_COURSE_COUNT } from '../data/sampleReviews'
import { Avatar, BackButton, DeptBadge, Empty, Icon, SchoolTile, Toggle, tick } from './Bits'

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
  authUser,
  onSignOut,
}) {
  const [editing, setEditing] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="mx-auto max-w-2xl">
        {/* Profile */}
        <section className="card overflow-hidden">
          <div
            aria-hidden
            className="h-20 sm:h-24"
            style={{
              background: `linear-gradient(120deg, color-mix(in oklab, ${profile.color || 'rgb(var(--c-brand))'} 70%, rgb(var(--c-surface))), color-mix(in oklab, ${profile.color || 'rgb(var(--c-brand))'} 25%, rgb(var(--c-surface))))`,
            }}
          />
          <div className="px-5 pb-5">
          {editing ? (
            <div className="pt-5">
            <ProfileEditor
              profile={profile}
              onCancel={() => setEditing(false)}
              onSave={(next) => {
                onSaveProfile(next)
                setEditing(false)
              }}
            />
            </div>
          ) : (
            <>
              <div className="-mt-9 flex items-end justify-between gap-3">
                <Avatar profile={profile} size={76} className="ring-4 ring-surface" />
                <button type="button" className="chip shrink-0" onClick={() => setEditing(true)}>
                  <Icon name="pen" size={14} stroke={2} />
                  Edit profile
                </button>
              </div>
              <h1 className="mt-3 truncate text-[23px] font-bold text-ink">{profile.name}</h1>
              <p className="truncate text-[14px] text-muted">
                @{profile.handle}
                {profileSubtitle(profile) ? ` · ${profileSubtitle(profile)}` : ''}
              </p>
              <div className="mt-4 flex gap-6">
                <Stat value={myReviews.length} label={myReviews.length === 1 ? 'review' : 'reviews'} />
                <Stat value={myReviews.filter((r) => r.note).length} label="written" />
                <Stat value={mySchools.length} label={mySchools.length === 1 ? 'school' : 'schools'} />
              </div>
            </>
          )}

          {authUser && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-ink-2">Signed in with Google</div>
                <div className="mt-0.5 truncate text-[13.5px] text-muted">{authUser.email}</div>
                <div className="mt-1 text-[12.5px] leading-snug text-muted">
                  Your reviews and plan are saved to this account, on every device you sign into.
                </div>
              </div>
              <button type="button" className="chip shrink-0" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          )}
          </div>
        </section>

        {/* Schools */}
        <section className="card mt-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="section-title">Your schools</h2>
            <button
              type="button"
              onClick={onAddSchools}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink transition-colors hover:text-brand-deep"
            >
              <Icon name="plus" size={15} stroke={2.4} />
              Add school
            </button>
          </div>
          <div className="-mx-2 mt-2 divide-y divide-line">
            {mySchools.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-2 py-3">
                <SchoolTile school={s} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-ink">{s.name}</div>
                  <div className="truncate text-[12.5px] text-muted">
                    {s.catalog ? s.district : 'Catalog not added yet'}
                  </div>
                </div>
                {activeSchool?.id === s.id ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-semibold text-brand-deep">
                    <Icon name="check" size={13} stroke={2.6} />
                    Current
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
                    className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-warn-soft hover:text-warn-ink"
                    aria-label={`Remove ${s.name}`}
                  >
                    <Icon name="x" size={16} stroke={2.2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Your reviews */}
        <section className="mt-8">
          <h2 className="text-[20px] font-bold text-ink">
            Your reviews {myReviews.length > 0 && <span className="tnum font-semibold text-muted">{myReviews.length}</span>}
          </h2>
          {!myReviews.length ? (
            <div className="card mt-3 px-5 py-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <Icon name="pen" size={22} />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-ink">You have not written one yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                Every class you review is one an underclassman does not have to guess about.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {myReviews.map((r, i) => (
                <div key={r.id} className="card animate-rise-in p-4" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                  <div className="flex items-start gap-3">
                    {COURSE_MAP[r.courseId] && <DeptBadge dept={COURSE_MAP[r.courseId].dept} size={38} />}
                    <button type="button" onClick={() => onOpenCourse(r.courseId)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[15.5px] font-bold text-ink transition-colors hover:text-brand-ink">
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
                      className="shrink-0 rounded-full px-2 py-1 text-[12.5px] font-semibold text-muted transition-colors hover:bg-warn-soft hover:text-warn-ink"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-3.5 grid grid-cols-4 gap-3">
                    {FACTORS.map((f) => {
                      const v = r.scores?.[f.key]
                      return (
                        <div key={f.key}>
                          <div className="tone-text tnum text-[16px] font-bold leading-none" style={{ '--tone': toneFor(f.key, v) }}>
                            {typeof v === 'number' ? v : '–'}
                          </div>
                          <div className="mt-1 text-[12px] font-medium text-muted">{f.short}</div>
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
            <h3 className="text-[15px] font-bold text-ink">How Clearpath handles reviews</h3>
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
                <span className="font-semibold text-ink-2">
                  {authUser ? 'Tied to your account.' : 'On this device.'}
                </span>{' '}
                {authUser
                  ? 'Your profile, reviews and plan are saved to your Google account, so they follow you to any device. Other students never see which account wrote a review.'
                  : 'Your profile and reviews are stored in this browser, not on a server.'}
              </li>
            </ul>
          </div>
          <div className="p-5">
            {confirmReset ? (
              <div>
                <h3 className="text-[15px] font-bold text-warn-ink">Erase everything?</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  {authUser
                    ? 'This clears what is stored in this browser. Anything saved to your Google account stays. Delete those reviews one by one above.'
                    : 'Your profile, your schools and every review you wrote on this device. This cannot be undone.'}
                </p>
                <div className="mt-3 flex gap-2.5">
                  <button
                    type="button"
                    className="btn border border-warn/40 bg-warn-soft text-warn-ink hover:border-warn"
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
                className="text-[13.5px] font-semibold text-muted transition-colors hover:text-warn-ink"
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
  const [role, setRole] = useState(profile.role || (profile.grade ? 'student' : null))
  const [grade, setGrade] = useState(profile.grade)
  const [color, setColor] = useState(profile.color)
  const ready = name.trim().length >= 2 && role && (role !== 'student' || grade)

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar profile={{ name, color }} size={56} />
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </div>
      <div className="mt-4">
        <div className="label">I am a</div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setRole(r.value)
                if (r.value !== 'student') setGrade(null)
              }}
              className={`chip ${role === r.value ? 'chip-on' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {role === 'student' && (
        <div className="mt-4 animate-rise-in">
          <div className="label">Grade</div>
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
      )}
      <div className="mt-4">
        <div className="label">Color</div>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                tick()
                setColor(c)
              }}
              aria-label={`Use color ${c}`}
              aria-pressed={color === c}
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
      <div className="mt-5 flex gap-2.5">
        <button type="button" className="btn-primary" disabled={!ready} onClick={() => onSave({ name: name.trim(), role, grade: role === 'student' ? grade : null, color })}>
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
        <h1 className="mt-3 text-[28px] font-bold leading-tight text-ink sm:text-[34px]">Schools</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Clearpath keeps every school separate, because a class only means something next to the
          other classes at the same school.
        </p>

        <div className="relative mt-5">
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
            <div key={school.id} className="card flex items-center gap-3.5 p-3.5">
              <SchoolTile school={school} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-[15px] font-semibold text-ink">{school.name}</span>
                  {school.catalog ? (
                    <span className="rounded-md bg-good-soft px-1.5 py-0.5 text-[11.5px] font-semibold text-good-ink">
                      Catalog ready
                    </span>
                  ) : (
                    <span className="rounded-md bg-sunk px-1.5 py-0.5 text-[11.5px] font-semibold text-muted">
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
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-semibold text-brand-deep">
                    <Icon name="check" size={13} stroke={2.6} />
                    Current
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

function Stat({ value, label }) {
  return (
    <div>
      <div className="tnum text-[19px] font-bold leading-none text-ink">{value}</div>
      <div className="mt-1 text-[12.5px] text-muted">{label}</div>
    </div>
  )
}
