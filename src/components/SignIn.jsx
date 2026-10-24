import { useState } from 'react'
import { Mark } from './Bits'

/**
 * The front door once Firebase is configured. One button, because a sign-up
 * form is the fastest way to lose someone who only wanted to read reviews.
 */
export function SignIn({ onSignIn }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSignIn()
    } catch (err) {
      setError(
        err?.code === 'auth/unauthorized-domain'
          ? 'This site is not on the project’s authorised domain list yet.'
          : err?.message || 'Could not sign in. Try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  const points = [
    ['It follows you', 'Your reviews and your four year plan show up on your phone, your laptop, the library computer.'],
    ['You keep control', 'You can edit or delete anything you wrote, because the account knows it was yours.'],
    ['Still anonymous', 'Reviews post without your name unless you choose to sign one. Other students never see who wrote what.'],
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <div className="wrap flex-1 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-md animate-rise-in">
          <Mark size={62} />
          <h1 className="mt-7 text-[36px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink">
            Pick next year
            <br />
            with the facts.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
            Course reviews for your school, written by the students who already took the class.
            Sign in once and it is yours on every device.
          </p>

          <button
            type="button"
            onClick={go}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface px-5 py-3.5 text-[15.5px] font-semibold text-ink shadow-card transition-all duration-200 hover:border-brand/40 hover:shadow-lift active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleG />
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </button>

          {error && (
            <p className="mt-3 rounded-2xl bg-warn-soft px-4 py-3 text-[13px] leading-snug text-warn">
              {error}
            </p>
          )}

          <div className="mt-9 space-y-4">
            {points.map(([title, body], i) => (
              <div key={title} className="flex gap-3.5 animate-rise-in" style={{ animationDelay: `${120 + i * 90}ms` }}>
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-9 text-[12.5px] leading-relaxed text-muted">
            Clearpath uses your Google account to know your reviews are yours. It reads your name,
            email and profile picture, and nothing else.
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleG() {
  return (
    <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}

/** Shown for the moment it takes Firebase to say whether anyone is signed in. */
export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <Mark size={48} />
        <span className="text-[13.5px] text-muted">Checking your account…</span>
      </div>
    </div>
  )
}

/** Offers to move what this browser was holding into the account just signed into. */
export function CarryOverPrompt({ carry, onImport, onDismiss }) {
  const [busy, setBusy] = useState(false)
  const bits = [
    carry.profile && 'your profile',
    carry.reviews && `${carry.reviews} ${carry.reviews === 1 ? 'review' : 'reviews'}`,
    carry.plan && 'your four year plan',
  ].filter(Boolean)

  return (
    <div className="border-b border-brand/20 bg-brand-wash">
      <div className="wrap flex flex-wrap items-center justify-between gap-3 py-2.5">
        <p className="text-[12.5px] leading-snug text-brand-deep">
          <span className="font-semibold">This browser already had {bits.join(', ')}.</span> Move it
          into your account?
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await onImport()
              setBusy(false)
            }}
            className="rounded-full bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Moving…' : 'Move it over'}
          </button>
          <button type="button" onClick={onDismiss} className="text-[12.5px] font-semibold text-muted hover:text-ink">
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}
