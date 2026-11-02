// js/auth.js
// Login, logout and "who is logged in" for index.html, using Firebase Authentication.
// Loaded with <script type="module" src="js/auth.js"></script> AFTER js/main.js.

import { auth } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginMessage = document.getElementById("login-message");
const loginContainer = document.getElementById("login-form-container");
const courseOverview = document.getElementById("course-overview");
const logoutButton = document.getElementById("logout-button");

// Prefill the email if the address has ?email=... (sent from the account page).
const params = new URLSearchParams(window.location.search);
const emailParam = params.get("email");
if (emailParam && loginEmail) {
  loginEmail.value = emailParam;
}

// main.js calls this to get the logged-in user's ID token for video addresses.
// Returns null if nobody is logged in.
window.cbGetIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
};

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "";
    try {
      await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value);
      // onAuthStateChanged below shows the course.
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      loginMessage.textContent =
        "Email or password is incorrect. Use \"Forgot password?\" if you need a new password.";
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await signOut(auth);
  });
}

// Runs on page load and whenever someone logs in or out.
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Get the latest account details (e.g. email just verified) and a fresh token.
      await user.reload();
      await user.getIdToken(true);
    } catch (err) {
      console.error("Could not refresh login:", err);
    }
    loginContainer.style.display = "none";
    courseOverview.style.display = "block";
    await window.loadModules();
  } else {
    courseOverview.style.display = "none";
    loginContainer.style.display = "block";
    const list = document.getElementById("modules-list");
    if (list) list.innerHTML = "";
  }
});
