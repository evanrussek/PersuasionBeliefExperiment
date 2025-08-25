/*  firebaseSetup.js
    ------------------------------------------------------------
    Light-weight Firebase bootstrap for a plain-browser jsPsych
    project (no bundler).  Exports:
      • db — Firestore handle
      • auth — Auth handle
      • authReady — Promise that resolves to the *uid* once an
        anonymous user is signed-in (or rejects on error)
    ------------------------------------------------------------
*/

/* CDN-style imports (Firebase v9 modular) */
import { initializeApp }  from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js';
import { getAuth,        // auth
         signInAnonymously,
         onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js';
import { enableIndexedDbPersistence } from
  'https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js';


/* ---------- 1. Config & core handles ---------- */
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUQ0Jx66Tc-btJwlzMMrS-3zGbANkYESA",
  authDomain: "spinproject-39dd6.firebaseapp.com",
  projectId: "spinproject-39dd6",
  storageBucket: "spinproject-39dd6.firebasestorage.app",
  messagingSenderId: "609822117119",
  appId: "1:609822117119:web:577a601c0de91e5efc10ca"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
enableIndexedDbPersistence(db, { synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.log('Persistence disabled in this tab – another tab owns it.');
    } else if (err.code === 'unimplemented') {
      console.log('Browser doesn’t support IndexedDB (private mode?)');
    }
  });

/* ---------- 2. Promise that resolves once UID is ready ---------- */
let uid;                     // will hold the user id
const authReady = new Promise((resolve, reject) => {
  // Fire the sign-in request (returns immediately)
  signInAnonymously(auth).catch(reject);

  // Listener fires on *any* auth state change
  onAuthStateChanged(auth, user => {
    if (user) {
      uid = user.uid;
      resolve(uid);          // ✅ fulfilled → caller can now use uid
    }
  });
});

/* ---------- 3. Exports ---------- */
export { db, auth, authReady };
