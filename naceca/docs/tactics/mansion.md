# Phase 2 · the Lekki mansion (M3): plan items 11–17

Design spec. Written against `claude/naceca-bundle-integration-133395 @ 261a000`; every file:line below was re-checked against
that commit. Nothing under the repo was modified. Numbers marked **harness** come from 4 runs against the committed
`naceca.html` with a scratch prototype of this layer injected after load (§8). Numbers marked **offline** come from a
geometry model of the art-pass room (the 39 colliders at art_pass_v8.js:1833-1846, with the heights measured in
foundations.md §3.2) and the shared suspicion formula (foundations.md §3.5).

## 0 · Summary

The raid gets a real house. Your entry sets where you start and when Obi reacts:
- **Knock:** at the door, and he thumbs the wipe 1 s later.
- **Loud:** at the door, with the wipe running and Obi dazed for 2.5 s.
- **Quiet, front door:** the porch, and nothing starts until he notices you.
- **Quiet, KC's side gate:** the back corridor, behind his shoulder, with Uche holding the kitchen door.

On a quiet entry, Obi sits at his desk on a call, facing the living room. A NOTICED meter over his head fills when he can see
or hear you. If you reach him before it fills, he never triggers the wipe and the laptop comes out with all 7 files. Once he
is alarmed he reaches for his phone (1.5 s) and runs for the kitchen door, 10.4 m away (3.5 s). You can stop him by walking
into his path, Uche can cover or tackle him, or he gets out and the perimeter team brings him round to the drive in cuffs.
Canon holds: he is arrested at Lekki every time, and the cost is force on the record and fewer choices in the arrest.

Uche follows you in and takes one job at a time from a contextual **UCHE** button: COVER HIM, TAKE HER OUT or GO ROUND THE
BACK. Telling the child to stay put leaves her inside: extraction waits until someone walks her out. The laptop's surviving
files depend on how far the wipe got. They show on its screen, in its v13 exhibit record and in the aftermath, and they
decide what Week 1's "Decrypt the Lekki drives" lead returns.

Everything is one removable file, `src/tactics/tac_m3.js`, plus a section of the foundations stylesheet. It sits on the
Phase 0 `TAC` layer (foundations.md) and edits no existing source file except the `build.py` list.

### Where this spec departs from the brief (each one measured; each needs a nod from the product owner)

| Brief says | What the house allows | What this spec does |
|---|---|---|
| "sofa, armchairs and cash table hide you if you crouch" | **Offline**, eye 1.6 m, crouched target 0.8 m: from the desk, 23 of 596 cells in Obi's cone are hidden when crouched, **all of them behind the armchair**. The cash table's top is 0.57 m, lower than a crouched man. The sofa stands against the west wall facing him, so there is no "behind" to hide in. There is one armchair. The sofa and armchairs are baked into the single `Room` mesh, so they cannot be moved. Foundations found the same (foundations.md §0). | Cover is what the room really offers: the door leaves and front wall (tall), the armchair (crouch), the corridor walls and bookshelf (tall), the **east flank** (85–95° off his facing, so out of his cone), and crouching in the open, which builds his suspicion at 40% of the standing rate. The plan and the why-line never claim the sofa or cash table hide you. When one fails, the why-line says so: "He saw you over the cash table, crouched". |
| "a NOTICED meter … at 100% a toast" (with the shared tuning) | **Offline**, shared constants (attention 0.6, no multiplier): nothing in this room ever reaches 100%, because every exposure lasts 2–5 s. Walking straight at him peaks at 48. | Obi gets a per-watcher **gain ×1.6** ("a man with ₦12.4M on his coffee table"). Walking upright at him now alarms in 3.3–3.5 s (**harness** 3.33 s). Crouching at him reaches notice only (**harness** 40). The east flank stays at 0 (**harness** 0). This needs one option from tac_sight.js (§2.8). |
| "a leaked warrant means Obi starts alerted" | No leak exists at HEAD. The v13 integration removed its leak timers on purpose: "an investigative choice never shortens the Lekki wipe" (v13_boot.js:94). | "Leaked" is defined narrowly: the board **refused** the Lagos warrant and you went in **exigent** anyway. Obi then waits facing the front door, and his alarm comes at 60 instead of 100. The wipe is not shortened. The side gate still beats it, because the corridor is 90° off a man watching the door (**harness**: flank alarmed at 3.97 s; offline, gate route 0). The plan shows it as a row: **WORD IS OUT**. This is flagged for the PO and the v13 owners (§7). |
| Rear post "offered to everyone" (SCOPE) | 'Rear wall' is gated on Squad Trust (v12_plan.js:105). Changing what a bought capability does is a save-facing change. | Squad Trust keeps its meaning: Uche *starts* at the kitchen door. Everyone gets the in-raid order **GO ROUND THE BACK** (he walks round the outside, about 9 s). |
| Knock "as today" | Today's spawn is the porch (0, 8.6). **Offline**: from there a sprinting player reacting in 1.5 s misses the intercept by 0.11 s. | Knock and loud start in the doorway (0.35, 5.0). Uche stands beside you at (−0.35, 4.7), where he can see Obi. |

---

## 1 · What the player experiences

### 1.0 · Which house

Players get the **art-pass** builder, `buildSceneMansion` (art_pass_v8.js:1642), whenever the inline art loads (`ART.ready`).
The legacy `buildSceneMansionLegacy` (scenes/mansion.js:7) runs only if the art fails. The harness also forces it by default
(`ART.failed = true` in `h.start`, run.cjs:66). This spec is designed for the art-pass house. The legacy house gets only the
false-outcome fixes and the laptop files (§2.9).

### 1.1 · The plan screen (Uche's "Plan the raid", after the casework raid gate)

The screen is the same paper sheet; only its words change, so it stops promising things the house doesn't do. Verified with
the prototype's re-decorator (**harness** P):
- **The quiet button** reads **"Quiet, front door"** without KC's tip, and "Side gate, quiet" with it. Today it reads "Pick
  the side door", but you never enter by a side door.
- **The wipe line** says when the clock starts:
  - knock: *"Wipe clock about 55 s from the knock · you'll have to find the laptop"*
  - loud: *"…about 40 s from the bang"*
  - quiet: *"…about 65 s once he knows you are inside. None if you reach him first"*
- **The power-cut line** becomes *"Dark house: he sees half as far, and his remote trigger lands about 12 s late."* The
  promise "the child wakes frightened" is dropped, because nothing in the house does that.
- **The rear line** (Squad Trust) becomes *"Uche waits inside the kitchen door. If Obi runs for it, he runs into Uche."*
- **A WORD IS OUT row** is added under WHAT YOU KNOW only when the warrant was refused and you chose exigent entry: *"The
  magistrate refused your warrant, and court clerks talk. Expect him awake."*
- **The sketch:** with the SIM theory (`t_sims`), it adds a small facing tick on the study dot and hatches the east side
  "BLIND SIDE". That intel was earned, so it shows on every difficulty.

GO applies exactly the same reputation as today. **Harness** P: with a signed warrant and knock, GO moves Agency by 0 (knock −2,
signed-plan credit +2). That is the number v13_port_flow step 4 asserts.

### 1.2 · The breach (the end of Uche's pre-breach lines)

The dialogue ends, then a 1.4 s title card (the existing `titleCard`, onboarding.js:45), then you're at your entry. The
house's clock starts when the card closes, never under it.

**Knock and announce.** Card: `KNOCK AND ANNOUNCE · 21:32`.
- You stand in the doorway at (0.35, 5.0), facing in, with Uche beside you. The radio strip reads *"SGT. UCHE: NACECA!
  Search warrant: open the door!"* (with an exigent entry: *"NACECA! Open up!"*).
- Inside, Obi looks up from his call.
- After 1.0 s his thumb lands: the LAPTOP WIPE meter appears (55 s), and the laptop screen turns red.
- After 1.5 s he runs (§1.4).

**Loud breach.** Card: `LOUD BREACH · 21:32`.
- The camera shakes once. You're in the doorway at (0.35, 4.6).
- The wipe meter is already running (40 s): the bang made him hit it.
- Obi cowers at his desk for **2.5 s** (crouch clip), then runs. Sprint at him and you take him at the desk (**offline**
  1.8 s to arrest range). Jog and you catch him on the way (**offline** +1.5 s margin).
- The force (+1) stays on the record as today, so "By the book" fails. The plan already says "force on the record".

**Quiet, front door.** Card: `THE FRONT DOOR · 21:31`.
- You're on the porch at (0.4, 4.9), outside the door leaf, out of his view (**offline**: 59°, behind the wall).
- Uche holds the porch at (0.9, 5.5). The radio reads *"SGT. UCHE: I'll hold the door, sir. Call me."*
- No wipe meter. The laptop screen shows its lock screen.
- Through the door you can see Obi at the desk across the room, on a phone call (talk clip), facing the living room.
- The objective "Stop laptop wipe" reads **"Seize the laptop"** until a wipe actually starts.

**Quiet, KC's side gate** (KC caught and not forced in M2, `kcIsFair()`, ekosodin.js:21). Card: `THE SIDE GATE · 21:34`.
- You're in the back corridor at (0, −7.6), facing into the house, and Uche is behind you at the kitchen door (−0.35, −8.1).
- The corridor walls hide you completely (**offline**: 58°, behind the wall). Obi's desk is 7.8 m ahead and to the right,
  and he faces the other way.
