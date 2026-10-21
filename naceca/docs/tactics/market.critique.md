# Adversarial review: `design/market.md` (Phase 1 · Ikeja market, plan items 7–10)

I checked this against the repo. HEAD is `74a0c96`, two commits past `261a000`. The only source change since `261a000` is in
`src/v12/v12_pt.js`, and it touches lines 295 and later, so every v12_pt line the spec cites still holds. I opened every
cited file:line. Geometry was re-checked with `design/critique_work/geo_check.cjs`, run against the scout's
`m2/market_meta.json`: the 46 dressed colliders, the 12 legacy stalls and the van.

Severity: **blocker** means it breaks a binding rule or the spec's own gate. **major** means the player-visible change
fails or is unjustified as written. **minor** means a correctness, copy or test gap with a cheap fix.

---

1. **blocker: the cut ribbon makes chases slower and costs more bystanders than today, and Recruit always gets it.**
   - **Evidence, the spec's own §0 table.**
     - At a 1.3 s reaction, the cut ribbon gives 6.8 s and 1.6 bumps. Today's tail ribbon gives 5.3 s and 0.8 bumps.
     - At 2.5 s it gives 2.0–2.8 bumps against today's 1.4–2.0.
     - The hand-scripted road cut to (12.6, −2.4) gives 5.2–5.9 s and 0.2–0.6 bumps, far better than the ribbon.
   - **Why the ribbon loses.** Its pass rule (§3.6) accepts the first reachable point on KC's next three legs. Those are
     lane points. The spec's own example is (7.6, −7.5), between the traders at (8.4, −4.6) and (7.4, −10.2)
     (market.js:102). Every sprint bump costs −3 trust (pressure.js:164), so the ribbon sends players into exactly the
     lanes the plan wants them out of.
   - **The spec's own gate would reject it.** The §5.1 matrix requires time ≤ today + 0.5 s and bumps ≤ today + 0.2.
     The 1.3 s ribbon cell misses both, and the matrix leaves that cell out (it lists only "cut-ribbon follower at 2.5 s").
   - **Binding rules broken.** `isRecruit()` turns the ribbon on unconditionally (§3.6 "when"). So the easy difficulty
     gets a slower chase with more trust loss than today, which breaks "do not make combat harder". It also contradicts
     plan item 8, "costs fewer bystanders".
   - **Correction.**
     - Ship `ribbonCut:'off'` until a variant passes the matrix on seeds ≥ 20, including cut@1.3 and a Recruit cell.
     - Restrict candidates to points reached without entering a trader lane: the road or stall fronts, x < 7, plus a gap
       crossing. This is the (12.6, −2.4) pattern that measured 5.2–5.9 s.
     - Score the whole P→X route for trader proximity, not only the straight segment.
     - Prefer a point where KC must come to you, so the ribbon does not double back to him.
     - Keep the `wayfind_chase` "ends at KC" assert for live mode only.

2. **major: the stealth scan "from behind" (and most "side" spots) presses KC, not the phone.**
   - **Evidence.** `nearestInteractable` (people_art_pass.js:557-569) picks the highest priority, then the nearest.
     Before the scan, neither the phone nor KC has a priority, and the foundations' spent table only demotes "Confront"
     once `market_runner` is set (foundations §3.1).
   - **What the press does.**
     - Behind him at (9.2, 3.6): KC is 1.26 m away and the phone 1.75 m, so ACTION gives `NO EVIDENCE · Scan the phone
       first` (market.js:147).
     - At (7.8, 2.2) or (8.0, 2.3): the press also goes to KC.
     - At the spec's test spot (7.5, 2.1), the phone wins by 0.06 m (1.90 against 1.96).
     - Across the 508 reachable cells within the phone's 2.0 m range and outside KC's 100° cone, the press picks the
       phone at only **36%** (geo_check.cjs).
   - **Why it matters.** The geometry table's "Scan in reach: yes" measures range, not selection. Yet the habit line
     ("He never looks behind his stand", §1.2) and the Recruit hint `tac_m2_side` send players to exactly these spots,
     and §1.4 says both actions "work from his side or his back". The phone sits at (7.5, 4), 0.5 m in front of KC.
   - **Correction.**
     - Request a fourth spent-table entry from foundations: `'Confront teen suspect'` is spent while `!S.game._marketScanned`.
     - Or give the phone `priority: ()=> S.game._marketTunde && !S.game._marketScanned ? 1 : 0`.
     - Add a grid assertion to `tac_m2_confront`: every out-of-cone cell within 2.0 m of the phone picks the phone.

