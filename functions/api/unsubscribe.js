// functions/api/unsubscribe.js - one-click unsubscribe from marketing emails (the link in the follow-up emails).
// GET /api/unsubscribe?e=<email>&t=<token>
// Stops all follow-up emails for that address and unsubscribes it from Brevo marketing emails.
import { unsubToken, unsubKey } from "../../lib/followups.js";

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const email = String(u.searchParams.get("e") || "").trim().toLowerCase();
  const t = String(u.searchParams.get("t") || "");
  if (!email || t !== (await unsubToken(env, email))) return page("This unsubscribe link is not valid. Please contact jeff@capitalistbuddha.ca.");
  await env.COURSE_VIDEOS.put(await unsubKey(email), JSON.stringify({ email, at: Date.now() }));
  const key = env.BREVO_CONTACTS_KEY || env["Brevo API Key"];
  if (key) {
    await fetch("https://api.brevo.com/v3/contacts/" + encodeURIComponent(email), {
      method: "PUT",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ emailBlacklisted: true }),
    }).catch(() => {});
  }
  return page("You have been unsubscribed. You will not receive any more of these emails.");
}

function page(msg) {
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe | Capitalist Buddha</title><meta name="robots" content="noindex"></head>
<body style="margin:0;background:#f7f2ee;font-family:Georgia,serif;color:#2f2a2c"><div style="max-width:520px;margin:12vh auto;padding:30px;background:#fff;border-radius:16px;text-align:center">
<p style="font-size:19px;line-height:1.6">${msg}</p><p><a href="https://capitalistbuddha.ca" style="color:#3d696a">Back to capitalistbuddha.ca</a></p></div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } });
}
