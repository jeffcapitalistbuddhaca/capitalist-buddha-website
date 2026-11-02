// functions/api/contact.js
// Receives the "Contact Us" form and emails it to Jeff through Brevo.
// POST /api/contact  with JSON: { name, email, message, website }
//   "website" is a hidden trap field: real people leave it empty, spam bots fill it.
//
// Cloudflare settings this file uses (Settings > Variables and secrets, Production):
//   "Brevo API Key"       (already exists)  - Brevo API key
//   CONTACT_SENDER_EMAIL  (new, Text)       - a VERIFIED sender address in Brevo

const CONTACT_TO_EMAIL = "jeff@capitalistbuddha.ca"; // where messages are delivered
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Removes line breaks and trims, for short one-line fields (name, email).
function oneLine(value, maxLength) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, maxLength);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  // Spam trap: if the hidden field is filled in, pretend it worked and send nothing.
  if (data && typeof data.website === "string" && data.website.trim() !== "") {
    return json({ ok: true }, 200);
  }

  const name = oneLine(data && data.name, 100);
  const email = oneLine(data && data.email, 200);
  const message = String((data && data.message) || "").trim().slice(0, 5000);

  if (!name || !email || !message) {
    return json({ ok: false, error: "Please fill in your name, email and message." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const apiKey = env["Brevo API Key"];
  const senderEmail = env.CONTACT_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.error("Contact form: Brevo API Key or CONTACT_SENDER_EMAIL is not set");
    return json({ ok: false, error: "The contact form is not available right now." }, 500);
  }

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "Capitalist Buddha website", email: senderEmail },
      to: [{ email: CONTACT_TO_EMAIL, name: "Jeff" }],
      replyTo: { email: email, name: name },
      subject: `Website contact form: ${name}`,
      textContent:
        `New message from the Contact Us form on capitalistbuddha.ca\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n\n` +
        `(Click Reply to answer ${name} directly.)`,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch (err) { /* ignore */ }
    console.error("Brevo send failed:", res.status, detail);
    return json({ ok: false, error: "Sorry, your message could not be sent." }, 502);
  }

  return json({ ok: true }, 200);
}
