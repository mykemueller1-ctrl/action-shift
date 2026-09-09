# CURSOR PACKET — Action Shift
Lead: Grok. Repo: mykemueller1-ctrl/action-shift ONLY.
Founder is not the debugger. Do not wait on him. Do not text him.

Paste this into every Cursor agent before it writes a line:

```
Open https://github.com/mykemueller1-ctrl/action-shift
Read CURSOR_PACKET.md first. Then CONSUMER.md, EMAIL.md, OS.md.
Do not open mykemueller1-ctrl/never86 or never86-desk.
Product is docs/index.html.
House = Community Tap. Manager = Kenzy. Target = 28%.
POS = PDQ. No public API. Ingest = morning EOD email.
Net = Z-report Subtotal, never Grand Total.
Labor = Labor Summary Total.
Food = HOLD unless same-day invoices AND a count.
Photos do not parse.
Do not commit PINs, payroll, void names, or Bamba dollars.
```

---

## 1. What we are building

An owner seat. Not an operating system with 11 agents.

Loop:
1. Last night arrives (PDQ EOD email 6–8 AM America/Chicago).
2. After 8:05 AM the desk already has net + labor filled.
3. Close math runs. Three tiles. One MOVE or HOLD.
4. One text to Kenzy. Food stays HOLD.
5. Tomorrow’s file proves whether the move landed.

That loop IS the OS. Do not rebuild Pulse, Command Center, Void Hunter, or Sentia.

## 2. Houses — never mix

| Name | What it is | Rule |
|---|---|---|
| Never 86'd | Myke's company | Product brand |
| Community Tap & Pizza | His restaurant. Fort Dodge. This seat. | Default everything |
| Kenzy | Runs this seat tonight | One manager |
| communitypizza2026@gmail.com | House inbox | Ingest |
| mykemueller1@gmail.com | Owner copy of the same PDQ EOD | Not the product inbox |
| chase@n86.app | Also on the EOD To: line | Do not mail Kenzy from here |
| Taco Bamba | Signed customer | Separate book. Zero dollars on this desk |
| Max Grill | Prospect Kristin found | Lab fixture only |

Paper roles at CTap (do not put in UI): Karlee + Ashley FOH, Tom kitchen, Sally admin.
Do not invent a fight between Kenzy and those names.

## 3. File map

| File | Job |
|---|---|
| docs/index.html | THE product. Static desk. Netlify publishes `docs/`. |
| lib/close.ts | Close math. Do not change the formula. |
| lib/parse.ts | PDQ Z-report + paste scrape. Net = Subtotal. |
| lib/ingest.ts | 8:05 AM job contract. Implement this. |
| lib/csv.ts | Toast CSV only. Other houses. |
| tests/fixtures/pdq-zreport.txt | Real shape. 9/8/2026 CTap-style totals. |
| CONSUMER.md | What Kenzy sees in the morning. |
| EMAIL.md | Which inbox to read. |
| OS.md | Rules that survive Saturday. |
| HOUSES.md | Do not mix. |
| AGENTS.md | Short never-do list. |

Live doors:
- https://cdn.jsdelivr.net/gh/mykemueller1-ctrl/action-shift@main/docs/index.html
- https://action-shift.netlify.app (only if it serves docs/)

Vercel is blocked. Do not deploy there.

## 4. Close math — locked

```
laborPct = laborDollars ÷ netSales × 100
targetDollars = netSales × (targetPct ÷ 100)
heavyDollars = laborDollars − targetDollars
```

- CTap target = **28** (his weekly tool). Study average was 29.1. Do not reset to 30 on this seat.
- heavy > $25 → MOVE. Cut one mid shift before the rush. Keep the peak staffed.
- light > $25 → do not add a body from this screen.
- Else CLEAN. If food evidence is missing, verdict becomes HOLD.
- Always show the formula.
- Never ask for a schedule photo.
- Never invent food cost or prime cost.

### Lab fixture (NOT CTap last night)
`Net $3,408.15 Labor $1,211.85`
- 35.56% always
- vs 28% ≈ $258 heavy, MOVE, food HOLD
- vs 30% ≈ $189 heavy
Never load those dollars as Community Tap defaults.

### PDQ fixture (CTap shape, 9/8/2026)
`tests/fixtures/pdq-zreport.txt`
- Subtotal $3,463.35 = net
- Grand Total $3,615.83 = IGNORE
- Labor Summary Total $1,324.41 = labor
- Close vs 28% = 38.24%, MOVE, food HOLD

## 5. Job A — 8:05 AM auto-fill (build this next)

PDQ already emails the close. Do not scrape the POS. There is no public PDQ API.

Every morning America/Chicago:
- Window: 06:00–08:00 the EOD lands from `pdqreports@pdqpos.com`
- Subject looks like: `EOD Reports Generated From Community Pizza 515-955-8202 9/9/2026 6:00:33 AM`
- Proven 9 Sep 2026 on both communitypizza2026@gmail.com and mykemueller1@gmail.com
- Attachments on that mail:
  - `9-8-2026 ZReport_Summary Community Pizza.pdf` → PARSE THIS
  - `9-8-2026 Void_Promo_Report Community Pizza.pdf` → DO NOT parse into the desk
  - `9-8-2026 Hourly_Sales_Report Community Pizza.pdf` → optional later, not the owner seat

8:05 AM job:
1. Search house inbox: `from:pdqreports@pdqpos.com newer_than:1d subject:EOD`
2. Download only `*ZReport_Summary*.pdf`
3. Extract text. Run `scrapePdqZReport`.
4. If Subtotal + Labor Summary Total exist, write last-close.json and prefill the desk.
5. Do not auto-send the Kenzy text. Human taps Send.
6. If parse fails, leave net/labor blank and say: type the two numbers. Photos do not parse.

Implement against `lib/ingest.ts`. Do not invent a database. A JSON file or localStorage is enough for CTap v1.

## 6. Job B — first-run email login (later, do not block Job A)

When a stranger first opens the product they connect Gmail / Outlook.
Purpose: identity + a way back to them. Not ingest.

- Operator connects THEIR inbox to create the account.
- House ingest stays communitypizza2026@gmail.com.
- Never use mykemueller1 as the product login for Kenzy.
- No passwords to forget if OAuth works. Magic link is fine as fallback.
- Do not build this until Job A pre-fills CTap from the EOD.

## 7. Job C — what you must not build

- mykemueller1-ctrl/never86 or never86-desk
- 11 agents, Command Center, Void Hunter webhooks, Albert chat
- PIN pads, payroll, staff void names in the public repo
- Schedule photos / who works 5–7
- Inventory counts / daily prime cost from invoices alone
- Vercel deploys
- Autoloading Grill or Bamba dollars into CTap fields
- Auto-texting Kenzy without a human tap
- Parsing Void_Promo into the owner seat

## 8. Acceptance — agent is done when

1. `docs/index.html` still opens with Community Tap / Kenzy / 28% and blank net+labor.
2. `npm test` green. PDQ fixture still reads Subtotal $3,463.35 and labor $1,324.41.
3. Lab paste still yields 35.56%.
4. Food tile says HOLD unless the count box is checked.
5. Send copies one text. No schedule word.
6. If Job A shipped: dropping or fetching today’s ZReport_Summary fills net+labor and does not fill food.
7. Git diff does not touch never86.

## 9. Report back

Write what you did in NIGHT_ORDERS.md. One page. No novels.
