// ---------------------------------------------------------------------------
// The Gemini path.
//
// Gemini's free tier is why this file exists. Everything it does is translate:
// the browser speaks Anthropic's message shape, and this turns it into
// Gemini's, then turns Gemini's answer back. The browser never finds out which
// model answered, so switching providers is a matter of which secret is set on
// the worker — no app rebuild, no client code.
// ---------------------------------------------------------------------------

const API = 'https://generativelanguage.googleapis.com/v1beta'

type AnthropicBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown; gemini_thought_signature?: string }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicBlock[]
}

interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/**
 * Gemini rejects several JSON Schema keywords Anthropic accepts. Strip them
 * rather than let the whole request 400 over `additionalProperties`.
 */
function cleanSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(cleanSchema)
  if (!schema || typeof schema !== 'object') return schema
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
    if (k === 'additionalProperties' || k === 'strict' || k === '$schema') continue
    out[k] = cleanSchema(v)
  }
  return out
}

function toGeminiTools(tools: AnthropicTool[]) {
  if (!tools?.length) return undefined
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: cleanSchema(t.input_schema),
      })),
    },
  ]
}

/**
 * Anthropic messages -> Gemini contents.
 *
 * The awkward part: Anthropic refers to a tool result by the id of the call,
 * while Gemini refers to it by the function's NAME. So we walk forward keeping
 * a map of id -> name as the assistant's calls go by.
 */
function toGeminiContents(messages: AnthropicMessage[]) {
  const idToName = new Map<string, string>()
  const contents: Array<{ role: 'user' | 'model'; parts: unknown[] }> = []

  for (const message of messages) {
    const parts: unknown[] = []

    if (typeof message.content === 'string') {
      if (message.content) parts.push({ text: message.content })
    } else {
      for (const block of message.content) {
        if (block.type === 'text' && block.text) {
          parts.push({ text: block.text })
        } else if (block.type === 'tool_use') {
          idToName.set(block.id, block.name)
          // Gemini 3 signs each function call and rejects the next request
          // with a 400 if the signature does not come back with it.
          parts.push({
            functionCall: { name: block.name, args: block.input || {} },
            ...(block.gemini_thought_signature
              ? { thoughtSignature: block.gemini_thought_signature }
              : {}),
          })
        } else if (block.type === 'tool_result') {
          const name = idToName.get(block.tool_use_id) || 'unknown_tool'
          let response: unknown
          try {
            response = JSON.parse(block.content)
          } catch {
            response = { result: block.content }
          }
          parts.push({ functionResponse: { name, response: { result: response } } })
        }
      }
    }

    if (!parts.length) continue
    const role = message.role === 'assistant' ? 'model' : 'user'
    // Gemini wants consecutive same-role turns merged.
    const last = contents[contents.length - 1]
    if (last && last.role === role) last.parts.push(...parts)
    else contents.push({ role, parts })
  }

  return contents
}

