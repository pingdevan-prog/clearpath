import { useEffect, useState } from 'react'
import { FACTOR_MAP, bandLabel, toneFor, tint, verdictFor, MIN_REVIEWS, LEVEL_STYLE, deptHue } from '../lib/metrics'

/** Flips to true a frame after mount, so CSS transitions actually run. */
export function useEntrance(delay = 0) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), 20 + delay)
    return () => clearTimeout(id)
  }, [delay])
  return on
}

export function Logo({ size = 'md', className = '' }) {
  const big = size === 'lg'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={big ? 44 : 34} />
      <span
        className={`font-semibold leading-none tracking-[-0.03em] text-ink ${
          big ? 'text-[30px]' : 'text-[20px]'
        }`}
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
      className="grid shrink-0 place-items-center rounded-[11px] bg-brand shadow-card"
      style={{ height: size, width: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <path
          d="M4 19c3.6 0 4.2-6 7.6-6 3.4 0 4.1-6 8.4-6"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
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
        background: profile?.color || '#4F46E5',
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
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.09em] ${
        LEVEL_STYLE[level] || 'bg-sunk text-ink-2'
      }`}
    >
      {level}
    </span>
  )
}

export function DeptTag({ dept, group }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
      <span className="h-2 w-2 rounded-full" style={{ background: deptHue(dept) }} />
      {group || dept}
    </span>
  )
}

/** The ring: what share of students would take the class again. */
export function TakeAgainDial({ share, count, size = 118 }) {
  const on = useEntrance(80)
  const verdict = verdictFor(share)
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const pct = share == null ? 0 : share
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ height: size, width: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFF1F7" strokeWidth="11" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={verdict.tone}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={on ? c * (1 - pct) : c}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="tnum text-[26px] font-semibold leading-none" style={{ color: verdict.tone }}>
            {share == null ? '—' : `${Math.round(share * 100)}%`}
          </span>
        </div>
      </div>
      <div>
        <div className="text-[19px] font-semibold tracking-[-0.02em]" style={{ color: verdict.tone }}>
          {verdict.text}
        </div>
        <p className="mt-1 max-w-[15rem] text-[13px] leading-snug text-muted">
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
  const tone = has ? toneFor(factorKey, value) : '#CDD2DE'
  const big = size === 'lg'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`font-medium text-ink ${big ? 'text-[15px]' : 'text-[13px]'}`}>
          {factor?.label || factorKey}
        </span>
        <span className="flex items-baseline gap-2">
          <span className={`tnum font-semibold ${big ? 'text-[15px]' : 'text-[13px]'}`} style={{ color: tone }}>
            {has ? value.toFixed(1) : '—'}
          </span>
          <span className="text-[12px] text-muted">{has ? bandLabel(factorKey, value) : 'No data'}</span>
        </span>
      </div>
      <div
        className={`mt-1.5 w-full overflow-hidden rounded-full ${big ? 'h-2.5' : 'h-2'}`}
        style={{ background: '#EFF1F7' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: on && has ? `${(value / 10) * 100}%` : '0%',
            background: tone,
            transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
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
  const tone = has ? toneFor(factorKey, value) : '#CDD2DE'
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="tnum text-[17px] font-semibold leading-none" style={{ color: tone }}>
          {has ? value.toFixed(1) : '—'}
        </span>
        <span className="text-[10px] leading-none text-muted">/10</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#EFF1F7' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: on && has ? `${(value / 10) * 100}%` : '0%',
            background: tone,
            transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
        {factor.short}
      </div>
    </div>
  )
}

/** Shown instead of averages when the sample is too small to mean anything. */
export function NeedsMoreReviews({ count, compact = false, onWrite }) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-line bg-sunk/50 ${
        compact ? 'px-3.5 py-3' : 'px-4 py-4'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex gap-1" aria-hidden>
          {Array.from({ length: MIN_REVIEWS }).map((_, i) => (
            <span key={i} className={`h-1.5 w-4 rounded-full ${i < count ? 'bg-brand' : 'bg-line'}`} />
          ))}
        </span>
        <span className="text-[13px] font-semibold text-ink-2">
          {count === 0 ? 'No reviews yet' : `${count} of ${MIN_REVIEWS} reviews`}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-muted">
        {count === 0
          ? 'Read the course description below until someone reviews it.'
          : `Scores stay hidden until ${MIN_REVIEWS}. ${
              count === 1 ? 'One opinion' : 'Two opinions'
            } is not a pattern.`}
      </p>
      {onWrite && (
        <button type="button" onClick={onWrite} className="mt-2.5 text-[13px] font-semibold text-brand hover:text-brand-deep">
          Review it →
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
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium"
            style={{
              fontSize: `${12 + weight * 2.5}px`,
              borderColor: tint('#4F46E5', 0.14 + weight * 0.3),
              background: tint('#4F46E5', 0.035 + weight * 0.08),
              color: '#352FA8',
            }}
          >
            {tag}
            <span className="tnum text-[11px] font-semibold text-brand">{Math.round(share * 100)}%</span>
          </span>
        )
      })}
    </div>
  )
}

/** The 1–10 picker. One tap per factor, which is the whole point. */
export function Rating10({ factorKey, value, onChange, autoFocus = false }) {
  const factor = FACTOR_MAP[factorKey]
  const tone = value ? toneFor(factorKey, value) : '#CDD2DE'
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label className="text-[15px] font-semibold text-ink">{factor.question}</label>
        <span className="text-[13px] font-medium" style={{ color: value ? tone : '#747B91' }}>
          {value ? bandLabel(factorKey, value) : factor.hint}
        </span>
      </div>
      <div className="mt-2.5 flex gap-1 sm:gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => {
          const n = i + 1
          const active = value === n
          const filled = value != null && n <= value
          return (
            <button
              key={n}
              type="button"
              autoFocus={autoFocus && n === 1}
              aria-label={`${factor.label} ${n} out of 10`}
              aria-pressed={active}
              onClick={() => onChange(n)}
              className={`tnum h-11 flex-1 rounded-xl border text-[13px] font-semibold transition-all duration-150 active:scale-95 ${
                active ? 'text-white shadow-card' : filled ? 'text-white/95' : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-brand'
              }`}
              style={
                filled
                  ? {
                      background: active ? tone : tint(tone, 0.55),
                      borderColor: active ? tone : tint(tone, 0.55),
                    }
                  : undefined
              }
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div>
      {label && <div className="eyebrow mb-2">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt
          const text = typeof opt === 'object' ? opt.label : opt
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(value === val ? null : val)}
              className={`chip ${value === val ? 'chip-on' : ''}`}
            >
              {text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Toggle({ on, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-start gap-3 text-left"
    >
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          on ? 'bg-brand' : 'bg-line'
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
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

export function CompareButton({ on, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={on ? 'Remove from compare' : 'Add to compare'}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
        on ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-brand'
      } ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M7 15V5M13 15V5" strokeLinecap="round" />
        <path d="M4 10h3M13 10h3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{on ? 'Remove from compare' : 'Add to compare'}</span>
    </button>
  )
}

/** The bar that stays up the whole time example reviews are switched on. */
export function SampleBanner({ onOff }) {
  return (
    <div className="border-b border-brand/20 bg-brand-wash">
      <div className="wrap flex flex-wrap items-center justify-between gap-2 py-2">
        <p className="text-[12.5px] font-medium text-brand-deep">
          <span className="font-semibold">Sample reviews are on.</span> These are examples written to
          show how Clearpath works, not real student opinions.
        </p>
        {onOff && (
          <button type="button" onClick={onOff} className="text-[12.5px] font-semibold text-brand hover:text-brand-deep">
            Turn off
          </button>
        )}
      </div>
    </div>
  )
}

export function SampleChip() {
  return (
    <span className="inline-flex items-center rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.09em] text-brand-deep">
      Sample
    </span>
  )
}

export function BackButton({ onClick, label = 'Back' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-brand"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11.5 5L6.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}

export function Empty({ title, body, action }) {
  return (
    <div className="card px-6 py-12 text-center">
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