3. **major: Uche's "hidden" back-gate route jogs 2.8 m in front of KC, inside his cone, in NACECA kit.**
   - **Evidence.** The gate route (§3.4) runs (2.4, 10.6) → (5.0, 6.5) → (5.5, 0) → … It passes 2.80 m from KC at
     (8, 4), and 10.5 m of it lies inside KC's 100° cone within 12 m (geo_check.cjs).
   - **The contradiction.** The design premise is "Back gate. He won't see me till he's on top of me", with the gate post
     hidden and no veer. KC "watches the road" and veers from Uche in the chase, yet he ignores a vested sergeant jogging
     past his counter. The scout warned that only real rendering can show what the camera sees. Here the player will see it.
   - **At the post, Uche stands in the open** at (12.1, −19.9), at the end of the lane KC sprints down.
   - **Correction.**
     - Route Uche round the west side, or down x ≥ 14 behind the east stalls. The 0.8 m trader clearance still applies.
     - Or make Uche's pass a sight event for KC: KC's suspicion floor rises while Uche is in his cone.
     - Crouch Uche behind the okada at the gate, so "hidden" reads on screen.
     - **The kit ratio must be 0.86–0.97 or < 0.7.** A `scale.y` of 0.8 gives ratio 0.8, which plays the `crouch` clip
       (people_art_pass.js:423).

4. **major: Uche's role is undefined if the chase starts before he arrives.**
   - **Evidence.** He jogs about 9 s to the corner and about 13 s to the gate (§1.3). The gate route runs down the back
     lane, x 12.6–13.4, which is KC's own path from (12.6, 7.4) to (12.6, −7.5).
   - **What the spec leaves open.** It defines veer, grab and boxed only for "corner post", "gate post (hidden)" and
     "Pursuit", never for a moving, unarrived Uche. A player who posts the gate and confronts at once (the scan pauses the
     world, so 13 s of play is easy to beat) puts Uche on KC's lane mid-jog. The prototypes never ran that case: Uche was
     teleported to his post.
   - **The port playthrough hits it every time.** `v13_port_playthrough` uses a frozen clock, so Uche only moves during
     the stepped chase.
   - **Correction.**
     - Specify the en-route rule. Either Uche keeps jogging with the veer and grab live (the "moving Uche" rule), or he
       freezes in place as a corner-type blocker.
     - Add cells "posted, chase at +3 s" for both posts to the matrix and to `tac_m2_chase`.

5. **major: the §0 chase numbers come from the wrong lane graph and are within run-to-run noise.**
   - **Wrong graph and wrong spot.**
     - `proto/m2_cut_proto*.cjs` and `m2_merge_proto.cjs` load the scout's `m2_lib` and never install the foundations'
       18-node `MARKET_LANES` or `KC_PATH`. I grepped for `11.43`, `18.6` and `KC_PATH`: no hits.
     - So every cell was run on today's graph, where KC runs through crates (7 of 22 edges blocked).
     - The gate cells used Uche at (12.6, −20.5). The spec ships (12.1, −19.9) and a different last leg, via (7.6, −18.6)
       → (12.6, −18.6).
   - **Noise.** The spec itself shows the same seed giving 8.3, 9.8 and 13.0 s. Many cells are 1–2 runs of 5 seeds:
     "cut ribbon 2.5 s: 10.6 · 12.0" against "today: 8.3 · 9.8 · 13.0". At that size they cannot be told apart.
   - **Cells nobody measured.** The matrix (§5.1) has none for the new openings: soft, range bolt, and the HE SAW YOU
     auto-bolt, where the chase starts without a player press. The last adds a reaction delay at 2–6 m.
   - **What rests on these numbers:** horizon 3, the 4.5 m veer ring, the "5/5 by Uche" gate guarantee and the 3.5 m
     cut radius.
   - **Correction.** Re-run every §0 cell with the foundations' lanes and path installed and the shipping post spots, on
     ≥ 20 seeds seeded inside the run's `h.ev`. Add the three openings, with a 1.0 s reaction, to the matrix and its gate.

