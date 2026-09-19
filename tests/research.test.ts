import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EMPTY_RESEARCH,
  FOGG_INBOUND,
  FOGG_SOURCES,
  WRITE_BEFORE_RESEARCH,
  foggPack,
  lockPack,
  writeFromResearch,
} from "../lib/research";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("writing before research is refused", () => {
  const unlocked = foggPack(false);
  assert.equal(unlocked.locked, false);
  assert.throws(() => writeFromResearch(unlocked), (err: Error) => {
    assert.match(err.message, /slop/i);
    assert.equal(err.message, WRITE_BEFORE_RESEARCH);
    return true;
  });
});

test("empty facts cannot lock or write", () => {
  assert.throws(() => lockPack({ id: "x", title: "x", inbound: "", facts: [], locked: false }), (err: Error) => {
    assert.equal(err.message, EMPTY_RESEARCH);
    return true;
  });
  assert.throws(
    () => writeFromResearch({ id: "x", title: "x", inbound: "", facts: [], locked: true }),
    (err: Error) => {
      assert.equal(err.message, EMPTY_RESEARCH);
      return true;
    },
  );
});

test("Fogg pack locks inbound + public training facts, then writes", () => {
  const pack = lockPack(foggPack());
  assert.equal(pack.locked, true);
  assert.match(pack.inbound, /Wednesday mid-afternoon/i);
  assert.equal(pack.inbound, FOGG_INBOUND);
  assert.ok(pack.facts.some((f) => f.id === "b-map" && f.source === FOGG_SOURCES.model));
  assert.ok(pack.facts.some((f) => f.id === "live-training" && /\$4,000/.test(f.claim)));
  assert.ok(pack.facts.some((f) => f.id === "online-course" && /\$299/.test(f.claim)));
  assert.ok(pack.facts.some((f) => f.id === "fit-call" && f.source === FOGG_SOURCES.call));

  const draft = writeFromResearch(pack);
  assert.match(draft.reply, /discuss the work/i);
  assert.match(draft.reply, /Wednesday mid-afternoon Pacific/i);
  assert.match(draft.reply, /not buying training/i);
  assert.match(draft.reply, /Action Shift/);
  assert.match(draft.reply, /Food stays HOLD/);
  assert.match(draft.reply, /Myke Mueller/);
  assert.doesNotMatch(draft.reply, /\$4,000/);
  assert.doesNotMatch(draft.reply, /schedule/i);
  assert.doesNotMatch(draft.reply, /auto-send/i);
  assert.doesNotMatch(draft.reply, /Kenzy/);
  assert.doesNotMatch(draft.reply, /3,408\.15/);
  assert.doesNotMatch(draft.reply, /7,388\.23/);

  assert.match(draft.callCard, /Motivation/);
  assert.match(draft.callCard, /Prompt = the EOD already arrived/);
  assert.match(draft.callCard, /Ask BJ/);
  assert.doesNotMatch(draft.callCard, /schedule/i);

  assert.match(draft.workBrief, /28%/);
  assert.match(draft.workBrief, /Food HOLD/);
  assert.match(draft.workBrief, /Human tap/);
  assert.doesNotMatch(draft.workBrief, /Grand Total/);
});

test("desk pages keep CTap loop and ship the Fogg reply copy", () => {
  const index = readFileSync(join(root, "docs/index.html"), "utf8");
  assert.match(index, /Community Tap/);
  assert.match(index, /Kenzy/);
  assert.match(index, /value="28"/);
  assert.match(index, /HOLD/);
  assert.match(index, /Send this to Kenzy/);
  assert.match(index, /reply\.html/);
  assert.match(index, /If it asks for a schedule, it failed/);

  const replyPage = readFileSync(join(root, "docs/reply.html"), "utf8");
  assert.match(replyPage, /Lock the facts first/);
  assert.match(replyPage, /discuss the work/i);
  assert.match(replyPage, /Wednesday mid-afternoon Pacific/);
  assert.match(replyPage, /not buying training/i);
  assert.match(replyPage, /behaviormodel\.org/);
  assert.doesNotMatch(replyPage, /schedule photo/i);
  assert.doesNotMatch(replyPage, /3,408\.15/);
  assert.doesNotMatch(replyPage, /7,388\.23/);
});
