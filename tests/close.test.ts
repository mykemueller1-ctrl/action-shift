import assert from "node:assert/strict";
import test from "node:test";
import { closeNight } from "../lib/close";
import { mergeCsvFiles, parseToastCsv } from "../lib/csv";
import { scrapeTotals } from "../lib/parse";
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
