# Critique of mansion.md (Phase 2 · the Lekki mansion, plan items 11-17)

Checked against the repo at `claude/naceca-bundle-integration-133395` (HEAD 74a0c96; it differs from 261a000 only in
v12_pt.js:+5 lines and a pt_logger case, so every cited line still holds). File:line references below are to that tree.
Most citations in the spec are accurate, and the hooks it names do fire on the real path: the base bundle is not an IIFE, so
`drawLaptopScreen`, `startMansionWipe`, `buildSceneMansion`, `updatePressure` and `generateHeadline` all resolve through the
global binding, and the TAC wraps of the four interactables are installed before `mqAttach` (art_pass_v8.js:2665 → 3667).
The problems are mostly in the tuning, in things the spec says but the code would not do, and in gaps.

Offline numbers below come from the designer's own model (`mansion_work/geo.cjs`, attention 0.96→1.6, which folds in
the ×1.6 gain, as in study3). They were re-run in `mansion_critique_work/gaits.cjs`. Nothing under the repo was touched.

Count: **1 blocker, 12 major, 17 minor.**

---

## Blocker

1. **The default desktop gait, and sprinting, beat the stealth layer outright. Only walking is caught.**
   - **Evidence.**
     - In the spec's own §3.3 table, "Straight at the desk, ending 2.3 m away" gives **jog: 50, notice only**. Only walking
       alarms. "Door → in front of the laptop" at a jog alarms, but that is the only jog row that does.
     - Re-running the designer's model with the shipped gain (`gaits.cjs`):

       | Route | Jog | Sprint |
       |---|---|---|
       | Frontal | peak 50, ends 2.3 m from him | peak **40** |
       | Doorway → straight line | 23 | 31 |
       | Doorway → the laptop spot | ALARM | peak 80, **no alarm** |
       | Frontal, then 0.4 s standing before ACTION | 70 | 60 |

     - Every one of those ends inside the 2.7 m arrest range (art_pass_v8.js:1753), so the result is a cold catch:
       no wipe, 7/7 files and the four-choice arrest.
     - Desktop has no walk at all: it is jog or nothing (people_art_pass.js:518). A full stick on touch is also a jog
       (:516-517).
     - So the only gait that fails is the careful half-stick walk on touch (0.85-1.55 m/s). That punishes caution and
       rewards running. "Cover works" (plan item 13) is then never needed on desktop.
     - §7's mitigation ("Straight at him and loitering both alarm") is contradicted by the spec's own table.
     - The gain ×1.6 was tuned only against the walk column (§3.2, "the smallest that alarms an upright frontal walk").
   - **Correction.**
     - Add an approach term to Obi's watcher: once he has noticed you, someone in his cone, inside about 4 m and closing at
       more than 2.2 m/s, alarms him within 0.5 s. The why-line would read "He saw you rushing him".
     - Or make jog and sprint noise on the tiles carry further indoors (`hearing` > 1, or the sprint radius at 9 m) so that
       running is heard.
     - Retune against all four gaits. Add jog and sprint rows to §3.3, and add `tac_m3_sight` asserts: frontal jog and
       frontal sprint must alarm, and the flank at a jog must not.
     - Without this, the smallest version's item 4 ships a stealth meter that nobody needs.

## Major

2. **The cornered rule contradicts the tackle, so Squad Trust, the side gate and GO ROUND THE BACK can never produce one.**
   - **Evidence.**
     - §1.4 and §3.4 say Obi is "cornered" if "Kelechi **or Uche**" stands with abs(x) < 1.0 and z < −4.0.
     - Uche's back post (−0.35, −8.1) is always inside that box (§3.1). Read literally, on the side gate and the Squad Trust
       rear Obi never runs: he puts his hands up at the desk.
     - That contradicts harness E2 ("tackled at (0, −7.0)") and §1.5's "If Obi runs into him there, he tackles him in front
       of you" (plan item 15).
     - The prototype only works because it excludes Uche (`blockedForObi`, proto_m3.js:139-145).
   - **Correction.**
     - Rewrite the rule as: cornered if **Kelechi** is in the corridor or its mouth, or if Uche is following (not posted)
       inside it and Obi can see him.
     - An Uche on the back post produces a tackle, never a cornering.
     - Add a `tac_m3_flight` case for each.

