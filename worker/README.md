# Clearpath advisor worker

A small Cloudflare Worker whose only job is to hold the API key, because a key
shipped in a static site is a key anyone can spend.

It speaks two providers. **Whichever secret you set decides who answers** — no
code change, no app rebuild. Gemini wins if both are set, since that is the
free one.

| Secret | Provider | Cost |
| --- | --- | --- |
| `GEMINI_API_KEY` | Google Gemini | Free tier |
| `ANTHROPIC_API_KEY` | Claude (`claude-opus-5-5`) | Pay per token |

The browser always speaks Anthropic's message format; `src/gemini.ts`
translates both ways, so the app never finds out which model answered.

## Deploy

```bash
cd worker
npm install
npx wrangler login                        # free Cloudflare account, no card
npx wrangler secret put GEMINI_API_KEY    # from aistudio.google.com/apikey
npx wrangler deploy
```

Put the URL it prints into `src/lib/advisorConfig.js` in the main app.

### Switching to Claude later

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret delete GEMINI_API_KEY
npx wrangler deploy
```

### If Gemini rejects the model

The default is `gemini-2.5-flash`. Model names change, and which ones a key can
use varies. If it is wrong the worker does not just fail — it asks Google which
models your key *can* use and puts them in the error message. Then:

```bash
npx wrangler secret put GEMINI_MODEL   # or set it under Variables in the dashboard
```

## Limits and cost

**Gemini free tier.** Google does not publish exact free-tier numbers and says
they are not guaranteed; the real ones for your project are shown in Google AI
Studio. Flash-class models are commonly reported at around 1,500 requests a day
and 10-15 a minute. One student question costs 2-3 requests here, because the
model calls tools and each round is a request.

**Claude.** Opus 5.5 is $4 per million input tokens and $20 per million output.
A question is roughly 4,900 in and 330 out, so about 2-5 cents; prompt caching
on the ~2,000 token prefix cuts the repeated part twentyfold. `claude-haiku-5-5`
is about forty times cheaper on input — change `MODEL` in `src/index.ts`.

**Cloudflare** is free either way: 100,000 worker requests a day, no card.

## What it will not do

It pins the model, the token ceiling and the allowed origins itself, and takes
none of them from the caller. Finding the URL does not get anyone a free LLM
proxy pointed at someone else's site.

Only a student's **first name** is ever sent, never a surname, an email or an
account id — on a free tier the provider may use requests to improve their
models, and this is a school app.
