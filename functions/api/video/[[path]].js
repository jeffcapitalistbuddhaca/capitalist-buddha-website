// functions/api/video/[[path]].js
// Streams a course video from the private R2 bucket ONLY to:
//   (a) a logged-in, email-verified Firebase user whose email has a paid
//       Stripe Checkout Session from the last ACCESS_DAYS days, or
//   (b) a partner whose email is on the GUEST_EMAILS list.
// URL: /api/video/<file name in R2>?token=<Firebase ID token>

import { jwtVerify, importX509 } from "jose";

// Course access length after purchase (6 months, same as the website text).
const ACCESS_DAYS = 180;

// Google's public certificates for Firebase ID tokens (from Firebase's
// "Verify ID tokens using a third-party JWT library" instructions).
const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export async function onRequestGet(context) {
  const { request, env } = context;

  // ---- 1. Get the Firebase ID token from the address (?token=...) ----
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Please log in to watch this video.", { status: 401 });
  }

  // ---- 2. Check the token is genuine and current ----
  let user;
  try {
    user = await verifyFirebaseIdToken(token, env.FIREBASE_AUTH_PROJECT_ID);
  } catch (err) {
    return new Response("Your login has expired. Please refresh the page.", { status: 401 });
  }

  if (!user.email) {
    return new Response("This account has no email address.", { status: 403 });
  }

  // ---- Status check used by the Free module tab: /api/video/_status ----
  if (url.pathname === "/api/video/_status") {
    let paid = isGuestEmail(user.email, env.GUEST_EMAILS);
    if (!paid && user.email_verified === true) {
      try { paid = await hasActivePurchase(user.email, env.STRIPE_RESTRICTED_KEY); } catch (e) { paid = false; }
    }
    const free = paid ? null : await freeAccess(user.email, env);
    return new Response(JSON.stringify({
      paid,
      free: !!(free && free.ok),
      daysLeft: free ? free.daysLeft : 0,
    }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  // ---- 3. Partner guest list (GUEST_EMAILS variable in Cloudflare) ----
  // Emails on this list skip steps 4 and 5. Only add an email AFTER you have
  // created that account yourself in the Firebase console.
  const isGuest = isGuestEmail(user.email, env.GUEST_EMAILS);
  if (!isGuest) {
    // ---- 4. Require a verified email address ----
    if (user.email_verified !== true) {
      return new Response("Please verify your email address first (check your inbox).", { status: 403 });
    }

    // ---- 5. Check Stripe for a paid purchase in the last ACCESS_DAYS days ----
    let paid;
    try {
      paid = await hasActivePurchase(user.email, env.STRIPE_RESTRICTED_KEY);
    } catch (err) {
      return new Response("Could not confirm your purchase. Please try again.", { status: 502 });
    }

    if (!paid) {
      // Free trial: Module 7 only, for 30 days from sign-up
      let requested = "";
      try {
        requested = url.pathname.slice("/api/video/".length).split("/").map(decodeURIComponent).join("/");
      } catch (e) { requested = ""; }
      const free = await freeAccess(user.email, env);
      if (!(free.ok && requested.startsWith(FREE_MODULE_FOLDER + "/"))) {
        return new Response("No active purchase found for this email address.", { status: 403 });
      }
    }
  }

  // ---- 6. Read the video from R2 (supports partial "Range" requests) ----
  // The file name is taken from the address exactly as R2 stores it
  // (spaces and other characters are decoded back to the original name).
  const prefix = "/api/video/";
  let key = "";
  try {
    key = url.pathname.startsWith(prefix)
      ? url.pathname
          .slice(prefix.length)
          .split("/")
          .map(decodeURIComponent)
          .join("/")
      : "";
  } catch (err) {
    return new Response("Bad video name.", { status: 400 });
  }

  if (!key) {
    return new Response("No video name given.", { status: 400 });
  }

  let object;
  try {
    object = await env.COURSE_VIDEOS.get(key, { range: request.headers });
  } catch (err) {
    return new Response("Invalid range request.", { status: 416 });
  }

  if (object === null) {
    return new Response("Video not found.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers); // copies the stored Content-Type etc.
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes"); // (web standard) lets players skip ahead
  headers.set("cache-control", "private, no-store"); // don't let shared caches keep paid videos

  if (!headers.has("content-type")) {
    headers.set(
      "content-type",
      key.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4"
    );
  }

  // If the player asked for part of the file, answer "206 Partial Content"
  // with a Content-Range header (web standard, RFC 9110).
  if (request.headers.has("range") && object.range) {
    const r = object.range;
    let start;
    let end;
    if (typeof r.suffix === "number") {
      start = Math.max(object.size - r.suffix, 0);
      end = object.size - 1;
    } else {
      start = typeof r.offset === "number" ? r.offset : 0;
      end = typeof r.length === "number" ? start + r.length - 1 : object.size - 1;
    }
    end = Math.min(end, object.size - 1);
    headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { status: 200, headers });
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

// Returns true if the email is in the comma-separated GUEST_EMAILS list.
// Not case-sensitive; spaces around commas are ignored.
function isGuestEmail(email, guestList) {
  if (!guestList) return false;
  const wanted = email.trim().toLowerCase();
  return guestList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
    .includes(wanted);
}

// Returns true if Stripe has a completed, paid Checkout Session for this
// email created in the last ACCESS_DAYS days. The email comparison ignores
// capital letters, so "Jane@Example.com" at checkout matches "jane@example.com".
async function hasActivePurchase(email, stripeKey) {
  if (!stripeKey) throw new Error("STRIPE_RESTRICTED_KEY is not set");
  const wanted = email.trim().toLowerCase();
  const cutoff = Math.floor(Date.now() / 1000) - ACCESS_DAYS * 24 * 60 * 60;

  let startingAfter = null;
  // Up to 10 pages of 100 = the last 1,000 completed checkouts.
  for (let page = 0; page < 10; page++) {
    const url = new URL("https://api.stripe.com/v1/checkout/sessions");
    url.searchParams.set("status", "complete");
    url.searchParams.set("created[gte]", String(cutoff));
    url.searchParams.set("limit", "100");
    if (startingAfter) url.searchParams.set("starting_after", startingAfter);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });

    if (!res.ok) throw new Error(`Stripe returned ${res.status}`);
    const list = await res.json();
    const sessions = Array.isArray(list.data) ? list.data : [];

    const found = sessions.some(
      (s) =>
        s.payment_status === "paid" &&
        typeof s.created === "number" &&
        s.created >= cutoff &&
        ((s.customer_details && s.customer_details.email) || "").trim().toLowerCase() === wanted
    );

    if (found) return true;
    if (!list.has_more || sessions.length === 0) return false;
    startingAfter = sessions[sessions.length - 1].id;
  }

  return false;
}

// ---- Free module (Module 7) for 30 days after sign-up ----
const FREE_MODULE_FOLDER = "Module 7. Finding your passion";
const FREE_DAYS = 30;

async function freeAccess(email, env) {
  try {
    const bytes = new TextEncoder().encode(String(email).trim().toLowerCase());
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const obj = await env.COURSE_VIDEOS.get(`_free-access/${hex}.json`);
    if (!obj) return { ok: false, daysLeft: 0 };
    const rec = await obj.json();
    const used = (Date.now() - Date.parse(rec.started)) / 86400000;
    const daysLeft = Math.max(0, Math.ceil(FREE_DAYS - used));
    return { ok: daysLeft > 0, daysLeft };
  } catch (e) {
    return { ok: false, daysLeft: 0 };
  }
}
