// ---------------------------------------------------------------------------
// The only place the app touches stored data.
//
// Two backends, one API. Signed in with Google, everything lives in Firestore
// and follows you to any device. Not signed in — or Firebase not configured at
// all — everything stays in this browser, exactly as it did before accounts.
//
// Every getter here is synchronous on purpose: the cloud listeners keep an
// in-memory copy up to date and call emit(), so components stay simple and
// never deal with promises or loading spinners for data they already have.
// ---------------------------------------------------------------------------

import { COURSES, COURSE_MAP } from '../data/courses'
import { SCHOOLS, SCHOOL_MAP } from '../data/schools'
import { buildSampleReviews } from '../data/sampleReviews'
import { summarize } from './stats'
import { HAS_FIREBASE, onAuth, signInWithGoogle, signOutOfGoogle } from './firebase'
import * as cloud from './cloud'

const KEY = {
  profile: 'clearpath.profile.v1',
  schools: 'clearpath.schools.v1',
  active: 'clearpath.active.v1',
  reviews: 'clearpath.reviews.v1',
  compare: 'clearpath.compare.v1',
  samples: 'clearpath.samples.v1',
  plan: 'clearpath.plan.v1',
  migrated: 'clearpath.migrated.v1',
}

const listeners = new Set()

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing or a full quota. The session still works in memory.
  }
}

// ------------------------------- local state -------------------------------

let profile = read(KEY.profile, null)
let mySchools = read(KEY.schools, [])
let activeSchool = read(KEY.active, null)
let reviews = read(KEY.reviews, [])
let compare = read(KEY.compare, [])
let samplesOn = read(KEY.samples, false)
let plans = read(KEY.plan, {})
let migrationDone = read(KEY.migrated, false)

// ------------------------------- cloud state -------------------------------

let authState = HAS_FIREBASE ? 'loading' : 'local'
let authUser = null
let cloudProfile = null
let cloudReviews = []
let cloudPlan = null
let profileUnsub = null
let schoolUnsubs = []
let attachedSchool = undefined
let authStarted = false

const signedIn = () => authState === 'signed-in' && !!authUser