3. **Item 11 is incomplete: three false promises survive the breach.**
   - **(a) The wipe toast.**
     - §2.2 has the `startMansionWipe` wrap "let v12 compute the total", which means calling the original.
     - v12's version always toasts `LAPTOP WIPE RUNNING · Obi triggered a remote wipe…` (v12_plan.js:164).
     - So every quiet entry opens with a false wipe toast, which is exactly the outcome §1.2 removes. The prototype calls
       the original and has this bug (proto_m3.js:101-102).
   - **(b) The spoken briefing.**
     - Kelechi still says "Quiet. We pick the side door." / "Quiet. Side gate, then the side door." (v12_plan.js:146).
     - Uche still says "I'll take the back wall. Anyone who runs, runs into me." (:148).
     - Yet the spec renames the button "Quiet, front door" because "you never enter by a side door", changes the rear line
       to "inside the kitchen door", and claims in §2.7 that ":146 now matches what happens".
   - **Correction.**
     - Don't call the original. Recompute `wipeFor` (four lines, v12_plan.js:57-62), or stub `toast` around the call.
     - In the `V12.planM3` property wrap, pass the original a wrapped `onGo` that patches `DIALOGUE.mansion_pre_breach`
       (already rebuilt by `go`, :149) before `startDialogue` runs.
     - Assert both in `tac_m3_plan` and `tac_m3_entry`.

4. **Plan item 16's first bullet is skipped, and the plan still promises "you'll have to find the laptop".**
   - **Evidence.**
     - The plan says "t_sims lights Obi and the laptop from the start". The spec's only use of `t_sims` is a sketch tick
       (§1.1). The laptop marker (art_pass_v8.js:1826), the minimap blips (:1859-1866) and the tracker
       (wayfind.js:104 `o4_wipe`) show the laptop to everyone from the start.
     - So preparation changes nothing on the ground except KC's gate.
     - The rewritten wipe line keeps "· you'll have to find the laptop" (§1.1). SCOPE flagged that line as false for this
       exact reason.
   - **Correction.**
     - Without `t_sims` (or KC's laptop intel), hide `ev_laptop` and the Obi and laptop minimap entries until he or it has
       been in the player's view once. Reuse `TAC.sight.los` from the player's eye.
     - The tracker reads "Find the laptop · the study" (a room-level point, as SCOPE proposed).
     - With `t_sims`, everything is lit from the breach.
     - Either do this or delete the "find the laptop" phrase, and record the item as deferred.

5. **The tracker sends quiet-entry players straight into Obi's cone, and contradicts "stay put".**
   - **Evidence.**
     - `WAY.current()` takes the first unfinished objective (wayfind.js:63-79). The M3 order is o5_civ "Secure the child"
       before o4 and o6 (mission_flow.js:95-97).
     - On the quiet front and the side gate, the arrow, marker and ribbon therefore point at the child, who sits 24° off his
       facing in open view. The spec's own table makes "to the child and back" the riskiest route (§3.3, 69 notice walking;
       standing near her alarms).
     - After "Tell her to stay put. Get back to the laptop" the spec deliberately keeps the tracker on the child (§1.6), so
       the guidance overrides the player's stated choice while the wipe meter runs. SCOPE raised both.
   - **Correction.** Add `CURRENT_OVERRIDE.m3` (wayfind.js:59) from the layer:
     - while Obi is free on a quiet entry, o6 (Obi);
     - while a wipe is armed and the laptop is live, o4;
     - after "stay put", o4 until the laptop is done, then o5.

     Test it in `tac_m3_child` and `tac_m3_sight`.

6. **Uche's carry writes `child_gentle`, which launders the "stay put" choice into the court and the epilogue.**
   - **Evidence.**
     - §1.5 and §2.3 set `flags.child_gentle` and `moralChoices.child_gentle` whenever Uche walks her out, including after
       Kelechi chose "stay put" (Integrity −4, Public Trust −6).
     - Five readers treat that flag as Kelechi's kindness:
       - v13_court.js:713, "carried out gently", counted as protected;
       - finale.js:110-111, "drew a policeman with a kind face";
       - v12_night.js:53, "thank the officer with the kind face";
       - v12_mem.js:31;
       - v12_mem.js:52 (Uche trust +5).
     - The spec lists only the first two.
   - **Correction.**
     - Set `child_gentle` only if Kelechi took her hand, or if Uche took her out before Kelechi ever spoke to her (no
       choice was made).
     - After "stay put", record `flags.child_by = 'uche'` and leave `child_gentle` alone. Optionally give v13 its own
       court line later.
     - Add the case to `tac_m3_child`.

