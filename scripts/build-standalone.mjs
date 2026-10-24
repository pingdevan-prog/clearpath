// Folds the Vite build into ONE self-contained .html file.
//
// Run `npm run build:share`. The result, share/clearpath.html, has all the JS
// and CSS inlined, so it works by double-clicking it, emailing it, dropping it
// in Drive, or hosting it anywhere. The only thing it fetches is the Google
// Fonts stylesheet; without a connection it falls back to a system sans.
//
// It lands around 550 kB, most of which is the 306-course Westlake catalog
// text in src/data/courses.js. That is the price of a file that needs no
// server: a judge opens it and every course is already there.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const outDir = join(root, 'share')
// Two names, same bytes: clearpath.html is the one you email or AirDrop,
// index.html is what a static host (Netlify drop, GitHub Pages) serves by
// default if you upload the whole share/ folder.
const outNames = ['clearpath.html', 'index.html']

// A literal </script> or </style> inside the bundle would close the tag we are
// inlining it into, so break the sequence. The browser reads it back the same.
const guard = (code) => code.replace(/<\/(script|style)/gi, '<\\/$1')

const assets = readdirSync(join(dist, 'assets'))
const jsFiles = assets.filter((f) => f.endsWith('.js'))
const jsName = jsFiles[0]
const cssName = assets.find((f) => f.endsWith('.css'))
if (!jsName || !cssName) {
  console.error('No built assets found. Run `npm run build` first.')
  process.exit(1)
}
// One file in, one file out. If the build split into chunks, only the entry
// would get inlined and every dynamic import would 404 at runtime — which is
// exactly the bug that adding the Firebase SDK introduced.
if (jsFiles.length > 1) {
  console.error(
    `Build produced ${jsFiles.length} JS chunks, and only one can be inlined:\n  ` +
      jsFiles.join('\n  ') +
      '\nSet build.rollupOptions.output.inlineDynamicImports in vite.config.js.'
  )
  process.exit(1)
}

const js = readFileSync(join(dist, 'assets', jsName), 'utf8')
const css = readFileSync(join(dist, 'assets', cssName), 'utf8')

// The replacements MUST be functions, not strings: a minified bundle is full of
// `$`, and string replacements expand $&, $` and $' into the surrounding HTML.
let html = readFileSync(join(dist, 'index.html'), 'utf8')
html = html.replace(
  /<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/,
  () => `<script type="module">\n${guard(js)}\n</script>`
)
html = html.replace(
  /<link rel="stylesheet"[^>]*href="\/assets\/[^"]*"[^>]*>/,
  () => `<style>\n${guard(css)}\n</style>`
)

if (html.includes('/assets/')) {
  console.error('Something still references /assets/ - inlining did not fully apply.')
  process.exit(1)
}
// Catch relative chunk references too, which is how the split slipped past the
// check above the first time.
const danglingChunk = jsFiles.slice(1).find((f) => html.includes(f))
if (danglingChunk) {
  console.error(`The single file still points at ${danglingChunk}, which will not be served.`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
for (const name of outNames) writeFileSync(join(outDir, name), html)

const kb = (Buffer.byteLength(html) / 1024).toFixed(0)
console.log(`share/${outNames.join(', share/')}  ${kb} kB each (single file, no server needed)`)
