// ---------------------------------------------------------------------------
// Firestore: the shape of an account in the database, and the live listeners
// that keep this device in step with every other one.
//
//   users/{uid}                 your profile, your schools   (only you can read)
//   reviews/{uid}__{courseId}   one review per class per person (anyone can read)
//   plans/{uid}__{schoolId}     your four year plan          (only you can read)
//
// The review id is deterministic on purpose: it is what stops one person
// posting the same class ten times, and the security rules lean on it.
// ---------------------------------------------------------------------------

import { loadFirebase } from './firebase'

export function reviewId(uid, courseId) {
  return `${uid}__${courseId}`
}

export function planId(uid, schoolId) {
  return `${uid}__${schoolId}`
}

/** Strip undefined, which Firestore refuses to store. */
function clean(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

// ----------------------------------- profile -----------------------------------

export async function watchProfile(uid, cb) {
  const fb = await loadFirebase()
  if (!fb) return () => {}
  const { doc, onSnapshot } = fb.firestore
  return onSnapshot(
    doc(fb.db, 'users', uid),
    (snap) => cb(snap.exists() ? snap.data() : null),
    () => cb(null)
  )
}

export async function saveProfile(uid, data) {
  const fb = await loadFirebase()
  if (!fb) return
  const { doc, setDoc, serverTimestamp } = fb.firestore
  await setDoc(
    doc(fb.db, 'users', uid),
    clean({ ...data, uid, updatedAt: serverTimestamp() }),
    { merge: true }
  )
}

// ----------------------------------- reviews -----------------------------------

/** Live view of every review for one school. */
export async function watchReviews(schoolId, cb) {
  const fb = await loadFirebase()
  if (!fb) return () => {}
  const { collection, onSnapshot, query, where } = fb.firestore
  const q = query(collection(fb.db, 'reviews'), where('schoolId', '==', schoolId))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.warn('[clearpath] could not read reviews:', err.message)
      cb([])
    }
  )
}

export async function saveReview(uid, review) {
  const fb = await loadFirebase()
  if (!fb) return
  const { doc, setDoc, serverTimestamp } = fb.firestore
  const id = reviewId(uid, review.courseId)
  await setDoc(
    doc(fb.db, 'reviews', id),
    clean({
      uid,
      schoolId: review.schoolId,
      courseId: review.courseId,
      scores: review.scores,
      takeAgain: review.takeAgain,
      hours: review.hours ?? null,
      tags: review.tags || [],
      note: review.note || '',
      gradeTaken: review.gradeTaken ?? null,
      year: review.year ?? null,
      anon: review.anon !== false,
      author: review.anon === false ? review.author : null,
      createdAt: review.createdAt || Date.now(),
      updatedAt: serverTimestamp(),
    })
  )
  return id
}

export async function deleteReview(id) {
  const fb = await loadFirebase()
  if (!fb) return
  const { doc, deleteDoc } = fb.firestore
  await deleteDoc(doc(fb.db, 'reviews', id))
}

// ------------------------------------ plan ------------------------------------

export async function watchPlan(uid, schoolId, cb) {
  const fb = await loadFirebase()
  if (!fb) return () => {}
  const { doc, onSnapshot } = fb.firestore
  return onSnapshot(
    doc(fb.db, 'plans', planId(uid, schoolId)),
    (snap) => cb(snap.exists() ? snap.data().grades || null : null),
    () => cb(null)
  )
}

export async function savePlan(uid, schoolId, grades) {
  const fb = await loadFirebase()
  if (!fb) return
  const { doc, setDoc, serverTimestamp } = fb.firestore
  await setDoc(
    doc(fb.db, 'plans', planId(uid, schoolId)),
    clean({ uid, schoolId, grades, updatedAt: serverTimestamp() }),
    { merge: true }
  )
}
