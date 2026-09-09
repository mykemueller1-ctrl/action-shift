import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CTAP_INGEST,
  ingestFromZText,
  isOwnerSeatForbidden,
  pickZReportSummary,
} from "../lib/ingest";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test("8:05 job reads ZReport_Summary only and HOLDs food", () => {
  const text = readFileSync(join(fixtures, "pdq-zreport.txt"), "utf8");
  const files = [
    { filename: "9-8-2026 ZReport_Summary Community Pizza.pdf", text },
    { filename: "9-8-2026 Void_Promo_Report Community Pizza.pdf" },
    { filename: "9-8-2026 Hourly_Sales_Report Community Pizza.pdf" },
  ];
  const picked = pickZReportSummary(files);
  assert.equal(picked?.filename.includes("ZReport_Summary"), true);
  assert.equal(isOwnerSeatForbidden("9-8-2026 Void_Promo_Report Community Pizza.pdf"), true);
  const out = ingestFromZText(picked!.text!);
  assert.equal(out.parsed?.netSales, 3463.35);
  assert.equal(out.parsed?.laborDollars, 1324.41);
  assert.equal(out.close?.verdict, "MOVE");
  assert.equal(out.close?.foodLabel, "Food is MISSING");
  assert.equal(CTAP_INGEST.laborTargetPct, 28);
  assert.equal(CTAP_INGEST.manager, "Kenzy");
  assert.doesNotMatch(out.close?.sendText ?? "", /schedule/i);
});
