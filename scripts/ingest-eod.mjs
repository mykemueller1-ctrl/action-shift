/**
 * Packet 3 — write docs/last-close.json from ZReport_Summary text or PDF.
 *   node scripts/ingest-eod.mjs [files...]
 *   npm run ingest -- path/to/ZReport_Summary.pdf
 * After 6 AM America/Chicago, Grok/Cursor runs this. Does not mail Kenzy.
 * House Gmail tokens stay in Netlify env, never in git.
 * No file and no house Gmail → do not write fixture dollars.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  hasHouseGmailEnv,
  fetchHouseEodFiles,
  runMorningIngest,
  readDroppedReport,
} from "./eod-lib.mjs";

const outPath = process.env.LAST_CLOSE_PATH || resolve("docs/last-close.json");
const prior = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : null;

let files = process.argv.slice(2).map((p) => readDroppedReport(p, readFileSync));

if (!files.length && hasHouseGmailEnv()) {
  const fetched = await fetchHouseEodFiles();
  if (fetched.files?.length) files = fetched.files;
  else if (fetched.error && !prior?.netSales) {
    writeFileSync(outPath, `${JSON.stringify({ ...fetched, food: "HOLD", sentToManager: false }, null, 2)}\n`);
    console.error(fetched.error);
    process.exitCode = 1;
    process.exit();
  }
}

if (!files.length) {
  console.error(
    "Need the Z-report Summary PDF (Labor Summary + Subtotal). House Gmail env is not set. Drop the file or type the two numbers. Photos do not parse.",
  );
  process.exitCode = 1;
  process.exit();
}

const close = runMorningIngest(files, prior);
writeFileSync(outPath, `${JSON.stringify(close, null, 2)}\n`);
if (close.error) {
  console.error(close.error);
  process.exitCode = 1;
} else {
  console.log(
    `Wrote ${outPath} net=${close.netSales} labor=${close.laborDollars} food=${close.food} sent=${close.sentToManager}`,
  );
}
