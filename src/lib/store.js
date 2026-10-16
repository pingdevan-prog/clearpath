// ---------------------------------------------------------------------------
// The only place the app touches stored data.
//
// Today everything lives in localStorage: your profile, the schools you added,
// the reviews written on this device. Tomorrow, swap the bodies of these
// functions for fetch() calls and not one component has to change.
// ---------------------------------------------------------------------------

import { COURSES, COURSE_MAP } from '../data/courses'
import { SCHOOLS, SCHOOL_MAP } from '../data/schools'
import { buildSampleReviews } from '../data/sampleReviews'
import { summarize } from './stats'

const KEY = {
  profile: 'clearpath.profile.v1',
  schools: 'clearpath.schools.v1',
  active: 'clearpath.active.v1',
  reviews: 'clearpath.reviews.v1',
  compare: 'clearpath.compare.v1',
  samples: 'clearpath.samples.v1',
  plan: 'clearpath.plan.v1',
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

let profile = read(KEY.profile, null)
let mySchools = read(KEY.schools, [])
let activeSchool = read(KEY.active, null)
let reviews = read(KEY.reviews, [])
let compare = read(KEY.compare, [])
let samplesOn = read(KEY.samples, false)
let plans = read(KEY.plan, {})

function emit() {
  for (const fn of listeners) fn()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ----------------------------------- profile -----------------------------------

export function getProfile() {
  return profile
}

export function saveProfile(next) {
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
  for (const k of Object.values(KEY)) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* nothing to do */
    }
  }
  emit()
}

// ----------------------------------- schools -----------------------------------

export function getAllSchools() {
  return SCHOOLS
}

export function getSchool(id) {
  return SCHOOL_MAP[id] || null
}

export function getMySchools() {
  return mySchools.map((id) => SCHOOL_MAP[id]).filter(Boolean)
}

export function addSchool(id) {
  if (!SCHOOL_MAP[id]) return
  if (!mySchools.includes(id)) {
    mySchools = [...mySchools, id]
    write(KEY.schools, mySchools)
  }
  if (!activeSchool) setActiveSchool(id)
  else emit()
}

export function removeSchool(id) {
  mySchools = mySchools.filter((s) => s !== id)
  write(KEY.schools, mySchools)
  if (activeSchool === id) setActiveSchool(mySchools[0] || null)
  else emit()
}

export function getActiveSchool() {
  return activeSchool ? SCHOOL_MAP[activeSchool] || null : null
}

export function setActiveSchool(id) {
  activeSchool = id
  write(KEY.active, id)
  compare = []
  write(KEY.compare, compare)
  emit()
}

// ----------------------------------- courses -----------------------------------

export function getCourses(schoolId = activeSchool) {
  const school = SCHOOL_MAP[schoolId]
  return school && school.catalog ? COURSES : []
}

export function getCourse(id) {
  return COURSE_MAP[id] || null
}

// ----------------------------------- reviews -----------------------------------

export function samplesEnabled() {
  return samplesOn
}

export function setSamplesEnabled(on) {
  samplesOn = !!on
  write(KEY.samples, samplesOn)
  emit()
}

function allReviews(schoolId = activeSchool) {
  const mine = reviews.filter((r) => r.schoolId === schoolId)
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
  return [...reviews].sort((a, b) => b.createdAt - a.createdAt)
}

export function getStats(courseId, schoolId) {
  return summarize(getReviews(courseId, schoolId))
}

/** Stats for every course in the active school's catalog, keyed by course id. */
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

/**
 * Save a review. Takes the shape the form produces and fills in the rest.
 * Returns the stored review and how many reviews that course now has.
 */
export function addReview(input) {
  const review = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    schoolId: input.schoolId || activeSchool,
    courseId: input.courseId,
    scores: { ...input.scores },
    takeAgain: input.takeAgain,
    hours: input.hours ?? null,
    tags: [...(input.tags || [])],
    note: (input.note || '').trim(),
    gradeTaken: input.gradeTaken ?? null,
    year: input.year ?? null,
    anon: input.anon !== false,
    author:
      input.anon === false && profile
        ? { name: profile.name, handle: profile.handle, color: profile.color, grade: profile.grade }
        : null,
    createdAt: Date.now(),
  }
  reviews = [...reviews, review]
  write(KEY.reviews, reviews)
  emit()
  return { review, count: getReviews(review.courseId, review.schoolId).length }
}

export function deleteReview(id) {
  reviews = reviews.filter((r) => r.id !== id)
  write(KEY.reviews, reviews)
  emit()
}

// ----------------------------------- compare -----------------------------------

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
//
// What the student took, and what they are planning to take, one list per grade.
// Stored per school: switching schools switches plans.

export const PLAN_GRADES = [9, 10, 11, 12]

function emptyPlan() {
  return Object.fromEntries(PLAN_GRADES.map((g) => [g, []]))
}

/** The plan for a school, as { 9: [courseId], 10: [...], 11: [...], 12: [...] }. */
export function getPlan(schoolId = activeSchool) {
  const saved = plans[schoolId] || {}
  const out = emptyPlan()
  for (const grade of PLAN_GRADES) {
    out[grade] = Array.isArray(saved[grade]) ? saved[grade].filter((id) => COURSE_MAP[id]) : []
  }
  return out
}

function savePlan(schoolId, next) {
  plans = { ...plans, [schoolId]: next }
  write(KEY.plan, plans)
  emit()
}

/** Put a course in a grade. A course can only sit in one grade at a time. */
export function addToPlan(grade, courseId, schoolId = activeSchool) {
  const plan = getPlan(schoolId)
  for (const g of PLAN_GRADES) plan[g] = plan[g].filter((id) => id !== courseId)
  plan[grade] = [...plan[grade], courseId]
  savePlan(schoolId, plan)
}

export function removeFromPlan(grade, courseId, schoolId = activeSchool) {
  const plan = getPlan(schoolId)
  plan[grade] = plan[grade].filter((id) => id !== courseId)
  savePlan(schoolId, plan)
}

export function movePlanCourse(courseId, toGrade, schoolId = activeSchool) {
  addToPlan(toGrade, courseId, schoolId)
}

export function clearPlan(schoolId = activeSchool) {
  savePlan(schoolId, emptyPlan())
}

/** Every course id in the plan, in grade order. */
export function planCourseIds(schoolId = activeSchool) {
  const plan = getPlan(schoolId)
  return PLAN_GRADES.flatMap((g) => plan[g])
}
