# Telemetry and the observed playtest kit (plan, "Measuring it")

Design spec, written against `claude/naceca-bundle-integration-133395 @ 261a000`. Every file:line below was checked against that
commit. Nothing under the repo was modified (`git status` is clean). The scratch prototypes, fixtures and screenshots are in
`design/telemetry/` (§B).

**Drift check.** While this was being written the branch moved to `74a0c96` (merge of main). The only changes are in
`v12_pt.js` and `pt_logger.cjs`:
- `v12_pt.js`: the pending-survey timer grew by 4 lines (now :297-310: no question during a chase, or in a save that hasn't
  finished the slice). Every line this spec cites up to :296 is unchanged, and none of the edits below touch that block.
- `pt_logger.cjs`: one more block of asserts for that timer (:138-149). It runs a `startChase`/`stopChase` with no-op callbacks;
  the `chase_end.how/by` and "no `away` in chases" changes here don't affect it.

It builds on the two sibling specs in this folder:
- **`foundations.md`** owns `TAC.sight` and emits `seen`, `evaded`, `radio`, `tac_mission` and `geo_drift`.
- **`market.md`** owns `tac_market.js` and emits `enc m2_tunde`, `enc m2_kc`, `order`, `ally_done` and `m2_summary`.

This spec owns three things:
- the logger itself (`src/v12/v12_pt.js`);
- the event **contract** that all three tactics files write to (including the mansion's, whose spec isn't written yet);
- the playtest kit: what the facilitator sees, the offline analysis script, and the protocol.

---

## 0 · In one paragraph

The game already keeps a playtest log on the device. This build changes what that log can answer.

**For the players:** nothing they see changes. They still get the two questions at the end of the slice, as today.

**For the facilitator, in Settings › PLAYTEST:**
- **NEW PLAYER** labels everything that follows as P1, P2 and so on.
- **Summary › VIEW** opens a manila sheet that answers the product owner's four questions for that player:
  - where they got lost;
  - which presses failed;
  - whether they had time to read why they were seen, and whether they did the same thing again;
  - whether they used more than one approach.
- **SEND LOG** opens the phone's share sheet, or downloads the log on a desktop.

**After the session,** `node tools/pt_report.cjs <folder>` prints the same four answers per player and across players. It runs
offline and reads the exported files. The answers come from one shared analyser file, so the phone and the laptop always agree.

**The logger also gets cheaper and safer:**
- Its write cost stops growing with the log.
- A runaway event type can't evict the whole history.
- It can never cost a player their save.

**The tactics layer writes to one contract** (`seen`, `seen_read`, `evaded`, `order`, `ally_done`, `enc`, `m2_summary`,
`m3_summary`) through `V12.log` only. There is no second analytics system and no network.

### Measurements that shaped it (4 harness runs against `naceca.html` + node, §B)

**Event sizes** (run 1, real M2 events from the shipped logger, with the planned tactics events at full shape):
- Today's events: `interact_result` 282 chars on average, `interact_miss` 212, `obj_done` 228, `chase_end` 166, `session` 391.
- Planned events: `seen` 475, `enc` 502, `m2_summary` 669, `seen_read` 138, `evaded` 159, `order` 177, `ally_done` 143.

**Today's write cost at the 3000-event cap:**
- The log is 726,451 chars at the cap.
- A write parses, stringifies and sets the whole key: 5.6 + 4.3 + 4.3 ms (run 1).
- Timing 12 `V12.log` calls, one of which triggers the synchronous write: median **9.1 ms**, max **16.9 ms** (run 3), on desktop
  Chromium. That is every 12 events. A phone is roughly 4–6× slower, so ~35–100 ms per write: visible hitches in a chase.
- The logger runs for every player of the public build, not only in playtests, so long-lived logs reach the cap.

**Chunked store prototype** (run 3; the newest 300 events under today's key, older events in write-once 200-event chunks):
- Per write at 3000 events: median **0.6 ms**, tail max 1.4 ms, 5.0 ms on a chunk rotation (once per 200 events).
- Reading all 3000 events: 2.9 ms.
- Migrating a full v1 log: 7.8 ms, one-off, 3001/3001 events kept.
- Writing on to 6000 events keeps 3612 of them in 872,934 chars, under the 900,000 budget.

**Quota and saves** (run 3):
- The Chromium origin holds 5,242,866 chars (run 1).
- With the origin full, a log write today throws, and `write()` silently drops the buffer (v12_pt.js:17,
  `catch(e){ buf = []; }`). The prototype drops the oldest chunk instead, logs `pt_trim` and keeps all 400 new events.
- With the origin full, `saveGame` today toasts **SAVE FAILED** (state_save.js:11). With the safety-net wrap it frees log
  chunks, saves, and shows no failure toast.

**The other keys on the origin:** a fresh save is 2,027 chars and achievements 48 (run 1).

**Analyser:** 15.7 ms median for 3600 events in node (desktop).

**Summary sheet prototype** (runs 2 and 4):
- Checked at 390×844 and 844×390 on touch, and at 1280×800 with desktop styles.
- It fits with ≥ 16 px gutters and has no sideways scroll. Every button is ≥ 44 px on touch.
- It has no gradient, box-shadow, filter, text-shadow or backdrop-filter, and no emoji: five SVG icons only.
- BACK and SEND LOG stay on screen (a sticky action bar).
- The two-tap NEW PLAYER works.

**Node module type.** `/home/user/nollywood-media/package.json` has `"type": "module"` and `naceca/` has no package.json. So a `.js`
file under `naceca/` is ESM to node and can't be `require`d from a `.cjs` script. The CLI therefore loads the shared analyser
with `vm`, which the prototype does.

---

## 1 · What people experience

### 1.1 The player (phone and desktop)

**Nothing changes during play.**
- No new HUD, prompts, toasts or hints.
- The logger never writes into `S` (and never into `S.game.flags`, which `progressSig()` hashes at guidance.js:18-24, so it can't
  mask "stuck" or the 60 s hint).
- A log write costs about 1 ms on desktop (§0) instead of growing with the log.

**At the end of the slice** (the M3 aftermath, or `?slice=` as today) the existing manila sheet asks the two questions word for
word:
- "What was your most satisfying decision?"
- "What happened that felt unfair?"

This is unchanged (v12_pt.js:253-296).

**In Settings › PLAYTEST** a player sees two more rows, **Player** and **Summary**. The PLAYTEST group is visible to everyone today;
see open question 1, §9.

### 1.2 The facilitator, on a phone (390×844 portrait or 844×390 landscape)

1. **Pause › SETTINGS, scroll to PLAYTEST.** Four rows, each with ≥ 44 px buttons (paper.css:123):
   - **Player** · *"No player yet. Start one before you hand the device over."* · `NEW PLAYER`
   - **Summary** · *"Where they got lost, what failed, why they were seen, how they approached it."* · `VIEW`
   - **Playtest log** · *"312 events across 2 sessions, stored on this device only. Export it and send it to the team."* ·
     `EXPORT` `CLEAR`
   - **Two questions** · *"1 answer saved in the log."* · `ANSWER` (unchanged; pt_logger asserts this text)
2. **Tap NEW PLAYER.** The button reads `TAP AGAIN · START P1` for 4 s. A second tap starts P1. The note becomes *"P1 · 0 events
   since 14:02. Start a new player before you hand the device over."*
   - From now on, every event carries `p:'P1'`.
   - **CLEAR** works the same way (`TAP AGAIN · CLEAR`). Today a single tap wipes the log (v12_pt.js:73).
3. **Hand the phone over.** Title › NEW INVESTIGATION › SENIOR AGENT › BEGIN (casework.js:633-667).
4. **After the slice, Settings › PLAYTEST › Summary › VIEW.** A manila sheet (`cw-paper`) opens over the game:
   - **Header:** `PLAYTEST · SUMMARY`, then the title **P1**, then the lead *"Phone · Senior Agent · 38:12 played · finished M2,
     M3 · 312 events · build 349c21fbac"*. A toggle **P1 | WHOLE DEVICE** follows.
   - **Five sections**, each with an SVG icon (`route`, `cross`, `eye`, `people`, `doc`), the heading word for word, a bold
     one-line answer and up to 5 evidence rows in mono type:
     - **Where did they get lost?**
     - **Which interactions failed?**
     - **Did they understand why they were seen?** This answer carries a stamp: red `ASK THEM` or green `LIKELY UNDERSTOOD`.
     - **Did they use more than one approach?**
     - **The two questions** (the player's own answers).
   - **Action bar:** a sticky bar holds `BACK` and `SEND LOG`. It stays on screen in landscape (measured).
5. **Tap SEND LOG.** The share sheet opens with `naceca-playtest-P1-20261017-1432.txt` (a `text/plain` file; §7). Choose AirDrop,
   WhatsApp or Mail. If the share sheet isn't available, the file downloads as `.json` instead, through `V12.saveFile`.
6. **BACK** returns to Settings, and closing Settings returns to wherever Settings was opened from (the pause menu).

### 1.3 The facilitator, on a desktop (1280×800)

The same rows and sheet. The sheet is `min(640px, 100%)` wide and centred (320 px gutters measured). SEND LOG and EXPORT
download `.json` directly (`V12.saveFile`, v12_core.js:499-511). Inside the claude.ai viewer that goes through
`window.claude.use('downloads')`. Esc closes the sheet. There are no keyboard hints, so nothing needs hiding on touch.

### 1.4 What the sheet says (prototype output, synthetic player P2 on a phone, §B)

```
DID THEY UNDERSTAND WHY THEY WERE SEEN?
  Seen 3× · reason on screen 1.5 s+ for 0 of 3 · same reason again ×2   [ASK THEM]
  - M2 KC: "He saw you crossing the open road, standing" · on screen 0.7 s · repeated
  - M3 Obi: "He saw you by the cash table, standing" · on screen 0.7 s · repeated · seen again
  - M3 Obi: "He saw you by the cash table, standing" · on screen 0.7 s
  Felt unfair: "Obi saw me even though I was behind the sofa"
DID THEY USE MORE THAN ONE APPROACH?
  One: direct
  - M2 KC: seen, then tackled (direct)
  - M3 Entry: loud (direct)
  - M3 Obi: seen, then out the back
```
Rows use plain words ("seen, then tackled") and human names (KC, Obi, Entry), not ids or arrows. The prototype screenshot still
shows `→`; the shipped copy doesn't.

### 1.5 Feedback, hints and difficulty

- The summary is for the facilitator. It is never opened by the game, never shown during play, and it suggests nothing to the
  player. Recruit and Senior Agent see exactly the same game.
- The `ASK THEM` stamp is an instruction to the facilitator, for the debrief notes. The protocol forbids asking during play.

---

## 2 · Integration points

### 2.1 Files

| File | Status | What |
|---|---|---|
| `src/v12/v12_pt.js` | **edited** | the logger. Its storage (`KEY`, `buf`, `read`, `write`) and envelope are private to its IIFE (lines 9-306), so no later layer can change them: these edits are unavoidable. About +90 lines, listed in §2.2. |
| `src/v12/v12_pt_report.js` | **new** | (a) the pure analyser `V12.ptReport`, loadable in node through `vm`; (b) the two Settings rows and the summary sheet. Remove it and the logger still works. |
| `src/v12/v12.css` | **edited** | +25 lines after the survey block (v12.css:593-608): `#screen-pt-report`. The sheet shares the survey's selectors, so its styles belong next to them. |
| `build.py` | **edited** | line 86: add `"v12_pt_report.js"` after `"v12_pt.js"` in `V12_JS`. Alternative if reviewers want no v12 list edit: put it first in the foundations' `TACTICS_JS` (foundations §2.2); it needs only `V12` and the logger. |
| `tools/pt_report.cjs` | **new** | the offline analysis CLI (§5.3) |
| `docs/PLAYTEST-PROTOCOL.md` | **new** | the one-page facilitator protocol (Appendix A; also `design/playtest_protocol.md`) |
| `tools/harness/scenarios/pt_*.cjs`, `pt_lib.cjs` | **new** | §6 |
| `src/tactics/tac_sight.js`, `tac_market.js`, `tac_mansion.js` | owned by the sibling specs | they call `V12.log` with the contract in §4.4. The requests to them are listed in §2.5. |

### 2.2 `src/v12/v12_pt.js`, line by line

| Line(s) @261a000 | Today | Change | Why here |
|---|---|---|---|
| 12 | `KEY = 'naceca_pt_v1', CAP = 3000` | constants of §3.1 (`LIVE_MAX`, `CHUNK`, `BUDGET`, `CEIL`, `COALESCE`, `MAX_CHARS`) | the store |
| 15-17 | `read()` parses the whole key, `write()` re-stringifies it, and a failure drops `buf` | the chunked store (§3.1 code): `readLive`, `readAll`, `write` (rotate, budget, quota retry), `clearAll`, a chunk index cached per page load | measured 9.1 → 0.6 ms median per write. Today's quota failure silently loses events. |
| 18-22 | `V12.log` builds `{t,sid,type,m,d}` and writes at 12 | the envelope gains `p` (player label, when set). Per-page-load ceilings (`CEIL`), coalescing (`COALESCE`, adds `d.n`) and the size guard (`MAX_CHARS`) run here, before the push. **Still a synchronous write at 12**, because pt_logger's `flush()` depends on it (pt_logger.cjs:5). | the only place that sees every event before it is stored |
| 25 | 20 s interval: `write(); flush()` | also logs `pt_dropped` when the ceiling tally has changed | |
| 31-38 | `quit` → `write(); flush()` | also logs a pending `pt_dropped` | |
| 39-40 | `pagehide`, `visibilitychange` | + a debounced `resize` listener (1.5 s): logs `orient` when the touch orientation flips | phone portrait/landscape is a named requirement |
| 42-46 | the `session` payload | + `ptv:2, player, orient, slice:V12.PT_SLICE_END` | the analyser tells v1 from v2 logs and splits players |
| 48-53 | `V12.ptExport`: pretty JSON through `V12.saveFile` | compact JSON with `{game, ptv:2, build, src, player, exported, events}`. Touch with `navigator.canShare({files})` → the share sheet with a `text/plain` `.txt` File (the v12_share.js:77-80 pattern). Otherwise `V12.saveFile(name.json)`. Logs `pt_export {via, events, chars, file}`. The file name is `naceca-playtest-<label or device>-<YYYYMMDD-HHMM>`. | phones can't attach a downloaded file easily, and Chrome's share sheet refuses `.json` (§7) |
| 54-60 | `V12.ptSummary()` | same return shape, read through `readAll()` | Settings note counts |
| 61-77 | Settings rows | `CLEAR` becomes two taps (`TAP AGAIN · CLEAR`, 4 s) and clears the live key and every chunk, keeping `naceca_pt_player`, the save and settings | a single tap wipes everything today |
| 96-98 | wrapper adds `dev` | + `ps` (play seconds since page load, `Math.round(PT.play/1000)`). Counts `seen` alarms and notices on the current objective (`PT.o.seen`, `PT.o.notices`). | the sheet reports **played** time. Wall time across a device spans players and days (prototype artefact: "9663:27 on the clock"). |
| 108-109 | `objStart` | + `seen:0, notices:0` | |
| new, after 106 | — | `V12.ptLabel()`, `V12.ptPlayer(label)` (stores `{label, at}` in `naceca_pt_player`, logs `pt_player` with the session payload, resets `PT.totals`), `V12.ptEvents()` (`write()` then `readAll()`) | NEW PLAYER and the sheet |
| 151-159 | `toast` wrap | + while `PT.inSave`, swallow `SAVE FAILED` and set `PT.saveFailed` | the save safety net |
| new | — | `V12.wrap('saveGame', …)`: run the original; while `PT.saveFailed`, free the oldest chunk (then half the live key) and retry. If nothing is left to free, raise the real `SAVE FAILED` toast. | "the log never costs a save" (run 3) |
| 165-169 | `obj_done` | + `txt` (objective text ≤ 48), `seen`, `notices` | readable rows |
| 187 | `chase_end` | + `how:(c && c.how) \|\| null, by:(c && c.by) \|\| null` | market §2.4's optional one-line hook, taken. `tac_market.js` sets them before `c.onCaught`. |
| 240-241 | `stuck` | + `txt`, `want` (the tracker label ≤ 48), `px`, `pz` | where on the map; in M3 `obj` points at the child while the wipe runs (SCOPE §M3 logging) |
| 242-247 | `away` | + `px`, `pz`. **Not logged while `CHASE.active`**: KC running away raises the target distance and would read as the player walking off. | false "lost" signals in chases |

Untouched: the beacon (`PT_ENDPOINT`, :13, :26-30) stays dormant and nothing sets it; the survey (:253-304); the
`interact_result` classifier (:115-149); `V12.enc` (:201).

### 2.3 `src/v12/v12_pt_report.js` (new)

**The pure part** (no DOM): `V12.ptReport = R` in the page, `PT_REPORT` on a `vm` sandbox in node. Prototype:
`design/telemetry/proto_report.js`, 256 lines.
- `R.normalize(input, file)`: accepts `{events}`, a bare array, or the `.txt` share file (the same JSON). Drops malformed events
  and sorts by `t`.
- `R.players(events)`: groups by `file + p`. With no `p`, it uses the latest `pt_player` marker in the same file, else the file.
- `R.analyze(events)` → `{meta, lost, failed, detection, approaches}` (the rules in §5.1).
- `R.text(res, label)`, `R.across(list)`, `R.acrossText(A)`: plain-text renderers shared with the CLI.
- `R.lostLine`, `R.failLine`, `R.seenLine`, `R.encLine`: the row strings the sheet also uses.
- Tables as data: `R.FAMILY`, `R.ALLY_ACTS`, `R.PLAN_CAUSES`, `R.READ_MS`, `R.NAMES`, `R.DETECT_WORDS`.

**The UI part** (only when `document` exists). Prototype: `design/telemetry/proto_sheet.js` + `proto_sheet.css`.
- `V12.wrap('renderSettings', …)` (settings.js:177). It loads after v12_pt.js, so it wraps outside v12_pt's own wrap
  (v12_pt.js:61). It inserts the **Player** and **Summary** rows directly after the `PLAYTEST` `.set-group`, using the existing
  `.set-row/.set-label/.set-note/.set-ctl/.seg` markup (styles.css:540-548).
- `V12.ptReportOpen()` builds `#screen-pt-report` (a `.overlay` in `#game-root`):
  - It saves the global `_settingsReturn` (settings.js:212) before `showOverlay(null)`.
  - BACK calls `openSettings()` (:213) and then restores `_settingsReturn`, so closing Settings still returns to the pause menu.
  - A capture `keydown` handler closes the sheet on Escape, the pattern of v12_pt.js:282-287.
- Uses `icon()` (beta/icons.js:8: `route` :38, `cross` :17, `eye` :39, `people` :20, `doc` :33, `back` :10, `share` :49),
  `V12.esc`, `V12.el`, `V12.ptEvents`, `V12.ptLabel`, `V12.ptPlayer` and `V12.ptExport`.

### 2.4 `build.py` and the CSS

- **build.py:84-86:** `V12_JS = [..., "v12_pt.js", "v12_pt_report.js", "v12_boot.js"]`. The existing loop at :151-157 inlines
  it, and the `</script` guard applies.
- **v12.css, after :608:** the `#screen-pt-report` block in `proto_sheet.css`, plus the run-2 fixes:
  - `.touch-active #screen-pt-report .pt-scope button{min-height:44px}`: the toggle measured 36 px before the fix.
  - `#screen-pt-report .cw-head + .pt-sec{border-top:0}`: no double rule under the head.
  - A tighter action bar under `@media (max-height:480px)`.

  All colours are palette variables: `--manila`, `--ink`, `--green` (SEND LOG and the LIKELY UNDERSTOOD stamp), `--red` (the ASK
  THEM stamp) and `--grey` (row rules). There are no gradients, glows, blur or shadows.

### 2.5 The contract with the tactics layer: who calls `V12.log`, and three requests

| Emitter | Events | Status |
|---|---|---|
| `tac_sight.js` (foundations) | `seen`, `evaded`, `radio`, `tac_mission`, `geo_drift` | as foundations §4, plus **request 1** |
| `tac_market.js` (market) | `enc m2_tunde`, `enc m2_kc`, `order`, `ally_done`, `m2_summary`; sets `c.how`/`c.by` before `c.onCaught` | as market §4; it already sets `c.how`/`c.by` (market §2.4), which v12_pt.js:187 now reads |
| `tac_mansion.js` (mansion) | `enc m3_entry`, `enc m3_obi`, `enc m3_laptop`, `enc m3_child`, `order`, `ally_done`, `m3_summary` | **request 3**: the vocabulary in §4.4 is this spec's proposal, written before the mansion spec |

1. **`seen_read`, to foundations.** When the frozen past-tense alarm line ("He saw you …") stops being visible, emit `seen_read`
   once per alarm with the play-time ms it was on screen and why it ended (§4.4). This is the only signal for "did they have time
   to read why". `tac_sight.js` owns the eye, so only it knows when the line leaves.
2. **`evaded.mix`, to foundations** (optional). Seconds per drain reason while the suspicion drained:
   `{cover, crowd, distance, cone, dark, browse}`.
3. **The mansion vocabulary**, to the mansion spec: the field values in §4.4 and the family table in §3.4. If the mansion spec
   names things differently, only `R.FAMILY` and the m3 rows of §4.4 change.

All tactics events go through `V12.log`, so they get `dev`, `ps`, `p`, the ceilings and the size guard automatically. None of them
logs per tick (foundations and market both state this).

### 2.6 State read and written

**localStorage**

| Key | Contents |
|---|---|
| `naceca_pt_v1` (live) | the newest ≤ 300 events, **the same format as today** (a JSON array of `{t,sid,p?,type,m,d}`) |
| `naceca_pt_v1~a<t36>.<sid>` | write-once chunks of 200 events. `t36` is the first event's `t` in base 36, padded to 9 characters, so the key order is chronological and two tabs never collide. |
| `naceca_pt_player` | `{label, at}`, the facilitator's label. It survives reloads and CLEAR. |

**What is read:**
- `S.game.objectives`, `currentMission`, `completedMissions`
- `ENGINE.player.position`, `ENGINE.movementEnabled`
- `WAY.resolve()` and `WAY._guideState`
- `CHASE.active` (`.how`, `.by`, `.bumps`)
- `SETTINGS.*`, `gameDifficulty()` (settings.js:48)
- `V12.version`, `window.NACECA_BUILD.src`
- `document.body.classList.contains('touch-active')`

**What is written to the game state:** nothing new in `S`. The existing `S.game._ptAsked` (the survey, once per save) is
unchanged.

### 2.7 Compatibility

- **Old saves.** The logger stores nothing in `S`, so saves load exactly as before.
- **Old logs on the device.** The v1 key *is* the live key. On the first write, everything beyond 300 events rotates into chunks:
  measured 7.8 ms one-off, 3001 of 3001 events kept. Old events have no `p`, `ps` or `ptv`.
- **Old exported files.** The analyser takes v1 events, with no `p`, `ps` or tactics events (fixture `deviceC-old.json`). Detection
  and approaches then say *"No detection data in this build"* and *"No encounter data in this build"*.
- **pt_logger.cjs** reads `naceca_pt_v1` directly as an array (:4) and forces a write with 13 logs (:5). Both still hold: the live
  format is unchanged, the synchronous write at 12 is kept, and the scenario logs far fewer than 300 events, so nothing rotates.
- **Two tabs.** The live key is re-read on every write, as today, and chunk keys carry the sid, so nothing is overwritten.

### 2.8 Wrap order with v13, the beta and the tactics layer

Later layers wrap outside. This is relevant only where two wraps meet:
- **`startChase`** (pressure.js:60). From the inside out: v12_core.js:266 (logs `chase`), v12_pt.js:182 (`chase_end`), chase.js:156
  (the ribbon), then the foundations' KC path swap and `tac_market` (outermost).
  - `tac_market` sets `c.how` before calling the `c.onCaught` that v12_pt chained, so `chase_end` sees it.
  - A cold grab returns no chase, so it logs neither `chase` nor `chase_end`. `enc m2_kc` records it instead (market §4).
- **`completeMission`** (mission_flow.js:206). v12_pt.js:177 is inner; foundations' `tac_mission` and the market's and mansion's
  summaries wrap outside it. The order of events at the van is `m2_summary` → `tac_mission` → `mission_end {silent}`.
- **`renderSettings`**: v12_pt.js:61, then v12_pt_report.js. Nothing else wraps it.
- **`showAftermath`**: v12_core.js:111, v12_share.js:90, v12_pt.js:288, then casework.js:525. Unchanged; the survey still opens
  over the aftermath (pt_logger asserts it).
- **`toast`** (util.js:11): v12_pt.js:151. `tac_market` wraps it outside to rewrite chase toasts before v12_pt records them
  (market §2.3), so `interact_result.toast` is the text the player saw.
- **`saveGame`** (state_save.js:7): wrapped only by v12_pt (new). v13 and the beta call it through the global name, so their saves
  go through the safety net too.
- **v13** (`v13_briefing.js:24`, `v13_intel.js:252/502`) and **casework** (`casework.js:24`) call `V12.log` through small `log()`
  helpers. They are unchanged, and their events get `p` and `ps`.

---

## 3 · Data and constants (first pass, with the reason for each)

### 3.1 Storage

| Constant | Value | Why |
|---|---|---|
| `LIVE_MAX` | 300 events | Keeps today's key format for pt_logger and any ad-hoc reader. Writing ≤ 300 events costs 0.6 ms median (run 3). |
| `CHUNK` | 200 events (~50k chars) | Written once. A rotation costs ≤ 5 ms on desktop, once per 200 events. |
| `BUDGET` | 900,000 chars across the live key and all chunks | Today's cap holds 3000 × ~242 = 726k chars, so this keeps the same history: 3612 events measured. Chromium's origin holds 5.24M chars. Safari's 5 MB is smaller (assume ~2.5M chars), and GitHub Pages shares one origin across a user's project pages. 900k leaves ≥ 1.6M chars of headroom for the save, which is 2k fresh and tens of k late. |
| quota retry | up to 8 attempts: drop the oldest chunk; with none left, drop the oldest half of the live key | never discard the new buffer (run 3: 400/400 new events kept) |
| `pt_trim` | at most one per write, with the total dropped | today's write logs nothing when it loses events |
| save safety net | on `SAVE FAILED` inside `saveGame`, free chunks one at a time and retry; if nothing is left to free, show the real toast | measured: today SAVE FAILED; wrapped, saved with no toast |

```js
// v12_pt.js:15-17, replaced (sketch; the prototype is design/telemetry/proto_store.js)
const A = KEY + '~a'; let arch = null;   // [[key, chars, n]] oldest first, scanned once per page load
function write(){
  if(!buf.length) return;
  let L = readLive().concat(buf); buf = [];
  for(let tries = 0; tries < 8; tries++){
    try{
      while(L.length > LIVE_MAX){ const ch = L.slice(0, CHUNK); setChunk(ch); L = L.slice(CHUNK); }   // write-once
      if(trim.n) L.push(envelope('pt_trim', { dropped:trim.n, reason:trim.reason })), trim.n = 0;   // dev + ps, like any event
      const s = JSON.stringify(L);
      while(chunks().length && chunkChars() + s.length > BUDGET) dropOldest('budget');
      localStorage.setItem(KEY, s); return;
    }catch(e){ if(!dropOldest('quota')){ const n = Math.ceil(L.length / 2); L = L.slice(n); trim.n += n; trim.reason = 'quota'; } }
  }
  buf = L.slice(-LIVE_MAX);   // storage refused 8 times: keep the newest in memory for the next try
}
```

### 3.2 Volume caps (per page load, i.e. per `sid`)

| Type | Ceiling | Coalescing (`d.n` counts the folded events) |
|---|---|---|
| `interact_miss` | 300 | same `near` + `why` within 1.5 s → one event (a frustrated thumb tapping ACTION) |
| `blocked` | 200 | same `big` + `small` within 5 s |
| `js_error` | 30 | same `msg` + `line` while still unwritten. A per-frame exception would otherwise log 60/s (v12_boot.js:35) and evict the whole history in under a minute. |
| `seen` | 80 | none here (foundations already limits it to one per watcher per level per 10 s) |
| `seen_read`, `evaded` | 60 each | — |
| `radio` | 150 | — |
| `orient` | 30 | 1.5 s debounce |
| `interact_result` | 800 | — |
| everything else | 600 | — |

Over a ceiling, events are counted, not stored. The counts are logged as `pt_dropped {byType}` on the 20 s tick, on `hidden` and on
`pagehide`, only when they changed.

**Expected volume per player slice** (M2 + hub + M3), estimated from per-feature rates:
- `interact_result` 40–80, `interact_miss` 5–40 (coalesced), `choice` 15–25, ops and casework 10–30, `obj_done` ~12,
  `evidence` ~10.
- `seen` 2–15, `seen_read` 0–4, `evaded` 0–6, `enc` ~6, `order` 1–4, `ally_done` 1–8, `radio` 5–20.
- Summaries 2, survey 1, plus a few `stuck`, `away`, `hint`, `quit` and `orient`.

That makes **≈ 150–350 events, ≈ 40–90k chars per player**. The ceilings never bind in normal play; they exist for loops and
mashing. A device holds 10 or more players under the budget.

### 3.3 Size guard

`MAX_CHARS` = 1500 per event; `survey` and `pt_player` get 4000. Over the limit, strings longer than 200 chars are cut (the survey's
answers are exempt; the textareas already cap them at 600, v12_pt.js:260-261), arrays are cut to 24 items with a `+N` marker, and
the event gets `trunc:true`. The largest planned event is `m2_summary` at 669 chars (run 1).

### 3.4 Thresholds for the four answers (`R.*`, one table to recalibrate after the first session)

| Name | Value | Why |
|---|---|---|
| lost score | `3·stuck + 2·hint + 1·away + 2·[eff<0.4 ∧ walked≥25 m] + 3·[quit counted] + 1·[≥3 taps on nothing]` | `stuck` is the game's own 90 s without progress (v12_pt.js:240) and the strongest sign. `hint` is the game's own 60 s threshold (guidance.js:104). `away` is "walked > 10 m while the target got > 8 m further" (v12_pt.js:246). eff < 0.4 means 2.5× the straight line. |
| lost / slow | score ≥ 3 → **lost**; score ≥ 1 or secs ≥ 180 → **slow** | one `stuck` on its own is lost |
| quit counts | `secsOnObj ≥ 60` and the previous event is not a survey or `mission_end` within 30 s | closing the tab after the questions isn't "lost" (fixed in the prototype) |
| `READ_MS` | 1500 ms on screen | a 6–9 word line at adult reading speed (about 250 wpm) takes about 1.5–2.2 s |
| repeat | a later alarm with the same cause and the same posture (crouched/standing × still/moving), any watcher | the same mistake in M2 and M3 counts |
| `PLAN_CAUSES` | `knock`, `loud`, `tipped` | Obi alerted by the player's own plan choice, or a leaked warrant, isn't "being seen". Listed, not judged. |
| `DETECT_WORDS` | `saw\|seen\|see me\|spott…\|notic…\|detect…\|caught me\|made me\|through a wall\|eye\|stealth\|crouch…\|hid…\|cover` | flags an "unfair" answer that is about detection |
| stamps | `ASK THEM` if any alarm was on screen < 1.5 s, any repeat, or an "unfair" answer about detection; `LIKELY UNDERSTOOD` otherwise | evidence for the facilitator, never a verdict |
| `FAMILY` (approaches) | `m2_kc.approach` cold, soft → stealth; seen, bolt → direct · `m2_kc.how` cutoff, boxed → intercept; uche → Uche; tackle → direct; cold → stealth · `m2_tunde.choice` quiet → preparation · `m3_entry.entry` knock, loud → direct; quiet → stealth · `m3_entry.door` gate → preparation · `m3_entry.power` cut → preparation · `m3_obi.outcome` cold → stealth; intercepted → intercept; covered, blocked_by_uche → Uche · `m3_child.by` uche → Uche | a tackle after following him is "direct", not a second approach (fixed in the prototype). The values are from market §3.7 and §4.4 here. |
| Uche counts as an approach | at least one player `order` (any `src` except a default) **and** at least one act (`veer`, `tackle`, `box`, `callout`, `escort`, `cover_held`) in the same mission | an automatic callout from an unposted Uche isn't the player's choice |
| more than one approach | 2 or more distinct families across the player's encounters | plus a note when the same encounter was retried with a different approach |
| `NAMES` | kc → KC, obi → Obi, m2_tunde → Tunde, m2_kc → KC, m3_entry → Entry, m3_obi → Obi, m3_laptop → Laptop, m3_child → The child | readable rows |

---

## 4 · Telemetry events (all through `V12.log`)

### 4.1 Envelope

`{ t, sid, p?, type, m, d }`, where `d` always carries:
- `dev: 'touch'|'desk'` (today, v12_pt.js:98)
- `ps`: play seconds since page load (new)
- `n`: when coalesced

`p` is the facilitator's label (new; absent when no label has been set).

### 4.2 Existing events, amended (emitted by v12_pt.js)

| Event | Today | Adds |
|---|---|---|
| `session` (:43-45) | ua, w, h, dpr, touch, build {ver, src}, settings {marker, hints, difficulty, timed, casework} | `ptv:2`, `player`, `orient`, `slice`, `settings.crouch` (if the foundations row exists) |
| `obj_done` (:165-169) | id, secs, walked, direct, eff, backtracks, arrowPct, towardPct, hints, misses, refusals | `txt`, `seen` (alarms while this objective was current), `notices` |
| `stuck` (:241) | obj, secs, dist, moved, guide, arrowPct | `txt`, `want`, `px`, `pz` |
| `away` (:246) | obj, from, to | `px`, `pz`; not logged while `CHASE.active` |
| `interact_miss` (:124) | near, dist, range, why, obj, want | `n`, `tLast` |
| `blocked` (:156) | big, small, obj | `n` |
| `js_error` (v12_boot.js:35, not edited) | msg, src, line | `n` (coalesced in the logger) |
| `chase_end` (:187) | label, outcome, secs, bumps, maxGap, lastSeenSecs | `how: 'tackle'\|'cutoff'\|'boxed'\|'uche'\|null`, `by: 'player'\|'uche'\|null` |

Unchanged and relied on: `mission_start`/`mission_end` (v12_core.js:382/129, v12_pt.js:178 silent), `interact_result` (:144),
`hint` (:155), `choice` (:211), `wipe_end` (:224), `quit` (:34), `survey` (:270/:273), `plan_m3` (v12_plan.js:135), `chase`
(v12_core.js:271), `evidence`, `tip`, `new_game` (casework.js:662).

### 4.3 New logger events (v12_pt.js)

| Event | When | Fields |
|---|---|---|
| `pt_player` | NEW PLAYER (second tap) | `label, prev`, plus the session payload (`w, h, touch, orient, settings`) |
| `pt_export` | every export attempt | `via: 'share'\|'claude'\|'link'\|'declined'\|'failed'`, `events`, `chars`, `file` |
| `pt_trim` | the store dropped old events | `dropped, reason: 'budget'\|'quota'\|'save'` |
| `pt_dropped` | a ceiling's tally changed (20 s tick, hidden, pagehide) | `byType: {type: n}` |
| `orient` | the phone rotated during play (touch only, 1.5 s debounce) | `o: 'portrait'\|'landscape'`, `w`, `h` |

### 4.4 The tactics contract (emitted by `src/tactics/*`; this spec owns the schema)

All values are short strings or numbers, distances in metres to 0.1, times in play seconds unless the field name says `ms`.

| Event | Emitter, when | Fields |
|---|---|---|
| `seen` | tac_sight; a watcher crosses notice (35) or alarm (100), or `reset(v, {cause, why})` crosses one (market §2.5); ≤ 1 per watcher per level per 10 s | `who` (`'kc'\|'obi'`), `enc`, `level: 'notice'\|'alarm'`, `cause: 'sight'\|'noise'\|'close'\|'scan'\|'fumble'\|'tunde'\|'tunde_glance'\|'knock'\|'loud'\|'tipped'`, `dist`, `ang` (degrees off his facing), `los: 'clear'\|'low'\|'tall'\|'none'`, `cover` (the box name or null), `crouch`, `gait: 'still'\|'sneak'\|'walk'\|'jog'\|'sprint'`, `lit: 'lit'\|'dark'`, `crowd` (a bystander within 1.7 m), `inCone`, `parts: {sight, noise, close}`, `peak`, `ms` (since first gain), **`why` (the exact line shown under the eye)**, `place`, `px`, `pz`, `obj`; the market adds `phase`, `scanned`, `post`; the mansion adds `obi` (his state), `entry`, `power` |
| `seen_read` | tac_sight; the frozen alarm line leaves the screen (**request 1**) | `who, enc, ms` (play-time ms visible), `end: 'overlay'\|'hidden'\|'replaced'\|'scene'\|'timeout'\|'quit'` (timeout at 8 s) |
| `evaded` | tac_sight; suspicion falls below 5 after a notice, without an alarm | `who, enc, peak, secs, how: 'cover'\|'crowd'\|'distance'\|'cone'\|'dark'\|'browse'` (the dominant reason), `crouchPct`, `mix` (request 2) |
| `order` | tac_market / tac_mansion; the player gives Uche an order (each choice) | `who:'uche'`, `order: 'post'\|'follow'\|'cover'\|'take_child'\|'hold_rear'`, `post?: 'corner'\|'back'\|'van'`, `prev?`, `withTip?`, `src: 'talk'\|'plan'\|'button'`, `ok`, `obj`, `t` |
| `ally_done` | the same; Uche arrives or acts | `who:'uche'`, `task: 'arrive'\|'veer'\|'tackle'\|'box'\|'callout'\|'cover_held'\|'escort'`, `outcome?: 'done'\|'cancelled'\|'failed'`, `post?`, `secs`, `lane?` (callout), `d?` (tackle distance). At most 1 arrive, 1 veer, 1 tackle or box and 4 callouts per M2 run (market §4). |
| `enc m2_tunde` | tac_market; the Tunde conversation ends | as market §4: `side, seen, dist, ang, crowd, bark, choice: 'quiet'\|'loud'\|null, tip, habit, kcStart` |
| `enc m2_kc` | tac_market; catch (any how) or escape | as market §4: `approach: 'cold'\|'soft'\|'seen'\|'bolt'\|'legacy'`, `outcome: 'caught'\|'escaped'`, `how: 'cold'\|'tackle'\|'cutoff'\|'uche'\|'boxed'\|'escaped'`, `susp, level, exposed, gap, scanSeen, side, secs, bumps, bumpsLane, trust, cutsShown, cutReached, ribbon`, `prep: {tip, habit, post, posted, pursuit, tier, greyman, sources}`, `uche: {post, arrived, role}` |
| `enc m3_entry` | tac_mansion; on-site play starts (the `mansion_pre_breach` dialogue ends) | `entry: 'knock'\|'quiet'\|'loud'`, `door: 'front'\|'gate'`, `power: 'on'\|'cut'`, `uche: 'with'\|'rear'`, `armed` (the wipe started at entry), `obi: 'unaware'\|'alerted'\|'stunned'`, `spawn: [x, z]`, `wipeTotal`, `prep: {sims, kcFair, tip, tipped, warrant}` |
| `enc m3_obi` | tac_mansion; the arrest dialogue opens, or he gets out the back | `approach: 'unseen'\|'seen'\|'knock'\|'loud'\|'tipped'`, `alertedBy` (a `seen` cause or null), `outcome: 'cold'\|'intercepted'\|'covered'\|'blocked_by_uche'\|'out_back'`, `by: 'kelechi'\|'uche'\|'perimeter'`, `secs` (since breach), `runSecs`, `dist`, `duringMinigame`, `states: [[state, s], …]` (≤ 8), `prep`. Canon holds: `out_back` still ends in the arrest. |
| `enc m3_laptop` | tac_mansion; halt, loss, forced shutdown, or extraction with the wipe never armed | `outcome: 'halted'\|'lost'\|'forced'\|'never_started'`, `pct`, `files` (the count saved, plan item 17), `total`, `firstAt` (s from breach to the first laptop press), `mg: {strikes, secs, yank}` (`wipe_end`, v12_pt.js:224, stays as well) |
| `enc m3_child` | tac_mansion; she is outside, or extraction with her inside | `choice: 'gentle'\|'stay'\|null`, `by: 'kelechi'\|'uche'\|null`, `outAt`, `calm` (the Street Sources line) |
| `m2_summary` | tac_market; `completeMission('m2')`, once per run | as market §4 (`kc, how, approach, scanSeen, alarms, notices, suspPeak, eyeSecs, crouchNearSecs, watchSecs, tunde{…}, post, posted, ucheArrived, ucheRole, chase{…}, trust, secs, caps{…}, diff{…}, hints[], build`) |
| `m3_summary` | tac_mansion; `completeMission('m3')`, once per run, before the aftermath | `entry, door, power, uche`, `spawn: 'front'\|'corridor'`, `obi: {first, alertedBy, alertedAt, outcome, by, arrest: 'professional'\|'forceful'\|'bribe'\|'informant'\|null}`, `seen: {notices, alarms, evaded, causes: {sight, noise, close}}`, `crouchSecs`, `wipe: {armed, outcome, pct, files, total}`, `child: {choice, out, by}`, `uche: {orders: [...], acts: [...]}`, `extract: {refusals, missing: [...]}`, `prep: {sims, kcFair, tip, tipped, warrant}`, `secs` (breach to extraction), `force`, `trust`, `grade`, `diff: {casework, pace}`, `hints: [ids]`, `build` |
| `radio`, `tac_mission`, `geo_drift` | tac_radio / tac_core / tac_geo | as foundations §4 (the report doesn't read them; the CLI prints them with `--detail`) |

**What answers which question:**

| Question | Events |
|---|---|
| Where did they get lost? | `obj_done`, `stuck`, `hint`, `away`, `quit`, `interact_miss {why:'none'}` |
| Which interactions failed? | `interact_result` (refused / noop / wrong target), `interact_miss`, `blocked` |
| Did they understand why they were seen? | `seen` (alarm), `seen_read`, `evaded`, the `survey`'s "unfair" answer |
| More than one approach? | `enc`, `order`, `ally_done` |

---

## 5 · The four answers: rules, the sheet, the CLI

### 5.1 Rules (`R.analyze`; prototype `proto_report.js`)

1. **Where did they get lost?**
   - Group by `(m, objective)`. Per group: `stuck`, `hint`, `away`, the `quit` rule, taps on nothing, and `obj_done`'s `secs`,
     `eff`, `walked` and `direct`.
   - Score and level as in §3.4. Rows are sorted by score.
   - The answer reads: *"Lost at N place(s), slow at M"*, *"Slow at N, never lost"* or *"No sign of being lost"*.
   - Example row: `M2 · Scan suspect phone — 3:32, stuck ×1, hint ×1, walked 186 m for 34 m, 4 taps on nothing`.
2. **Which interactions failed?**
   - Presses are `interact_result` events plus `interact_miss` events counted by `n`.
   - A failure is one of:
     - `refused`;
     - **`wrong target`**: refused, with `want ≠ label` and `want` among `alt`. This is the "ALREADY SCANNED while KC was in
       reach" case.
     - `did nothing` (noop);
     - `just out of reach` (`why:'range'`);
     - `nothing in reach`.
   - `blocked` events are listed as "refused (no press)" and not counted as presses.
   - The answer reads *"N of M presses failed (x%)"*, with the top rows by count.
3. **Did they understand why they were seen?**
   - It judges only alarms whose cause is not in `PLAN_CAUSES`. For each one it finds the `seen_read` (ms on screen), whether
     the same mistake came again (repeat), and what came next (`evaded`, seen again, or resolved).
   - It quotes the survey's "unfair" answer when it matches `DETECT_WORDS`.
   - The answer reads:
     - *"No detection data in this build"*, *"Never noticed"*, or *"Noticed N×, never seen · got away N× (cover ×a, crowd ×b)"*;
     - otherwise *"Seen N× · reason on screen 1.5 s+ for R of N · same reason again ×K | no repeat"*, plus the stamp.
4. **Did they use more than one approach?**
   - Families come from `R.FAMILY` over the `enc` events, plus Uche by the rule in §3.4.
   - The answer reads *"Yes, k: stealth, intercept, Uche"*, *"One: direct"*, *"None recognised"* or *"No encounter data in this
     build"*.
   - It also lists encounters that were retried with a different approach.

**Across players** (`R.across`):
- Per objective: players lost/reached, slow, median secs.
- Per failure key: players affected and total count.
- Per detection cause: alarms, readable/known, repeats, and the quoted "unfair" answers about detection.
- Approaches: the count of players with 2+, one, and none.

**The prototype was run on four inputs** (§B), and each gave the expected answer:
- **P1, desktop, sneaky:** lost at the scan; the counter's "wrong target" presses ×3; seen once, read, got away, LIKELY
  UNDERSTOOD; 4 approaches.
- **P2, phone, direct:** lost at the ops table; out-of-reach taps ×3; seen 3×, 0.7 s each, repeated, ASK THEM, "unfair" about
  detection; one approach.
- **A v1 log:** "No detection/encounter data", with a quit after 140 s counted as lost.
- **The real captured M2 log** from run 1.

A broken file was skipped with a warning.

### 5.2 The sheet

The layout is in §1.2. It shows up to 5 rows per section, then *"+N more in the exported log"*. With no events it shows *"Nothing
logged yet for this player."* The scope toggle exists only when a label is set; WHOLE DEVICE analyses every event on the device.
Opening it costs one `readAll` (2.9 ms at 3000 events) plus `analyze` (15.7 ms in node; tens of ms on a phone), once per tap.

### 5.3 `tools/pt_report.cjs` (the offline analysis script)

```
node tools/pt_report.cjs <file|folder>... [--player P3] [--slice m2,h2,m3] [--around HH:MM] [--detail]
                                          [--json out.json] [--md out.md]
```

- **Input:**
  - `.json` files (desktop export) and `.txt` files (the phone share sheet), or any folder of them.
  - Each holds `{events:[…]}` or a bare array. v1 and v2 logs are both accepted.
  - A file that doesn't parse, or has no events, is skipped with `skip (not a playtest log): <file> — <reason>`.
- **Players:** keyed by **file + label**. The same `P1` on two devices stays two players; see the protocol's "device · label"
  sheet.
- **Output (stdout), per player** (example in §1.4):
  - a header: label, file, devices, casework, build, events, **played** time, missions finished;
  - the four questions, each with its answer and the evidence rows;
  - the two survey answers.
- **Then across players** (when there are 2 or more): `ACROSS N PLAYERS` and the four aggregates.
- **Options:**

  | Option | Effect |
  |---|---|
  | `--player` | filters by label |
  | `--slice` | keeps events whose `m` is listed (plus `survey`, `pt_player`, `session`) |
  | `--around HH:MM` | prints every event within ±1 min of a facilitator's note: local time, mission, type and a 140-char payload |
  | `--detail` | prints each `enc` and summary in full |
  | `--json` | writes `{label, file, res}` per player |
  | `--md` | writes the same report as Markdown, to send |

- **Exit code:** 0, also when files were skipped; 2 when no events were found.
- **Implementation:**
  - `fs`, `path` and `vm` only; Node ≥ 18 (v22 here); no dependencies.
  - **No network:** the script requires no `http`, `https`, `net` or `dns` (a scenario greps for this).
  - It loads the analyser with `vm.runInNewContext(fs.readFileSync('src/v12/v12_pt_report.js'), sandbox)` and reads
    `sandbox.PT_REPORT`. This avoids the parent `"type":"module"` trap (§0).
  - The browser-only half of the file is guarded by `typeof document`.
  - Prototype: `design/telemetry/proto_cli.cjs` (34 lines).

---

## 6 · Harness scenarios

### 6.1 Helpers: `tools/harness/scenarios/pt_lib.cjs`

| Helper | What it does |
|---|---|
| `P.all(h)` | `V12.ptEvents()`, or, on an old build, `JSON.parse(localStorage.naceca_pt_v1)` |
| `P.play(h, secs)` | Advances `V12._ptState.play`. `__wf.run` (wayfind_lib.cjs:59-74) calls `updatePressure` and `sideTick` but not `updateGuideAndFeel`, so stepper-driven scenarios otherwise log `ps:0` and `obj_done.secs:0`. |
| `P.captureExport(h)` | stubs `V12.saveFile` and `navigator.share`/`canShare` to capture the file name, type and body |
| `P.fixtures` | the four fixture logs of §B, copied into `tools/harness/fixtures/pt/` |

### 6.2 New scenarios

| Scenario | Setup | Asserts |
|---|---|---|
| `pt_store` | `h.start('m2')`; events through `V12.log` | (a) 3000 events → the live key holds ≤ 300; chunks of 200; `V12.ptEvents()` returns all 3000 in `t` order. (b) Write timing is reported, with a loose bound: median < 3 ms. (c) To 6000 events → total chars ≤ 900,000; the oldest are dropped; one `pt_trim {reason:'budget'}` per dropping write, carrying `dev` and `ps`; the newest event is kept. (d) A v1 key with 3000 events + 1 log → 3001 events. (e) `localStorage.setItem` throws `QuotaExceededError` twice → every buffered event is present afterwards, with `pt_trim {reason:'quota'}`. (f) With the origin filled until `saveGame` fails today: with the wrap, the save key is written, no `SAVE FAILED` toast shows, and the log shrank; with an empty log and a still-full origin, the real `SAVE FAILED` toast shows. (g) One CLEAR tap only arms; two taps remove the live key and every chunk, and keep `naceca_save_v1`, settings and `naceca_pt_player`. |
| `pt_caps` | `h.start('m2')` | (a) 30 `tryInteract()` at (40, 40) within 1 s → `interact_miss` events whose `n` sum to 30, at most 2 events. (b) 200 identical `ErrorEvent`s on `window` → `js_error` `n` sums to 200 across ≤ 2 events. (c) 100 `seen` → 80 stored, plus `pt_dropped {byType:{seen:20}}` after a `visibilitychange`. (d) A 5000-char string payload → stored ≤ 1500 chars with `trunc:true`; 600-char survey answers are kept whole. (e) The same `blocked` toast 5× in 5 s → 1 event with `n:5`. |
| `pt_player` | `h.start('m2')`, `--touch 1` and desktop | (a) NEW PLAYER: the first tap shows `TAP AGAIN · START P1`; the second sets the label. (b) Later events carry `p:'P1'` and a numeric `ps`; `pt_player` carries `w, h, touch, orient, settings`; `PT.totals` reset. (c) Export on touch: `navigator.share` is called with one `File`, `type:'text/plain'`, name matching `/^naceca-playtest-P1-\d{8}-\d{4}\.txt$/`. On desktop: `saveFile` is called with `.json`. `pt_export.via` is right in both. (d) The label survives a reload and a CLEAR. |
| `pt_payloads` | `lib.start('m2')`, real clock | `obj_done` has `txt` and `seen`/`notices`; `stuck` has `txt`, `want`, `px`, `pz`; a scripted chase in which KC outruns a slow pursuer logs no `away`; `chase_end` carries `how:'cutoff', by:'player'` when `c.how` is set before `onCaught`, and `how:null` on today's path; `session` has `ptv:2`, `player`, `orient`, `slice`; `page.setViewportSize` 390×844 → 844×390 logs one `orient {o:'landscape'}` after 1.5 s |
| `pt_report_core` | pure, through `vm` (no page needed) | on the fixtures: P1 lost at `o2_scan`, wrong target ×3, LIKELY UNDERSTOOD, ≥ 2 families; P2 ASK THEM (unread + repeat + "unfair" about detection), one approach (`direct`); the v1 log gives "No detection data" / "No encounter data". A `quit` right after the survey isn't "lost"; `knock`/`loud`/`tipped` alarms aren't judged; Uche needs an order and an act. `R.text` rows equal the strings the sheet renders (the same functions). |
| `pt_report_sheet` | Settings › PLAYTEST › VIEW at 390×844 `--touch 1`, 844×390 `--touch 1`, 1280×800 | the four headings word for word; fits with ≥ 12 px gutters and no horizontal scroll; every button ≥ 44 px on touch; no `gradient`, `box-shadow`, `filter`, `text-shadow` or `backdrop-filter`; icons are `svg.ico`; no emoji; no `AKS`; stamps use `--red`/`--green`; the empty state; BACK → Settings, then closing Settings returns to `screen-pause` when it was opened from pause; Esc closes the sheet; the sheet is never shown after a scripted M2 without a tap. Prototype: `design/telemetry/sheet2.cjs` (passed). |
| `pt_cli` | `child_process.execFileSync('node', ['tools/pt_report.cjs', tmp, …])` on exported files captured from the page, plus the fixtures and `broken.json` | exit 0; a `skip (not a playtest log)` line; each player's four headings; `ACROSS`; `--player P2` prints one player; `--around` prints events; `--json` and `--md` files exist and parse; `tools/pt_report.cjs` contains no `require('http'\|'https'\|'net'\|'dns')`; a folder with no logs exits 2 |
| `pt_slice_m2` (after tac_market lands) | `T.deviceMarket` (foundations §5.1); a scripted cold grab and a scripted "seen, then tackle" run | every tactics event matches §4.4 (required fields present, enum values valid); `m2_summary` exactly once; ≤ 40 events in a 30 s sneak (nothing per tick); every event ≤ 1500 chars; `V12.ptReport` gives ≥ 2 families for the cold grab and "One: direct" for the other; `seen.why` equals the eye's `.eye-why` text at that tick |
| `pt_slice_m3` (after tac_mansion lands) | the art-pass mansion shim (foundations `T.deviceMansion`, with `T.restoreArt` afterwards) | the same schema checks for `enc m3_*`, `order`, `ally_done`, `m3_summary`; `seen_read` follows each alarm; a knock entry's alarm has `cause:'knock'` and isn't judged |

### 6.3 Regressions that must stay green

| Scenario | Why it is safe, or what to watch |
|---|---|
| `pt_logger` | Must pass **unchanged**. The live key format is kept, the synchronous write at 12 is kept, the classifier and survey are untouched, and each assertion's fields still exist. Coalescing doesn't fold its single miss or its single outside `NOT YET`. A store-made `pt_trim` carries `dev` (it is built through the envelope), so its "every event carries the device" check holds even if a trim happened. |
| `wayfind_*` | The logger's `tryInteract` and `startChase` wraps keep their shape; only payloads grew |
| `board_*`, `board_van` | the van's silent completion still logs `mission_end {silent}`. |
| `casework_settings` | Its label assertions concern `casework` and `difficulty` (casework_settings.cjs:8-21). The two new rows don't add a "Difficulty". |
| `casework_*` | unaffected |
| `visual_desktop`, `visual_touch` | `03_settings` (\_visual_lib.cjs:171-172) now shows two more rows with the existing classes. Re-check its overflow checks. |
| `v13_*` | no v13 hook is touched; their `V12.log` calls just gain `p` and `ps` |

The foundations and market `T.capture` helpers wrap `V12.log` from outside, so they still see every raw call before
coalescing.

---

## 7 · What only real rendering or a real device can verify

- **Getting the file off a phone.**
  - Does `navigator.share({files:[File(text/plain, .txt)]})` open the share sheet on iOS Safari 15+ and on Android Chrome?
  - Do WhatsApp, AirDrop and Mail accept the file and keep its name?
  - Chrome on Android only shares an allow-list of types (plain text and `.txt` are on it, JSON isn't), which is why it is
    `.txt`. Confirm this on a device.
  - On GitHub Pages, an `<a download>` on iOS opens a preview instead of saving.
  - Check the `window.claude.use('downloads')` path in the claude.ai viewer.
- **Quota.** iOS Safari's real localStorage limit, its private-mode behaviour, and the shared GitHub Pages origin. Also test the
  save safety net on a genuinely full origin.
- **Data loss when a tab dies.** When iOS kills a background tab, how many events are lost? `visibilitychange` and the 20 s tick
  should bound it to under 20 s. Compare the log's last event with the facilitator's noted end time.
- **Write cost on a low-end Android at 3000 events,** today against the chunked store, through a remote inspector. The desktop
  figures are 9.1 ms against 0.6 ms median.
- **Whether `seen_read` time means "read".** On-screen ≥ 1.5 s is necessary, not sufficient. Only the facilitator's C notes
  ("looked at the eye", "said why") can calibrate `READ_MS` and the stamps. Compare them per player after the first session.
- **Whether `stuck` and the lost score match what a person saw.** Calibrate against the A notes and adjust §3.4's weights in one
  table.
- **The sheet on a real phone.** Sticky footer inside an `overflow:auto` sheet on iOS Safari, legibility outdoors, a long survey
  answer wrapping at 390 px.
- **Facilitator usability.** Do facilitators find NEW PLAYER and understand the two-tap arm?

---

## 8 · Risks, and the smallest version

### Risks

| Risk | Mitigation |
|---|---|
| The proxies over-claim ("they understood") | The answers read as evidence. Stamps only say ASK THEM or LIKELY UNDERSTOOD. The facilitator's notes are primary (protocol), and the thresholds sit in one table to recalibrate. |
| The tactics files drift from the schema | §4.4 is the contract. `pt_slice_m2`/`m3` assert required fields and enum values. The report shows unknown values raw instead of failing. `R.FAMILY` is data. |
| The log costs a save | the budget, the quota-safe write, and the `saveGame` safety net (run 3) |
| A runaway event type evicts the history | per-sid ceilings, coalescing and the size guard |
| Data lost on a tab kill | the write on hidden (existing, :40), the 20 s tick and `pagehide`. Accept ≤ 20 s. |
| Privacy | The log holds free-text answers and the UA string, no names. It stays on the device until someone taps EXPORT or SEND LOG. `PT_ENDPOINT` is never set. The protocol has a consent line. |
| A facilitator forgets NEW PLAYER | WHOLE DEVICE still works; the CLI groups by file; protocol step 3 |
| The same label on two devices | the CLI keys players by file + label; the protocol writes down "B · P3" |
| v12_pt.js grows by about 90 lines | Storage is one block and the caps live in `log0`. The report and UI are a separate file. |
| A chunk rotation pause | ≤ 5 ms on desktop, about 25 ms on a phone, once per 200 events: acceptable |
| A mid-play summary tap confuses players | it is behind Settings, never automatic; open question 1 |

### The smallest version that still delivers the change people see (the facilitator's four answers)

1. **v12_pt.js** (about 40 lines):
   - the envelope's `p` and `ps`;
   - NEW PLAYER (`V12.ptPlayer`), a two-tap CLEAR, and the `.txt` share export;
   - `obj_done.txt`, `stuck.txt/want`, `chase_end.how/by`, no `away` in chases;
   - the ceilings and coalescing.
2. **The contract.** The tactics files emit `seen`, `seen_read`, `evaded`, `order`, `ally_done`, `enc` and `m2_summary`/`m3_summary`
   as in §4.4.
3. **The report.** `v12_pt_report.js` (the analyser plus the Summary sheet, about 330 lines plus 25 lines of CSS) and
   `tools/pt_report.cjs`.
4. **The protocol:** `docs/PLAYTEST-PROTOCOL.md`.

**Deferred to the following build:** the chunked store and the `saveGame` safety net.
- A playtest device is cleared before each session and stays under about 600 events, where today's write costs about 2–3 ms.
- But public players' logs do reach the cap, so the store should land before the next public release.

---

## 9 · Open questions for the product owner

1. **Should the PLAYTEST group stay visible to every player?** It already is today. The alternative is to show it only with
   `?pt=1` or after five taps on the build stamp.
2. **Keep the ASK THEM / LIKELY UNDERSTOOD stamps,** or show the evidence only?
3. **Should NEW PLAYER also start a NEW INVESTIGATION** (one step fewer), or stay separate, as specified?
4. **Players who don't reach M3 in the time box.** Should the questions also be asked at the van (`?slice=m2`)? Or does the
   facilitator ask them from Settings, as the protocol says now?

---

## Appendix A · Facilitator protocol (also `design/playtest_protocol.md`, proposed as `docs/PLAYTEST-PROTOCOL.md`)

See `design/playtest_protocol.md`; its text is reproduced here unchanged.

**The slice:** from the moment the van stops at the Ikeja market (M2) to the end of the Lekki raid aftermath (M3). Players start
from NEW INVESTIGATION. The cold open and HQ are a warm-up: they teach crouch, sprint and the action button. They're logged too.
**Budget:** about 75 minutes per player. Use 4 to 8 players, at least two on phones and two on desktops. Plan one facilitator for
every 2 to 3 players.
**You need:** this sheet, a watch, paper observation sheets, and one laptop with this repo for the analysis afterwards. No
network is needed.

**Before each player** (per device, about 5 minutes):
1. Open the game. Go to **Settings › PLAYTEST**. If *Playtest log* shows events from someone else, tap **EXPORT**, check the file
   arrived, then tap **CLEAR** twice.
2. Leave every setting at its default: Action pace Standard, Hints when stuck On, Objective marker On. Write down any change you
   make. *(Superseded 24 Oct — see docs/PLAYTEST-PROTOCOL.md step 2: "Hints when stuck" is set by the start itself, Off
   for a Senior Agent start and On for Recruit.)*
3. Tap **NEW PLAYER** twice. The row now reads, for example, *P3 · 0 events*. Write the device letter and the label on your
   sheet (for example **B · P3**).
4. On a phone, turn brightness up and rotation lock off. On a desktop, use headphones.
5. Go to Title › **NEW INVESTIGATION** › **SENIOR AGENT** (already selected) › **BEGIN**. Hand over the device.

**What to say (keep to this):** "This is an early build of a detective game. We're testing the game, not you. Play the way you
would at home. I can't help while you play. If you're stuck for a long time I'll ask what you're trying to do. Thinking aloud
helps if you're comfortable with it. The game keeps a log of what you press and where you go, on this device only. It has no name
and no recording. At the end it asks you two questions."

**While they play, write the clock time (HH:MM) next to every note.** The log uses the same clock.
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

**The two questions, after the Lekki aftermath.** The game asks them on screen. If the player skips them, or they don't appear,
ask them yourself word for word. Type the answers in **Settings › PLAYTEST › Two questions › ANSWER**.
1. **"What was your most satisfying decision?"**
2. **"What happened that felt unfair?"**

Don't rephrase them or give examples. The only follow-up allowed is "Tell me more about that."

**Collect the log** (per device, before the next player):
1. Go to **Settings › PLAYTEST › Summary › VIEW**. Read the four answers and put your notes beside them. It shows evidence, not a
   verdict. A red **ASK THEM** stamp means the evidence on being seen is unclear, so ask about it in your own debrief notes, never
   during play.
2. **Phone:** tap **SEND LOG**. The share sheet opens. Send the file (for example `naceca-playtest-P3-20261017-1432.txt`) by
   AirDrop, WhatsApp or email to the session address.
   **Desktop:** **SEND LOG** or **EXPORT** downloads the same log as `.json`. Put it in the session folder.
3. If sending fails, keep the device and **don't CLEAR it**; export it later. As a last resort, photograph the summary sheet.
4. For the next player, go back to *Before each player*, step 3.

**After the session (laptop, offline):**
```
node tools/pt_report.cjs ~/naceca-session-1017/  > report.txt                          # the four answers, per player and across players
node tools/pt_report.cjs ~/naceca-session-1017/ --player P3 --around 14:32                # the events either side of a note
node tools/pt_report.cjs ~/naceca-session-1017/ --md report.md                            # the same report as Markdown, to send
```
Send the team the log folder, `report.md` and photos of your paper sheets.

**Observation sheet columns:** time · device and player · tag (A/B/C/D) · what happened · what they said (quote)

---

## Appendix B · Scratch work (outside the repo; `design/telemetry/`)

**Harness runs** (4, all against `/home/user/nollywood-media/naceca/naceca.html`):

| Run | File | What it did |
|---|---|---|
| 1 | `measure1.cjs` → `out1/measure1.json`, `out1/sample_log.json` | real M2 events (misses, a refused press, Tunde, a chase); event sizes; the keys on the origin; today's write cost at 3000; quota |
| 2 | `sheet2.cjs` (first version) | the sheet at three sizes: shots `pt_settings_*`, `pt_report_*`. Its assertion expected 4 icons instead of 5, and the 36 px toggle was found here. |
| 3 | `store3.cjs` → `out1/store3.json` | the chunked store, budget, migration, quota, the save safety net (passed) |
| 4 | `sheet2.cjs` with the fixes, `--touch 1` | portrait and landscape (passed) |

**Prototypes:**

| File | What it is |
|---|---|
| `proto_report.js` | the analyser, vm/browser UMD |
| `proto_cli.cjs` | the CLI |
| `proto_sheet.js`, `proto_sheet.css` | the Settings rows and the sheet |
| `proto_store.js` | the chunked store |
| `make_fixtures.cjs` → `fixtures/` | P1 desktop, P2 phone `.txt`, a v1 log, a broken file |

**Node timing:** the analyser on 3600 events, 15.7 ms median (§0).
