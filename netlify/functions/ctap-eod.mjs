import { hasHouseGmailEnv, fetchHouseEodFiles, runMorningIngest, blankClose } from "../../scripts/eod-lib.mjs";

/** 8:05 AM America/Chicago ≈ 13:05 UTC CDT / 14:05 UTC CST. Tokens from Netlify env only. */
export const config = { schedule: "5 13,14 * * *" };

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export default async function handler() {
  if (!hasHouseGmailEnv()) {
    return json(200, blankClose("House Gmail env is not set. Drop the Z-report or run npm run ingest. Photos do not parse."));
  }
  const fetched = await fetchHouseEodFiles();
  if (!fetched.files?.length) {
    return json(200, blankClose(fetched.error || "Need Subtotal and Labor Summary Total. Photos do not parse. Type the two numbers."));
  }
  const close = runMorningIngest(fetched.files);
  return json(close.error ? 200 : 200, close);
}
