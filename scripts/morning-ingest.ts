/**
 * 8:05 AM America/Chicago job.
 * Reads dropped / fetched ZReport_Summary text. Writes docs/last-close.json.
 * Does not mail Kenzy. Does not parse Void_Promo.
 *
 *   npx tsx scripts/morning-ingest.ts [files...]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { runMorningIngest, serializeLastClose, type MailFile } from "../lib/ingest";

const outPath = resolve("docs/last-close.json");
const args = process.argv.slice(2);
const files: MailFile[] = args.length
  ? args.map((p) => ({
      filename: basename(p),
      text: readFileSync(p, "utf8"),
    }))
  : [
      {
        filename: "ZReport_Summary Community Pizza.txt",
        text: readFileSync(resolve("tests/fixtures/pdq-zreport.txt"), "utf8"),
      },
    ];

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
