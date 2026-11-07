import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Avatar, Logo, SchoolTile } from './Bits'

const TABS = [
  { id: 'browse', label: 'Classes', icon: IconList },
  { id: 'plan', label: 'Plan', icon: IconPlan },
  { id: 'compare', label: 'Compare', icon: IconCompare },
  { id: 'write', label: 'Review', icon: IconPen },
  { id: 'you', label: 'You', icon: IconPerson },
]

export function AppShell({ view: screen, profile, school, mySchools, compareCount, onNavigate, onSwitchSchool, children }) {
  // A course page belongs to Classes, the schools list to You.
  const view = screen === 'course' ? 'browse' : screen === 'schools' ? 'you' : screen
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="wrap flex h-14 items-center justify-between gap-3">
          <button type="button" onClick={() => onNavigate('browse')} className="shrink-0 rounded-xl">
            <Logo />
            <span className="sr-only">Go to classes</span>
          </button>

          <DesktopNav view={view} compareCount={compareCount} onNavigate={onNavigate} />

          <div className="flex items-center gap-2">
            <SchoolSwitcher school={school} mySchools={mySchools} onSwitch={onSwitchSchool} onNavigate={onNavigate} />
            <button type="button" onClick={() => onNavigate('you')} className="shrink-0 rounded-full sm:hidden">
              <Avatar profile={profile} size={32} />
              <span className="sr-only">Your profile</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-28 sm:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-surface/90 pb-safe shadow-bar backdrop-blur-xl backdrop-saturate-150 sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch px-1">
          {TABS.map((tab) => {
            const TabIcon = tab.icon
            const on = view === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                aria-current={on ? 'page' : undefined}
                className={`group relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10.5px] font-semibold transition-colors duration-200 ${
                  on ? 'text-brand-ink' : 'text-muted'
                }`}
              >
                <span
                  className={`relative grid h-8 w-14 place-items-center rounded-full transition-[background-color,transform] duration-300 ease-out group-active:scale-90 ${
                    on ? 'bg-brand-soft' : ''
                  }`}
                >
                  <TabIcon active={on} />
                  {tab.id === 'compare' && compareCount > 0 && (
                    <span
                      key={compareCount}
                      className="absolute right-2 top-0 inline-flex h-4 min-w-4 animate-bump items-center justify-center rounded-full bg-brand px-1 text-[9.5px] font-bold text-white ring-2 ring-surface"
                    >
                      {compareCount}
                    </span>
                  )}
                </span>
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

/** Desktop tabs. One pill slides under whichever tab is open. */
function DesktopNav({ view, compareCount, onNavigate }) {
  const refs = useRef({})
  const [pill, setPill] = useState(null)

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[view]
      setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [view, compareCount])

  return (
    <nav className="relative hidden items-center gap-0.5 rounded-full p-1 sm:flex">
      {pill && (
        <span
          aria-hidden
          className="absolute top-1 h-[calc(100%-0.5rem)] rounded-full bg-brand-soft transition-[left,width] duration-500 ease-out"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {TABS.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => (refs.current[tab.id] = el)}
          type="button"
          onClick={() => onNavigate(tab.id)}
          aria-current={view === tab.id ? 'page' : undefined}
          className={`relative inline-flex items-center rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors duration-200 ${
            view === tab.id ? 'text-brand-deep' : 'text-muted hover:text-ink'
          }`}
        >
          {tab.label}
          {tab.id === 'compare' && compareCount > 0 && (
            <span
              key={compareCount}
              className="ml-1.5 inline-flex h-4 min-w-4 animate-bump items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white"
            >
              {compareCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}

function SchoolSwitcher({ school, mySchools, onSwitch, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (!school) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 transition-colors hover:border-brand/40"
      >
        <SchoolTile school={school} size={26} />
        <span className="hidden max-w-[9rem] truncate text-[13.5px] font-semibold text-ink sm:block">
          {school.short}
        </span>
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8.5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-raised shadow-lift animate-pop-in">
          <div className="border-b border-line px-4 py-2.5 text-[12.5px] font-semibold text-muted">Your schools</div>
          {mySchools.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setOpen(false)
                onSwitch(s.id)
              }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-wash ${
                s.id === school.id ? 'bg-brand-wash' : ''
              }`}
            >
              <SchoolTile school={s} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-ink">{s.short}</span>
                <span className="block truncate text-[12px] text-muted">
                  {s.catalog ? `${s.district}` : 'Catalog not added yet'}
                </span>
              </span>
              {s.id === school.id && (
                <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-brand-ink" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 10.5l3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onNavigate('schools')
            }}
            className="w-full border-t border-line px-4 py-3 text-left text-[13.5px] font-semibold text-brand-ink transition-colors hover:bg-brand-wash"
          >
            Add another school
          </button>
        </div>
      )}
    </div>
  )
}

function IconList({ active }) {
  return (
    <svg viewBox="0 0 22 22" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.9}>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1.8" fill={active ? 'currentColor' : 'none'} />
      <rect x="12.5" y="3.5" width="6" height="6" rx="1.8" />
      <rect x="3.5" y="12.5" width="6" height="6" rx="1.8" />
      <rect x="12.5" y="12.5" width="6" height="6" rx="1.8" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

function IconPlan({ active }) {
  return (
    <svg viewBox="0 0 22 22" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.9}>
      <rect x="3.5" y="4.5" width="15" height="13" rx="2.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
      <path d="M3.5 9h15M8 4.5v13" strokeLinecap="round" />
    </svg>
  )
}

function IconCompare({ active }) {
  return (
    <svg viewBox="0 0 22 22" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.9}>
      <rect x="3" y="4" width="6.5" height="14" rx="2" fill={active ? 'currentColor' : 'none'} />
      <rect x="12.5" y="4" width="6.5" height="9" rx="2" />
    </svg>
  )
}

function IconPen({ active }) {
  return (
    <svg viewBox="0 0 22 22" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.9}>
      <path d="M4 18l1-4 9-9 3 3-9 9-4 1z" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
    </svg>
  )
}

function IconPerson({ active }) {
  return (
    <svg viewBox="0 0 22 22" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.9}>
      <circle cx="11" cy="8" r="3.4" fill={active ? 'currentColor' : 'none'} />
      <path d="M4.5 18c1.3-3.2 3.7-4.6 6.5-4.6S16.2 14.8 17.5 18" strokeLinecap="round" />
    </svg>
  )
}
