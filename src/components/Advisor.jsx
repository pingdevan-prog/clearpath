import { useEffect, useMemo, useRef, useState } from 'react'
import { COURSE_MAP } from '../data/courses'
import { GOALS, INTERESTS, RIGOR } from '../data/pathways'
import { STARTERS, answer } from '../lib/answers'
import { HAS_LLM, askAdvisor } from '../lib/ai'
import { creditsOf } from '../lib/plan'
import { PLAN_GRADES } from '../lib/store'
import { deptHue, toneFor, verdictFor } from '../lib/metrics'
import { LevelPill } from './Bits'

/**
 * The advisor. Reads the student's plan, the catalog and every review, and
 * answers in the only currency that matters here: real courses, with the
 * reason each one was picked.
 */
export function Advisor({ statsByCourse, plan, profile, school, onApplyPlan, onOpenCourse, onClose }) {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: `Hi${profile?.name ? ` ${profile.name.split(' ')[0]}` : ''}. I can read all 306 courses, their prerequisites, and every review students have written. ${
        HAS_LLM
          ? 'Ask me anything about your schedule.'
          : 'Ask me anything, or start with one of these.'
      }`,
    },
  ])
  const [input, setInput] = useState('')
  const [prefs, setPrefs] = useState({})
  const [thinking, setThinking] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  const ctx = useMemo(
    () => ({ statsByCourse, plan, profile, prefs }),
    [statsByCourse, plan, profile, prefs]
  )

  // The conversation as the model sees it, kept alongside the rendered one.
  const historyRef = useRef([])
  const abortRef = useRef(null)

  const send = (text) => {
    const clean = text.trim()
    if (!clean || thinking) return
    setMessages((m) => [...m, { from: 'me', text: clean }])
    setInput('')
    setThinking(true)
    if (HAS_LLM) sendToModel(clean)
    else sendToEngine(clean)
  }

  /** The built-in engine: instant, offline, no model. */
  const sendToEngine = (clean) => {
    setTimeout(() => {
      const result = answer(clean, ctx)
      if (result.prefs) setPrefs(result.prefs)
      setMessages((m) => [...m, { from: 'bot', ...result }])
      setThinking(false)
      inputRef.current?.focus()
    }, 260)
  }

  /** Claude, with the catalog and the reviews as its tools. */
  const sendToModel = async (clean) => {
    historyRef.current = [...historyRef.current, { role: 'user', content: clean }]
    const controller = new AbortController()
    abortRef.current = controller

    // One streaming bubble that fills in as the answer arrives.
    let streamed = ''
    let index = -1
    setMessages((m) => {
      index = m.length
      return [...m, { from: 'bot', text: '', streaming: true }]
    })
    const update = (patch) =>
      setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, ...patch } : msg)))

    try {
      await askAdvisor({
        messages: historyRef.current,
        ctx,
        signal: controller.signal,
        onEvent: (e) => {
          if (e.type === 'text') {
            streamed += e.delta
            update({ text: streamed, streaming: true, tool: null })
          } else if (e.type === 'tool') {
            update({ tool: TOOL_LABELS[e.name] || 'Looking it up' })
          } else if (e.type === 'render' && e.payload?.type === 'plan') {
            update({ plan: e.payload.plan })
          } else if (e.type === 'done') {
            update({ streaming: false, tool: null })
          } else if (e.type === 'error') {
            update({ streaming: false, tool: null, text: streamed || e.error, error: !streamed })
          }
        },
      })
      // Keep the model's own words in its history so follow-ups make sense.
      if (streamed) {
        historyRef.current = [...historyRef.current, { role: 'assistant', content: streamed }]
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        update({
          streaming: false,
          tool: null,
          text:
            streamed ||
            `I could not reach the advisor service. ${err?.message || ''}`.trim(),
          error: !streamed,
          chips: streamed ? undefined : ['Build me a schedule for engineering', 'Which science class is easiest?'],
        })
      }
    } finally {
      setThinking(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }

  useEffect(() => () => abortRef.current?.abort(), [])

  return (
    <div className="card flex h-[32rem] flex-col overflow-hidden sm:h-[34rem]">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Spark />
          <div>
            <h2 className="text-[15px] font-semibold leading-tight text-ink">Schedule advisor</h2>
            <p className="text-[12px] leading-tight text-muted">
              {HAS_LLM
                ? 'Claude, reading your plan, the catalog and every review'
                : 'Reads your plan, the catalog and every review'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:text-ink"
            aria-label="Close advisor"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </header>

      <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <Message
            key={i}
            message={m}
            onApplyPlan={onApplyPlan}
            onOpenCourse={onOpenCourse}
            onChip={send}
          />
        ))}

        {messages.length === 1 && !HAS_LLM && (
          <div className="flex flex-wrap gap-2 pt-1">
            {STARTERS.map((s) => (
              <button key={s.label} type="button" onClick={() => send(s.text)} className="chip">
                {s.label}
              </button>
            ))}
          </div>
        )}

        {messages.length === 1 && HAS_LLM && (
          <div className="flex flex-wrap gap-2 pt-1">
            {STARTERS.slice(0, 6).map((s) => (
              <button key={s.label} type="button" onClick={() => send(s.text)} className="chip">
                {s.label}
              </button>
            ))}
          </div>
        )}

        {thinking && !HAS_LLM && (
          <div className="flex items-center gap-1.5 text-muted">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
                style={{ animationDelay: `${i * 140}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <PrefsBar prefs={prefs} />

      <form
        className="flex items-center gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          ref={inputRef}
          className="field flex-1 py-2.5"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a class, or say what you are aiming at"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-deep disabled:opacity-40"
          aria-label="Send"
        >
          <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 10h11M10.5 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  )
}

/** What to show while a tool runs, so the pause is legible. */
const TOOL_LABELS = {
  search_courses: 'Searching the catalog',
  get_course: 'Reading the course',
  get_my_plan: 'Checking your plan',
  build_schedule: 'Building a schedule',
  rank_courses: 'Reading the reviews',
  check_prerequisites: 'Checking prerequisites',
}

function Spark() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-brand">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** What the advisor currently believes about you, visible and correctable. */
function PrefsBar({ prefs }) {
  const bits = []
  const goal = GOALS.find((g) => g.id === prefs.goal && g.id !== 'undecided')
  if (goal) bits.push(goal.label)
  const rigor = RIGOR.find((r) => r.id === prefs.rigor)
  if (rigor && prefs.rigor !== 'balanced') bits.push(rigor.label)
  if (prefs.lowWork) bits.push('Low homework')
  for (const id of prefs.interests || []) {
    const i = INTERESTS.find((x) => x.id === id)
    if (i) bits.push(i.label)
  }
  if (!bits.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-line bg-sunk/50 px-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Going on</span>
      {bits.map((b) => (
        <span key={b} className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-medium text-ink-2">
          {b}
        </span>
      ))}
    </div>
  )
}

function Message({ message, onApplyPlan, onOpenCourse, onChip }) {
  if (message.from === 'me') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-[14px] leading-relaxed text-white">
          {message.text}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {message.tool && (
        <div className="flex items-center gap-2 px-1 text-[12.5px] text-muted">
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 animate-pulse rounded-full bg-brand"
                style={{ animationDelay: `${i * 140}ms` }}
              />
            ))}
          </span>
          {message.tool}
        </div>
      )}

      {(message.text || !message.tool) && (
        <div
          className={`max-w-[92%] rounded-2xl rounded-bl-md px-3.5 py-2.5 ${
            message.error ? 'bg-warn-soft' : 'bg-sunk'
          }`}
        >
          <RichText text={message.text} />
          {message.streaming && message.text && (
            <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-ink-2 align-middle" />
          )}
        </div>
      )}

      {message.plan && <PlanProposal plan={message.plan} onApply={onApplyPlan} onOpenCourse={onOpenCourse} />}

      {message.courses?.length > 0 && !message.plan && (
        <div className="space-y-1.5">
          {message.courses.map((c, i) => (
            <CourseLine
              key={c.id}
              course={c}
              detail={message.scored?.[i]}
              onOpen={() => onOpenCourse(c.id)}
            />
          ))}
        </div>
      )}

      {message.chips?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.chips.map((c) => (
            <button key={c} type="button" onClick={() => onChip(c)} className="chip">
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Bold markers only — the advisor never emits arbitrary markup. */
function RichText({ text }) {
  return (
    <div className="space-y-2">
      {String(text)
        .split('\n\n')
        .map((para, i) => (
          <p key={i} className="whitespace-pre-line text-[14px] leading-relaxed text-ink-2">
            {para.split(/(\*\*[^*]+\*\*)/g).map((bit, j) =>
              bit.startsWith('**') && bit.endsWith('**') ? (
                <strong key={j} className="font-semibold text-ink">
                  {bit.slice(2, -2)}
                </strong>
              ) : (
                bit
              )
            )}
          </p>
        ))}
    </div>
  )
}

function CourseLine({ course, detail, onOpen }) {
  const rv = detail?.review
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-brand/40 hover:bg-brand-wash"
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: deptHue(course.dept) }} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13.5px] font-semibold leading-snug text-ink">{course.name}</span>
          <LevelPill level={course.level} />
        </span>
        {rv && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[11.5px] text-muted">
            <span style={{ color: toneFor('difficulty', rv.difficulty) }}>
              Difficulty {rv.difficulty.toFixed(1)}
            </span>
            <span style={{ color: toneFor('workload', rv.workload) }}>
              Homework {rv.workload.toFixed(1)}
            </span>
            <span style={{ color: verdictFor(rv.takeAgain).tone }}>
              {Math.round(rv.takeAgain * 100)}% retake
            </span>
          </span>
        )}
        {detail?.reasons?.length > 0 && (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
            {detail.reasons[0]}
          </span>
        )}
      </span>
    </button>
  )
}

function PlanProposal({ plan, onApply, onOpenCourse }) {
  const [applied, setApplied] = useState(false)
  const byGrade = PLAN_GRADES.map((g) => ({
    grade: g,
    courses: plan.years[g].map((id) => COURSE_MAP[id]).filter(Boolean),
    reasons: Object.fromEntries(plan.added.filter((a) => a.grade === g).map((a) => [a.course.id, a.reasons?.[0]])),
  }))

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand-wash/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-brand-deep">
          Proposed plan
        </span>
        <span className="tnum text-[12px] text-muted">{plan.tally.total} credits</span>
      </div>

      <div className="mt-2.5 space-y-2.5">
        {byGrade.map(({ grade, courses, reasons }) => (
          <div key={grade}>
            <div className="text-[11.5px] font-semibold text-ink-2">
              {grade}th · {courses.reduce((n, c) => n + creditsOf(c), 0)} credits
            </div>
            <div className="mt-1 space-y-1">
              {courses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onOpenCourse(c.id)}
                  className="flex w-full items-baseline gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-surface"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: deptHue(c.dept) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-[13px] font-medium leading-snug text-ink">{c.name}</span>
                    {reasons[c.id] && (
                      <span className="block text-[11px] leading-snug text-muted">{reasons[c.id]}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={applied}
        onClick={() => {
          onApply(plan.years)
          setApplied(true)
        }}
        className="btn-primary mt-3 w-full py-2.5 text-[14px]"
      >
        {applied ? 'Added to your plan' : 'Use this plan'}
      </button>
      <p className="mt-2 text-[11px] leading-snug text-muted">
        A draft to take to your counsellor, not a final schedule. Course availability and conflicts
        are decided at the school.
      </p>
    </div>
  )
}
