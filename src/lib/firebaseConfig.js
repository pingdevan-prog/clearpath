// ---------------------------------------------------------------------------
// Firebase project config.
//
// Paste the config object from the Firebase console here:
//   console.firebase.google.com -> your project -> Project settings ->
//   "Your apps" -> the web app -> "SDK setup and configuration" -> Config
//
// These values are NOT secrets. Every Firebase web app ships them in its
// JavaScript — they identify the project, they do not grant access to it.
// What keeps the data safe is firestore.rules, not hiding this file.
//
// While this is left blank, Clearpath runs exactly as it did before accounts:
// everything stays in this browser, with no sign-in. Fill it in and the app
// switches to Google sign-in and synced accounts on the next build.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

/** True once the config above is filled in. */
export const HAS_FIREBASE = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
