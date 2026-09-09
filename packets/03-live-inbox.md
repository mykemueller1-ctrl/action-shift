# PACKET 3 — Live house inbox → last-close.json

Paste this into Cursor on **mykemueller1-ctrl/action-shift** only.

```
Repo: mykemueller1-ctrl/action-shift
Do not open never86 or never86-desk.
Read CURSOR_PACKET.md then packets/03-live-inbox.md.
Start from PR #9 branch cursor/job-a-morning-ingest-0bfb if it is still open. Merge it first if tests pass.

Job A (desk preload from last-close.json) is already coded on that PR.
Packet 3 is the missing pipe: actually read this morning's PDQ EOD and write last-close.json with net + labor.

House inbox: communitypizza2026@gmail.com
Owner copy: mykemueller1@gmail.com
Sender: pdqreports@pdqpos.com
Search: from:pdqreports@pdqpos.com newer_than:1d subject:EOD
Attachment to parse: *ZReport_Summary*.pdf ONLY
Ignore: Void_Promo_Report, Hourly_Sales_Report
Net = Subtotal. Never Grand Total.
Labor = Labor Summary Total.
House = Community Tap. Manager = Kenzy. Target = 28%.
Food = HOLD. sentToManager = false. Human taps Send.
Photos do not parse.

Build:
1. Merge or finish PR #9 so docs/index.html has Pull last night + last-close.json.
2. Add scripts/ingest-eod.mjs that:
   - takes Z-report text or a path to extracted text
   - runs scrapePdqZReport / runMorningIngest
   - writes docs/last-close.json with real net + labor + businessDate
3. Add a Netlify scheduled function at 8:05 America/Chicago OR a documented `npm run ingest` that Grok/Cursor runs after the 6 AM mail lands.
4. Do not put Gmail refresh tokens in the public repo. Use Netlify env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN for the HOUSE box only.
5. Pull last night on the desk should then fill today's numbers after 8:05.

Acceptance:
- last-close.json has netSales and laborDollars from the latest ZReport_Summary, not blank.
- Opening the desk after 8:05 fills those two fields and leaves food HOLD.
- Dropping Void_Promo still errors.
- npm test green. Fixture still $3,463.35 / $1,324.41.
- No auto-send. No never86. No Vercel. No PINs.

Today's known mail (9 Sep 2026 6:00 AM):
Subject: EOD Reports Generated From Community Pizza 515-955-8202 9/9/2026 6:00:33 AM
File: 9-8-2026 ZReport_Summary Community Pizza.pdf
```
