import { useEffect, useState } from 'react'
import { FACTOR_MAP, bandLabel, toneFor, verdictFor, MIN_REVIEWS, LEVEL_STYLE, deptHue, deptIcon, deptShort, NO_TONE } from '../lib/metrics'

/** Flips to true a frame after mount, so CSS transitions actually run. */
export function useEntrance(delay = 0) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), 20 + delay)
    return () => clearTimeout(id)
  }, [delay])
  return on
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Counts from 0 to target once `on` turns true, easing out like the dial. */
export function useCountUp(target, on, duration = 1100) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!on || target == null) return
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    let raf
    let start
    const step = (t) => {
      start ??= t
      const p = Math.min(1, (t - start) / duration)
      setValue(target * (1 - Math.pow(1 - p, 4)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, on, duration])
  return value
}

/** A tiny haptic tick on phones that support it. Silent everywhere else. */
export function tick(ms = 8) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported */
  }
}

// ---------------------------------------------------------------------------
// Icons. One stroke weight, round caps, drawn on a 24 grid.
// ---------------------------------------------------------------------------

const ICONS = {
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'chevron-right': <path d="M9.5 6l6 6-6 6" />,
  'chevron-down': <path d="M6 9.5l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  sparkle: <path d="M12 3.5l1.9 6.6 6.6 1.9-6.6 1.9L12 20.5l-1.9-6.6L3.5 12l6.6-1.9z" />,
  pen: <path d="M14.5 5.5l4 4M4.5 19.5l1-4.5L15.8 4.7a1.6 1.6 0 0 1 2.3 0l1.2 1.2a1.6 1.6 0 0 1 0 2.3L9 18.5z" />,
  flame: (
    <path d="M12 20.5c3.6 0 6-2.5 6-5.8 0-3.6-2.6-5.4-3.8-8.7-.3.9-.9 2.4-2 3.1C11.6 7.6 11 5.2 9.6 3.5 9.3 6.8 6 9.4 6 14.7c0 3.3 2.4 5.8 6 5.8z" />
  ),
  // Departments
  book: (
    <>
      <path d="M4 5.6c2.6-1.1 5.3-1 8 1 2.7-2 5.4-2.1 8-1v12.6c-2.6-1.1-5.3-1-8 1-2.7-2-5.4-2.1-8-1z" />
      <path d="M12 6.6v12.6" />
    </>
  ),
  math: <path d="M7.5 4.5v6M4.5 7.5h6M14 7.5h6M5 14.5l5 5M10 14.5l-5 5M14 15.5h6M14 18.5h6" />,
  flask: (
    <>
      <path d="M9 3.5h6M10.2 3.5v5.4L5.3 17.4a2.1 2.1 0 0 0 1.8 3.1h9.8a2.1 2.1 0 0 0 1.8-3.1L13.8 8.9V3.5" />
      <path d="M7.6 14.5h8.8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z" />
    </>
  ),
  speech: (
    <>
      <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h7.5A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3H6a2.5 2.5 0 0 1-2.5-2.5z" />
      <path d="M18.6 9a2 2 0 0 1 1.9 2v4.2a2 2 0 0 1-2 2H18v2.6l-3.2-2.6h-2.4a2 2 0 0 1-1.7-.9" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7h2.1a3.8 3.8 0 0 0 3.8-3.8c0-3.9-3.8-7-8.5-7z" />
      <circle cx="7.8" cy="11.2" r="0.9" fill="currentColor" />
      <circle cx="10" cy="7.4" r="0.9" fill="currentColor" />
      <circle cx="14.6" cy="7.6" r="0.9" fill="currentColor" />
    </>
  ),
  chip: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.2" />
      <path d="M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3M10 10h4v4h-4z" />
    </>
  ),
  heart: (
    <>
      <path d="M12 19.5s-7.5-4.3-7.5-10A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7.5 2.4c0 5.7-7.5 10-7.5 10z" />
      <path d="M7.6 12.3h2.2l1.3-2.2 2 4.2 1.3-2h2" />
    </>
  ),
  spark: <path d="M12 3.5l1.9 6.6 6.6 1.9-6.6 1.9L12 20.5l-1.9-6.6L3.5 12l6.6-1.9z" />,
  hands: (
    <>
      <circle cx="9" cy="8" r="2.7" />
      <circle cx="16.6" cy="9.4" r="2.1" />
      <path d="M3.8 19.2c.6-3.2 2.6-5.1 5.2-5.1s4.6 1.9 5.2 5.1M14.4 14.4c.6-.3 1.4-.5 2.2-.5 2 0 3.5 1.4 3.9 3.9" />
    </>
  ),
}

