# NACECA observed playtest: facilitator protocol

One page, for whoever runs a mixed desktop and phone session. The kit is the playtest layer in `src/tactics/tac_pt.js`
(the logger, NEW PLAYER, the Summary sheet) and `tools/pt_report.cjs` (the offline report). Players see nothing new.

**The slice:** from the moment the van stops at the Ikeja market (M2) to the end of the Lekki raid aftermath (M3).
**Two starts.** Record which one each player had.
- **Full start** (sessions of 60 minutes or more): NEW INVESTIGATION. The cold open and HQ (M0, M1) are a warm-up: they
  teach crouch, sprint and the action button, and they are logged too. Budget about 75 minutes per player.
- **M2 start** (sessions under 60 minutes): **START AT M2** in Settings (below) gives a fresh Senior Agent investigation
  with M0 and M1 done, at the market's start screen. Budget about 45 minutes.

Use 4 to 8 players, at least two on phones and two on desktops. Plan one facilitator for every 2 to 3 players.
**You need:** this sheet, a watch, paper observation sheets, and one laptop with this repo for the analysis afterwards. No
network is needed.

## Once per device
Open the game with `?pt=1` at the end of its address (for example `…/naceca.html?pt=1`). That shows the **Player** and
**Summary** rows in Settings › PLAYTEST. After the first NEW PLAYER they stay, without `?pt=1`. The first NEW PLAYER also
gives the device a 4-character id, for example **B7QX**, which stays on the device (also through CLEAR).

## Before each player (per device, about 5 minutes)
1. Go to **Settings › PLAYTEST**. If *Playtest log* shows events from someone else, tap **EXPORT** (or Summary › VIEW ›
   **SEND LOG**) and **check the file has arrived** in the session folder. Only then tap **CLEAR**, twice (the first tap
   reads `TAP AGAIN · CLEAR`). Never CLEAR a log you haven't seen arrive.
2. Leave every setting at its default: Action pace Standard, Hints when stuck On, Objective marker On. Write down any
   change you make. **Write down "Hints when stuck" for every player:** its 60 s "Try this next" toast tells Senior players
   what to do, and whether Senior should default it Off is an open product question (DESIGN-tactics.md §11.8). Leave it at
   the default until that is answered.
3. Tap **NEW PLAYER** twice (the first tap reads `TAP AGAIN · START P3`). The row now reads, for example,
   *B7QX·P3 · 1 event since 14:02*. Write **the device id and the label together** on your sheet, exactly as the row prints
   them: **B7QX·P3**. The Summary sheet and the report print players the same way.
4. On a phone, turn brightness up and rotation lock off. On a desktop, use headphones.
5. **Full start:** Title › **NEW INVESTIGATION** › **SENIOR AGENT** (already selected) › **BEGIN**.
   **M2 start:** Settings › PLAYTEST › Player › **START AT M2**, twice.
   Write the start (full or M2) beside the label. Hand over the device.

## What to say (keep to this)
"This is an early build of a detective game. We're testing the game, not you. Play the way you would at home. I can't help
while you play. If you're stuck for a long time I'll ask what you're trying to do. Thinking aloud helps if you're comfortable
with it. The game keeps a log of what you press and where you go, on this device only. It has no name and no recording.
At the end it asks you two questions."

## While they play: write the clock time (HH:MM) next to every note
The log uses the device's clock, so a time ties your note to the events around it (the report reads the device's time zone
from the log).
- **A · Lost.** They wander, spin the camera, open the desk or the map to find the next step, or ask "where do I go?". Write
  down what they said they were looking for. This includes long stretches on the operations table, a document or the desk.
- **B · Failed interactions.** They press ACTION or E again and again, get a toast they didn't expect, say "it won't let me",
  or hit the wrong button on the phone.
