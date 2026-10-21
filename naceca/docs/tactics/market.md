# Phase 1 · the Ikeja market (M2): plan items 7–10

Design spec, written against `claude/naceca-bundle-integration-133395 @ 261a000`. Every file:line below was checked
against that commit. Nothing under the repo was modified. Scratch prototypes and geometry scripts are listed in §9.

It builds on the foundations spec (`design/foundations.md`): `TAC.sight` (§3.7 there), `TAC.radio.say`, the rebuilt
`MARKET_LANES` and `TAC.lanes.KC_PATH`, the spent-target rule and the device-layout fixtures. Section 2.5 lists the few
extra hooks this file needs from that module.

---

## 0 · In one paragraph

KC now runs a look-up cycle: head down at his phone for about 5 s, then up for 1.8 s, watching the road. After Tunde has
pointed him out, the existing eye shows how much he has noticed you, and the line under it says why. How you reach his
counter decides how the confrontation starts:
- **Unseen:** a cold grab, with no chase.
- **Half-noticed:** a chase with no tray shove.
- **Seen:** today's start, the shove and the dash.

So being seen is never worse than today. In the chase, getting in front of him is called out (**CUT HIM OFF**). It ends the
chase with no tackle and earns +2 Public Trust. When you have earned his route, the red ribbon leads to the point where you
can get in front of him.

Sgt. Uche now stands by the van, and you post him before you move:
- **The back-lane corner:** KC sees him and veers off; if KC passes within reach, Uche takes him down on screen.
- **The back gate:** Uche waits out of sight, and KC runs into him at the dead end.
- **The van** (the default): Uche stays put and radios where KC went.

Tunde gives you KC's route if you choose to protect him ("Stay back…"). If you talk to Tunde standing out in the road
where KC can see, Tunde gets twitchy, KC starts wary, and you lose Tunde's "he never looks behind him" fact.

The preparation lines become true:
- Tunde's "quick and quiet".
- Pursuit Lines' "Uche cuts corners".
- Intel tier 3's "you know their routes".
- Grey Man, which now slows KC's eye too.

All of it lives in one removable file, `src/tactics/tac_market.js`, plus a few lines in the shared `tactics.css`.

### Measurements that shaped it (4 harness runs + offline geometry, §9)

**Chase numbers.** Dressed market colliders, a pursuer at 4.42 m/s (the wayfind_catch pessimistic touch sprint), crowd
seeds 1–5. Times are the mean (median); bumps are bystanders knocked down per chase.

| Cell | Caught | Time s | Bumps | How |
|---|---|---|---|---|
| today, follow the ribbon after 1.3 s | 5/5 | 5.3 | 0.8 | tackle |
| today, follow after 2.5 s (three runs) | 5/5 | 8.3 · 9.8 · 13.0 | 1.4–2.0 | tackle |
| today, follow after 4 s | 5/5 | 16.8 | 3.2–3.4 | tackle |
| today, cut through the middle gap to (12.6, −2.4) after 2.5 s | 5/5 | 5.2–5.9 | 0.2–0.6 | tackle |
| CUT HIM OFF rule only, follower | 5/5 | same as today | same | tackle (the rule never fires from behind) |
| cut ribbon, horizon 1 or 2 nodes (1.3 s and 2.5 s) | 5/5 | same as today | same | **0 cuts ever shown** |
| cut ribbon, horizon 3 nodes, after 1.3 s | 5/5 | 6.8 | 1.6 | 2 cut-offs |
| cut ribbon, horizon 3 nodes, after 2.5 s (two runs) | 5/5 | 10.6 (9.2) · 12.0 (9.35) | 2.0–2.8 | 3–4 cut-offs |
| "merge" ribbon (closest point behind him), horizon 2 or 3 | 5/5 | 12.2–12.9 | 2.2 | tackle; **no gain, rejected** |
| Uche at the corner, visible (KC veers), follow 2.5 s | 5/5 | 5.3–5.4 | 1.8 | cut-offs, boxed, tackles |
| Uche at the corner, follow 4 s | 5/5 | 7.9–9.0 | 0.6–0.8 | tackle |
| Uche at the back gate, **visible** (KC veers), follow 4 s | **3/5** | 13.4 | 3.4 | **2 still running at 60 s: rejected** |
| Uche at the back gate, **hidden** (no veer), follow 2.5 s | 5/5 | 9.6 | 2.2 | 2 by Uche |
| Uche at the back gate, hidden, follow 4 s | 5/5 | 11.2 | 3.4 | **5/5 by Uche** |

Two technical findings came out of this:
- **The same seed gave 8.3, 9.8 and 13.0 s in different runs.** The page's animation-frame loop draws `Math.random` between
  `page.evaluate` calls. Seeded scenarios must seed inside the same evaluate that confronts and runs the chase (§5).
- **The Uche-at-the-back-gate numbers settled a design choice.** A visible Uche there made late chases *worse* than today.
  Hidden at the gate, he guarantees the catch.

**Geometry**, offline: legacy stalls + van + the 46 dressed obstacles, KC at (8, 4) facing −x.

| Spot | Distance to KC | Off his facing | Scan in reach | Confront in reach |
|---|---|---|---|---|
| counter front, the harness spot (5.8, 4.6) | 2.28 m | 15° | yes | yes |
| counter front (5.6, 4.0) | 2.40 m | 0° | yes | yes |
| south side (7.5, 2.1) / north side (7.5, 5.9) | 1.96 m | 75° | yes | yes |
| behind him (9.2, 3.6), between his stand and the stall | 1.26 m | 162° | yes | yes |
| m2 step-out (0, 9.4) | 9.65 m | 34° | — | — |
| Tunde's spot (−6, −2) | 15.23 m | 23° | — | — |
| ring 2 m round Tunde, road side (E, NE, N, SE) | 13.4–14.6 m | 16–31° | — | — |
| ring 2 m round Tunde, stall side (W, SW, S) | 16.1–17.1 m | 21–30° | — | — |

Two route checks:
- **Uche's routes to his posts:** to the corner 26.1 m (8.7 s at a jog); to the back gate 39.0 m (13.0 s). Neither touches
  a collider, and both stay ≥ 1.1 m from every standing trader.
- **KC's authored path:** 45.9 m, 10.1 s from the confront to the dead end.

The foundations spec also measured three things that matter here:
- KC's forward cone has **no** crouch cover.
- A thin sign on his stand blinds a 17–50° wedge on one side, which includes Tunde's bearing.
- The step-out point is inside his 12 m lit range.

So this design leans on KC's **attention phases** and **cone** (come from the side or from behind), not on furniture. KC's
watcher is off until Tunde has pointed him out.

---

## 1 · What the player experiences

### 1.1 Arrival

- Kelechi steps out of the van at (0, 9.4) as today (art_pass_v8.js:2656-2659). The camera turns to Tunde
  (`faceFirstObjective`).
- **Sgt. Uche** (NACECA kit, the M3 sergeant) stands at the van's rear corner at (2.4, 10.6), 2.7 m to Kelechi's right. That
  is just outside his 2.4 m talk range, so he never takes the first ACTION press. His minimap dot is green (`#5dd07a`, the
  colour paper.css:99 maps to `--green`), smaller than the van's.
- **At 1.5 s, a text from Tunde, for every player:** `TEXT · TUNDE: I'm at my spot across the road from him. He can see
  anybody standing out in that road.` It is a fact about the world, so it shows on Senior Agent too. Street Sources' own
  Tunde text still arrives at 2.6 s (v12_core.js:381) and queues behind it.
- **There is no eye yet.** KC isn't watching anyone until Tunde has told you who he is.

### 1.2 Meeting Tunde: where you stand, and what you choose

**Where you stand.** Tunde stands at (−6, −2) facing the road; his position is unchanged (wayfind_minimap asserts it).
- If you walk up on his **road side**, KC can see the pair of you: within 15 m and inside his 100° cone.
- If you walk up on his **stall side**, you are 16–17 m off, and Tunde's own body is between you and KC.

When you first come within 4 m of Tunde on the exposed side, Tunde mutters a radio-strip bark (once):
`TUNDE: Oga, the boy fit see you for road.` (English setting: `Sir, the boy can see you out in the road.`). You can step
round him before you press TALK. The bark states a fact, so it shows on both difficulties.

**The conversation opens with the same canon first line** ("…that one in the orange shirt by the phone-charging stand…").

- **If he saw you,** Tunde's next line is new: `He dey look this way, oga! Make you no stand for road like this.`
  (English: `He's looking this way, sir! Don't stand out in the road like this.`).
- **If he didn't,** Tunde adds a habit you can use: `That boy dey watch the road. Im back? E no dey look am at all.`
  (English: `That boy watches the road. He never looks behind his stand.`).

