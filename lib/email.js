// lib/email.js - the branded HTML email template and Brevo helpers, shared by the site's functions.
// Every email the site sends goes through wrap(), so they all look the same.

export const SITE = "https://capitalistbuddha.ca";
export const NEWSLETTER_LIST_ID = 7; // Brevo list "Newsletter": everyone who signs up or buys

const F_BODY = "'Crimson Pro', Georgia, 'Times New Roman', serif";
const F_HEAD = "'Playfair Display', Georgia, 'Times New Roman', serif";

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export const p = (t, extra = "") => `<p style="margin:0 0 14px;font-family:${F_BODY};font-size:18px;line-height:1.6;color:#2f2a2c${extra}">${t}</p>`;
export const h = (t) => `<h1 style="margin:0 0 14px;font-family:${F_HEAD};font-size:26px;line-height:1.25;color:#967ca0;font-weight:600">${t}</h1>`;
export const ul = (items) => `<ul style="margin:0 0 14px;padding-left:22px">` + items.map((i) => `<li style="margin:0 0 6px;font-family:${F_BODY};font-size:18px;line-height:1.5;color:#2f2a2c">${i}</li>`).join("") + `</ul>`;
export const box = (title, body) => `<div style="background:#f4ecf1;border-radius:14px;padding:18px 20px;margin:18px 0"><div style="font-family:${F_HEAD};color:#3d696a;font-size:20px;margin:0 0 8px">${title}</div>${body}</div>`;
export const btn = (label, url) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto"><tr><td style="background:#c9a46a;border-radius:999px"><a href="${url}" style="display:inline-block;padding:13px 30px;font-family:${F_BODY};font-size:18px;font-weight:bold;color:#2f2a2c;text-decoration:none">${label}</a></td></tr></table>`;
export const bandBox = (label, value) => `<div style="background:#967ca0;border-radius:14px;padding:20px;text-align:center;margin:0 0 16px"><div style="font-family:Georgia,serif;font-size:12px;letter-spacing:2px;color:#ffffff;text-transform:uppercase">${label}</div><div style="font-family:${F_HEAD};font-size:30px;color:#ffffff;margin-top:4px">${value}</div></div>`;
export const SIGN = p("Regards,<br>Dr. Jeffrey Overall");
export const hello = (name) => p(name ? `Hi ${esc(String(name).split(" ")[0])},` : "Hi there,");

const icon = (file, url, alt) => `<a href="${url}" style="display:inline-block;margin:0 6px"><img src="${SITE}/images/email/${file}" width="32" height="32" alt="${alt}" style="display:block;border:0"></a>`;

// pre: preview text; body: inner HTML; foot: optional small print; unsubscribe: optional URL (marketing emails)
export function wrap({ pre = "", body, foot = "", unsubscribe = "" }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=Playfair+Display:wght@600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f7f2ee">
<div style="display:none;max-height:0;overflow:hidden">${esc(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f2ee"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td align="center" style="background:#967ca0;padding:22px 20px 18px"><img src="${SITE}/images/email/emblem.png" width="80" height="120" alt="Capitalist Buddha" style="display:block;border:0"></td></tr>
<tr><td style="padding:30px 34px 22px">${body}${foot ? `<p style="margin:14px 0 0;font-family:${F_BODY};font-size:14px;line-height:1.5;color:#6d5a6a">${foot}</p>` : ""}</td></tr>
<tr><td align="center" style="background:#f4ecf1;padding:18px 24px;font-family:${F_BODY};font-size:13px;line-height:1.6;color:#6d5a6a">
Dr. Jeffrey Overall &middot; The Professor Inc.<br><a href="${SITE}" style="color:#3d696a">capitalistbuddha.ca</a>
<div style="margin:10px 0 8px">${icon("tiktok.png", "https://www.tiktok.com/@dr.jeffreyoverall", "TikTok")}${icon("instagram.png", "https://www.instagram.com/dr.jeffreyoverall", "Instagram")}${icon("linkedin.png", "https://www.linkedin.com/in/dr-jeffrey-overall-47a99b124/", "LinkedIn")}${icon("scholar.png", "https://scholar.google.com/citations?user=VmGJH40AAAAJ&hl=en", "Google Scholar")}</div>
<a href="${SITE}/privacy.html" style="color:#6d5a6a">Privacy policy</a>${unsubscribe ? `<br>You are receiving this because you signed up at capitalistbuddha.ca. <a href="${unsubscribe}" style="color:#6d5a6a">Unsubscribe</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

// Sends one email through Brevo. Uses the existing "Brevo API Key" and CONTACT_SENDER_EMAIL settings.
export async function sendEmail(env, { to, name, subject, html, text, replyTo, senderName = "Dr. Jeffrey Overall" }) {
  const key = env["Brevo API Key"], sender = env.CONTACT_SENDER_EMAIL;
  if (!key || !sender || !to) { console.log("sendEmail: missing Brevo key, sender or recipient"); return false; }
  const body = { sender: { name: senderName, email: sender }, to: [{ email: to, name: name || to }], subject, htmlContent: html };
  if (text) body.textContent = text;
  if (replyTo) body.replyTo = replyTo;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) console.log("Brevo email:", r.status, await r.text());
  return r.ok;
}

// Adds (or updates) a contact and puts them on the given Brevo lists, always including the Newsletter list.
export async function addToLists(env, email, listIds, attributes = {}) {
  const key = env.BREVO_CONTACTS_KEY || env["Brevo API Key"];
  if (!key || !email) return;
  const ids = [...new Set([...(listIds || []).filter(Boolean).map(Number), NEWSLETTER_LIST_ID])];
  const headers = { "api-key": key, "content-type": "application/json", accept: "application/json" };
  const create = (attrs) => fetch("https://api.brevo.com/v3/contacts", { method: "POST", headers, body: JSON.stringify({ email, listIds: ids, updateEnabled: true, attributes: attrs }) });
  let r = await create(attributes);
  if (!r.ok) {
    console.log("Brevo contact:", r.status, await r.text());
    r = await create({ SOURCE: attributes.SOURCE || "website" }); // e.g. a custom field missing in Brevo
  }
  // Existing contacts: make sure they are on every list
  for (const id of ids) {
    await fetch(`https://api.brevo.com/v3/contacts/lists/${id}/contacts/add`, { method: "POST", headers, body: JSON.stringify({ emails: [email] }) });
  }
}
