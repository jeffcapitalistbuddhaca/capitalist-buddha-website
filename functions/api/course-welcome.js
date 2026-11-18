// functions/api/course-welcome.js - sends the "Welcome to the Conscious Business Course" email (Email E).
// POST /api/course-welcome?session_id=cs_...   (called by confirmation.html after a course purchase)
//
// Kept separate from all payment code on purpose: it only READS the checkout session from Stripe,
// never changes anything in Stripe, and does not affect checkout, the webhook or the confirmation page.
// Sends at most once per purchase (marker in R2 under "assessments/course-welcome/", which the video
// function never serves). Payment Link sessions (assessment, one-on-one) are ignored.
//
// Cloudflare settings used (all already exist): STRIPE_RESTRICTED_KEY, "Brevo API Key", BREVO_CONTACTS_KEY, CONTACT_SENDER_EMAIL.

import { queue, courseFollowupDate } from "../../lib/followups.js";
import { SITE, wrap, p, ul, box, btn, SIGN, hello, sendEmail, addToLists } from "../../lib/email.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const id = String(new URL(request.url).searchParams.get("session_id") || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return json({ ok: false }, 400);
  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions/" + id, {
      headers: { Authorization: "Bearer " + env.STRIPE_RESTRICTED_KEY },
    });
    if (!res.ok) return json({ ok: false }, 404);
    const s = await res.json();
    const paid = s.status === "complete" && (s.payment_status === "paid" || s.payment_status === "no_payment_required");
    if (!paid || s.payment_link) return json({ ok: false }, 404);
    const email = ((s.customer_details && s.customer_details.email) || s.customer_email || "").trim().toLowerCase();
    if (!email) return json({ ok: false }, 404);

    const marker = "assessments/course-welcome/" + id;
    if (await env.COURSE_VIDEOS.head(marker)) return json({ ok: true, already: true });
    await env.COURSE_VIDEOS.put(marker, JSON.stringify({ email, created: s.created }));

    const name = (s.customer_details && s.customer_details.name) || "";
    context.waitUntil(Promise.all([
      sendEmail(env, { to: email, name, subject: "Welcome to the Conscious Business Course", html: wrap({
        pre: "What happens next.",
        body: hello(name) +
          p("Welcome to the Conscious Business Course. Thank you for enrolling.") +
          box("What happens next", ul([
            "The course starts on <b>February 1, 2027</b>. Your 6 months of access count from that day.",
            "Log in on the course page with the email you paid with.",
            "The 12 live weekly sessions are with me, and recordings are posted for you.",
            "We will email you the dates and times of the live sessions closer to the start.",
          ])) +
          btn("Go to the course", SITE + "/#courses") + SIGN,
      }) }),
      addToLists(env, email, [], { SOURCE: "course" }),
      queue(env, "D", email, name, courseFollowupDate((s.created || 0) * 1000)), // 30 days after the session starts
    ]).catch((e) => console.log("course-welcome:", e && e.message)));
    return json({ ok: true });
  } catch (e) {
    console.log("course-welcome error:", e && e.message);
    return json({ ok: false }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
