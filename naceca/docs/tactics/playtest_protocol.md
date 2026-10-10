# NACECA observed playtest: facilitator protocol

Proposed repo path: `docs/PLAYTEST-PROTOCOL.md`. One page, for whoever runs a mixed desktop and phone session.

**The slice:** from the moment the van stops at the Ikeja market (M2) to the end of the Lekki raid aftermath (M3). Players start
from NEW INVESTIGATION. The cold open and HQ are a warm-up: they teach crouch, sprint and the action button. They're logged too.
**Budget:** about 75 minutes per player. Use 4 to 8 players, at least two on phones and two on desktops. Plan one facilitator for
every 2 to 3 players.
**You need:** this sheet, a watch, paper observation sheets, and one laptop with this repo for the analysis afterwards. No
network is needed.

## Before each player (per device, about 5 minutes)
1. Open the game. Go to **Settings › PLAYTEST**. If *Playtest log* shows events from someone else, tap **EXPORT**, check the file
   arrived, then tap **CLEAR** twice.
2. Leave every setting at its default: Action pace Standard, Hints when stuck On, Objective marker On. Write down any change you
   make.
3. Tap **NEW PLAYER** twice. The row now reads, for example, *P3 · 0 events*. Write the device letter and the label on your
   sheet (for example **B · P3**).
4. On a phone, turn brightness up and rotation lock off. On a desktop, use headphones.
5. Go to Title › **NEW INVESTIGATION** › **SENIOR AGENT** (already selected) › **BEGIN**. Hand over the device.

## What to say (keep to this)
"This is an early build of a detective game. We're testing the game, not you. Play the way you would at home. I can't help
while you play. If you're stuck for a long time I'll ask what you're trying to do. Thinking aloud helps if you're comfortable
with it. The game keeps a log of what you press and where you go, on this device only. It has no name and no recording.
At the end it asks you two questions."

## While they play: write the clock time (HH:MM) next to every note
The log uses the same clock, so a time ties your note to the events around it.
- **A · Lost.** They wander, spin the camera, open the desk or the map to find the next step, or ask "where do I go?". Write down
  what they said they were looking for.
- **B · Failed interactions.** They press ACTION or E again and again, get a toast they didn't expect, say "it won't let me", or
  hit the wrong button on the phone.
- **C · Being seen.** When KC or Obi notices them: did they look at the eye and the line under it? Did they say why ("he saw me
  standing")? Did they move differently afterwards (crouch, go round, stay near people)? Did they call it unfair?
- **D · Approach.** Did they post Uche, sneak, cut KC off, use what they earned in the raid plan, or run straight at things? Did
  they retry something a different way?
- **Phone only:** can their thumb reach CROUCH and SPRINT while moving? Do they rotate the phone? Is there text they can't read?

**Step in only** after about 3 minutes stuck with visible frustration. Say only "What are you trying to do?", never point
anything out. Write **INTERVENED HH:MM**. If the game freezes or errors, write the time, reload and tap CONTINUE.

## The two questions, after the Lekki aftermath
The game asks them on screen. If the player skips them, or they don't appear, ask them yourself word for word. Type the answers in
**Settings › PLAYTEST › Two questions › ANSWER**.
1. **"What was your most satisfying decision?"**
2. **"What happened that felt unfair?"**

Don't rephrase them or give examples. The only follow-up allowed is "Tell me more about that."

## Collect the log (per device, before the next player)
1. Go to **Settings › PLAYTEST › Summary › VIEW**. Read the four answers and put your notes beside them. It shows evidence, not
   a verdict. A red **ASK THEM** stamp means the evidence on being seen is unclear, so ask about it in your own debrief notes,
   never during play.
2. **Phone:** tap **SEND LOG**. The share sheet opens. Send the file (for example `naceca-playtest-P3-20261017-1432.txt`) by
   AirDrop, WhatsApp or email to the session address.
   **Desktop:** **SEND LOG** or **EXPORT** downloads the same log as `.json`. Put it in the session folder.
3. If sending fails, keep the device and **don't CLEAR it**; export it later. As a last resort, photograph the summary sheet.
4. For the next player, go back to *Before each player*, step 3.

## After the session (laptop, offline)
```
node tools/pt_report.cjs ~/naceca-session-1017/  > report.txt                          # the four answers, per player and across players
node tools/pt_report.cjs ~/naceca-session-1017/ --player P3 --around 14:32                # the events either side of a note
node tools/pt_report.cjs ~/naceca-session-1017/ --md report.md                            # the same report as Markdown, to send
```
Send the team the log folder, `report.md` and photos of your paper sheets.

**Observation sheet columns:** time · device and player · tag (A/B/C/D) · what happened · what they said (quote)
