# Consumer app — operator / manager

Remember this. The downloadable app is this loop, made boring.

A manager should open it in the morning and finish in one screen. No training deck. No Command Center.

## Who the app is for

- **Operator** (Myke): sees the close, sends one text.
- **Manager** (Kenzy on Community Tap): same screen, same two numbers, same send.

Not for scheduling. Not for inventory. Not for eleven agents.

## House pack (set once at download)

When they download, pre-fill the house. Never make them type the company.

| Field | Community Tap |
|---|---|
| House | Community Tap |
| Manager | Kenzy |
| Labor target | 28% |
| Daily inbox | communitypizza2026@gmail.com |
| POS | PDQ (no public API — paste or email) |
| Food | HOLD until same-day invoices AND a count |

Net and labor start **blank**. Never autoload another house's dollars.

## Morning path (easy)

1. Open the app after **8 AM Central**. Last night auto-fills from `communitypizza2026@gmail.com`.
   - PDQ EOD lands 6–8 AM. Do not auto-fill during that window.
   - Net = Subtotal (ex-tax). Labor = Labor Summary Total. Not Grand Total.
   - If the desk is blank, drop the official PDQ **Z-report Summary PDF**.
   - Photos of Z-outs do not parse.
2. Read labor %, versus target, **food cost** (HOLD until a count), and **sales mix**: food · pop · liquor · beer.
3. Tap **Send this to [manager]**. One person. No group chat.
4. Optional: email a copy to the house inbox.

If it asks for a schedule photo, it failed.

## Close math (do not change)

```
laborPct = laborDollars ÷ netSales × 100
targetDollars = netSales × (targetPct ÷ 100)
heavyDollars = laborDollars − targetDollars
```

- Show the formula on screen. Typed totals stay labeled as typed totals.
- **heavy > $25** → MOVE. Cut one mid shift before the rush. Keep the peak staffed.
- **light > $25** → do not add a body from this screen.
- Else CLEAN. If food evidence is missing, verdict becomes **HOLD**.
- Food **cost** tile stays **HOLD** unless the same-day count box is checked. Never invent food or prime cost.
- Sales mix is not food cost. Only four buckets: **food, pop, liquor, beer**. Spec Instruction, UKNOWN, Large Pizzas, and negative lines roll into food until mapped.

## DoorDash (optional, same screen)

- Eligible sales = **Subtotal**.
- Tips, tax, and customer fees do not count.
- Documented take = commission + merchant + ads/promos + error charges.
- Marketing is a choice. Do not bury it inside "the app fee."

## Lab fixture only (not CTap last night)

Paste `Net $3,408.15 Labor $1,211.85`

- Labor = **35.56%**
- Vs 28% ≈ **$258 heavy**, MOVE, food HOLD
- Vs 30% ≈ **$189 heavy**

Never put those Grill dollars in as Community Tap defaults. Never address Kenzy with Grill numbers.

## Houses (never mix)

- Never 86'd = the company.
- Community Tap = Myke's restaurant. This seat.
- Taco Bamba = separate book.
- Max Grill = prospect. Lab only.

Never copy one house into a blank house.

## What the downloaded app must not ask

Schedule photo. Who works 5–7. POS passwords. Food % with no count. A second manager. A dashboard of agents.

## Live desk today

https://action-shift.netlify.app

Product file until the store build: `docs/index.html`.
