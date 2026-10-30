// ---------------------------------------------------------------------------
// Clearpath advisor worker.
//
// The only reason this exists: an API key cannot ship in a static site. The
// browser sends a conversation and the tool results it computed locally; this
// worker adds the key and the model settings and streams Claude's reply back.
//
// It deliberately does NOT accept a model, a system prompt, or a token budget
// from the client. Those are fixed here, so the worker cannot be turned into
// somebody else's free Claude proxy by anyone who finds the URL.
// ---------------------------------------------------------------------------

import Anthropic from '@anthropic-ai/sdk'
import { streamGemini } from './gemini'

export interface Env {
  // Whichever of these is set decides who answers. Gemini wins if both are,
  // because it is the free one and that is the likely intent.
  GEMINI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  GEMINI_MODEL?: string
  ALLOWED_ORIGINS: string
}

// One request may run a few tool rounds; this caps what any single turn costs.
const MAX_TOKENS = 4096

// Which model answers. Per million tokens, input / output / cached input:
//   claude-opus-5-5    $4.00 / $20.00 / $0.20   best reasoning
//   claude-sonnet-5-5  $2.00 / $10.00 / $0.20   most of the quality, half the price
//   claude-haiku-5-5   $0.10 /  $0.50 / $0.20   ~40x cheaper in, weaker on open questions
// Change this one line to move between them.
const MODEL = 'claude-opus-5-5'

// Gemini's free tier. Flash-class models are the ones with a usable free
// quota; Pro is restricted or paid.
//
// Found by testing, not by reading docs: gemini-2.5-flash is retired for new
// users, and gemini-flash-latest and gemini-3.8-flash both hung for 45s with
// no response on a fresh free-tier key. gemini-3-flash-preview answered and
// handled tool calls. If it is ever withdrawn, the worker lists the ids your
// key can use in its error message - set GEMINI_MODEL to one of those.
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const ok = origin && allowed.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405, cors)
    }

    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
    if (origin && allowed.length && !allowed.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, cors)
    }
    const useGemini = !!env.GEMINI_API_KEY
    if (!useGemini && !env.ANTHROPIC_API_KEY) {
      return json(
        { error: 'The worker has no GEMINI_API_KEY or ANTHROPIC_API_KEY set.' },
        500,
        cors
      )
    }

    let body: { system?: string; messages?: unknown; tools?: unknown }
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Body must be JSON' }, 400, cors)
    }

    const messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages must be a non-empty array' }, 400, cors)
    }
    // A conversation this long is a runaway loop, not a student asking about
    // their schedule.
    if (messages.length > 60) {
      return json({ error: 'Conversation too long' }, 400, cors)
    }

    const encoder = new TextEncoder()
    const sse = (controller: ReadableStreamDefaultController, event: unknown) =>
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))

    const readable = new ReadableStream({
      async start(controller) {
        try {
          if (useGemini) {
            const final = await streamGemini({
              apiKey: env.GEMINI_API_KEY!,
              model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
              system: typeof body.system === 'string' ? body.system : undefined,
              messages: messages as any,
              tools: Array.isArray(body.tools) ? (body.tools as any) : undefined,
              maxTokens: MAX_TOKENS,
              send: (event) => sse(controller, event),
            })
            sse(controller, { type: 'clearpath_final', message: final })
          } else {
            const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! })
            const stream = client.messages.stream({
              model: MODEL,
              max_tokens: MAX_TOKENS,
              // The system prompt and the six tool definitions are ~2,000
              // tokens and byte-identical on every request, and a tool round
              // re-sends the whole conversation. Caching the prefix drops
              // those repeats from $4 to $0.20 per million tokens.
              cache_control: { type: 'ephemeral' },
              thinking: { type: 'adaptive' },
              output_config: { effort: 'low' },
              system: typeof body.system === 'string' ? body.system : undefined,
              messages: stripGeminiFields(messages) as Anthropic.MessageParam[],
              tools: Array.isArray(body.tools) ? (body.tools as Anthropic.Tool[]) : undefined,
            })
            for await (const event of stream) sse(controller, event)
            sse(controller, { type: 'clearpath_final', message: await stream.finalMessage() })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upstream error'
          sse(controller, { type: 'clearpath_error', error: message })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  },
}

/** Gemini-only fields would make Anthropic's API reject the request. */
function stripGeminiFields(messages: unknown[]): unknown[] {
  return messages.map((m: any) =>
    Array.isArray(m?.content)
      ? {
          ...m,
          content: m.content.map((b: any) => {
            if (b?.gemini_thought_signature === undefined) return b
            const { gemini_thought_signature, ...rest } = b
            return rest
          }),
        }
      : m
  )
}

function json(data: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
