// ---------------------------------------------------------------------------
// Firebase: Google sign-in, and the database that makes an account mean
// something on more than one device.
//
// Everything here is lazy. Until firebaseConfig.js is filled in, none of the
// Firebase SDK is even loaded, and the app runs on localStorage exactly as it
// did before accounts existed.
// ---------------------------------------------------------------------------

import { HAS_FIREBASE, firebaseConfig } from './firebaseConfig'

let appPromise = null

/** Load and initialise Firebase once, or null if the project is not configured. */
async function load() {
  if (!HAS_FIREBASE) return null
  if (!appPromise) {
    appPromise = (async () => {
      const [{ initializeApp, getApps, getApp }, auth, firestore] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ])
      // Reuse the app if one already exists — a hot reload or a second caller
      // must not try to initialise the SDK twice.
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
      const authInstance = auth.getAuth(app)
      // Keep people signed in across visits, the way an app should.
      await auth.setPersistence(authInstance, auth.browserLocalPersistence).catch(() => {})
      const db = firestore.initializeFirestore(app, {
        // Works offline and across tabs; Clearpath is read-heavy and small.
        localCache: firestore.persistentLocalCache({
          tabManager: firestore.persistentMultipleTabManager(),
        }),
      })
      return { app, auth, authInstance, firestore, db }
    })()
  }
  return appPromise
}

export { load as loadFirebase, HAS_FIREBASE }

/** Call fn whenever the signed-in user changes. Returns an unsubscribe. */
export async function onAuth(fn) {
  let fb
  try {
    fb = await load()
  } catch (err) {
    // A broken config must not strand the app on a loading screen forever.
    console.warn('[clearpath] Firebase failed to load:', err?.message)
    fn(null)
    return () => {}
  }
  if (!fb) {
    fn(null)
    return () => {}
  }
  return fb.auth.onAuthStateChanged(fb.authInstance, (user) =>
    fn(
      user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }
        : null
    )
  )
}

export async function signInWithGoogle() {
  const fb = await load()
  if (!fb) throw new Error('Firebase is not configured')
  const provider = new fb.auth.GoogleAuthProvider()
  // Always let people choose which Google account, rather than silently
  // reusing whichever one the browser happens to be signed into.
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const result = await fb.auth.signInWithPopup(fb.authInstance, provider)
    return result.user
  } catch (err) {
    // Popups are blocked on plenty of phones; fall back to a full redirect.
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      if (err.code === 'auth/popup-blocked') {
        await fb.auth.signInWithRedirect(fb.authInstance, provider)
        return null
      }
      return null
    }
    throw err
  }
}

export async function signOutOfGoogle() {
  const fb = await load()
  if (!fb) return
  await fb.auth.signOut(fb.authInstance)
}
