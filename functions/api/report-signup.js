// functions/api/report-signup.js
// Called by report.html AFTER the reader has confirmed their email (clicked the sign-in link).
// Checks the Firebase ID token, then adds the verified email to the Brevo list REPORT_LIST_ID.
// Body (JSON): { token, consent: true, source }

import { addToLists } from "../../lib/email.js";
import { jwtVerify, importX509 } from "jose";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export async function onRequestPost(context) {
  const { request, env } = context;
  let data;
  try { data = await request.json(); } catch (_) { return json({ ok: false }, 400); }
  if (data.consent !== true) return json({ ok: false, error: "consent" }, 400);

  let user;
  try {
    user = await verifyFirebaseIdToken(String(data.token || ""), env.FIREBASE_AUTH_PROJECT_ID);
  } catch (_) { return json({ ok: false, error: "token" }, 401); }
  if (!user.email || user.email_verified !== true) return json({ ok: false, error: "unverified" }, 403);

  const email = String(user.email).trim().toLowerCase();
  const source = String(data.source || "direct").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "direct";
  const brevoKey = env.BREVO_CONTACTS_KEY || env["Brevo API Key"];

  if (brevoKey && env.REPORT_LIST_ID) {
    const headers = { "api-key": brevoKey, "content-type": "application/json", accept: "application/json" };
    const listId = Number(env.REPORT_LIST_ID);
    try {
      await addToLists(env, email, [listId], { SOURCE: source }); // also adds to the Newsletter list
    } catch (e) {
      console.log("Brevo error:", e && e.message); // never block the sign-up
    }
  } else {
    console.log("Report signup: Brevo key or REPORT_LIST_ID missing");
  }
  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

// Verifies a Firebase ID token following Firebase's published rules:
// alg RS256, kid matches a Google certificate, aud = project ID,
// iss = https://securetoken.google.com/<projectId>, exp in the future,
// iat and auth_time in the past, sub non-empty.
async function verifyFirebaseIdToken(token, projectId) {
  if (!projectId) throw new Error("FIREBASE_AUTH_PROJECT_ID is not set");

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error("Could not download Google certificates");
  const certs = await res.json(); // { "<key id>": "<x509 certificate>" }

  const { payload } = await jwtVerify(
    token,
    async (header) => {
      const pem = certs[header.kid];
      if (!pem) throw new Error("Unknown key id");
      return importX509(pem, "RS256");
    },
    {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    }
  );

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("Token expired");
  if (typeof payload.iat !== "number" || payload.iat > now) throw new Error("Bad iat");
  if (typeof payload.auth_time !== "number" || payload.auth_time > now) throw new Error("Bad auth_time");
  if (typeof payload.sub !== "string" || payload.sub.length === 0) throw new Error("Bad sub");
  return payload;
}

