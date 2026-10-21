# Critique of foundations.md (Phase 0 and the shared sight module)

Checked against `claude/naceca-bundle-integration-133395`. HEAD is 74a0c96. It differs from 261a000 only in
`v12_pt.js` (the survey interval), `pt_logger.cjs` and the built page, so every file:line below holds for both commits.
Most of the spec's citations are accurate: build.py:97/171-179, engine.js:506-553/631-634/654, people_art_pass.js:490/515/557-569,
art_pass_v8.js:1134/1145/1713/1842/2355/2372/2387/2451/2528/2652, onboarding.js:26-43/56-73, settings.js:14/52/135,
pressure.js:38/42/60/202, market.js:8-13/41/157, mission_flow.js:206 and v12_core.js:23-27/452-456. Every wrapped name is
a top-level function declaration, so the window wraps fire on the real paths. The problems are below.

Count: **1 blocker, 8 major, 19 minor.**

---

## Blocker

### 1. Replacing `_radioNext` deletes two shipped wraps: the "OVERHEARD" relabel and radio voice-over
- **Evidence.**
  - Spec §2.3 says to "replace `_radioNext` (same markup…)", and §3.6 says the "markup [is] identical to onboarding.js:31-41".
  - `_radioNext` is already wrapped twice:
    - **v12_night.js:240-248** rewrites `#radio-sub .rs-who` to "· OVERHEARD · ON THE PHONE" for the speaker
      `'COMMANDER ADAEZE · ON THE PHONE'`. Those lines are v12_night.js:174-176. They carry the planted phrase "Nobody needs
      to be a hero… My way", which is the Night Shift clue the finale pays off.
    - **v12_vo.js:90-94** calls `V12.playVO()` for every radio line shown. That covers vo01–vo07 (cold open) and vo16.
  - `V12.wrap` (v12_core.js:23-27) captures `orig` in a closure. If TAC assigns a fresh `window._radioNext`, both wraps
    drop out of the chain for good, and they cannot be re-inserted underneath TAC.
  - No scenario covers either behaviour. A grep for OVERHEARD/playVO in tools/harness/scenarios finds nothing, so the
    regression would ship silently. Preempting a line would also leave its VO audio playing.
- **Correction.** Pick one of these:
  - (a) Don't replace `_radioNext`. Wrap it outermost and reorder or prune `RADIO.queue` before calling `orig`, which
    still does the `shift()`. Defer preemption. The base timer at onboarding.js:41 can't be cancelled, so preemption needs
    (b).
  - (b) Keep TAC's own `_radioNext`, but re-apply both behaviours explicitly after it renders: the OVERHEARD regex from
    v12_night.js:244-246, and `V12.playVO(text)`. On a cut, call `V12.stopVO()`.

  Add `tac_radio` asserts for both:
  - the night phone line renders "OVERHEARD · ON THE PHONE";
  - a stubbed `V12.playVO` is called once per shown line, and never for an expired or dropped line.

  Since §7 already allows `tac_radio.js` to slip to Phase 1, the safest Phase-0 option is to ship it later, built as (a)
  or (b).

---

## Major

### 2. The radio defaults drop story lines and still don't deliver Uche's callouts
- **Evidence.**
  - §3.6 classifies every `SGT. UCHE…` line as priority 2 with an **8 s expiry**. It calls the Uche lines at
    v12_core.js:269/:278/:307 "all tactical", but misses two others:
    - **v12_core.js:414**, the narrative "The magistrate won't look at that table again today… We go to Lekki without
      it";
    - **dialogue_system.js:168**, the shrine directions "Pots are on the altar left of the door. The cache is round the
      back…".
  - v12_core.js:278 is also not a callout: "Take the extra time on that cabinet" is how the player learns about a timer
    bonus.
  - Priority 2 never preempts (§3.6: only priority 3 does). A v13 bulletin is shown for `Math.max(4200, len*52)` ms
    (v13_intel.js:633), which is about 8.3 s for 160 characters. So any of these lines that arrives during a bulletin waits
    more than 8 s and is **dropped**. Bulletins play in every field operation, m2–m8 (`RADIO_OPS`), including the shrine.
  - The new helper `TAC.radio.say` defaults to priority 2 with a **4 s** expiry (§3.6). The market spec uses priority 2
    with ttl 3 s for `uche_call` (market.md:534). Plan item 5 asks for callouts that "arrive when they matter". These
    defaults make them expire behind a bulletin instead.
  - The queue cap evicts "the oldest line of the lowest priority". That can be a cold-open story line (prologue.js:288-297
    queues three at once).
