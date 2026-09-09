/**
 * Packet 3 — write docs/last-close.json from ZReport_Summary text.
 *   node scripts/ingest-eod.mjs [files...]
 *   npm run ingest
 * After 6 AM America/Chicago, Grok/Cursor runs this. Does not mail Kenzy.
 * House Gmail tokens stay in Netlify env, never in git.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { hasHouseGmailEnv, fetchHouseEodFiles, runMorningIngest } from "./eod-lib.mjs";

const outPath = process.env.LAST_CLOSE_PATH || resolve("docs/last-close.json");
const prior = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : null;

let files = process.argv.slice(2).map((p) => ({
  filename: basename(p),
  text: readFileSync(p, "utf8"),
}));

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
  files = [
    {
      filename: "ZReport_Summary Community Pizza.txt",
      text: readFileSync(resolve("tests/fixtures/pdq-zreport.txt"), "utf8"),
    },
  ];
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
