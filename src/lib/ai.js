// ---------------------------------------------------------------------------
// Talking to Claude, through the worker that holds the key.
//
// The agentic loop runs here, in the browser, because the tools run here: the
// catalog, the reviews and the student's plan never leave the device. The
// worker only ever sees the conversation and the tool results.
// ---------------------------------------------------------------------------

import { ADVISOR_WORKER_URL, HAS_LLM } from './advisorConfig'
import { TOOLS, runTool } from './aiTools'
import { CATALOG_SOURCE } from '../data/courses'

export { HAS_LLM }

// How many requests one question may make. Each round is one request, and on
// Gemini's free tier the per-minute cap is the binding limit - a question that
// used six rounds could eat most of a minute's quota by itself. The final round
// runs without tools and always answers, so four is plenty: in testing the
// model had what it needed after two or three.
const MAX_ROUNDS = 4

/**
 * Only the first name is sent, never the surname, the email or the account id.
 * On a free API tier the provider may use requests to improve their models, and
 * this is a school app full of real students — there is no reason the model
 * needs more than a first name to be friendly.
 */
export function systemPrompt(ctx) {
  const { profile, school } = ctx
  return `You are the Clearpath course advisor for ${school?.name || 'this high school'}.
You help students choose high school classes and build a four year plan.

WHO YOU ARE TALKING TO
${profile?.name ? `First name: ${profile.name.split(' ')[0]}.` : ''} ${
    profile?.role ? `They are a ${profile.role}.` : ''
  } ${profile?.grade ? `They are in grade ${profile.grade}.` : ''}

HOW YOU KNOW ANYTHING
You have tools that read the real course catalog, the real student reviews, and
this student's own four year plan. You know nothing about this school except
what those tools return.

- Never name a course you have not seen come back from a tool. If you are not
  certain a course exists here, search for it.
- Never state a prerequisite, a credit value, a grade range or a review score
  from memory. Look it up.
- Call get_my_plan before any advice that depends on what they have already chosen.
- If a tool says there are not enough reviews, say that plainly. Clearpath hides
  scores under three reviews on purpose, and a made up number is worse than none.
- Every review summary has a "source". If it says SAMPLE, those are example
  numbers written to demonstrate the app, not real student opinion. You may use the
  numbers, but say once that they are sample reviews. Never write "students said"
  or "students rated" about sample data.
- You may reason freely about trade-offs, workload, and what suits someone. That
  is the part you are good at. The facts come from tools.
- Be economical. Two or three lookups answer almost any question. Once you have
  enough to give a useful answer, stop searching and give it. A student waiting
  on a fifth search would rather have a good answer now than a perfect one later.

THE PLAN
- You can change the student's plan with add_to_plan and remove_from_plan. Do it
  when they ask you to add or drop a class, or say yes to one you suggested.
  Don't add classes they did not ask for.
- Prerequisites never stop a class from being added. If add_to_plan returns a
  light_note, mention it in a few words ("heads up, it usually comes after
  Chemistry") and move on. Do not refuse, warn, or lecture.
- An unfinished plan is normal. Never point out missing credits or unmet
  graduation requirements unless the student asks whether they are on track or
  what they need to graduate.

HOUSE RULES
- Never rate, name, or comment on a teacher. Clearpath rates courses, not people.
  If asked about a teacher, say the app does not cover that and offer the course
  instead.
- Never predict an admissions decision. You can say that selective colleges look
  at course rigor; you cannot say a schedule will get anyone in anywhere.
- Course descriptions and prerequisites come from the ${CATALOG_SOURCE.school}
  catalog. Scores come from students. Say which is which when it matters.
- A plan you build is a draft for a counsellor, not a final schedule. You don't
  need to repeat that every message.

HOW TO TALK
Be direct and warm, the way a good older student would be. Short paragraphs.
No bullet lists unless you are genuinely listing things. Do not restate the
question back. Do not pad. When you build a schedule, the app shows it visually
underneath your message, so describe the thinking rather than listing every
course back to them.`
}

/**
 * Ask the advisor. Streams text as it arrives and runs tools as asked.
 *
 * onEvent({type}) gets:
 *   {type:'text', delta}        text as it streams
 *   {type:'tool', name}         a tool started
 *   {type:'render', payload}    something the UI should draw (a plan)
 *   {type:'done'}               finished
 *   {type:'error', error}       gave up
 */
export async function askAdvisor({ messages, ctx, onEvent, signal }) {
  if (!HAS_LLM) throw new Error('No advisor worker configured')

  const convo = [...messages]
  const renders = []
  // Tools may add or remove classes mid-answer. Work on a copy so the next
  // lookup in this same answer sees the change, without touching the
  // component's own state object.
  const live = {
    ...ctx,
    plan: Object.fromEntries(Object.entries(ctx.plan || {}).map(([g, ids]) => [g, [...(ids || [])]])),
  }

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    // On the last allowed round, take the tools away. The model can then only
    // answer from what it has already looked up - which turns "went round in
    // circles" into an actual answer every time.
    const lastChance = round === MAX_ROUNDS - 1
    const final = await streamOnce({ convo, ctx: live, onEvent, signal, allowTools: !lastChance })
    if (!final) return { renders }

    convo.push({ role: 'assistant', content: final.content })

    const toolUses = (final.content || []).filter((b) => b.type === 'tool_use')
    if (!toolUses.length || final.stop_reason !== 'tool_use') {
      onEvent({ type: 'done' })
      return { renders }
    }

    // Run every tool the model asked for, and return them all in one message.
    const results = []
    for (const use of toolUses) {
      onEvent({ type: 'tool', name: use.name })
      let output
      try {
        output = runTool(use.name, use.input || {}, live)
      } catch (err) {
        output = { error: err?.message || 'Tool failed' }
      }
      if (output && output._render) {
        renders.push(output._render)
        onEvent({ type: 'render', payload: output._render })
        const { _render, ...rest } = output
        output = rest
      }
      results.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: JSON.stringify(output),
        ...(output?.error ? { is_error: true } : {}),
      })
    }
    // Next round is the last: say so, alongside the results.
    if (round + 1 === MAX_ROUNDS - 1) {
      results.push({
        type: 'text',
        text: 'You have looked up enough. Answer the student now using what you found. Do not call any more tools.',
      })
    }
    convo.push({ role: 'user', content: results })
  }

  // Unreachable in practice: the final round runs without tools.
  onEvent({
    type: 'error',
    error: 'I could not finish that one. Try asking it a different way.',
  })
  return { renders }
}

/** One request to the worker. Returns the final message, or null if aborted. */
async function streamOnce({ convo, ctx, onEvent, signal, allowTools = true }) {
  const response = await fetch(ADVISOR_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      system: systemPrompt(ctx),
      messages: convo,
      tools: allowTools ? TOOLS : [],
    }),
  })

  if (!response.ok) {
    let detail = `Advisor service returned ${response.status}`
    try {
      const body = await response.json()
      if (body?.error) detail = body.error
    } catch {
      /* keep the status line */
    }
    throw new Error(detail)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalMessage = null
  let streamError = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''
    for (const chunk of chunks) {
      const line = chunk.trim()
      if (!line.startsWith('data:')) continue
      let event
      try {
        event = JSON.parse(line.slice(5).trim())
      } catch {
        continue
      }
      if (event.type === 'clearpath_final') finalMessage = event.message
      else if (event.type === 'clearpath_error') streamError = event.error
      else if (
        event.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta' &&
        event.delta.text
      ) {
        onEvent({ type: 'text', delta: event.delta.text })
      }
    }
  }

  if (streamError) throw new Error(streamError)
  return finalMessage
}