- The wipe meter is absent, as on the quiet front.

**Power cut** (any entry). The card adds a second line, `THE GENERATOR GOES QUIET`.
- The room dims: the baked light map drops to 35% and the lamps go out. The laptop screen stays lit on its battery, and the
  strobes outside are unaffected.
- Obi sees 4.5 m instead of 9 m.
- When his thumb lands, the meter appears as `LAPTOP WIPE · NO SIGNAL` at 0% for **12 s**, because the trigger has to go
  out over the phone network. Then the wipe starts.
- Reaching the laptop inside those 12 s saves everything: **harness** H2, 7 of 7 files, no field skill shown.
- Radio: *"SGT. UCHE: No power, no Wi-Fi. His trigger's going out over the network. We've got seconds."*

**Word is out** (refused warrant, exigent entry).
- Obi stands at the desk facing the front door, phone in hand.
- On the quiet front, the doorway and the flank are now in his view. **Harness** L: crouched along the flank, alarm at
  3.97 s.
- Through the side gate you are still behind him.
- On knock or loud nothing changes, because he was going to know anyway.

### 1.3 · Quiet entry: cover, the NOTICED meter, the toast

**What you see on screen** (phone and desktop alike):
- **Over Obi's head:** a small paper tag, `NOTICED` in 11 px ink capitals over a 56 × 6 px bar with an ink outline and a red
  fill. It appears as soon as his suspicion is above 0 and Obi is on screen. Off screen, the shared eye at the top centre
  shows the same fill (foundations.md §1g).
- **At 35% (notice):** the tag reads **`WHO'S THERE?`**. He stops talking, looks up, and turns up to 35° toward where he
  last saw you. From now on he is fully attentive.
- **The why-line** under the top eye names the cause live: *"He can see you, 4 m away, standing"*, *"He heard you running on
  the tiles"*, *"He can see you over the cash table, crouched"*. This is foundations' grammar with the mansion's place names
  (§3.11).
- **Draining:** break his view (crouch behind the armchair, step back through the doorway, get round to the east wall) and
  the bar drains at 8%/s. **Harness** N: noticed at 5.5 m, then crouch back behind the door leaf, and it is back to 0 in
  8 s, with a `seen{level:'calm', cover:'the door'}` record.
- **At 100% (alarm):** a toast names the cause in the past tense, for example **`HE SAW YOU`** · *"He saw you 2 m away,
  walking upright"*, **`HE HEARD YOU`** · *"…running on the tiles"*, or **`HE SAW YOU`** · *"…reach for his laptop"*. Then
  §1.4 begins.

**What works** (all measured; §3.3):
- **Through the doorway, then right along the front wall, then down the east wall:** never noticed at a sneak or walk
  (**harness**: 0; jog 16). It ends 2.5 m from him, within arrest range (2.7 m).
- **Crouched straight at him across the room:** notice (**harness**: 40) but no alarm. You can grab him while he squints.
- **From the side-gate corridor, along the back wall:** never alarmed crouched (**harness**: 22).
- **Behind the armchair:** the only crouch-only hiding place in his cone (back left of the room). It is the stepping stone
  from the corridor mouth to the child.
- **The power cut:** the living room is out of his 4.5 m sight. Walking straight at him peaks at 30 (**offline**).

**What fails:**
- Walking upright toward the desk alarms in 3.3–3.5 s (**harness** D, at 2.3 m).
- Standing still near the child for 4 s alarms (**offline**).
- Pressing *Inspect laptop* in front of him alarms him at once.

**Catching him cold.** Press ACTION on Obi (`Move on suspect`, 2.7 m) before 100%.
- *"GOT HIM. Hands where I can see them."* He raises his hands, there is no wipe, and the arrest dialogue opens with the
  informant deal available (§1.4).
- **Harness** C: with the crouched flank, the laptop is then seized with no field skill, "LAPTOP SEIZED: The wipe never
  started. All 7 files intact." That run also completed "Pull the plug early" and "By the book".

**Senior Agent** sees only the meter, the why-line and the toast, which are feedback. **Recruit** also gets three one-off
hint chips (`showHint`, once per save):
- at the quiet breach: *"He's facing the living room. The wall on your right is outside his view."*
- at the first notice: *"Crouch, or get something tall between you."*
- at the first alarm: *"He'll run for the back. Get between him and the corridor."*

### 1.4 · Obi runs for the back door: intercept him

**Who runs, and when:**
- **Knock:** at 1.5 s.
- **Loud:** when the stun ends at 2.5 s.
- **Quiet:** 1.5 s after the alarm, which is the phone in his hand. On a leak, 0.3 s.
- **Not if** he is already stopped, or if you or Uche are standing in the corridor or its mouth. In that case he puts his
  hands up where he stands ("cornered").

**What you see:**
- The radio strip, with tactical priority (foundations §3.6): *"SGT. UCHE: He's running: the back corridor!"*
- The tracker reads **`Stop Obi · 6 m`**, and the arrow points at him. This is the same treatment the KC chase already gets
  on every difficulty ("Catch KC").
- A meter, `OBI · RUNNING`, fills with his progress to the kitchen door (10.4 m).
- He jogs a fixed route: the desk, behind the bookshelf, along the sideboard, past the armchair and down the corridor
  (§3.4).

**How to stop him** (each counts as "stopped in the house"):
- Be within **1.4 m** of him and he runs into you: an automatic stop, the same in spirit as the market's catch.
- Press ACTION within **2.2 m** while he runs: the label reads `Stop him`.
- During the 1.5 s phone reach after a quiet alarm, press ACTION within **2.7 m**, or walk into him. You beat his thumb
  and **no wipe starts**.
- **Uche** covers him (§1.5) or tackles him at the kitchen door.

**Measured:**
- **Knock, sprinting for the corridor mouth after 0.6 s:** stopped at 3.1 s, 1.8 m short of the corridor (**harness** A).
- **Knock, reaction 1.5 s:** sprint still makes it, with a +1.1 s margin. Jogging doesn't (−0.6 s) (**offline**).
- **Side gate, walking upright into the room:** he runs into Uche and is tackled at (0, −7.0), 4.6 s after the alarm, with
  0 force (**harness** E2).

