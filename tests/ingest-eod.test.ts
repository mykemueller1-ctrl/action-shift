import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasHouseGmailEnv, isForbiddenName, runMorningIngest } from "../scripts/eod-lib.mjs";

const fixture = readFileSync(join("tests", "fixtures", "pdq-zreport.txt"), "utf8");

test("ingest-eod writes Subtotal + Labor Summary Total and HOLDs food", () => {
  const dir = mkdtempSync(join(tmpdir(), "eod-"));
  const out = join(dir, "last-close.json");
  const prior = {
    house: "Community Tap",
    businessDate: "9/8/2026",
    sentToManager: true,
  };
  writeFileSync(out, JSON.stringify(prior));
  const ran = spawnSync(process.execPath, ["scripts/ingest-eod.mjs", "tests/fixtures/pdq-zreport.txt"], {
    env: { ...process.env, LAST_CLOSE_PATH: out },
    encoding: "utf8",
  });
  assert.equal(ran.status, 0, ran.stderr);
  const close = JSON.parse(readFileSync(out, "utf8"));
  assert.equal(close.netSales, 3463.35);
  assert.equal(close.laborDollars, 1324.41);
  assert.equal(close.businessDate, "9/8/2026");
  assert.equal(close.food, "HOLD");
  assert.equal(close.source, "ZReport_Summary");
  assert.equal(close.sentToManager, true);
  assert.notEqual(close.netSales, 3615.83);
});

test("Void_Promo is forbidden and house Gmail env is off in git", () => {
  assert.equal(isForbiddenName("9-8-2026 Void_Promo_Report Community Pizza.pdf"), true);
  assert.equal(hasHouseGmailEnv({}), false);
  const close = runMorningIngest([
    { filename: "9-8-2026 Void_Promo_Report Community Pizza.pdf", text: fixture },
  ]);
  assert.equal(close.netSales, undefined);
  assert.match(close.error ?? "", /Z-report Summary/i);
});
