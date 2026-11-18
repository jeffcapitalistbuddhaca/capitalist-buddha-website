// js/report.js - Industry report: verified-email gate + slide viewer.
// The slides are private (R2) and are only served to a signed-in user with a verified email.
import { sendBrandedAuthEmail } from "./auth-mail.js";
import { auth } from "./firebase-init.js";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const TOTAL = 69;
const $ = (id) => document.getElementById(id);
const gate = $("rp-gate"), viewer = $("rp-viewer"), msg = $("rp-msg");
let shown = false;

function say(text) { msg.textContent = text; msg.hidden = !text; }
function store(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} }
function read(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }

// Remember where the reader came from (?src=...)
(() => {
  const p = new URLSearchParams(location.search);
  const s = (p.get("src") || p.get("utm_source") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  if (s && !read("cbReportSource")) store("cbReportSource", s);
})();

// 1. Gate form: send the sign-in link
$("rp-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if ($("rp-website").value) return; // spam trap
  const email = $("rp-email").value.trim();
  if (!$("rp-consent").checked) { say("Please tick the box to agree to receive emails."); return; }
  const btn = $("rp-send"); btn.disabled = true; say("Sending...");
  try {
    if (!(await sendBrandedAuthEmail("signin", email, location.origin + "/report.html"))) {
      await sendSignInLinkToEmail(auth, email, { url: location.origin + "/report.html", handleCodeInApp: true });
    }
    store("cbReportEmail", email);
    store("cbReportConsent", "1");
    say("Check your inbox (and spam folder) for an email with a sign-in link. Open it on this device to read the report.");
  } catch (err) {
    say("Sorry, that didn't work. Please check the email address and try again.");
  }
  btn.disabled = false;
});

// 2. Coming back from the email link
async function finishLink(email) {
  try {
    await signInWithEmailLink(auth, email, location.href);
    store("cbReportEmail", null);
    history.replaceState(null, "", "/report.html");
  } catch (err) {
    say("This link has expired or was already used. Enter your email again for a new one.");
  }
}
if (isSignInWithEmailLink(auth, location.href)) {
  const saved = read("cbReportEmail");
  if (saved) {
    finishLink(saved);
  } else {
    // Opened on a different device: ask for the email again (no pop-up)
    $("rp-confirm").hidden = false;
    $("rp-confirm-btn").addEventListener("click", () => {
      const v = $("rp-confirm-email").value.trim();
      if (v) { store("cbReportConsent", "1"); finishLink(v); }
    });
  }
}

// 3. Signed in with a verified email: record in Brevo once, then show the slides
onAuthStateChanged(auth, async (user) => {
  if (!user || !user.emailVerified) { gate.hidden = false; viewer.hidden = true; return; }
  if (read("cbReportConsent") === "1" && !read("cbReportListed")) {
    try {
      const token = await user.getIdToken();
      const r = await fetch("/api/report-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, consent: true, source: read("cbReportSource") || "direct" }),
      });
      if (r.ok) store("cbReportListed", "1");
    } catch (_) {}
  }
  gate.hidden = true; viewer.hidden = false; say("");
  if (!shown) { shown = true; startViewer(user); }
});

// 4. Slide viewer
function startViewer(user) {
  let i = 1;
  const img = $("slide"), count = $("count"), prev = $("prev"), next = $("next"), prog = $("prog");
  const url = async (n) => `/api/report/slide-${String(n).padStart(2, "0")}.webp?token=${encodeURIComponent(await user.getIdToken())}`;
  const preload = async (n) => { if (n >= 1 && n <= TOTAL) { const p = new Image(); p.src = await url(n); } };
  async function show(n) {
    if (n < 1 || n > TOTAL) return;
    i = n;
    img.src = await url(i);
    img.alt = `Slide ${i} of ${TOTAL}`;
    count.textContent = `${i} / ${TOTAL}`;
    prev.disabled = i === 1; next.disabled = i === TOTAL;
    prog.style.width = (i / TOTAL * 100) + "%";
    preload(i + 1); preload(i - 1);
    try { history.replaceState(null, "", "/report.html#" + i); } catch (_) {}
  }
  prev.addEventListener("click", () => show(i - 1));
  next.addEventListener("click", () => show(i + 1));
  document.addEventListener("keydown", (e) => {
    if (viewer.hidden) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(i + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(i - 1); }
    if (e.key === "Home") show(1);
    if (e.key === "End") show(TOTAL);
  });
  const stage = $("stage"); let x0 = null;
  stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
  }, { passive: true });
  stage.addEventListener("click", (e) => {
    const r = stage.getBoundingClientRect();
    show(e.clientX - r.left > r.width / 2 ? i + 1 : i - 1);
  });
  const start = parseInt((location.hash || "").slice(1), 10);
  show(start >= 1 && start <= TOTAL ? start : 1);
}
