import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");
const folder = join(docs, "grok-bots");

type Roster = {
  bar: string;
  live: string;
  bots: { slug: string; name: string; description: string; job: string }[];
};

const roster = JSON.parse(readFileSync(join(folder, "roster.json"), "utf8")) as Roster;

test("six Grok Bot templates sit behind the invoice-catcher bar", () => {
  assert.equal(roster.bots.length, 6);
  assert.match(roster.bar, /Two Invoice Catcher/);
  assert.match(roster.live, /grokbots\.best\/bots\/two-invoice-catcher/);
  assert.deepEqual(
    roster.bots.map((b) => b.slug),
    [
      "two-invoice-catcher",
      "last-night-close",
      "z-report-catcher",
      "food-gate",
      "third-party-take",
      "night-proof",
    ],
  );
});

test("each template is paste-ready and never invents dollars", () => {
  for (const bot of roster.bots) {
    const md = readFileSync(join(folder, `${bot.slug}.md`), "utf8");
    assert.ok(md.trim().length > 200, bot.slug);
    assert.match(md, /VERIFIED/);
    assert.match(md, /ESTIMATED/);
    assert.match(md, /MISSING/);
    assert.match(md, /[Nn]ever invent/);
    assert.match(bot.description, /[Nn]ever/);
    assert.doesNotMatch(md, /auto-send|autosend/i);
    assert.doesNotMatch(md, /\bPIN\b|payroll|Bamba|\$3,957\.09|\$1,452\.37/);
    assert.doesNotMatch(md, /Fry Line|Bartender \$|who works 5/);
    assert.doesNotMatch(bot.description, /Bamba|payroll|\bPIN\b/);
  }
});

test("close / ingest / proof rules stay in the matching bots", () => {
  const close = readFileSync(join(folder, "last-night-close.md"), "utf8");
  const z = readFileSync(join(folder, "z-report-catcher.md"), "utf8");
  const food = readFileSync(join(folder, "food-gate.md"), "utf8");
  const proof = readFileSync(join(folder, "night-proof.md"), "utf8");
  const take = readFileSync(join(folder, "third-party-take.md"), "utf8");

  assert.match(close, /laborDollars ÷ netSales/);
  assert.match(close, /28/);
  assert.match(close, /HOLD/);
  assert.match(close, /schedule photo/);
  assert.match(close, /\$3,408\.15/);
  assert.match(z, /Subtotal/);
  assert.match(z, /Grand Total/);
  assert.match(z, /Void/);
  assert.match(food, /invoices AND a count/i);
  assert.match(food, /prime/);
  assert.match(proof, /yes is not done/);
  assert.match(proof, /time-clock export/);
  assert.match(take, /Subtotal/);
  assert.match(take, /Marketing/);
});

test("desk and gallery pages still exist", () => {
  const desk = readFileSync(join(docs, "index.html"), "utf8");
  const gallery = readFileSync(join(docs, "grok-bots.html"), "utf8");
  assert.match(desk, /Community Tap/);
  assert.match(desk, /Kenzy/);
  assert.match(desk, /value="28"/);
  assert.match(desk, /HOLD food cost/);
  assert.match(desk, /grok-bots\.html/);
  assert.match(gallery, /Copy first message/);
  assert.ok(existsSync(join(folder, "README.md")));
});
