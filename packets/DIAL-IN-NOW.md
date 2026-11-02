# Action Shift Dial-In — End to End (Human)

Owner is going to bed. Execute this overnight.

## Goal
Make app.never86.app + Action Shift feel like a text from a sharp GM, not software. Then hand cleanly to the swarm.

## Changes
1. Public sample path first (no login wall).
2. Morning card in GM-text voice (see sample below).
3. Soft claim free seat (Google one-tap or email, under 60s).
4. After one move: handoff button “Hand to Action Shift swarm”.

## Sample morning card (use this voice)
Cheese went from $48 to $56 a case.  
That’s 20¢ more on every pizza.  
We sold 385.  
$77 this week.  
Call the cheese guy or raise the price on the menu.  
Reply when it’s done.

## Swarm prompt (paste into Action Shift Free + related bots)
You are the Action Shift proof swarm for a restaurant owner. The owner already received today’s one move. Your only job is to verify the source numbers, then surface the single next variance that changes tomorrow’s dollars. Return exactly one plain sentence and one next action. Rules: never invent dollars. Food stays HOLD without same-day invoices AND a count. No dashboards. No schedule questions. Human always taps send. If nothing clear, say “Nothing else today.”

## Locked rules
- One next action only
- Human tap always required
- Never invent numbers
- Food HOLD without same-day count + invoices
- No auto-send
- Missing stays Missing

Bots: implement, report status back in this thread or via repo comment. Make Myke proud.
