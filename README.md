# Clearpath

Course reviews for high school, written by the students who already took the class.

Most people pick next year's schedule off hallway rumors and a one-paragraph catalog
blurb, and find out in October that the class was nothing like what they were told.
Clearpath replaces the rumor with structured reviews: four scores out of 10 and one
honest yes or no, from people who finished the course.

Frontend only: React + Vite + Tailwind, no backend, no server. Everything a student
enters lives in their own browser.

## Live site

**https://pingdevan-prog.github.io/clearpath/**

Served by GitHub Pages out of `docs/index.html`, which is the whole app inlined into
one file. To update the live site:

```bash
npm run build:share
git add docs && git commit -m "rebuild site" && git push
```

`build:share` writes `share/clearpath.html` (the file to email or AirDrop) and copies the
same build into `docs/`, so the deployed site never drifts from the code.

## Run it

```bash
npm install
npm run dev
```

Opens on http://localhost:5190. `npm run build` produces a static `dist/` you can put
on any host.

## Hand it to someone

```bash
npm run build:share
```

Produces **`share/clearpath.html`** — one self-contained file, about 565 kB, with all
the JS and CSS inlined. No server, no build step, no `node_modules`. Email it, AirDrop
it, put it in Google Drive, or open it by double-clicking. `share/index.html` is the
same file under the name a static host serves by default, so you can drag the whole
`share/` folder onto Netlify Drop or into a GitHub Pages repo.

Most of that 565 kB is the 306-course catalog text. That is the trade for a file that
needs nothing: a judge opens it and every class is already there.

The only thing it loads from the network is the Google Fonts stylesheet. Offline it
falls back to a system sans and everything still works, including localStorage — the
file works opened straight off the disk, not just over http.

## How the app goes

1. **Make a profile** — name, username, grade, color. Thirty seconds, like signing up
   for anything else.
2. **Add your school** — Clearpath is one app per school, because a class only means
   something next to the other classes at the same school. Westlake is the school with
   a catalog loaded; the others are listed so students there can ask for theirs.
3. **Open the school** — all 306 Westlake courses, searchable, filterable by
   department, level and grade, sortable by most reviewed, most recommended, lightest
   load or hardest.
4. **Open a class** — the share of students who would take it again, the four scores,
   what students tag it, the prerequisites, and the school's own course description.
5. **Review a class** — four taps, one yes or no, and out. Everything else is optional.
6. **Compare two classes** — side by side on the things that actually decide it, with
   one plain sentence summing up the trade.

## What a review measures

Four scores out of 10 and one yes/no, defined in `src/lib/metrics.js`:

| Score | The question |
| --- | --- |
| Difficulty | How hard was it to earn an A? |
| Homework load | How much work outside of class? |
| Fun | Did you enjoy being in this class? |
| Worth it | How much did you get out of it? |
| Would you take it again? | Yes / No — the headline number on every class |

Optional: hours a week, grade you were in, year you took it, what the class was like
(fast pace, test heavy, lots of projects…), and a note.

## Accounts (Google sign-in)

Clearpath can run two ways, and the switch is one file.

**Without Firebase configured** (how it ships): no sign-in, everything lives in that
browser's localStorage. Good for a demo, lost if you clear your browser.

**With Firebase configured**: sign in with Google, and your profile, reviews and four
year plan are saved to your account and follow you to any device.

### Turning accounts on

