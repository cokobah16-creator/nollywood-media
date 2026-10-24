# Playtest findings: `YYYY-MM-DD-<place>` (template)

The report the integration session writes after an observed session, from the zip the facilitators sent back
(`docs/PLAYTEST-PROTOCOL.md`, "What to send back"). Copy this file to `docs/PLAYTEST-FINDINGS-YYYY-MM-DD-<place>.md`,
fill every `…`, delete the instructions in *italics*. Keep the facilitators' words as quotes; keep the report's rows as the
report prints them.

*How to fill it:* unzip the folder next to the repo, then
```
node tools/pt_report.cjs <folder> --md <folder>/report.md               # the numbers below, per player and across players
node tools/pt_report.cjs <folder> --player B7QX·P3 --around 2026-10-31T14:32   # the events around a facilitator's note
node tools/pt_report.cjs <folder> --slice m2,h2,m3 --detail              # every encounter in full
```
*Players are keyed as the sheets name them (`B7QX·P3`). The same log sent twice counts once. A file that isn't a log is
skipped with a line saying why.*

*Rows the report prints that are not findings:* a `… · no player label` block holds the page's own events from a device
that wasn't cleared before its first NEW PLAYER (ignore it); `H2 Board NACECA van — proceed to…: SAVED · refused` is the
boarding press, classified after the scene had changed (not a failed interaction); `M2 · operations table: 0:03 open …`
measures only the real seconds the table was open in the harness dry run, on devices it is the player's time.

## Session
- Date, place, facilitators: …
- Build: `…` (the report's lead line prints it, `build 367a376c39`), page served from …
- Players: … (N; phones …, desktops …; M2 starts …, full starts …)
- Hints when stuck default this session: On / Off (per player below)
- What the facilitators flagged on the spot (FROZEN / RESTARTED / INTERVENED rows with their times): …

## Per player

*One block per player, in the order they played. "Report" is the row as `pt_report.cjs` prints it; "Sheet" is the
facilitator's note (quote it, with its HH:MM) that explains or contradicts it. Where the sheet and the report disagree,
the sheet wins and the disagreement is itself a finding (the thresholds sit in `src/tactics/tac_pt_report.js`: `R.LOST`,
`R.INVEST`, `R.READ_MIN`, `R.READ_PER_WORD`).*

### B7QX·P3
| | |
|---|---|
| Start | full / M2 |
| Device | phone / desktop, model, … × … |
| Hints when stuck | On / Off |
| First load | … s (from the sheet's header) |
| Played | … (the report's lead line: `6:18 played · finished M2, H2, M3`) |

**Where did they get lost?** Report verdict: `…`
- Report: `M2 · operations table: … van refused ×…, stuck at the table ×…` · Sheet: "…" (HH:MM) · Read the 90 s help line: yes / no / not shown
- Report: `…` · Sheet: "…"

**Which interactions failed?** Report verdict: `… of … presses failed (…%)`
- Report: `×… M2 …: … · refused` · Sheet: "…" (HH:MM)

**Did they understand why they were seen?** Report verdict: `…` · stamp: ASK THEM / NO READ DATA / LIKELY UNDERSTOOD
- Report: `M2 KC: "…" · on screen … s of … s needed` · Sheet (C rows): looked at the eye: yes / no · said why: "…" · moved differently after: … · called it unfair: …
- Debrief (if ASK THEM): "…"

**Did they use more than one approach?** Report verdict: `…`
- Report: `M2 KC · chosen: …; result: …` · Sheet (D rows): "…"
- Report: `M3 Entry · chosen: …` · briefing choices: …
- Retried a different way: …

**The two questions** (verbatim; typed in the game, or from the sheet / `answers-B7QX-P3.txt` if said aloud)
1. "…"
2. "…"

### …·P… 
*(repeat)*

## Across players
*From the report's `ACROSS N PLAYERS` block, with the sheets beside it.*
- **Lost:** `M2 · …: lost …/N (…), slow …, median …` — where more than one player lost time, and what the sheets say they were looking for: …
- **Failed interactions:** `… players, ×… M2 …` — the presses that failed for several players: …
- **Being seen:** stamps `ASK THEM ×…, LIKELY UNDERSTOOD ×…, NO READ DATA ×…`; by cause: `sight: … alarms across … players; on screen long enough …/…`; who called it unfair: …
- **Approaches:** `2 or more: … · one: … · none recognised: …`; which families appeared, and which never did: …
- **M2 start against full start:** anything that differs and depends on capabilities (compare like with like): …
- **Phones against desktops:** thumbs on CROUCH/SPRINT, rotation, unreadable text, first-load seconds (phones … s, desktops … s): …

## The two questions, verbatim, every player
| Player | Most satisfying decision | Felt unfair |
|---|---|---|
| B7QX·P3 | "…" | "…" |

## What to change next (ranked)
*One line each: the change, the evidence (players and rows), the cost. The first three are the next build's work.*
1. … — seen in …/N players (`…`) — …
2. …
3. …

## What only real devices showed
*Things the harness cannot see: rendering, frame rate, heat, thumbs, glare, the share sheet, the real first-load time,
audio. Each with the device and the sheet's note.*
- …

## Open decisions this session informs
- Hints when stuck on Senior Agent (default On today): what the sheets say about the 90 s table help and the 60 s field hint: …
- Thresholds to recalibrate in `tac_pt_report.js` (which rows the sheets contradicted): …
- Phone streaming (first-load seconds above): …