7. **On the knock entry, COVER at t = 0 makes the run moot for anyone who taps the button.**
   - **Evidence.**
     - COVER is offered from `startled` within 8 m with line of sight. The knock spawn puts Uche where he can see Obi
       (§3.1, "COVER offered at t = 0"), so the single-job button reads `UCHE · COVER HIM` at the breach.
     - One tap inside 1.5 s means no run and four arrest choices (harness K).
     - Knock is the default entry for every player without KC's tip (v12_plan.js:87), so plan item 14 ("intercept him",
       "interception is rewarding") rarely happens. COVER_RANGE was raised from SCOPE's 4 m to 8 m only to make this
       possible.
   - **Correction.**
     - Offer COVER once Obi is `running`, or from `startled` only within 4 m (SCOPE's number). Then Uche helps an
       intercept instead of replacing it.
     - Measure with `order{order:'cover', t}` against `enc m3_obi.outcome`.

8. **Players who don't tap mostly lose Obi on the default path, and the cost lands on Kelechi's record permanently.**
   - **Evidence.**
     - The offline margins are jog +0.3 s at a 0.6 s reaction and −0.6 s at 1.5 s (§3.5). A touch player has to toggle
       SPRINT first (art_pass_v8.js:2373, 2387), so a jogging phone player usually gets the perimeter.
     - The perimeter costs `force +1` (§1.4) through `S.game.forceUsed`. That feeds:
       - the grade (force ×−8);
       - heat (+3, v12_core.js:113-116);
       - "By the book" (art_pass_v8.js:3598);
       - v13's officer profile (`aggr += 2`, v13_intel.js:338);
       - Uche trust once the total force reaches 2 (v12_mem.js:64).

       Most of these are campaign-long.
     - Meanwhile Uche's on-screen tackle costs 0 force. A takedown by others is booked as Kelechi's force, but one by his
       own sergeant isn't.
     - Today the knock never fails (art_pass_v8.js:1698), so this adds a likely, unrecoverable loss to the default entry.
       That breaks the "failure must stay recoverable" and "nothing harder for its own sake" rules.
   - **Correction.**
     - Book the escape as its own outcome, not as force: the perimeter headline, the two-choice arrest and a fixed grade
       penalty (for example −5, through the existing `computeGrade` wrap pattern). Leave `forceUsed`, "By the book" and
       v13's profile untouched.
     - And/or start the knock run at 2.0-2.5 s, so that a 1.5 s-reaction jog makes it.
     - Add a touch-jog intercept case to `tac_m3_flight`.

9. **The power cut's 12 s "no signal" window makes the cut dominant and skips the shipped field skill.**
   - **Evidence.**
     - §1.2 and §3.8: after his thumb, nothing happens for 12 s, and reaching the laptop in that window seizes all 7 files
       with no field skill (harness H2).
     - From the doorway the laptop is about 3 s away. Time also freezes in the arrest dialogue, because TAC ticks only
       while playing (art_pass_v8.js:2593-2599).
     - So knock + cut gives intercept Obi, arrest him, then 7/7 files, every time. The cut costs only Public Trust −2
       (v12_plan.js:133).
     - "KILL THE WIPE" (MG_CFG.m3_wipe, :3939) and the dilemma between the run and the laptop disappear for anyone who
       cuts. Today the +12 only lengthens the wipe.
   - **Correction.**
     - Let the cut delay only a remote trigger. If Obi is at the desk when he is alarmed (knock, loud and most quiet
       alarms), he types it locally and the wipe arms as normal; the delay applies only when he is away from the desk.
     - Or shorten the delay to about 5 s and start the field skill at 0% when the laptop is reached during it.
     - Record which, and assert it in `tac_m3_laptop`.

10. **Uche the follower carries the spent "Plan the raid" interactable, so ACTION in the house keeps resolving to him.**
    - **Evidence.**
      - Uche's interactable is attached to his mesh with range 2.6 (art_pass_v8.js:1704). v12 relabels it and makes a
        post-briefing press toast `READY` (v12_plan.js:174-176).
      - Following at 1.8-2.5 m (§3.6) keeps him permanently in range. Foundations' spent rule (priority −1) still lets him
        "answer if it is the only target in reach".
      - Results:
        - `ctx-main` stays in its pulsing ready state (styles.css:704);
        - the world label floats `TALK` over him;
        - foundations' miss line ("Nothing in reach — …") can never show in the house;
        - every stray press logs `interact_result{outcome:'refused'}`, which inflates refusals in `obj_done` and the survey
          context.
    - **Correction.**
      - After the breach, set `consumed = true` on that interactable, or move it to a hidden anchor.
      - Or relabel it as the UCHE order (one control, not two).
      - Assert in `tac_m3_uche` that `nearestInteractable()` is never Uche once he follows.

11. **Moving Obi and Uche on the 10 Hz sight tick makes them visibly step.**
    - **Evidence.**
      - §2.2 and §2.8 (R4) put Obi, Uche and the child on `TAC.onTick`, "the same 10 Hz clock" (foundations §3.5:
        fixed 10 Hz, up to 3 steps per frame).
      - At 3.0 m/s that is a 0.3 m jump every 6 frames: a jogging Obi drawn at 10 fps on a 60 fps screen. Uche's
        follow-steering would be the same.
      - The prototype moved them per frame (proto_m3.js:138, `tick(dt)` on every `updatePressure`), so the harness never
        saw this.
    - **Correction.**
      - Run decisions (state machine, catch checks, orders) at 10 Hz, and integrate positions every frame from the
        `updatePressure` dt. Or interpolate between ticks.
      - The child already moves per frame (`updateWalker`); keep her that way.

12. **The touch UI geometry doesn't fit the existing cluster on a 390 × 844 phone, in either orientation.**
    - **Portrait.**
      - `.ctx-small` buttons are 66 px with a 14 px gap (styles.css:709-710), so a third button makes the row 226 px wide.
        Anchored 16 px from the right, it starts at x = 148.
      - The stick spans x 22-156 (M) or 22-178 (L size) at the same bottom band (styles.css:613-614, 739). That is an
        8-30 px overlap with the joystick.
    - **Landscape.**
      - A row of three cards at ≥ 168 px plus two 8 px gaps is 520 px. It ends at the cluster's left edge (x ≈ 594) and
        so starts at x ≈ 74.
      - Bottom-aligned with the cluster (v12.css:17, bottom 64), it lies over the stick (x 22-156, bottom 92-226).
    - **Labels.** The single-job label `UCHE · TAKE HER OUT` (19 characters) or `UCHE · COVERING` does not fit a 66 px
      round button at 9.5 px with .14em tracking. Today's labels are SCAN and CROUCH.
    - **Closing.** The cards "close on any other control". On touch, the left thumb is usually on the stick, so they would
      close at once.
    - **Correction.**
      - Put UCHE above the row as its own 66 px button, or stack it with SCAN, and use the short label `UCHE` with the job
        in an attached paper tag.
      - In landscape, stack the cards upward from the cluster (two columns if needed).
      - Close the stack on another *button* tap only.
      - Add `#joystick` and `#hud-sprint` to `tac_m3_hud`'s overlap list (`WAY.hudRects` already measures them,
        wayfind.js:269).

