# NACECA · Playable Tactics · the binding build design

Lead designer's consolidation of the four area specs and their critiques (all in this folder):
`foundations.md`, `market.md`, `mansion.md`, `telemetry.md`, and the four `*.critique.md`. Written against
`claude/naceca-bundle-integration-133395` at **74a0c96**. That commit is 261a000 plus the logger's survey timer
(v12_pt.js:297-310), so every file:line in the area specs still holds.

**How to read this.**
- This file is binding. Where it disagrees with an area spec, this file wins.
- Where it is silent, the area spec stands, with its critique's corrections applied.
- §3 (the `TAC` API) and §4 (the event contract) are frozen. A change needs the lead's sign-off and a note in §11.
- The working stub of §3 is real code, and it was run in the harness (§12).

Contents:
- §0 the plan in one page
- §1 what the player sees, by owner goal
- §2 how every blocker and major critique is resolved
- §3 the frozen `TAC` API v1
- §4 the event contract
- §5 the fixed numbers
- §6 the team split
- §7 the four team scopes, with hooks, scenarios and regressions
- §8 what comes next if time allows
- §9 real devices and real rendering
- §10 the facilitator protocol
- §11 open questions for the product owner
- §12 the stub files and how they were validated

---

## 0 · The plan in one page

**One removable layer.**
- **New files:** `src/tactics/` (11 scripts + 4 stylesheets), the playtest CLI, the protocol doc and harness scenarios.
- **Existing files edited in Build 1:** only `build.py`, in one block owned by Team A. It lands in the shared base commit
  before anyone forks.
- **Removal:** delete `src/tactics/` and that block, and the game is today's.
- **Never touched in Build 1:** market.js, pressure.js, chase.js, v12_pt.js, v12_plan.js, v13_briefing.js and every other
  source file. Every behaviour change is a `V12.wrap`, a property wrap, or an in-layer mutation of data.

**Four teams, no shared files.**

| Team | Owns | Delivers |
|---|---|---|
| **A · Foundations** | `build.py` block, the kernel `tac_api.js`, `tac_core/geo/interact/lanes/radio/sight.js`, `tactics.css`, the shared harness fixture | Phase 0 (plan items 1-6) and the shared sight-and-noise module with its HUD |
| **B · Market** | `tac_market.js`, `tac_market.css`, `tac_m2_*` scenarios | Phase 1 (plan items 7-10) in M2 |
| **C · Mansion** | `tac_mansion.js`, `tac_mansion.css`, `tac_m3_*` scenarios | Phase 2 (plan items 11-17) in M3 |
| **D · Playtest kit** | `tac_pt.js`, `tac_pt_report.js`, `tac_pt.css`, `tools/pt_report.cjs`, `docs/PLAYTEST-PROTOCOL.md`, `pt_*` scenarios; later the store in `v12_pt.js` | the "Measuring it" section of the plan |

- **Coding against the API.** B, C and D code against the frozen API in §3. The kernel `tac_api.js` already implements every
  function, with a working fallback (§12), so nobody waits for A.
- **What waits for A.** Scenarios that need real line-of-sight (cover) or the radio queue check `TAC.sight.full` /
  `TAC.geo.full` / `TAC.radio.full`, and skip those asserts with a logged `SKIP (needs A)` until A has merged.

**Build 1 (the smallest build that shows all four owner goals)**, then **Build 1+** (§8) if time allows. Build 1 is defined
per team in §7. Each team's "Build 1" list is its must-ship.

---

## 1 · What the player sees in Build 1, by owner goal

### Cover works
**M2 (Ikeja market).** After Tunde points him out, KC runs a head-down/look-up cycle: about 5 s on his phone, then 1.8 s
watching the road.
- **The eye** (top centre) fills while he can see or hear you. The line under it says why: *"He can see you crossing the
  open road, standing"*.
- **What hides you:**
  - his 100° cone (come from the side or from behind);
  - a trader standing between you and him;
  - distance;
  - not sprinting.
- **Crouch cover belongs to the mansion.** The foundations survey measured no crouch cover in KC's forward cone (479 of 479
  cells visible). The design does not pretend otherwise.
- **The approach decides the opening.**
  - Reach him unseen: **CAUGHT COLD**, a quiet arrest with no chase.
  - Half-noticed: he runs, but with no tray shove.
  - Seen: today's chase, word for word.
  - Being seen is never worse than today.
- **Lifting his phone** while he is looking up is seen: **HE SAW YOU**, then he bolts. While his head is down it is not.

**M3 (Lekki mansion, quiet entries).** Obi sits at his desk on a call, facing the living room.
- **What hides you:** the door leaves, the walls, the armchair (crouched), and the east wall, which lies outside his cone.
- **The same eye and why-line**, plus a meter over his head.
- **Reach him unseen** and he never triggers the wipe: the laptop comes out with all 7 files.
- **Rushing him at any pace** gets you seen (§5.1: suspicion builds per metre walked, not per second).

### Interception is rewarding
- **M2.** Get in front of the running KC: **CUT HIM OFF**. He stops and raises his hands. Nobody is tackled, and you get
  +2 Public Trust and the same unlocks as a tackle.
  - Tunde's route tip (if you protect him) tells you where he runs.
  - The ribbon that draws the cut is gated on a balance test (§2, M-B1) and ships off in Build 1.
- **M3.** Once alarmed, Obi runs for the kitchen door: 10.4 m in about 3.5 s, starting 2.5 s after a knock.
  - Stop him in the house: four arrest choices, nothing on the force record.
  - If he gets out, the perimeter team brings him round in cuffs. He is still arrested, but with a worse headline, two
    choices and a grade cost. It never counts as force.

### Uche is physically useful
- **M2.** Uche stands behind the van. Talk to him after Tunde to post him:
  - **back-lane corner:** KC sees him and veers off; if KC passes within reach, Uche tackles him on screen;
  - **back gate** (hidden, crouched by the parked okada): KC runs into him;
  - **the van** (the default): he radios where KC is.
  - He jogs to his post on screen.
- **M3.** Uche follows you in. A contextual **UCHE** button offers one job at a time:
  - **COVER HIM**, once Obi runs or is startled within 4 m;
  - **TAKE HER OUT**: he walks the child out, which is the real rescue.
  - On the side gate, or with Squad Trust, he starts inside the kitchen door and tackles a runner in front of you.