- **Correction.**
  - Lines from existing callers (no `opts`) should keep **no expiry**, never be capped out, and keep their FIFO order.
    Classify them only for ordering: bulletins 0, everything else 1, Uche 2.
  - Only lines that pass `opts.ttl` should expire.
  - Make `TAC.radio.say` default to **priority 3**, or let priority ≥2 preempt priority ≤0 after 1.2 s, so a keyed callout
    can cut a bulletin.
  - Apply the cap to keyed lines only.
  - Test: queue a 160-character `RADIO_STATION` line, then the dialogue_system.js:168 Uche line. It must still show.

### 3. On desktop the gait model can't walk, so stealth there is louder and faster to detect than on a phone
- **Evidence.**
  - On the skinned rig, the keyboard only produces jog: `else { speed = MOVE.jog; clip = 'jog'; }`
    (people_art_pass.js:518). Walk exists only for touch with the stick under 0.62 (:517). The fallback rig is 3.0 or 5.2
    (engine.js:508).
  - §3.4 measures gait by speed: walk < 2.2 and jog < 4.2. So every desktop player moving normally counts as **jog**:
    heard at 4.5 m instead of 2.5 m, and sight gain ×1.15.
  - The why-line "walking" (§3.7) never appears on desktop.
  - The §3.5 time-to-alarm table and the "walking" tests (§5.2 tac_sight (a)) model a gait desktop can't produce.
  - This breaks the desktop/phone parity rule, and it makes stealth harder on one device for no reason.
- **Correction.**
  - Base the noise and gait classes on the player's normal pace: jog at 3.0 m/s and below counts as walk for detection.
    Only sprint (≥ 4.2) and its touch equivalent are loud.
  - Or read the clip or input: keyboard without Shift counts as walk.
  - Re-derive the §3.5 table for the pace each device actually uses.
  - Add a `tac_sight` case run at 3.0 m/s, desktop and touch, that asserts the same gain.

### 4. "Move closer — <label>" can name hidden targets on Senior, and the spec contradicts itself here
- **Evidence.**
  - §1a says that on Senior the miss line "never names a target the tracker does not". The same section then says "if the
    nearest target is within its range + 1.5 m, the chip reads 'Move closer — <its label>'", and §3.1 copies v12_pt's
    threshold.
  - v12_pt's nearest-target search (v12_pt.js:120-122) **ignores `mesh.visible`**. Unrevealed SCAN traces are interactables
    with `visible = false`, labelled `'Log trace: ' + name` (art_pass_v8.js:3756-3761, revealed only by `sideScan`
    :3790-3800).
  - The prototype (proto/proto_layer.js) doesn't implement "Move closer" at all, so this path is untested.
  - If the label comes from that search, a Senior player is told where hidden side-evidence is. That is an answer-giving
    hint.
- **Correction.**
  - Specify the candidate set as the same filter `nearestInteractable` uses: not consumed, `mesh.visible !== false` unless
    `allowHidden`.
  - On Senior, show "Move closer" only when that target **is** the tracker's target (`WAY.resolve().mesh === it.mesh`).
    Otherwise fall back to "Nothing in reach — <tracker text>".
  - Escape the text, because it goes into `showHint`'s `innerHTML` (onboarding.js:19).
  - Add a `tac_interact` case: an unrevealed trace 1 m beyond its range, on Senior, must not be named.

### 5. The sight API is missing contract items both downstream specs depend on
- **Evidence.** market.md:399-410 and mansion.md:451-466 request additions that §3.7 does not define:
  1. `w.reset(v, {cause, why})`, which emits `seen` with that cause. Market causes are scan, fumble and tunde; mansion
     causes are knock, loud and tipped. telemetry.md:451 already lists those causes as `seen` values.
  2. Ownership of `mesh.rotation.y`. §1g has the module glance the watcher's facing up to 35°. The market owns KC's
     rotation and asks the module never to write it when `facing()` is given, and to expose `state.glance`.
  3. `TAC.onTick(fn)`, on the same fixed 10 Hz step. Otherwise each phase wraps `updatePressure` again, in
     load-order-dependent order. The market wants to run before TAC; the mansion wants to subscribe.
  4. Per-watcher `gain` and `levels{notice, alarm}`.
  5. Which NPCs count as "companions" excluded from crowd cover (R3).
  6. Spent entries for 'Post Sgt. Uche' and 'Walk her out'.
