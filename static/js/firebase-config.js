// Firebase Client Configuration for FestGate
// Project: festgate-a1f30
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2jMuX-HkqmIuqE_ADADvAfEMpOUIcpqw",
  authDomain: "festgate-a1f30.firebaseapp.com",
  projectId: "festgate-a1f30",
  storageBucket: "festgate-a1f30.firebasestorage.app",
  messagingSenderId: "591752808264",
  appId: "1:591752808264:web:ef376be74ee2a652d7d57d",
  measurementId: "G-JVLKYQTH67"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider, signInWithPopup };
