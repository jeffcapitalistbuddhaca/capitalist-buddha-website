// functions/api/assess/[[path]].js - Full Consciousness Destabilization Risk Assessment.
//
//   GET  /api/assess/session?id=cs_...   email of a completed assessment checkout (for the sign-in form)
//   GET  /api/assess/state               the signed-in buyer's assessments (one per payment)
//   POST /api/assess/save    {id, data}  save answers as they go
//   POST /api/assess/submit  {id}        check every answer, score, store the report, send emails
//   GET  /api/assess/report?id=...       a completed report (owner, or the admin)
//
// Signed-in calls send "Authorization: Bearer <Firebase ID token>".
// Records are stored privately in R2 (binding COURSE_VIDEOS) under "assessments/<checkout session id>.json".
// The video function refuses to serve anything under "assessments/".
//
// Cloudflare settings used (all already exist): STRIPE_RESTRICTED_KEY, FIREBASE_AUTH_PROJECT_ID,
// "Brevo API Key", BREVO_CONTACTS_KEY, CONTACT_SENDER_EMAIL.

import { jwtVerify, importX509 } from "jose";
import { SECTIONS, scoreAssessment, BAND_LABEL } from "../../../js/assess-data.js";

// ---- Settings (not secret) ----
const PAYMENT_LINK_ID = "plink_1Ucq6GKLvdoBDUk6Mz2ujDZ1";   // the assessment Payment Link in Stripe
const BUYERS_LIST_ID = 6;                     // Brevo list "Assessment buyers"
const ADMIN_EMAIL = "jeff@capitalistbuddha.ca"; // can open every report; gets an email for each one
const SITE = "https://capitalistbuddha.ca";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const PREFIX = "assessments/";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/assess\/?/, "").replace(/\/$/, "");
  try {
    if (route === "session" && request.method === "GET") return await sessionEmail(url, env);

    const user = await currentUser(request, env);
    if (!user) return json({ error: "login" }, 401);

    if (route === "state" && request.method === "GET") return await state(user, env);
    if (route === "save" && request.method === "POST") return await save(user, await body(request), env);
    if (route === "submit" && request.method === "POST") return await submit(user, await body(request), env, context);
    if (route === "report" && request.method === "GET") return await report(user, url.searchParams.get("id") || "", env);
    return json({ error: "not_found" }, 404);
  } catch (e) {
    console.log("assess error:", e && e.message);
    return json({ error: "server" }, 500);
  }
}

// ---------- Routes ----------