function emit() {
  for (const fn of listeners) fn()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ----------------------------------- auth -----------------------------------

export function getAuthState() {
  return authState
}

export function getAuthUser() {
  return authUser
}

export function cloudEnabled() {
  return HAS_FIREBASE
}

function stop(un) {
  try {
    if (typeof un === 'function') un()
  } catch {
    /* already gone */
  }
}

function detachSchool() {
  for (const un of schoolUnsubs) stop(un)
  schoolUnsubs = []
  attachedSchool = undefined
}

function detachAll() {
  stop(profileUnsub)
  profileUnsub = null
  detachSchool()
}

/**
 * Listen to the reviews and plan for whichever school is open.
 *
 * Kept separate from the profile listener because the school is often not
 * known yet when someone signs in on a new device: it arrives a moment later
 * inside their profile, and these listeners have to start then, not before.
 */
async function attachSchool(uid) {
  if (attachedSchool === activeSchool) return
  detachSchool()
  attachedSchool = activeSchool
  const school = activeSchool
  if (!school) {
    cloudReviews = []
    cloudPlan = null
    emit()
    return
  }
  cloudReviews = []
  cloudPlan = null
  const add = (p) =>
    p
      .then((un) => {
        // The school may have changed again while this was loading.
        if (attachedSchool === school) schoolUnsubs.push(un)
        else stop(un)
      })
      .catch(() => {})
  add(
    cloud.watchReviews(school, (list) => {
      if (attachedSchool !== school) return
      cloudReviews = list
      emit()
    })
  )
  add(
    cloud.watchPlan(uid, school, (grades) => {
      if (attachedSchool !== school) return
      cloudPlan = grades
      emit()
    })
  )
}

async function attach(uid) {
  detachAll()
  cloud
    .watchProfile(uid, (data) => {
      cloudProfile = data
      // A fresh device knows nothing until the profile arrives; adopt the
      // school it names and start that school's listeners now.
      if (data?.activeSchool && !activeSchool) {
        activeSchool = data.activeSchool
        write(KEY.active, activeSchool)
      }
      attachSchool(uid)
      emit()
    })
    .then((un) => {
      profileUnsub = un
    })
    .catch(() => {})
  attachSchool(uid)
}

/** Start listening for the signed-in user. Safe to call more than once. */
export function initAuth() {
  if (!HAS_FIREBASE || authStarted) return
  authStarted = true
  const settle = onAuth((user) => {
    authUser = user
    authState = user ? 'signed-in' : 'signed-out'
    if (user) {
      attach(user.uid)
    } else {
      detachAll()
      cloudProfile = null
      cloudReviews = []
      cloudPlan = null
    }
    emit()
  })
  // If Firebase never answers, fall back to the signed-out screen rather than
  // leaving someone staring at a spinner.
  Promise.resolve(settle).catch(() => {
    authState = 'signed-out'
    emit()
  })
}

export async function signIn() {
  await signInWithGoogle()
}

export async function signOut() {
  await signOutOfGoogle()
  detachAll()
  cloudProfile = null
  cloudReviews = []
  cloudPlan = null
  emit()
}

// ---------------------------------- profile ----------------------------------

export function getProfile() {
  return signedIn() ? cloudProfile : profile
}

export function saveProfile(next) {
  if (signedIn()) {
    cloudProfile = { ...(cloudProfile || {}), ...next, createdAt: cloudProfile?.createdAt || Date.now() }
    cloud.saveProfile(authUser.uid, cloudProfile)
    emit()
    return cloudProfile
  }
  profile = { ...(profile || {}), ...next, updatedAt: Date.now() }
  if (!profile.createdAt) profile.createdAt = Date.now()
  write(KEY.profile, profile)
  emit()
  return profile
}

export function resetEverything() {
  profile = null
  mySchools = []
  activeSchool = null
  reviews = []
  compare = []
  samplesOn = false
  plans = {}
  migrationDone = false
  for (const k of Object.values(KEY)) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* nothing to do */
    }
  }
  emit()
}

// ---------------------------------- schools ----------------------------------

export function getAllSchools() {
  return SCHOOLS
}

export function getSchool(id) {
  return SCHOOL_MAP[id] || null
}

export function getMySchools() {
  const ids = signedIn() ? cloudProfile?.schools || [] : mySchools
  return ids.map((id) => SCHOOL_MAP[id]).filter(Boolean)
}

export function addSchool(id) {
  if (!SCHOOL_MAP[id]) return
  if (signedIn()) {
    const ids = cloudProfile?.schools || []
    if (!ids.includes(id)) saveProfile({ schools: [...ids, id] })
    if (!activeSchool) setActiveSchool(id)
    else emit()
    return
  }
  if (!mySchools.includes(id)) {
    mySchools = [...mySchools, id]
    write(KEY.schools, mySchools)
  }
  if (!activeSchool) setActiveSchool(id)
  else emit()
}

export function removeSchool(id) {
  if (signedIn()) {
    saveProfile({ schools: (cloudProfile?.schools || []).filter((s) => s !== id) })
  } else {
    mySchools = mySchools.filter((s) => s !== id)
    write(KEY.schools, mySchools)
  }
  if (activeSchool === id) setActiveSchool(getMySchools()[0]?.id || null)
  else emit()
}

export function getActiveSchool() {
  const id = signedIn() ? activeSchool || cloudProfile?.activeSchool : activeSchool
  return id ? SCHOOL_MAP[id] || null : null
}

export function setActiveSchool(id) {
  activeSchool = id
  write(KEY.active, id)
  compare = []
  write(KEY.compare, compare)
  if (signedIn()) {
    cloud.saveProfile(authUser.uid, { activeSchool: id })
    attachSchool(authUser.uid)
  }
  emit()
}