export function Icon({ name, size = 20, stroke = 1.9, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {ICONS[name] || ICONS.spark}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export function Logo({ size = 'md', className = '' }) {
  const big = size === 'lg'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={big ? 44 : 34} />
      <span
        className={`font-bold leading-none tracking-[-0.035em] text-ink ${big ? 'text-[30px]' : 'text-[20px]'}`}
      >
        Clearpath
      </span>
    </span>
  )
}

/** The mark: three choices, one clear line through them. */
export function Mark({ size = 34 }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-[11px] bg-brand shadow-glow"
      style={{ height: size, width: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <path d="M4 19c3.6 0 4.2-6 7.6-6 3.4 0 4.1-6 8.4-6" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="4" cy="19" r="2" fill="rgba(255,255,255,0.45)" />
        <circle cx="20" cy="7" r="2.3" fill="white" />
      </svg>
    </span>
  )
}

export function Avatar({ profile, size = 40, className = '' }) {
  const initials = (profile?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${className}`}
      style={{
        height: size,
        width: size,
        // Deepened a touch so the white initials stay readable on every colour choice.
        background: `color-mix(in oklab, ${profile?.color || 'rgb(var(--c-brand))'} 82%, black)`,
        fontSize: size * 0.38,
      }}
    >
      {initials || '?'}
    </span>
  )
}

export function SchoolTile({ school, size = 44, className = '' }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[13px] font-semibold text-white ${className}`}
      style={{ height: size, width: size, background: school.hue, fontSize: size * 0.3 }}
    >
      {school.initials}
    </span>
  )
}

export function LevelPill({ level }) {
  if (!level || level === 'On-level') return null
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] ${
        LEVEL_STYLE[level] || 'bg-sunk text-ink-2'
      }`}
    >
      {level}
    </span>
  )
}

/** The department's icon on a soft tile of its colour. */
export function DeptBadge({ dept, size = 40, onTint = false, className = '' }) {
  return (
    <span
      aria-hidden
      className={`dept-ink grid shrink-0 place-items-center rounded-[30%] ${
        onTint ? 'bg-surface/85 shadow-card' : 'dept-soft'
      } ${className}`}
      style={{ '--dept': deptHue(dept), height: size, width: size }}
    >
      <Icon name={deptIcon(dept)} size={Math.round(size * 0.52)} stroke={1.8} />
    </span>
  )
}

/** Department name in its own colour, with its icon. */
export function DeptTag({ dept, group }) {
  return (
    <span
      className="dept-ink inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
      style={{ '--dept': deptHue(dept) }}
    >
      <Icon name={deptIcon(dept)} size={15} stroke={2} />
      {group || deptShort(dept)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

/** The ring: what share of students would take the class again. The one
 *  authored moment in the app: the arc sweeps and the number counts with it. */
export function TakeAgainDial({ share, count, size = 124 }) {
  const on = useEntrance(120)
  const verdict = verdictFor(share)
  const stroke = 12
  const r = (size - stroke - 2) / 2
  const c = 2 * Math.PI * r
  const pct = share == null ? 0 : share
  const shown = useCountUp(share == null ? null : Math.round(share * 100), on)
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ height: size, width: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--c-sunk))" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={verdict.tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={on ? c * (1 - pct) : c}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="tone-text-lg tnum text-[28px] font-bold leading-none tracking-tight" style={{ '--tone': verdict.tone }}>
            {share == null ? '–' : `${Math.round(shown)}%`}
          </span>
        </div>
      </div>
      <div className={`transition-[opacity,transform] delay-300 duration-500 ease-out ${on ? 'opacity-100' : 'translate-y-1 opacity-0'}`}>
        <div className="tone-text-lg text-[21px] font-bold tracking-[-0.025em]" style={{ '--tone': verdict.tone }}>
          {verdict.text}
        </div>
        <p className="mt-1 max-w-[15rem] text-[13.5px] leading-snug text-muted">
          {share == null
            ? 'Nobody has answered yet.'
            : `of ${count} ${count === 1 ? 'student' : 'students'} would take this class again.`}
        </p>
      </div>
    </div>
  )
}

/** Horizontal 1–10 bar with the number and what the number means. */
export function ScoreBar({ factorKey, value, delay = 0, size = 'md' }) {
  const on = useEntrance(delay)
  const factor = FACTOR_MAP[factorKey]
  const has = typeof value === 'number' && !Number.isNaN(value)
  const tone = has ? toneFor(factorKey, value) : NO_TONE
  const big = size === 'lg'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`font-semibold text-ink ${big ? 'text-[15px]' : 'text-[13px]'}`}>{factor?.label || factorKey}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-[12.5px] text-muted">{has ? bandLabel(factorKey, value) : 'No data'}</span>
          <span
            className={`tone-text tnum font-bold ${big ? 'text-[16px]' : 'text-[13px]'}`}
            style={{ '--tone': tone }}
          >
            {has ? value.toFixed(1) : '–'}
          </span>
        </span>
      </div>
      <div className={`mt-2 w-full overflow-hidden rounded-full bg-sunk ${big ? 'h-2.5' : 'h-2'}`}>
        <div
          className="h-full w-full origin-left rounded-full"
          style={{
            transform: `scaleX(${on && has ? value / 10 : 0})`,
            background: tone,
            transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
    </div>
  )
}

/** The compact score strip on a course card. */
export function MiniScores({ averages, delay = 0 }) {
  const keys = ['difficulty', 'workload', 'fun']
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key, i) => (
        <MiniScore key={key} factorKey={key} value={averages[key]} delay={delay + i * 70} />
      ))}
    </div>
  )
}

function MiniScore({ factorKey, value, delay }) {
  const on = useEntrance(delay)
  const factor = FACTOR_MAP[factorKey]
  const has = typeof value === 'number'
  const tone = has ? toneFor(factorKey, value) : NO_TONE
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="tone-text tnum text-[17px] font-bold leading-none" style={{ '--tone': tone }}>
          {has ? value.toFixed(1) : '–'}
        </span>
        <span className="text-[10.5px] leading-none text-muted">/10</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunk">
        <div
          className="h-full w-full origin-left rounded-full"
          style={{
            transform: `scaleX(${on && has ? value / 10 : 0})`,
            background: tone,
            transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <div className="mt-1.5 text-[11.5px] font-medium text-muted">{factor.short}</div>
    </div>
  )
}

/** Shown instead of averages when the sample is too small to mean anything. */
export function NeedsMoreReviews({ count, compact = false, onWrite }) {
  return (
    <div className={`rounded-2xl bg-sunk/70 ${compact ? 'px-3.5 py-3' : 'px-4 py-4'}`}>
      <div className="flex items-center gap-2.5">
        <span className="flex gap-1" aria-hidden>
          {Array.from({ length: MIN_REVIEWS }).map((_, i) => (
            <span key={i} className={`h-1.5 w-5 rounded-full ${i < count ? 'bg-brand' : 'bg-line'}`} />
          ))}
        </span>
        <span className="text-[13px] font-semibold text-ink-2">
          {count === 0 ? 'No reviews yet' : `${count} of ${MIN_REVIEWS} reviews`}
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-muted">
        {count === 0
          ? 'Read the course description below until someone reviews it.'
          : `Scores stay hidden until ${MIN_REVIEWS}. ${count === 1 ? 'One opinion' : 'Two opinions'} is not a pattern.`}
      </p>
      {onWrite && (
        <button
          type="button"
          onClick={onWrite}
          className="group mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink"
        >
          {count === 0 ? 'Be the first to review it' : 'Add your review'}
          <Icon name="arrow-right" size={15} stroke={2.2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  )
}

/** What the class is like day to day, sized by how many students said it. */
export function TagRow({ tags, limit = 6 }) {
  if (!tags.length) return <p className="text-[13px] text-muted">Nothing tagged yet.</p>
  const top = tags.slice(0, limit)
  const max = top[0].count
  return (
    <div className="flex flex-wrap items-center gap-2">
      {top.map(({ tag, count, share }) => {
        const weight = count / max
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium text-brand-deep"
            style={{
              fontSize: `${12.5 + weight * 2}px`,
              borderColor: `color-mix(in oklab, rgb(var(--c-brand)) ${Math.round(16 + weight * 30)}%, rgb(var(--c-line)))`,
              background: `color-mix(in oklab, rgb(var(--c-brand)) ${Math.round(4 + weight * 10)}%, rgb(var(--c-surface)))`,
            }}
          >
            {tag}
            <span className="tnum text-[11px] font-bold text-brand-ink">{Math.round(share * 100)}%</span>
          </span>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export function Toggle({ on, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        tick()
        onChange(!on)
      }}
      className="flex w-full items-start gap-3 text-left"
    >
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          on ? 'bg-brand' : 'bg-ink/15'
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-out ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      <span>
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{description}</span>}
      </span>
    </button>
  )
}

export function CompareButton({ on, onClick, big = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        tick()
        onClick(e)
      }}
      aria-pressed={on}
      title={on ? 'Remove from compare' : 'Add to compare'}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border ${big ? 'h-12 w-12' : 'h-9 w-9'} transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-90 ${
        on ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-brand-ink'
      } ${className}`}
    >
      {on ? (
        <Icon name="check" size={16} stroke={2.4} className="animate-pop-in" />
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
          <path d="M7 15V5M13 15V5" strokeLinecap="round" />
          <path d="M4 10h3M13 10h3" strokeLinecap="round" />
        </svg>
      )}
      <span className="sr-only">{on ? 'Remove from compare' : 'Add to compare'}</span>
    </button>
  )
}

