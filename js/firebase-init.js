// js/firebase-init.js
// Starts Firebase once. Every page that needs login imports `auth` from here.
//
// These values are not secret (Firebase says they are OK to include in code).
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6g8nBhHX2SVGB5kMRnZwhomNI7gonsuc",
  authDomain: "conscious-business-course.firebaseapp.com",
  projectId: "conscious-business-course",
  storageBucket: "conscious-business-course.firebasestorage.app",
  messagingSenderId: "788898260746",
  appId: "1:788898260746:web:2616df005ad01678b6fcf3",
  measurementId: "G-V7QY5VKZ6G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