**Stopped in the house** means a cold grab, a stun grab, beating the thumb, an intercept, a cover, a tackle or being cornered.
- *"GOT HIM. Hands where I can see them."* He puts his hands up; for a tackle, he goes down and Uche kneels.
- Nothing goes on the force record (except the loud entry's own +1).
- The arrest dialogue opens with **four** choices. *"Offer informant deal. Names of the politicians."* is there **without
  the Crisis Negotiator capability**, because he was caught in the act and he's rattled. **Harness** A, C, E2, F, K: four
  choices each.

**He gets out:**
- At the corridor end he disappears through the kitchen door. Radio: *"SGT. UCHE: He's out the kitchen door. Perimeter,
  he's yours!"*
- 6 s later: *"SGT. UCHE: Perimeter has him, in the yard. They're bringing him round the front."*
- Obi reappears kneeling on the drive at (0.9, 9.6), 3.8 m from the extraction point.
- The cost:
  - **force +1** (the perimeter took him down);
  - the arrest dialogue offers only *"Read him his rights"* and *"Down on the ground"*: no bribe with the perimeter team
    watching, and no deal from a man who has asked for his lawyer;
  - "By the book" fails through the force rule;
  - the morning headline is **"Lekki Chief Bolts Out the Back, Held in His Own Yard"**.
- **Harness** B, standing still after a knock: out at 4.98 s, on the drive at +6.0 s, force +1, two choices, that headline,
  grade B.

**The laptop field skill does not freeze him.** If you open "KILL THE WIPE" while he is running, his run keeps advancing
inside the field skill's per-tick hook, just as the wipe does today. The field skill's subtitle gains *"He's still running
while you work."*

### 1.5 · Uche on the ground

**Where he is:**
- **With you (default):** on knock or loud he follows 1.8–2.5 m behind you. He sneaks when you crouch. He has no collision
  with you.
- **On the quiet front:** he holds the porch until Obi is alarmed or stopped, then follows. This is so he never wanders
  through Obi's view while you're sneaking.
- **Side gate, or the Squad Trust rear post:** he stands inside the kitchen door, (−0.35, −8.1).

**The UCHE button.**
- **Touch:** a third small button in the existing `ctx-row` (art_pass_v8.js:2361), next to SCAN and CROUCH, with
  `icon('people')` and the label **UCHE**. It shows only when he has a job to offer, or when he is busy (then it is disabled
  and reads `UCHE · COVERING`).
  - With exactly one job, the button reads the job (**`UCHE · COVER HIM`**) and one tap gives it.
  - With two or three, one tap opens a stack of order cards: 48 px tall, at least 168 px wide, manila with a 2 px ink border
    and an `icon()` on the left. Portrait stacks them above the action cluster. Landscape (844×390) lays them in a row to the
    left of it.
  - The stack closes on a choice, after 4 s, or on any other control.
- **Desktop:** the same component, as a chip at bottom left beside the crouch chip: `Q · UCHE`. **Q** gives the only job,
  or opens the cards; **1/2/3** pick from them. The key hints are hidden on touch.

**The jobs.** Uche takes one at a time; a new order replaces the old.

| Order | Offered when | What you see |
|---|---|---|
| **COVER HIM** (`icon('shield')`) | Obi is startled, stunned, reaching or running, **and** Uche can see him within 8 m | Uche plants and aims (aim clip): *"NACECA! On your knees!"* Obi stops and raises his hands (covered). It does not undo a wipe already triggered: **harness** K, a knock covered at 0.4 s, the wipe armed at 1.0 s, no run, four arrest choices. Uche stays on him until you make the arrest. |
| **TAKE HER OUT** (`icon('people')`) | The child is still inside, Obi is not running, and **either** civilians were known (Street Sources or KC) **or** you have already spoken to her. On the quiet front, not while Obi is unaware (*"Not while he's watching the room"*). | Uche jogs to her, takes her hand and walks her out along the existing child path (art_pass_v8.js:1747) at her pace (1.05 m/s). She counts as rescued when she crosses the porch. Uche carried her out gently, so `child_gentle` is set. **Harness** G: child out, +1 rescued, gentle. |
| **GO ROUND THE BACK** (`icon('lock')`) | Obi is not yet running, and Uche is not already at the back | *"Going round, sir."* He leaves by the front door, shows as an "outside" blip on the minimap, and appears inside the kitchen door after **9 s**. If Obi runs into him there, he tackles him in front of you. |

### 1.6 · The child

- **Civilians known** (Street Sources: *"…a child upstairs earlier…"*; or KC): she's expecting someone. Her first line is
  quiet: *"Shh… I dey hide. You be police?"* (textEn: *"Shh… I'm hiding. Are you police?"*). Uche can be sent for her
  without you talking to her first.
- **Unknown:** today's frightened line, and you must speak to her before Uche can take her.
- **"Take her hand gently"** works as today (+1 rescued at the choice, `child_gentle`). She walks out (6.0 s, **harness**
  B), and "Secure the child" completes **when she reaches the porch**.
- **"Tell her to stay put. Get back to the laptop."** keeps its cost (Integrity −4, Public Trust −6). She **stays**.
  - Her label becomes **`Walk her out`**: one press, one line from Kelechi (*"Come. Hold my hand. We go outside now."*), no
    choices, and she walks out. Or send Uche.
  - "Secure the child" stays open. The tracker keeps it as the current objective, and nothing is rescued until she is out.
  - Extraction refuses: **`OPERATION OPEN` · *"The girl is still inside. Walk her out first"***.
  - **Harness** F: stay put → o5 not done, label `Walk her out`, extraction refused with that text → walked out in 5.98 s →
    o5 done, +1 rescued, not gentle → extraction completes.
- **Knowing about civilians no longer adds a rescue at extraction** (the v12 payoff at v12_plan.js:192 is replaced).

### 1.7 · The laptop and its files

- **Wipe never started** (caught cold, beat the thumb, a covered quiet Obi, or inside the 12 s power-cut delay): *Inspect
  laptop* plays the same staged reach. The screen shows **`SEIZED · ALL FILES`** and the toast reads **`LAPTOP SEIZED` ·
  "The wipe never started. All 7 files intact."** (+12 intel). There is no field skill: today's "KILL THE WIPE" opens only
  while a wipe is actually running.
- **Wipe running:** as today: the field skill, the staged pull, `WIPE HALTED`.
- **The files.** The halted screen lists Obi's 7 files in the order the wipe shreds them, survivors in white and shredded
  ones struck through (an in-world canvas, art_pass_v8.js:1914, not HUD chrome).
  - **Survive by percentage:** a file is lost once the wipe passes its mark (§3.9). The ledger survives below 40%, which
    matches the screen's existing "Most of the ledger survived" line.
  - **Exhibit:** the v13 record (Case Desk › exhibit › Chain of custody) gains *"Imaged by forensics: 6 of 7 files
    recovered"* (**harness** B).
  - **Aftermath:** OPERATIONAL STATS gains a row, *"Laptop files recovered · 6 / 7"*.
- **Week 1, "Decrypt the Lekki drives"** (v13_data.js:214):
  - if the ledger survived, or the safe drives were bagged (the safe is the backup), or the save predates this layer: the
    result is today's text and +10 intel;
  - otherwise: *"The ledger was shredded before the power went. Forensics rebuilt N of Obi's files: … Nothing in them names
    a payment."* and +4 intel.
  - The lead's `needsAny` gate is unchanged, so a bad wipe never locks it out. **Harness** J: all three branches.

### 1.8 · Extraction and aftermath

- **Extraction needs** the arrest **and** the child outside. The refusal names what's missing (*"Arrest the principal
  first"* / *"The girl is still inside. Walk her out first"*).
- **The Squad Trust rear payoff** (an upstairs man into Uche, +1 arrest, +6 intel) is paid only if Uche was still at the
  kitchen door at extraction. The toast reads *"One of the upstairs men tried the kitchen door, straight into Uche."*
- **Leaving with the wipe still running** stays allowed: no new penalty, and the objective stays undone.
- **Headlines:** the perimeter headline (§1.4) replaces only non-scandal outcomes. The casework wrong-suspect headline, the
  bribe and the force ≥ 2 outcry all still win.

### 1.9 · Difficulty, accessibility, platforms

- **Detection** uses foundations' `rate()`: story ×0.6; standard and hard ×1; Grey Man ×0.65.
- **Obi's run** is `3.0 × min(1, chaseRate())` m/s, so never faster on hard. With `SETTINGS.timed === 'extended'` it is
  ×0.8.
- **`SETTINGS.timed === 'off'`** ("no timers"): he doesn't run. On alarm he panics and puts his hands up. The wipe already
  never advances (timerRate 0, settings.js:36).
- **Touch:** everything is ACTION, CROUCH, SPRINT and UCHE. Targets are at least 44 px (order cards 48 px). The NOTICED tag
  is not interactive.
- **Keyboard hints** (`Q`, `1/2/3`) are hidden on touch.

---

## 2 · Integration

### 2.1 · Files

```
src/tactics/tac_m3.js        new — the whole mansion layer (≈ 650 lines): breach, Obi, Uche, child, laptop files,
                             extraction, plan truth, power cut, telemetry, Recruit hints
src/tactics/tactics.css      foundations' stylesheet; this spec adds an "M3" section (NOTICED tag, UCHE button, order cards)
build.py                     TACTICS_JS (foundations.md §2.2) gains "tac_m3.js" after "tac_sight.js"
```
**Deleting it:** delete `tac_m3.js` and its CSS section, and the layer is gone. No other existing source file is edited. Two
optional one-line hooks are listed under *Not hooked, on purpose* (§2.2) in case reviewers prefer explicit hooks over the
two zero-edit techniques used here.

### 2.2 · Hooks (as of 261a000)

Wraps use `V12.wrap` (v12_core.js:23-27). The layer loads last, so each wrap is outermost unless stated.

| Target | Where | How | Why |
|---|---|---|---|
| `buildSceneMansion()` | art_pass_v8.js:1642 (inner wrap v12_plan.js:168) | wrap: call orig (v12 has relabelled Uche and wrapped Extract), then wrap these interactables' `onInteract`: `Inspect laptop` (:1711), `Calm and escort the child` (:1740), `Move on suspect` (:1753), `Extract` (:1818, outside v12's wrap). Also: reset `TAC.m3`, reset `S.game.moralChoices.rescued = 0` (§2.3), set Obi's priority function, replace Obi's npc `update` (the `_obiPanic` hands-up rule at :1696-1699), register the vision place names, and decide the variant (`ENGINE._mansion` ? 'v8' : 'legacy'). | Every on-site behaviour. These wraps are installed **before** `mqAttach` (art_pass_v8.js:3667, called from `sideSetup` after the build), so the field-skill hooks wrap ours. **Harness** C/H2 confirm the order. |
| `window.startMansionWipe` | v12_plan.js:157 (replaces scenes/mansion.js:295; called by name at dialogue_system.js:145) | wrap: let v12 compute the total (unchanged `wipeFor` logic), then move it into `TAC.m3.wipe.pendingTotal` and set `S.game._wipeTotal = 0`; then `titleCard(...)` and start the breach in its callback | Defers the wipe. `updateMansionWipe` (scenes/mansion.js:301) already returns while `_wipeTotal` is 0, so it needs no wrap. v13 no longer wraps this function (v13_boot.js:94). |
| `updatePressure(dt)` | pressure.js:202 (TAC's own wrap, foundations §2.3) | subscribe via `TAC.onTick(fn)` (request R4); fall back to an outermost wrap | Obi, Uche and the child tick only while playing, and deterministically under the harness stepper |
| `drawLaptopScreen(state, pct)` | art_pass_v8.js:1896 (called by name from `mansionUpdate`, :1885) | wrap: while the wipe is pending, swallow `'wiping'` (screen stays locked; no per-frame redraw); during the power-cut delay draw a "NO NETWORK" line; on `'halted'`, draw the file list; add a `'seized'` state | The screen must not show SECURE ERASE before a wipe exists |
| `MQ_HOOKS.m3[0].ready` | art_pass_v8.js:4030 | replace the function on the hook object: `() => r0() && !!S.game._wipeTotal` (mqAttach reads `h.ready()` at press time, :4050) | No "KILL THE WIPE" field skill before a wipe exists. **Harness** H2: none shown. |
| `MG_CFG.m3_wipe` | art_pass_v8.js:3939 (factory; `onTick` at :3947) | replace the factory: chain `onTick` so a running Obi and the perimeter timer advance; append *"He's still running while you work."* to `sub` while he runs | The field skill is an overlay; without this he would freeze mid-run |
| `collectEvidence(ev)` | the function; inner wraps v13_boot.js:16, v12_core.js:322 | wrap: after orig, for `ev.id === 'laptop'` in m3, compute and store the files and push one custody line onto `I().items.laptop.custody` (once) | v13 creates the record inside orig (v13_intel.js:140-152), so ours lands after it. **Harness** B/C. |
| `BRIEFINGS.m3.leads[drives]` `res` / `intel` | v13_data.js:209/214 (a top-level `const`, read at run time by `applyLead`, v13_briefing.js:411-419) | at load: `Object.defineProperty` getters that fall back to the original values | Feeds the Week-1 result without editing v13. **Harness** J. Alternative in the table below. |
| `V12.planM3(onGo)` | v12_plan.js:83 (opened by the Uche interaction, :178-180, behind `V12.raidGate`, casework.js:451) | property wrap: after orig, run `planTruth(ov)`; attach a `MutationObserver` (childList) to `#screen-plan` so every redraw (`draw()`, :89-120) is re-decorated | Plan text truth (§1.1) without editing v12. `go` (:121-151) is untouched. **Harness** P, plus casework_warrant passed with it installed. |
| `generateHeadline()` | aftermath.js:10 (inner wrap casework.js:531) | wrap: orig first; if `h.cw` or bribe or force ≥ 2 or integrity < 35, return it; if Obi was taken by the perimeter this op, return the perimeter headline | §1.8 |
| `showAftermath()` | aftermath.js:134 (inner wraps v12_core.js:111, v12_pt.js:288, v12_share.js:90, casework.js:525, v13_boot.js:26) | wrap: after orig, in m3, append one `stat-row` to the first `.aftermath-block` (the grid is built at :156-188); log `m3_summary` | Files row and summary. It touches no reputation (casework_lagos asserts exact deltas). |
| `WAY.resolve()` | wayfind.js:179 | property wrap: while Obi runs, return `{pos, mesh:obi, label:'Stop Obi', kind:'chase', mode:'live', catch:true}`; otherwise orig | Tracker, arrow and marker follow him like a market chase |
| `WAY.OBJ_TARGETS.m3` | wayfind.js:104 | add `'Walk her out'` to `o5_civ`'s label list; `o4_wipe` already lists `'Inspect laptop'` | The tracker finds the relabelled child |
| `ensureHudV8()` | art_pass_v8.js:2355 (inner wraps: foundations, v13_boot.js:108) | wrap: after orig, insert `#ctx-uche` into `.ctx-row` and the desktop `#tac-uche` chip once | The UCHE control |
| keydown `KeyQ`, `Digit1-3` | unbound today (checked: across engine.js, art_pass_v8.js, v12, beta and v13 the only codes handled are E, F, K, L, S, Space, Enter, Escape and Tab) | capture-phase listener from foundations' input block; ignored in inputs, overlays and the car | Desktop orders |
| `TAC.interact.spent(label, fn)` / priority | foundations §3.1 (wraps `nearestInteractable`, people_art_pass.js:557) | `'Walk her out'` is spent once she is out. `Move on suspect` gets **priority 3** while Obi is free in the room. | Today the laptop's priority 2 (art_pass_v8.js:1713) wins ACTION over Obi at the frontal approach (laptop 1.63 m away, range 2.0). Without this, pressing ACTION to grab him seizes the laptop instead. |
| `TAC.sight.watch({...})` | foundations §3.7 | one watcher, `obi` (§3.2) | Detection |
| `newScene()` | art_pass_v8.js:2528 (TAC's wrap) | via TAC's scene reset: drop `TAC.m3`; **restore `MANSION.mats[*].lightMapIntensity = MANSION.lmMax`** | The baked materials are cached and shared across instances (art_pass_v8.js:192-197). A power cut must not leak into a replay or the next visit. |

**Not hooked, on purpose:**
- `updateMansionWipe` (scenes/mansion.js:301). Leaving `_wipeTotal` at 0 already pauses it, and the v12_pt `wipe_end`
  sampler (v12_pt.js:216-226) keys on the same field. It therefore logs only wipes that really ran, and `pt_logger`'s direct
  `S.game._wipeTotal` writes behave as before.
- `mansion_arrest` / `mansion_civilian` data (config/dialogue.js:91-115). The Obi wrapper swaps `DIALOGUE.mansion_arrest`
  for a per-press clone (the `requires:'crisis'` removed for in-house stops, or filtered to two choices for the perimeter) and
  restores the original right after the press. `renderChoices` (dialogue_system.js:65-70) and v12_pt's `choice` log work
  unchanged. The calm child line is a clone of `mansion_civilian` with line 0 replaced, swapped in the same way.
- The hidden `.action-btn` SQUAD/ORDER stubs (engine.js:337-343, including "Officer Kemi"). They are hidden today and
  unreachable, so they are left alone.
- **Optional explicit hooks**, if reviewers prefer them over the zero-edit techniques:
  - after v12_plan.js:117 (before the listeners at :118): one line, `if(V12.planDecorate) V12.planDecorate(ov, plan, I, w);`,
    instead of the MutationObserver.
  - v13_briefing.js:419: `return typeof l.resFn === 'function' ? l.resFn() : l.res;` (with the same for `intel` at :418),
    instead of the property getters.

### 2.3 · State read and written

**Read:**
- `S.game._plan` (entry, power, uche, known: v12_plan.js:123)
- `S.game.flags.entry`
- `kcIsFair()` (through `known.gate`)
- `S.game._tipM3` (through `known.civ`)
- `V12.accused('lagos').warrant` (casework.js)
- `V12.ops().cases.lagos.refused` (v12_ops.js:303, :626)
- `S.game._wipeT`, `_wipeTotal`, `_wipeDone`, `_wipeLost`, `_evLaptop`, `_civChild`, `moralChoices.arrest`
- `ENGINE._mansion` (`obi`, `uche`, `child`, `screen`, `D.Glows`)
- `ENGINE.obstacles`, `ENGINE.keys.KeyC`
- `SETTINGS.difficulty`, `SETTINGS.timed`, `isRecruit()` (settings.js:52), `chaseRate()` (settings.js:42), `intelHas('safe_drives')`

**Written to `S`.** These are outcomes only, each written once, because `progressSig()` hashes the flags (foundations §2.4):
- **`S.game.flags.m3_files`:** an array of the surviving file names. Written at the halt or seizure.
- **`S.game.flags.m3_wipe_pct`:** a number.
- **`S.game.flags.m3_obi`:** one of `'cold'|'beat_thumb'|'stun_grab'|'intercepted'|'covered'|'cornered'|'tackled'|'perimeter'`.
  Written when he is stopped.
- **`S.game.flags.child_gentle` / `moralChoices.child_gentle = true`:** written when Uche walks her out. This is the existing
  key that the court (v13_court.js:713) and the epilogue (finale.js:110) read.
- **`S.game.civiliansRescued += 1`:** when she leaves, except after the gentle choice, which already counted at the choice
  (util.js:46).
- **`S.game.forceUsed += 1`:** the perimeter takedown, through `applyEffect({force:+1})`.
- **`S.game._wipeTotal = pendingTotal, _wipeT = 0, _wipeDone = true`:** at a seizure with no wipe, so "Pull the plug early"
  (art_pass_v8.js:3596) resolves to done. **Harness** C/H2: `m3_plug` done.
- **`S.game.moralChoices.rescued = 0` at build.** This is a per-op reset of a latent bug: the art-pass child callback reads
  `moralChoices.rescued` (art_pass_v8.js:1745), which persists from any earlier run. A replayed raid therefore walks her out
  even after "stay put". Nothing else reads `rescued`.
- **`S.game._planPaid = true`:** our extraction pays the plan honestly and makes v12's payoff (v12_plan.js:186-196) skip,
  which removes the knowledge-only +1 at :192.

**Runtime only** (`TAC.m3`, never saved): the entry, Obi's state and timers, the watcher, Uche's job, the child state, the
wipe mode (`pending`/`delayed`/`armed`/`never`), `firstLaptopAt` and the encounter record.

### 2.4 · Save compatibility

- **Old saves load unchanged.** Nothing new is required in `S`. `loadGame`'s merge (state_save.js:13-33) is untouched.
- **An M3 in progress** always restarts at its start (`resumeCampaign` → `loadMission`), so no runtime state needs restoring.
- **A save that finished M3 before this layer** has no `m3_files`, so the Week-1 drives lead returns today's text and intel
  (**harness** J, `old` branch).
- **A replayed M3** (mission select) clears `flags.m3_files`, `m3_wipe_pct` and `m3_obi` at build. `child_gentle` is not
  cleared, because the court and the epilogue read it and today's behaviour keeps it.
- **No new settings.** Crouch mode and detection pace are foundations'.

### 2.5 · The v13 layer

- **Exhibits.** One custody line on the laptop record, added after v13's `collectEvidence` wrap. Admissibility
  (`intelItemFlaws`, v13_intel.js:275) is unchanged. `warrantless` still comes only from an exigent raid
  (`RAID_WARRANT.m3 = 'w_lekki'`, :187).
- **Week-1 briefing.** The drives lead reads `flags.m3_files` (§1.7). `leadBlocked`'s `needsAny` (v13_briefing.js:180) is
  unchanged, so the lead is offered whenever the laptop or the safe drives exist.
- **Twist rule** (STORY-CANON.md, v13 additions). The file names are today's screen props (art_pass_v8.js:1912). The thin
  result text names no one and adds no clue: "Nothing in them names a payment".
- **Leak vs v13's "no leak timers".** The wipe total is never shortened. The only leak effect is where Obi looks and how
  soon he alarms, and only after a refusal the player chose to go in on. This needs a decision (§7).
- **Court and epilogue.** `child_gentle` keeps its meaning ("carried out gently"), now true for Uche's carry too.
  `moralChoices.arrest` keeps its four values, so `informant` and `forceful` downstream are unchanged.
- **v13_port_flow step 4** calls `collectEvidence({id:'laptop'})` directly on a knock raid. That is not a halt, so no custody
  line is added. Its assertions (Agency 0, no flaws) hold, and the GO delta was confirmed at 0 in **harness** P.

### 2.6 · The beta

- **Casework.**
  - The raid gate, the warrant panel, `CW.goExigent` and the grade cap at 69 (casework.js:554) are untouched.
  - The plan decorator runs on top of the raid-gated plan, and `casework_warrant` **passed** with the prototype installed
    (**harness** R).
  - The headline wrap defers to casework's wrong-suspect headline (`h.cw`).
- **Wayfinding.** As in §2.2: an objective label list plus a `WAY.resolve` override during the run. The chase module
  (`beta/chase.js`) isn't used, since `startChase`'s 20 s escape rule and lane logic don't fit a 10 m room (SCOPE).
- **Paper UI.** The new UI uses the palette variables, with no gradients, glows, blur or glyphs. Icons come from `icon()`:
  `people`, `shield`, `lock`, `eye`, `alert`, `doc`, `check`, `cross`.

### 2.7 · v12

- **`V12.planM3`'s `go`** still writes `S.game._plan`, applies the entry, warrant and power deltas, and logs `plan_m3`
  (v12_plan.js:121-151). Uche's spoken lines (:138-149) are reused: Kelechi's entry line at :146 now matches what happens.
- **`V12.m3Intel` / `lagosWarrant`** are read-only.
- **v12's `computeGrade` wrap** (:204-216) is unchanged.
- **CAPS.squad** (v12_core.js:155) is unchanged and still true: "Post Uche at the rear exit when you plan a raid".
- **v12_pt.**
  - The new refusals are caught as `interact_result{outcome:'refused'}`: `PLAN FIRST` is in `BLOCKED`
    (v12_pt.js:150), and `OPERATION OPEN … first` matches the `first$` rule.
  - The four-choice arrest logs `choice{of:4}`.
  - `wipe_end` logs only armed wipes (§2.2).

### 2.8 · What this needs from the foundations layer (TAC)

Everything below is in foundations.md except R1–R4. Each is a small, generic addition.

| Need | Status |
|---|---|
| `TAC.sight.watch` with `eyeH`, `fov`, `range{lit,dark}`, `attention()`, `facing()`, `light()`, `surface`, `marker:false`, `onLevel`, handle `.state`/`.reset()` | foundations §3.7 |
| `TAC.sight.zones` (place names), `TAC.sight.lights` (dark house with the laptop screen as a lamp) | foundations §3.7 |
| `TAC.geo` mansion table (all 39 obstacles), `los` skipping a watcher's own box | foundations §3.2 |
| `TAC.interact.spent()` and priority decoration | foundations §3.1 |
| `TAC.radio.say(…, {pri, key, ttl})` for Uche's callouts | foundations §3.6 |
| **R1** per-watcher `gain` multiplier (default 1); Obi 1.6 | new, one line in the gain formula |
| **R2** per-watcher `levels:{notice, alarm}` (default 35/100); a leaked Obi uses alarm 60 | new |
| **R3** `crowd: () => []` for a watcher (no bystanders in the mansion; Uche and the child must not hide you) | foundations allows `crowd()`; confirm companions are excluded |
| **R4** `TAC.onTick(fn)` subscription (fixed-step, the same 10 Hz clock) | new; else tac_m3 wraps `updatePressure` itself |

The brief's assumed API maps onto foundations' as follows:
- `watch(...)` → `{suspicion, state, cause, lastSeen}` is the handle's `.state.susp`, `.level`, `.cause`, and
  `.dist`/`.angle`/`.place`.
- `TAC.sight.tick` is driven from `updatePressure`.
- `TAC.player.crouched` is `ENGINE.keys.KeyC` (and `.state.crouch`).

### 2.9 · The legacy builder (art failed; the harness default)

It gets only:
- **The child fix.** "Stay put" → `Walk her out` → she is moved outside, as legacy already does on rescue
  (scenes/mansion.js:208).
- **The honest extraction.** It needs the child out, and there is no knowledge-only +1.
- **`PLAN FIRST` wording** on `Stop laptop wipe` and `Move on suspect`.
- **Laptop files** from the halt percentage.
- **The plan decorator in legacy mode:** the quiet label and the power-cut sentence change, but the wipe line keeps "about
  N s" with no "once he knows" (because in legacy the wipe still starts at the briefing).

There is no watcher, flight or Uche order, and spawns and wipe timing stay as today. The playthrough bot (v13_port_playthrough)
plays this path, and its policies 1 and 2 pick "stay put". The bot presses every live interactable each step and the new
label has no choices, so the run is expected to finish. **This was not measured** (my run 4 fixture went to the h2 office
first); it is the first regression to run (§5.2).

---

## 3 · Data and constants (first pass)

### 3.1 · Spawns and posts (art-pass room)

| Key | Player (x, z, yaw) | Uche | Why |
|---|---|---|---|
| knock | (0.35, 5.0, π) | (−0.35, 4.7) follow | In the doorway, both free (pad 0.3). Uche there can see Obi: **harness** K, COVER offered at t = 0. From (0.9, 5.5) behind the wall he couldn't (**harness** G). |
| loud | (0.35, 4.6, π) | (−0.35, 4.7) follow | as knock |
| quiet front | (0.4, 4.9, π) | (0.9, 5.5) hold | **Offline**: out of his cone (59°) and behind the front wall |
| side gate | (0, −7.6, 0) | (−0.35, −8.1) back | Corridor, free of the cabinet (x 0.43–0.81). **Offline**: 58°, behind the wall. |
| Squad Trust rear (any entry) | per entry | (−0.35, −8.1) back | as gate |
| perimeter drop | Obi (0.9, 9.6, π), kneel | | Free; 3.8 m to extraction (0, 13.3). (1.6, 9.8) collides with the drive car. |

### 3.2 · Obi as a watcher

| Constant | Value | Source / why |
|---|---|---|
| position, facing | (4.12, −1.0), yaw −π/2 (faces −x, the living room) | art_pass_v8.js:1690; SCOPE |
| eye | 1.6 m | foundations §3.2 |
| fov | 100° | foundations default; the doorway centre is 48° off his facing at 6.2 m, so the door is the cone's edge |
| range | lit 9 m, dark 4.5 m | foundations ("Obi: 9 / 4.5"); halved, per the plan |
| attention | 0.6 on the call (talk clip), 1.0 from notice on | Foundations' "working" value, then he looks up |
| **gain (R1)** | **1.6** | **Offline** table §3.3: 1.5 leaves walking-at-him at 94 (no alarm); 1.8 alarms the child round-trip. 1.6 is the smallest that alarms an upright frontal walk while keeping the flank at 0–15. |
| hearing, surface | 1.0, "on the tiles" | foundations (mansion) |
| notice / alarm | 35 / 100; **leak alarm 60 (R2)** | **Harness** I without R2: crouched flank peak 95 (no alarm, so a leak would change nothing). **Harness** L with 60: alarm at 3.97 s. |
| leak facing | toward the front door, yaw = atan2(0 − 4.12, 4.0 + 1.0) | the corridor mouth is then 90° off (**offline**): the gate still works |
| crowd | none (R3) | |
| place names (`TAC.sight.zones`) | doorway x[−0.95, 0.95] z[2.8, 4.3]; "the living room" x[−5, 0.5] z[−4.5, 4]; "his desk" x[2, 4.5] z[−2.5, 0.5]; "the corridor mouth" x[−1, 1] z[−4.8, −3.6]; "the east wall" x[3.4, 4.6] z[0.5, 3.5] | why-line places |

### 3.3 · Measured approaches (what the constants produce)

Gains: attention 0.6 rising to 1.0 at notice, ×1.6; foundations' formula, gait and grace; 10 Hz.

| Route | sneak 1.25 | walk 1.55 | jog 3.0 |
|---|---|---|---|
| Doorway (east side) → front wall → east wall, ending 2.5 m from him | 9 (**harness** 0) | 15 | 15 (**harness** 16) |
| Doorway (centre) → east wall | 18 | 35 (notice) | 26 |
| Straight at the desk, ending 2.3 m away | 39 notice (**harness** 40) | **alarm 3.5 s** (**harness** 3.33 s) | 50 notice |
| To the child and back | 29 | 69 notice | 32 |
| Standing still 4 s near the child | 30 (crouched) | **alarm 4.2 s** | |
| Side gate → back wall → 2.5 m from him | 30 (**harness** 22) | 68 notice | 41 |
| Side gate → behind the armchair | 26 | 78 notice | 34 |
| Door → in front of the laptop | 68 notice | **alarm 3.5 s** | **alarm 2.3 s** |
| Power cut: straight at the desk | 16 | 30 | 23 |
| Leak (watching the door): east wall | **alarm (harness 3.97 s)** | | |

These numbers are **offline** unless marked. Coverage from the desk, lit: 596 cells in his cone, 577 seen standing, 554 seen
crouched, 23 hidden only when crouched (all behind the armchair). Dark: 217 cells within his 4.5 m sight.

### 3.4 · Reactions and the flight

| Constant | Value | Why |
|---|---|---|
| KNOCK_THUMB | 1.0 s (the wipe arms whatever else happens) | "Knock: the wipe starts as today". COVER stops the run, not the thumb. |
| KNOCK_RUN | 1.5 s | **Offline**: sprint intercept margin +2.0 s (reaction 0.6) or +1.1 s (reaction 1.5); jog +0.3 or −0.6. A 1.0 s run left a 1.5 s-reaction sprinter only +0.6 s. |
| LOUD_STUN | 2.5 s; wipe armed at 0 | plan; **offline**: a sprint reaches arrest range in 1.0–1.2 s |
| REACH (quiet alarm → phone) | 1.5 s; leak 0.3 s | The window to beat the thumb, at arrest range (2.7 m) or by walking into him (1.4 m) |
| Flee path | (4.12,−1.0) → (4.12,−2.9) → (3.95,−3.55) → (1.5,−3.65) → (0.35,−3.95) → (0,−4.7) → (0,−8.1) | 10.44 m. **Offline**: every leg clears the colliders at 0.25 m. The cabinet and lamp corners were checked. |
| OBI_V | 3.0 m/s × min(1, chaseRate()) (× 0.8 if timed is extended) | the jog clip's native speed (MOVE.jog, people_art_pass.js:490); 3.5 s to the door |
| His collision box | removed from `ENGINE.obstacles` when he starts to run | ob(4.12,−1.0,0.5,0.5), art_pass_v8.js:1842; foundations re-classifies lazily |
| CATCH (auto) | 1.4 m | below every interaction range |
| STOP_RANGE (ACTION while he runs) | 2.2 m | label `Stop him` |
| Cornered | Kelechi or Uche with abs(x) < 1.0 and z < −4.0 when he would run | the back is his only way out; the front is the squad's cars |
| PERIM_SECS | 6 s after out_back | gives a corridor chaser time to walk back (17 m, about 6 s at a jog) |

### 3.5 · Interception windows

**Offline** A* at 0.1 m with a 0.3 m pad; Obi from t_run at 3.0 m/s; catch radius 1.4 m. Margin = his arrival at the corridor
end minus yours (positive means you can cut him off).

| Start | t_run | sprint, 0.6 s react | sprint, 1.5 s react | jog, 0.6 s | walk, 0.6 s |
|---|---|---|---|---|---|
| Doorway (knock) | 1.5 s | +2.0 | +1.1 | +0.3 | −3.3 |
| Porch (today's spawn) | 1.0 s | +0.8 | −0.1 | −1.4 | −6.2 |
| Doorway (loud) | 2.5 s | grab at the desk (1.8 s) | +2.2 | +1.5 | −2.1 |
| Quiet alarm at the desk front (2.0, 0.8) | 1.5 s | grab during the reach | grab | grab | +0.7 best |
| Quiet alarm at the child | 1.5 s | grab during the reach | | +1.4 | −0.3 |

**Harness** A (doorway, sprint, 0.6 s react): stopped at 3.1 s, Obi at (1.77, −3.64).

### 3.6 · Uche

| Constant | Value |
|---|---|
| Follow | target 1.8–2.5 m behind the player, along the waypoint graph below. Jog 3.0, sneak 1.25 when you crouch. No collision with the player. |
| Waypoints | porch (1.0, 6.55); doorOut (0.35, 5.0); doorIn (0.35, 2.6); hallE (2.2, 2.6); flank (3.6, 2.4); living (−0.6, 2.4); livingW (−2.8, 2.0); childSide (−0.9, 1.9); midS (0.6, −0.6); study (2.3, 0.6); midS2 (0.75, −2.9); mouth (0.3, −4.0); backW (−0.9, −3.6); corrMid (0, −6.0); back (−0.35, −8.0) |
| Edges | porch–doorOut–doorIn; doorIn–hallE–flank; doorIn–living–livingW; living–childSide; doorIn–midS–study; hallE–study; living–midS; midS–midS2–mouth; mouth–backW; mouth–corrMid–back. **Offline**: all clear at 0.25 m. midS→mouth direct clips the floor lamp at (0.4, −2.92), so it routes through midS2. |
| COVER_RANGE | 8 m with line of sight (Uche eye 1.6 to Obi 1.45, same 2.5-D test). Doorway to desk is 7.24 m. |
| ROUND_SECS | 9 s: about 22 m round the outside at 3.0 m/s, plus the kitchen door |
| TAKE HER OUT | Uche to her (3.6 m from the doorway, **offline**), then the child path (6.26 m at 1.05 m/s = 6.0 s, **harness** 5.98 s) |
| Clips | follow: walk, jog, sneak; COVER: aim; tackle: kneel (Obi down); carry: walk hand in hand. All in the rig (SCOPE). |

### 3.7 · The child

Labels and lines:

| Element | Text |
|---|---|
| Label before you've spoken to her | `Calm and escort the child` (unchanged) |
| Label after "stay put" | `Walk her out` |
| Calm first line (civilians known) | `"Shh… I dey hide. You be police?"` / textEn `"Shh… I'm hiding. Are you police?"`, mood `afraid`. No new names or relations: a canon and tone check is needed (STORY-CANON.md). |
| Walk-her-out line | KELECHI: `"Come. Hold my hand. We go outside now."` |

She is outside when z > 4.6 (past the door leaves); that is when "Secure the child" completes and the rescue counts.

### 3.8 · Wipe totals and timing

- **Totals:** v12's `wipeFor` is unchanged (v12_plan.js:57-62): knock 55, quiet 65 (80 with the gate), loud 40, +15 if the
  laptop is known, +12 with a power cut. That is the number the plan shows.
- **Start:** knock at 1.0 s after the breach; loud at 0; quiet at the alarm + 1.5 s (0.3 s if leaked); never if stopped first.
- **Power cut:** the +12 is a real delay. The meter shows `NO SIGNAL` for 12 s, then a wipe of (total − 12) runs, so the
  drive is blank at about the plan's number.
- **Files:** percentages for the files use the running part only.
- **Speed:** the wipe advances at `timerRate()` (settings.js:35), as today.

### 3.9 · Files (the wipe shreds in this order)

| File | Lost once the wipe reaches |
|---|---|
| burner_logs.zip | 10% |
| obi_contacts.vcf | 20% |
| **ledger_q3.xlsx** | **40%** (the halted screen already says "Most of the ledger survived" below 40, art_pass_v8.js:1917) |
| transfers_lekki.pdf | 55% |
| sim_batch_07.db | 70% |
| pos_agents.csv | 85% |
| wallet_seed.txt | 100% |

- **Intel at the halt:** unchanged (+12 / +5 / 0, art_pass_v8.js:1725).
- **Week 1 drives lead:** today's result and +10 intel if the ledger survived, the safe drives exist, or there are no flags;
  otherwise the thin result and +4.
- **Harness** B: a knock where the player stood still, then the field skill: 19%, 6 files, ledger kept.

### 3.10 · Interaction priorities in the house

| Target | Priority |
|---|---|
| `Move on suspect` | 3 while Obi is free (unaware, noticed, waiting, startled, stunned, reaching, running); then today's 0, and spent after the arrest (foundations) |
| `Inspect laptop` | today's 2 while live |
| `Walk her out` | 1 |
| everything else | as today |

### 3.11 · Strings (in tac_m3.js; every one is ASCII text, with no glyphs and no "AKS")

**Toasts:**
- `HE SAW YOU` / `HE HEARD YOU` / `TOO CLOSE`, with the frozen why-line.
- `GOT HIM` · "Hands where I can see them."
- `LAPTOP SEIZED` · "The wipe never started. All 7 files intact."
- `PLAN FIRST` · "Plan the raid with Sgt. Uche"
- `OPERATION OPEN` · "Arrest the principal first" / "The girl is still inside. Walk her out first"

**Radio (SGT. UCHE)**, with key, priority and expiry in brackets:
- breach: "NACECA! Search warrant: open the door!" [m3_knock, 2, 4 s]
- "I'll hold the door, sir. Call me." [m3_hold, 1, 6 s]
- "He's running: the back corridor!" [m3_run, 3, 4 s]
- "He's out the kitchen door. Perimeter, he's yours!" [m3_out, 3, 5 s]
- "Perimeter has him, in the yard. They're bringing him round the front." [m3_perim, 2, 10 s]
- "No power, no Wi-Fi. His trigger's going out over the network. We've got seconds." [m3_cut, 2, 8 s]
- orders: "On him." / "I've got her." / "Going round, sir." [m3_order, 2, 4 s]

**Card lines:** `KNOCK AND ANNOUNCE · 21:32`, `LOUD BREACH · 21:32`, `THE FRONT DOOR · 21:31`, `THE SIDE GATE · 21:34`,
`THE GENERATOR GOES QUIET`.

---

## 4 · Telemetry (V12.log only; v12_pt adds `dev` to every event)

| Event | When | Fields |
|---|---|---|
| `enc` · `m3_entry` | breach (card closed) | `approach:'knock'|'loud'|'quiet_front'|'side_gate'`, `power:'on'|'cut'`, `uche:'with'|'rear'`, `leak:bool`, `known:{suspects,laptop,gate,civ,warrant}`, `spawn:[x,z]`, `pendingTotal`, `variant:'v8'|'legacy'` |
| `seen` / `evaded` | from TAC.sight (foundations §4), `who:'obi'`, `enc:'m3_obi'` | foundations' fields (`cause`, `dist`, `ang`, `los`, `cover`, `crouch`, `gait`, `lit`, `why`, `place`, …). **Harness**: notice at 3.8 m, 44°, sight, walking; alarm at 2.3 m. |
| `m3_obi` | every state change (about 3–7 per raid) | `state`, `prev`, `t` (s since breach), `by:'kelechi'|'kelechi_cold'|'kelechi_reach'|'kelechi_stun'|'uche'|'perimeter'|null`, `dist` (to Kelechi), `duringMinigame:bool` |
| `enc` · `m3_obi` | when he is stopped, by any means | `outcome:'cold'|'beat_thumb'|'stun_grab'|'intercepted'|'covered'|'cornered'|'tackled'|'perimeter'`, `alarm:{cause,why,dist,crouch,cover,t}|null`, `ranM` (metres he ran), `secsAlarmToStop`, `ucheJob` |
| `enc` · `m3_laptop` | at the halt, seizure or loss, or at extraction if untouched | `outcome:'seized_intact'|'halted'|'lost'|'abandoned'`, `pct`, `files` (count), `ledger:bool`, `firstLaptopAt` (s since breach of the first *Inspect laptop* press), `armedAt`, `delay:bool`, `mg:bool` |
| `enc` · `m3_child` | when she is out (and at "stay put") | `choice:'gentle'|'stay'|null`, `by:'kelechi'|'uche'`, `calm:bool` (civilians known), `outAt`, `askedUche:bool` |
| `order` | every order attempt | `order:'cover'|'take_child'|'back'`, `ok:bool`, `why` (when refused: `'busy'|'no_sight'|'running'|'unaware'`), `from:'button'|'key'|'card'`, `obi` (state), `t` |
| `ally_done` | an order completes | `task`, `outcome:'held'|'escorted'|'posted'|'tackled'|'cancelled'`, `secs` |
| `m3_summary` | the extraction that completes | `entry`, `power`, `uche`, `leak`, `obi` (the outcome), `alarmCause`, `wipe:{mode,pct,total,files}`, `child:{by,choice}`, `orders:[…]`, `forceDelta`, `refusals:{plan_first,operation_open}`, `secs` |

**Unchanged and relied on:**
- `interact_result` catches the new refusals as `refused`, with the toast title.
- `choice` covers `mansion_civilian`, `mansion_arrest` (`of:4` when the deal is unlocked) and `tac_m3_*` (the walk-out line
  has no choices).
- `wipe_end` covers armed wipes only (`m3_laptop` covers the rest).
- `plan_m3`, `evidence`, `mission_end`.

**Volume:** about 15–25 events per raid, against the logger's cap of 3000.

**Question pairing.** Every `seen` alarm is a candidate cause for the survey's *"What happened that felt unfair?"*.
`m3_summary.obi` and `.wipe.files` pair with *"most satisfying decision"*.

---

## 5 · Harness scenarios

### 5.1 · New

Put these in `tools/harness/scenarios/` and build them on `m3_lib.cjs`. It is the art-pass fixture already proven in this
work (`mansion_work/m3lib.cjs` + `run3_proto.cjs`), and it should become foundations' `T.deviceMansion`. It provides:
- `breach(plan, state)`: autofile, plan, GO, the dialogue.
- A frozen-clock stepper that drives `updatePressure`, `updateMansionWipe` and `updateWalker`.
- `laptop()`: fires the staged hit by hand, because the shim's rig is not skinned.
- `restoreArt()`: mandatory, since `ART.ready` leaks across `h.start`.

| Scenario | Setup | Asserts |
|---|---|---|
| `tac_m3_entry` | each of knock / loud / quiet / gate (KC fair) × power leave/cut, with and without Squad Trust rear | spawn and Uche position (§3.1); `S.game._wipeTotal === 0` and `m3.wipe.pendingTotal === wipeFor(...)` for quiet and gate; knock arms 55 at 1.0 ± 0.05 s; loud arms 40 at 0; cut shows `NO SIGNAL` for 12 s; the card blocks the clock (Obi still `startled` at t = 0 after a 1.4 s card); laptop screen state stays `locked` while pending |
| `tac_m3_plan` | open the plan (raid gate with a signed sheet) | the quiet label per gate; the wipe line per entry; the power-cut sentence; the rear sentence; `WORD IS OUT` only when refused + exigent; GO Agency deltas exactly as today (knock signed 0; quiet +3+2; loud +5+2); the decorator survives 6 redraws; `#screen-plan` audited with `v13_a_lib` `A.audit` |
| `tac_m3_sight` | quiet front / gate; scripted walks (§3.3 routes) | flank crouched and jogged: max suspicion < 35, no `seen{alarm}`; straight at him walking: `seen{level:'alarm', cause:'sight', crouch:false}` in 3.0–4.0 s; crouched: notice and no alarm; gate back wall crouched: < 35; dark: straight at him walking < 35; leak: crouched flank alarms (threshold 60); notice then back behind the door leaf: `seen{level:'calm'}`, then `evaded`; overlay open 5 s: suspicion unchanged |
| `tac_m3_flight` | knock idle; knock sprint to the mouth after 0.6 s; loud grab at (3.9, 1.5) inside 2.5 s; quiet alarm then walk into him within 1.5 s; corridor occupied; field skill opened while he runs | out_back at 5.0 ± 0.2 s, perimeter at +6 s, Obi visible at (0.9, 9.6), force +1, two arrest choices, perimeter headline; intercepted before z = −4.7 with four choices and force unchanged; the stun grab has no run; beating the thumb leaves the wipe `never` with `m3_files.length === 7`; cornered gives `handsup` and no run; he advances inside the field skill (`duringMinigame:true`); `timed:'off'` means no run |
| `tac_m3_uche` | knock with orders; gate; quiet front; take_child with civilians known; back | follow keeps 1.6–3.5 m and never `blockedAt(…, 0.25)`; COVER is offered at t = 0 from the doorway, Obi `covered`, wipe still armed at 1.0 s; COVER not offered when Uche can't see him; TAKE HER OUT gets the child out with +1 rescued and `child_gentle`; refused with `why:'unaware'` on the quiet front; BACK posts him after 9 ± 0.5 s and a later run gives `tackled` by Uche with force 0; the Squad Trust payoff only when Uche is still at the back |
| `tac_m3_child` | art-pass and legacy | stay put: o5 open, label `Walk her out`, `WAY.current().obj.id === 'o5_civ'`, extraction refused with the exact text, no rescue counted; walk out: +1 exactly once; gentle: +1 exactly once, and none extra at extraction even with `known.civ` (the v12_plan.js:192 regression); a replay after a gentle run with stay put leaves her inside (the `rescued` reset) |
| `tac_m3_laptop` | halts at `_wipeT/_wipeTotal` = 0, 0.09, 0.19, 0.39, 0.41, 0.99; seized; lost | file counts 7, 7, 6, 5, 4, 1, 7, (lost) 0, with the ledger kept up to 39%; exactly one custody line; the drives lead's `res`/`intel` per §3.9, including safe drives present and no flags; no field skill while pending or delayed; `m3_plug` done on a seizure |
| `tac_m3_legacy` | `h.start('m3')` (legacy) through the hub-done fixture of `wayfind_lib.start` | no TAC watcher, `_wipeTotal` set at the briefing (as today), the child fix, the honest extraction, `PLAN FIRST`; a bot-style loop with choice index 1 completes M3 |
| `tac_m3_hud` | 390×844 touch, 844×390 touch, 1280×800 desktop | the NOTICED tag, the `#ctx-uche` button and the order cards pass `A.audit` (no gradient, shadow, filter or glyph; palette only; targets ≥ 44 px on touch); keyboard hints hidden on touch; nothing overlaps `#radio-sub`, `#hud-mission-objs`, the minimap, `#hint-chip` or the meters (`WAY.hudRects`); cards stack vertically in portrait and in a row in landscape |
| `tac_m3_log` | one scripted raid per outcome | the event shapes in §4; `m3_summary` once; no per-tick writes to `S.game.flags` (the `progressSig()` hash changes only at outcomes) |

### 5.2 · Regressions that must stay green

**The full suite:** `wayfind_*`, `board_*`, `casework_*`, `v13_*`, `pt_logger`, `visual_*`.

**Already run with the prototype layer installed:**
- **`casework_warrant`: PASSED** (**harness** R). It runs the raid gate, exigent entry, `V12.planM3` with the decorator, the
  GO deltas and the grade cap.

**The ones this layer touches, to run first:**
- **`v13_port_playthrough`:** legacy M3, where policies 1 and 2 pick "stay put" and should now press `Walk her out`.
- **`v13_port_flow`** step 4: knock, a direct `collectEvidence('laptop')`, Agency 0, no flaws.
- **`casework_lagos`:** aftermath reputation deltas and headlines with `S.game.currentMission = 'm3'`. Our headline wrap
  needs a perimeter outcome in this op, so it is a no-op there.
- **`wayfind_tracker`:** M3 legacy distance to `Calm and escort the child`. The label is unchanged until "stay put".
- **`pt_logger`:** direct `_wipeTotal` writes and the `wipe_end` sampler. `updateMansionWipe` is not wrapped.
- **`v13_a_flaws` / `v13_a_saves`:** the custody text passes `textRules`, and no custody line is added outside a real halt.
  This guards the `c1 === 0` migration assertion.

---

## 6 · What only real rendering or a real device can verify

- **The side-gate spawn.**
  - Does the baked `Room` mesh show a door at the corridor end (z = −8.68)? The GLB is one mesh, so the data can't say. If
    it doesn't, start at (0, −6.2) facing the house.
  - Can the third-person camera work in a 2.2 m corridor? Camera blockers exist at art_pass_v8.js:1855.
- **The power cut.** Does a light map at 35% with the lamps off read as dark on a phone in daylight while staying playable?
  Is the laptop's own glow enough to find the desk? Is a 35% floor right?
- **Cover from the camera.** The camera sits about 3.5 m behind and above you.
  - Does a crouched Kelechi behind the armchair look hidden?
  - Does the doorway read as "his cone's edge"?
  - Does the east flank read as safe?
  - Can players read his facing from the talk clip and the 35° glance?
- **The NOTICED tag.** Is it legible over a dark baked room at 390 px? Does it fight the evidence markers over the desk
  (laptop, cash)?
- **Obi's run.** Foot sliding on the jog clip at 3.0 m/s; the turn at the bookshelf; whether he visibly clips the
  sideboard or floor lamp (0.25 m clearance).
- **Uche.**
  - Follow pathing and animation through the door leaves.
  - Hand-in-hand walking with the child, which may need the `carry` clip instead.
  - Two skinned NPCs moving at once on the low graphics tier: `settingsTick`'s auto-downgrade (settings.js:107-120) fires
    below 24 fps.
- **The perimeter beat.** Is Obi kneeling on the drive by the cruisers believable without perimeter officers on screen?
  Canon allows no new characters, so only Uche's radio carries it.
- **Touch.**
  - The UCHE button and order cards: reach mid-run with the left thumb on the stick.
  - Whether one tap for a single job is safe against mis-taps.
  - Landscape row placement.
- **Desktop discoverability.** Does a Senior player ever find Q with no hint?
- **Feel.** Does the run read as a chance rather than a punishment? Does the perimeter cost feel fair? Do the survey answers
  name "he saw me through the cash table"?

---

## 7 · Risks, and the smallest version

### Risks

| Risk | Mitigation |
|---|---|
| **The leak overrides a v13 decision** (no leak penalties) | Narrow trigger (refused **and** exigent, the player's own choice), no time cut, stated on the plan. Needs a product-owner and v13-owner nod. If refused, drop the leak: it is one predicate. |
| Detection feels unfair ("seen behind the sofa") | The why-line names the furniture he saw over; a visible fill starts at the first gain; notice comes before alarm with a look-up; failure is a chase, never a fail screen. The tuning (gain 1.6) is one constant. Watch `seen{alarm}` against "felt unfair" answers. |
| **The brief's sofa and cash table cover is untrue in this room** | Accept it and correct the plan text (preferred), or move Obi. Moving him breaks every SCOPE measurement and his "facing the living room" pose. The furniture is baked and can't move. |
| Quiet entries become an easy "always no wipe" | Desktop's default gait is jog (people_art_pass.js:518) and jogging the flank is safe (16), so that route is lenient by design. Straight at him and loitering both alarm. It is opt-in: knock stays the default without KC. Watch `enc m3_obi.outcome` by approach. |
| The laptop steals ACTION from Obi at the desk front | Obi priority 3 while he's free (§3.10); tested in `tac_m3_flight`. |
| Shared baked materials stay dimmed after a power cut | Restored on `newScene`; tested by building M3 after a cut and asserting `lightMapIntensity === lmMax`. |
| Callbacks after a scene change | **Harness** run 4: a field-skill callback fired after the scene changed, `ENGINE._mansion` was null, and the prototype threw. Every handler guards `S.game.currentMission === 'm3' && ENGINE._mansion && TAC.m3`, and the module clears on `newScene`. |
| The MutationObserver on the plan misses a redraw path | The plan has a single `draw()` that sets `innerHTML` (v12_plan.js:91). The optional one-line hook (§2.2) is the fallback. |
| The playthrough bot loops on the child | `Walk her out` has no choices, and the bot presses every live interactable. Run `v13_port_playthrough` first. |
| The harness tests the wrong house | `m3_lib` asserts `ENGINE._mansion` and 39 obstacles, and `restoreArt` is mandatory. |
| Performance on low phones | One watcher (foundations §3.7: 3 sight tests per tick), Uche's straight-line steering on 16 nodes, one DOM tag. Negligible beside the two skinned NPCs, which are the real cost. |

### The smallest version that still delivers the player-visible change

1. **False outcomes (item 11)** in both houses:
   - the child stays until walked out (`Walk her out`);
   - no knowledge-only rescue;
   - the plan text tells the truth;
   - `PLAN FIRST` and the specific `OPERATION OPEN` wording.
2. **The entry decides the start (item 12):**
   - spawns for knock, loud, quiet front and gate, with the title card;
   - the wipe deferred until an alarm;
   - the loud stun;
   - the MQ `ready` patch;
   - the screen stays locked while pending.
   - Power-cut dimming can follow in the next build; keep only its sight halving and the 12 s delay.
3. **The run and the intercept (item 14):** the flee path, catching him, cornering him, the perimeter with force +1 and two
   choices, and the informant deal for in-house stops.
4. **Obi as a TAC watcher (item 13)** with the gain and the NOTICED tag. The why-line comes free from foundations.
5. **Uche: COVER HIM and TAKE HER OUT** from the single UCHE button. GO ROUND THE BACK and the order cards can follow, since
   with one job offered at a time the button alone works.
6. **The files (item 17):** thresholds, the custody line, the drives-lead getter, the aftermath row.

**Deferred:** the leak (pending its decision), the minimap facing wedge, the sketch's blind-side hatch, the calm child line
(pending the canon check), Recruit hint chips, and the landscape card row.

---

## 8 · Evidence (scratch only; nothing under the repo was modified)

Scratch work lives in the design session's scratch folder (not in the repo).

**Offline scripts:**
- `geo.cjs`: the room model, the 2.5-D sight test, the suspicion formula and grid A*.
- `study1.cjs`: coverage and points.
- `study2.cjs`, `study3.cjs`: attention and gain variants by route.
- `study4.cjs`: the flee path and intercept windows.
- `study5.cjs`: Uche's graph and the child path.

**Harness runs (4 of 4), all against `naceca.html` at 261a000 (checked to contain HEAD's v12_pt and v13):**
- **run 1** (`run1_baseline.cjs` → `runs/run1.json`), today's facts on the art-pass house:
  - plan text; quiet starts the 65 s wipe at the porch at once;
  - Obi's hands go up at z < 4.2;
  - "stay put" completes o5 with her left inside;
  - three arrest choices;
  - extraction succeeds with the wipe still running and no `wipe_end`.
- **run 2** (`run2_proto.cjs`): aborted without output (an early `choose()` on no buttons). It led to the per-case rewrite.
- **run 3** (`run3_proto.cjs` + `proto_m3.js` → `runs/run3.json`, `runs/run3.log`), cases A–J: intercept, perimeter, cold
  flank, frontal alarm, gate and tackle, stay put, Uche, power cut, leak (before the threshold), drives lead.
- **run 4** (`run4_proto.cjs` → `runs/run4.json`, `runs/run4.log`):
  - `casework_warrant` passed with the layer installed;
  - doorway COVER; plan truth and GO delta; leak alarm at 60; the field skill suppressed under a cut; notice then evade.
  - Case Q (the legacy bot) didn't reach M3 (fixture) and is unmeasured.
  - One prototype page error: a field-skill callback after the scene changed, now a guard rule in §7.

`proto_m3.js` is the scratch prototype of `tac_m3.js` used for runs 3 and 4. It is not repo code: it stands in for TAC.sight
with a copy of foundations' formula, and it omits the HUD.