### Preparation changes what happens
| Preparation | What it changes in Build 1 |
|---|---|
| Tunde, "Stay back…" (quiet) | KC's route in words; the back gate on the minimap; Uche's gate option names Tunde |
| Meeting Tunde out of KC's sight | the habit fact "he never looks behind his stand"; KC not wary |
| Posting Uche | the corner (veer, tackle), the gate (hidden catch) or the van (callouts) |
| Pursuit Lines | Uche runs the lanes in the chase |
| KC treated fairly (M2) | the side-gate entry in M3: you start in the back corridor, behind Obi |
| Squad Trust | Uche starts inside the kitchen door |
| Power cut | the house dims and Obi sees 4.5 m instead of 9; the wipe runs 12 s longer (today's +12) |
| Street Sources / KC civilians intel | the child expects you, and Uche can take her out without you talking to her first |
| Grey Man | every watcher (KC, Obi) is 35% slower to notice; the skill text says so |

**Phase 0 fixes the player sees.**
- The scanned phone no longer steals ACTION from KC.
- A press on nothing says why.
- KC stops running through crates.
- Crouch works on every rig, shows on desktop, and can be held or toggled.
- Uche's callouts jump the radio queue.

---

## 2 · How every blocker and major critique is resolved

### 2.1 Foundations (1 blocker, 8 major)
| # | Critique | Resolution (binding) |
|---|---|---|
| **F-B1** | Replacing `_radioNext` drops the OVERHEARD relabel (v12_night.js:240) and radio VO (v12_vo.js:90) | **Nothing is replaced.** `tac_radio.js` wraps `radioLine`, `_radioNext` and `clearRadio` outermost and always renders through the original chain, so both wraps keep running. Preemption works without cancelling the base timer: swap `#radio-sub` for a fresh element (the stale timer's `remove('show')` hits the detached one), record a stale token, and swallow the one `_radioNext` call that token predicts. Call `V12.stopVO()` on a cut. `tac_radio` asserts that the night phone line still reads `OVERHEARD · ON THE PHONE`, and that a stubbed `V12.playVO` fires once per shown line and never for a dropped one. (§5.6) |
| F-M2 | Radio defaults drop story lines; callouts can't cut bulletins | Lines from existing callers (no `opts`) **never expire, are never capped, and keep FIFO order**. They are only ordered: bulletins 0, `SGT. UCHE…` 2, everything else 1. Only lines passing `opts.ttl` expire. `TAC.radio.say` defaults to **pri 3, ttl 6 s**. Pri 3 cuts any lower line: at once if that line is keyed, otherwise after it has been up 1.2 s. The cap of 4 applies to keyed lines only. Test: a 160-char `RADIO_STATION` line, then the dialogue_system.js:168 shrine line, must both show. |
| **F-M3** | Desktop can't walk, so stealth is louder and faster there | **Sight builds per metre, not per second.** The gait multiplier is `max(1, min(3.4, v/1.55))` while moving (still 0.7), so a desktop jog (3.0 m/s) and a touch walk (1.55) build the same suspicion over the same path. Noise has one band for any upright pace up to 4.2 m/s (2.5 m), so desktop jog = touch walk. Only sprint (9 m) and crouch (1 m) differ. `tac_sight` asserts equal suspicion per metre at 1.55 and 3.0 m/s, desktop and touch. (§5.1) |
| F-M4 | "Move closer — <label>" can name hidden targets on Senior | Candidates use `TAC.interact.live()`, the same filter as `nearestInteractable` (consumed and hidden items excluded). On Senior, "Move closer — <label>" appears only if that interactable is the tracker's target (`WAY.resolve().mesh === it.mesh`). Otherwise the chip reads "Nothing in reach — <tracker text> is N m away". Text is HTML-escaped. Test: an unrevealed SCAN trace 1 m beyond its range is never named on Senior. |
| F-M5 | The sight API is missing contract items | All are frozen in §3:<br>• `reset(v, {cause, why, quiet})`<br>• the module **never writes rotation**: it exposes `state.glance`, and the owner renders `facing() + glance`<br>• `TAC.onTick` / `onFrame` / `onScene`<br>• per-watcher `gain`, `levels`, `rush`, `alarmHold` and `logExtra`<br>• `crowd()` is the only crowd source (default none), so companions are excluded by construction<br>• spent entries are registered by the owning team (§3.4)<br>Gain is encounter tuning, and pace never exceeds standard. |
| F-M6 | Mutating `it.priority` loses the spent rule | **Nothing is mutated.** The kernel's `nearestInteractable` wrap re-runs the selection with an *effective* priority from `TAC.interact.spent(label, fn)` / `TAC.interact.priority(label, fn)`. Consumers register by label; they never assign `it.priority` on an interactable they didn't create. Test: assign `it.priority = () => 3` on Obi after the first frame; the arrested Obi still loses to the drawer. |
| F-M7 | The art-failed mansion has no obstacles, so Obi would see through walls | `TAC.geo.ready()` is false for m3 without `ENGINE._mansion`. Watchers then freeze (no eye, no gain): today's behaviour on low-end phones whose art failed. `geo_drift{reason:'legacy'}` is logged once per build. The mansion table is keyed on `ENGINE._mansion`, not `_dress`. Already in the kernel and its test (§12). |
| F-M8 | The lane change isn't shown to keep the chase as easy | `tac_lanes` becomes a **paired** comparison: the same seed and start, old graph and path against new, N ≥ 10 seeds. The seed and the frozen clock are set inside the `loadMission` evaluate (`T.start`). Gate: median catch time new ≤ old + 0.5 s, and mean bumps new ≤ old + 0.2; the distribution is printed. If it fails, A adjusts the north-end nodes and the stand gap and re-runs. Lanes don't merge until it passes. |
| F-M9 | Regressions aimed at the wrong tests | The `casework_lagos`/`v13_port` "positional tryInteract" warning is dropped (only `pt_logger` calls `tryInteract`). `tac_interact` drives at least one m2 and one m3 run through `tryInteract()` and the `#ctx-main` click. New `tac_settings`: an old blob without `crouch` loads as `'auto'`, the value persists, and RESET restores it. New radio tests per F-B1/F-M2. |

**Foundations minors, all adopted:**
- the eye shows only while the top active watcher has `susp > 0.5`, so the desktop pills (v12.css:11) hide only then;
- fix the hook tables (v13_boot.js:108 wraps `ensureHudV8`; v12_car.js:1298 wraps `newScene`);
- `vis` gains `y0`, there is one number set, and the survey is re-run with the final rules (0 unknown asserted);
- toggle mode swallows C everywhere except text fields, and `blur` clears only a held crouch;
- the three touch-hold rules (a click blocker only on `#ctx-crouch`, the mode read at event time, a note getter);
- the setting row and toggle are in Build 1;
- `tac_noise` hint dropped;
- an alarm unlatches after `alarmHold` (6 s) if nobody resets it;
- seeding inside the `loadMission` evaluate;
- the four art-shim stubs and their restore;
- `tac_sight` (b) placed at a counter's z end with a `!blockedAt` assert, and the notice bound at ≤ 1.3 s with the grace math stated;
- Grey Man text updated (by A, through `SKILLS.fieldcraft`, since `CAPS` is private);
- crowd cover counts **standing traders only**, within 1.2 m of the watcher→player line, with the player ≥ 3 m from the
  watcher (wanderers are thinned on low gfx, art_pass_v8.js:2010-2016);
- the head marker hides or offsets when the world label is on the same mesh;
- the eye is in the palette always (courier and car too) and doesn't blink under reduced motion;
- the landscape eye is placed by measured rects;
- the fallback rig crouches to `scale.y` 0.55;
- the miss line is suppressed in m0;
- `node --check` runs per tactics file (in the build.py block);
- collision alignment of the legacy stalls is deferred on purpose (§8).

### 2.2 Market (1 blocker, 9 major)
| # | Critique | Resolution (binding) |
|---|---|---|
| **M-B1** | The cut ribbon makes chases slower and costlier, Recruit included | **`ribbonCut` ships `'off'`.** The tail ribbon is today's. Build 1+ only: B may build the restricted variant, then run the matrix (≥ 20 seeds, including cut@1.3 s and a Recruit cell). In that variant:<br>• candidates are reachable without entering a trader lane (the road x < 7, the stall fronts and the gap crossings — the measured 5.2-5.9 s pattern);<br>• the whole P→X route is scored for trader proximity;<br>• a point where KC comes to you is preferred.<br>If it passes (median ≤ today + 0.5 s, bumps ≤ today + 0.2 in every cell), the default becomes `'earned'` (Tunde's tip, intel tier 3 or Recruit). The §8.1 "perception" claim is deleted. |
| M-M2 | The stealth scan from behind presses KC, not the phone | `'Confront teen suspect'` is spent while `!S.game._marketScanned` (A's default table; B re-registers with its extra conditions). Grid assert: every out-of-cone cell within 2.0 m of the phone picks the phone before the scan. |
| M-M3 | Uche's "hidden" gate route jogs past KC's counter | Uche starts at (−2.4, 11.6), behind the van relative to KC (12.9 m: out of range). His routes go round the north end and down the back lane (§5.3) and never enter KC's cone within 12 m (asserted at every step). At the gate he crouches by the okada (`scale.y` 0.8 plays `crouch`); the takedown kneel uses 0.9 (`kneel`) (people_art_pass.js:423). |
| M-M4 | Uche's role is undefined if the chase starts before he arrives | **The moving-Uche rule.** A posted Uche keeps going to his post. Once the chase starts he moves at 3.6 m/s, and the veer and grab rules are live wherever he is. The gate's no-veer applies only after he has arrived and crouched. Matrix and `tac_m2_chase` cells: posted, chase at +3 s, for both posts. |
| M-M5 | The §0 numbers came from the wrong lanes and are noise | Every balance number in market.md §0 is provisional. `tac_m2_matrix` re-runs every cell on A's lanes and path (installed by `T.deviceMarket`), with the shipping post spots, on ≥ 20 seeds seeded inside the run's evaluate. It adds the soft, range-bolt and HE SAW YOU auto-bolt openings with a 1.0 s reaction. Tuning constants (veer 4.5 m, cut 3.5 m, the gate guarantee) are confirmed or changed from that table. |
| M-M6 | Plan item 8 (the ribbon shows the cut) is undelivered on Senior | Accepted as the one plan sub-item gated on measurement. The binding rule ("do not make combat harder") outranks it: the measured naive ribbon raised bumps. In Build 1, interception is delivered by CUT HIM OFF, its reward, Tunde's route in words, and Uche's corner post. The ribbon follows M-B1. |
| M-M7 | Two Senior-visible Tunde lines are hints | The 1.5 s text becomes a plain fact: `TEXT · TUNDE: I'm at my spot across the road from him.` (no rule). The twitchy line becomes an observation: `He dey look this way, oga! E don see us.` / `He's looking this way, sir! He's seen us.` The 4 m bark stays as a present-state report, shown only when the sight model agrees (below). |
| M-M8 | The Tunde meeting test is a second sight model, and its effect evaporates | **One model.** The meeting test is `TAC.sight.probe('kc', x, z, {gait, crouch, range:15})`: the same cone, line-of-sight and crowd, with a meeting-only range of 15 m because pointing and talking carries further.<br>• **KC's sign slab** is `skip` (transparent) until the render check (§9). If the check says it is opaque, it becomes an occluder for both the meeting and the eye.<br>• **Seen at the meeting** makes KC **wary for the rest of the run** (phone phases ×0.75, look-up +0.4 s; with Heat, the larger of the two), plus `reset(40, {cause:'tunde', quiet:true})`, so no spurious `evaded`. The end-of-conversation toast `HE SAW YOU · He saw you talking to Tunde in the road. He'll be watching.` carries the feedback even beyond eye range. |
| M-M9 | "KC looks up" has no effect at the scan press | Scan exposure uses attention at the hand. The press is **seen if KC's attention ≥ 0.9** (look-up, or noticed), **or** your body is `exposedNow`. In the phone phase, from his side or back, it is unseen. The readable rule: wait for his head to go down, then lift. Assert: the same side spot gives HE SAW YOU in the look-up and nothing in the phone phase. |
| M-M10 | The smallest version breaks feedback truth | B's Build 1 keeps all four:<br>• the scan exposure (with the auto-bolt), so CAUGHT COLD can't lie;<br>• the `V12.say` Pursuit rewrite;<br>• the rebuilt meeting test;<br>• the van callouts. |

**Market minors, all adopted:**
- the `V12.say` rewrite is scoped to `m2` and a KC chase;
- KC's yaw is set to `atan2(toPlayer) − π` before `onCaught`'s `+= π`;
- Uche is turned in the layer, since `_faceT` is a no-op off `ENGINE.npcs`;
- the regression reasoning is fixed, and `tac_m2_tunde` calls `lib.boot`;
- the hook table adds v12_street.js:290 (`sideSetup`) and v13_desk.js:55 (`musicForScene`);
- Grey Man and Pursuit text go through `SKILLS.fieldcraft`;
- CUT HIM OFF needs `!WAY.segBlocked(P, R, 0)`;
- every non-tackle end calls `stopChase()` and then `c.onCaught` with `c.how` and `c.by` set;
- `ENGINE._stagger = 0` after a cold grab;
- the chase clock is B's own (`c._tacT`);
- the bolt toast after a seen scan is `HE SAW YOU · He saw you lift his phone. He shoves a tray and runs.` (asserted at +1.0 s);
- van callouts give the lane and direction, and name the gate only when the route is known;
- Uche's spot moves to (−2.4, 11.6), and he is gated on `_marketTunde` (before that: `SGT. UCHE · I'll hold the van, sir.`);
- `order` is logged only when the post changes;
- the takedown beat freezes movement, is skipped under reduced motion, places Kelechi 1.6 m from KC as it ends, and uses the
  place name in its copy;
- the gate copy: `…make for the back gate. Okada dey park for front of am.` / `…There's an okada parked across it.`;
- the inserted line reads naturally before canon line 2;
- the tier-3 text changes only if the ribbon ships;
- the Grey Man `where` text names Obi's study;
- a forensic bypass is a noise event (`reset(max(susp, 60), {cause:'noise', why:'He heard you forcing his phone'})`, no bolt);
- chase starts are classified as progress (by D, §2.4);
- `order` carries `src` and `ok`;
- the post-scan alarm beyond 6 m resets to 50 after 4 s unseen;
- KC's `_idle` is set to `'idle'`;
- the dialogue fit at 844×390 and the pills are harness asserts;
- M2 cover is the crowd and the cone (§1).

### 2.3 Mansion (1 blocker, 12 major)
| # | Critique | Resolution (binding) |
|---|---|---|
| **C-B1** | Jog and sprint beat the stealth layer; only walking is caught | Fixed at the root by F-M3. Suspicion now builds per metre at any upright pace, so a jog or sprint straight at Obi builds what a walk does, and both alarm.<br>• C tunes Obi's `gain` (first pass 1.6) so all of these hold: **frontal walk, jog and sprint alarm before he is within 2.7 m**; crouched frontal reaches notice but not alarm; the east flank at sneak, walk and jog stays < 35; the side-gate back wall crouched stays < 35; dark frontal walk stays < 35.<br>• If gain alone can't meet all of them, enable the frozen `rush` option (`{dist:5, speed:3.4, gain:120}`, threshold above desktop jog, so parity holds) rather than a new rule.<br>• Beat-the-thumb shrinks to a 0.5 s reach, so a sprinter alarmed at 4-6 m can't still beat it. |
| C-M2 | Cornered contradicts the tackle | Cornered only when **Kelechi** is in the corridor or its mouth (`|x| < 1`, `z < −4`), or when a *following* Uche is there and Obi can see him. A **posted** Uche at the back always produces a tackle. Cases for each in `tac_m3_flight`. |
| C-M3 | False wipe toast; false spoken briefing | Never call v12's `startMansionWipe`. `tac_mansion` recomputes `wipeFor` (the same 4 lines, v12_plan.js:57-62) and defers the start. `V12.planM3` is property-wrapped to pass a wrapped `onGo` that rewrites `DIALOGUE.mansion_pre_breach` (built by `go`, :149) before it plays:<br>• Kelechi's quiet line: `Quiet. Front door, and nobody runs.`, or with the gate `Quiet. Side gate, then the kitchen door.`;<br>• Uche's rear line: `I'll be inside the kitchen door. Anyone who runs, runs into me.`<br>Asserted in `tac_m3_plan` and `tac_m3_entry`. |
| C-M4 | `t_sims` changes nothing; "you'll have to find the laptop" is false | Build 1 deletes the "find the laptop" phrase from the plan text and records item 16's first bullet as Build 1+ (§8): without `t_sims`, the laptop marker and the Obi/laptop minimap blips are hidden until seen, and the tracker reads "Find the laptop · the study". Recruit keeps markers. |
| C-M5 | The tracker sends quiet entries into his cone, and overrides "stay put" | Property-wrap `WAY.current` (it is called through the property, wayfind.js:173/187/216) for m3:<br>• Obi free on a quiet entry → o6;<br>• a wipe armed and the laptop live → o4;<br>• after "stay put" → o4 until the laptop is done, then o5.<br>Asserted in `tac_m3_child` / `tac_m3_sight`. |
| C-M6 | Uche's carry launders "stay put" into `child_gentle` | `child_gentle` is set only when Kelechi took her hand, or when Uche took her out before Kelechi had spoken to her. After "stay put", Uche's walk sets `S.game.flags.child_by = 'uche'` and leaves `child_gentle` alone. Case in `tac_m3_child`. |
| C-M7 | COVER at t = 0 makes the run moot | COVER is offered once Obi is `running`, or while he is startled or stunned **within 4 m** of Uche. `order{t}` against `enc m3_obi.outcome` measures it. |
| C-M8 | Non-tappers lose Obi, and the cost is permanent force | The perimeter is **not force**: no `forceUsed`, no "By the book" failure, no v13 profile change. Its cost: the perimeter headline, the two-choice arrest and **−5 grade** (a `computeGrade` wrap, the v12_plan.js:204-216 pattern). The knock run starts at **2.5 s** (was 1.5), so a 1.5 s-reaction jog makes it (+0.4 s offline). New `tac_m3_flight` case: a touch-jog intercept. |
| C-M9 | The power cut's 12 s "no signal" makes the cut dominant | **No NO SIGNAL window.** The cut does three things: it dims the house (light maps 35%, lamps off, restored on `newScene`), halves his sight (9 → 4.5 m), and keeps today's +12 s on the wipe. The plan line: *"Dark house: he sees half as far, and with the Wi-Fi down his wipe runs about 12 s longer."* KILL THE WIPE stays. |
| C-M10 | Uche's spent "Plan the raid" interactable follows you | At the breach, `consumed = true` on that interactable. Assert: `nearestInteractable()` is never Uche once he follows. |
| C-M11 | 10 Hz movement steps visibly | Decisions run on `TAC.onTick` (10 Hz); positions integrate on `TAC.onFrame(dt)` every frame. The child keeps `updateWalker`. |
| C-M12 | The touch UI doesn't fit 390×844 | **UCHE is its own 66 px button stacked above SCAN**, not a third in the row (styles.css:709-710 gives 226 px for three). It is labelled `UCHE`, with the job in a paper tag to its left (`COVER HIM`). Only one job is offered at a time in Build 1 (COVER needs Obi running or startled; TAKE HER OUT needs him not running), so there are no cards. Desktop: a chip `Q · UCHE` in `TAC.ui.chipRow()`. `tac_m3_hud` adds `#joystick` and `#hud-sprint` to its overlap list. |
| C-M13 | The telemetry vocabulary contradicts the contract | Resolved by §4, a single merged contract. The emitters' precise enums are kept (outcome values), with telemetry's field names (`entry` + `door`). `m3_summary` is logged once, in the `completeMission('m3')` wrap. |

**Mansion minors, all adopted:**
- "replace", not "wrap", for the child and laptop `onInteract` (copy the base side-effects you keep);
- the informant deal without Crisis Negotiator **only for `cold` and `beat_thumb`**;
- the leak ships behind `TAC.m3.cfg.leak = false`, with no 0.3 s reach;
- the field skill advances the whole `TAC.m3` mover (Obi, Uche timers, the child);
- the title card disables movement, teleports and resets the camera on show, starts the clock in `then`, and uses `['KNOCK AND ANNOUNCE', '21:32']`;
- dynamic minimap blips for Obi, Uche and the child;
- the drives-lead thin text is worded from the survivors (first pass: *"The ledger was shredded. Forensics rebuilt N of
  Obi's files, but nothing left in them ties a payment to a name."*);
- the interactable range is 2.2 while he runs;
- the Squad Trust payoff is paid if Uche was posted at the back when Obi was stopped;
- `m3_knock` is pri 1 and cancelled when the run starts;
- one indicator language (A's head marker serves both watchers);
- the dimming stays in Build 1;
- the BLIND SIDE words are Recruit-only (the facing tick is a fact on all difficulties);
- TAKE HER OUT is refused on every quiet entry while Obi is unaware;
- "stay put" stays strictly worse and is accepted as a moral, not tactical, choice;
- the halted screen is re-laid out in two columns;
- the test gaps are filled (§7.C);
- the file name is `tac_mansion.js`;
- the controls differ on purpose: M2 posting is calm preparation by conversation, M3 orders are mid-action and need a button;
- the key audit adds KeyJ and the field-skill digits (Q and 1-3 are handled only outside overlays and field skills);
- strings may contain "…".

### 2.4 Telemetry (2 blockers, 6 major)
| # | Critique | Resolution (binding) |
|---|---|---|
| **T-B1** | Most edits to existing files are avoidable | **Build 1 edits no existing file.** Everything moves to `src/tactics/tac_pt.js` + `tac_pt_report.js` + `tac_pt.css`, loaded right after the kernel:<br>• an outer `V12.log` wrapper: player label, play seconds since NEW PLAYER, per-type ceilings, coalescing, the size guard and the payload enrichments;<br>• `V12.ptExport` / `ptSummary` replaced;<br>• CLEAR re-bound from a `renderSettings` wrap (call `V12.ptSummary()` first to flush the private buffer);<br>• `chase_end.how/by` via a `c.onCaught` wrapper installed in D's `startChase` wrap (D's wrapper is outer to v12_pt's, so it stamps the pending how/by before v12_pt logs).<br>The chunked store is Build 1+ (§8) and is then the only edit to `v12_pt.js` (lines 12, 15-17, plus two accessors). |
| **T-B2** | The contract doesn't match the emitters | §4 is the single contract. The fixtures are regenerated from `T.capture` output of the real `tac_m2_*`/`tac_m3_*` runs, and `pt_slice_m2`/`pt_slice_m3` schema-check real events before any analyser test. `seen.cause` never has knock/loud: those are `enc m3_obi.alertedBy`. `PLAN_CAUSES` is deleted. |
| T-M3 | The save safety net misses saves made with the desk open | It is Build 1+ with the store. When built, it is a **pre-flight write in a `saveGame` wrap** (try `setItem(SAVE_KEY)`, free the oldest chunk, retry), never toast detection. Test with the desk open. |
| T-M4 | Played time is cumulative across players | `ps` = play seconds since the current player's NEW PLAYER (`PT.play` baseline stored at the tap). `pt_player` carries `ps0`. The survey's `secsPlayed` is rewritten to the same baseline. |
| T-M5 | Players are double-counted | The analyser dedupes by `(sid, t, type)`. Players are keyed by **device id + label**: a 4-char device id is stored once in `naceca_pt_player` and printed as `B7QX·P3`. SEND LOG from the player-scoped sheet exports that player's events. The protocol says CLEAR only after the file is confirmed received, and step 4 points to step 1 (§10). |
| T-M6 | LIKELY UNDERSTOOD with no reading evidence | The stamp is `NO READ DATA` when any judged alarm lacks a read record. `seen_read` is **D's own measurement**: a MutationObserver on `#eye-ind .eye-why` (text + `#eye-ind.show`) and a `toast` wrap matching small text equal to the alarm's `whyPast` (§3.6 DOM contract). `READ_MS` scales with words (250 wpm, minimum 1.5 s). |
| T-M7 | Families confuse outcomes and defaults with choices | Report **chosen** and **result** separately. A family counts only from player-made, non-default choices:<br>• emitters send `def:true` for fields left at their default;<br>• M2 stealth intent = (approach cold or soft) ‖ `crouchNearSecs ≥ 2` ‖ press side ≠ front;<br>• Tunde's choice counts as preparation only when it gave the tip;<br>• Uche needs an `order` with a non-default `src` **and** an act in the same mission.<br>Test: an unposted Uche's callout. |
| T-M8 | Blind on the investigation screens | `ov_dwell{id, secs, obj}` from a `showOverlay` wrap (closing an overlay). The analyser reads `strike`, `file`, `doc_failed`, `warrant{refused or pending}`, `v13_warrant`, `v13_verdict` and `desk_open`/`ops_open` as their own rows ("operations table: 3 strikes, 6:40 open"). `BACK TO THE TABLE` is logged as `blocked` by D's `toast` wrap. |

**Telemetry minors, all adopted:**
- the coalescing count is `d.rep`;
- ceilings are per type, with `survey`, `pt_*`, `session`, `mission_*`, `*_summary` and `enc` exempt;
- Esc does what BACK does;
- the Player and Summary rows show only with a label set or `?pt=1`;
- difficulty comes from `new_game.d`;
- `away` is muted during `CHASE.active` or `TAC.state.pursuit`;
- the CLI records `tz` and matches date + HH:MM, and `--player` accepts `B7QX·P3`;
- the protocol gaps are fixed (§10);
- the wrap-order list adds v13_desk's `toast` and v13_boot:26;
- the analyser calibration notes (§7.D);
- share falls back on any non-Abort rejection, with the File built synchronously;
- rotation happens only on the 20 s tick (Build 1+);
- `.pt-empty` text is ink, not grey;
- the test nits.

---

## 3 · The frozen `TAC` API v1

Implemented with fallbacks by `src/tactics/tac_api.js` (the kernel; stub in `design/stubs/tac_api.js`, §12).
- **Kernel-only parts**, owned by A and never replaced: the lifecycle driver, the player meter, `TAC.hint`,
  `TAC.interact`, `TAC.ui` and the KC path swap.
- **Replaced wholesale by A's modules:** `TAC.sight`, `TAC.geo`, `TAC.radio`, `TAC.lanes.check`, keeping every signature.
  The kernel's fallback eye only draws for watchers registered through the fallback `watch()`, so once `tac_sight.js`
  replaces `TAC.sight` it goes idle and A's HUD owns the eye.
- **Rules for every consumer:**
  - Call through `TAC.*` at call time. Never cache a function reference across scene builds.
  - Register watchers, spent entries and subscriptions at **scene build**, never at file load.
  - Never wrap `updatePressure`, `newScene` or `nearestInteractable` (the kernel does). Never assign `it.priority` on an
    interactable you didn't create.
  - Never write per-tick values to `S.game.flags`: `progressSig()` hashes them (guidance.js:18). Write outcomes, once.

### 3.1 Lifecycle and player
```js
TAC.v === 1
TAC.onTick(fn(dt=0.1), {order=0}) → off()   // fixed 10 Hz while the world is live (updatePressure); ≤ 3 steps per frame
TAC.onFrame(fn(dt), {order=0}) → off()      // every live frame, after updatePressure's original
TAC.onScene(fn(), {order=0}) → off()        // at newScene, before the next scene builds (drop your state here)
TAC.mission() → S.game.currentMission
TAC.frozen() → overlay open || !ENGINE.movementEnabled
TAC.state.pursuit = null | 'm3_flight' | …  // set while a scripted (non-startChase) pursuit runs; reset on newScene
TAC.player.pos() → {x,z} | null ; .crouch() → bool ; .vel() → {x,z} ; .speed() → m/s (over the last 0.3 s; teleports ignored)
TAC.player.gait() → 'still' | 'sneak' | 'walk' | 'jog' | 'sprint'   // labels for telemetry and why-lines (< 0.3, crouched, < 2.2, < 4.2, ≥ 4.2)
TAC.hint(id, desktopHtml, touchHtml?, ms?) → bool   // Recruit-only "what to do" chip (showHint id 'tac_' + id, once per save); false on Senior or hints off
TAC.hintsShown → ['tac_…', …]                       // this scene's chips, for the summaries
TAC.ui.chipRow() → HTMLElement #tac-chips            // the desktop chip row, bottom left (A styles it; hidden on touch)
TAC.crouch.mode() → 'hold' | 'toggle'                // resolved from SETTINGS.crouch ('auto'|'hold'|'toggle')
```

### 3.2 Sight and noise
```js
const w = TAC.sight.watch({
  id:'kc', enc:'m2_kc',             // telemetry `who` / `enc`
  mesh,                             // position source; must stay the same object
  he:'He',                          // why-line subject
  eyeH:1.6, fov:100,
  range:{ lit:12, dark:6 },         // give both
  facing:() => baseYaw,             // BASE yaw in radians (forward = (sin y, cos y)); default mesh.rotation.y at watch()
  attention:() => 1,                // 0..1, the owner's main lever
  hearing:1,                        // noise multiplier
  surface:'on the street',          // noise phrasing
  crowd:() => [],                   // meshes that can hide the player (standing bystanders); default none (companions never)
  light:(x,z) => 'lit'|'dark',      // default from TAC.sight.lights()
  active:() => true,                // false: frozen (keeps susp, no eye, no gain, nothing logged)
  gain:1,                           // encounter tuning; pace never exceeds standard
  levels:{ notice:35, exit:15, alarm:100 },
  rush:null,                        // optional {dist, speed, gain}: closing faster than `speed` inside `dist`, in the cone, in range
  alarmHold:6,                      // s: an alarm nobody reset() unlatches to 99 and decays after this long unseen
  glance:true,                      // module computes state.glance; the OWNER renders rotation.y = facing() + state.glance
  marker:true, hud:true,            // head marker; counts for the top eye
  onLevel:(level, state) => {},     // 'notice' | 'alarm' | 'calm'
  logExtra:() => ({}),              // merged into this watcher's seen/evaded payloads (B: phase, scanned, post; C: obi, entry, power)
});
w.state  // live (10 Hz): {id, active, susp 0-100, level:'calm'|'notice'|'alarm', peak, seen, heard, dist, angle, inCone, inRange,
         //   los:'clear'|'low'|'tall'|'none', cover, crouch, gait, speed, lit, crowd, cause:'sight'|'noise'|'close'|null,
         //   why (the line shown now), whyPast (the frozen alarm line), place, parts:{sight,noise,close,rush}, glance}
w.reset(v=0, { cause, why, quiet })  // set suspicion. If it crosses notice or alarm and `cause` is given: exactly one `seen`
                                     // with that cause. `why` freezes the line. `quiet`: no `evaded` for this episode.
w.unwatch()
TAC.sight.los(ax,az,ah, bx,bz,bh) → { clear, by:'tall'|'low'|null, name }   // 2.5-D; boxes containing an endpoint are skipped
TAC.sight.probe(id, x, z, { crouch, gait | speed, vel, range }) → the state that position would produce (no side effects)
TAC.sight.zones([{ name:'the open road', rect:[x0,x1,z0,z1], open:true }, …])   // why-line places; cleared per scene
TAC.sight.lights({ ambient:'lit'|'dark', lamps:[[x,z,r], …] })                  // cleared per scene
TAC.sight.top() → the most alert active watcher's state (what the eye shows)
TAC.sight.watchers() → [handles]
TAC.sight.rate() → pace × Grey Man
TAC.sight.K → the constants of §5.1
TAC.sight.full → false on the kernel fallback (no line-of-sight, plain why-line), true once tac_sight.js has loaded
```

### 3.3 Geometry, lanes, radio
```js
TAC.geo.ready() → false where the scene has no vision data (m3 without ENGINE._mansion): watchers freeze
TAC.geo.classify() → { boxes, ghost, skip, person, unknown }
TAC.geo.add(cx, cz, w, d, { h, y0, name, kind }) → obstacle   // addObstacle + a vision tag (C: anything new it places)
TAC.geo.full
TAC.lanes.DATA → { nodes(18), edges(23), KC_PATH(10 points, 45.9 m) }   // frozen (§5.2)
TAC.lanes.KC_PATH → a fresh copy ; TAC.lanes.installed ; TAC.lanes.install() (tac_lanes.js calls it at load; fixtures call it in tests)
TAC.lanes.check(L, path) → { crossing, tight, nodesInside, legsCrossing, nodesInBox, pathLen }
TAC.radio.say(speaker, text, { pri=3, key, ttl=6000, ms }) ; TAC.radio.cancel(key) ; TAC.radio.full
// radioLine(speaker, text, ms, opts) also accepts opts = {pri, key, ttl}; existing callers are unchanged (§5.6)
```

### 3.4 Interaction
```js
TAC.interact.spent(label, fn(it) → bool | null)      // spent: effective priority −1 (still answers when alone in reach)
TAC.interact.priority(label, fn(it) → number|null | null)   // effective priority override (null → the item's own)
TAC.interact.isSpent(it) ; TAC.interact.eff(it) ; TAC.interact.live(it)   // live = nearestInteractable's own filter
```
**Registration by label.** A later registration replaces an earlier one, so the team that owns the encounter registers the
final predicate, including A's default conditions:

| Label | Final owner | Spent when |
|---|---|---|
| `Scan suspect phone` | A | `_marketScanned` |
| `Confront teen suspect` | B | `!_marketScanned` ‖ `market_runner` set ‖ `TAC.m2.run().resolving` |
| `Speak with Informant Tunde` | A | `_marketTunde` |
| `Post Sgt. Uche` | B | `!_marketTunde` ‖ `CHASE.active` ‖ `market_runner` set |
| `Plan the raid with Sgt. Uche` / `Brief with Sgt. Uche` | A | `_mansionPreBriefed` (C sets `consumed` at the breach) |
| `Move on suspect` | A (spent) / C (priority 3 while Obi is free) | `moralChoices.arrest` set |
| `Calm and escort the child` / `Walk her out` | A / C | `_civChild` / she is outside |
| `Inspect laptop` / `Stop laptop wipe` | A | `_evLaptop` ‖ `_wipeLost` (the wipe's priority 2, art_pass_v8.js:1713, is unchanged) |
| `Bag cash evidence` / `Crack the safe` / `Search the open drawer` | A | `_evCash` / `_evSafe` / `_drawerSearched` |

### 3.5 Chase objects (any team that ends a chase)
- Set `c.how` (`'tackle'`, `'cutoff'`, `'boxed'` or `'uche'`) and `c.by` (`'player'` or `'uche'`).
- Then call `stopChase()`, then `c.onCaught()`.
- The base tackle path (pressure.js:66) gets `how:'tackle', by:'player'` from B's default at `startChase`.

### 3.6 DOM contract (A renders, D measures, B and C use)
- `#eye-ind` (the existing eye) gains `<div class="eye-why">`. Its text is `TAC.sight.top().why`, shown while `#eye-ind.show`.
  `body.tac-eye` is set while a TAC watcher drives the eye.
- Head marker: `<div class="tac-mark" data-who="kc|obi">` holding a 44×6 px bar (ink outline, red fill) plus `svg.ico`
  (`icon('eye')` at notice, `icon('alert')` at alarm).
- **An alarm's toast uses the frozen line verbatim:** `toast(BIG, w.state.whyPast)` (B: HE SAW YOU; C: HE SAW YOU / HE
  HEARD YOU / TOO CLOSE).
- Chips: `#tac-chips > .tac-chip` (desktop). C's touch button is `#ctx-uche` inside `#hud-ctx`, with its tag
  `#ctx-uche-tag`.

---

## 4 · The event contract (all through `V12.log`; D's wrapper adds `dev`, `ps`, `p` and `rep`)

All distances are in metres to 0.1, and times in play seconds unless a field says `ms`. Nothing logs per tick.
**Emitters are the source of truth for enums; adding a value needs a row here.**

| Event | Emitter, when | Fields |
|---|---|---|
| `seen` | A; a watcher crosses notice or alarm, or `reset(v, {cause})` crosses one. At most 1 per watcher per level per 10 s (resets with a cause always log). | `who, enc, level:'notice'\|'alarm', cause:'sight'\|'noise'\|'close'\|'scan'\|'fumble'\|'tunde'\|'tunde_glance', dist, ang, los, cover, crouch, gait, lit, crowd, inCone, parts{sight,noise,close}, peak, ms, why, place, px, pz, obj` + `logExtra()` (B: `phase, scanned, post`; C: `obi, entry, power`) |
| `evaded` | A; suspicion falls below 5 after a notice, with no alarm and not a quiet reset | `who, enc, peak, secs, how:'cover'\|'crowd'\|'distance'\|'cone'\|'dark', crouchPct, mix{…}` + `logExtra()` |
| `radio` | A; a keyed line is shown, dropped, replaced, cancelled or preempted | `key, pri, speaker, outcome, waitMs` |
| `tac_mission` | A; `completeMission` (silent included) | `m, crouchMode, crouchSecs, crouchOn, missShown, missSuppressed, radio{shown,dropped,preempted}, seen{notice,alarm}, evaded, geo{boxes,ghost,unknown}` |
| `geo_drift` | A; once per scene build | `scene, reason:'table'\|'legacy', unknown:[[x,z]], matched, total` |
| `enc` `m2_tunde` | B; the Tunde conversation ends | `side:'road'\|'stall'\|'far', seen, dist, ang, bark, choice:'quiet'\|'loud'\|null, tip, habit, wary` |
| `enc` `m2_kc` | B; caught (any how) or escaped | `approach:'cold'\|'soft'\|'seen'\|'bolt'\|'legacy', intent:'stealth'\|'direct', susp, level, exposed, gap, scanSeen, side:'front'\|'side'\|'behind', outcome:'caught'\|'escaped', how:'cold'\|'tackle'\|'cutoff'\|'boxed'\|'uche'\|'escaped', secs, bumps, bumpsLane, trust, cutReached, ribbon:'off'\|'earned'\|'all', prep{tip,habit,post,posted,pursuit,tier,greyman,sources}, uche{post,arrived,role}` |
| `order` | B, C; the player gives Uche an order | `who:'uche', order:'post'\|'cover'\|'take_child'\|'back', post?:'corner'\|'back'\|'van', prev?, withTip?, src:'talk'\|'button'\|'key'\|'card', ok, why?:'busy'\|'no_sight'\|'running'\|'unaware', def:false, obi?, obj, t` (B logs only when the post changes) |
| `ally_done` | B, C; Uche arrives or acts | `who:'uche', task:'arrive'\|'veer'\|'tackle'\|'box'\|'callout'\|'cover_held'\|'escort'\|'posted_back', outcome:'done'\|'cancelled', post?, secs, lane?, d?` (M2 caps: 1 arrive, 1 veer, 1 tackle/box, 4 callouts) |
| `m2_summary` | B; `completeMission('m2')`, once per run | market.md §4 shape, plus `intent`, `wary`, `ribbon` |
| `enc` `m3_entry` | C; on-site play starts (the card closes) | `entry:'knock'\|'loud'\|'quiet', door:'front'\|'gate', power:'on'\|'cut', uche:'with'\|'rear', leak:false, armed, spawn:[x,z], wipeTotal, variant:'v8'\|'legacy', prep{sims,kcFair,tip,civ,warrant}, def{entry,power}` |
| `enc` `m3_obi` | C; he is stopped (any way) | `outcome:'cold'\|'beat_thumb'\|'stun_grab'\|'intercepted'\|'covered'\|'cornered'\|'tackled'\|'perimeter', by:'kelechi'\|'uche'\|'perimeter', alertedBy:<seen cause>\|'knock'\|'loud'\|null, secs, runSecs, ranM, dist, duringMinigame, states:[[state,t]…≤8], ucheJob, prep` |
| `enc` `m3_laptop` | C; halt, seizure, loss, or extraction with it untouched | `outcome:'never_started'\|'halted'\|'lost'\|'abandoned', pct, files, ledger, total, firstAt, armedAt, mg` |
| `enc` `m3_child` | C; she is out, or extraction with her inside | `choice:'gentle'\|'stay'\|null, by:'kelechi'\|'uche'\|null, calm, outAt, gentle` |
| `m3_summary` | C; `completeMission('m3')`, once per run | telemetry.md §4.4 shape, with the outcome enums above |
| `seen_read` | D; the frozen alarm line leaves the screen | `who, enc, ms, via:'eye'\|'toast'\|'both', words, end:'overlay'\|'hidden'\|'replaced'\|'scene'\|'timeout'\|'quit'` |
| `ov_dwell` | D; an overlay closes | `id, secs, obj` |
| `pt_player`, `pt_export`, `pt_dropped`, `orient` | D | telemetry.md §4.3, with `pt_player.dev` (device id) and `ps0` |

**Enrichments of existing events (D, from the outer wrapper; no `v12_pt.js` edit):**
- `session`: `ptv:2, player, orient, slice, tz`;
- `obj_done`: `txt, seen, notices`;
- `stuck`: `txt, want, px, pz`;
- `chase_end`: `how, by`;
- `interact_result`: a press that starts a chase is reclassified `refused` → `progress` with `chase:true`;
- `survey.secsPlayed`: relative to the player;
- `away`: muted during `CHASE.active` or `TAC.state.pursuit`;
- `blocked`: also `BACK TO THE TABLE`.

**Rules:**
- No `seen` with `level:'calm'`; use `evaded`.
- No per-state `m3_obi` event type; states fold into `enc m3_obi.states`.
- `cause:'knock'|'loud'` never appear in `seen`.

---

## 5 · The fixed numbers

### 5.1 Sight and noise (`TAC.sight.K`; kernel and A's module must agree)
| Constant | Value | Why |
|---|---|---|
| fov | 100° (half 50°) | plan |
| range | default lit 12 / dark 6; KC 12/6; Obi 9/4.5 | foundations; dark halves |
| base gain | standing 55, crouched 22 (/s) | TAIL (v12_core.js:244-252) |
| falloff | `1 − 0.75·d/R` | keeps 25% at the edge |
| **gait multiplier** | still (< 0.3 m/s) **0.7**; moving **`max(1, min(3.4, v/1.55))`**: sneak 1.0, walk 1.0, jog 1.94, sprint 3.35 | **the same suspicion per metre at any upright pace** (F-M3, C-B1). The walking numbers both specs measured are unchanged. |
| noise radius | crouched and moving 1.0 m; upright up to 4.2 m/s **2.5 m**; sprint 9.0 m; gain `45·(1 − d/r)·hearing`, ×0.5 through a tall box | desktop jog = touch walk |
| crowd | a **standing trader** (not a wanderer) within 1.7 m of the player **and** within 1.2 m of the watcher→player line; the player ≥ 3 m from the watcher and ≤ 3.2 m/s → sight ×0 | geometry-aware, and the same on every gfx tier |
| close | < 1.2 m and not crouched-and-still: +40/s, any angle | TAIL +38 |
| grace | after 2 s unseen, the first 0.5 s of sight gain at 50% | reaction time |
| decay | 8/s on a tick with no gain; an alarm stays latched until `reset()`, or for `alarmHold` 6 s unseen, then 99 and decaying | courier 8 |
| levels | notice 35 (exit < 15), alarm 100 | readable fill before the marker |
| glance | up to ±35° toward the last-seen bearing at 2 rad/s, held 2 s; the owner applies it | |
| rate | pace: story 0.6, standard 1, **hard 1**; × 0.65 with Grey Man | detection is never harder than standard |
| heights | target 1.45 standing / 0.80 crouched; eyes KC 1.5, Obi 1.6 | foundations §3.2 |
| tick | 10 Hz fixed, ≤ 3 steps per frame | deterministic |
| eye | shown while the top active watcher has `susp > 0.5` | the pills hide only while you're noticed |

**Measured on the kernel stub** (§12): standing still 6 m in KC's cone, notice at 1.1 s and alarm at 3.8 s. Jog/walk gain
ratio 1.94 (the same per metre). Crouched under half of standing. Zero behind him.

### 5.2 Lanes and the KC path (frozen data, `TAC.lanes.DATA`)
foundations.md §3.3 exactly:
- 18 nodes and 23 edges;
- KC path `[8,4],[8,7.4],[12.6,7.4],[12.6,-2.4],[12.6,-7.5],[7.6,-7.5],[7.6,-12.5],[7.6,-18.6],[12.6,-18.6],[12.6,-20.5]`
  (45.9 m).

Gate: `tac_lanes` paired, as in F-M8.

### 5.3 M2 (B)
**KC's watcher:**
- eye 1.5, fov 100, R 12/6, hearing 0.6, `surface:'on the street'`, `crowd: () => standing traders`.
- **Active** only after the Tunde dialogue ends this run (or `_marketTunde` is already set at build), and only with no chase,
  undecided, and not resolving.
- **Cycle:** phone phases 4.6/5.4/4.2/5.0 s at attention 0.35; look-ups of 1.8 s at attention 1, with a ±0.15 rad sweep.
  The first look-up comes 4.6 s after the conversation. Once noticed, attention is 1 until calm.
- **Heat** 50→100: phone ×1→0.75, look-up +0→0.4 s.
- **Wary** (seen at the meeting): phone ×0.75, look-up +0.4 s. With Heat, the larger of the two.
- **Pre-scan alarm:** no bolt; after 4 s unseen, `reset(50, {quiet:true})`.
- **Post-scan alarm:** within 6 m, he bolts (the range bolt); beyond 6 m, the same 4 s reset.
- **Scan seen** = attention ≥ 0.9 ‖ `exposedNow`. Then HE SAW YOU when the document closes, and the bolt 0.8 s later.
- **`exposedNow`** = `seen` ‖ (`inCone && inRange && los clear && dist < 3`).
- **Fumble or forensic bypass:** `reset(max(susp, 60), {cause})`.

**The confront router** (first match wins):

| Row | Condition | Opening |
|---|---|---|
| legacy | < 1.0 s watched | today's |
| seen | (`exposedNow` ‖ alarm) and gap ≤ 2.5 | today's: stagger 0.5, burst [1.2, 1.5], head start 0.4 |
| range bolt | an automatic bolt with gap > 2.5 | burst null, head start 0, stagger 0 |
| soft | notice ‖ susp ≥ 20 | stagger 0 |
| cold | otherwise | no chase, `_stagger = 0` |

**Tunde:**
- the meeting test runs only within 3.0 m of Tunde;
- `probe(range:15)`, with Tunde's body on the line and the crowd counted;
- the bark at 4 m, once, only when the probe says visible;
- seen → wary + `reset(40, {cause:'tunde', quiet:true})`;
- loud → `reset(max(susp, 20), {cause:'tunde_glance', quiet:true})`;
- the route tip on `quiet`; the habit fact when unseen.

**Uche:**
- **Mesh:** `buildNPCMesh` + `addVest` as asaba.js:163-164. Not in `ENGINE.npcs`, not an obstacle, not crowd.
- **Interactable:** `Post Sgt. Uche`, talk, range 2.4, `optional:true`.
- **Start:** (−2.4, 11.6).
- **Corner route** (first pass; B verifies 0 collider hits, ≥ 0.8 m from standing traders, and never within KC's cone at
  ≤ 12 m): (−2.4,11.6) → (−2.0,17.2) → (7.6,17.5) → (11.43,17.5) → (11.43,11.4) → (12.6,7.4) → (13.3,−2.0) → (13.3,−6.4)
  → (12.6,−7.5). About 44 m, 15 s at 3.0 m/s.
- **Gate route:** the corner route, then (13.0,−12.5) → (13.4,−16.0) → (13.4,−18.4) → (12.1,−19.9). About 57 m. He crouches
  at the gate.
- **Speeds:** jog 3.0; 3.6 in a chase or with Pursuit Lines.
- **Veer:** within 4.5 m, ahead (cos > 0.5), after the opening; corner post and a moving Uche only.
- **Grab** 1.9 m. **Boxed:** best lane score < −1 with an officer within 5 m.
- **Callouts** (van post, or Uche with clear line-of-sight to KC within 14 m): on each last-seen refresh, at most 4,
  `TAC.radio.say` pri 3, ttl 3000, key `uche_call`. Lane and direction only, unless the route is known.
- **Takedown beat** 1.4 s: movement frozen, skipped under reduced motion.

**CUT HIM OFF:**
- within 3.5 m, ±40° of his heading, with a clear line (`!WAY.segBlocked`);
- Kelechi not fleeing: ≤ 1.0 m/s along his heading;
- B's chase clock ≥ 1.5 s, with `burstT`, `headStart` and `pause` all ≤ 0;
- reward +2 Public Trust, `faster`, and `not_one` with no bumps.

**Rewards:** +2 Public Trust per clean catch (cold, cut-off, boxed, Uche). The size is open (§11).
`ribbonCut:'off'` (M-B1).

### 5.4 M3 (C)
**Spawns:**

| Entry | Player | Uche |
|---|---|---|
| knock | (0.35, 5.0, π) | follows from (−0.35, 4.7) |
| loud | (0.35, 4.6, π) | follows from (−0.35, 4.7) |
| quiet front | (0.4, 4.9, π) | holds (0.9, 5.5) |
| side gate (`kcIsFair()`) | (0, −7.6, 0) | (−0.35, −8.1) |
| Squad Trust rear | — | Uche starts at (−0.35, −8.1) |
| perimeter drop | Obi at (0.9, 9.6) | |

**Timings:**

| Entry | Wipe | Obi |
|---|---|---|
| knock | arms at **1.0 s** (55) | runs at **2.5 s** |
| loud | arms at 0 (40) | stunned 2.5 s, then runs |
| quiet | **thumb 0.5 s** after the alarm | runs at +1.5 s |

- Totals: v12's `wipeFor` (unchanged, including +15 with the laptop known and +12 with the cut).
- Beat the thumb = grab within the 0.5 s reach.

**Obi's watcher:**
- eye 1.6, fov 100, R 9/4.5, attention 0.6 (on the call), then 1 from notice;
- **gain**: first pass 1.6, tuned to the C-B1 asserts; `rush` only if needed;
- hearing 1, `surface:'on the tiles'`, crowd none; leak off;
- zones per mansion.md §3.2.

**The flight:**
- path (4.12,−1.0) → (4.12,−2.9) → (3.95,−3.55) → (1.5,−3.65) → (0.35,−3.95) → (0,−4.7) → (0,−8.1), 10.44 m;
- speed `3.0 × min(1, chaseRate())`, ×0.8 with extended timers, none with timers off;
- his collision box is removed while he runs;
- auto-catch 1.4 m; `Stop him` within 2.2 m (the interactable's range is set to 2.2);
- cornered per C-M2; perimeter at +6 s.

**Uche:**
- follows 1.8-2.5 m behind on the 15-node waypoint graph (mansion.md §3.6), integrating per frame;
- COVER: running, or startled/stunned within 4 m, with line-of-sight;
- TAKE HER OUT: per mansion.md §1.5, refused while Obi is unaware on any quiet entry.

**Priorities:** `Move on suspect` 3 while Obi is free; `Walk her out` 1.

**Files:** the shred thresholds 10/20/40 (ledger)/55/70/85/100%, as mansion.md §3.9.

**Grade:** the perimeter costs −5.

### 5.5 Crouch and miss line (A)
**Crouch:**
- `SETTINGS.crouch` `'auto'` (hold on a keyboard, toggle on touch) | `'hold'` | `'toggle'`.
- Speed `MOVE.sneak` 1.25 m/s on both rigs, with or without Shift.
- The fallback rig's crouched `scale.y` is 0.55.
- Desktop chip: `[icon crouch] CROUCHED · release C` / `· C to stand`.

**Miss line:**
- shown 1.8 s, rate-limited to one per 4 s, with an 8 ms haptic on touch;
- "Move closer" within range + 1.5 m, subject to the Senior rule (F-M4);
- suppressed in a chase or tail, during `ENGINE.seq`, with an overlay open, in the car, in m0, over a teaching hint, and
  during `TAC.state.pursuit`.

### 5.6 Radio (A)
**Classes for callers without `opts`:** `RADIO_STATION` 0, `SGT. UCHE…` 2, everything else 1. No expiry and no cap; FIFO
within a class.

**Keyed lines (`opts.key`):**
- `TAC.radio.say` defaults: pri 3, ttl 6000.
- A line with the same key replaces the queued one.
- An expired line is dropped at dequeue and logged.
- Cap 4 keyed lines (the oldest of the lowest priority goes).

**Preemption:**
- A pri-3 line cuts a lower showing line: at once if that line is keyed, otherwise once it has been up 1.2 s.
- **What happens to the cut line:** news is dropped; a text or story line is re-queued at the head of its class; a keyed line
  is dropped and logged `preempted`.

**Rendering:** always through the original `_radioNext` chain (F-B1). Duration and markup are unchanged.

---

## 6 · The team split

### 6.1 File ownership (no file has two owners)
| Path | Owner | Status |
|---|---|---|
| `build.py` (the TACTICS block only) | **A** | **base commit** (`design/stubs/build_py_tactics.patch`) |
| `src/tactics/tac_api.js` | **A** | **base commit** (`design/stubs/tac_api.js`) |
| `tools/harness/scenarios/tactics_lib.cjs`, `tac_api.cjs` | **A** | **base commit** (`design/stubs/`) |
| `src/tactics/tac_core.js`, `tac_geo.js`, `tac_interact.js`, `tac_lanes.js`, `tac_radio.js`, `tac_sight.js`, `tactics.css` | A | new |
| `tools/harness/scenarios/tac_geo_market.cjs`, `tac_geo_mansion.cjs`, `tac_lanes.cjs`, `tac_interact.cjs`, `tac_crouch.cjs`, `tac_settings.cjs`, `tac_radio.cjs`, `tac_sight.cjs`, `tac_hud.cjs` | A | new |
| `src/tactics/tac_market.js`, `tac_market.css` | B | new |
| `tools/harness/scenarios/tac_m2_lib.cjs`, `tac_m2_watch.cjs`, `tac_m2_tunde.cjs`, `tac_m2_confront.cjs`, `tac_m2_uche.cjs`, `tac_m2_chase.cjs`, `tac_m2_matrix.cjs`, `tac_m2_log.cjs`, `tac_m2_save.cjs` (+ `tac_m2_ribbon.cjs` in Build 1+) | B | new |
| `src/tactics/tac_mansion.js`, `tac_mansion.css` | C | new |
| `tools/harness/scenarios/tac_m3_lib.cjs`, `tac_m3_entry.cjs`, `tac_m3_plan.cjs`, `tac_m3_sight.cjs`, `tac_m3_flight.cjs`, `tac_m3_uche.cjs`, `tac_m3_child.cjs`, `tac_m3_laptop.cjs`, `tac_m3_legacy.cjs`, `tac_m3_hud.cjs`, `tac_m3_log.cjs` | C | new |
| `src/tactics/tac_pt.js`, `tac_pt_report.js`, `tac_pt.css`, `tools/pt_report.cjs`, `docs/PLAYTEST-PROTOCOL.md`, `tools/harness/fixtures/pt/*` | D | new |
| `tools/harness/scenarios/pt_lib.cjs`, `pt_caps.cjs`, `pt_player.cjs`, `pt_payloads.cjs`, `pt_seen_read.cjs`, `pt_report_core.cjs`, `pt_report_sheet.cjs`, `pt_cli.cjs`, `pt_slice_m2.cjs`, `pt_slice_m3.cjs` | D | new |
| `src/v12/v12_pt.js` (lines 12, 15-17 + two accessors) and `pt_store.cjs` | D | **Build 1+ only** (the chunked store) |
| `docs/tactics/` (this file, the four area specs and critiques, the protocol draft; reference only) | **the lead** | **base commit**, read-only for the teams |
| `naceca.html`, `src/_bundle.js` | **the integrator** | never committed from a team branch |

**No other existing file is edited.** The optional one-line hooks named in the area specs (chase.js:150, v12_pt.js:187,
v12_plan.js:117, v13_briefing.js:419) are **not taken**. The zero-edit techniques (post-written ribbon buffers, the
`onCaught` wrapper, the MutationObserver, property getters) are binding.

### 6.2 Load order and wrap nesting (`TACTICS_JS`, frozen in the base commit)
`tac_api` → `tac_pt_report` → `tac_pt` → `tac_core` → `tac_geo` → `tac_interact` → `tac_lanes` → `tac_radio` → `tac_sight` →
`tac_market` → `tac_mansion`. CSS: `tactics.css`, `tac_market.css`, `tac_mansion.css`, `tac_pt.css`.

A missing file is skipped, so every branch builds alone, and each file is `node --check`ed.
- **The parse is ESM.** The repo root's package.json has `"type":"module"`, so `node --check` parses these files as ESM.
- **What that requires:** strict-mode-valid code (the `'use strict'` IIFE pattern is fine).

**Wrap nesting** (later = outer):

| Function | Inner → outer |
|---|---|
| `startChase` | v12_core, v12_pt, chase.js, kernel (KC path swap), D (`onCaught` how/by), B (opening, capture, Uche role) |
| `toast` | v12_pt, v13_desk, D (`seen_read`, BACK TO THE TABLE), B (rewrites the opening and lane-bump copy before D sees it) |
| `tryInteract` | v12_pt, D (chase-start reclass), A (miss line) |
| `completeMission` | v12_pt, A (`tac_mission`), B (`m2_summary`), C (`m3_summary`) |
| `ensureHudV8` | v13_boot, A (chip row, crouch hold), C (`#ctx-uche`) |

`updatePressure`, `newScene` and `nearestInteractable` are wrapped **only** by the kernel.

### 6.3 How the teams work in parallel
1. **Base commit (the lead, before forking).** On a branch `tactics/base` from the integration branch:
   - apply `design/stubs/build_py_tactics.patch` to `build.py` with `git apply` from the repo root (checked with `git apply --check`: it applies cleanly at 74a0c96);
   - copy `design/stubs/tac_api.js` → `src/tactics/tac_api.js`;
   - copy `design/stubs/tactics_lib.cjs` and `tac_api.cjs` → `tools/harness/scenarios/`;
   - copy this file, `foundations.md`, `market.md`, `mansion.md`, `telemetry.md`, the four `*.critique.md` and
     `playtest_protocol.md` → `docs/tactics/`, so every worktree has the contract;
   - build; run `tac_api` and the base regressions (§12: all passed in scratch); commit.
2. **Worktrees.** `git worktree add ../naceca-tac-{a,b,c,d} -b tactics/{a,b,c,d} tactics/base`.
   - Each team builds with `NACECA_OUT_DIR=<worktree>/out python3 build.py` and runs scenarios with
     `--html <worktree>/out/naceca.html`. **Never commit `naceca.html` or `_bundle.js`.**
   - Each runs `tac_api.cjs` plus the full regression list before asking to merge.
3. **Merge order.**
   - **A first.** B, C and D then rebase (no conflicts: disjoint files), flip their `SKIP (needs A)` asserts on, and re-run.
   - **Then B, C and D in any order.**
   - **D's `pt_slice_m2` / `pt_slice_m3`** run after B / C are in (D writes them against §4 meanwhile, with C/B fixtures
     captured from their branches).
4. **Integration (the lead):**
   - rebuild `naceca.html`;
   - run every `tac_*`, `pt_*` and regression scenario on fresh pages (one scenario per run; `wayfind_chase` counts per page);
   - run `v13_port_playthrough` first (it drives every interactable, including Uche, the new child label and the cold-grab
     capture);
   - commit the built page.

### 6.4 Regressions every team runs before merging
**The full suite**, each scenario on a fresh page:
- `wayfind_*` (arrow, catch, chase, coldopen, escape, minimap, or, resolve, tracker);
- `board_*` (difficulty, file, herrings, locks, migrate, night, shots, van);
- `casework_*` (docs, finale, lagos, newgame, replay, route, settings, warrant);
- every `v13_*`;
- `pt_logger`, `visual_desktop` (`--w 1280 --h 800`), `visual_touch` (`--w 390 --h 844 --touch 1`);
- `tac_api`.

**Per-team watch lists:**
- **A:** `v13_a_radio`, `v13_e_spoilers` (they re-wrap `radioLine`), `pt_logger`, `wayfind_escape`/`catch`/`chase` (lanes),
  `visual_*` (eye restyle).
- **B:** `wayfind_catch`, `coldopen`, `escape`, `chase`, `minimap`, `resolve`; `v13_port_playthrough`; `pt_logger` (exactly 1 `blocked`).
- **C:** `v13_port_playthrough` (legacy M3, "stay put" → `Walk her out`), `v13_port_flow` step 4, `casework_warrant`,
  `casework_lagos`, `wayfind_tracker`, `pt_logger` (`wipe_end`), `v13_a_flaws`, `v13_a_saves`.
- **D:** `pt_logger` (unchanged, must pass), `casework_settings`, `visual_*` (the Settings rows), every `v13_*` (their
  `V12.log` calls pass through the new wrapper).

---

## 7 · The four team scopes (summary; the standalone briefs are in `teams.json`)

### 7.A Foundations — Build 1
**Kernel (base commit).** Plus these files:
- **`tac_core.js`:**
  - the crouch setting row (`SETTINGS_UI` push, the `SETTINGS_DEFAULT` fill);
  - toggle and hold on keys and touch (§2.1 minors);
  - fallback-rig speed and silhouette;
  - the desktop chip in `TAC.ui.chipRow()`;
  - `ICONS.crouch`;
  - `tac_mission`;
  - the Grey Man `desc` and `where` text via `SKILLS.fieldcraft`.
- **`tac_geo.js`:**
  - the tables for the dressed market, the legacy market and the art-pass mansion;
  - `vis{kind,h,y0,name,box}`;
  - the sign is `skip`;
  - `TAC.sight.los`, `ready()`, `geo_drift`.
- **`tac_interact.js`:** the default spent table (§3.4) and the miss line (§5.5).
- **`tac_lanes.js`:** `install()` at load, and `check()`.
- **`tac_radio.js`:** §5.6, built on wraps only (F-B1).
- **`tac_sight.js`:** the full module per §3.2 and §5.1:
  - line-of-sight, grace, why grammar with places and cover, glance;
  - the eye why-line, palette restyle, reduced motion and landscape placement;
  - the head marker, offset under the world label;
  - `seen` / `evaded` with `logExtra`;
  - the Recruit `tac_sight` chip via `TAC.hint`.
- **`tactics.css`.**

**Scenarios:** `tac_api` (base), `tac_geo_market`, `tac_geo_mansion` (art and legacy), `tac_lanes` (paired gate),
`tac_interact` (through `tryInteract` and the `#ctx-main` click, the Senior hidden-trace case, the priority-reassignment
case), `tac_crouch`, `tac_settings`, `tac_radio` (OVERHEARD, VO, story-line survival, preemption, stale-timer guard),
`tac_sight` (cases a-j of foundations §5.2 plus per-metre parity, `reset` emitting one `seen`, and `alarmHold`), `tac_hud`.

### 7.B Market — Build 1
Everything in §1 and §5.3:
- KC's watcher, cycle, Heat and wariness;
- the one-model Tunde meeting and the copy fixes;
- the scan exposure at the hand;
- the confront router;
- CUT HIM OFF;
- Uche: post dialogue (gated on Tunde), mover, the moving-Uche rule, corner, gate, van callouts, takedown beat;
- the Pursuit Lines move and the `V12.say` rewrite (scoped);
- spent entries;
- Recruit chips via `TAC.hint`;
- telemetry.

`ribbonCut:'off'`.

**Scenarios:** `tac_m2_watch`, `tac_m2_tunde`, `tac_m2_confront` (+ the pre-scan grid and the phase-dependent scan), `tac_m2_uche`
(+ the route-cone assert, en route, the Tunde gate, the 844×390 fit), `tac_m2_chase` (+ cut-off line-of-sight, `stopChase`,
`_stagger`, the HE SAW YOU toast at +1.0 s, the en-route cells), `tac_m2_matrix` (§2.2 M-M5; **the balance gate: no cell may
regress versus today on the same seeds**), `tac_m2_log`, `tac_m2_save`.

### 7.C Mansion — Build 1
- Item 11: false outcomes in both houses, plus the plan and briefing truth.
- Item 12: entries, the card, the deferred wipe, the loud stun, the MQ `ready` patch, the locked screen, the power cut (dim and
  half sight).
- Item 13: Obi's watcher, tuned to the C-B1 asserts.
- Item 14: the flight, intercept, cornered, and the perimeter (no force).
- Item 15: Uche follow, COVER, TAKE HER OUT, the back post tackle, the UCHE button and chip.
- Item 16: KC gate, Squad Trust, Street Sources, the power cut.
- Item 17: files, custody line, drives lead, aftermath row.
- The tracker override, `child_gentle` rule, dynamic blips, and telemetry.

Legacy house: only the false-outcome fixes and the files.

**Scenarios:** `tac_m3_entry`, `tac_m3_plan` (+ the spoken briefing, no false toast), `tac_m3_sight` (+ the four-gait asserts), `tac_m3_flight` (+
cornered vs tackle, touch-jog intercept, no force on the perimeter), `tac_m3_uche` (+ the spent Uche interactable, COVER
gating), `tac_m3_child` (+ the `child_gentle` rule, the tracker override), `tac_m3_laptop` (+ `ENGINE.seq` spot), `tac_m3_legacy`,
`tac_m3_hud` (+ joystick and sprint overlap), `tac_m3_log`.

### 7.D Playtest kit — Build 1
- **`tac_pt.js`:**
  - the outer `V12.log` wrapper (label, `ps`, ceilings, `d.rep`, size guard, enrichments);
  - NEW PLAYER with a device id;
  - a two-tap CLEAR;
  - `.txt` share export with a fallback, and per-player export;
  - Settings rows (label or `?pt=1`);
  - `seen_read`, `ov_dwell`, investigation failure signals;
  - `orient`.
- **`tac_pt_report.js`:** the pure analyser (vm-loadable, dedupe, device+label players, chosen vs result, NO READ DATA,
  investigation rows) and the sheet.
- **`tac_pt.css`.**
- **`tools/pt_report.cjs`.**
- **`docs/PLAYTEST-PROTOCOL.md`** (§10).

**Scenarios:** `pt_caps`, `pt_player` (+ two players' independent `ps`), `pt_payloads`, `pt_seen_read`, `pt_report_core` (fixtures
regenerated from B/C captures), `pt_report_sheet` (+ the desk → pause → Settings → VIEW navigation), `pt_cli`, `pt_slice_m2`,
`pt_slice_m3`.

---

## 8 · Build 1+ (in order, if time allows)
1. **B: the restricted cut ribbon** (M-B1). It ships only if `tac_m2_matrix` passes on ≥ 20 seeds, including cut@1.3 s and
   Recruit. If it ships, the tier-3 text becomes true.
2. **C: GO ROUND THE BACK** and the order cards, stacking upward (portrait one column, landscape two). It closes on a button
   tap or after 4 s.
3. **C: `t_sims` lights Obi and the laptop** (C-M4). Without it, the laptop marker and the Obi/laptop blips stay hidden until
   seen (a player-eye `TAC.sight.los`), and the tracker reads "Find the laptop · the study". Recruit keeps markers.
4. **D: the chunked store** and the `saveGame` pre-flight safety net (T-M3). This is the only `v12_pt.js` edit: lines 12 and
   15-17 plus `V12.ptEvents` / `V12.ptClearAll`, rotating on the 20 s tick. It must land before the next public release.
5. **C: Recruit chips**, the calm child line (after the STORY-CANON check), the minimap facing wedge, and the BLIND SIDE hatch
   (Recruit only).
6. **A: align the 12 dressed-market legacy stall colliders** to the visible counters (0.9 × 2.0). The lanes stay clear. Needs a
   `tac_m2_matrix` re-run.
7. **A + B: switch `WAY.losTest` (chase.js:57) to `TAC.sight.los`** at 1.5 m, and re-tune last-seen.
8. **C: the leak**, only after the PO and the v13 owners agree (§11).
9. **B: a prop for crouch cover in KC's cone**, after the render check.
10. **Fold the lane data into market.js:8-13/:157** once the layer is permanent.

---

## 9 · What needs real rendering or a real device
The harness stubs three.js, so these can't be settled there.
- **Environment needed for headless real-render checks:** cdnjs.cloudflare.com, fonts.googleapis.com and fonts.gstatic.com.
- **Hardware for the rest:** a mixed phone and desktop playtest (§10).

| Check | Owner | Device or render |
|---|---|---|
| Is KC's 8 cm sign slab opaque (it decides the Tunde meeting and part of his left cone)? | A | render |
| Lane gaps: the 1 m gap behind KC's stand, the north nodes at (11.43, 11.4/17.5), the dead end 0.17 m from the okada. Does the ribbon clip the crates? | A | render |
| Do the legacy colliders 0.9 m short of the visible counters read as an invisible wall? | A | device |
| Does a crouched Kelechi *look* hidden behind the armchair and the counters, from the third-person camera? Does the 0.8 m crouched target match the sneak clip? Does the 0.55 fallback silhouette? | A, C | render |
| The eye, why-line and head marker at 390×844 in sunlight; the landscape eye against the radio strip and the mission panel; the desktop chip's discoverability | A | device |
| Touch: hold-to-crouch with one thumb on the stick (opt-in); CROUCH and SPRINT reach mid-move; the UCHE button reach | A, C | device |
| Radio: does a cut bulletin feel abrupt? Can a callout be read while running? | A | device |
| Frame time: two or three watchers + HUD + one more jogging rig (M2 Uche; M3 Uche and Obi) on a low-gfx phone (auto-downgrade below 24 fps, settings.js:107-120) | A, B, C | device |
| KC's look-up and ±0.15 rad sweep at 10-14 m; the 35° glance; the `idle` vs `talk` idle | B | render |
| The side and back approaches in the baked art; the scan's staged reach from beside the stand | B | render |
| Tunde's road vs stall side, read from the camera | B | render, device |
| Uche: foot sliding at 3.0/3.6 m/s; the corner post as "a body in the lane"; crouched at the gate as hidden; the kneel takedown; the 1.4 s camera beat among the canopies | B | render |
| CUT HIM OFF: can a phone player tell "in front of him"? Does `handsup` land before the dialogue? | B | device |
| Does the baked Room show a door at the corridor end (z −8.68)? Otherwise the side gate starts at (0, −6.2). The camera in the 2.2 m corridor. | C | render |
| The power cut: do light maps at 35% read as dark on a phone in daylight and stay playable? Is the laptop glow enough? | C | render, device |
| Obi's run: the jog clip at 3.0 m/s, the bookshelf turn, clearance at the sideboard and lamp. The perimeter beat without officers on screen. | C | render |
| Uche through the door leaves; walking hand in hand with the child (or the `carry` clip) | C | render |
| The halted laptop screen's two-column file list, legible on the in-world canvas | C | render |
| Share sheet: a `.txt` File on iOS Safari and Android Chrome; WhatsApp, AirDrop and Mail keep the name; `window.claude.use('downloads')` | D | device |
| iOS localStorage quota and private mode; events lost on a background-tab kill | D | device |
| Do `seen_read` ≥ READ_MS and the lost score match the facilitator's C and A notes (calibration after session 1)? | D | playtest |

---

## 10 · The facilitator protocol
- **Location in the repo:** `docs/PLAYTEST-PROTOCOL.md`, owned by D.
- **Current draft:** `design/playtest_protocol.md`.
- **D applies these fixes when moving it into the repo:**
  - **CLEAR** (two taps) only after the exported file is confirmed received. "For the next player" points to step 1 (EXPORT
    and check), not step 3.
  - **Labels:** write the device id with the label (`B7QX·P3`), as the sheet prints it.
  - **Settings after the aftermath:** CONTINUE → title or hub → pause (the pill or Esc) → SETTINGS → PLAYTEST. The aftermath
    itself has only CONTINUE and VIEW SKILLS.
  - **Time box:** the 75-minute budget covers M0 → M3. Add the facilitator start at M2 (a fresh Senior save with m0 and m1
    done, the state `h.start('m2', {completed:['m0','m1']})` uses) for sessions under 60 minutes, and record which start
    was used.
  - **Hints when stuck:** record the setting per player. Leave it at the default until the PO answers §11.8.
  - **Summary access:** the Summary rows appear only after NEW PLAYER (or `?pt=1`).
  - **CLI:** `node tools/pt_report.cjs <folder> [--player B7QX·P3] [--around 2026-10-17T14:32] [--md report.md]`.

---

## 11 · Open questions for the product owner
The design ships the bold default, so nothing blocks on these.
1. **The cut ribbon on Senior without preparation.** Default: off in Build 1, then `'earned'` if the matrix passes. Senior
   players who chose "Bring him in now" never see it. Confirm.
2. **The cold grab ends M2 without a chase.** Adopted. Confirm.
3. **+2 Public Trust per clean catch** (cold, cut-off, boxed, Uche). Confirm the size.
4. **Sofa and cash table.** Measured: they don't hide a crouched player (tops 0.93 against the wall, and 0.57). The cover is
   the armchair, the doors and walls, and the east flank. The plan text is corrected, not the room. Confirm.
5. **The leak** (refused warrant + exigent → Obi faces the door, alarm at 60). It is off until the PO and the v13 owners
   agree, because v13 removed leak timers on purpose (v13_boot.js:94).
6. **The informant deal without Crisis Negotiator** only for a cold catch or beat-the-thumb. Confirm the capability text
   stays true.
7. **PLAYTEST rows.** Player and Summary are visible only with a label or `?pt=1`; the existing log rows stay as today.
   Confirm.
8. **"Hints when stuck" defaults On, also on Senior Agent.** Its 60 s "Try this next" toast tells the player what to do,
   which conflicts with the Senior rule. Should Senior default it Off? This is outside this layer; it's a settings default.
9. **Hold-to-crouch on touch** ships opt-in. Auto stays toggle. Confirm.
10. **Achievements on Uche's catch.** As written, "Faster Than Computer Village" and "Not One Bystander" unlock only on
    Kelechi's own catch (a tackle or cut-off). Confirm.
11. **KC's sign:** if the render check shows it opaque, it becomes a real occluder (it narrows KC's left cone and hides the
    Tunde road side). Accept either outcome.

---

## 12 · Stub files and their validation (scratch; nothing in the repo was modified)
All are under `design/stubs/`:

| File | What it is |
|---|---|
| `tac_api.js` | the kernel (~400 lines): the frozen API with fallbacks (§3); `node --check` clean |
| `build_py_tactics.patch` | the `build.py` block: lists, optional files, per-file `node --check` and the `</script` guard |
| `tactics_lib.cjs` | the shared fixtures: `T.start` with seed and frozen clock inside the `loadMission` evaluate, `deviceMarket` (61 obstacles / 27 blockers asserted, lanes installed), `deviceMansion` (39 obstacles asserted) and `restoreArt` (all four art stubs restored), `capture`/`events`, `walk`, `pursue`, `finishDialogue`/`choose` |
| `tac_api.cjs` | the kernel's own scenario |

**Validation:** a copy of the repo, patched and built with `NACECA_OUT_DIR`, under `design/stubtest/`. Results are in
`design/stubtest/regress_stub.txt`.
- `tac_api`: **PASS**. 10 ticks and 60 frames per second; lanes installed (18/23); notice at 1.1 s and alarm at 3.8 s
  standing 6 m in KC's cone; jog/walk gain ratio 1.94; zero gain behind; the past-tense line frozen at alarm;
  `reset({cause})` logs one `seen`; the spent phone steps aside for KC; `TAC.hint` is Recruit-only; KC runs the frozen
  path; the art-pass mansion is `ready()` and the legacy one is not.
- **The full suite with the kernel in the page** (`design/stubtest/regress_full.txt`): **all 68 scenarios pass.** That is
  every `board_*`, `casework_*`, `v13_*` and `wayfind_*` scenario, plus `pt_logger`, `tac_api`, `visual_desktop` and
  `visual_touch`. The visual tours need their flags (`--w 1280 --h 800`; `--w 390 --h 844 --touch 1`); a first run
  without them failed `visual_touch` on its own touch check, and both pass with them.
- So the base commit is safe to fork from: on its own, the kernel changes no behaviour (its wraps are pass-through until
  something registers).
