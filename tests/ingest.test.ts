import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CTAP_INGEST,
  deskPrefillFromLastClose,
  fetchMorningClose,
  ingestFromZText,
  isAfterRunTime,
  isCtapEodSubject,
  isLastNight,
  isOwnerSeatForbidden,
  morningGmailQuery,
  parseLastClose,
  pickZReportSummary,
  runMorningIngest,
  shouldPrefillDesk,
} from "../lib/ingest";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const zText = readFileSync(join(fixtures, "pdq-zreport.txt"), "utf8");
const eodFiles = [
  { filename: "9-8-2026 ZReport_Summary Community Pizza.pdf", text: zText },
  { filename: "9-8-2026 Void_Promo_Report Community Pizza.pdf" },
  { filename: "9-8-2026 Hourly_Sales_Report Community Pizza.pdf" },
];

/** 9 Sep 2026 8:10 AM America/Chicago (CDT = UTC-5) */
const after805 = new Date("2026-09-09T13:10:00Z");
/** 9 Sep 2026 7:50 AM America/Chicago */
const before805 = new Date("2026-09-09T12:50:00Z");
const nextMorning = new Date("2026-09-10T13:10:00Z");

test("8:05 job reads ZReport_Summary only and HOLDs food", () => {
  const picked = pickZReportSummary(eodFiles);
  assert.equal(picked?.filename.includes("ZReport_Summary"), true);
  assert.equal(isOwnerSeatForbidden("9-8-2026 Void_Promo_Report Community Pizza.pdf"), true);
  assert.equal(isOwnerSeatForbidden("9-8-2026 Hourly_Sales_Report Community Pizza.pdf"), true);
  const out = ingestFromZText(picked!.text!);
  assert.equal(out.parsed?.netSales, 3463.35);
  assert.equal(out.parsed?.laborDollars, 1324.41);
  assert.equal(out.close?.verdict, "MOVE");
  assert.equal(out.close?.foodLabel, "Food is MISSING");
  assert.equal(CTAP_INGEST.laborTargetPct, 28);
  assert.equal(CTAP_INGEST.manager, "Kenzy");
  assert.doesNotMatch(out.close?.sendText ?? "", /schedule/i);
});

test("morning Gmail query is house-inbox EOD, not owner login", () => {
  assert.equal(morningGmailQuery(), "from:pdqreports@pdqpos.com newer_than:1d subject:EOD");
  assert.equal(
    isCtapEodSubject("EOD Reports Generated From Community Pizza 515-955-8202 9/9/2026 6:00:33 AM"),
    true,
  );
  assert.equal(CTAP_INGEST.houseInbox, "communitypizza2026@gmail.com");
});

test("runMorningIngest writes last-close net+labor and never food or send", () => {
  const close = runMorningIngest(eodFiles, after805);
  assert.equal(close.netSales, 3463.35);
  assert.equal(close.laborDollars, 1324.41);
  assert.equal(close.businessDate, "9/8/2026");
  assert.equal(close.food, "HOLD");
  assert.equal(close.source, "ZReport_Summary");
  assert.equal(close.sentToManager, false);
  assert.equal(close.house, "Community Tap");
  assert.equal(close.manager, "Kenzy");
  assert.equal(close.laborTargetPct, 28);
  const prefill = deskPrefillFromLastClose(close);
  assert.equal(prefill.netSales, 3463.35);
  assert.equal(prefill.laborDollars, 1324.41);
  assert.equal(prefill.foodFilled, false);
  assert.equal(prefill.sentToManager, false);
});

test("Void_Promo and Hourly alone do not fill the desk", () => {
  const close = runMorningIngest([
    { filename: "9-8-2026 Void_Promo_Report Community Pizza.pdf", text: "void names" },
    { filename: "9-8-2026 Hourly_Sales_Report Community Pizza.pdf", text: "hourly" },
  ]);
  assert.equal(close.netSales, undefined);
  assert.equal(close.laborDollars, undefined);
  assert.match(close.error ?? "", /Z-report Summary/i);
  assert.equal(close.food, "HOLD");
});

test("unreadable Z-report leaves net+labor blank", () => {
  const close = runMorningIngest([
    { filename: "9-8-2026 ZReport_Summary Community Pizza.pdf", text: "" },
  ]);
  assert.equal(close.netSales, undefined);
  assert.match(close.error ?? "", /Type the two numbers/i);
  assert.match(close.error ?? "", /Photos do not parse/i);
});

test("desk prefills last night after 8:05 Chicago and ignores stale closes", () => {
  const close = runMorningIngest(eodFiles, after805);
  assert.equal(isAfterRunTime(after805), true);
  assert.equal(isAfterRunTime(before805), false);
  assert.equal(isLastNight("9/8/2026", after805), true);
  assert.equal(isLastNight("9/8/2026", nextMorning), false);
  assert.equal(shouldPrefillDesk(close, after805), true);
  assert.equal(shouldPrefillDesk(close, before805), false);
  assert.equal(shouldPrefillDesk(close, before805, true), true);
  assert.equal(shouldPrefillDesk(close, nextMorning), false);
  assert.equal(shouldPrefillDesk(parseLastClose({ food: "COUNTED", netSales: 10 }), after805), false);
});

test("desk HTML money scrape regex is valid so Close can bind", () => {
  const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "index.html"), "utf8");
  const literal = html.match(/matchAll\((\/.*?\/g)\)/);
  assert.ok(literal, "desk still scrapes pasted dollars");
  assert.doesNotThrow(() => eval(literal![1]));
  assert.doesNotMatch(html, /matchAll\(\/\\\\\$\?/);
});

test("fetchMorningClose reads last-close JSON and still HOLDs food", async () => {
  const written = runMorningIngest(eodFiles, after805);
  const fetched = await fetchMorningClose({ lastCloseJson: JSON.stringify(written), now: after805 });
  assert.equal(fetched.netSales, 3463.35);
  assert.equal(fetched.laborDollars, 1324.41);
  assert.equal(fetched.food, "HOLD");
  assert.equal(fetched.sentToManager, false);
  const filesFetched = await fetchMorningClose({ files: eodFiles, now: after805 });
  assert.equal(filesFetched.netSales, 3463.35);
});
