import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closeNight } from "../lib/close";
import { scrapeTotals } from "../lib/parse";
import {
  attachProof,
  emptyLastMove,
  isForbiddenProof,
  openMove,
  replyToMove,
  shouldCarryForward,
  verifyMove,
} from "../lib/proof";

test("lab paste still 35.56% / ~$258 heavy vs 28% / MOVE / HOLD", () => {
  const paste = scrapeTotals("Net $3,408.15 Labor $1,211.85");
  const result = closeNight({
    store: "Community Tap",
    netSales: paste.netSales!,
    laborDollars: paste.laborDollars!,
    laborTargetPct: 28,
    managerName: "Kenzy",
    hasFoodEvidence: false,
  });
  assert.equal(result.laborPct.toFixed(2), "35.56");
  assert.equal(Math.round(result.heavyDollars), 258);
  assert.equal(result.verdict, "MOVE");
  assert.equal(result.foodLabel, "Food is MISSING");
  assert.doesNotMatch(result.sendText, /schedule/i);
});

test("Done or yes with no proof is acknowledged, never verified", () => {
  const move = openMove({
    businessDate: "9/8/2026",
    verdict: "MOVE",
    action: "Cut one mid shift before the rush. Keep the peak staffed.",
    observedDollars: 1324.41,
  });
  assert.equal(move.evidenceStatus, "open");
  assert.equal(replyToMove(move, "yes").evidenceStatus, "acknowledged");
  assert.equal(replyToMove(move, "done").evidenceStatus, "acknowledged");
  assert.notEqual(replyToMove(move, "yes").evidenceStatus, "verified");
  assert.equal(verifyMove(move).evidenceStatus, "acknowledged");
});

test("allowed proof kind + note is done-awaiting-proof; verified only with a kind attached", () => {
  const move = openMove({
    businessDate: "9/8/2026",
    verdict: "MOVE",
    action: "Cut one mid shift before the rush.",
    observedDollars: 1324.41,
  });
  const waiting = attachProof(move, "time-clock export", "Clock shows the mid cut.");
  assert.equal(waiting.evidenceStatus, "done-awaiting-proof");
  assert.equal(waiting.proofKind, "time-clock export");
  assert.equal(verifyMove(waiting).evidenceStatus, "verified");
  assert.equal(attachProof(move, "schedule photo", "who works 5-7").evidenceStatus, "open");
  assert.equal(isForbiddenProof("schedule photo of who works 5-7"), true);
});

test("empty last-move does not carry; unresolved yesterday does", () => {
  const empty = emptyLastMove();
  const morning = new Date("2026-09-09T13:10:00Z");
  assert.equal(shouldCarryForward(empty, morning), false);
  const open = openMove({
    businessDate: "9/8/2026",
    verdict: "MOVE",
    action: "Cut one mid shift before the rush.",
    observedDollars: 1324.41,
  });
  assert.equal(shouldCarryForward(open, morning), true);
  assert.equal(shouldCarryForward(replyToMove(open, "not-done"), morning), false);
  assert.equal(shouldCarryForward(verifyMove(attachProof(open, "deposit record", "Bag tape.")), morning), false);
});

test("not-done, data-missing, and fix-failed are locked states", () => {
  const move = openMove({
    verdict: "HOLD",
    action: "HOLD food cost.",
  });
  assert.equal(replyToMove(move, "not-done").evidenceStatus, "not-done");
  assert.equal(replyToMove(move, "data missing").evidenceStatus, "data-missing");
  assert.equal(replyToMove(move, "fix-failed").evidenceStatus, "fix-failed");
});
