// functions/api/followups/run.js - sends the follow-up emails that are due.
// Called once a day by GitHub (.github/workflows/followups.yml) with the FOLLOWUP_SECRET.
import { runDue } from "../../../lib/followups.js";

export async function onRequestPost({ request, env }) {
  // All spaces and line breaks are ignored, so a long password pasted with a line break still matches.
  const expected = String(env.FOLLOWUP_SECRET || "").replace(/\s+/g, "");
  if (!expected) return new Response("Not configured: FOLLOWUP_SECRET is not available to the live site", { status: 503 });
  const given = String(request.headers.get("x-run-secret") || "").replace(/\s+/g, "");
  if (!given) return new Response("Forbidden: no secret was sent (check the GitHub secret)", { status: 403 });
  if (given !== expected) return new Response(`Forbidden: secrets do not match (GitHub ${given.length} characters, Cloudflare ${expected.length} characters)`, { status: 403 });
  const sum = await runDue(env);
  return new Response(JSON.stringify(sum), { headers: { "content-type": "application/json" } });
}
