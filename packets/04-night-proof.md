# PACKET 4 — Night proof (Job N)

Paste into Cursor on **mykemueller1-ctrl/action-shift** only.

```
Read CURSOR_PACKET.md, CONSUMER.md, OS.md, packets/JOB-QUEUE.md, this file.
Do not open never86 or never86-desk.
Do not implement Job A. PR #9 owns ingest. Do not touch lib/ingest.ts.
Do not change lib/close.ts formula.
Product is docs/index.html.
House = Community Tap. Manager = Kenzy. Target = 28%.
```

## Why this job

The OS is not a dashboard. It is:
1. What happened? (Job A / paste)
2. What next? One MOVE or HOLD. One manager. (already ships)
3. Did it change? Tomorrow's file against the same formula. **This job.**

A verbal yes is not done.

## Build

After **Close last night**, persist one move to `docs/last-move.json` + localStorage:

```
house, manager, businessDate, verdict, owner, action,
observedDollars, claimBoundary, evidenceStatus, proofKind, proofNote
```

Same desk, not a second app. Night block:

**Did the move happen?**
Require proof the shift created, one of:
- deposit record
- receipt
- time-clock export (not a photo of who works 5–7)
- ticket detail
- exception log

States (locked):
`open` → `acknowledged` → `done-awaiting-proof` → `verified`
also: `not-done` | `data-missing` | `fix-failed`

Rules:
- Tapping Done / typing "yes" with no proof = `acknowledged` only.
- Never mark `verified` from a verbal yes.
- Unresolved carry-forward: next morning the desk shows yesterday's move at the top until verified or not-done.
- Typed values stay Unverified until reconciled to a source.
- Variance is review work. Not theft. Not guaranteed savings.
- Food stays HOLD unless same-day invoices AND a count.
- Human still taps Send. Do not auto-text Kenzy.

Files:
- `lib/proof.ts` — state machine. No database.
- `tests/proof.test.ts`
- `docs/last-move.json` shape (no live CTap dollars as defaults)
- `docs/index.html` — proof row after close + carry-forward banner

## Tests

- Lab paste still 35.56% / ~$258 heavy vs 28% / MOVE / food HOLD.
- CTap defaults: Kenzy, 28%, blank net+labor.
- Done with no proof → acknowledged, not verified.
- Allowed proof kind + note → done-awaiting-proof; verified only when a proof kind is attached.
- Unverified last-move on reload → carry-forward visible.
- `npm test` green. No schedule word on the owner seat.
- Diff does not touch never86.

## Report
One page in NIGHT_ORDERS.md. No novels.
