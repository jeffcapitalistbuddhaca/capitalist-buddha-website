// functions/api/risk-signup.js - free Risk Assessment: adds the person to Brevo and emails them their result.
// POST /api/risk-signup  JSON: { name, email, consent: true, band, tops: [area keys], segment, source, website }
//   "website" is a hidden trap field: real people leave it empty, spam bots fill it.
// Individual answers are never sent here or stored.
//
// Cloudflare settings used (all already exist): BREVO_CONTACTS_KEY (or "Brevo API Key"), "Brevo API Key", CONTACT_SENDER_EMAIL.

import { D, BANDS, FULL_ADDS, HIGH_NOTE } from "../../js/risk-data.js";
import { SITE, wrap, p, ul, box, btn, bandBox, SIGN, hello, esc, sendEmail, addToLists } from "../../lib/email.js";

const RISK_LIST_ID = 5;   // Brevo list "Risk screen"
const SEGMENTS = ["exploring", "upheaval", "rebuilding"];

export async function onRequestPost(context) {
  const { request, env } = context;
  let d;
  try { d = await request.json(); } catch (_) { return json({ ok: false }, 400); }
  if (d && typeof d.website === "string" && d.website.trim() !== "") return json({ ok: true }); // spam trap
  if (d.consent !== true) return json({ ok: false, error: "consent" }, 400);

  const email = String(d.email || "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "email" }, 400);
  const name = String(d.name || "").replace(/[\r\n<>]+/g, " ").trim().slice(0, 80);
  const band = BANDS[d.band] ? d.band : null;
  if (!band) return json({ ok: false, error: "band" }, 400);
  const tops = (Array.isArray(d.tops) ? d.tops : []).filter((k) => D[k]).slice(0, 3);
  const segment = SEGMENTS.includes(d.segment) ? d.segment : "";
  const source = String(d.source || "direct").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "direct";

  const attributes = { RISK_BAND: band, TOP_AREAS: tops.map((k) => D[k][0]).join(", "), SOURCE: source };
  if (segment) attributes.SEGMENT = segment;
  if (name) attributes.FIRSTNAME = name;
  context.waitUntil(Promise.all([
    sendResult(env, email, name, band),
    addToLists(env, email, [RISK_LIST_ID], attributes),
  ]).catch((e) => console.log("risk-signup:", e && e.message)));
  return json({ ok: true });
}

// The result email matches the result page: the level only, then what the full assessment adds.
async function sendResult(env, email, name, band) {
  const B = BANDS[band];
  const html = wrap({
    pre: "Your first indication of your risk level.",
    body: hello(name) +
      p("Thank you for taking the free Consciousness Destabilization Risk Assessment. Here is your result.") +
      bandBox("Your overall result", esc(B[0])) +
      p(esc(B[1])) +
      p("<i>This is a first indication based on 12 questions. Your result on the full assessment may be different.</i>", "; font-size:16px; color:#6d5a6a") +
      (band === "high" ? p(esc(HIGH_NOTE)) : "") +
      box("What the full assessment adds", ul(FULL_ADDS.map(esc))) +
      btn("Take the full assessment", SITE + "/assessment.html?src=risk-email") +
      SIGN,
    foot: "This free assessment is not diagnostic and does not predict outcomes with certainty. It is a short version of the full scale. It is not medical, psychological or legal advice.",
  });
  return sendEmail(env, { to: email, name, subject: "Your free Consciousness Destabilization Risk Assessment result", html });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
