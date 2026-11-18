// functions/api/book.js - one-on-one sessions: personal single-use Calendly links after payment.
// GET /api/book?session_id=cs_...   (called by book.html; the session id comes from the Stripe redirect or Email H)
//
// Reads the paid checkout session from Stripe (read only), then creates exactly ONE single-use Calendly
// link per session purchased. Each link books one meeting and then stops working, so nobody can book more
// than they paid for. Links are saved in R2 (assessments/oneonone/<session id>.json, never served by the
// video function) so refreshing the page shows the same links and never creates new ones.
// The first time, it also sends Email H to the buyer and an alert to Dr. Overall, and adds the buyer to Brevo.
//
// Cloudflare settings used: STRIPE_RESTRICTED_KEY, CALENDLY_TOKEN (new, secret), "Brevo API Key", BREVO_CONTACTS_KEY, CONTACT_SENDER_EMAIL.

import { SITE, wrap, p, h, btn, SIGN, hello, esc, sendEmail, addToLists } from "../../lib/email.js";

const PAYMENT_LINK_ID = "plink_1UdAc2KLvdoBDUk6CV48Dmok"; // one-on-one Payment Link
const EVENT_SLUG = "strategic-consultation";               // Calendly event used for paid sessions
const ADMIN_EMAIL = "jeff@capitalistbuddha.ca";
const MAX_SESSIONS = 10;

export async function onRequestGet(context) {
  const { request, env } = context;
  const id = String(new URL(request.url).searchParams.get("session_id") || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return json({ error: "bad_request" }, 400);
  const key = "assessments/oneonone/" + id + ".json";
  try {
    const existing = await env.COURSE_VIDEOS.get(key);
    if (existing) {
      const rec = await existing.json();
      if (rec.links && rec.links.length) return json(publicView(rec));
      if (Date.now() - (rec.started || 0) < 60000) return json({ pending: true });
    }

    // 1. Check the payment (read only)
    const sRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}?expand[]=line_items`, {
      headers: { Authorization: "Bearer " + env.STRIPE_RESTRICTED_KEY },
    });
    if (!sRes.ok) return json({ error: "not_found" }, 404);
    const s = await sRes.json();
    const paid = s.status === "complete" && (s.payment_status === "paid" || s.payment_status === "no_payment_required");
    if (!paid || s.payment_link !== PAYMENT_LINK_ID) return json({ error: "not_found" }, 404);
    const qty = Math.max(1, Math.min(MAX_SESSIONS, ((s.line_items && s.line_items.data || [])[0] || {}).quantity || 1));
    const email = ((s.customer_details && s.customer_details.email) || "").trim().toLowerCase();
    const name = (s.customer_details && s.customer_details.name) || "";
    await env.COURSE_VIDEOS.put(key, JSON.stringify({ id, email, name, qty, started: Date.now(), links: [] }));

    // 2. Create one single-use Calendly link per session
    const links = await createLinks(env, qty);
    const rec = { id, email, name, qty, started: Date.now(), links, amount: s.amount_total, currency: s.currency };
    await env.COURSE_VIDEOS.put(key, JSON.stringify(rec), { httpMetadata: { contentType: "application/json" } });

    // 3. Emails and Brevo (once)
    const prefill = (u) => u + "?name=" + encodeURIComponent(name) + "&email=" + encodeURIComponent(email);
    context.waitUntil(Promise.all([
      sendEmail(env, { to: email, name, subject: "Book your one-on-one session", html: wrap({
        pre: "Your personal booking links.",
        body: hello(name) +
          p(`Thank you for purchasing ${qty} one-on-one session${qty > 1 ? "s" : ""} with me, at one hour each.`) +
          p(`Below is one personal booking link for each session you purchased. Each link books one session and works only once.`) +
          links.map((u, i) => btn(qty > 1 ? `Book session ${i + 1}` : "Book my session", prefill(u))).join("") + SIGN,
      }) }),
      sendEmail(env, { to: ADMIN_EMAIL, name: "Jeff", subject: `New one-on-one purchase: ${name || email} (${qty} hour${qty > 1 ? "s" : ""})`, html: wrap({
        pre: "A new client has paid.",
        body: h("New one-on-one purchase") +
          p(`<b>${esc(name)}</b> (${esc(email)}) bought <b>${qty}</b> hour${qty > 1 ? "s" : ""}, ${((s.amount_total || 0) / 100).toFixed(2)} ${String(s.currency || "usd").toUpperCase()}.`) +
          p("They have been sent their booking links. Calendly will tell you when they book.", "; font-size:16px"),
      }) }),
      addToLists(env, email, [], { SOURCE: "one-on-one", FIRSTNAME: String(name).split(" ")[0] }),
    ]).catch((e) => console.log("book emails:", e && e.message)));

    return json(publicView(rec));
  } catch (e) {
    console.log("book error:", e && e.message);
    return json({ error: "server" }, 500);
  }
}

function publicView(rec) {
  return { name: rec.name, email: rec.email, qty: rec.qty, links: rec.links };
}

async function calendly(env, path, body) {
  const r = await fetch("https://api.calendly.com" + path, {
    method: body ? "POST" : "GET",
    headers: { Authorization: "Bearer " + env.CALENDLY_TOKEN, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error("Calendly " + path + " " + r.status + " " + (await r.text()));
  return r.json();
}

async function createLinks(env, qty) {
  const me = await calendly(env, "/users/me");
  const userUri = me.resource.uri;
  let eventUri = null, page = "/event_types?count=100&user=" + encodeURIComponent(userUri);
  while (page && !eventUri) {
    const list = await calendly(env, page);
    const hit = (list.collection || []).find((e) => e.slug === EVENT_SLUG);
    if (hit) eventUri = hit.uri;
    const next = list.pagination && list.pagination.next_page;
    page = next ? next.replace("https://api.calendly.com", "") : null;
  }
  if (!eventUri) throw new Error("Calendly event not found: " + EVENT_SLUG);
  const links = [];
  for (let i = 0; i < qty; i++) {
    const r = await calendly(env, "/scheduling_links", { max_event_count: 1, owner: eventUri, owner_type: "EventType" });
    links.push(r.resource.booking_url);
  }
  return links;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
