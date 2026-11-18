// js/auth-mail.js - asks the site to send a sign-in / verify / reset email in its own design.
// Returns true if sent. If it returns false, the caller sends Firebase's own email instead.
export async function sendBrandedAuthEmail(type, email, continueUrl) {
  try {
    const r = await fetch("/api/auth-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, email, continueUrl }),
    });
    const d = await r.json();
    return !!(r.ok && d.ok);
  } catch (_) {
    return false;
  }
}