13. **The telemetry contradicts the agreed telemetry contract (telemetry.md §4.4), so the playtest report would
    misclassify M3.**
    - **Evidence.** telemetry.md:458-463 and its `R.FAMILY` mapping (:400) expect:
      - `enc m3_entry{entry:'knock'|'quiet'|'loud', door:'front'|'gate', armed, prep}`;
      - `m3_obi.outcome` values including `blocked_by_uche` and `out_back`;
      - `m3_laptop.outcome:'never_started'`, with `firstAt`;
      - `order.order` values including `hold_rear`, with `src`;
      - `ally_done.task` in `arrive|veer|tackle|box|callout|cover_held|escort`;
      - `m3_summary` at `completeMission('m3')`.
    - **What this spec emits instead.**
      - `approach:'quiet_front'|'side_gate'`;
      - outcomes `tackled`, `perimeter`, `seized_intact`, `abandoned`;
      - `firstLaptopAt`;
      - `order:'back'` with `from`;
      - `ally_done` with an `outcome` instead of task names;
      - a new `m3_obi` event type;
      - `m3_summary` "at the extraction" in §4 but in the showAftermath wrap in §2.2.
    - **Effect.** The report's approach families (stealth, intercept, Uche, preparation) and its rule "Uche needs an order
      and an act" would not match. The spec never mentions telemetry.md.
    - **Correction.** Adopt telemetry.md §4.4's names and enums, or send that spec a field-by-field diff. Log
      `m3_summary` in one place (the `completeMission` wrap). Add `prep` to `enc m3_obi`, as the plan asks.