1. Make a free project at [console.firebase.google.com](https://console.firebase.google.com).
   Google Analytics is not needed.
2. **Authentication** → Get started → **Google** → enable → save.
3. **Firestore Database** → Create database → start in **production mode** (the rules below
   replace the defaults) → pick a location near you.
4. **Project settings** → Your apps → **Web** (`</>`) → register the app. Copy the
   `firebaseConfig` object it shows you.
5. Paste those values into `src/lib/firebaseConfig.js`.
6. **Firestore Database → Rules** → paste the whole of `firestore.rules` from this repo →
   Publish. This step is not optional: it is the only thing standing between your database
   and the open internet.
7. **Authentication → Settings → Authorized domains** → add `pingdevan-prog.github.io`,
   so sign-in works on the live site and not just on localhost.
8. `npm run build:share`, commit, push.

The config values in step 5 are **not secrets**. Every Firebase web app ships them in its
JavaScript; they identify the project rather than granting access to it. The security
rules are what protect the data.

### What an account stores

```
users/{uid}                 your profile and your schools   — only you can read it
reviews/{uid}__{courseId}   one review per class per person — anyone can read
plans/{uid}__{schoolId}     your four year plan             — only you can read it
```

Two consequences worth knowing. The review id contains your account id, which is what
stops one person reviewing the same class ten times. And profiles are private precisely
so an anonymous review cannot be traced back to a name — to anyone reading the database,
an account id is an opaque string.

Signing in for the first time on a browser that already had reviews in it offers to move
them into the account.

## Product rules baked into the code

These are deliberate, not oversights:

- **No teacher ratings, no teacher names.** Clearpath rates the course and the shape of
  the work, never the person teaching it. There is no field for it anywhere, and the
  review form says so out loud.
- **Anonymous by default.** A review posts as Anonymous unless the student turns on
  "post with my name" for that review.
- **No thin averages.** `MIN_REVIEWS` in `src/lib/metrics.js` is 3. Under that, a class
  shows its catalog description and review text instead of numbers — in the grid, on the
  class page and in Compare. Two opinions is not a pattern.
- **One color language.** Cool means light or good, warm means heavy or watch out.
  `toneFor()` flips the input for the two "benefit" scores, so a high Fun reads cool and
  a low Fun reads hot. Learn it once, read it everywhere.
- **Nothing invented.** The nine courses the catalog lists without publishing a
  description say exactly that on the page.

## What's in here

```
src/
  data/courses.js        <- the Westlake catalog: 306 courses, generated, do not hand-edit
  data/schools.js        <- schools you can add
  data/sampleReviews.js  <- the labelled example reviews behind the demo switch
  lib/metrics.js         <- the four scores, their bands, the color ramp, the tags
  lib/stats.js           <- averages, take-again share, tag counts, how split a class is
  lib/store.js           <- every read and write goes through here
  components/            <- one file per screen, shared pieces in Bits.jsx
scripts/catalog/         <- how src/data/courses.js gets rebuilt from the school's site
```

### The catalog

`src/data/courses.js` comes from the published
[WHS course catalog](https://whs.eanesisd.net/coursecatalog/courses), pulled October
2026. Every course the school lists is in it with its real prerequisites, credit, grade
range and description. See `scripts/catalog/README.md` to regenerate it.

### Sample reviews

The app ships with **zero** reviews, because a review site that writes its own reviews
is worthless. That also makes it impossible to show anyone, so Profile → **Show sample
reviews** fills 31 classes with clearly labelled examples. Every one carries a Sample
chip, and a banner stays up the whole time it is on. Turn it off before collecting real
reviews.

### Swapping in a real backend

Components never touch data directly. They call `src/lib/store.js`:

```js
getProfile()      saveProfile(p)
getMySchools()    addSchool(id)       setActiveSchool(id)
getCourses()      getCourse(id)
getReviews(id)    getStats(id)        getStatsByCourse()
addReview(input)  deleteReview(id)    subscribe(fn)
```

Replace those function bodies with `fetch()` calls and nothing in `components/` changes.

## Before a demo

Reviews you write while testing stay in localStorage. To clear everything, use
Profile → "Start over on this device", or run in the console:

```js
Object.keys(localStorage).filter(k => k.startsWith('clearpath.')).forEach(k => localStorage.removeItem(k)); location.reload()
```

Clearpath is a student project. It is not affiliated with Eanes ISD or Westlake High
School; the catalog text is the school's, quoted with a link to the source.
