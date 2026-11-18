// lib/firebase-admin.js - creates Firebase sign-in, verify-email and password-reset links on the server,
// so the site can email them itself in its own design (instead of Firebase's plain emails).
// Uses the existing Cloudflare secrets FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (service account)
// and FIREBASE_AUTH_PROJECT_ID. If anything fails, the browser falls back to Firebase's own email.
import { SignJWT, importPKCS8 } from "jose";

let cached = { token: "", exp: 0 };

async function accessToken(env) {
  if (cached.token && Date.now() < cached.exp - 60000) return cached.token;
  const email = env.FIREBASE_CLIENT_EMAIL;
  const pem = String(env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n").replace(/^"|"$/g, "");
  if (!email || !pem) throw new Error("service account not set");
  const key = await importPKCS8(pem, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(email).setSubject(email).setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now).setExpirationTime(now + 3600).sign(key);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!r.ok) throw new Error("token " + r.status + " " + (await r.text()).slice(0, 200));
  const d = await r.json();
  cached = { token: d.access_token, exp: Date.now() + d.expires_in * 1000 };
  return cached.token;
}

// type: EMAIL_SIGNIN | PASSWORD_RESET | VERIFY_EMAIL. Returns the action link (string).
export async function actionLink(env, type, email, continueUrl) {
  const project = env.FIREBASE_AUTH_PROJECT_ID;
  if (!project) throw new Error("FIREBASE_AUTH_PROJECT_ID not set");
  const body = { requestType: type, email, returnOobLink: true };
  if (continueUrl) body.continueUrl = continueUrl;
  if (type === "EMAIL_SIGNIN") body.canHandleCodeInApp = true;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:sendOobCode`, {
    method: "POST",
    headers: { Authorization: "Bearer " + (await accessToken(env)), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("oob " + r.status + " " + (await r.text()).slice(0, 300));
  const d = await r.json();
  if (!d.oobLink) throw new Error("no link returned");
  return d.oobLink;
}
