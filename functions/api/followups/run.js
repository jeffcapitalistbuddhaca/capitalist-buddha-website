// functions/api/followups/run.js - sends the follow-up emails that are due.
// Called once a day by GitHub (.github/workflows/followups.yml) with the FOLLOWUP_PASS password.
// Spaces, line breaks and quote marks around the password are ignored. The password itself is never shown.
import { runDue } from "../../../lib/followups.js";

const clean = (v) => String(v || "").replace(/\s+/g, "").replace(/^["']+|["']+$/g, "");

export async function onRequestPost({ request, env }) {
  const expected = clean(env.FOLLOWUP_PASS);
  if (!expected) return new Response("Not configured: FOLLOWUP_PASS is not available to the live site", { status: 503 });
  const given = clean(request.headers.get("x-run-secret"));
  if (!given) return new Response("Forbidden: no password was sent (check the GitHub secret FOLLOWUP_PASS)", { status: 403 });
  if (given !== expected) return new Response(`Forbidden: passwords do not match (GitHub ${given.length} characters, Cloudflare ${expected.length} characters)`, { status: 403 });
  const sum = await runDue(env);
  return new Response(JSON.stringify(sum), { headers: { "content-type": "application/json" } });
}
