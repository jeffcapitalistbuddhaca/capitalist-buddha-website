// js/free.js - "Try a module for free" (Module 7) with a Firebase email sign-in link.
// Loaded with <script type="module" src="js/free.js"></script> after js/auth.js.

import { auth } from "./firebase-init.js";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const FREE_MODULE_ID = 7;
const area = document.getElementById("cb-free-content");

// 1. Sign-up forms (Home page + Free module tab)
document.querySelectorAll(".cb-free-form").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = form.querySelector(".cb-free-msg");
    const btn = form.querySelector("button[type=submit]");
    const email = form.querySelector("input[type=email]").value.trim();
    const consent = form.querySelector("input[type=checkbox]").checked;
    const website = form.querySelector(".cb-free-trap").value;
    btn.disabled = true;
    msg.textContent = "Sending...";
    try {
      const r = await fetch("/api/free-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, consent, website }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Something went wrong.");
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.origin + "/#free",
        handleCodeInApp: true,
      });
      try { localStorage.setItem("cbFreeEmail", email); } catch (_) {}
      form.reset();
      msg.textContent = "Check your inbox for your link to the free module (and your spam folder, just in case).";
    } catch (err) {
      console.error(err);
      msg.textContent = err.message && err.message.length < 120 ? err.message : "Sorry, that didn't work. Please try again.";
    }
    btn.disabled = false;
  });
});

// 2. Coming back from the email link (works on any device or browser)
async function finishSignIn(email) {
  await signInWithEmailLink(auth, email.trim(), window.location.href);
  try { localStorage.removeItem("cbFreeEmail"); } catch (_) {}
  history.replaceState({ tab: "free" }, "", window.location.pathname + "#free");
  if (typeof activateTab === "function") activateTab("free");
}

(async () => {
  if (!isSignInWithEmailLink(auth, window.location.href)) return;
  if (typeof activateTab === "function") activateTab("free");
  let email = null;
  try { email = localStorage.getItem("cbFreeEmail"); } catch (_) {}
  if (email) {
    try { await finishSignIn(email); return; } catch (err) { console.error(err); }
  }
  // Different device/browser: ask for the email on the page (no pop-up)
  const box = document.getElementById("cb-free-confirm");
  if (!box) return;
  box.style.display = "block";
  const form = box.querySelector("form");
  const msg = box.querySelector(".cb-free-msg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Opening...";
    try {
      await finishSignIn(form.querySelector("input[type=email]").value);
      box.style.display = "none";
    } catch (err) {
      console.error(err);
      msg.textContent = "That link has expired or doesn't match this email. Enter your email below to get a new link.";
    }
  });
})();

// 3. What the Free module tab shows
onAuthStateChanged(auth, async (user) => {
  if (!area) return;
  const signup = document.getElementById("cb-free-signup");
  if (!user) {
    area.innerHTML = "";
    signup.style.display = "block";
    return;
  }
  const status = await getStatus();
  if (status.paid) {
    signup.style.display = "none";
    area.innerHTML = `<p class="cb-free-note">You're enrolled in the full course. Open <strong>Login to Course</strong> to see all modules.</p>`;
    return;
  }
  if (!status.free) {
    signup.style.display = "none";
    area.innerHTML = `<p class="cb-free-note">Your 30 days of free access have ended. We'd love to have you in the full course.</p>`;
    return;
  }
  signup.style.display = "none";
  await renderFreeModule(status.daysLeft);
});

async function getStatus() {
  try {
    const token = await auth.currentUser.getIdToken();
    const r = await fetch(`/api/video/_status?token=${encodeURIComponent(token)}`);
    if (!r.ok) return { paid: false, free: false };
    return await r.json();
  } catch (_) {
    return { paid: false, free: false };
  }
}

async function renderFreeModule(daysLeft) {
  const modules = await (await fetch("/modules.json")).json();
  const m = modules.find((x) => Number(x.id) === FREE_MODULE_ID);
  if (!m) return;
  const token = await auth.currentUser.getIdToken();
  let videos = "";
  if (m.explanation_video) videos += videoBlock("Explanation", m.explanation_video);
  if (m.meditation_video) videos += videoBlock("Meditation", m.meditation_video);
  const text = (m.text || "")
    .split(/[\r\n]{2,}/).filter((p) => p.trim())
    .map((p) => `<p>${p.trim().replace(/[\r\n]+/g, " ")}</p>`).join("");
  area.innerHTML = `
    <p class="cb-free-note">Your free access: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left.</p>
    <h3 class="cb-free-title">Module ${m.id}. ${m.name}</h3>
    <div class="module-text">${text}</div>
    ${videos ? `<div class="module-videos">${videos}</div>` : ""}
    ${novelHtml(m)}`;
  attachVideoSources(area, token);
  area.querySelectorAll("img[data-panel]").forEach((img) => {
    img.src = videoUrl(img.dataset.panel, token);
    img.addEventListener("click", () => openPanel(img));
  });
}

function alertBox(text) {
  const msg = document.querySelector("#free .cb-free-msg");
  if (msg) msg.textContent = text;
}

// 4. "Enrol" button on the Free module tab: open Courses at the price box
document.querySelectorAll(".cb-free-enrol").forEach((b) =>
  b.addEventListener("click", () =>
    setTimeout(() => {
      const box = document.querySelector("#courses .course-purchase");
      if (box) box.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120)
  )
);
