// functions/api/risk-signup.js - free Risk Assessment: adds the person to Brevo and emails them their result.
// POST /api/risk-signup  JSON: { name, email, consent: true, band, tops: [area keys], segment, source, website }
//   "website" is a hidden trap field: real people leave it empty, spam bots fill it.
// Individual answers are never sent here or stored.
//
// Cloudflare settings used (all already exist): BREVO_CONTACTS_KEY (or "Brevo API Key"), "Brevo API Key", CONTACT_SENDER_EMAIL.

import { D, BANDS, FULL_ADDS, HIGH_NOTE } from "../../js/risk-data.js";

const RISK_LIST_ID = 5;   // Brevo list "Risk screen"
const SITE = "https://capitalistbuddha.ca";
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

  const work = [sendResult(env, email, name, band, tops)];
  const ckey = env.BREVO_CONTACTS_KEY || env["Brevo API Key"];
  if (ckey && RISK_LIST_ID) {
    const attributes = { RISK_BAND: band, TOP_AREAS: tops.map((k) => D[k][0]).join(", "), SOURCE: source };
    if (segment) attributes.SEGMENT = segment;
    if (name) attributes.FIRSTNAME = name;
    const headers = { "api-key": ckey, "content-type": "application/json", accept: "application/json" };
    const create = (attrs) => fetch("https://api.brevo.com/v3/contacts", {
      method: "POST", headers,
      body: JSON.stringify({ email, listIds: [RISK_LIST_ID], updateEnabled: true, attributes: attrs }),
    });
    work.push(create(attributes).then(async (r) => {
      if (!r.ok) {
        console.log("Brevo risk contact:", r.status, await r.text());
        // If the RISK_BAND / TOP_AREAS / SEGMENT fields do not exist in Brevo, save the contact without them.
        const r2 = await create({ SOURCE: source });
        if (!r2.ok) console.log("Brevo risk contact retry:", r2.status, await r2.text());
      }
      // Make sure an existing contact is also added to the list
      await fetch(`https://api.brevo.com/v3/contacts/lists/${RISK_LIST_ID}/contacts/add`, {
        method: "POST",
        headers: { "api-key": ckey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ emails: [email] }),
      });
    }));
  }
  context.waitUntil(Promise.all(work).catch((e) => console.log("risk-signup:", e && e.message)));
  return json({ ok: true });
}

// The result email matches the result page.
async function sendResult(env, email, name, band, tops) {
  const key = env["Brevo API Key"], sender = env.CONTACT_SENDER_EMAIL;
  if (!key || !sender) { console.log("risk-signup: Brevo API Key or CONTACT_SENDER_EMAIL missing"); return; }
  const B = BANDS[band];
  const colour = { low: "#3d696a", medium: "#967ca0", high: "#8a5a6e" }[band];
  const p = "margin:0 0 14px;font-size:17px;line-height:1.6;color:#2f2a2c";
  const card = "background:#f4ecf1;border-radius:14px;padding:18px 20px;margin:16px 0";
  const h2 = "font-family:Georgia,serif;color:#3d696a;font-size:21px;margin:0 0 10px";
  const html =
    `<div style="max-width:600px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;background:#f7f2ee;padding:24px">` +
    `<p style="${p}">${name ? "Dear " + esc(name) + "," : "Hello,"}</p>` +
    `<p style="${p}">Thank you for taking the free Consciousness Destabilization Risk Assessment. Here is your result.</p>` +
    `<div style="background:${colour};color:#fff;border-radius:14px;padding:22px;text-align:center;margin:16px 0">` +
    `<div style="font-size:13px;letter-spacing:2px;text-transform:uppercase">Your overall result</div>` +
    `<div style="font-size:30px;font-weight:bold;margin-top:4px">${esc(B[0])}</div></div>` +
    `<p style="${p}">${esc(B[1])}</p>` +
    `<p style="${p};font-size:15px;font-style:italic;color:#6d5a6a">This is a first indication based on 12 questions. Your result on the full assessment may be different.</p>` +
    (band === "high" ? `<p style="${p}">${esc(HIGH_NOTE)}</p>` : "") +
    `<div style="${card}"><div style="${h2}">What the full assessment adds</div><ul style="margin:0;padding-left:20px">` +
      FULL_ADDS.map((t) => `<li style="margin:0 0 6px;font-size:17px;line-height:1.5;color:#2f2a2c">${esc(t)}</li>`).join("") + `</ul></div>` +
    `<p style="text-align:center;margin:24px 0"><a href="${SITE}/assessment.html?src=risk-email" style="display:inline-block;background:#c9a46a;color:#2f2a2c;padding:13px 28px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:18px">Take the full assessment ($150 USD)</a></p>` +
    `<p style="font-size:13px;line-height:1.5;color:#6d5a6a">This free assessment is not diagnostic and does not predict outcomes with certainty. It is a short version of the full scale. It is not medical, psychological or legal advice.</p>` +
    `<p style="font-size:13px;line-height:1.5;color:#6d5a6a">Dr. Jeffrey Overall &middot; The Professor Inc. &middot; <a href="${SITE}/privacy.html" style="color:#6d5a6a">Privacy policy</a></p></div>`;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Dr. Jeffrey Overall", email: sender }, to: [{ email, name: name || email }], subject: "Your free Consciousness Destabilization Risk Assessment result", htmlContent: html }),
  });
  if (!r.ok) console.log("Brevo risk email:", r.status, await r.text());
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