Then comes the existing choice, with the same text and the same reputation effects:
- **"Stay back. I'll handle it without naming you."** Tunde adds KC's route: `God bless you, oga. If he run, he go take the
  lane behind im stall, cut through the second gap, then make for the back gate. That gate get chain.` (English: `…he'll take
  the lane behind his stall, cut through the second gap and make for the back gate. That gate is chained.`).
  - The back gate appears on the minimap as a dashed ink ring.
  - Uche's back-gate option gains "Tunde says that's where he runs".
  - With the route known, the chase ribbon can show you where to get in front of him (§1.7).
- **"Bring him in now. I'll explain at HQ."** No route. Tunde: `Ehn! Oga, you wan make dem kill me? Look am — e don see me
  dey look am.` (English: `Sir, do you want them to kill me? Look — he saw me looking at him.`). KC starts the watch at
  20% suspicion.

When the conversation closes:
- **If he saw you,** KC's watch starts at 45% (noticed). The eye appears with the line *"He saw you talking to Tunde in the
  road"*, and the eye icon floats over his head (foundations §1g). It drains like any other notice. This is never a failure:
  the worst case is a chase that starts like today's.
- **In every case** the o1_tunde objective completes exactly as today (dialogue_system.js:139-142).

### 1.3 Posting Uche

After the conversation, if you haven't posted him yet, Uche radios (priority 1):
`SGT. UCHE: I'm with the van, sir. Tell me where you want me before you move on him.`
Walk to him: his world label reads **Post Sgt. Uche**, and the button reads TALK. It uses the existing paper dialogue box,
so choices are ≥ 44 px on touch (paper.css:123) and the existing keyboard and tap handling applies. Uche says:
1. `There's a lane behind his stall. It turns in at the second gap and runs down to a gate at the far end.`
2. `Where do you want me when he runs, sir?`, with three choices:
   - **"The back-lane corner. Let him see you there."**
   - **"The back gate. Stay out of sight."** If Tunde gave the route, this reads "… Stay out of sight. Tunde says that's where
     he runs."
   - **"Stay with the van. Call it on the radio."**

After the choice:
- Uche answers on the radio and jogs to the post on screen: about 9 s to the corner, about 13 s to the gate.
  - Corner: `Back-lane corner. He'll see me if he comes down that lane.`
  - Gate: `Back gate. He won't see me till he's on top of me.`
  - Van: `I'll stay on the van and call it.`
- His minimap dot moves with him. The post gets a green ring.
- On arrival: `SGT. UCHE: In position.`
- You can re-post him by talking to him again before the chase starts. Once the chase starts or KC's fate is decided, his
  label steps aside (spent) and a press says `SGT. UCHE · Van's ready when you are, sir.`

If you never talk to him, Uche stays with the van, which is the van post. Posting is optional. The tracker never points at
him (`optional:true`, as Mama Bisi at art_pass_v8.js:3897). The objective chain stays Tunde → phone → KC.

### 1.4 Approaching KC: he looks up

From the end of the Tunde conversation, within 14 m of KC (range 12 + 2, foundations §1g):
- **The eye** sits top centre (92 px down on a phone, under the radio strip). It is restyled in the paper palette by the
  foundations module.
- **His cycle.** For about 4.2–5.6 s KC's head is down: the phone clip, arm up. His attention is 0.35, so you have to be
  right in front of him for long to register. Then for 1.8 s the phone comes down and he looks out over the road
  (attention 1). The eye's existing `watching` blink runs on every tick he can actually see you, so the rhythm is readable
  on the HUD as well as on the rig.
- **Fill and why.** Standing or walking in his cone while he's up fills the eye. The line under it says why, for example:
  - *"He can see you crossing the open road, standing"*
  - *"He can see you by his counter, standing"*
  - *"He heard you running beside him on the street"*
  - *"You were within arm's reach"*
- **What drains it** (foundations §3.5):
  - staying out of his 100° forward cone (beside or behind him);
  - standing within 1.7 m of a shopper or trader;
  - crouching (the CROUCH button on touch, C on desktop) where something lower than your head is between you;
  - range (over 12 m);
  - not running (sprint is heard at 9 m, jog at 4.5, walk 2.5, sneak 1).
- **At 35% (notice)** the eye icon floats over his head and he glances toward you. At 100% it turns to the alert icon.
- **Before the scan, an alarm doesn't send him running.** He pockets the phone and watches. After 4 s with no sight of you
  he relaxes back to 50%, and it drains from there.

**The routes, as a player sees them** (all measured, §0):
- **Straight across the road to the counter front.** You arrive noticed, 4–69% depending on his phase. At the counter front
  he sees you even with his head down. This is today's approach.
- **Round the south end and up the stall fronts, or through the middle gap and down the back lane to behind his stand.**
  You stay out of his cone the whole way and arrive at 0–12%.
- **Your last two metres:** beside or behind him he can't see you. Inside 1.2 m he notices anyone who isn't crouched and
  still. The confront reaches 2.5 m and the scan 2.0 m from the phone, so both work from his side or his back.

### 1.5 The scan

The press is the moment that counts. The scan's mini-game and document pause the world, as today.
- **If he could see you when you pressed** (in his cone, in range, a clear line, and no crowd cover within 3 m of him): when
  the document closes, the toast reads **HE SAW YOU · He saw you lift his phone. He's running.** 0.8 s later he bolts (§1.6).
  The why line freezes on *"He saw you lift his phone"*.
- **If he couldn't:** nothing happens. You can step in and take him.
- **A failed or abandoned scan in his view** raises his suspicion to at least 60% (*"He saw you handling his phone"*), with
  no bolt. You can try again, and the phone is still there.

### 1.6 The confrontation: approach decides how it starts

You press TALK on KC. The phone has stepped aside after the scan (foundations §1a). The decision uses his watcher's state
from the last 10 Hz tick. The interaction's face-each-other turn can't influence it.

| Situation when you press | What happens on screen | Chase opening (`startChase` cfg) |
|---|---|---|
| **Calm**: level calm, under 20%, not in his sight right now | **CAUGHT COLD.** You put a hand on his shoulder; he freezes, hands up (the proxy `handsup` clip, people_art_pass.js:424). Toast `CAUGHT COLD · He never saw you coming. Quiet arrest · +2 Public Trust`. The canon `market_runner` dialogue opens at once. | **No chase.** |
| **Half-noticed**: notice level, or 20% and over, but not in his sight right now | He spins and runs. There is no tray: `HE'S RUNNING · He'd clocked you — no time to grab a tray. Sprint, and mind the traders.` | shove off (`ENGINE._stagger` 0); dash [1.2 s, ×1.5] and head start 0.4 s as today |
| **Seen**: in his sight right now, or alarm, at arm's length (≤ 2.5 m) | Today's moment, word for word: the tray shove, `HE'S RUNNING · KC shoves a tray at you…` | today: stagger 0.5, dash, head start 0.4 (market.js:151-156) |
| **He bolts on his own**: after the scan, alarmed, you within 6 m but beyond 2.5 m | `HE'S RUNNING · He made you from his counter. Sprint.` | no shove, no dash, head start 0 |
| **No watch history**: under 1.0 s of play with the watcher awake (a harness driver, a just-restored run) | today's moment | today |

So a seen approach is exactly today's chase, and the other three cases are easier than today.

### 1.7 The chase

The chase is today's: same speed, same catch radius 1.9 m, same escape rule (20 s over 14 m), same last-seen guidance. Five
additions:

