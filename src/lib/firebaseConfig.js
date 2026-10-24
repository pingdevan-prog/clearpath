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
  apiKey: 'AIzaSyAio0qtNGuDF-cNbirl-BfCSxiQIqsipmU',
  authDomain: 'clearpath-96f1c.firebaseapp.com',
  projectId: 'clearpath-96f1c',
  storageBucket: 'clearpath-96f1c.firebasestorage.app',
  messagingSenderId: '372672134877',
  appId: '1:372672134877:web:c4ec11f9fdbe11900de534',
}

/** True once the config above is filled in. */
export const HAS_FIREBASE = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
