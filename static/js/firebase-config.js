// Firebase Client Configuration for FestGate
// Project: festgate-5a369
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment1234567890",
  authDomain: "festgate-5a369.firebaseapp.com",
  projectId: "festgate-5a369",
  storageBucket: "festgate-5a369.appspot.com",
  messagingSenderId: "1029384756",
  appId: "1:1029384756:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider, signInWithPopup };
