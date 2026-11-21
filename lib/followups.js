// lib/followups.js - follow-up emails (A, B, C, D, F): queueing, checks and sending.
//
// When something happens (free assessment, free module start, report sign-up, course purchase),
// the site saves a small "due" note in R2 under followups/queue/. Once a day, GitHub calls
// /api/followups/run, which sends the notes that are due. Just before sending, it checks Stripe so
// people never get a reminder to buy something they have already bought, and skips anyone who unsubscribed.
// Notes live under "followups/", which the video function never serves.

import { SITE, wrap, p, ul, btn, SIGN, hello, sendEmail } from "./email.js";

const DAY = 86400000;
// Open enrolment: no session dates, access starts at payment.
// Keep in step with SESSION_STARTS in functions/api/video/[[path]].js
const SESSION_STARTS = [];
const ASSESSMENT_LINK = "plink_1Ucq6GKLvdoBDUk6Mz2ujDZ1";
const ASSESS_BUY = "https://buy.stripe.com/7sYeVefnw7pD8lFdDt9Zm00";
const COURSE = SITE + "/#courses";
const NOTDIAG = "The assessment is not diagnostic and is not medical, psychological or legal advice.";

async function sha(text) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
export async function unsubToken(env, email) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.FOLLOWUP_SECRET || "x"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  return [...new Uint8Array(sig)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join("");
}
export const unsubKey = async (email) => "followups/unsub/" + (await sha(email));

// Saves one follow-up to send on a given date (Date). Same type + email is only queued once.
export async function queue(env, type, email, name, due, extra = {}) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return;
  const key = `followups/queue/${type}-${(await sha(email)).slice(0, 32)}.json`;
  if (await env.COURSE_VIDEOS.head(key)) return;
  await env.COURSE_VIDEOS.put(key, JSON.stringify({ type, email, name: name || "", due: due.getTime(), queued: Date.now(), ...extra }), {
    httpMetadata: { contentType: "application/json" },
  });
}
export const inDays = (n) => new Date(Date.now() + n * DAY);

// Email D date: 30 days after purchase (no session dates with open enrolment).
export function courseFollowupDate(purchasedMs) {
  const day = new Date(purchasedMs).toISOString().slice(0, 10);
  const start = SESSION_STARTS.find((s) => s >= day);
  const startMs = start ? Date.parse(start + "T05:00:00Z") : purchasedMs;
  return new Date(startMs + 30 * DAY);
}

// ---------- Stripe checks (read only) ----------
async function stripeList(env, params) {
  const out = [];
  let after = null;
  for (let page = 0; page < 5; page++) {
    const q = new URLSearchParams({ status: "complete", limit: "100", ...params });
    if (after) q.set("starting_after", after);
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions?" + q, { headers: { Authorization: "Bearer " + env.STRIPE_RESTRICTED_KEY } });
    if (!r.ok) throw new Error("Stripe " + r.status);
    const list = await r.json();
    out.push(...(list.data || []));
    if (!list.has_more || !list.data.length) break;
    after = list.data[list.data.length - 1].id;
  }
  return out;
}
const emailOf = (s) => ((s.customer_details && s.customer_details.email) || s.customer_email || "").trim().toLowerCase();
const isPaid = (s) => s.payment_status === "paid" || s.payment_status === "no_payment_required";
async function boughtAssessment(env, email) {
  return (await stripeList(env, { payment_link: ASSESSMENT_LINK })).some((s) => isPaid(s) && emailOf(s) === email);
}
async function boughtCourse(env, email, sinceMs) {
  const since = Math.floor((sinceMs - 2 * DAY) / 1000);
  return (await stripeList(env, { "created[gte]": String(since) })).some((s) => isPaid(s) && !s.payment_link && emailOf(s) === email);
}