// ---------------------------------- courses ----------------------------------

export function getCourses(schoolId = activeSchool) {
  const school = SCHOOL_MAP[schoolId]
  return school && school.catalog ? COURSES : []
}

export function getCourse(id) {
  return COURSE_MAP[id] || null
}

// ---------------------------------- reviews ----------------------------------

export function samplesEnabled() {
  return samplesOn
}

export function setSamplesEnabled(on) {
  samplesOn = !!on
  write(KEY.samples, samplesOn)
  emit()
}

function allReviews(schoolId = activeSchool) {
  const mine = signedIn() ? cloudReviews : reviews.filter((r) => r.schoolId === schoolId)
  if (!samplesOn) return mine
  return [...buildSampleReviews(schoolId), ...mine]
}

export function getAllReviews(schoolId) {
  return allReviews(schoolId)
}

export function getReviews(courseId, schoolId) {
  return allReviews(schoolId)
    .filter((r) => r.courseId === courseId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getMyReviews() {
  if (signedIn()) {
    return cloudReviews.filter((r) => r.uid === authUser.uid).sort((a, b) => b.createdAt - a.createdAt)
  }
  return [...reviews].sort((a, b) => b.createdAt - a.createdAt)
}

export function getStats(courseId, schoolId) {
  return summarize(getReviews(courseId, schoolId))
}

export function getStatsByCourse(schoolId = activeSchool) {
  const byCourse = new Map()
  for (const r of allReviews(schoolId)) {
    if (!byCourse.has(r.courseId)) byCourse.set(r.courseId, [])
    byCourse.get(r.courseId).push(r)
  }
  const out = {}
  for (const course of getCourses(schoolId)) {
    out[course.id] = summarize(byCourse.get(course.id) || [])
  }
  return out
}

/** Have you already reviewed this class? One review per class per person. */
export function myReviewFor(courseId) {
  if (signedIn()) return cloudReviews.find((r) => r.uid === authUser.uid && r.courseId === courseId) || null
  return reviews.find((r) => r.courseId === courseId) || null
}

export function addReview(input) {
  const schoolId = input.schoolId || activeSchool
  const base = {
    schoolId,
    courseId: input.courseId,
    scores: { ...input.scores },
    takeAgain: input.takeAgain,
    hours: input.hours ?? null,
    tags: [...(input.tags || [])],
    note: (input.note || '').trim(),
    gradeTaken: input.gradeTaken ?? null,
    year: input.year ?? null,
    anon: input.anon !== false,
    createdAt: Date.now(),
  }
  const who = getProfile()
  const author =
    input.anon === false && who
      ? { name: who.name, handle: who.handle, color: who.color, grade: who.grade ?? null, role: who.role ?? null }
      : null

  if (signedIn()) {
    const id = cloud.reviewId(authUser.uid, input.courseId)
    const review = { ...base, id, uid: authUser.uid, author }
    // Show it immediately; the listener reconciles when the write lands.
    cloudReviews = [...cloudReviews.filter((r) => r.id !== id), review]
    cloud.saveReview(authUser.uid, { ...base, author }).catch((err) => {
      console.warn('[clearpath] review did not save:', err.message)
    })
    emit()
    return { review, count: getReviews(input.courseId, schoolId).length }
  }

  const review = { ...base, id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, author }
  reviews = [...reviews.filter((r) => r.courseId !== input.courseId), review]
  write(KEY.reviews, reviews)
  emit()
  return { review, count: getReviews(input.courseId, schoolId).length }
}

export function deleteReview(id) {
  if (signedIn()) {
    cloudReviews = cloudReviews.filter((r) => r.id !== id)
    cloud.deleteReview(id).catch(() => {})
    emit()
    return
  }
  reviews = reviews.filter((r) => r.id !== id)
  write(KEY.reviews, reviews)
  emit()
}

// ---------------------------------- compare ----------------------------------

export const COMPARE_LIMIT = 2

export function getCompare() {
  return compare
}

export function toggleCompare(courseId) {
  if (compare.includes(courseId)) compare = compare.filter((c) => c !== courseId)
  else if (compare.length >= COMPARE_LIMIT) compare = [compare[compare.length - 1], courseId]
  else compare = [...compare, courseId]
  write(KEY.compare, compare)
  emit()
  return compare
}

export function setCompare(next) {
  compare = next.filter(Boolean).slice(0, COMPARE_LIMIT)
  write(KEY.compare, compare)
  emit()
}

// ------------------------------- four year plan -------------------------------

export const PLAN_GRADES = [9, 10, 11, 12]

function emptyPlan() {
  return Object.fromEntries(PLAN_GRADES.map((g) => [g, []]))
}

function normalisePlan(saved) {
  const out = emptyPlan()
  for (const grade of PLAN_GRADES) {
    out[grade] = Array.isArray(saved?.[grade]) ? saved[grade].filter((id) => COURSE_MAP[id]) : []
  }
  return out
}

export function getPlan(schoolId = activeSchool) {
  return normalisePlan(signedIn() ? cloudPlan : plans[schoolId])
}

function savePlanState(schoolId, next) {
  if (signedIn()) {
    cloudPlan = next
    cloud.savePlan(authUser.uid, schoolId, next).catch(() => {})
    emit()
    return
  }
  plans = { ...plans, [schoolId]: next }
  write(KEY.plan, plans)
  emit()
}

export function addToPlan(grade, courseId, schoolId = activeSchool) {
  const plan = getPlan(schoolId)
  for (const g of PLAN_GRADES) plan[g] = plan[g].filter((id) => id !== courseId)
  plan[grade] = [...plan[grade], courseId]
  savePlanState(schoolId, plan)
}

export function removeFromPlan(grade, courseId, schoolId = activeSchool) {
  const plan = getPlan(schoolId)
  plan[grade] = plan[grade].filter((id) => id !== courseId)
  savePlanState(schoolId, plan)
}

export function movePlanCourse(courseId, toGrade, schoolId = activeSchool) {
  addToPlan(toGrade, courseId, schoolId)
}

export function clearPlan(schoolId = activeSchool) {
  savePlanState(schoolId, emptyPlan())
}

export function planCourseIds(schoolId = activeSchool) {
  const plan = getPlan(schoolId)
  return PLAN_GRADES.flatMap((g) => plan[g])
}

// --------------------------- moving a browser into an account ---------------------------

/** What is sitting in this browser that an account does not have yet. */
export function localCarryOver() {
  if (!signedIn() || migrationDone) return null
  const localReviews = reviews.length
  const localPlan = Object.values(plans).some((p) =>
    PLAN_GRADES.some((g) => (p?.[g] || []).length)
  )
  if (!profile && !localReviews && !localPlan) return null
  return { profile, reviews: localReviews, plan: localPlan }
}

/** Copy what this browser was holding into the signed-in account. */
export async function importLocalData() {
  if (!signedIn()) return
  const uid = authUser.uid
  const next = {
    ...(profile
      ? {
          name: profile.name,
          handle: profile.handle,
          role: profile.role ?? null,
          grade: profile.grade ?? null,
          color: profile.color,
        }
      : {}),
    schools: [...new Set([...(cloudProfile?.schools || []), ...mySchools])],
  }
  if (Object.keys(next).length) await cloud.saveProfile(uid, next)

  for (const r of reviews) {
    await cloud.saveReview(uid, r).catch(() => {})
  }
  for (const [schoolId, grades] of Object.entries(plans)) {
    if (PLAN_GRADES.some((g) => (grades?.[g] || []).length)) {
      await cloud.savePlan(uid, schoolId, normalisePlan(grades)).catch(() => {})
    }
  }
  dismissCarryOver()
}

export function dismissCarryOver() {
  migrationDone = true
  write(KEY.migrated, true)
  emit()
}
