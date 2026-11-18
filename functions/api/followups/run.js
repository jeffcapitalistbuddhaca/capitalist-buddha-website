// functions/api/followups/run.js - sends the follow-up emails that are due.
// Called once a day by GitHub (.github/workflows/followups.yml) with the FOLLOWUP_SECRET.
import { runDue } from "../../../lib/followups.js";

export async function onRequestPost({ request, env }) {
  if (!env.FOLLOWUP_SECRET || request.headers.get("x-run-secret") !== env.FOLLOWUP_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  const sum = await runDue(env);
  return new Response(JSON.stringify(sum), { headers: { "content-type": "application/json" } });
}