/** Gemini's answer, rebuilt in the shape the browser's tool loop expects. */
function toAnthropicMessage(parts: unknown[], finishReason: string | undefined) {
  const content: AnthropicBlock[] = []
  let calls = 0
  for (const part of parts as Array<Record<string, any>>) {
    if (part.text) {
      content.push({ type: 'text', text: part.text })
    } else if (part.functionCall) {
      calls += 1
      content.push({
        type: 'tool_use',
        id: `gemini_${Date.now()}_${calls}`,
        name: part.functionCall.name,
        input: part.functionCall.args || {},
        ...(part.thoughtSignature ? { gemini_thought_signature: part.thoughtSignature } : {}),
      })
    }
  }
  return {
    id: `msg_gemini_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content,
    stop_reason: calls > 0 ? 'tool_use' : finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn',
  }
}

/**
 * Stream one turn from Gemini, emitting the same SSE events the browser
 * already parses for Claude.
 */
export async function streamGemini(opts: {
  apiKey: string
  model: string
  system?: string
  messages: AnthropicMessage[]
  tools?: AnthropicTool[]
  maxTokens: number
  send: (event: unknown) => void
}) {
  const { apiKey, model, system, messages, tools, maxTokens, send } = opts

  const body = {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: toGeminiContents(messages),
    ...(tools?.length ? { tools: toGeminiTools(tools) } : {}),
    generationConfig: { maxOutputTokens: maxTokens },
  }

  // Never hang forever: a stalled upstream should surface as a message the
  // student can read, not a request that never returns.
  const timeout = AbortSignal.timeout(45_000)
  let response: Response
  try {
    response = await fetch(
      `${API}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: timeout,
      }
    )
  } catch (err) {
    if ((err as Error)?.name === 'TimeoutError') {
      throw new Error(`Gemini did not respond within 45 seconds for model "${model}".`)
    }
    throw err
  }

  if (!response.ok) {
    const text = await response.text()
    // A wrong model id is the most likely first-run failure, and the fix is
    // knowing which ones this key can actually use. So go and find out.
    if (response.status === 404) {
      const names = await listModels(apiKey)
      throw new Error(
        `Gemini rejected the model "${model}" (404). Models this key can use: ${
          names.length ? names.join(', ') : 'could not list them'
        }. Set GEMINI_MODEL on the worker to one of those. Google said: ${text.slice(0, 200)}`
      )
    }
    if (response.status === 400 || response.status === 403) {
      // Never swallow what Google actually said - it names the field or the
      // permission at fault, and guessing from the status code wastes an hour.
      throw new Error(`Gemini ${response.status}: ${text.slice(0, 400)}`)
    }
    if (response.status === 429) {
      // Google says WHICH quota ran out - per minute or per day - and its size.
      // That difference decides whether to wait a minute or wait until tomorrow.
      let detail = ''
      try {
        const err = JSON.parse(text)?.error
        const violations = (err?.details || []).flatMap((d: any) => d.violations || [])
        detail = violations
          .map((v: any) => `${v.quotaId || v.quotaMetric}${v.quotaValue ? ` (limit ${v.quotaValue})` : ''}`)
          .join('; ')
        const retry = (err?.details || []).find((d: any) => d.retryDelay)?.retryDelay
        if (retry) detail += `${detail ? '; ' : ''}retry after ${retry}`
      } catch {
        /* keep it generic */
      }
      throw new Error(
        `Gemini free tier limit reached${detail ? `: ${detail}` : ''}. Check usage in Google AI Studio.`
      )
    }
    throw new Error(`Gemini error ${response.status}: ${text.slice(0, 300)}`)
  }

  const parts: unknown[] = []
  let finishReason: string | undefined
  let blockReason: string | undefined
  let raw = ''

  /** Handle one SSE event's data payload. */
  const handle = (data: string) => {
    let payload: any
    try {
      payload = JSON.parse(data)
    } catch {
      return
    }
    if (payload.promptFeedback?.blockReason) blockReason = payload.promptFeedback.blockReason
    const candidate = payload.candidates?.[0]
    if (!candidate) return
    if (candidate.finishReason) finishReason = candidate.finishReason
    for (const part of candidate.content?.parts || []) {
      // Thought summaries are not the answer; never show them as reply text.
      if (part.thought) continue
      if (typeof part.text === 'string' && part.text) {
        send({ type: 'content_block_delta', delta: { type: 'text_delta', text: part.text } })
        const last = parts[parts.length - 1] as any
        if (last && typeof last.text === 'string') last.text += part.text
        else parts.push({ text: part.text })
      } else if (part.functionCall) {
        parts.push({
          functionCall: part.functionCall,
          ...(part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {}),
        })
      }
    }
  }

  /** Split complete events off the front of the buffer, keep the remainder. */
  const drain = (buffer: string, final: boolean): string => {
    const normalised = buffer.replace(/\r\n/g, '\n')
    const events = normalised.split('\n\n')
    // The last piece may be a half-received event, unless the stream is over.
    const rest = final ? '' : events.pop() || ''
    for (const event of events) {
      const data = event
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('')
      if (data) handle(data)
    }
    return rest
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    raw += text
    buffer = drain(buffer + text, false)
  }
  // Whatever is still buffered when the stream closes is the last event, and
  // dropping it is how a whole reply goes missing.
  buffer += decoder.decode()
  drain(buffer, true)

  if (!parts.length) {
    throw new Error(
      `Gemini returned no content for model "${model}" (finishReason: ${
        finishReason || 'none'
      }${blockReason ? `, blocked: ${blockReason}` : ''}). Received ${raw.length} bytes: ${
        raw.slice(0, 400) || '(empty body)'
      }`
    )
  }

  return toAnthropicMessage(parts, finishReason)
}

async function listModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`${API}/models`, { headers: { 'x-goog-api-key': apiKey } })
    if (!res.ok) return []
    const data: any = await res.json()
    return (data.models || [])
      .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m: any) => String(m.name).replace(/^models\//, ''))
      .slice(0, 30)
  } catch {
    return []
  }
}