async function sessionEmail(url, env) {
  const id = String(url.searchParams.get("id") || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return json({}, 400);
  const res = await stripe(env, "/v1/checkout/sessions/" + id);
  if (!res || !isAssessmentPaid(res)) return json({}, 404);
  return json({ email: (res.customer_details && res.customer_details.email) || "" });
}

async function state(user, env) {
  const sessions = await paidSessions(user.email, env);
  const list = [];
  for (const s of sessions) {
    const rec = await getRecord(env, s.id);
    list.push({
      id: s.id,
      created: s.created,
      submitted: !!(rec && rec.submitted),
      submittedOn: rec && rec.submitted ? new Date(rec.submitted).toISOString().slice(0, 10) : null,
      data: rec && !rec.submitted ? rec.data : null,
    });
  }
  // Oldest unfinished first, so a second purchase does not hide the first one.
  list.sort((a, b) => a.created - b.created);
  return json({ assessments: list });
}

async function save(user, b, env) {
  const rec = await ownedRecord(user, String(b.id || ""), env, true);
  if (!rec) return json({ error: "not_found" }, 404);
  if (rec.submitted) return json({ error: "submitted" }, 409);
  rec.data = clean(b.data || {});
  rec.updated = Date.now();
  await putRecord(env, rec);
  return json({ ok: true });
}

async function submit(user, b, env, context) {
  const rec = await ownedRecord(user, String(b.id || ""), env, false);
  if (!rec) return json({ error: "not_found" }, 404);
  if (rec.submitted) return json({ ok: true, id: rec.id });
  const d = rec.data || {};
  const a = d.about || {};
  const missing = [];
  if (!a.name) missing.push("name");
  if (!a.birth) missing.push("birth");
  if (!(Number.isInteger(a.psy) && a.psy >= 0)) missing.push("psy");
  if (d.rel !== "yes" && d.rel !== "no") missing.push("rel");
  if (d.consent !== "yes" && d.consent !== "no") missing.push("consent");
  for (const sec of SECTIONS) {
    if (sec.key === "reldis" && d.rel !== "yes") continue;
    for (const it of sec.items) if (!(d.answers && d.answers[it.id] >= 1 && d.answers[it.id] <= 7)) missing.push(it.id);
  }
  if (missing.length) return json({ error: "incomplete", missing }, 400);

  rec.report = scoreAssessment(d.answers, d.rel === "yes");
  rec.submitted = Date.now();
  await putRecord(env, rec);

  const link = SITE + "/assessment-report.html?id=" + encodeURIComponent(rec.id);
  const band = BAND_LABEL[rec.report.overall.band];
  context.waitUntil(Promise.all([
    sendEmail(env, rec.email, a.name, "Your Consciousness Destabilization Risk report is ready",
      `<p>Dear ${esc(a.name)},</p><p>Thank you for completing the full Consciousness Destabilization Risk Assessment. Your personal report is ready.</p>` +
      `<p><a href="${link}" style="display:inline-block;background:#c9a46a;color:#2f2a2c;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:bold">See my report</a></p>` +
      `<p>At the end of your report you can book your results review with Dr. Overall.</p>` +
      `<p>To open the report, sign in with this email address (${esc(rec.email)}). We will send you a one-time sign-in link.</p>` +
      `<p>Warmly,<br>Dr. Jeffrey Overall</p><p style="font-size:12px;color:#777">This report is not diagnostic and is not medical, psychological or legal advice.</p>`),
    sendEmail(env, ADMIN_EMAIL, "Jeff", `New full assessment: ${a.name} (${band})`,
      `<p>${esc(a.name)} (${esc(rec.email)}) completed the full assessment.</p><p>Overall: <b>${band}</b> (${rec.report.overall.score.toFixed(2)})<br>` +
      `Research consent: <b>${d.consent === "yes" ? "Yes" : "No"}</b></p><p><a href="${link}">Open the report</a> (sign in with ${ADMIN_EMAIL}).</p>`),
    addToBuyersList(env, rec.email, a.name),
  ]).catch((e) => console.log("assess email error:", e && e.message)));

  return json({ ok: true, id: rec.id });
}

async function report(user, id, env) {
  const isAdmin = user.email === ADMIN_EMAIL;
  const rec = await getRecord(env, id);
  if (!rec || !rec.submitted) return json({ error: "not_found" }, 404);
  if (!isAdmin && rec.email !== user.email) return json({ error: "forbidden" }, 403);
  return json({ id: rec.id, email: rec.email, name: (rec.data.about || {}).name || "", submitted: rec.submitted, report: rec.report });
}

// ---------- Records ----------

function validId(id) { return /^cs_[A-Za-z0-9_]+$/.test(id); }

async function getRecord(env, id) {
  if (!validId(id)) return null;
  const obj = await env.COURSE_VIDEOS.get(PREFIX + id + ".json");
  return obj ? await obj.json() : null;
}

async function putRecord(env, rec) {
  await env.COURSE_VIDEOS.put(PREFIX + rec.id + ".json", JSON.stringify(rec), {
    httpMetadata: { contentType: "application/json" },
  });
}

// Returns the record for this checkout session if it belongs to the signed-in user.
// The first time, it checks Stripe that this email paid for this session, then creates the record.
async function ownedRecord(user, id, env, create) {
  if (!validId(id)) return null;
  let rec = await getRecord(env, id);
  if (rec) return rec.email === user.email ? rec : null;
  if (!create) return null;
  const s = await stripe(env, "/v1/checkout/sessions/" + id);
  if (!s || !isAssessmentPaid(s) || sessionEmailOf(s) !== user.email) return null;
  rec = { id, email: user.email, created: Date.now(), data: {}, submitted: null, report: null };
  await putRecord(env, rec);
  return rec;
}

// Keeps only the fields the questionnaire uses, with safe values.
function clean(d) {
  const a = d.about || {};
  const answers = {};
  const ids = new Set(SECTIONS.flatMap((s) => s.items.map((i) => i.id)));
  for (const [k, v] of Object.entries(d.answers || {})) {
    const n = Number(v);
    if (ids.has(k) && Number.isInteger(n) && n >= 1 && n <= 7) answers[k] = n;
  }
  const psy = a.psy === null || a.psy === undefined || a.psy === "" ? null : Number(a.psy);
  return {
    about: {
      name: String(a.name || "").slice(0, 120),
      birth: /^\d{4}-\d{2}-\d{2}$/.test(String(a.birth || "")) ? a.birth : "",
      psy: Number.isInteger(psy) && psy >= 0 && psy < 100000 ? psy : null,
    },
    answers,
    rel: d.rel === "yes" || d.rel === "no" ? d.rel : null,
    consent: d.consent === "yes" || d.consent === "no" ? d.consent : null,
    step: Math.max(0, Math.min(15, Number.isInteger(d.step) ? d.step : 0)),
  };
}

// ---------- Stripe ----------

function sessionEmailOf(s) { return ((s.customer_details && s.customer_details.email) || "").trim().toLowerCase(); }

// Paid through the assessment Payment Link (a 100% promotion code shows as "no_payment_required").
function isAssessmentPaid(s) {
  return s.payment_link === PAYMENT_LINK_ID && s.status === "complete" &&
    (s.payment_status === "paid" || s.payment_status === "no_payment_required");
}

async function stripe(env, path) {
  const res = await fetch("https://api.stripe.com" + path, {
    headers: { Authorization: "Bearer " + env.STRIPE_RESTRICTED_KEY },
  });
  if (!res.ok) { console.log("Stripe", path, res.status); return null; }
  return res.json();
}

async function paidSessions(email, env) {
  const out = [];
  let after = null;
  for (let page = 0; page < 5; page++) {
    const q = new URLSearchParams({ payment_link: PAYMENT_LINK_ID, status: "complete", limit: "100" });
    if (after) q.set("starting_after", after);
    const list = await stripe(env, "/v1/checkout/sessions?" + q.toString());
    if (!list) break;
    const data = Array.isArray(list.data) ? list.data : [];
    for (const s of data) if (isAssessmentPaid(s) && sessionEmailOf(s) === email) out.push(s);
    if (!list.has_more || !data.length) break;
    after = data[data.length - 1].id;
  }
  return out;
}

// ---------- Brevo ----------

async function sendEmail(env, to, name, subject, html) {
  const key = env["Brevo API Key"], sender = env.CONTACT_SENDER_EMAIL;
  if (!key || !sender || !to) return;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Dr. Jeffrey Overall", email: sender }, to: [{ email: to, name: name || to }], subject, htmlContent: html }),
  });
  if (!r.ok) console.log("Brevo email:", r.status, await r.text());
}