- **Correction.**
  - Add all of these to §3.7 with defaults.
  - State that the module never writes rotation: it exposes `state.glance` and the owner applies it.
  - Cap per-watcher `gain × rate` so a watcher is never faster than standard pace at "hard". Otherwise the mansion's Obi
    ×1.6 brings back "harder for its own sake" through the side door.
  - Add API tests for `reset(v, {cause})`, which must emit exactly one `seen`.

### 6. Rewriting `it.priority` to mark spent targets breaks when a later layer sets priority
- **Evidence.**
  - §2.4: "Interactables get `_tacSpent` and a wrapped `priority` function", and only "undecorated" ones are decorated.
  - The mansion spec sets Obi's priority to 3 while he is free (mansion.md:345). The market spec says that if the table
    stays closed it "sets these two priority functions itself" (market.md:408).
  - Either assignment after decoration silently removes the spent rule, and the `_tacSpent` flag stops TAC re-decorating.
    That brings back the 13-cell post-arrest steal, or the 91-cell phone steal.
  - `nearestInteractable` reads `it.priority` fresh on each call (people_art_pass.js:565).
- **Correction.**
  - Don't mutate interactables. In the `nearestInteractable` wrap, re-run the selection with an effective priority: −1 if
    the spent predicate holds, otherwise the item's own priority. Or call `orig` with a temporary filtered view.
  - If mutation is kept, re-decorate whenever `it.priority !== it._tacWrapped`.
  - Test: assign `it.priority = () => 3` after the first frame. The arrested Obi must still lose to the drawer.

### 7. The art-failed mansion has no obstacles, so a watcher there sees through every wall
- **Evidence.**
  - `buildSceneMansion` falls back to `buildSceneMansionLegacy` when `!ART.ready` (art_pass_v8.js:1643). mansion.js has no
    `addObstacle` at all, and SCOPE.md confirms "the legacy 24 m room with 0 obstacles".
  - §3.2 provides a legacy **market** table, but no legacy mansion table and no fallback.
  - §4's `geo_drift` fires whenever "the mansion has fewer than 39 matches". That means every art-failed device, every
    time, and those are usually the low-end phones.
  - Obi's watcher (Phase 2) would see the player through walls on exactly those devices.
- **Correction.**
  - Add `TAC.geo.ready()`. It returns false when the scene has no table, for example `S.game.currentMission === 'm3' &&
    !ENGINE._mansion`.
  - Have `TAC.sight.watch` refuse or freeze watchers when it returns false: no eye and no gain, which keeps today's
    behaviour.
  - Log a single `geo_drift {reason:'legacy'}` per scene build.
  - Key the mansion table on `ENGINE._mansion`, not `ENGINE._dress`. The art mansion never calls `dressScene`, so
    `_dress` is null there. §2.3 only mentions `_dress.key`.
  - Test the legacy mansion in `tac_geo_mansion` as well.

### 8. The chase-lane change isn't shown to leave the chase as easy, and the paired prototype runs got worse
- **Evidence.**
  - Old and new paths from proto/probe4.json:

    | Start | Delay | Old | New |
    |---|---|---|---|
    | (5.8, 4.6) | 0 s | 1.63 s, 0 bumps | 5.42 s, 2 bumps |
    | (8, 1.6) | 4 s | 5.45 s, 0 bumps | 7.37 s, 1 bump |
    | 8 runs | — | 6 bumps | 8 bumps |

  - The first ~33 m of the path are identical, so the spec puts the difference down to the unseeded crowd. That is
    unproven.
  - Bumps cost Public Trust (the plan: −1.6 to −8.4).
  - `tac_lanes` only asserts "caught within 30 s, 8/8", which can't catch a regression.
  - "Do not make combat harder" is a binding rule.
- **Correction.**
  - Make `tac_lanes` a **paired** comparison over N ≥ 10 seeds: the same seed and start, the old path and lanes versus the
    new.
  - Assert that the median catch time and the mean bumps under the new layout are ≤ the old values plus a small tolerance.
    Report the distribution.
  - Seed inside the same `page.evaluate` that calls `loadMission`. Use the `state` hook of `h.start`; see #18.
  - Run under `frozenClock` + `__wf.run`, so wanderers can't move between seeding and the build.

