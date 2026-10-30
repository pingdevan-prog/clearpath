// ---------------------------------------------------------------------------
// Where the advisor's language model lives.
//
// Paste the URL `npx wrangler deploy` printed, from the worker/ folder:
//   https://clearpath-advisor.<your-subdomain>.workers.dev
//
// This is not a secret — it is just an address. The API key stays inside the
// worker and never reaches a browser.
//
// Left blank, the advisor still works: it falls back to the built-in engine,
// which answers from the catalog and the reviews without a model.
// ---------------------------------------------------------------------------

export const ADVISOR_WORKER_URL = 'https://clearpath-advisor.clearpathschool.workers.dev'

export const HAS_LLM = Boolean(ADVISOR_WORKER_URL)