// ---------- The emails (approved texts) ----------
function build(type, n) {
  const name = n.name;
  if (type === "A") return { skip: (env, e) => boughtAssessment(env, e), subject: "Your result was a starting point", pre: "The full assessment shows the whole picture.", foot: NOTDIAG,
    body: (u) => hello(name) + p("Five days ago you took the free Consciousness Destabilization Risk Assessment. Your result came from 12 questions. It is a snapshot, not the whole picture.") +
      p("The full assessment looks at thirteen areas of your life in depth: your history, your current stress, your relationships, your work, your sense of self and the support around you. It takes 15 to 20 minutes, and your answers save as you go.") +
      p("You get:") + ul(["Your personal report: your overall result, a profile of all thirteen areas, and practice guidance for your result", "A results review with me, to talk through what it means for you"]) +
      btn("Get the full assessment", ASSESS_BUY + "?prefilled_email=" + encodeURIComponent(n.email)) + p("$150 USD plus applicable tax.", "; text-align:center; font-size:16px") + SIGN };
  if (type === "B") return { skip: (env, e) => boughtCourse(env, e, n.queued), subject: "Halfway through your free module", pre: "How is Module 7 sitting with you?",
    body: () => hello(name) + p("You are halfway through your 30 days with Module 7, Finding your passion. I hope the video, the guided meditation and the exercise have given you something to sit with.") +
      p("Module 7 is one of sixteen. The Conscious Business Course takes you from upheaval to a tested business idea built around who you have become. It is for people who left their career after an awakening and are working out what comes next.") +
      ul(["16 modules, each with a video lesson, a guided meditation, an exercise and a graphic novel", "Live sessions with me every two weeks", "6 months of access, counted from the day you enrol"]) +
      p("Enrol any time and start today. $199 USD.") + btn("Enrol in the course", COURSE) +
      p("Your free module stays open for another 15 days.") + SIGN };
  if (type === "C") return { skip: (env, e) => boughtCourse(env, e, n.queued), subject: "Your free module closes tomorrow", pre: "One last look, and what comes next.",
    body: () => hello(name) + p("Tomorrow your access to Module 7, Finding your passion, ends. If there is an exercise you have not finished, today is a good day to do it.") +
      p("If the module spoke to you, the rest of the path is waiting. The Conscious Business Course has 16 modules and live sessions with me every two weeks, and takes you from upheaval to a tested business idea built around who you have become.") +
      p("Enrol any time and start today. $199 USD, with 6 months of access from the day you enrol.") + btn("Enrol in the course", COURSE) + SIGN };
  if (type === "D") return { skip: (env, e) => boughtAssessment(env, e), subject: "A month in: where do you stand?", pre: "A clear picture of thirteen areas of your life, right now.", foot: NOTDIAG,
    body: () => hello(name) + p("We are now a month into the Conscious Business Course. For many people, this is when the deeper changes start to show: in how they see their work, their relationships and themselves.") +
      p("In my research, what happened after a peak experience mattered as much as the experience itself. The full Consciousness Destabilization Risk Assessment can give you a clear picture of where you stand right now across thirteen areas of your life: your history, your current stress, your relationships, your work, your sense of self and your support.") +
      p("You get your personal report straight away, and a results review with me.") + btn("Get the full assessment", ASSESS_BUY + "?prefilled_email=" + encodeURIComponent(n.email)) +
      p("$150 USD plus applicable tax. It is optional and separate from the course.", "; text-align:center; font-size:16px") + SIGN };
  if (type === "F") return { skip: async () => false, subject: "From the industry to the individual", pre: "What the study found about the people inside it.",
    body: () => hello(name) + p("Thank you for reading The Psychedelic Renaissance 2026. The report looks at the industry. This email is about the people in it.") +
      p("One finding from my 8-year study stood out. About 40% of people who have a peak consciousness-expanding experience go on to face destabilizing events in their lives: leaving careers, relationships or the places they lived. Yet most retreats screen everyone the same way.") +
      p("That is why I built the Consciousness Destabilization Risk Scale. The free version takes about 2 minutes and gives you a first indication of your risk level.") +
      btn("Take the free risk assessment", SITE + "/risk-scale.html") +
      p(`And if you have already been through that kind of upheaval and are rebuilding your work, my Conscious Business Course is open for enrolment any time. <a href="${COURSE}" style="color:#3d696a">See the course</a>.`) + SIGN };
  return null;
}

// Sends every follow-up that is due. Returns a short summary.
export async function runDue(env) {
  const sum = { sent: 0, skipped: 0, notDue: 0, errors: 0 };
  let cursor;
  do {
    const list = await env.COURSE_VIDEOS.list({ prefix: "followups/queue/", cursor });
    for (const o of list.objects) {
      try {
        const obj = await env.COURSE_VIDEOS.get(o.key);
        if (!obj) continue;
        const n = await obj.json();
        if (n.due > Date.now()) { sum.notDue++; continue; }
        const def = build(n.type, n);
        const unsub = await env.COURSE_VIDEOS.head(await unsubKey(n.email));
        if (!def || unsub || (await def.skip(env, n.email))) {
          sum.skipped++;
        } else {
          const link = `${SITE}/api/unsubscribe?e=${encodeURIComponent(n.email)}&t=${await unsubToken(env, n.email)}`;
          const ok = await sendEmail(env, { to: n.email, name: n.name, subject: def.subject, html: wrap({ pre: def.pre, body: def.body(), foot: def.foot || "", unsubscribe: link }) });
          if (!ok) { sum.errors++; continue; } // try again tomorrow
          sum.sent++;
        }
        // Done (sent or skipped): move the note out of the queue
        await env.COURSE_VIDEOS.put(o.key.replace("followups/queue/", "followups/done/"), JSON.stringify({ ...n, done: Date.now() }));
        await env.COURSE_VIDEOS.delete(o.key);
      } catch (e) {
        sum.errors++;
        console.log("followup error", o.key, e && e.message);
      }
    }
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
  return sum;
}
