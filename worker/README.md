# Clearpath advisor worker

A ~100 line Cloudflare Worker whose only job is to hold the Anthropic API key,
because a key shipped in a static site is a key anyone can spend.

The browser does the thinking about *what* to ask. This forwards it to Claude
with the key attached and streams the answer back. It pins the model, the token
limit and the allowed origins itself, so finding the URL does not get anyone a
free Claude proxy.

## Deploy

```bash
cd worker
npm install
npx wrangler login                       # opens Cloudflare in your browser
npx wrangler secret put ANTHROPIC_API_KEY  # paste your key, it is never shown again
npx wrangler deploy
```

`wrangler deploy` prints a URL like
`https://clearpath-advisor.<your-subdomain>.workers.dev`. Put that in
`src/lib/advisorConfig.js` in the main app.

## What it costs

Cloudflare Workers: free tier, 100,000 requests a day, no card.

The Anthropic API is not free. Claude Opus 5.5 is $4 per million input tokens
and $20 per million output. A student asking the advisor a dozen questions is
well under a cent. Set a spend limit in the Anthropic console if you want a
hard ceiling.

## Changing the model

`MODEL` at the top of `src/index.ts`. `claude-haiku-5-5` is roughly forty times
cheaper on input and good enough for most of what this advisor does; the trade
is weaker reasoning on the open-ended "what should I do with my four years"
questions, which is the part worth paying for.