6. **major: plan item 8 is undelivered for Senior players without the tip, and the spec contradicts itself on it.**
   - **Evidence.** Plan item 8 says "the route ribbon shows the cut, not the tail". The scout found that the ribbon "leads
     players down the lanes behind him" (SCOPE market §Interception).
   - **The contradiction.** §1.7 and §3.6 say that on Senior without the route the ribbon is "unchanged" (today's
     `routePoints`, chase.js:76-101). §8.1 says "Perception (his current heading) on everyone". No such perception mode is
     specified anywhere.
   - **Who is affected.** First-time Senior players who chose "Bring him in now" keep the tail ribbon that leads them down
     the trader lanes.
   - **Correction.**
     - Delete the §8.1 "perception" claim, or specify it.
     - On every difficulty, add a trader-proximity cost to `routePoints`. It already adds 1000 for blocked segments
       (chase.js:80); add, say, +6 m-equivalent for a segment passing within 0.8 m of a standing trader.
     - That is navigation, not answer-giving, and it stops the ribbon from teaching the opposite of the cut.
     - Measure it in the matrix.

7. **major: two Senior-visible Tunde lines are hints, not feedback.**
   - **The 1.5 s text (§1.1)** shows to every player before anything has happened: "He can see anybody standing out in
     that road." It states the rule of the meeting test ahead of the test. That is telling the player what to do (stand on
     the stall side), so it is a hint.
   - **The "twitchy" line (§1.2)** is an imperative: "Make you no stand for road like this" / "Don't stand out in the road
     like this."
   - **The context.** The spec puts both in the ✓ Senior column (§1.9) and leaves the question open (§8.4). The binding
     rule is explicit: telling the player what to do next is Recruit only.
   - **The 4 m bark is acceptable** if it stays a present-state report ("the boy can see you out in the road"), like the
     eye's live why-line. But it must agree with the sight model (see item 8).
   - **Correction.**
     - Move the 1.5 s text to Recruit, or rewrite it as a non-rule fact ("I'm at my spot across the road from him").
     - Reword the twitchy line as an observation: "He dey look this way, oga! E don see us." / "He's looking this way, sir!
       He's seen us."
     - Put the open question to the product owner as resolved by the rule, not as a preference.

8. **major: the Tunde meeting test is a second sight model, so its why-line can contradict the eye. Its consequence also
   evaporates before you reach KC.**
   - **It disagrees with the sight module (§3.3).**
     - It uses 15 m, beyond KC's 12 m lit range (foundations §3.5).
     - It deliberately ignores "the sign" slab, which the shared module does treat as blocking. That slab is at
       x 6.96–7.04, z 2.8–3.7, y 1.25–1.95. At Tunde's 23° bearing, KC's 1.5 m eye-line crosses x = 7.0 at z ≈ 3.57, inside
       the slab.
     - So "He saw you talking to Tunde in the road" fires where `TAC.sight.probe('kc', …)` would say not visible.
     - The player then learns from the eye that beyond 12 m is safe, while the meeting rule punishes 13.4–14.6 m.
     - The eye shows only within range + 2 = 14 m (foundations §1g), so at 14.2–14.6 m the promised "eye appears with the
       line" does not appear.
   - **The consequence evaporates.**
     - `reset(45)` at ≥ 13.4 m drains at 8/s (foundations §3.5). It drops below notice in about 3.8 s and to 0 in about
       5.6 s. The walk to the counter takes 4.7 s jogging or 9 s walking.
     - "KC starts wary" (plan item 10) is therefore invisible on arrival.
     - It also logs a spurious `evaded{how:'distance'}` after every seen meeting.
   - **Correction.**
     - Run the meeting test through `TAC.sight.probe` with a meeting-only `range` of 15. Either respect the sign, or
       declare it a ghost for KC, but use one model.
     - Make "seen at the meeting" a lasting attention change. The Heat rule already exists: phone phases ×0.75 and look-up
       +0.4 s for this run. Use that instead of a draining 45.
     - Suppress `evaded` for a reset-originated notice.
     - Or move Tunde into shelter. Positions may change; update `wayfind_minimap`, as the scout proposed.