## Minor

14. **"Wrap" is the wrong word for the child and laptop changes.**
    - The base child callback is a closure that always runs `_civChild = true; completeObjective('o5_civ')`
      (art_pass_v8.js:1742-1744). The legacy one also moves her outside (scenes/mansion.js:206-208). A wrap that calls
      the original therefore reproduces the false outcome.
    - The prototype replaces these handlers outright (proto_m3.js:252-258, :326-330). Say "replace" in §2.2, and list the
      base behaviour that gets copied.

15. **A free informant deal devalues a bought capability and shifts v13's style read.**
    - Crisis Negotiator's description names "Chief Obi's arrest" (v12_core.js:150). The spec makes the deal free for
      every in-house stop, which includes one-tap COVER (finding 7).
    - `arrest:'informant'` gives `inf +3` in `intelStyle` (v13_intel.js:338-339). The 'inf' key routes `runTip` to the
      false tip (v13_briefing.js:423-425).
    - The spec argued that changing Squad Trust's meaning was save-facing; this is the same kind of change. Either keep
      the deal capability-gated except on a cold catch or beat-the-thumb, or update the capability text and state the
      v13 ripple.

16. **The leak carries an extra, unflagged penalty.**
    - Besides alarm at 60 and facing the door, §1.4 and §3.4 cut REACH to 0.3 s on a leak. That removes the
      beat-the-thumb window, which makes the quiet front close to unwinnable after an investigation mistake that already
      costs Agency −5, contested evidence and the grade cap.
    - Add this to the departures table. Ship the leak behind a single predicate that defaults to off until the PO and the
      v13 owners agree.

17. **The field skill advances only part of the world.**
    - Under "KILL THE WIPE", Obi's run and the perimeter timer advance (§2.2 MG_CFG), but Uche's 9 s round-the-back
      timer, TAKE HER OUT and the child do not.
    - Obi can then reach a kitchen door that Uche "should" already hold.
    - Chain the whole `TAC.m3` mover step in the field-skill hook, or none of it.

18. **The title card mechanics.**
    - `#title-card` is not an `.overlay`, so play keeps running under it (styles.css:785; art_pass_v8.js:2593). WASD still
      moves Kelechi.
    - `then` fires 500 ms after the fade starts (onboarding.js:49), so with the teleport in the callback the player sees
      the porch fade in, then a jump cut. On the side gate the follow camera swoops 14 m through the house unless
      `resetCameraFollow()` is called.
    - The big line `KNOCK AND ANNOUNCE · 21:32` is long for 34 px at .22em on a phone (styles.css:790). Existing cards put
      the time on line 2.
    - **Correction.**
      - Set `movementEnabled = false` and teleport plus reset the camera when the card shows.
      - Start the clock and re-enable movement in `then`.
      - Use `['KNOCK AND ANNOUNCE', '21:32']`.

19. **The minimap blips are static.**
    - `MINIMAP.pois` is a fixed {x, z} list (art_pass_v8.js:1859-1866; engine.js:713-716).
    - Obi's dot stays at the desk while he runs and after the perimeter drop. Uche's stays on the porch while he follows.
      The child's stays inside after she is out.
    - The spec's "outside blip" for GO ROUND THE BACK implies updates it never specifies. Mutate those three entries from
      the mover.

20. **The thin drives-lead result contradicts itself.**
    - It says "Nothing in them names a payment", but:
      - the lead still runs `money:['n_obi']` (v13_data.js:215), unlocking "Every Friday ₦2.5M leaves by transfer";
      - `transfers_lekki.pdf` survives up to 55% (§3.9);
      - the surviving file list is printed verbatim.
    - Word it for what survived (for example "the transfers survive, the ledger that ties them to 'C.A.' does not"), or
      order the shred list so that every transfer file is gone before the ledger.
    - Also: the wiping screen cycles through the files with no fixed order (art_pass_v8.js:1912-1913), so "the order the
      screen already shreds them" is invented.

21. **The STOP_RANGE dead band.**
    - "Move on suspect" keeps range 2.7 while `Stop him` needs 2.2 (§3.4). Between 2.2 and 2.7 m, priority 3 picks Obi
      and the press does nothing (the prototype silently returns, proto_m3.js:236). It also hides the laptop at the desk.
    - Set the interactable's `range` to STOP_RANGE while he runs.