### 9. Old saves and the suite: an incomplete regression list, a misdirected "watch" list, and test gaps
- **Evidence.**
  - §5.3 says `casework_lagos` and `v13_port_*` might "use `tryInteract` positionally". A grep shows **only pt_logger.cjs**
    calls `tryInteract()`. The others call `it.onInteract()` directly, so no existing scenario covers the spent rule or
    the miss line.
  - The radio regressions in #1 and #2 have no coverage.
  - `casework_settings.cjs` covers RESET for the casework row only.
- **Correction.**
  - Drop the misdirected warning.
  - Add the radio tests from #1 and #2.
  - Add a settings test: an old settings blob without `crouch` loads as `'auto'`, the value persists across `loadSettings`,
    and RESET restores `'auto'`.
  - In `tac_interact`, drive at least one m2 and one m3 run through `tryInteract()` and the `#ctx-main` click, not just
    `nearestInteractable`.

---

## Minor

10. **The eye hides the desktop menu pills for most of the market.**
    - v12.css:11 hides `.hud-topleft-controls` (CASE FILE / SKILLS / MENU / CASE DESK) whenever `#eye-ind.show`.
    - §1g shows the eye within range + 2 m of an awake watcher: 14 m for KC, and the m2 spawn is 9.65 m away.
    - **Correction:** show the eye only while `susp > 0`, or `inCone && inRange`. Or override the v12 rule under
      `body.tac-eye`.

11. **The spec contradicts itself about v13, and misses a `newScene` wrap.**
    - §2.6 says "v13 does not wrap any hook above". §2.3 itself lists v13_boot.js:108 wrapping `ensureHudV8`.
    - §2.3 lists the inner `newScene` wraps as chase.js:180 and wayfind.js:370, but misses **v12_car.js:1298**.
    - **Correction:** fix both lists.

12. **The vision-box schema can't hold the sign, and the prototype numbers differ from the spec's.**
    - The sign slab is "y 1.25–1.95", but the `vis` schema is `{kind, h, name, box}` with no bottom. The prototype `los`
      uses y0/y1 (tac_proto_page.js:47, 75).
    - The prototype's stall box is cx±0.485 / cz±1.08 and KC's stand box is x 7.0–7.97. The spec gives ±0.45 / ±1.0 and
      7.15–7.75. The 479/479 survey was measured with the prototype's boxes.
    - probe1.json `device.vision.unknown` lists **28 unknown** boxes: 20 buildings and 8 posts. "0 unknown" and "ghost by
      the blocker rule" are rules, not measurements.
    - **Correction:** add `y0` to `vis`, use one set of numbers, and re-run the survey with the final rules.

13. **Toggle state is lost in overlays, and blur is ambiguous.**
    - In toggle mode the capture listener "ignores … any open overlay". bindInput (engine.js:286, 302) then sets KeyC true
      on keydown and false on keyup, so pressing C in the pause menu stands a toggled crouch up.
    - **Correction:** in toggle mode always swallow C, except in text fields.
    - Also say whether `blur` clears a *toggled* crouch. It shouldn't.

14. **Hold mode on touch needs three precise rules.**
    - The capture `click` blocker on `#hud-ctx` must filter to `#ctx-crouch`, or it also kills ACTION and SCAN.
    - The listeners must read `SETTINGS.crouch` when each event fires, not when they are attached, so a change mid-mission
      applies.
    - The settings row `note` is a static string (settings.js:178), so a per-device note needs a getter.

15. **The smallest version drops a plan requirement.**
    - Plan item 4 names "hold or toggle setting". The smallest version ships "hold mode only. The setting row can follow."
    - In hold mode the desktop chip shows only while the player is already holding C, which is the case it helps least.
    - **Correction:** keep the row and the toggle in the smallest version. That is about 40 lines.

16. **The noise-hint id has no text.** §2.4 writes `S.game._hints.tac_noise`, but no `tac_noise` hint text is defined
    anywhere. Define it (Recruit only) or drop the id.

17. **An alarm can leave the eye stuck at 100%.** §3.5 says there is no decay once alarmed ("the consumer resets"). A
    consumer that never calls `reset()` leaves the eye full forever. **Correction:** add a default, such as decay resuming
    6 s after alarm when no `onLevel` handler exists.

