# Ship on Grok Build (not Vercel)

This chat cannot press Publish on grok.me. You can.

1. Open grok.com
2. Switch the mode to **Build**
3. Paste the prompt below
4. Hit **Publish** → action-shift.grok.me (or any slug it gives you)

## Prompt to paste into Grok Build

Build a single-page restaurant owner desk called Action Shift.

Paper background #f4efe6, ink #1a1714, Georgia serif.
Headline: Last night.
Copy: Drop two numbers. I will not ask for a schedule photo. I will not invent food cost.

Fields: House, Business date, Net sales, Labor dollars, House labor target % (default 30), One manager (default Kenzy), paste box for a Toast line.
Buttons: Load Grill test night. Close last night. Send this to [manager].

Load Grill test night fills:
- House: Grill
- Date: 2026-08-31
- Net: 3408.15
- Labor: 1211.85
- Target: 30
- Manager: Kenzy
- Paste: Net $3,408.15 Labor $1,211.85

Close math:
laborPct = labor / net * 100
heavy = labor - (net * target/100)
If heavy > 25: verdict MOVE and tell them to cut one mid shift before the rush, keep the peak staffed.
Always HOLD food cost. Never invent food. Never ask for a schedule photo.
Show the formula and a copyable manager text.

Acceptance: 35.56% and about $189.40 heavy vs 30%.
No login. No database. No POS passwords. No inventory. No agents list.

The working standalone file is already in this repo at docs/index.html.