/** The bar that stays up the whole time example reviews are switched on. */
export function SampleBanner({ onOff }) {
  return (
    <div className="border-b border-brand/15 bg-brand-wash">
      <div className="wrap flex items-center justify-between gap-3 py-2">
        <p className="text-[12.5px] leading-snug text-brand-deep">
          <span className="font-semibold">Sample reviews are on.</span>
          <span className="hidden sm:inline"> These are examples written to show how Clearpath works, not real student opinions.</span>
          <span className="sm:hidden"> Examples, not real opinions.</span>
        </p>
        {onOff && (
          <button
            type="button"
            onClick={onOff}
            className="shrink-0 rounded-full px-2 py-1 text-[12.5px] font-semibold text-brand-ink transition-colors hover:bg-brand-soft"
          >
            Turn off
          </button>
        )}
      </div>
    </div>
  )
}

export function SampleChip() {
  return (
    <span className="inline-flex items-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-brand-deep">
      Sample
    </span>
  )
}

export function BackButton({ onClick, label = 'Back' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group -ml-2 inline-flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-3 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-surface hover:text-brand-ink"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden
      >
        <path d="M11.5 5L6.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}

export function Empty({ title, body, action, icon = 'sparkle' }) {
  return (
    <div className="card px-6 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="mt-4 text-[17px] font-bold text-ink">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