18. **Seeding before `lib.start` is not deterministic.**
    - `T.seed` runs in its own evaluate before `lib.start`, while the rAF loop keeps running in between (run.cjs:69-72).
    - Wanderers re-roll their targets with `Math.random` (market.js:85).
    - **Correction:** seed in the same evaluate as `loadMission` through `h.start`'s `state` hook, and freeze the clock
      first.

19. **The mansion shim list is incomplete.** §5.1 lists `PEOPLE.make` and `MANSION.instantiate`, but the shim that works
    (mansion_work/m3lib.cjs:13-15) also needs `PEOPLE.updateAll` and `PEOPLE.syncLook`. Without them, tick calls
    `PEOPLE.updateAll` every frame on the shimmed rigs (art_pass_v8.js:2604). List all four and restore all four.

20. **Two `tac_sight` cases are fragile.**
    - Case (b), "crouched 0.4 m behind a stall counter": on the lane-facing sides the legacy collider keeps the player
      ≥ 0.9 m from the counter (0.6 m of collider plus the 0.3 m pad). **Correction:** assert `!blockedAt(x, z)` for every
      probe spot, and place (b) at a counter's z end.
    - Case (a): notice in "≤ 1.3 s" at 6 m. The formula with grace gives about 1.27 s, not the "about 1.1 s" in §3.5. Fix
      the text, or the bound is a coin flip.

21. **Grey Man's description becomes untrue.** §3.5 applies Grey Man ×0.65 to KC and Obi. The skill text says "When you
    tail someone…" and lists "The courier · the finale tail" (v12_core.js:144). Update the skill's `desc` and `where`
    from the layer, by mutating the array entry, so preparation is visible on the skill tree.

22. **Crowd cover ignores geometry and varies by device.**
    - Any bystander within 1.7 m zeroes sight gain, even when the bystander is behind the player or the player stands at
      KC's elbow (prologue.js:189 has the same rule, but the courier never comes within 3 m).
    - On low-graphics phones half the wanderers are removed (art_pass_v8.js:2008-2016), so those phones get less cover.
    - **Correction:** require the bystander to be within about 0.9 m of the watcher→player segment, or nearer the
      watcher than the player is. Disable crowd cover within 3 m of the watcher. Count traders only, or the thinned
      crowd, on every device.

23. **The head marker overlaps the action label.** At labelY 2.05 (art_pass_v8.js:2423) the marker and KC's "Confront
    teen suspect" world label share a spot. Hide or offset the marker when `ENGINE._nearIt.mesh === watcher.mesh`, as
    `updateMarkers` already does for evidence pips (:2464-2466).

24. **Eye styling gaps.**
    - Reduced motion: `#eye-ind.watching svg` blinks on every tick he can see you (styles.css:799), and `.reduce-motion`
      doesn't stop it. Add `.reduce-motion #eye-ind.watching svg{animation:none}` and a static red border instead.
    - The paper restyle applies only under `body.tac-eye`, so the courier and car eye keep their non-palette colours
      (`#e84a5c`, `#d8a64a`, onboarding.js:61-64). Apply the palette always.

25. **Check the landscape eye against the mission panel.**
    - On touch, `.hud-topleft` stretches from left 14 px to right 136 px (styles.css:727), so at 844 px wide the mission
      panel can reach past the centre.
    - Moving the eye to 6 px in landscape needs a measured rect, not only the `tac_hud` overlap assert.
    - Fall back to the right of centre, or under the minimap.

26. **The fallback rig's crouch silhouette doesn't match the sight model.** That rig only scales to 0.7 of standing
    height (engine.js:551-552), while sight assumes a 0.8 m target. A visibly crouched fallback Kelechi stands about as
    tall as a counter. Either scale y to about 0.5 when crouched on that rig, or list the mismatch in §6.

27. **Two small robustness gaps in the miss line and the build.**
    - The miss line isn't suppressed in m0 (the courier tail runs its own teaching chips).
    - build.py only runs `node --check` on the bundle, so a syntax error in `src/tactics/*.js` shows up only as a page
      error at runtime. Add a `node --check` per tactics file. That is a build.py change of the same kind as §2.2.

28. **Plan item 3's "collision data" is left half-fixed.** The legacy stall colliders still stop Kelechi 0.9 m short of
    the visible counter (§6). Shrinking the 12 dressed-market legacy colliders to the measured counter footprint would
    make collision match what players see, and the lanes stay clear (x 7.6 / 12.6 are more than 1.5 m away). Consider it
    for Phase 0, or record it as a deliberate deferral.