9. **major: "KC looks up" has no effect at the moment that decides the outcome, the scan press.**
   - **Evidence.** `exposedNow` (§3.1) is `st.seen ‖ (inCone && inRange && los clear && dist < 3)`. It depends on
     position only.
     - At the counter front he sees you even with his head down (§1.4).
     - At the side spots, 75° off his facing, he never sees you, even mid-look-up.
     - So the phone/look-up cycle only matters while crossing the road. Its effect there (cold against soft) is drained
       away by the time the player is at the counter.
   - **Plausibility.** You lift a phone 0.5 m in front of his hands. The `m2_unlock` sub-text says Tunde "watched KC
     unlock it at the counter". The press counts as unseen purely because your body is off his axis. The scout flagged
     this narrative mismatch ("you draw KC's unlock pattern on his phone 0.5 m from his hand").
   - **Correction.**
     - Evaluate the scan exposure at the phone's position (the hand), with KC's current `attention()`. In the look-up
       phase an in-cone hand is seen; in the phone phase it is seen only within about 1 m.
     - Then the readable decision is "wait for head-down, then lift". Assert it in `tac_m2_confront`: the same side spot
       in the look-up phase gives HE SAW YOU, and in the phone phase it does not.

10. **major: the "smallest version" (§7) breaks feedback truth and leaves preparation text visibly false.**
    - **CAUGHT COLD can lie.** The smallest version drops "the scan exposure and auto-bolt" but keeps the router with
      CAUGHT COLD. A player can scan in full view at the counter front, step aside, let suspicion drain below 20, and get
      "CAUGHT COLD · He never saw you coming". That is false.
    - **The Pursuit line becomes visibly false.** It drops the radio rewrite and Pursuit movement. v12's "I'm cutting
      through the back — push him towards me!" (v12_core.js:269) then plays while the player can see Uche standing at the
      van or a post. That is more false than today, when Uche is simply absent.
    - **Plan item 10 is half delivered.** It drops the meeting test, the bark and the habit line: "depending on where you
      meet him" is gone.
    - **Correction.**
      - Keep a scan-exposure floor, without the auto-bolt: an exposed press sets susp ≥ 60 and freezes "He saw you lift
        his phone".
      - Keep the `V12.say` rewrite. It is about 5 lines.
      - Keep the meeting test once it is rebuilt per item 8, and say which half of item 10 the smallest version ships.

11. **minor: `V12.say` rewrite is not scoped to M2.**
    - **Evidence.** The rewrite fires on exact text (§2.3), but v12_core.js:266-269 schedules the same line for Ifeanyi
      in M6.
    - **Correction.** Rewrite only when `S.game.currentMission==='m2' && CHASE.active && CHASE.active.runner===ENGINE._marketKC`.

12. **minor: KC's facing logic is reversed, and two claims about `_faceT` are moot.**
    - **Reversed facing.** "KC is turned to face Kelechi before onCaught's `rotation.y += π`" (§1.8) leaves him facing
      away from you. Set `yaw = atan2(toPlayer) − π` before `onCaught` (market.js:163).
    - **`_faceT` does nothing on KC.**
      - `updateFacing` (guidance.js:120-130) only turns `ENGINE.npcs`, and KC is never pushed there (market.js:124-126).
      - So risk 6's "clears `_faceT`" is a no-op.
      - Uche (also kept out of npcs, §3.4) will not turn to face Kelechi when talked to. Turn him in the layer.

13. **minor: the regression reasoning for `visual_*` and `pt_logger` is wrong, though harmless.**
    - **Evidence.** Neither scenario calls `wayfind_lib.boot`, so the stub ignores `position.set` and every position
      reads 0.
      - `pt_logger` puts the player on Tunde, at 0 m (pt_logger.cjs:13). `_visual_lib.cjs:198` opens `market_intro` with
        everyone at (0, 0).
      - So the meeting test does run. It is not "15.2 m" or "9.65 m" as §5.2 says, and it inserts the habit line. That
        line is unexposed only because the whole crowd sits on top of you.
    - **Correction.** Fix the §5.2 text, and have `tac_m2_tunde` call `lib.boot`.

14. **minor: hook-table omissions and access paths.**
    - **Missing inner wraps.** `sideSetup` is also wrapped at v12_street.js:290. `musicForScene` is also wrapped by v13 at
      v13_desk.js:55, which records `MUS.last`; ignoring calls during capture means v13 never sees `m6_chase`, which is
      fine but should be stated.
    - **`CAPS` is private** to the v12_core IIFE (line 141). Mutate the Grey Man and Pursuit entries through the global
      `SKILLS.fieldcraft` (they are the same objects, v12_core.js:158-159).
    - **No fallback for foundations hooks 1–2.** The spec gives one for hook 3 only. Hook 1 is `reset(v, {cause, why})`;
      hook 2 is not writing `rotation.y`. If foundations declines, the why-line and the rotation fight are unspecified.