**1. CUT HIM OFF.** After his opening (1.5 s, dash over, not pausing at the dead end), get within 3.5 m *in front of* him
(within ±40° of where he's heading) without running away from him:
- He stops dead and raises his hands. Toast `CUT HIM OFF · You got in front of him. No tackle, nobody hurt · +2 Public
  Trust`. Haptic.
- The dialogue opens as on a tackle, synchronously (wayfind_catch reads the dialogue at once).
- Unlocks "Faster Than Computer Village", plus "Not One Bystander" if nobody went down. That is the same pair as a tackle
  (pressure.js:181).
- Standing on his path no longer means he runs into you for a tackle; it is a cut-off.
- Following from behind is unchanged: a tackle, as today.

**2. The ribbon shows the cut, when you know his route.** "Know his route" means Tunde's tip, intel tier 3 (PREDICTIVE),
or the Recruit difficulty.
- While he's in sight, the red ribbon runs from Kelechi to the first point on his next three legs that you can reach 0.3 s
  before him, on a clear line that passes no standing trader closer than 0.8 m.
- From there it runs back along his route to him, so it still ends on KC.
- Typically this is the second-gap corner (7.6, −7.5) when he's coming down the back lane.
- When no such point exists, or he's out of sight, the ribbon is today's (chase.js:76-102).
- On Senior Agent without his route, the ribbon is unchanged. A one- or two-leg horizon never produced a cut in 15 runs, so
  the cut is knowledge, not perception (§0). See the open question in §8.

**3. Bystanders tell you why.**
- The BYSTANDER DOWN toast (pressure.js:167) says where it happened when the trader was in a lane: `You flattened a trader
  at full sprint in the trader lane. −3 Public Trust`. That is feedback, on both difficulties.
- **Recruit only**, once per save, on the first bump: the hint chip `Cut across, not down the lanes — the traders stand in
  the lanes.`

**4. Uche, by post:**
- **Back-lane corner (12.6, −7.5).** As KC comes down the back lane, he sees Uche within 4.5 m ahead and veers into the
  lanes, with no "DOUBLING BACK" pause.
  - If every way out is closer to an officer than to him, with one within 5 m: `BOXED IN · Nowhere left to run. He puts his
    hands up · +2 Public Trust`.
  - If he passes within 1.9 m of Uche: **UCHE HAS HIM**.
  - Uche at the chase start: `He's running — I'm at the corner.`
- **Back gate.** Uche stands at (12.1, −19.9), beside the dead end KC's route ends at, out of sight. KC doesn't veer and runs
  into him. **UCHE HAS HIM** comes at the latest when KC reaches the gate, about 10–12 s in, even if you never chased.
  Radio: `I've got the gate.`
- **The van.** No body in the lanes. When you've lost sight of KC (the existing last-seen switch, chase.js:203), Uche calls
  where he is, for example `SGT. UCHE: He's in the back lane, heading for the back gate!` or `He's cut through the second
  gap!` It refreshes with each last-seen refresh (4 s), at priority 2 with a 3 s expiry. It reports where he *is*, never
  what to do, so it shows on both difficulties.
- **UCHE HAS HIM** on screen:
  - Uche lunges (6 m/s for at most 0.4 s), KC goes down (knockDown → the `down` clip), Uche kneels on him (scale.y 0.8 →
    the proxy `kneel` clip).
  - Toast `UCHE HAS HIM · Sgt. Uche took him down in the back lane · +2 Public Trust`; radio `Got him! Back lane, sir.`
  - If Kelechi is more than 6 m away, the camera cuts to the takedown for 1.4 s (`TPCAM.override`, art_pass_v8.js:6/53),
    then the dialogue opens.

**5. Pursuit Lines** ("Uche cuts corners in foot chases").
- Uche no longer holds his post. He runs at 3.6 m/s for the next node on KC's route, then straight at KC once within 4 m.
  He stays out of colliders, and KC veers from him when he's ahead.
- At the gate post he holds the gate; that is the point of the gate.
- v12's 900 ms radio line (v12_core.js:269) is rewritten to be true for the post:
  - corner: `Coming up the back lane — push him towards me!`
  - gate: `I'm holding the back gate — drive him down to me!`
  - van: `Cutting across from the van — push him towards me!`
- The capability's 5% KC slowdown (chase.js:165) stays.

### 1.8 After

- The `market_runner` dialogue is canon and unchanged: the same lines, choices, flags and effects. `moralChoices.market_runner`
  stays exactly `'caught'` or `'escaped'`, which six readers depend on (ekosodin.js:21, finale.js:87/101/118,
  v12_ops.js:38, v12_mem.js:26, v13_court.js:699-700, casework.js:94/101).
- KC is turned to face Kelechi before `onCaught`'s `rotation.y += π` (market.js:163), so after a cut-off or a cold grab he
  ends facing you. His arms come down when the dialogue ends.
- The "Not one bystander" side quest (art_pass_v8.js:3589-3590) polls as before. A cold grab or a cut-off with no bumps
  completes it.
- How you got him is stored once, as an outcome (`S.game.flags.m2_how`), for the log and future use. No canon text reads it
  in this build.

### 1.9 Feedback vs hint (the Senior Agent rule)

| Line | Kind | Senior | Recruit |
|---|---|---|---|
| Tunde's opening text, the road bark, the twitchy line, the habit fact, the route tip | facts and in-world reactions, earned by what you did | ✓ | ✓ |
| eye why-lines; HE SAW YOU; CAUGHT COLD / CUT HIM OFF / BOXED IN / UCHE HAS HIM; BYSTANDER DOWN "in the trader lane" | why something happened | ✓ | ✓ |
| Uche's callouts (where KC is) and post confirmations | reports | ✓ | ✓ |
| cut ribbon | navigation from knowledge you earned (Tunde's route, tier 3) | with the route | always |
| hint chips, once per save each (`showHint` ids): `tac_m2_post` "Post Sgt. Uche before you move — he's by the van." (after Tunde, if unposted, 20 s); `tac_m2_side` "Come at his counter from the side or from behind — he watches the road." (first time within 6 m in his cone); `tac_m2_cut` "Get in front of him where the red line turns." (the first cut ribbon); `tac_m2_bump` (above). The foundations' generic `tac_sight` hint also fires once. | hints: what to do next | ✗ | ✓ |

### 1.10 Phone vs desktop

- **Phone (390×844 portrait and 844×390 landscape).**
  - Nothing new is laid out by this file. It uses the dialogue box, toasts, the radio strip, the eye (foundations), the
    minimap and the existing crouch/sprint/action buttons.
  - The CROUCH toggle and SPRINT stay mutually exclusive (art_pass_v8.js:2387-2391), as today.
  - Haptics on CUT HIM OFF, CAUGHT COLD and UCHE HAS HIM: 40/30/80, as `tackle` (guidance.js:151).
- **Desktop.** Hold C to crouch (or toggle, per the foundations setting). The `#tac-stance` chip shows while crouched. E to
  talk, Shift to sprint.
- **Keyboard hints** inside hint chips use `<span class="kbd">`, hidden on touch (paper.css:120). Touch wording names the
  buttons ("tap CROUCH").
- **No new icons are drawn.** The head marker uses `icon('eye')` / `icon('alert')` (foundations). The minimap rings are SVG
  circles styled in tactics.css. No emoji or glyphs.

---

## 2 · Integration points

### 2.1 New files (the removable layer)

```
src/tactics/tac_market.js   KC's watcher + attention cycle, Tunde meeting, Uche (NPC, posts, mover, chase roles),
                            confrontation outcomes, CUT HIM OFF / boxed / Uche catch, the cut ribbon, rewards, telemetry
src/tactics/tactics.css     (shared with foundations) + 6 lines: minimap post ring and back-gate ring, colour-blind variants
```

Load order: after the foundations scripts and before the mansion file. Both are in the same `TACTICS_JS` list
(foundations §2.2):
`["tac_core.js","tac_geo.js","tac_interact.js","tac_lanes.js","tac_radio.js","tac_sight.js","tac_market.js","tac_mansion.js"]`.
So every market wrap is outer to the foundations' wraps.

The file is an IIFE with `'use strict'`. It exposes `TAC.m2` for tests: `cfg`, `run()` (this run's state), `kc()` (the
watcher handle), `uche()`, `post(id)`, `setPhase(name, secs)`, `cutPoint()`.

### 2.2 `build.py`

The only existing-file edit is the foundations' layer block (insert after build.py:97; script loop after build.py:168-176,
before `import hashlib` at :179). This file adds one name to that list. Removing `src/tactics/` and those lines removes the
market change completely.

### 2.3 Hooks (all `V12.wrap`, v12_core.js:23-27, or mutation from inside the layer; outermost)

| Target | Where (261a000) | How | Why |
|---|---|---|---|
| `buildSceneMarket()` | art_pass_v8.js:1987 (calls `buildSceneMarketLegacy`, market.js:14); inner wrap v12_core.js:399-419 | after the original: reset this run; register KC's watcher; build Uche (`buildNPCMesh` + `addVest`, as asaba.js:163-164); push his interactable; replace the KC interactable's `onInteract` with the outcome router, keeping the original as `origConfront`; push the minimap POIs; set `TAC.sight.zones`/`lights` | everything in M2 is built here. The legacy and dressed builders both pass through. |
| `sideSetup(mid)` | art_pass_v8.js:3659 (calls `mqAttach` at :3667) | after the original, for m2: wrap the phone interactable's `onInteract` *outside* the `m2_unlock` mini-game hook (art_pass_v8.js:4029, 4043-4057) to record exposure at the press | the press is the moment that matters; the mini-game and the document pause the world |
| `startDialogue(key)` | dialogue_system.js:14 (other wraps: v12_mem.js:78, v12_car.js:1333, casework) | for `market_intro`: compute the meeting exposure and rebuild `DIALOGUE.market_intro` from a pristine copy (insert the twitchy or the habit line). For `market_uche`: set the back-gate choice text. | dialogue variants without editing config/dialogue.js; the same in-place pattern as v12_mem.js:78-89 |
| `endDialogue()` | dialogue_system.js:128 (inner wraps v12_core.js:331, v12_vo.js:89) | after the original: `market_intro` → apply the meeting and choice consequences, log `enc m2_tunde`; `market_uche` → dispatch Uche, log `order`; `market_runner` → lower KC's arms | the script key is still `market_intro` after a choice's `next` (renderChoices only swaps `DLG.script`, dialogue_system.js:87-90), so the core hook at :139-142 still runs |
| `startChase(cfg)` | pressure.js:60; inner wraps v12_core.js:266, v12_pt.js:182, chase.js:156, foundations' KC path swap | for `cfg.runner === ENGINE._marketKC` in m2: in capture mode return `null` and keep the cfg (cold grab); otherwise set the opening (burst/head start), call the original, then set `ENGINE._stagger`, attach `c.tac`, and start Uche's chase role | the openings of §1.6. The capture works because market.js:149-180 sets the stagger, toasts, switches music and calls `startChase` synchronously as its last statement. |
| `updateChase(dt)` | pressure.js:119; inner wrap chase.js:184-189 | before the original (KC only): cut-off check, Uche veer/grab. After the original: if `CHASEFX.stats.rebuilds` moved this frame and the route is known, rewrite the ribbon with the cut route. | §1.7. Running before the original lets the cut-off pre-empt the 1.9 m tackle. |
| `chaseExtend(c)` | pressure.js:77-114 (called as a global from :138) | KC with Uche on the ground: the same lane walk, scored against the nearest officer (player or Uche), plus the boxed rule. A veer sets `c.ended` without the end pause. Otherwise call the original. | Uche avoidance. With no Uche on the ground the original runs untouched (wayfind_escape's 40 s lane run). |
| `updatePressure(dt)` | pressure.js:202 (foundations wrap runs `TAC.tick` after the base) | before the original: `TAC.m2.tick(dt)`, i.e. KC's phase and pose, the post-scan bolt timer, Uche's mover, POIs at 4 Hz, Recruit hint triggers, stats. Returns early with an overlay open or outside m2. | the harness stepper (`__wf.run`) and the live loop both drive it, so it is deterministic in tests |
| `toast(big, small)` | util.js:11; inner wrap v12_pt.js:151-159 | in capture mode, swallow `HE'S RUNNING`. Rewrite the small text for the soft and range openings and for a lane BYSTANDER DOWN. | v12_pt records toasts raised inside an interaction (`interact_result.toast`); the rewrite happens before it sees them, so the log tells the truth |
| `musicForScene(kind)` | audio.js:401 | ignore while in capture mode | a cold grab must not flick to the chase cue |
| `completeMission(id)` | mission_flow.js:206; inner wraps v12_pt.js:177, foundations `tac_mission` | for m2: log `m2_summary` once per run, then call the original | M2 ends silently through the van (market.js:206) |
| `V12.say` (property) | v12_core.js:35 | replace in place: if the text is exactly v12's Pursuit line (v12_core.js:269), rewrite it per post | v12 schedules that line with `setTimeout(…, 900)` inside its own wrap |
| `DIALOGUE.market_intro[1].choices[0/1]` | config/dialogue.js:39-42 | at layer load, add `effect.flag {m2_tunde:'quiet'|'loud'}` (util.js:43 assigns `eff.flag` into `S.game.flags` with no two-tap arming) and `next:'market_intro_quiet'|'_loud'` (new keys) | the choice was rep-only; now it buys the route |
| `V12.INTEL_TIERS[2].text`, the `pursuit` and `greyman` capability descriptions | v12_core.js:472-476, :143-145 | text only, at load: tier 3 → `You know their routes: in a chase, the red line shows where to get in front of a runner.`; Grey Man where → `The courier · KC at his stand · the finale tail` | the preparation text matches what it does |

### 2.4 Deliberately not edited

- **market.js, pressure.js and beta/chase.js** are untouched. Everything is a wrap or an interactable rewrite, as above.
- **The ribbon:** rather than a hook inside `rebuildLine` (chase.js:146-153, private to its IIFE), `tac_market.js` rewrites the
  two public ribbon buffers (`CHASEFX.line.halo/.core`), using a 12-line copy of `writeRibbon` (chase.js:134-145). It also
  sets `L.pts`, `L.n` and `L.mode='cut'`. It runs only on frames where the beta rebuilt (`FX.stats.rebuilds` changed), so the
  10 Hz rate and wayfind_chase's rebuild count (18–22 in 2 s) are unchanged.
  - **Fallback if reviewers prefer a hook over a copy:** one line at chase.js:150:
    `const pts = (WAY.routeHook && WAY.routeHook(c, ENGINE.player.position, T, tSeg)) || routePoints(c, ENGINE.player.position, T, tSeg);`
- **Optional one-line hook in the logger** (v12_pt.js:187). Add `how:(c && c.how) || null, by:(c && c.by) || null` to the
  `chase_end` payload. It's generic: M6 can set `c.how` too. `tac_market.js` sets `c.how` and `c.by` before calling
  `c.onCaught`. Without the hook, the same data is in `enc m2_kc`.

### 2.5 What this file uses from the foundations module, and the three extra hooks it needs

Used as specified in foundations §3.7:
- `TAC.sight.watch({…})`, with `id:'kc', enc:'m2_kc', mesh, he:'He', eyeH:1.5, fov:100, range:{lit:12, dark:6},
  facing, attention, hearing:0.6, surface:'on the street', crowdCover:true, crowd:()=>ENGINE._marketCrowd, active, glance,
  marker, hud, onLevel`.
- `w.state`, `w.reset`, `w.unwatch`.
- `TAC.sight.probe`, `TAC.sight.zones`, `TAC.sight.lights({ambient:'lit'})`, `TAC.sight.K`.
- `TAC.radio.say(speaker, text, {pri, key, ttl})`.
- `TAC.lanes.KC_PATH`, the rebuilt `MARKET_LANES`.
- the spent table (foundations §3.1).
- `tactics_lib.cjs` (`T.seed`, `T.deviceMarket`).

Mapping from the brief's names: `.suspicion` (0..1) ↔ `state.susp / 100`; `'curious'` ↔ `level 'notice'` (35); `'alerted'`
↔ `level 'alarm'` (100); `.cause` and `.lastSeen` ↔ `state.cause`, `state.why`, `state.place`.

**Extra hooks needed (small; requested from the foundations owner):**
1. **`w.reset(v, {cause, why})`**: an optional second argument. It sets the frozen why-line, and when `v` crosses notice or
   alarm it emits `seen` with that cause. Market causes: `'scan'`, `'fumble'`, `'tunde'`, `'tunde_glance'`. One `seen` shape
   for every "why" record.
2. **`state.glance`**: the current glance offset in radians. When `facing()` is supplied, the module must not write
   `mesh.rotation.y`. `tac_market.js` owns KC's rotation while he is watched (base + look-up sweep + glance), so the
   module's cone and the rig agree.
3. **Spent table entries** for `'Post Sgt. Uche'` (spent while `CHASE.active` or once `market_runner` is set) and
   `'Confront teen suspect'` (also spent while `TAC.m2.run().resolving`). If the table stays closed, `tac_market.js` sets
   these two priority functions itself.

If the foundations module is not there (a partial build), `tac_market.js` checks `TAC.sight` at build. If it is missing,
KC's watcher is disabled, every confront takes the "no watch history" row (today), and posting Uche, CUT HIM OFF and the
Tunde tip still work.

### 2.6 State read and written

**Read:**
- `S.game._marketTunde`, `_marketScanned`, `_opBumps`, `moralChoices.market_runner`, `flags.*` (below)
- `S.game.currentMission`, `intelScore` (via `V12.intelTier()`), `S.player.skills` (via `V12.has`), `V12.heat()`
- `ENGINE._marketKC`, `_marketCrowd`, `player`, `obstacles`, `interactables`, `keys`
- `CHASE.active` (`seg`, `path`, `speed`, `headStart`, `burstT`, `pause`, `ended`, `fx.los`, `fx.mode`, `bumps`)
- `CHASEFX.line`, `CHASEFX.stats.rebuilds`; `WAY.segBlocked`, `WAY.routePoints`
- `isRecruit()`, `SETTINGS.hints`, `SETTINGS.difficulty`

**Written, once per event, never per tick** (`progressSig` hashes the flags, guidance.js:17-23):

| Key | Values | When |
|---|---|---|
| `S.game.flags.m2_tunde` | `'quiet'` \| `'loud'` | the Tunde choice (via `effect.flag`) |
| `S.game.flags.m2_met` | `{seen:bool, habit:bool, tip:bool}` | the end of the Tunde conversation |
| `S.game.flags.m2_post` | `'corner'` \| `'back'` \| `'van'` | the Uche choice (via `effect.flag`) |
| `S.game.flags.m2_how` | `'cold'` \| `'tackle'` \| `'cutoff'` \| `'uche'` \| `'boxed'` \| `'escaped'` | resolution |

- **Reset rule:** at `buildSceneMarket`, if `!S.game._marketTunde` (a fresh run, including mission-select replays, which clear
  it at mission_select.js:31), delete those four keys. Otherwise keep them (a run restored after Tunde) and re-place Uche at
  his post at once.
- **The rest of this run's state** lives in the module (`R`): phases, timers, exposure at the press, watch seconds, stats,
  cut-ribbon state. It is rebuilt on every market build.
- **Rep effects:** `applyEffect({publicTrust:+2})` on a clean catch.
- **Pose fields on meshes:** KC `armL/armR/neck.rotation`, `rotation.y`, `userData._idle`; Uche position and scale.
- **Minimap:** `MINIMAP.pois` entries (Uche `#5dd07a` r 1.2; post ring `#0b6e4f` r 1.6; back gate `#6b6b63` r 1.4).

### 2.7 Save compatibility

- **Old saves load unchanged.** `loadGame` merges defaults (state_save.js:13-33); every new flag is read as `|| null`.
- **A save from mid-M2 on an older build:** if `_marketTunde` is true, KC's watcher is awake from the start, calm, with no
  history (the first confront gets today's opening if under 1 s). Uche is at the van. The route tip is unknown, since the old
  save has no `m2_tunde`.
- **A save past M2:** nothing reads the new flags. `kcIsFair` and the six `market_runner` readers see exactly the values
  they did.
- **Settings:** none added here; crouch mode is foundations'.

### 2.8 The v13 layer and the beta

- **v13** builds no M2 scene and wraps none of these hooks.
  - Its readers of `market_runner` and `choice` (v13_court.js:699-700) are untouched.
  - Its Tunde statement (`st_tunde`, v13_data.js:161-165) says Tunde is wrong about the Sienna colour, the Warri calls and
    KC being the boss. The route tip is consistent with that: he knows the boy's habits, not the network.
  - v13 bulletins share the radio queue. Uche's callouts are priority 2 and jump them (foundations §3.6). `v13_a_radio`
    records `I().radio[mid]` before `radioLine`, so it is unaffected.
- **Beta:**
  - wayfind's targets (`OBJ_TARGETS.m2`, wayfind.js:103) are unchanged, and Uche is `optional` (guidance.js:41 skips
    optional).
  - The chase ribbon and last-seen logic are reused; the cut rewrite happens only in "live" mode with the route known.
  - casework's `market_runner === 'escaped'` checks are untouched.
  - paper.css styles every UI piece this file uses.
- **v12:** the van gate (v12_core.js:399-419), the KC statement on detain/flip (v12_core.js:336-344) and Street Sources'
  sleeves all run as before.

---

## 3 · Data and constants (first pass)

### 3.1 KC's watcher (`TAC.m2.cfg.kc`)

| Constant | Value | Why |
|---|---|---|
| eye height | 1.5 | foundations (scale 0.9 rig, market.js:124) |
| fov / range | 100° / lit 12 m | plan (≈100°); foundations default |
| `active()` | m2, KC visible, Tunde told you (this run, or `_marketTunde` already true at build), no chase, not decided, not resolving | the step-out point is inside 12 m and 34° (foundations; §0), so he can't watch before Tunde |
| phone phase | 4.6, 5.4, 4.2, 5.0 s (cycled); attention 0.35 | head down; 0.35 is the foundations "phone down" value. Mean cycle 4.8 + 1.8 = 6.6 s ≈ TAIL's `lookEvery` 6.5 (pressure.js:212). |
| look-up | 1.8 s, attention 1; body sweep ±0.15 rad round his base facing (−π/2) | TAIL `lookFor` 1.8. The sweep is visible on the proxy, which turns the body, not the head (people_art_pass.js:434-436). |
| noticed | at level notice or alarm: attention 1, phone down, no phone phase until he is calm again | "he's watching you" |
| first look-up | 4.6 s after the Tunde conversation ends | time to move off before he looks up |
| Underworld Heat | heat 50→100 shortens phone phases ×1.0→×0.75 and lengthens look-ups +0→0.4 s | "high heat makes him warier" without attention over 1 (foundations leaves heat to each encounter) |
| pre-scan alarm | no bolt. After 4.0 s with `state.seen` false: `reset(50)` | recoverable; never a dead end |
| post-scan bolt | alarm with Kelechi within 6.0 m → bolt (route through `origConfront`) | 6 m ≈ he sees you cross the last open stretch to the counter (road edge x 4 is 4 m off) |
| scan bolt delay | 0.8 s of play after the document closes | a beat to read HE SAW YOU |
| "in his sight right now" (`exposedNow`) | `st.seen` ‖ (`st.inCone && st.inRange && st.los==='clear' && st.dist < 3`) | crowd cover (1.7 m) never hides you at his elbow |
| zones (why-line places) | `the open road` [−4, 4] × [−23.5, 23.5] (open); `his counter` [5.2, 9.2] × [2.2, 5.8]; `the stall fronts` [4, 9] × all; `the back lane` [11.2, 14.6] × all; `Tunde's spot` [−9, −4] × [−5, 1]; `the van` [−2, 3.5] × [9, 17] | foundations grammar: "crossing the open road", "by his counter" |
| lights | ambient `lit` | dusk with lamps (art_pass_v8.js:1994-1995) |

Story pace (×0.6) and Grey Man (×0.65) apply through the module's `rate()`. Hard is the same as standard.

### 3.2 Confront outcomes (`TAC.m2.cfg.open`)

| Outcome | Condition (first match wins) | cfg changes |
|---|---|---|
| legacy | `R.watchSecs < 1.0` | none (today) |
| seen | (`exposedNow` ‖ `level==='alarm'`) && gap ≤ 2.5 | none (today: stagger 0.5, burst [1.2, 1.5], head start 0.4) |
| range bolt | automatic bolt with gap > 2.5 | `burst:null, headStart:0`; `_stagger` 0 |
| soft | `level==='notice'` ‖ `susp ≥ 20` | `_stagger` 0 |
| cold | otherwise (calm, < 20, not exposed, ≥ 1 s watched) | no chase |

The 20% line keeps a player who has just been glimpsed out of a cold grab. Notice is 35, so 20–35 is "he half-saw
something".

### 3.3 Tunde meeting (`TAC.m2.cfg.tunde`)

| Constant | Value | Why |
|---|---|---|
| meeting radius | the test runs only if Kelechi is within 3.0 m of Tunde when the conversation opens | programmatic opens elsewhere (`_visual_lib.cjs:198` at the spawn) are not "meetings" |
| exposed | ≤ 15 m from KC, ≤ 50° off his base facing, Tunde's body (r 0.3) not on the line, no standing bystander within 1.7 m of Kelechi | the road-side ring is 13.4–14.6 m, the stall side 16.1–17.1 m (§0). 15 m splits them. The thin sign on his stand is deliberately ignored: a conversation with pointing is noticed past a 8 cm board, and the sign needs a real-render check (foundations §6). |
| bark radius | 4.0 m, once per run, exposed side only | you hear it before you can press TALK (range 2.5) |
| seen → KC start | `reset(45, {cause:'tunde', why:'He saw you talking to Tunde in the road'})` | over notice: readable, recoverable |
| loud → KC start | `reset(max(susp, 20), {cause:'tunde_glance', why:'Tunde looked straight at him'})` | a nudge, under notice |
| route tip | `flags.m2_tunde==='quiet'` (whether or not you were seen) | "what you choose" buys the route |
| habit fact | unseen meeting | "where you meet him" buys the habit |

### 3.4 Uche (`TAC.m2.cfg.uche`)

| Constant | Value | Why |
|---|---|---|
| mesh | `buildNPCMesh('#5a3818','#1a2a18','#1a2a18','#0a0a08',{hair:'crop',beard:true,longSleeve:true})` + `addVest(…,'#0b1a3a')` | as asaba.js:163-164. `addVest` → `PROXY.vest` dresses him as the `uche` rig (people_art_pass.js:406, 454). No new model. |
| start | (2.4, 10.6), facing the market (yaw −2.6) | 2.68 m from the step-out point, outside the 2.4 m talk range; free of the van box (§0) |
| interactable | `'Post Sgt. Uche'`, verb `talk`, range 2.4, `optional:true` | not a wayfind target |
| posts | corner (12.6, −7.5), facing +z · gate (12.1, −19.9), facing +z · van (2.4, 10.6) | the corner is lane node 9 on KC's route. The gate spot is 0.78 m from the dead end (12.6, −20.5) and 0.50 m from KC's last leg (foundations' KC_PATH). |
| routes | corner: (2.4,10.6)→(5.0,6.5)→(5.5,0)→(12.3,0)→(13.3,−2.0)→(13.3,−6.4)→(12.6,−7.5), 26.1 m · gate: … (12.6,−7.5)→(13.0,−12.5)→(13.4,−16.0)→(13.4,−18.4)→(12.1,−19.9), 39.0 m | 0 collider hits; ≥ 1.1 m from every standing trader (§9 geo) |
| speed | jog 3.0 m/s (`MOVE.jog`, people_art_pass.js:490); 3.6 with Pursuit Lines in a chase | the prototype V4 value |
| veer ring | KC on the authored path, after his opening, Uche within 4.5 m and ahead (cos > 0.5) | prototype "officer 4 m ahead" plus his body. **Corner post and moving Uche only.** |
| grab | KC within 1.9 m of Uche, head start over | the player's catch radius (market.js:156) |
| boxed | best lane score < −1 with an officer within 5 m | the scout's prototype rule |
| gate post | hidden: no veer | the visible gate made late chases worse (3/5); hidden gave 5/5 |
| callouts | van post: any distance. Others: KC within 14 m of Uche with a clear `TAC.sight.los`. On each last-seen refresh (chase.js:204), at most 4 per chase. Priority 2, ttl 3 s, key `uche_call`. | "Uche radios where KC went when you've lost sight" |
| takedown beat | Kelechi more than 6 m away: `TPCAM.override` from 4 m off KC at 2.4 m height for 1.4 s real time, then `onCaught`. Within 6 m: `onCaught` at once. Waits while any overlay is open. | "on screen". Real-time timer, so port playthrough drivers that stop stepping still see the dialogue. |
| no collision | Uche is not an obstacle, not crowd, and not in `ENGINE.npcs` | he can't be bumped or block a doorway |

### 3.5 CUT HIM OFF (`TAC.m2.cfg.cut`)

| Constant | Value | Why |
|---|---|---|
| radius | 3.5 m | more than the 1.9 m catch, so it fires before a run-through tackle |
| ahead | cos ≥ 0.766 (±40°) between his heading (to `path[seg+1]`) and Kelechi | frontal only |
| not fleeing | Kelechi's speed along his heading ≤ 1.0 m/s, measured over 0.2 s | running away in front of him isn't a block |
| opening guard | chase time ≥ 1.5 s, `burstT ≤ 0`, `headStart ≤ 0`, `pause ≤ 0` | keeps the authored opening (the scout's 1/10 lesson) and wayfind_catch's "> 1.2 s" assertion |
| reward | +2 Public Trust; `unlock('faster')` and, with no bumps, `unlock('not_one')` | "interception the game rewards". Same unlocks as a tackle. |

### 3.6 The cut ribbon (`TAC.m2.cfg.ribbon`)

| Constant | Value | Why |
|---|---|---|
| when | live mode (`c.fx.los`), route known: `flags.m2_tunde==='quiet'` ‖ `V12.intelTier() ≥ 3` ‖ `isRecruit()` | horizons of 1–2 legs gave 0 cuts in 15 runs (§0); 3 legs gave cuts in 5/5 runs |
| horizon | the next 3 nodes of `c.path` | the same |
| candidates | every 0.5 m along those legs, from KC outward; the first that passes wins | prototype run 3 |
| pass | `|X−P|/4.4 + 0.3 ≤ along(X)/c.speed`; `!WAY.segBlocked(P, X, 0.3)`; no standing trader within 0.8 m of P→X | 4.4 = wayfind_catch's pessimistic sprint |
| hold | keep a shown point while `tP ≤ tK`; drop it after 0.5 s failing | no flicker |
| ribbon | [P, X, nodes back along his path to his position, KC] | still ends on KC (wayfind_chase asserts it) |
| `CFG.ribbonCut` | `'earned'` (default) \| `'all'` \| `'off'` | the open question in §8 |

### 3.7 Rewards and copy (exact)

All toasts avoid the logger's refusal regex (v12_pt.js:150): no NOT YET/ALREADY/FIRST…

| Event | Toast big · small | Rep |
|---|---|---|
| cold grab | `CAUGHT COLD` · `He never saw you coming. Quiet arrest · +2 Public Trust` | +2 trust |
| cut-off | `CUT HIM OFF` · `You got in front of him. No tackle, nobody hurt · +2 Public Trust` | +2 |
| boxed | `BOXED IN` · `Nowhere left to run. He puts his hands up · +2 Public Trust` | +2 |
| Uche | `UCHE HAS HIM` · `Sgt. Uche took him down in the back lane · +2 Public Trust` | +2 |
| scan seen | `HE SAW YOU` · `He saw you lift his phone. He's running.` | — |
| soft | `HE'S RUNNING` · `He'd clocked you — no time to grab a tray. Sprint, and mind the traders.` | — |
| range bolt | `HE'S RUNNING` · `He made you from his counter. Sprint.` | — |
| lane bump | `BYSTANDER DOWN` · `You flattened a trader at full sprint in the trader lane. −3 Public Trust` (or `You clipped a trader in the trader lane. −1 Public Trust`) | as today |

The new dialogue keys are defined in the layer, with `textEn` where the speaker uses Pidgin:
- `market_intro_seen` (inserted)
- `market_intro_habit` (inserted)
- `market_intro_quiet`
- `market_intro_loud`
- `market_uche` (2 lines + 3 choices)

The exact words are in §1.2–1.3.

---

## 4 · Telemetry (V12.log only; v12_pt adds `dev` to every event)

| Event | When | Fields |
|---|---|---|
| `seen` *(foundations emits)* | KC crosses notice or alarm, or a `reset(v,{cause})` crosses one | foundations fields + market context passed through `onLevel`/`reset`: `cause` may be `'scan'`, `'fumble'`, `'tunde'` or `'tunde_glance'`; `phase:'phone'|'lookup'|'watching'`, `scanned:bool`, `post` |
| `evaded` *(foundations)* | KC's suspicion drains below 5 after a notice | foundations fields (`how:'cover'|'crowd'|'distance'|'cone'|…`) |
| `enc` `m2_tunde` | the end of the Tunde conversation | `{enc:'m2_tunde', side:'road'|'stall'|'far', seen, dist, ang, crowd, bark:bool (it played), choice:'quiet'|'loud'|null, tip, habit, kcStart (susp after)}` |
| `order` | Uche is posted (each choice) | `{who:'uche', order:'post', post:'corner'|'back'|'van', prev, withTip:bool, obj, t (play s since mission start)}` |
| `ally_done` | Uche arrives; and each Uche act in a chase | `{who:'uche', task:'arrive'|'veer'|'tackle'|'box'|'callout', post, secs (since order or chase start), lane? (callout), d? (tackle distance)}`. At most 1 arrive, 1 veer, 1 tackle/box and 4 callouts per run. |
| `enc` `m2_kc` | resolution: catch (any how) or escape | `{enc:'m2_kc', approach:'cold'|'soft'|'seen'|'bolt'|'legacy', susp, level, exposed, gap, scanSeen, side:'front'|'side'|'behind' (bearing at the press), outcome:'caught'|'escaped', how, secs (0 for cold), bumps, bumpsLane, trust (chase delta), cutsShown, cutReached:bool (within 1.5 m of a shown point), ribbon:'earned'|'all'|'off'|'none', prep:{tip, habit, post, posted, pursuit, tier, greyman, sources}, uche:{post, arrived, role:'tackle'|'box'|'veer'|'callout'|null}}` |
| `chase_end` *(existing, v12_pt.js:187)* | unchanged | + `how`, `by:'player'|'uche'` if the optional one-line hook is taken (§2.4) |
| `m2_summary` | `completeMission('m2')`, once per run (the van) | below |

**`m2_summary`:**
```
{ kc:'caught'|'escaped', how, approach, scanSeen, alarms (count), notices (count), suspPeak,
  eyeSecs (play s with the eye showing), crouchNearSecs (crouched within 8 m of KC), watchSecs,
  tunde:{ side, seen, choice, tip, habit },
  post, posted:bool, ucheArrived:bool, ucheRole,
  chase:{ secs, bumps, bumpsLane, trust, cutsShown, cutReached, cutoff:bool, ribbon },
  trust (whole-M2 Public Trust delta from beginMission), secs (M2 play time),
  caps:{ pursuit, greyman, sources, tier }, diff:{ casework:'recruit'|'senior', pace:SETTINGS.difficulty },
  hints:[ids shown], build:(window.NACECA_BUILD||{}).src }
```

Volume: a full M2 adds about 8–20 events (2 enc, 1–3 order, ≤ 7 ally_done, a few seen/evaded, 1 summary), well under
CAP 3000. Nothing logs per tick. Questions these answer:
- **"Why was I seen?"** `seen` cause, place and why-line, set against the survey's "felt unfair".
- **"Does the cut-off teach?"** `cutsShown` → `cutReached` → `how:'cutoff'`.
- **"Is Uche useful?"** `post` × `how` × `chase.secs`.
- **"Did preparation change anything?"** `prep` × `approach` × `how`.

---

## 5 · Harness scenarios

All use the foundations fixtures:
- `T.deviceMarket` for the dressed colliders and `ENGINE._dress`.
- `lib.frozenClock`, `lib.stepper` (`__wf.run`) at 60 Hz.

**Seeding rule (from §0):** seed `Math.random` *inside the same `h.ev`* that does the confront and runs the chase. Seeding
before `lib.start` (foundations `T.seed`) fixes the crowd's build; the second seed fixes the lane jitter
(`chaseExtend`, pressure.js:102). Each scenario asserts `h.errors.length === 0`.

### 5.1 New

| Scenario | Setup | Asserts |
|---|---|---|
| `tac_m2_watch` | deviceMarket; end `market_intro` through `startDialogue` + `endDialogue`; `TAC.m2.setPhase` forces phases | (a) the watcher is inactive before Tunde: no eye at the spawn for 10 s. (b) The first look-up comes 4.6 s after the conversation. (c) `probe('kc', 5.6, 4.0)` standing in the phone phase gains 9–14 /s and in the look-up 30–50 /s; `seen` logs `cause:'sight'` with a why-line matching `/by his counter/`. (d) Side (7.5, 2.1) and behind (9.2, 3.6), still or sneaking: zero sight gain in both phases; walking at 1.96 m gives noise under 7 /s; 0.9 m from him walking gives close. (e) Within 1.7 m of a trader at 6 m in the cone: no gain. (f) Sprinting 8 m behind: cause `noise`. (g) A pre-scan alarm doesn't start a chase; after 4.0 s unseen, susp ≤ 50. (h) Story ×0.6, Grey Man ×0.65, hard = standard. (i) Heat 100: phone phases ≤ 0.75× and the look-up is 2.2 s. (j) An overlay open for 5 s freezes the phase timer. |
| `tac_m2_tunde` | lib.start m2; Kelechi placed at ring points (−4, −2), (−6, 0), (−8, −2), (−6, −4); `startDialogue('market_intro')`; choices clicked with one tap (no `flag`, so no arming) | road side → line 2 is the twitchy line, `m2_met.seen` true, and after the end KC susp is 45 with `seen{cause:'tunde'}`. Stall side → the habit line, `seen` false, susp 0. Opened from the spawn (9.65 m off Tunde) → no meeting test, the canon 2 lines only. Choice 0 → `market_intro_quiet` line, `flags.m2_tunde==='quiet'`, a back-gate POI `#6b6b63` in `MINIMAP.pois`; `_marketTunde` true and o1_tunde done in every case. Choice 1 → the loud line, no POI, susp ≥ 20. The bark plays once on entering 4 m on the road side, never on the stall side. Rep effects of each choice equal today's (integrity +4 / trust +3; agency +2 / trust −4 / integrity −2). |
| `tac_m2_confront` | deviceMarket; Tunde done through the dialogue (so the watcher is awake); step 2 s | (a) **cold**: walk (scripted moves through `__wf.run`) from Tunde via the south (2, −6) → (7.4, −2.6) → (7.5, 2.1) sneaking. Scan through the phone (mini-game and document resolved as v13_port does). Step 1.2 s. KC `onInteract` → `!CHASE.active`, `#screen-dialogue.show` with `market_runner`, `flags.m2_how==='cold'`, trust +2 (plus the scan's own effects), KC arms ≤ −1.6, no `chase` and no `chase_end` logged, `enc m2_kc` approach `cold`. (b) **seen**: the harness spot (5.8, 4.6) with no watch history → stagger 0.5, `burst` [1.2, 1.5], head start 0.4, speed 4.3 (the wayfind_coldopen numbers). (c) **soft**: from behind, `reset(40)`, confront → `_stagger===0` and the toast small text matches `/no time to grab a tray/`; `interact_result.toast.small` is the rewritten one. (d) **scan seen**: scan at (5.6, 4.0) → after the document closes, `HE SAW YOU`; at +0.8 s `CHASE.active` with today's opening; `seen{cause:'scan'}`. (e) **range bolt**: unseen scan from behind, then walk to (4.5, 4.0) in the look-up until alarm → chase with `burst==null`, `headStart===0`, `_stagger===0`. (f) **fumble**: exposed press, mini-game cancelled → susp ≥ 60, no chase, the phone still scannable. (g) Pressing TALK on KC during the cold-grab dialogue or Uche's takedown beat starts nothing. |
| `tac_m2_uche` | lib.start and deviceMarket | Uche at (2.4, 10.6), not in range at the spawn (nearestInteractable is not Uche), absent from `WAY.resolve()` targets for o1–o3 (labels as wayfind_resolve.cjs:40-50). Talking opens `market_uche` with 3 choices, each ≥ 44 px under `--touch 1`. Choosing corner → `order{post:'corner'}`, Uche reaches (12.6, −7.5) within 9.5 s of stepping, never inside `blockedAt(·, ·, 0.25)` and never within 0.6 m of a standing trader, then `ally_done{task:'arrive'}`. Gate: within 14 s. The back-gate choice text contains "Tunde says" only with `m2_tunde==='quiet'`. Re-posting before the chase works; after `market_runner` is set the label is spent and a press toasts `SGT. UCHE`. Replay from mission select resets `m2_post`. |
| `tac_m2_chase` | deviceMarket; confront with today's opening; scripted pursuer | (a) **cut-off**: stand on the path at (7.6, −9) facing north → `how:'cutoff'`, no `knockDown` on KC (`userData._down` false), trust +2, the dialogue shows synchronously, `chase_end` once with outcome `caught`. (b) The same spot reached inside the first 1.5 s gives no cut-off. (c) Sprinting away ahead of him gives no cut-off. (d) **corner post**: Uche posted and arrived; a follower at 2.5 s → `ally_done{task:'veer'}` ≥ 1 and the chase ends in cutoff, boxed or uche. (e) **gate post, never chase**: `how:'uche'` by 13 s; `TPCAM.override` set, then cleared after ≥ 1.3 s; the dialogue appears after the beat (`h.step(1600)`). (f) **van post**: `WAY._forceLos=false` for 3.2 s → a radio line matching `/He's (in|cut)/` with KC's lane; at most 4 callouts. (g) **Pursuit Lines**: Uche moves during the chase; KC speed is 4.3 × 0.95, unchanged; the 900 ms line matches the post. (h) Ifeanyi in M6 untouched (wayfind_catch's 4.1 assertion and an M6 chase with no `c.tac`). |
| `tac_m2_ribbon` | deviceMarket; confront; set KC at (12.6, 4.0) heading south with `c.seg` on the leg to (12.6, −2.4), Kelechi at (5.8, 4.6), `WAY._forceLos=true` | Route known (`m2_tunde='quiet'`): after one rebuild `CHASEFX.line.mode==='cut'`, the last point is KC (< 0.6 m), a point lies on his path ahead, and no leg is `segBlocked` or within 0.8 m of a standing trader. Route unknown on Senior → mode `live`, points identical to `WAY.routePoints` (today). Recruit → `cut`. `WAY._forceLos=false` past 3 s → `lastseen`, never `cut`. The rebuild count in 2 s stays 18–22. |
| `tac_m2_matrix` *(the balance gate)* | deviceMarket, seeds 1–5 (seeded inside the run's `h.ev`); strategies: follow at 1.3 / 2.5 / 4 s, the middle-gap cut at 2.5 s, cut-ribbon follower at 2.5 s; posts none / corner / gate / van; Pursuit Lines on/off for the corner | For every cell compared with **today** (the layer's chase hooks bypassed with `TAC.m2.cfg.off=true`) on the same seeds: catch rate ≥ today; median catch time ≤ today + 0.5 s; mean bumps ≤ today + 0.2. Gate post with a never-chasing player: 5/5 by Uche within 14 s. Prints the table so a tuning pass can compare. |
| `tac_m2_log` | a full M2 played through the scripted helpers: Tunde quiet and unseen, post corner, cold grab, the van with the table pre-inked (board_van's helpers) | exactly one `enc m2_tunde`, one `enc m2_kc`, one `m2_summary` with every field of §4 present and typed. No `blocked` event raised by this layer's toasts. `order` and `ally_done` present. With the optional hook: `chase_end.how` on a chase run. Total new events ≤ 30. |
| `tac_m2_save` | inject an old-format save (no `m2_*` flags) with `_marketTunde` true and resume; a second save with M2 completed and `market_runner:'caught', choice:'detain'` | the first builds, KC's watcher is awake and calm, Uche is at the van, the first confront within 1 s gets today's opening. The second: `kcIsFair()` true, `V12.m3Intel().gate.known` true, no `m2_*` flag created. |

### 5.2 Regressions that must stay green, and why each is safe

- **`wayfind_catch`.** The pursuer follows from behind, so a cut-off fires only after 1.5 s (assert "> 1.2 s" holds), and
  the dialogue opens synchronously on a cut-off ("the caught scene plays").
- **`wayfind_coldopen`.** It confronts from (5.8, 4.6) without watch history, which is today's opening: stagger 0.5 and the
  same speeds.
- **`wayfind_escape`.** No Uche on the ground, so `chaseExtend` is the original. The pursuer is kept 6 m away (no cut-off at
  3.5). DOUBLING BACK still shows.
- **`wayfind_chase`.** In the default Senior run there's no route known, so the ribbon is today's. A cut ribbon would still
  end at KC, and the rebuild count is unchanged.
- **`wayfind_minimap`.** Tunde is not moved; the suspect dot stays; Uche's POI is a different colour.
- **`wayfind_resolve`, `wayfind_tracker`, `wayfind_arrow`, `wayfind_or`.** Targets are unchanged and Uche is optional. The
  eye shows only after the Tunde *dialogue* ends in this run, and these set `_marketTunde` directly.
- **`board_van` and all `board_*`.** The van is untouched. `m2_summary` tolerates a run with no Tunde state.
- **`pt_logger`.** It talks to the first interactable, which is Tunde, from his own position: 15.2 m, no meeting test.
  `blocked` stays at exactly 1: the layer raises no regex-matching toast outside interactions. A fake runner in
  `startChase` (no `_marketKC`) passes straight through.
- **`casework_*`.** casework_lagos starts at the hub after M2. The others don't play the market.
- **`v13_port_playthrough`** drives every interactable, including Uche:
  - `market_uche` is a dialogue its driver already answers.
  - The confront from (8.8, 4.8) with a frozen clock has no watch history, so it gets today's chase.
  - An Uche catch ends the stepped loop, and the real-time beat then opens the dialogue within 1.4 s. That is inside its
    stall budget.
- **`v13_port_flow`, `v13_a_radio`, every other `v13_*`.** Radio is prioritised and recorded upstream. There is no M2 scene
  change for flow.
- **`visual_touch` and `visual_desktop`.** The `market_intro` opened at the spawn gets no inserted line. The suspect pin is
  still `#e07d4a`.
- **The foundations scenarios.** `tac_lanes` (every chase still caught within 30 s from 4 sides × 0/4 s) and `tac_sight`.

---

## 6 · What only real rendering or a real device can verify

- **KC's look-up on the skinned rig.**
  - Does `phone` → `idle` plus a ±0.15 rad body sweep read as "he looked up" at 10–14 m on a phone?
  - Does the glance (35°) read as "he's looking at me"?
  - On the fallback rig the arm and neck move; on the proxy only the clip changes and the body turns (people_art_pass.js:425,
    434-436).
- **The side and back approaches.**
  - Is the 1 m gap between his stand and the stall at (10, 5) visibly walkable in the baked art?
  - Does the third-person camera (3.5 m behind) keep KC in view when you creep up behind him?
  - Does the scan's staged interaction look right from beside or behind the stand?
- **Tunde's road side vs stall side.**
  - Can players tell from the camera that the road side is "out in the road"?
  - Does the bark land before they press TALK?
  - Watch `enc m2_tunde.side` × the survey's "unfair" answers.
- **The eye and why-lines in sunlight at 390×844.** The eye hides the pause and settings pills while it shows
  (v12.css:11), so check pause reachability on desktop near KC.
- **Uche on a phone.**
  - Frame time with one more skinned rig jogging (gfx `low` keeps him; he isn't a wanderer).
  - Foot sliding at 3.0 and 3.6 m/s.
  - Whether the corner post reads as "a body in the lane" and the hidden gate post as hidden.
  - Whether the `kneel` on KC reads as a takedown.
- **The takedown camera cut** (`TPCAM.override`, 1.4 s): framing among the canopies, and whether it disorients on a phone.
- **CUT HIM OFF.**
  - Can a phone player tell "in front of him" from the chase camera?
  - Does the `handsup` clip land before the dialogue covers him?
- **The cut ribbon.** Does P → X → back along his route read as "meet him here", and not as "go there, then double back"?
  Does it clip baked props at the second-gap corner?
- **Radio density in the first 10 s**: Tunde's text, Street Sources, v13 bulletins. Is Uche's post prompt read or lost?
- **Touch.** Crouch toggle plus stick plus TALK while creeping, and the post choices in landscape (390 px tall: the dialogue
  box must not need scrolling with 3 choices).

---

## 7 · Risks, and the smallest version

### Risks

1. **The cold grab skips the chase.** Stealthy players never see the chase, interception or Uche's catch on that run.
   Accepted: two approaches, both fine. `enc m2_kc.approach` shares will show the split. If cold grabs dominate on the first
   play (under 1 in 5 is expected, since the counter's world label faces the road), tighten `susp < 20` to `< 10` or
   require crouch for the last 4 m.
2. **"Seen" must never be worse than today.** The router falls back to today's opening on any doubt: no watch history, or
   exposed at arm's length. The matrix gate (§5.1) is the guard; it compares with today on identical seeds.
3. **The Senior Agent rule and the ribbon.** The cut ribbon is shown only with earned route knowledge on Senior. If the
   product owner wants it for everyone, it is one constant (`ribbonCut:'all'`, §8). Prototype data says it then converts
   tackles into cut-offs (3–4/5) more than it shortens chases.
4. **Determinism of tests.** The randomness in lane choice and crowd positions made the same seed vary 8.3–13.0 s. The
   seeding rule in §5 is mandatory for the matrix.
5. **The confront capture depends on market.js's call order** (stagger, toast, music, then `startChase` last, :151-180). If
   someone edits that handler, the capture breaks. `tac_m2_confront` (a) and (b) catch it.
6. **Rotation fights.** `faceEachOther` sets `userData._faceT` on KC (art_pass_v8.js:2685), the module glances, and the
   chase rotates him. While he is watched, `tac_market.js` owns `rotation.y` and clears `_faceT`. While a chase runs, the
   chase owns it.
7. **Dependency on foundations.** The three extra hooks (§2.5). If `TAC.sight` is absent, the market degrades to today's
   confront, with Uche, CUT HIM OFF and Tunde's tip still working.
8. **M6 shares `pressure.js`.** Every chase hook gates on `S.game.currentMission==='m2' && c.runner===ENGINE._marketKC`.
   `ENGINE._marketKC` survives scene switches, so the mission check is required, not just the runner check.
9. **Radio clutter.** Four possible lines in the first 10 s. Uche's post prompt waits until the Tunde conversation ends; the
   bark is keyed and expires in 4 s.
10. **Copy.** "Second gap" and "back-lane corner" are new names the player has to map onto the minimap. The post ring and
    the back-gate ring are drawn as soon as they're named, and Uche's first line describes the lane.

### The smallest version that still delivers the player-visible change

1. **KC looks up.** The phone/look-up cycle on `TAC.sight` (or, if foundations slips, a 30-line local cone built on
   `updateTail`'s math, v12_core.js:241-251), the eye with why-lines, and the five-row confront router of §1.6, including
   CAUGHT COLD. **Drop:** the scan exposure and auto-bolt, Heat tuning, the zones (generic "N m away" places).
2. **CUT HIM OFF** (§3.5) with the +2 Public Trust and the toast. **Drop:** the cut ribbon and the lane bump suffix.
3. **Uche posted at the corner or the back gate** through the `market_uche` dialogue: veer and grab at the corner, hidden
   grab at the gate, the toast plus `kneel` with no camera cut. **Drop:** the van callouts, Pursuit Lines movement and the
   radio rewrite.
4. **Tunde's choice buys the route:** the quiet line, the back-gate POI, and the "Tunde says" label on Uche's gate choice.
   **Drop:** the road-side/stall-side meeting test, the bark and the habit line.
5. **Telemetry:** `enc m2_kc`, `order`, `ally_done{arrive, tackle}`, `m2_summary` (the foundations' `seen`/`evaded` come
   free).
6. **Scenarios:** `tac_m2_confront` (a, b), `tac_m2_chase` (a, b, d, e), `tac_m2_matrix` (follow and cut × none/corner/
   gate), plus the §5.2 regressions.

That is about 450 lines in `tac_market.js`, the 4 dialogue keys, no new UI and no extra existing-file edits.

---

## 8 · Open questions for the product owner

1. **The cut ribbon on Senior Agent without preparation.** The plan says "the route ribbon shows the cut, not the tail". The
   binding rule says Senior gets no answer-giving hints. I split it:
   - **Perception** (his current heading) on everyone. This never produced a cut in the prototypes.
   - **The full cut** with earned route knowledge (Tunde's tip, intel tier 3) or on Recruit.

   Confirm, or switch `ribbonCut` to `'all'`.
2. **The cold grab ends M2's chase entirely.** Confirm that "cold grab" means no chase. The alternative is the scout's "the
   chase starts at his elbow", which is a near-certain 1 s catch.
3. **+2 Public Trust per clean catch** (cold, cut-off, boxed, Uche). Confirm the size. A bump costs −1/−3 and the m2_clean
   side quest is +2.
4. **Tunde's opening text and the road bark on Senior.** They are in-world facts ("he can see anybody standing out in that
   road"). Confirm they count as feedback.
5. **Achievements on Uche's catch.** As written, "Faster Than Computer Village" and "Not One Bystander" unlock only on
   Kelechi's own catch (tackle or cut-off); the side quest counts any catch.

---

## 9 · Scratch work (outside the repo; under `scratchpad/tactics/design/`)

- `proto/m2_cut_proto.cjs`, run 1: today vs CUT HIM OFF vs Uche at the corner or gate (visible), with follow, cut and ribbon
  strategies.
- `proto/m2_cut_proto2.cjs`, run 2: the hidden back post (`CUb2`), cut-ribbon horizons 1 and 3, a 1.3 s reaction.
- `proto/m2_cut_proto3.cjs`, run 3: the cut ribbon with 0.8 m trader clearance, horizons 2 and 3, all posts.
- `proto/m2_merge_proto.cjs`, run 4: the "merge" ribbon (rejected), seeded inside the run's evaluate.
- `geo/kc_geo.cjs`: KC's cones at the counter spots, the step-out point, the Tunde ring, suspicion along the walks.
- `geo/uche_back.cjs`, `geo/uche_routes.cjs`: post spots, Uche's routes against every collider and trader, the cut lines.
- Reused, read-only: the scout's `tactics/m2/m2_lib.cjs` and `market_meta.json`; the foundations' `design/foundations.md`.

All four harness runs were against the committed `naceca.html` with no repo change. The other prototype files in
`design/proto/` (`probe*.cjs`, `tac_proto_page.js`, `proto_layer.js`) belong to the foundations designer and were only
read.
