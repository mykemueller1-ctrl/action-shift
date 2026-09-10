/**
 * 8:05 AM America/Chicago job.
 * Reads dropped / fetched ZReport_Summary text or PDF. Writes docs/last-close.json.
 * Does not mail Kenzy. Does not parse Void_Promo. Does not invent fixture dollars.
 *
 *   npx tsx scripts/morning-ingest.ts path/to/ZReport_Summary.pdf
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runMorningIngest, serializeLastClose } from "../lib/ingest";
import { readDroppedReport } from "./eod-lib.mjs";

const outPath = resolve("docs/last-close.json");
const args = process.argv.slice(2);
if (!args.length) {
  console.error(
    "Need the Z-report Summary PDF (Labor Summary + Subtotal). Drop the file or type the two numbers. Photos do not parse.",
  );
  process.exitCode = 1;
} else {
  const files = args.map((p) => readDroppedReport(p, readFileSync));
  const close = runMorningIngest(files);
  writeFileSync(outPath, serializeLastClose(close));
  if (close.error) {
    console.error(close.error);
    process.exitCode = 1;
  } else {
    console.log(
      `Wrote ${outPath} net=${close.netSales} labor=${close.laborDollars} food=${close.food} sent=${close.sentToManager}`,
    );
  }
}