- **C · Being seen.** When KC or Obi notices them: did they look at the eye and the line under it? Did they say why ("he saw
  me standing")? Did they move differently afterwards (crouch, go round, stay near people)? Did they call it unfair?
- **D · Approach.** Did they post Uche, sneak, cut KC off, use what they earned in the raid plan, or run straight at things?
  Did they retry something a different way?
- **Phone only:** can their thumb reach CROUCH and SPRINT while moving? Do they rotate the phone? Is there text they can't
  read?

**Step in only** after about 3 minutes stuck with visible frustration. Say only "What are you trying to do?", never point
anything out. Write **INTERVENED HH:MM**. If the game freezes or errors, write the time, reload and tap CONTINUE.

## The two questions, after the Lekki aftermath
The game asks them on screen over the aftermath. If the player skips them, or they don't appear, ask them yourself word for
word, then type the answers in **Settings › PLAYTEST › Two questions › ANSWER**.
1. **"What was your most satisfying decision?"**
2. **"What happened that felt unfair?"**

Don't rephrase them or give examples. The only follow-up allowed is "Tell me more about that."

## Collect the log (per device, before the next player)
**Getting to Settings after the aftermath.** The aftermath itself has only CONTINUE and VIEW SKILLS. Tap **CONTINUE**; on
the title screen (or the next hub) open the pause menu (the pause pill, or Esc on a desktop) or use the title's
**SETTINGS**, then **SETTINGS › PLAYTEST**.
1. **Summary › VIEW.** The sheet shows the four answers for this player (the toggle switches to WHOLE DEVICE). Put your notes
   beside them. It shows evidence, not a verdict:
   - a red **ASK THEM** stamp: the reason they were seen was on screen too briefly to read, or their "unfair" answer is about
     being seen. Ask about it in your own debrief notes, never during play;
   - **NO READ DATA**: the log can't tell whether they read the reason. Rely on your C notes;
   - a green **LIKELY UNDERSTOOD**: every reason was on screen long enough to read. Your C notes still win.
   BACK (or Esc) returns to Settings.
2. **Phone:** tap **SEND LOG** on the sheet. The share sheet opens with this player's log, for example
   `naceca-playtest-B7QX-P3-20261017-1432.txt`. Send it by AirDrop, WhatsApp or email to the session address. If the share
   sheet doesn't open, the same log downloads as `.json` instead.
   **Desktop:** **SEND LOG** (this player) or **EXPORT** (the whole device) downloads the log as `.json`. Put it in the
   session folder.
3. **Check the file arrived** (open the folder or the chat). If sending fails, keep the device and **don't CLEAR it**; export
   it later. As a last resort, photograph the summary sheet.
4. For the next player, go back to *Before each player*, **step 1**: export and check, then CLEAR, then NEW PLAYER.

## After the session (laptop, offline)
Put every file in one folder (`.json` and `.txt` both work; the same log sent twice counts once; anything else in the folder
is skipped with a line saying why).
```
node tools/pt_report.cjs ~/naceca-session-1017/ > report.txt                            # per player, then across players
node tools/pt_report.cjs ~/naceca-session-1017/ --player B7QX·P3                        # one player (B7QX-P3 also works)
node tools/pt_report.cjs ~/naceca-session-1017/ --around 2026-10-17T14:32                # the events a minute either side of a note
node tools/pt_report.cjs ~/naceca-session-1017/ --player B7QX·P3 --around 2026-10-17T14:32
node tools/pt_report.cjs ~/naceca-session-1017/ --md report.md                          # the same report as Markdown, to send
node tools/pt_report.cjs ~/naceca-session-1017/ --slice m2,h2,m3 --detail                # only those missions, every encounter in full
node tools/pt_report.cjs ~/naceca-session-1017/ --json report.json                      # the analysis as data
```
`--around` takes the date and the time you wrote, in the device's own time. The script exits 0 (also when it skipped a
file) and 2 when it found no events.

Send the team the log folder, `report.md`, the start (full or M2) and "Hints when stuck" for each player, and photos of
your paper sheets. After the first session, compare the sheet's stamps and "lost" rows with your C and A notes: the
thresholds sit in one table in `src/tactics/tac_pt_report.js` (`R.READ_MIN`, `R.READ_PER_WORD`, `R.LOST`, `R.INVEST`) to
recalibrate.

**Observation sheet columns:** time · device·player (B7QX·P3) · start (full / M2) · tag (A/B/C/D) · what happened · what they
said (quote)
