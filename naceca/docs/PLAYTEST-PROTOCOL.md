# NACECA observed playtest: facilitator protocol

One page, for whoever runs a mixed desktop and phone session. Players see nothing new: the kit is the playtest layer in
the game (NEW PLAYER, START AT M2, the Summary sheet, EXPORT) and `tools/pt_report.cjs` (the report, offline, on a
laptop afterwards). Every button this sheet names is pressed before a session by `tools/harness/scenarios/pt_dryrun.cjs`,
at a desktop size and at a phone size, in the order below (the play between the taps is scripted there; sending a file
and seeing it arrive are the two things it cannot rehearse). If a button is not where this sheet says, stop and tell the
owner.

**The slice:** from the moment the van stops at the Ikeja market (M2), through the Lagos office that comes before the raid
(H2: Sgt. Uche, your phone, the Commander's call with its charge sheet and briefing), to the end of the Lekki raid
aftermath (M3). The game asks the two questions on screen over that aftermath.
**Two starts.** Record which one each player had.
- **Full start** (sessions of 60 minutes or more): title › **NEW INVESTIGATION** › **SENIOR AGENT** (already selected) ›
  **BEGIN**. The cold open and HQ (M0, M1) are a warm-up that teaches crouch, sprint and the action button; they are
  logged too. Budget about 75 minutes per player.
- **M2 start** (sessions under 60 minutes): **START AT M2** (below) gives a fresh Senior Agent investigation with M0 and
  M1 done, at the market's start screen. Budget about 45 minutes. The player has no XP and no capabilities from M0 and M1,
  and nothing from the cold open except the "Tell Madam it's clean" phone, so the operations table has the same cards.
  Compare M2-start players with each other, not with full-start players, on anything that depends on capabilities.

Use 4 to 8 players, at least two on phones and two on desktops. One facilitator for every 2 to 3 players.
**You need:** this sheet; a watch; one printed observation sheet per player (`docs/PLAYTEST-SHEET.html`, two A4 pages;
its source is the last section of this file); a phone camera for the sheets; and **the session address**: decide it
before the session (an email address or a chat that one of you can open on a laptop during the session) and write it in
the header of every observation sheet, because that is where the phones send their logs. A laptop with this repo is
needed only if you want to look at a report yourself before sending the folder back. No network is needed to play.

## Once per device: open the page and time it
1. Open the game with `?pt=1` at the end of its address (for example `…/naceca.html?pt=1`). **Time the first load:**
   from the tap on the link (or Go in the address bar) to the title screen with NEW INVESTIGATION on it. Write the
   seconds in the **first load** box of every sheet used on that device. Write it even when it feels quick: the owner
   uses it to decide whether phones get a streamed build.
2. `?pt=1` shows the **Player** and **Summary** rows in Settings › PLAYTEST, and **START AT M2**, which replaces the game in
   progress and so is offered only in the Settings opened from the **title screen** (never from the menu during play).
   Keep `?pt=1` in the address all session.

## Before each player (per device, about 5 minutes)
1. Title › **SETTINGS** › scroll to the bottom › PLAYTEST (the last group). Look at the **Player** row.
   - *No player yet* (a fresh device): tap **CLEAR** twice, within a few seconds. The first tap only arms the button: it
     reads `TAP AGAIN · CLEAR` while it waits, and after about four seconds it goes back to `CLEAR` and the next tap only
     arms it again. The few events CLEAR drops are the page's own; without this the report prints a "no player label" block.
   - It names a player (the one before): **EXPORT** (or Summary › VIEW › **SEND LOG**), **check the file has arrived** at
     the session address, and only then **CLEAR** twice. Never CLEAR a log you haven't seen arrive.
   CLEAR and NEW PLAYER (next) work in the Settings opened from the title and in the one opened from the menu during
   play; START AT M2 only in the title's.
2. Leave every setting at its default: Action pace Standard, Objective marker On, and
   **Hints when stuck: On — write it down per player, from the row in Settings, never from memory.**
   (That default on Senior Agent is an open decision; if the owner flips it, only this line changes.)
   Write down any setting you change.
3. Tap **NEW PLAYER** twice, within a few seconds (the first tap reads `TAP AGAIN · START P3` while it waits). The row then
   reads, for example, *B7QX·P3 · 1 event since 14:02*. Copy **the device id and the label together, as printed**, into
   the sheet's header: **B7QX·P3**. The Summary sheet and the report name players the same way. The id stays on the
   device, also through CLEAR.
4. On a phone, turn brightness up and rotation lock off. On a desktop, use headphones.
5. **M2 start:** in the same Settings, tap **START AT M2** twice, within a few seconds (the first tap reads
   `TAP AGAIN · START AT M2`). The market's start screen appears (CASE 02 · LAGOS MARKET PATROL). Hand over the device;
   the player's first tap is **START MISSION**.
   **Full start:** BACK › **NEW INVESTIGATION** › **SENIOR AGENT** › **BEGIN**, then hand over. On a device that has been
   played on, the sheet warns *"You have a saved investigation. It stays on this device until the new one saves for the
   first time…"*: that is the previous player's save, and BEGIN goes through it.
   Write the start (full or M2) in the header.

## What to say (keep to this)
"This is an early build of a detective game. We're testing the game, not you. Play the way you would at home. I can't help
while you play. If you're stuck for a long time I'll ask what you're trying to do. Thinking aloud helps if you're comfortable
with it. The game keeps a log of what you press and where you go, on this device only. It has no name and no recording.
At the end it asks you two questions."

## While they play: a row on the sheet for everything you notice, with the clock time (HH:MM)
The log uses the device's clock, so the time ties your note to the events around it. **The rule for the letter:** A is
time (they are not getting anywhere), B is a press (something they did was refused or went wrong); when a refusal keeps
them from moving on, write the press as B and the stretch after it as A.
- **A · Lost.** They wander, spin the camera, open the desk or the map to find the next step, or ask "where do I go?".
  Write what they said they were looking for. Long stretches on the operations table, a document or the desk count.
- **B · Failed interactions.** They press ACTION or E again and again, get a toast they didn't expect (the van's refusal
  is one), say "it won't let me", or hit the wrong button on the phone.
