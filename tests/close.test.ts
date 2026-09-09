import assert from "node:assert/strict";
import test from "node:test";
import { closeNight } from "../lib/close";
import { mergeCsvFiles, parseToastCsv } from "../lib/csv";
import { scrapePdqZReport, scrapeTotals } from "../lib/parse";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test("Grill lab night: 35.56% and about $189 heavy vs 30%", () => {
  const paste = scrapeTotals("Net $3,408.15 Labor $1,211.85");
  assert.equal(paste.netSales, 3408.15);
  assert.equal(paste.laborDollars, 1211.85);

  const result = closeNight({
    store: "Same Grill",
    netSales: 3408.15,
    laborDollars: 1211.85,
    laborTargetPct: 30,
    managerName: "Kenzy",
    hasFoodEvidence: false,
  });

  assert.equal(result.laborPct.toFixed(2), "35.56");
  assert.equal(Math.round(result.heavyDollars), 189);
  assert.match(result.heavyLine, /\$189/);
  assert.match(result.heavyLine, /30%/);
  assert.equal(result.verdict, "MOVE");
  assert.equal(result.totalsLabel, "Typed totals");
  assert.equal(result.foodLabel, "Food is MISSING");
  assert.match(result.hold, /HOLD food cost/i);
  assert.doesNotMatch(result.sendText, /schedule/i);
  assert.doesNotMatch(result.move, /schedule/i);
  assert.match(result.sendText, /\$1,211\.85 on \$3,408\.15/);
});

test("PDQ Z-report uses Subtotal as net and Labor Summary Total, not Grand Total", () => {
  const text = readFileSync(join(fixtures, "pdq-zreport.txt"), "utf8");
  const z = scrapePdqZReport(text);
  assert.equal(z?.netSales, 3463.35);
  assert.equal(z?.laborDollars, 1324.41);
  assert.equal(z?.businessDate, "9/8/2026");
  const naive = scrapeTotals("Sales $933.76 Labor $201.20");
  assert.notEqual(z?.netSales, naive.netSales);
  const result = closeNight({
    store: "Community Tap",
    netSales: z!.netSales!,
    laborDollars: z!.laborDollars!,
    laborTargetPct: 28,
    managerName: "Kenzy",
    businessDate: z!.businessDate,
    hasFoodEvidence: false,
  });
  assert.equal(result.laborPct.toFixed(2), "38.24");
  assert.equal(result.verdict, "MOVE");
  assert.equal(result.foodLabel, "Food is MISSING");
  assert.doesNotMatch(result.sendText, /schedule/i);
});

test("June CTap Z-reports: 6/7 light HOLD, 6/8 MOVE, never Grand Total", () => {
  const jun7 = scrapePdqZReport(readFileSync(join(fixtures, "pdq-zreport-2026-06-07.txt"), "utf8"));
  const jun8 = scrapePdqZReport(readFileSync(join(fixtures, "pdq-zreport-2026-06-08.txt"), "utf8"));
  assert.equal(jun7?.netSales, 5925.28);
  assert.equal(jun7?.laborDollars, 1609.27);
  assert.notEqual(jun7?.netSales, 6230.41);
  const light = closeNight({
    store: "Community Tap",
    netSales: jun7!.netSales!,
    laborDollars: jun7!.laborDollars!,
    laborTargetPct: 28,
    managerName: "Kenzy",
    hasFoodEvidence: false,
  });
  assert.ok(light.heavyDollars < -25);
  assert.equal(light.verdict, "HOLD");
  assert.equal(jun8?.netSales, 2725.76);
  assert.equal(jun8?.laborDollars, 1155.25);
  assert.notEqual(jun8?.netSales, 2842.54);
  const heavy = closeNight({
    store: "Community Tap",
    netSales: jun8!.netSales!,
    laborDollars: jun8!.laborDollars!,
    laborTargetPct: 28,
    managerName: "Kenzy",
    hasFoodEvidence: false,
  });
  assert.equal(heavy.verdict, "MOVE");
  assert.doesNotMatch(heavy.sendText, /schedule/i);
});

test("Toast CSVs fill net + labor and still skip food", () => {
  const sales = readFileSync(join(fixtures, "sales-summary.csv"), "utf8");
  const labor = readFileSync(join(fixtures, "labor-breakdown.csv"), "utf8");
  const merged = mergeCsvFiles([
    { name: "Sales Summary.csv", text: sales },
    { name: "Labor Breakdown.csv", text: labor },
  ]);
  assert.equal(merged.netSales, 3408.15);
  assert.equal(merged.laborDollars, 1211.85);
  assert.equal(parseToastCsv("food-invoices.csv", sales).laborDollars, undefined);
});
