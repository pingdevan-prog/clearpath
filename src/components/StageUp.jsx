import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { STAGES } from '../lib/stages'
import { StageMedal } from './Bits'

// Confetti in every stage colour, thrown out from behind the new badge.
const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 + 0.2
  const dist = 78 + (i % 3) * 16
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist)}px`,
    color: STAGES[i % STAGES.length].hue,
    size: i % 2 ? 7 : 10,
    round: i % 3 !== 0,
    delay: 260 + (i % 4) * 35,
  }
})

/** The moment a review carries you into a new stage. */
export function StageUpModal({ stage, onClose, onSeeProgress }) {
  const keep = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  const index = STAGES.indexOf(stage)
  const next = STAGES[index + 1]

  // Once per opening: the parent re-renders whenever reviews sync, and that
  // must not buzz the phone or steal focus again.
  useEffect(() => {
    keep.current?.focus()
    try {
      navigator.vibrate?.([14, 70, 28])
    } catch {
      /* not supported */
    }
    const onKey = (e) => e.key === 'Escape' && close.current()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-5" role="dialog" aria-modal="true" aria-labelledby="stage-up-title">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div
        className="dept-glow relative w-full max-w-sm animate-pop-in rounded-4xl border border-line/70 bg-raised px-6 pb-6 pt-8 text-center shadow-lift"
        style={{ '--dept': stage.hue, '--glow': '22%' }}
      >
        <div className="relative mx-auto grid h-28 w-28 place-items-center">
          <span aria-hidden className="absolute inset-0 animate-ring rounded-full" style={{ background: `color-mix(in oklab, ${stage.hue} 40%, transparent)` }} />
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              aria-hidden
              className={`absolute left-1/2 top-1/2 -ml-1 -mt-1 animate-burst ${c.round ? 'rounded-full' : 'rounded-[2px]'}`}
              style={{
                '--dx': c.dx,
                '--dy': c.dy,
                width: c.size,
                height: c.round ? c.size : c.size * 0.55,
                background: c.color,
                animationDelay: `${c.delay}ms`,
              }}
            />
          ))}
          <StageMedal stage={stage} size={96} className="animate-pop-in" />
        </div>

        <p className="dept-ink mt-6 text-[13.5px] font-semibold">
          Stage {index + 1} of {STAGES.length} unlocked
        </p>
        <h2 id="stage-up-title" className="mt-1 text-[28px] font-bold leading-tight text-ink">
          You are now a {stage.name}
        </h2>
        <p className="mx-auto mt-2.5 max-w-[19rem] text-[15px] leading-relaxed text-ink-2">{stage.blurb}</p>

        {/* Where you are on the trail */}
        <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden>
          {STAGES.map((s, i) => (
            <span
              key={s.name}
              className="h-1.5 w-7 rounded-full"
              style={{ background: i <= index ? s.hue : 'rgb(var(--c-line))' }}
            />
          ))}
        </div>
        <p className="mt-2.5 text-[13px] text-muted">
          {next ? `Next is ${next.name}, at ${next.at} reviews.` : 'That is the last stage. Thank you for every one of them.'}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button ref={keep} type="button" onClick={onClose} className="btn-primary w-full">
            Keep going
          </button>
          {onSeeProgress && (
            <button type="button" onClick={onSeeProgress} className="btn-ghost w-full">
              See your progress
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