- **C · Being seen.** When KC or Obi notices them: did they look at the eye and the line under it? Did they say why ("he
  saw me standing")? Did they move differently afterwards (crouch, go round, stay near people)? Did they call it unfair?
- **D · Approach.** Did they post Uche, sneak, cut KC off, use what they chose in the briefing, or run straight at things?
  Did they retry something a different way?
- **P · Phone only:** can their thumb reach CROUCH and SPRINT while moving? Do they rotate the phone? Any text they can't
  read?
- **INTERVENED, FROZEN, RESTARTED** (below) are rows too: the time in the first column, the word in the letter column.

**What "lost at the table" looks like now** (M2, after KC; the van's refusal is a B row, the time at the table an A row):
- The van says no: **THE TABLE FIRST**, and one of these three lines, word for word:
  "0 of 3 links inked. Open the CASE FILE, pencil three pairs and FILE them." ·
  "1 of 3 links inked. Pencil two more pairs and FILE them." ·
  "2 of 3 links inked. Pencil one more pair and FILE it."
  Note the time of each refusal and whether they open the CASE FILE straight after.
- On the table the foot reads **LEKKI NEEDS 3 INKED · n SO FAR**; the greyed FILE says "Tap two cards to pencil a link";
  one tap gives "*card* selected — tap a second card to link it, or tap it again to put it down."
- After about 90 seconds at the table with nothing new inked (Hints when stuck On) a **HINT** toast and a line at the top
  of the side panel say: "Link two cards that are connected in the crime, not just known to each other. n of 3 inked."
  (Senior Agent; a Recruit gets Sgt. Uche's note, and after a refusal he names one pair.) **Note the time it appears,
  whether they read it** (eyes to the panel, or they say it), and what they did in the next minute (a new pencil? FILE?).
- A struck link brings the magistrate's ruling: the reason, the strike, and "At three strikes the warrant is refused and the
  raid goes without it". Note whether they read it or tap BACK TO THE TABLE at once.
In the report these appear as `M2 · operations table: … van refused ×1, stuck at the table ×1`,
`M2 · Ink three links on the operations…: 1:33, stuck ×1, hint ×1` and `Board NACECA van…: THE TABLE FIRST · refused`.

**Step in only** after about 3 minutes stuck with visible frustration. Say only "What are you trying to do?", never point
anything out. Write **INTERVENED HH:MM**.

**If the game freezes or errors:** write **FROZEN HH:MM** and reload the page (keep `?pt=1`). The player label and their
minutes carry on through the reload; what the title offers depends on whether the game had saved:
- *M2 start:* if **CONTINUE** is greyed, nothing was saved yet (the game saves at the first FILE on the table and at the
  van): Title › SETTINGS › **START AT M2** twice again, **under the same player** (no NEW PLAYER), and write **RESTARTED
  HH:MM**. If CONTINUE is offered, tap it: it is this player's save, because START AT M2 drops the previous player's.
- *Full start:* CONTINUE is theirs only once they have left HQ for the market (the game saves when HQ ends). Before that
  it would open the previous player's investigation, so **NEW INVESTIGATION › SENIOR AGENT › BEGIN** again, under the same
  player, and write **RESTARTED HH:MM**.

## The two questions, over the Lekki aftermath
The game asks them on its own sheet, over the aftermath, and **SAVE ANSWERS** returns to the aftermath. If the player skips
them, or they don't appear, ask them yourself word for word and write the answers on the sheet; you type them in at
*Collect the log*, step 2, **before SEND LOG and never after NEW PLAYER or CLEAR** (answers typed then land on the next
player's log, or are dropped with the cleared one).
1. **"What was your most satisfying decision?"**
2. **"What happened that felt unfair?"**

Don't rephrase them or give examples. The only follow-up allowed is "Tell me more about that."

## Collect the log (per device, before the next player)
1. Take the device. Tap **CONTINUE** on the aftermath. A **NIGHT SHIFT** title card plays (about 3 seconds) and the office
   at night appears; wait for it, because a menu opened during the card is closed when the scene begins. Then open the
   menu: **on a phone, the round pause button (two bars, no text) at the top right of the screen; on a desktop, the MENU
   pill (`ESC · MENU`) at the top of the screen beside the mission panel, or Esc.** Then **SETTINGS** › scroll to the
   bottom › PLAYTEST. The Player row must still name this player.
2. **Answers said aloud?** Type them now: **Two questions › ANSWER**, both answers as they said them, **SAVE ANSWERS**. It
   returns to Settings and the row reads *1 answer saved in the log*. Keep the written copy (`answers-B7QX-P3.txt` in the
   folder) as the backup.
3. **Summary › VIEW.** The sheet is headed with the player's name (B7QX·P3; the toggle beside it switches to WHOLE DEVICE
   and back) and shows the four answers for this player. Put your notes beside them. It shows evidence, not a verdict:
   - a red **ASK THEM** stamp: the reason they were seen was on screen too briefly to read, or their "unfair" answer is about
     being seen. Ask about it in your own debrief, never during play;
   - **NO READ DATA**: the log can't tell whether they read the reason. Rely on your C notes;
   - a green **LIKELY UNDERSTOOD**: every reason was on screen long enough to read. Your C notes still win.
4. **Phone:** tap **SEND LOG** on the sheet. The share sheet opens with this player's log, for example
   `naceca-playtest-B7QX-P3-20261017-1432.txt`. Send it by AirDrop, WhatsApp or email to the session address. If you
   dismiss the share sheet nothing is sent: tap SEND LOG again. If the share sheet doesn't open at all, the same log
   downloads as `.json`. (BACK › EXPORT on a phone opens the share sheet too, with the whole device's log.)
   **Desktop:** **SEND LOG** (this player) or BACK › **EXPORT** (the whole device) downloads `naceca-playtest-B7QX-….json`.
   Put it in the session folder.
5. **Check the file arrived** (open the folder or the chat). If sending fails, keep the device and **don't CLEAR it**; export
   it later. As a last resort, photograph the summary sheet.
6. For the next player: **BACK** (to Settings) › **BACK** (to the menu) › **QUIT TO MENU**. There is no confirmation; the
   title appears, and the log and the player are kept. Then Title › SETTINGS and *Before each player*, **step 1**.

## What to send back
One folder per session, named by date and place, for example `2026-10-31-yaba/`, holding:
- every export file (`.json` from desktops, `.txt` from phones; the same log sent twice is fine, it counts once);
- a photo or scan of every observation sheet, or a typed copy, named by the player: `sheet-B7QX-P3.jpg` or `.txt`;
- `answers-B7QX-P3.txt` for any player who said the two answers aloud (the typed copy in the log is the one the report
  prints; this is the backup).
Zip the folder and send it to the owner. The owner hands it to the integration session, which runs the report and writes
the findings (`docs/PLAYTEST-FINDINGS-template.md`). If you want to look yourself, on a laptop with this repo, offline:
```
node tools/pt_report.cjs 2026-10-31-yaba/ --md report.md               # per player, then across players, and report.md
node tools/pt_report.cjs 2026-10-31-yaba/ --player B7QX·P3 --around 2026-10-31T14:32   # the events a minute either side of a note
```
The report keys players as the sheet does (B7QX·P3), prints the four answers each, then ACROSS N PLAYERS. It exits 0 (also
when it skipped a file that isn't a log) and 2 when it found no events.

---

## Observation sheet (print one per player)

Print `docs/PLAYTEST-SHEET.html` from a browser: two A4 pages, the header as boxes, the legend, 28 lined rows and three
lines for each spoken answer. What follows is its source, kept here so the two cannot drift.

| Device·player | Start (full / M2) | Hints when stuck | First load (s) | Device (phone / desktop, model) | Facilitator | Session address |
|---|---|---|---|---|---|---|
| | | | | | | |

A = lost (time) · B = failed interaction (a press) · C = being seen · D = approach · P = phone only · INTERVENED, FROZEN,
RESTARTED as rows, the word in the letter column

| Time (HH:MM) | A/B/C/D/P/INT | What happened · what they said (quote) |
|---|---|---|
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |

Answers, if said aloud (type them in at *Collect the log*, step 2):
1. most satisfying decision: ______________________
2. felt unfair: ______________________
