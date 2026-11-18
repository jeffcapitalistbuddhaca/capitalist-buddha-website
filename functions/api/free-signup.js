// POST /api/free-signup  { email, consent, website }
// Records the start of a 30-day free Module 7 trial (in R2, private) and,
// if the visitor ticked the box, adds them to the Brevo "Free module" list.
// The sign-in email itself is sent by Firebase from the browser.

import { queue, inDays } from "../../lib/followups.js";
import { addToLists } from "../../lib/email.js";
export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "Bad request." }, 400);
  }

  // Spam trap: real people never fill the hidden "website" field.
  if (data.website) return json({ ok: true });

  const email = String(data.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  // The box must be ticked to receive the free module.
  if (data.consent !== true) {
    return json({ ok: false, error: "Please tick the box to receive the free module." }, 400);
  }

  // Where the visitor came from (letters, numbers, - and _ only)
  const source = String(data.source || "direct").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "direct";

  // Start the 30 days only once per email (signing up again doesn't reset it).
  const key = await freeKey(email);
  const existing = await env.COURSE_VIDEOS.head(key);
  if (!existing) {
    await env.COURSE_VIDEOS.put(
      key,
      JSON.stringify({ email, started: new Date().toISOString() }),
      { httpMetadata: { contentType: "application/json" } }
    );
    // Follow-ups on day 15 and day 29 (skipped if they buy the course)
    try {
      await queue(env, "B", email, "", inDays(15));
      await queue(env, "C", email, "", inDays(29));
    } catch (e) { console.log("followup queue:", e && e.message); }
  }

  // Add to the Brevo "Free module" list (new or existing contacts)
  const brevoKey = env.BREVO_CONTACTS_KEY || env["Brevo API Key"];
  if (brevoKey && env.FREE_LIST_ID) {
    const headers = {
      "api-key": brevoKey,
      "content-type": "application/json",
      accept: "application/json",
    };
    const listId = Number(env.FREE_LIST_ID);
    try {
      await addToLists(env, email, [listId], { SOURCE: source }); // also adds to the Newsletter list
    } catch (e) {
      console.log("Brevo error:", e && e.message); // never block the sign-up
    }
  }

  return json({ ok: true });
}

async function freeKey(email) {
  const bytes = new TextEncoder().encode(email);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `_free-access/${hex}.json`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
