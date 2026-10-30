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
  | { type: 'tool_use'; id: string; name: string; input: unknown }
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
          parts.push({ functionCall: { name: block.name, args: block.input || {} } })
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

  const response = await fetch(
    `${API}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    // A wrong model id is the most likely first-run failure, and the fix is
    // knowing which ones this key can actually use. So go and find out.
    if (response.status === 404 || /not found|not supported/i.test(text)) {
      const names = await listModels(apiKey)
      throw new Error(
        `Gemini rejected the model "${model}". Models this key can use: ${
          names.length ? names.join(', ') : 'could not list them'
        }. Set GEMINI_MODEL on the worker to one of those.`
      )
    }
    if (response.status === 429) {
      throw new Error(
        'Gemini free tier rate limit reached. It resets on its own — wait a minute, or check your quota in Google AI Studio.'
      )
    }
    throw new Error(`Gemini error ${response.status}: ${text.slice(0, 300)}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const parts: unknown[] = []
  let finishReason: string | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''

    for (const chunk of chunks) {
      const line = chunk.trim()
      if (!line.startsWith('data:')) continue
      let payload: any
      try {
        payload = JSON.parse(line.slice(5).trim())
      } catch {
        continue
      }
      const candidate = payload.candidates?.[0]
      if (!candidate) continue
      if (candidate.finishReason) finishReason = candidate.finishReason

      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          // Same event shape the browser already handles for Claude.
          send({ type: 'content_block_delta', delta: { type: 'text_delta', text: part.text } })
          const last = parts[parts.length - 1] as any
          if (last?.text !== undefined) last.text += part.text
          else parts.push({ text: part.text })
        } else if (part.functionCall) {
          parts.push({ functionCall: part.functionCall })
        }
      }
    }
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
      .slice(0, 12)
  } catch {
    return []
  }
}
