// functions/api/auth-email.js - sends sign-in, verify-email and password-reset emails in the site's design.
// POST /api/auth-email  { type: "signin" | "verify" | "reset", email, continueUrl }
// Returns { ok: true } when sent. On { ok: false } the browser falls back to Firebase's own email,
// so signing in never breaks. At most 5 emails per address per hour.
// GET /api/auth-email?check=1 tests the setup without sending anything.
import { actionLink } from "../../lib/firebase-admin.js";
import { SITE, wrap, p, h, btn, SIGN, esc, sendEmail } from "../../lib/email.js";

const TYPES = {
  signin: { req: "EMAIL_SIGNIN", subject: "Your sign-in link for Capitalist Buddha", pre: "One click to sign in.",
    body: (email, link) => h("Sign in to Capitalist Buddha") + p("Hi there,") + p(`Click the button below to sign in with ${esc(email)}.`) + btn("Sign in", link) +
      p("This link can be used once. If you did not ask for it, you can ignore this email.", "; font-size:16px") + SIGN },
  verify: { req: "VERIFY_EMAIL", subject: "Confirm your email for the Conscious Business Course", pre: "One click to finish setting up your account.",
    body: (email, link) => h("Confirm your email") + p("Hi there,") + p(`Please confirm ${esc(email)} to finish setting up your Conscious Business Course account.`) + btn("Confirm my email", link) +
      p("If you did not create this account, you can ignore this email.", "; font-size:16px") + SIGN },
  reset: { req: "PASSWORD_RESET", subject: "Reset your Conscious Business Course password", pre: "Choose a new password.",
    body: (email, link) => h("Reset your password") + p("Hi there,") + p(`We received a request to reset the password for ${esc(email)}.`) + btn("Choose a new password", link) +
      p("If you did not ask for this, you can ignore this email and your password stays the same.", "; font-size:16px") + SIGN },
};

async function sha(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function onRequestGet({ request, env }) {
  if (new URL(request.url).searchParams.get("check") !== "1") return json({ ok: false }, 404);
  try { await actionLink(env, "EMAIL_SIGNIN", "check@capitalistbuddha.ca", SITE + "/"); return json({ ok: true }); }
  catch (e) { return json({ ok: false, reason: String(e.message || e).slice(0, 300) }); }
}

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch (_) { return json({ ok: false }, 400); }
  const t = TYPES[d.type];
  const email = String(d.email || "").trim().toLowerCase();
  if (!t || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return json({ ok: false }, 400);
  let cont = String(d.continueUrl || "");
  if (cont && !cont.startsWith(SITE + "/")) cont = SITE + "/";
  try {
    // At most 5 emails per address per hour
    const key = "authmail/" + (await sha(email));
    const prev = await env.COURSE_VIDEOS.get(key);
    const times = (prev ? await prev.json() : []).filter((x) => Date.now() - x < 3600000);
    if (times.length >= 5) return json({ ok: false, error: "too_many" }, 429);
    const link = await actionLink(env, t.req, email, cont || undefined);
    const sent = await sendEmail(env, { to: email, subject: t.subject, html: wrap({ pre: t.pre, body: t.body(email, link) }) });
    if (!sent) return json({ ok: false });
    await env.COURSE_VIDEOS.put(key, JSON.stringify([...times, Date.now()]));
    return json({ ok: true });
  } catch (e) {
    console.log("auth-email:", e && e.message);
    return json({ ok: false });
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
