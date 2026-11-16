// functions/api/report/[[path]].js
// Serves the industry report slides from the private R2 bucket ONLY to a
// logged-in Firebase user with a VERIFIED email address.
// URL: /api/report/slide-01.webp?token=<Firebase ID token>
// Slides live in R2 under the folder "Industry Report/" (slide-01.webp ... slide-69.webp).

import { jwtVerify, importX509 } from "jose";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const R2_FOLDER = "Industry Report/";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const name = url.pathname.replace(/^\/api\/report\//, "");
  if (!/^slide-\d{2}\.webp$/.test(name)) {
    return new Response("Not found.", { status: 404 });
  }

  const token = url.searchParams.get("token");
  if (!token) return new Response("Please sign in to view the report.", { status: 401 });

  let user;
  try {
    user = await verifyFirebaseIdToken(token, env.FIREBASE_AUTH_PROJECT_ID);
  } catch (err) {
    return new Response("Your sign-in has expired. Please refresh the page.", { status: 401 });
  }
  if (!user.email || user.email_verified !== true) {
    return new Response("Please confirm your email first (check your inbox).", { status: 403 });
  }

  const object = await env.COURSE_VIDEOS.get(R2_FOLDER + name);
  if (object === null) return new Response("Slide not found.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-type", "image/webp");
  headers.set("cache-control", "private, max-age=3600");
  headers.set("x-robots-tag", "noindex");
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