15. **minor: CUT HIM OFF has no line-of-sight test, and the capture leaves state behind.**
    - **No LOS test.** At 3.5 m, ±40° covers ±2.25 m laterally, which can include a player behind a counter. Add
      `!WAY.segBlocked(P, R, 0)`.
    - **No `stopChase` named.** The spec never says the cut-off, boxed and Uche paths call `stopChase()`. Without it the
      chase resumes after the dialogue.
    - **`_stagger` survives the cold grab.** The capture runs `origConfront`, which sets `ENGINE._stagger = 0.5`
      (market.js:151). Reset it after a cold grab, or the player is slowed to 0.35× for 0.5 s after the dialogue.
    - **No chase clock.** pressure.js never advances `c.t`, so "chase time ≥ 1.5 s" needs its own clock. The prototype
      used `c._t`.

16. **minor: HE SAW YOU is overwritten after 0.8 s.**
    - **Evidence.** The bolt at +0.8 s goes through `origConfront`, whose "seen" row toasts `HE'S RUNNING · KC shoves a
      tray…` over it (util.js:11 replaces the toast). The eye hides once the chase starts (`active()` requires no chase).
      So the "why" is on screen for 0.8 s, under the 8-word reading time.
    - **Correction.** Rewrite the bolt toast in this case: `HE SAW YOU · He saw you lift his phone — he shoves a tray and
      runs.` Assert in `tac_m2_confront` (d) that the toast at +1.0 s still names the phone.

17. **minor: the van callouts give route knowledge on Senior without the tip.**
    - **Evidence.** `He's in the back lane, heading for the back gate!` (§1.7.4) names KC's destination. That is exactly
      the knowledge the cut ribbon withholds without Tunde's tip or tier 3.
    - **Correction.** Report the lane and his direction ("heading south down the back lane"). Name the gate only when the
      route is known.

18. **minor: Uche's van spot puts the player in KC's cone.**
    - **Evidence.** (2.4, 10.6) is 8.66 m from KC and 49.7° off his facing, just inside the 50° half-cone and inside the
      12 m range. The radio prompt asks the player to go there after Tunde, so posting Uche during a look-up raises KC's
      suspicion. Preparation should not cost stealth.
    - **Correction.** Move Uche behind the van relative to KC. For example (−2.4, 11.6): 12.9 m from KC, out of range, and
      3.3 m from the step-out point.

