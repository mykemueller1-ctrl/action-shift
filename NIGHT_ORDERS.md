# Night orders — 9 Sep 2026

Founder is asleep. Do not text. Job A shipped on this repo only.

## Done
- `docs/index.html` still defaults Community Tap / Kenzy / 28%. Net + labor stay blank in the HTML. Food stays HOLD. Send is a tap.
- Close was dead in the browser: a double-escaped paste regex threw on load. Fixed. Lab paste is 35.56% / ~$258 heavy vs 28% / MOVE / food HOLD. Z-report drop fills 3463.35 + 1324.41, not food, not Grand Total.
- `lib/ingest.ts` is the 8:05 AM America/Chicago job. Search: `from:pdqreports@pdqpos.com newer_than:1d subject:EOD`.
- Picks `*ZReport_Summary*` only. Void_Promo and Hourly never hit the desk.
- Subtotal + Labor Summary Total write `docs/last-close.json` (empty until a Z-report lands) and localStorage. Desk prefills those two numbers after 8:05 if the date is last night. Food is never filled. Kenzy is never auto-texted.
- Pull last night button fetches last-close. Drop still fills net + labor.
- `npm test` runs close + ingest. No Copilot. House Gmail is not connected here; drop the Z-report or run `npm run ingest`.

## Need from Myke
Nothing. House Gmail is not connected in this agent. Drop the Z-report or run `npm run ingest` when the PDF text is on disk.

## Do not
never86. Vercel. Auto-send. Grill dollars as CTap defaults.