async function addToBuyersList(env, email, name) {
  const key = env.BREVO_CONTACTS_KEY || env["Brevo API Key"];
  if (!key || !BUYERS_LIST_ID) return;
  const r = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, listIds: [BUYERS_LIST_ID], updateEnabled: true, attributes: { FIRSTNAME: String(name || "").split(" ")[0], SOURCE: "assessment" } }),
  });
  if (!r.ok) console.log("Brevo buyers list:", r.status, await r.text());
  await fetch(`https://api.brevo.com/v3/contacts/lists/${BUYERS_LIST_ID}/contacts/add`, {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ emails: [email] }),
  });
}

// ---------- Helpers ----------

async function body(request) { try { return await request.json(); } catch (_) { return {}; } }

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function currentUser(request, env) {
  const h = request.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  try {
    const p = await verifyFirebaseIdToken(token, env.FIREBASE_AUTH_PROJECT_ID);
    if (!p.email || p.email_verified !== true) return null;
    return { email: String(p.email).trim().toLowerCase(), uid: p.sub };
  } catch (_) { return null; }
}

// Same Firebase ID token check as the video and report functions.
async function verifyFirebaseIdToken(token, projectId) {
  if (!projectId) throw new Error("FIREBASE_AUTH_PROJECT_ID is not set");
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error("Could not download Google certificates");
  const certs = await res.json();
  const { payload } = await jwtVerify(
    token,
    async (header) => {
      const pem = certs[header.kid];
      if (!pem) throw new Error("Unknown key id");
      return importX509(pem, "RS256");
    },
    { algorithms: ["RS256"], issuer: `https://securetoken.google.com/${projectId}`, audience: projectId }
  );
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("Token expired");
  if (typeof payload.iat !== "number" || payload.iat > now) throw new Error("Bad iat");
  if (typeof payload.auth_time !== "number" || payload.auth_time > now) throw new Error("Bad auth_time");
  if (typeof payload.sub !== "string" || payload.sub.length === 0) throw new Error("Bad sub");
  return payload;
}