19. **minor: Uche is available before Tunde.** Nothing gates `'Post Sgt. Uche'` on `_marketTunde`. His first line ("a lane
    behind his stall") presumes KC has been identified. The odd-k policies of `v13_port_playthrough` approach Uche first
    (`pool.slice().reverse()`, v13_port_playthrough.cjs:112), and the driver re-posts every loop, logging an `order` each time.
    Gate the post on `_marketTunde` (before that: `SGT. UCHE · I'll hold the van, sir.`), and log `order` only when the post
    changes.

20. **minor: the takedown beat.**
    - **Freeze movement.** Movement isn't frozen during the 1.4 s `TPCAM.override` (art_pass_v8.js:53), so the player can
      walk blind. Set `ENGINE.movementEnabled=false` for the beat.
    - **Reduce motion.** The override lerps the camera (art_pass_v8.js:56-57), which is a swoop, not a cut. Skip the beat
      when `SETTINGS.reduceMotion==='on'`.
    - **Dialogue at range.** `market_runner` then opens with Kelechi up to 20 m away. Its choice "Slap the phone out his
      hand" assumes he is at arm's length. Walk Kelechi to KC under the beat, or open the dialogue when he is within 3 m.
    - **Copy at the gate post.** "took him down in the back lane" and "Got him! Back lane" are wrong there. Use the place
      name.

21. **minor: copy against the scene.**
    - **The chain.** Tunde's "That gate get chain" contradicts the dead end, which is a parked okada (foundations §1b) with
      the endLine "The back exit is blocked" (market.js:159).
    - **"He doesn't know I clocked him."** Canon line 2 (config/dialogue.js:38) now follows the inserted "He's looking
      this way!". Reword the inserted line so the pair reads.
    - **Tier 3 text.** The new text ("in a chase, the red line shows where to get in front of a runner") is false in M6.
      It also drops the still-true ×0.97 slowdown (chase.js:166). Scope it: "…of a runner in Ikeja; runners are a little
      slower".
    - **Grey Man text.** The `where` text should also name the mansion, since foundations' `rate()` applies ×0.65 to every
      watcher. Its desc still says "When you tail someone".

22. **minor: the forensic bypass promises noise but is silent.**
    - **Evidence.** The phone's FORENSIC BYPASS says "slow and noisy" (art_pass_v8.js:3938), with KC 0.5 m away, but
      nothing in the spec reacts to it.
    - **Correction.** Treat a forced bypass as a noise event at the phone (heard within 2.5 m), or make the note truthful
      ("slow").

23. **minor: telemetry fixes needed.**
    - **Successful confronts read as failures.** `v12_pt` classifies a confront that starts a chase as `refused`: a toast,
      no `progressSig` change and no overlay (v12_pt.js:141-142). Today's confront already does this, and the spec's soft
      and range openings will too. The telemetry spec's "which interactions failed?" then counts every successful confront.
      Give a chase start a resolution the logger can see, or ask the telemetry owner to treat `CHASE.active` changing as
      `progress`.
    - **`order` lacks fields the contract needs.** It is missing `src` and `ok`, which telemetry §4.4 requires; the
      "Uche counts as an approach" rule reads `src`.
    - **The post-scan alarm beyond 6 m is unspecified.** Foundations says there is no decay once alarmed, so the eye stays
      at alert indefinitely. Define a `reset`, as for the pre-scan case.

24. **minor: KC's idle muddies the look-up.** art_pass_v8.js:2019 randomly sets every non-wandering proxy, KC included, to
    `_idle='talk'`. A gesturing KC in the look-up phase reads as chatting, not watching. Set KC's `_idle='idle'` in the
    build wrap, and check it under §6.

25. **minor: things deferred to devices that the harness can check.**
    - **The dialogue fit.** "3 choices fit at 844×390" (§6) is checkable in the harness, which runs real Chromium layout
      and CSS. Assert it in `tac_m2_uche` with `--w 844 --h 390 --touch 1`.
    - **The hidden pills.** v12.css:11 hides `.hud-topleft-controls` (CASE FILE, SKILLS, MENU) whenever `#eye-ind` shows.
      KC's eye covers a 14 m radius around (8, 4), most of the M2 street, until he is decided. So the desktop pills are
      gone for most of M2. That is deterministic CSS, not a device question. Ask foundations to exempt or move the pills.

26. **minor: "cover works" in M2 is crowd-only.**
    - **Evidence.** Plan item 7 lists "crouching behind something lower than you breaks sight". Foundations measured no
      crouch cover in KC's forward cone, and the spec adds none. It also leaves foundations' `TAC.sight.conceal`
      ('browse') unused.
    - **Correction.** Reuse an existing prop, as the binding rules allow positions to change: a dressed crate, a parked
      okada, or a JUST BROWSING stall front on the road's east edge. Crouch cover is then testable in the market, not only
      at Lekki.

---

## Count

- **Blocker:** 1 (item 1)
- **Major:** 9 (items 2–10)
- **Minor:** 16 (items 11–26)

## Checked and found as the spec says (no action)

- **Cited code.**
  - `V12.wrap` order, and the global call paths of every wrapped function: `updateNPCs` → `updatePressure` →
    `updateChase` → `chaseExtend`; `toast`, `startDialogue`, `endDialogue`, `completeMission`.
  - The capture premise: market.js:149-180 calls `startChase` last and synchronously.
  - `effect.flag` works without two-tap arming (util.js:43 against dialogue_system.js:75).
  - `DLG.scriptKey` survives `next` (dialogue_system.js:87-90).
  - v12_pt's `onCaught` chaining, so a cold grab logs no `chase_end`.
  - The `wayfind_escape` 6 m pursuer stays outside 3.5 m.
- **Geometry.** Uche's route lengths (26.1 / 39.0 m), no collider hits, and the KC path timing (10.1 s).
- **Other lines.** The `market_runner` readers. paper.css:99 (green POIs), :120 (`.kbd` hidden on touch) and :123
  (44 px choices). build.py:97/168-179.
