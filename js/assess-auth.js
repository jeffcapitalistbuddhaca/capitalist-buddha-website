// js/assess-auth.js - shared sign-in (one-time email link) for the full assessment pages.
// Uses the same Firebase login as the course, the free module and the industry report.
import { sendBrandedAuthEmail } from "./auth-mail.js?v=20261118a";
import { auth } from "./firebase-init.js";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

export const $ = (id) => document.getElementById(id);
const store = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} };
const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };

// Shows exactly one of the page's sections.
export function show(id) {
  ["s-signin", "s-confirm", "s-msg", "s-quest", "s-report"].forEach((s) => { const el = $(s); if (el) el.hidden = s !== id; });
  window.scrollTo(0, 0);
}

export function message(title, html) {
  $("m-title").textContent = title;
  $("m-body").innerHTML = html || "";
  show("s-msg");
}

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Calls /api/assess/<path> with the signed-in user's token.
export async function api(user, path, body) {
  const token = await user.getIdToken();
  const res = await fetch("/api/assess/" + path, {
    method: body ? "POST" : "GET",
    headers: Object.assign({ authorization: "Bearer " + token }, body ? { "content-type": "application/json" } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) { const e = new Error(data.error || "Request failed"); e.status = res.status; e.data = data; throw e; }
  return data;
}

export function logout() { return signOut(auth); }

// Runs the sign-in gate. Calls onReady(user) once a user with a verified email is signed in.
// returnPath: the address the email link brings the person back to (e.g. "/assessment-start.html").
// wantEmail: if given, a signed-in user with a different email is signed out first.
export function startGate({ returnPath, wantEmail, onReady }) {
  let ready = false;
  const wanted = (wantEmail || "").trim().toLowerCase();
  if (wanted) $("si-email").value = wantEmail;

  $("si-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if ($("si-website").value) return; // spam trap
    const email = $("si-email").value.trim();
    const msg = $("si-msg");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = "Please enter a valid email address."; msg.hidden = false; return; }
    const btn = $("si-send"); btn.disabled = true; msg.textContent = "Sending..."; msg.hidden = false;
    try {
      if (!(await sendBrandedAuthEmail("signin", email, location.origin + returnPath))) {
        await sendSignInLinkToEmail(auth, email, { url: location.origin + returnPath, handleCodeInApp: true });
      }
      store("cbAssessEmail", email);
      msg.textContent = "Check your inbox (and spam folder) for an email with a sign-in link. Open it on this device.";
    } catch (err) {
      msg.textContent = "Sorry, that didn't work. Please check the email address and try again.";
    }
    btn.disabled = false;
  });

  async function finish(email) {
    try {
      await signInWithEmailLink(auth, email, location.href);
      store("cbAssessEmail", null);
      history.replaceState(null, "", returnPath);
      return true;
    } catch (err) {
      show("s-signin");
      const msg = $("si-msg");
      msg.textContent = "This link has expired or was already used. Enter your email again for a new one.";
      msg.hidden = false;
      return false;
    }
  }

  let linking = false;
  if (isSignInWithEmailLink(auth, location.href)) {
    linking = true;
    const saved = read("cbAssessEmail");
    const done = (ok) => { linking = false; if (!ok) return; const u = auth.currentUser; if (u && u.emailVerified && !ready) { ready = true; onReady(u); } };
    if (saved) finish(saved).then(done);
    else {
      show("s-confirm");
      $("cf-btn").addEventListener("click", () => {
        const v = $("cf-email").value.trim();
        if (v) finish(v).then(done);
      });
    }
  }

  onAuthStateChanged(auth, async (user) => {
    // While an email sign-in link is being completed, ignore whoever was signed in before
    // (for example someone else on a shared computer); continue once the link has signed in.
    if (linking) return;
    if (user && user.emailVerified) {
      if (wanted && (user.email || "").toLowerCase() !== wanted) { await signOut(auth); return; }
      if (!ready) { ready = true; onReady(user); }
      return;
    }
    if (!linking) show("s-signin");
  });
}
