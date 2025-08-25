// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUQ0Jx66Tc-btJwlzMMrS-3zGbANkYESA",
  authDomain: "spinproject-39dd6.firebaseapp.com",
  projectId: "spinproject-39dd6",
  storageBucket: "spinproject-39dd6.appspot.com",
  messagingSenderId: "609822117119",
  appId: "1:609822117119:web:577a601c0de91e5efc10ca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };