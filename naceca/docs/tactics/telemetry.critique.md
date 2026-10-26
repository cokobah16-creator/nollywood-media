# Critique of `design/telemetry.md` (adversarial review)

Checked against `claude/naceca-bundle-integration-133395` at 261a000, and HEAD 74a0c96, whose only drift is in v12_pt.js:297-310
and pt_logger.cjs:138-149, as the spec says. I also checked the sibling specs `foundations.md`, `market.md` and `mansion.md`
(mansion.md was written after this spec) and the prototypes in `design/telemetry/`. Every file:line the spec cites that I opened
is accurate. The problems are in the design, not in the citations.

The probes I ran are scratch only, under `design/critique_probe/`:
- `desk_save.cjs`: a SAVE FAILED raised while the v13 desk is open (finding 3).
- `pt_logger_count.cjs`: the existing pt_logger stores 89 events, 10,282 chars, so the 300-event live key never rotates there.

Severity counts: **2 blockers, 6 majors, 16 minors.**

---

## Blockers

### 1. Most edits to existing files are avoidable, so the design breaks the removable-layer rule
**Evidence**
- The binding rule: new code goes after the beta, and existing files are touched only where a hook is unavoidable.
- The spec puts `v12_pt_report.js` in `V12_JS` (build.py:84-86) and adds about 25 lines to `src/v12/v12.css` after :608.
  - That CSS uses only its own `#screen-pt-report` selectors (proto_sheet.css), so "it shares the survey's selectors" isn't a
    reason to put it there.
  - foundations already defines `TACTICS_JS` and `src/tactics/tactics.css` (foundations.md:165, 175-176).
- §2.1 says the about 90 lines in v12_pt.js are unavoidable because the storage and envelope are private. That holds only for the
  store, i.e. `write()`/`read()` at :15-17, which is private and called from :21, :25, :37 and :40. Everything else can be reached
  from a later layer:
  - `V12.log` is a public property, replaced at :98. The spec's own `T.capture` wraps it from outside (telemetry.md:610).
  - An outer V12.log wrapper can do all of these:
    - add `ps`, since `V12._ptState.play` is public (:106);
    - add the label, as `d.p`;
    - apply the ceilings and the size guard, by not calling the inner function;
    - coalesce, with its own 1.5 s pending slot that emits one event with a count;
    - enrich `obj_done` (`txt`, `seen`, `notices`), `stuck` (`txt`, `want`, `px`, `pz`), `session` (`ptv`, `player`, `orient`,
      `slice`) and `chase_end` (`c.how`/`c.by`, read from `CHASE.active`);
    - drop `away` during a chase.
  - `V12.ptExport` and `V12.ptSummary` are public (:48, :54), so they can be replaced outright.
  - The CLEAR button (`#pt-clear`, :73) can be rebound from an outer `renderSettings` wrap. Call `V12.ptSummary()` first: its
    `write()` empties the private `buf`. Then remove the keys.
  - `saveGame` and `toast` can be wrapped from the tactics layer. That is more robust than v12_pt, see finding 3.
- The smallest version (§8) defers the chunked store, the only part that needs v12_pt.js. It still edits v12_pt.js by about 40
  lines, and none of those 40 lines needs the file.

**Correction**
- Move the analyser, the sheet, the Settings rows, the logger enrichments, the ceilings and the save safety net into a new
  `src/tactics/tac_pt.js` (first in `TACTICS_JS`). Put the CSS in `tactics.css`.
- Touch `v12_pt.js` only for the store: lines 12, 15-17 and the `V12.ptEvents`/`V12.ptClearAll` accessors. Give the reason for
  each line.
- The smallest version then edits no existing file.
- Point `tools/pt_report.cjs`'s `vm` load at the new path.

### 2. The event contract (§4.4) no longer matches what the sibling emitters log, so the four answers fail on real M3 (and partly M2) events
**Evidence**
- `enc m3_entry`:
  - This spec: `entry:'knock'|'quiet'|'loud'`, `door:'front'|'gate'`, `armed`, `obi`, `wipeTotal`, `prep{…}`.
  - mansion.md:659: `approach:'knock'|'loud'|'quiet_front'|'side_gate'`, `leak`, `known{…}`, `pendingTotal`, `variant`.
  - `R.FAMILY` keys `m3_entry.entry` and `m3_entry.door` (proto_report.js:155-157) never match, so the M3 entry gives no family.
- `enc m3_obi.outcome`:
  - This spec: `cold|intercepted|covered|blocked_by_uche|out_back`.
  - mansion.md:662: `cold|beat_thumb|stun_grab|intercepted|covered|cornered|tackled|perimeter`.
  - `beat_thumb`, `stun_grab`, `cornered`, `tackled` and `perimeter` are unmapped. `blocked_by_uche` doesn't exist.
- `enc m3_laptop.outcome`:
  - This spec: `halted|lost|forced|never_started`.
  - mansion.md:663: `seized_intact|halted|lost|abandoned`.
- `order`:
  - This spec: `src:'talk'|'plan'|'button'` and `post`, and its Uche rule needs a non-default `src` (§3.4).
  - mansion.md:665 logs `from:'button'|'key'|'card'`, `why` and no `post`.
  - market.md §4 logs `order` with no `src` at all.
- `ally_done`:
  - This spec: tasks `veer|tackle|box|callout|escort|cover_held`.
  - mansion.md:666: `outcome:'held'|'escorted'|'posted'|'tackled'|'cancelled'`, and no task list.
- `m3_summary`:
  - This spec: nested `obi{first,alertedBy,…}`, `seen{…}`, `wipe{armed,…}`, logged at `completeMission('m3')`.
  - mansion.md:340, 667: flat fields, logged from a `showAftermath` wrap.
- `seen.cause`:
  - foundations emits only `sight|noise|close` (foundations.md:516).
  - Knock, loud and leak alerts in the mansion are Obi state changes (`m3_obi`), not `seen{cause:'knock'}`. A leak only lowers the
    alarm threshold to 60 (mansion.md:698).
  - So `PLAN_CAUSES` filters nothing, and the `pt_slice_m3` check "a knock entry's alarm has `cause:'knock'`" (§6.2) can't pass.
  - The mansion also logs `seen{level:'calm'}` (mansion.md:134, 698), which isn't in this spec's level enum.
- The fixtures (`make_fixtures.cjs`) are written in this spec's own vocabulary. So the claim that `pt_report_core` "gave the
  expected answer" proves nothing about the real emitters.

**Correction**
- Reconcile now, with the emitters as the source of truth (they are measured), and change §4.4 and `R.FAMILY` to match:
  - `m3_entry.approach`: `quiet_front` → stealth, `side_gate` → stealth plus preparation;
  - `m3_obi.outcome`: `beat_thumb`/`cold` → stealth, `stun_grab`/`intercepted` → intercept, `covered`/`tackled`/`cornered` →
    Uche, `perimeter` → none;
  - the Uche order rule keyed on `from`/`ok`.
- Ask the market for `order.src` (or define "player-chosen" without it).
- Drop the `cause:'knock'` checks.
- Regenerate the fixtures by capturing `T.capture` output from the sibling prototypes, not by hand.
- Add a schema test that runs on the real `tac_*` events (`pt_slice_m2`/`m3`) before any analyser test.

---

## Majors

### 3. The `saveGame` safety net never fires for saves made with the case desk open
**Evidence**
- The net relies on v12_pt's `toast` wrap (:151-159) seeing `SAVE FAILED` while `PT.inSave` is set (§2.2).
- v13_desk.js:61-73 wraps `toast` outside v12_pt. While the desk is open it turns every toast into the desk status line and never
  calls the inner toast.
- v13_desk.js:500 calls `saveGame(true)` on every verdict tap, which is the investigation core.
- Probe `critique_probe/desk_save.cjs`, with the save key made to throw:
  - toast chain `["v13_desk","v12wrap","base"]`;
  - `#toast` stays empty;
  - `#desk-note` shows `SAVE FAILED`.
  - So v12_pt sees nothing: no retry, the save is lost, and the player is told it failed.
- §2.8 doesn't list the v13_desk toast wrap at all.

**Correction**
- Don't detect failure through toasts. In the `saveGame` wrap, pre-flight the write:
  - `json = JSON.stringify(S)`;
  - `try{ localStorage.setItem(SAVE_KEY, json) }catch → free the oldest chunk and retry (≤ 8 times)`;
  - then call the original, which now succeeds and shows its normal SAVED/quiet behaviour.
  - If nothing is left to free, call the original as is, so the real failure toast appears through whatever wraps exist.
- Add `pt_store (f)` with the desk open (`openDesk()`).

### 4. "Played" time is cumulative across players on the same page load
**Evidence**
- `ps = Math.round(PT.play/1000)` (§2.2 row 96-98). `PT.play` only grows (v12_pt.js:112) and is never reset. `V12.ptPlayer` resets
  only `PT.totals` (§2.2).
- The protocol runs players back to back without a reload: "For the next player, go back to *Before each player*, step 3".
- `R.meta` takes `max(ps)` per sid (proto_report.js:196), so P2's "38:12 played" includes all of P1's play time.
- `survey.secsPlayed` (v12_pt.js:274) has the same flaw.

**Correction**
- At NEW PLAYER, log `pt_player` with the current `ps`.
- In `R.meta`, per `(sid, player)` take `max(ps) - (ps at pt_player, or min(ps))`.
- In the survey, report `PT.play - PT.playAtPlayer`.
- `pt_player` test (b): two players without a reload give independent played times.

### 5. The protocol plus the CLI's "file + label" key double-count players
**Evidence**
- Every export holds the whole device log: `{…, events}` from `readAll` (§2.2 row 48-53). SEND LOG in the sheet calls
  `V12.ptExport` (proto_sheet.js:38).
- The protocol's "Collect the log" step 4 sends the facilitator back to step 3 (NEW PLAYER), skipping step 1 (EXPORT + CLEAR).
- So the second file holds P1 and P2.
- `R.players` keys by `file|label` (proto_report.js:27), so P1 is counted twice in `ACROSS N PLAYERS` and in every aggregate.
- `--player P3` also matches P3 from every device (proto_cli.cjs:20).

**Correction**
- In `R.normalize`, deduplicate across files by `(sid, t, type)`.
- Key players by device plus label, not by file. Store a short device letter or id in `naceca_pt_player`, set once, and print
  "B·P3".
- SEND LOG from the player-scoped sheet should export that player's events. The file name already claims that.
- Make the protocol state "CLEAR (two taps) only after the file is confirmed received", and make step 4 point to step 1.

### 6. "LIKELY UNDERSTOOD" is stamped with no reading evidence, and the M3 cause line isn't measured at all
**Evidence**
- `flag = (unread || reps || unfairAboutDetection) ? 'ask' : 'likely'` (proto_report.js:140-142). An alarm with no `seen_read` has
  `read = null`, which doesn't count as unread.
- foundations.md never mentions `seen_read`: request 1 isn't accepted.
- So with the tactics layer as specified, any player seen once, with no repeat and no "unfair" answer about detection, gets the
  green LIKELY UNDERSTOOD with zero reading data. §8's risk, "the proxies over-claim", happens by default.
- In M3 the reason is shown in a toast at 100% ("HE SAW YOU · He saw you 2 m away, walking upright", mansion.md:135-137). The top
  eye shows only while Obi is off screen (mansion.md:124-126). Request 1, "the frozen line under the eye", doesn't measure it.

**Correction**
- With any judged alarm lacking read data, the stamp is `NO READ DATA` and the answer says so.
- Make `seen_read` a hard dependency of the smallest version. Measure it independently of foundations:
  - in the layer's `toast` wrap, time from the call to the next `toast()`, to `ms`, or to an overlay opening;
  - for the eye line, a `MutationObserver` on `#eye-ind .eye-why` (visibility and text) emits
    `seen_read{who, via:'eye'|'toast', ms, end}`.

### 7. The approach families confuse outcomes and defaults with chosen approaches, and the stated Uche rule isn't the one implemented
**Evidence**
- `m2_kc.approach` `seen`/`bolt` → direct (proto_report.js:152). A player who tried to sneak and was spotted reads as "direct", the
  opposite of what they did.
- Knock, the default entry when KC isn't fair (mansion.md:770), → direct.
- Tunde's `quiet` dialogue choice → preparation (:154).
- So a player who accepts every default and tackles KC reads "Yes, 2: preparation, direct", and the plan's question ("did they
  use more than one approach") is answered yes for passive play.
- §3.4 says Uche counts only with a player order **and** an act in the same mission. The prototype counts any `ally_done` act
  (proto_report.js:176-177), so an unposted Uche's automatic callout counts.
- §3.4's rule also needs `order.src`, which the market doesn't log (finding 2).

**Correction**
- Separate the approach chosen from the outcome: report "chosen: stealth; result: seen → tackled".
- Count a family only from player-made, non-default choices:
  - ask the emitters for `def:true` on fields left at their default (plan entry, power, Uche post);
  - count Tunde's choice as preparation only when it changed KC's route (`_kcRouteKnown`).
- Implement the order-plus-act rule as written, and test it with a callout from an unposted Uche.

### 8. The answers are blind where Senior players are most likely to get lost: the investigation screens
**Evidence**
- `PT.play` advances only in `updateGuideAndFeel` (v12_pt.js:112), which runs from `updateNPCs` (engine.js:655) while the world is
  live.
- `stuck` and `away` return with any overlay open (v12_pt.js:226). So ten minutes stuck on the operations table, a document or the
  desk produce no `stuck`, no `hint` and no play time.
- The slice runs through `o4_table` and the raid gate. The analyser reads none of the investigation events the game already logs:
  - `strike` (v12_ops.js:618), `file {ok, struck}` (:648);
  - `doc_failed`, `warrant {w:'refused'|'pending', strikes}` (casework.js:433);
  - `v13_warrant`, `v13_verdict`, `desk_open`, `ops_open`.
- The `BLOCKED` regex (v12_pt.js:150) still misses `BACK TO THE TABLE` (casework.js:437). That toast is raised outside an
  interaction, so it isn't logged at all.
- The plan opens with "Investigation stays the core".

**Correction**
- Add the investigation signals:
  - **lost:** wall time with `screen-ops`/`screen-desk`/document overlays open per objective. Log `ov_dwell {id, secs, obj}` when an
    overlay closes, from the layer's `showOverlay` wrap.
  - **failed:** `strike`, `doc_failed`, a refused or pending `warrant` and `BACK TO THE TABLE`. Add it to `BLOCKED`, or test
    `big + ' ' + small`, as SCOPE's telemetry section recommends.
- Show these as their own rows ("operations table: 3 strikes, 6:40 open").

---

## Minors

### 9. The write sketch duplicates events and logs `pt_trim` late
`telemetry.md:340-353` has three problems:
- After 8 refusals, `buf = L.slice(-LIVE_MAX)` puts back events that are still in the stored live key. The next
  `readLive().concat(buf)` duplicates them.
- `pt_trim` is pushed inside the retry loop, so it can be pushed more than once per write.
- The budget drops happen after the `pt_trim` push, so each `pt_trim` reports the previous write's drops.

**Correction:** on failure, re-buffer only the not-yet-stored events. Push one `pt_trim` after the final successful layout.

### 10. The chunk index is cached per page load, and two tabs can rotate the same events
- A tab that loaded earlier doesn't see another tab's chunks, so its export and CLEAR miss them and its budget is wrong.
- Two tabs can rotate the same 200 events into `~a<t36>.<sidA>` and `~a<t36>.<sidB>`, with identical content.

**Correction:** re-scan the keys on `readAll`, CLEAR and export (`localStorage.length` is small). Deduplicate in `R.normalize`.

### 11. `d.n` already means something else
`strike.d.n` (v12_ops.js:618) and `file.d.n` (:648) use `n` with other meanings. Name the coalescing count `d.rep` (or `d.x`).

### 12. Ceilings are ambiguous
- "everything else | 600" doesn't say whether it is per type or shared.
- A long one-tab public session could cap `choice`. A shared cap could drop `survey` or `m3_summary`.

**Correction:** make every ceiling per type, and exempt `survey`, `pt_*`, `session`, `mission_*`, `*_summary` and `enc`.

### 13. Esc on the sheet leaves the world uncovered
The sheet is shown after `showOverlay(null)`. Closing it on Esc, as described for the survey pattern (v12_pt.js:282-287), leaves
no overlay. If Settings came from pause, the world is live with the HUD hidden (pause.js:7-15). Esc must do what BACK does.

### 14. The Summary is visible to every public player mid-run
The PLAYTEST group is always rendered (v12_pt.js:61-77). A Senior Agent player can open Summary from pause mid-M2 and read
"wanted: <tracker target>" rows and approach-family names. That is hint-adjacent.

**Correction:** show the Player and Summary rows only when a label is set or with `?pt=1`. That is also the default answer to open
question 1.

### 15. Per-player difficulty comes from the wrong source
- `pt_player` and the page-load `session` take `gameDifficulty()` from the save loaded at that moment, which is the previous
  player's save, because NEW PLAYER happens before NEW INVESTIGATION.
- casework.js:662 logs `new_game {d}`, which is the player's real choice.

**Correction:** `R.meta` should prefer `new_game.d.d`, then `survey.diff`.

### 16. `away` still fires during Obi's flight
Obi's flight is deliberately not `startChase` (SCOPE "Obi runs" change; mansion.md §1.4), so gating `away` on `CHASE.active` misses
it.

**Correction:** gate it on a generic flag that tactics files set during scripted pursuits, e.g. `V12.ptQuiet = 'm3_flight'`.

### 17. CLI time window and label filter
- `--around` uses the laptop's timezone and ignores the date (proto_cli.cjs:26).
- **Correction:** record `tz: new Date().getTimezoneOffset()` in `session`/`pt_player`, render device-local time, and match on
  date plus HH:MM.
- `--player` should accept `B·P3` (see finding 5).

### 18. Protocol gaps
- **No route to Settings after the aftermath.** The aftermath has only CONTINUE and VIEW SKILLS (index.html:163-164). Name the
  exact steps to reach Settings.
- **The 75-minute budget is unjustified.** The protocol starts from NEW INVESTIGATION, so every player plays M0, M1, M2, the hub
  and casework (h2), then M3.
  - Estimate it, or offer a facilitator start at M2: a fresh Senior save with m0 and m1 completed, the state the harness's
    `h.start('m2', {completed:['m0','m1']})` uses.
- **"Hints when stuck: On" for Senior Agent sessions.** It keeps the 60 s "Try this next: …" toast (guidance.js:98-104), which
  tells the player what to do. That conflicts with the product owner's Senior rule. Raise it with the product owner and record
  `settings.hints` per player. *(Decided 24 Oct: a Senior Agent start sets it Off, a Recruit start On — DESIGN-tactics.md
  §11.8.)*

### 19. §2.8's wrap-order list omits two wraps
- v13_desk's `toast` wrap (v13_desk.js:61-73).
- v13_boot.js:26 (`showAftermath`).

### 20. Analyser thresholds
- `READ_MS` of 1500 ms is shorter than the spec's own example line takes to read: "He saw you crossing the open road, standing" is
  8 words, about 1.9 s at 250 wpm. Scale it per word.
- The repeat proxy (same cause plus posture, any watcher) matches almost every standing sight alarm, so ASK THEM becomes
  near-universal.
- `DETECT_WORDS` has false positives ("made me", "eye").
- `noop` counts as a failed press.
- `seen_read` is paired by watcher only, as the first one after the alarm (proto_report.js:124), not by alarm order.

Calibrate these, and show them as evidence rows, not inputs to the stamp.

### 21. Sharing in the claude.ai viewer, and timing of the share call
- In the claude.ai viewer, `canShare` can be true while `share()` rejects with `NotAllowedError` (an iframe permissions policy).
  Fall back to `V12.saveFile` on any rejection that isn't `AbortError`, not only when `canShare` is false.
- Build the File synchronously, with no `await` before `navigator.share`, or iOS loses the user activation.

### 22. Chunk rotation can hitch mid-chase
A rotation costs about 5 ms on desktop and about 25 ms on a phone (§8), on whichever event happens to cross 300.

**Correction:** rotate only on the 20 s tick and on `hidden`/`pagehide`. Let the live key run to 300 + 12 between them.

### 23. `.pt-empty` contrast
`.pt-empty` text in `--grey` #6B6B63 on manila #E9DCC0 is about 3.96:1 at 13 px, below 4.5:1. Use `--ink-soft` or ink.

### 24. Test-plan nits
- `pt_payloads`' orient assertion needs `--touch 1`, because `orient` is touch-only.
- `pt_report_sheet` should cover the v13 navigation model: pause covering the desk, then Settings, then VIEW, then BACK, then
  close, then Resume returns to the desk.
- The CLI prototype doesn't do exit code 2, `--slice`, `--detail` or `--md`. The `pt_cli` assertions will catch it; just don't cite
  the prototype as evidence for them.
- `pt_store (b)`'s timing bound should only be reported, not asserted.