22. **The Squad Trust payoff can be lost silently.**
    - It is paid only if Uche "was still at the kitchen door at extraction" (§1.8).
    - Any order (TAKE HER OUT, COVER), or kneeling on a tackled Obi with no rule for returning to the post, quietly costs a
      player who bought the capability +1 arrest and +6 intel.
    - Return him to the post after a job, or pay it whenever he was posted when Obi was stopped.

23. **The radio order delays the run callout.**
    - The knock line (`m3_knock`, priority 2) shows from t = 0 for about 2.9 s (2600 ms plus a 260 ms gap; onboarding.js:41).
    - Foundations lets a priority-3 line preempt only lines of priority 1 or lower. So "He's running: the back corridor!"
      at 1.5 s waits until about 2.9 s, when Obi is roughly halfway.
    - Cancel `m3_knock` when the run starts, or give it priority 1.

24. **Two indicators for one value.**
    - Foundations' eye shows whenever you are within range + 2 m of an awake watcher (foundations §1g). Obi's range is
      9 m, so it shows across the whole house, on screen or off, which contradicts §1.3's "off screen, the eye shows".
    - The NOTICED tag is also a different visual language from the eye-disc head marker KC gets in M2.
    - Pick one: either use the foundations marker for Obi, or set `hud:false` while the tag is on screen and say so.

25. **The smallest version, and Senior.**
    - Keeping the cut's sight halving without the dimming creates an invisible rule. The dimming is one loop over
      `MANSION.mats` plus three point lights, and the restore is already specified, so keep it.
    - The sketch's "BLIND SIDE" label (§1.1) names the solution route. On Senior that is answer-giving even when earned.
      Keep the facing tick (a fact) and drop the words on Senior.

26. **Uche is invisible to Obi.**
    - On the side gate, TAKE HER OUT is allowed while Obi is unaware (§1.5 restricts only the quiet front). Uche then walks
      the corridor, his cone and the room with the child unnoticed.
    - That contradicts the reason Uche holds the porch on the quiet front.
    - Refuse TAKE HER OUT while Obi is unaware on every quiet entry, or register Uche as a sight target.

27. **"Stay put" is still a strictly worse choice.**
    - Overlays pause the wipe (scenes/mansion.js:303), and the gentle choice walks her out on her own (art_pass_v8.js:1747).
    - So "stay put. Get back to the laptop" saves no time and now costs a return trip. SCOPE called the dilemma false;
      the spec doesn't address it.
    - Either accept it and say so, or let the gentle choice cost real time (Kelechi escorts her to the door while the
      wipe runs).

28. **The halted screen doesn't fit the file list.**
    - The canvas is 512 × 336 (art_pass_v8.js:1891). The halted layout already uses a 52 px header, a 64 px percentage at
      y 84, and lines at y 170 and 200 (:1915-1917).
    - Seven more 21 px lines would end around y 377. Re-lay the screen, for example two columns, or replace the
      percentage block.

29. **Test-plan gaps.**
    - Nothing tests:
      - jog or sprint approaches (finding 1);
      - a touch-jog intercept (finding 8);
      - the stick and sprint overlap (finding 12);
      - v12's wipe toast on quiet (finding 3);
      - Uche's spent interactable (finding 10);
      - the cornered/tackle rule (finding 2).
    - `m3_lib.laptop()` fires the staged hit by hand, so the seizure's `playInteraction` wiring is never exercised. Add
      one assert that `ENGINE.seq` is set with the right spot.
    - `v13_port_playthrough` (legacy, where policies 1 and 2 pick "stay put") is admitted to be unmeasured but is still
      listed as "expected to finish". Run it before any other regression.

30. **Coordination and facts.**
    - market.md names this file `tac_mansion.js` in the shared `TACTICS_JS` list (market.md:340), and telemetry.md uses
      `tac_mansion.js` too. Agree one name and one order.
    - The two specs give Uche different controls: the market posts him by talking to him and has no new UI
      (market.md:754), while the mansion adds a button. Say why, or align them.
    - §2.2's key audit is incomplete:
      - KeyJ opens the Case Desk (v13_desk.js:238);
      - Digit1-9 are live inside field skills (art_pass_v8.js:3002);
      - WASD, the arrows, C and Shift are read through `ENGINE.keys`.

      Q and 1-3 are still free outside overlays, so the plan stands.
    - §3.11 says the strings are ASCII, but "Shh… I dey hide" and the drives text contain "…". They are not banned by
      `A.textRules`, but the claim is false.
