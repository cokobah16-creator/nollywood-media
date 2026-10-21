# Phase 0 foundations + the shared sight-and-noise module

Design spec · plan items 1–6 and the shared part of item 7 · written against `claude/naceca-bundle-integration-133395 @ 261a000`.
Every file:line below was checked against that commit. Nothing under the repo was modified; scratch work is listed in §8.

## 0 · What this delivers, in one paragraph

A removable layer `src/tactics/` (6 scripts + 1 stylesheet), appended after the beta in `build.py`. It wraps existing global
functions and edits no source file other than `build.py`. Five changes are visible to the player in Phase 0:
1. A spent target no longer steals the action button.
2. A tap on nothing says why nothing happened.
3. KC stops running through crates.
4. Crouch slows you on every rig, shows on a desktop chip, and can be set to hold or toggle.
5. Uche's radio callouts jump the queue and expire when they go stale.

The layer also ships the geometry data and the `TAC.sight` module that Phase 1 (KC) and Phase 2 (Obi) register watchers with.
The module is dormant until a watcher is registered.

**Measurements that change the brief.** These came from my own harness runs and a decode of the baked GLBs (§8):
- **The 12 legacy market stall colliders are not invisible.** Each sits on a real baked counter, but the counter is rotated
  90° against its collider. The counter is 0.9 m along x and 2.0 m along z; the collider is 2.1 × 1.7. So each collider is
  0.6 m of invisible wall on both lane-facing sides, and the visible counter is lower than a standing eye (top ≈ 1.0 m).
  For vision they get a "ghost" tag and a measured replacement box. Collision is unchanged.
- **KC's forward cone has no crouch cover at all.** I counted the walkable cells within 12 m in his 100° cone: 479 of 479
  are visible crouched. The only crouch cover near him is behind or beside him (the stall counters), and an 8 cm signboard
  on his stand blinds him in a wedge 17–50° to his left, which includes Tunde's bearing. The market designer must lean on
  the cone, the crowd and attention phases, not on furniture.
- **KC sees the m2 spawn.** With a 12 m lit range, the step-out point (0, 9.4) is 9.65 m from KC and 34° into his cone, so
  his watcher must be gated (see §3.7).
- **From Obi's desk only the armchair hides a crouched player.** Measured tops: sofa back 0.93 m, cash table 0.57 m,
  armchair 0.96 m. The sofa stands against the west wall facing Obi, so there is no "behind" to crouch in. Of 441 interior
  cells in Obi's cone, crouching hides 18, all of them behind the armchair. The sofa and armchairs are baked into the single
  `Room` mesh, so they cannot move. The east flank (85–100° off his facing) is the real cover.
  Plan item 13's "sofa, armchairs and cash table hide you" is therefore only true for the armchair.

---

## 1 · What the player experiences

### 1a · Interaction resolution

**Market, after the scan. Desktop and phone.**
- **Today:** standing where you scanned, at 91 of the 209 reachable cells around KC's counter, the world label says "Scan suspect
  phone", the button says INSPECT, and E or a tap gives "ALREADY SCANNED · Confront the suspect" (measured).
- **New:** the moment the scan's puzzle closes, the world label flips to **"Confront teen suspect"** and the button to **TALK**.
  E or a tap starts the confrontation. Measured with the prototype: the phone wins at 0 of 209 cells and KC at 209.
- Once you have decided KC's fate, his label steps aside the same way if anything else is in reach.
- A spent target that is alone in reach still answers with its existing refusal toast. Nothing goes silent.

**Mansion, after the arrest.**
- Obi kneels. Standing between the desk and the safe, the label offers **"Search the open drawer"** or **"Crack the safe"**.
  Today "Move on suspect" wins at 13 cells where the drawer or safe is in range (measured); with the change it wins at 0.
- After the raid brief, Uche's "Plan the raid / Brief" label steps aside in the same way.

**A tap or E with nothing in reach.**
- **Desktop:** the hint chip at bottom centre shows *"Nothing in reach — Speak with informant Tunde is 6 m away"* for 1.8 s.
  That exact line was produced by the prototype in the harness.
- **Phone:** the same chip sits under the radio strip (its existing touch position), with a 8 ms haptic tick.
- **Target just out of reach.** If the nearest target is within its range + 1.5 m, the chip reads *"Move closer — Scan suspect
  phone"* instead.
- **Rate limit:** a second press within 4 s shows nothing new.
- **Suppressed** during a chase or tail, in a staged interaction (`ENGINE.seq`), with any overlay open, in the car, and when a
  teaching hint chip is already on screen.
- **Senior Agent:** the line only repeats what the HUD tracker already shows (its text and its distance). It never names a
  target the tracker does not. When the tracker has no distance (a UI objective), the line has none either. This is
  feedback, so it shows on both difficulties.

### 1b · Chase lanes that match the baked market

The visible change: KC no longer runs through the crate stacks at either end of the east lane, nor through his own phone
stand. The red route ribbon follows his path, so it stops being drawn through crates.
- **North end:** the east lane bends round the crate stack. Its nodes move from (12.6, 12.5) and (12.6, 17.5) to (11.43, 11.4)
  and (11.43, 17.5).
- **His stand:** he slips through the 1 m gap behind his own stand.
- **South end:** he takes the last stretch to the back exit along the west lane and across at z −18.6, instead of through the
  crates at (12.2, −17.4). He still stalls at the same dead end, (12.6, −20.5), which is the parked okada that blocks the
  exit ("The back exit is blocked"). The authored path is still 45.9 m, so the timing to the dead end is unchanged.

### 1c · Collision data the vision can trust

Nothing changes on screen and collision is identical. What changes is that every obstacle now carries a vision tag. Phase 1
and 2 inherit the effect: crouching close behind a 1 m counter hides you, standing does not, and the invisible 0.6 m ends of
the legacy stall colliders hide nobody.

### 1d · Crouch everywhere, visible, hold or toggle

- **Desktop, hold mode (the default):** while C is held a chip sits bottom-left (the reputation panel there is hidden on
  desktop): `[crouch icon] CROUCHED · release C`. Kelechi moves at 1.25 m/s.
- **Desktop, toggle mode:** C crouches and C again stands. The chip reads `CROUCHED · C to stand`. Shift (sprint) stands
  you up.
- **Phone, toggle (the default, as today):** the CROUCH button (66 px) lights while crouched. Sprint clears crouch (existing
  `setSprint`).
- **Phone, hold mode:** crouch lasts only while a finger is on the button.
- **Setting:** Settings › GAMEPLAY › **Crouch: Auto / Hold / Toggle**. Auto means hold on a keyboard and toggle on touch. The
  note is worded per device, so no key names appear on touch.
- **Fallback rig:** today it does not slow down when crouched (measured 3.0 m/s). With the change it moves at 1.25 m/s with or
  without Shift (measured with the prototype wrap).
- **What crouch does:**
  - Speed: 1.25 m/s.
  - Noise: heard at 1 m instead of 2.5 m walking.
  - Height: your silhouette drops to 0.8 m for sight lines, so anything taller than that, close in front of you, hides you.
  - It still lets you pass under `crouchOnly` obstacles.
  - Crouch and sprint never combine; crouch wins.

### 1e · Radio priority and expiry

- **Ordering:** a callout from Uche (for example "He's doubled back — west lane!" in Phase 1) jumps ahead of queued WAVE24
  news and texts. If a news line has already been on screen for 1.2 s, it is cut and the callout shows next. A cut text is
  re-queued; cut news is dropped.
- **Expiry:** a callout that waited past its expiry (4 s by default) never plays late.
- **De-duplication:** two callouts with the same key show once.
- **Unchanged:** lines from existing callers keep first-in-first-out order and their durations.
- **The prototype order (harness, short lines):** `news-1 → urgent → [stale dropped] → text-1 → news-2`.

### 1f · Harness fixtures

None of this is visible to players. The tests run on the layouts players actually see: the dressed market (61 obstacles,
27 camera blockers) and the art-pass mansion (39 obstacles), with deterministic crowds.

### 1g · The sight module

Phase 0 registers no watcher, so the player sees no change yet. Once Phase 1 or 2 registers one, this is what the player
sees, on both platforms.

**The eye.**
- The existing suspicion eye (top centre; 92 px down on a phone) appears while you are within range + 2 m of a watcher that
  is awake.
- It fills as suspicion rises and blinks (its existing `watching` animation) on every tick that he can actually see you.
- While the module drives it, the eye is restyled in the paper palette: ink, manila, and red fill.

**The why line, under the eye.** It names the cause from the last second of input, for example:
- *"He can see you — crossing the open road, standing"*
- *"He can see you by the cash table, crouched in the open"*
- *"He heard you running behind him on the tiles"*
- *"You were within arm's reach"*

At 100% the line freezes in the past tense (*"He saw you crossing the open road, standing"*) and the encounter's own
consequence runs: KC bolts, Obi is alerted. It is never a game over.

**Over the watcher's head.**
- At 35% an eye icon, `icon('eye')`, appears on an ink disc above him.
- At 35% his facing also glances up to 35° toward where he last saw you, for 2 s.
- At 100% the icon becomes `icon('alert')` on red.

**Draining.** If you break sight (crouch behind something taller than 0.8 m, step behind him, stand by a bystander, move out
of range or into darkness), the eye drains at 8% per second. When it empties, the encounter logs how you got away.

**Recruit only:** once per save, a hint chip reads *"Crouch behind something lower than you, keep people around you, or come
at him from behind."* The touch wording says "tap CROUCH". This is the only line that tells the player what to do, so Senior
Agent never sees it.

---

## 2 · Integration points

### 2.1 · New files: the removable layer

```
src/tactics/tac_core.js      TAC namespace, the frame and tick hooks, scene reset, the per-mission summary, the settings row
src/tactics/tac_interact.js  spent table, nearestInteractable decoration, miss line
src/tactics/tac_geo.js       obstacle classification, height tables, vision boxes, TAC.sight.los
src/tactics/tac_lanes.js     MARKET_LANES rebuild, KC path override, lane checker
src/tactics/tac_radio.js     radio priority, expiry and de-duplication
src/tactics/tac_sight.js     watchers, suspicion, causes, seen/evaded telemetry, HUD (eye why-line, head marker, Recruit hint)
src/tactics/tactics.css      crouch chip, eye restyle and why-line, head marker, landscape placement
```
The crouch code (setting, hold/toggle keys and touch, fallback-rig speed, desktop chip) lives in `tac_core.js` to keep the
file count small. It is a self-contained block.

### 2.2 · The one existing-file edit: `build.py`

There is no other existing-file edit. Insert after `build.py:97` (`BETA_JS = [...]`):
```python
TACTICS_DIR = os.path.join(SRC, "tactics")
TACTICS_CSS = ["tactics.css"]
TACTICS_JS = ["tac_core.js", "tac_geo.js", "tac_interact.js", "tac_lanes.js", "tac_radio.js", "tac_sight.js"]
```
Then, after the beta script loop (`build.py:171-176`, before `import hashlib` at `:179`), add the same two loops the beta
uses: style ids `tac-<name>` and the `</script` guard. Why it is unavoidable: layers are concatenated only by `build.py`.
Deleting `src/tactics/` plus these lines removes the layer completely.

### 2.3 · Hooks

Every hook is a `V12.wrap` (v12_core.js:23-27) or a direct mutation from inside the layer. Because the layer loads last,
each wrap is the outermost one.

| Target | Where (as of 261a000) | How | Why |
|---|---|---|---|
| `nearestInteractable()` | people_art_pass.js:557-569 | wrap: decorate any undecorated interactable, then call the original | spent targets get priority −1 (§3.1). Callers pick the wrap up through the global name: `tryInteract` engine.js:632, `updateInteractPrompt` art_pass_v8.js:2413, and v12_pt.js:117. |
| `tryInteract()` | engine.js:631-634 (inner wrap v12_pt.js:115) | wrap: resolve the target before the original runs; if none, show the miss line after it returns | 1a miss line. v12_pt still logs `interact_miss`. |
| `startChase(cfg)` | pressure.js:60 (inner wraps v12_core.js:266, chase.js:156, v12_pt.js:182) | wrap: when `cfg.runner === ENGINE._marketKC`, swap in `TAC.lanes.KC_PATH` | the authored path literal at market.js:157 crosses a crate. The inner wraps see the new path. |
| `MARKET_LANES` (const) | market.js:8-13 | mutate in place at layer load: `nodes.splice(0, n, …)` and `edges.splice(…)` | the lane graph (§3.3). Proven in the harness: wayfind_escape, wayfind_catch and wayfind_chase pass. |
| `updatePlayerLegacy(dt)` | engine.js:506-553 (speed at :508) | wrap: while KeyC is held, scale `ENGINE.speedMul` by 1.25/3.0 (or 1.25/5.2 with Shift) and restore it after | fallback-rig sneak speed (today 3.0 m/s). `MOVE.sneak` is people_art_pass.js:490 and its use is at :515. |
| keydown/keyup for C and Shift | engine.js:285-303 (`bindInput`) | capture-phase listener on `window` that runs first; toggle mode only; ignores inputs and textareas and any open overlay | toggle crouch. Hold mode is untouched, plus `blur` clears KeyC. |
| `ensureHudV8()` | art_pass_v8.js:2355 (crouch tap :2372, inner wrap v13_boot.js:108) | wrap: add the desktop `#tac-stance` chip; hold mode adds touchstart/touchend on `#ctx-crouch` and a capture `click` blocker on `#hud-ctx` | crouch chip and hold-on-touch. `setSprint` (:2387) and the crouch reset in `beginMission` (:2652) are reused as they are. |
| `SETTINGS_UI` / `SETTINGS_DEFAULT` | settings.js:135 / :14 | push a `crouch` row after `hints`; `SETTINGS_DEFAULT.crouch = 'auto'`; fill it in if undefined (the v12_core.js:452-456 pattern) | the hold/toggle setting |
| `radioLine(speaker, text, ms, opts)` / `_radioNext` / `clearRadio` | onboarding.js:26-43 | wrap `radioLine` (classify, enqueue); replace `_radioNext` (same markup, the next item by priority and expiry); wrap `clearRadio` (kill the timer) | §3.6. `RADIO.queue` is still the queue, so `clearRadio` and the existing callers keep working. |
| `updatePressure(dt)` | pressure.js:202 (called only while playing, engine.js:654; the harness stepper calls it too) | wrap: `TAC.tick(dt)` after the original | 10 Hz sight ticks. Frozen under overlays; deterministic under `__wf`. |
| `updateMarkers()` | art_pass_v8.js:2451 | wrap: position head markers each frame (one projection per active watcher) | §1g marker |
| `newScene(opts)` | art_pass_v8.js:2528 (inner wraps chase.js:180, wayfind.js:370) | wrap: drop watchers, vision cache, eye and markers | scene isolation. `ENGINE._dress` is reset at :2532. |
| `completeMission(id, opts)` | mission_flow.js:206 (inner wrap v12_pt.js:177) | wrap: log `tac_mission`, then call the original | per-mission summary, including silent m2 |
| `setEye(frac, mode)` | onboarding.js:56-73 | reused, not wrapped. TAC adds `<div class="eye-why">` inside `#eye-ind` and toggles `body.tac-eye` | the existing eye HUD. The courier (prologue.js:266) and the car (v12_car.js:1123) never run alongside a TAC watcher, and TAC yields when `TAIL.active`, `body.v12-car` or m0. |
| `ICONS` (const) | beta/icons.js:8 | add `ICONS.crouch` (as art_pass_v8.js:2335), reused as `icon('crouch')` | the chip icon; no glyphs |

**Not hooked, on purpose:**
- `dressScene` (art_pass_v8.js:1077). Classification is lazy: it reruns when `ENGINE.obstacles` changes identity or length,
  and reads `ENGINE._dress.key` and `.meta` (set at :1145). That also catches obstacles added after the build:
  `EXTRA_OBSTACLES` at :2661 and `v12_street` people at v12_street.js:20.
- `addObstacle` (pressure.js:38) and `blockedAt` (:42). Collision is unchanged. New code that needs a tagged obstacle calls
  `TAC.geo.add(...)`.
- `WAY.losTest` (chase.js:57). The chase's last-seen test stays as it is; see the risks in §7.

### 2.4 · State read and written

**Read:**
- `S.game._marketScanned`, `_marketTunde`, `moralChoices.market_runner`, `moralChoices.arrest`, `_mansionPreBriefed`, `_civChild`,
  `_evLaptop`, `_wipeLost`, `_evCash`, `_evSafe`, `_drawerSearched` (spent predicates only)
- `ENGINE.obstacles`, `ENGINE._dress`, `ENGINE.npcs`, `ENGINE._marketCrowd`, `ENGINE.keys.KeyC`, `ShiftLeft`, `ShiftRight`
- `SETTINGS.difficulty`, `SETTINGS.hints`, `SETTINGS.crouch`; `isRecruit()` (settings.js:52); `V12.has('greyman')`
- `WAY.resolve()` and `WAY.trackerText()` (wayfind.js:179, :220); `CHASE.active`, `TAIL.active`, `ENGINE.seq`, `isOverlayOpen()`

**Written:**
- Obstacle objects get a `vis` property (`{kind, h, name, box}`); `blockedAt` never reads it.
- Interactables get `_tacSpent` and a wrapped `priority` function. The original priority is kept as the fallback.
- `SETTINGS.crouch` (device setting).
- `S.game._hints.tac_sight` and `.tac_noise` (the existing once-per-save hint ids, Recruit only).
- **Nothing else goes into `S`.** Watcher suspicion lives in `TAC`, not `S`. The rule for Phase 1 and 2: never write per-tick
  values into `S.game.flags`. `progressSig()` (guidance.js:18) hashes the flags, so a per-tick write would read as progress
  and silence `stuck` and the 60 s hint. Write only encounter outcomes, once.

### 2.5 · Save compatibility

- Old saves load unchanged. `loadGame` merges defaults (state_save.js:13-33) and nothing new is required in `S`.
- An operation in progress always restarts at its start (`resumeCampaign` → `loadMission`), so there is no runtime TAC state
  to restore.
- Settings: `loadSettings` merges `SETTINGS_DEFAULT` (settings.js:27-30). An old settings blob without `crouch` gets `'auto'`,
  which is today's behaviour on both platforms. RESET TO DEFAULTS includes it.

### 2.6 · The v13 layer and the beta

- **v13** does not wrap any hook above. v13 bulletins (`radioPlay`, v13_intel.js:627-635) call
  `radioLine(RADIO_STATION, …)`, which is classified as priority 0 with a 25 s expiry. `I().radio[mid]` is recorded before
  `radioLine` is called, so `v13_a_radio`'s assertions are untouched. `v13_e_spoilers` re-wraps `window.radioLine` at
  runtime on top of ours and still sees every line.
- **Beta:**
  - The KC path swap happens before `chase.js`'s and `v12_core`'s `startChase` wraps run, so speed tuning, the ribbon and the
    `chase` and `chase_end` logs all see the new path.
  - `wayfind.js` target resolution is untouched.
  - `casework.js` wraps `beginMission` and `startDialogue`; there is no overlap.
- **v12_pt:** its `tryInteract` wrap is inside ours, so `interact_miss` and `interact_result` behave as before. Measured:
  `pt_logger` passes with the prototype layer installed on a fresh page.

---

## 3 · Data and constants (first pass, with where each number comes from)

### 3.1 · Spent targets (`tac_interact.js`)

Matched by label, because labels are the stable keys that wayfind and `mqAttach` already use.

| Label | Spent when |
|---|---|
| Scan suspect phone | `_marketScanned` |
| Confront teen suspect | `moralChoices.market_runner` set |
| Speak with Informant Tunde | `_marketTunde` |
| Brief with Sgt. Uche / Plan the raid with Sgt. Uche | `_mansionPreBriefed` |
| Move on suspect | `moralChoices.arrest` set |
| Calm and escort the child | `_civChild` (the mansion designer re-registers this when "stay put" changes) |
| Inspect laptop / Stop laptop wipe | `_evLaptop` or `_wipeLost` |
| Bag cash evidence / Crack the safe / Search the open drawer | `_evCash` / `_evSafe` / `_drawerSearched` |

- **Rule:** a spent target has priority −1. It still answers if it is the only target in reach.
- **API:** `TAC.interact.spent(label, fn|null)` lets later phases add or remove an entry.
- **Deliberately unchanged:** the laptop's priority-2 rule while the wipe runs (art_pass_v8.js:1713). The wipe is the urgent
  objective, and the mansion designer owns when it starts.
- **Miss line:** shown for 1.8 s, rate-limited to one per 4 s. "Move closer" applies when the nearest target is within its
  range + 1.5 m, the same threshold as v12_pt's `why:'range'`. Haptic 8 ms on touch.

### 3.2 · Vision tags and heights (`tac_geo.js`)

Heights were measured from the baked GLBs (decoded with the vendored meshopt decoder). For each obstacle footprint I took
vertical-ray tops and horizontal slices at 0.3–1.9 m. Scripts are listed in §8.

**Classification order:**
1. An explicit `o.vis`.
2. The scene table match: centre and size within 0.03 m.
3. The dressed-market legacy-stall rule.
4. An obstacle with at least 80% of its footprint inside a camera blocker becomes a ghost, and the blocker's 3-D box is used.
5. A box with an NPC at its centre (within 0.05 m) becomes `person`. It is not an occluder; crowd cover uses the NPCs directly.
6. A box whose larger side is under 0.45 m is skipped. Posts, lamps, trees and porch columns never fully hide a 0.5 m-wide person.
7. Anything else is `unknown`: a low box of 1.0 m, counted. Tests assert 0 unknown on both device layouts.

`kind`: `tall` when h ≥ 1.7 (blocks every line through it); `low` otherwise (blocks lines below h); `ghost`, `skip` or
`person` never occlude.

**Dressed market** (`ENGINE._dress.key === 'market'`):

| Obstacle | Vision |
|---|---|
| 12 legacy stalls (±10, ±5/±10/±15; 2.1 × 1.7) | collider `ghost`. Replacement box x cx±0.45, z cz±1.0, h 1.0, "the stall". Measured counter at (10, 5): x 9.55–10.45, z 4.0–6.0, top 0.97–1.11. |
| KC's stand (7.6, 4, 0.75 × 1.2) | box x 7.15–7.75, z 3.45–4.55, h 1.1, "his counter". Plus a sign slab x 6.96–7.04, z 2.8–3.7, y 1.25–1.95, "the sign" (needs a real-render check). |
| crates (12.5, 12.4), (−11.5, 7.4), (−11.9, 17.5) | h 0.6 |
| crates (−11.7, −12.6), (12.2, −17.4) | h 1.2 |
| crates (−12.2, −3.2) | h 0.7 |
| stall (−12.4, 1.4) | h 1.2 |
| stall (−10.45, 1.4) | h 0.85 |
| 20 buildings at x ±18, the EXTRA van (0, 14, 2.5 × 4.6), 5 vehicle obstacles | ghost by the blocker rule. Blocker heights: buildings 7/10.3, van 1.8, danfo 1.755, keke 1.575, taxi 1.26, sedan 1.32, side walls 2.8. |
| 4 okadas | `skip` (see-through, not in the Env mesh) |
| 8 posts 0.3 × 0.3 | `skip` |
| 2 street people (−6.4, −13.2), (−5.1, −14.4) | `person` |

**Legacy market** (the harness default and the art-failed fallback): stall box x cx±1.0, z cz±0.4, h 0.9, which is the
`addBox(…2.0, 0.9, 0.8)` counter at market.js:41. Van h 1.85. People `person`.

**Art-pass mansion** (all 39 matched in the harness):

| Obstacle | Vision |
|---|---|
| walls (side, back, front) | 3.3 |
| door leaves | 2.1 |
| corridor walls and end wall | 2.9 |
| corridor cabinet | 1.16 |
| sofa | 0.93 |
| cash table | 0.57 |
| ottoman (0.32 m) | `skip` |
| armchair | 0.96 |
| lamp table | 1.1 |
| two plants, floor lamp, (0, −3.3) | `skip` |
| sideboard | 0.88 |
| bookshelf | 2.5 |
| desk | 0.78 |
| chair | 0.6 |
| east cabinet | 1.3 |
| Obi's own box | `person` (and skipped as the eye's own box) |
| porch columns | `skip` |
| planters | 0.64 |
| drive cars | 1.41 and 1.56 |
| hedges | 1.2 |
| front wall | 1.93 |
| trees | `skip` |

**Sight heights:**
- Target point: 1.45 m standing (chest and shoulders) and 0.80 m crouched. 0.80 is chosen so that a 0.93–1.0 m counter or sofa
  hides you within about 1 m of it at typical distances (worked example in §3.5).
- Eyes: KC 1.5 (his rig is built at scale 0.9, market.js:124); Obi 1.6; default 1.6.
- `TAC.sight.los`: a 2.5-D slab test. Boxes that contain either endpoint (±0.05 m) are skipped, because watchers stand inside
  their own collision box (Obi, art_pass_v8.js:1842). There is a broadphase on the segment's bounding box.

### 3.3 · Lanes (`tac_lanes.js`)

The replacement for market.js:8-13 has 18 nodes and 23 edges. Ten nodes move or are added. It is connected and every node
has degree 2 or more.

```
nodes: 0(7.6,17.5) 1(11.43,17.5) 2(7.6,11.4) 3(11.43,11.4) 4(7.6,7.4) 5(12.6,7.4) 6(7.6,0) 7(12.6,0)
       8(7.6,-7.5) 9(12.6,-7.5) 10(7.6,-12.5) 11(12.6,-12.5) 12(7.6,-18.6) 13(12.6,-18.6) 14(7.6,-20.5) 15(12.6,-20.5)
       16(8.46,5.0) 17(8.46,3.0)                                   ← round the back of KC's stand
edges: [0,1] [2,3][0,2][1,3] [4,5][2,4][3,5] [6,7][4,16][16,17][17,6][5,7] [8,9][6,8][7,9] [10,11][8,10][9,11]
       [12,13][10,12] [14,15][12,14][13,15]                        ← no [11,13]: the crate stack fills that stretch
KC path (replaces market.js:157):
  [8,4],[8,7.4],[12.6,7.4],[12.6,-2.4],[12.6,-7.5],[7.6,-7.5],[7.6,-12.5],[7.6,-18.6],[12.6,-18.6],[12.6,-20.5]  (45.9 m, as today)
```

**Clearances**, checked against the 61 dressed colliders with no padding:

| | Today | New |
|---|---|---|
| Lane edges crossing a collider | 7 of 22 | 0 of 23 |
| Nodes inside a prop | 2 | 0 |
| Authored-path legs crossing | 1 | 0 |

- Every edge clears every box by at least 0.35 m (KC's body radius 0.3 + 0.05).
- Two documented exemptions: the first 0.6 m of the path, where KC starts beside his own stand as today; and the dead end,
  0.17 m from the okada that blocks the exit.
- All nodes stay inside x 7.6–12.6, z −20.5–17.5, which is the box `wayfind_escape.cjs:64` asserts. The dead end is still
  exactly (12.6, −20.5), as `:60` asserts.

### 3.4 · Crouch

| Gait | Speed | Heard at | Sight target |
|---|---|---|---|
| sneak (crouched) | 1.25 m/s (`MOVE.sneak`) | 1.0 m | 0.80 m |
| walk | 1.55 | 2.5 | 1.45 |
| jog | 3.0 | 4.5 | 1.45 |
| sprint | 5.2 | 9.0 | 1.45 |

- `SETTINGS.crouch`: `'auto'` (default: hold on a keyboard, toggle on touch), `'hold'` or `'toggle'`.
- Desktop toggle ignores key repeat and stands you up on Shift.
- Touch hold sets KeyC on `touchstart` and clears it on `touchend` or `touchcancel`.
- **Gait is measured, not read from a rig.** It comes from the change in the player's position over the last 0.3 s, so it
  works on both rigs and in the harness. Thresholds: still < 0.3 m/s, walk < 2.2, jog < 4.2, sprint ≥ 4.2. Crouched and
  moving counts as sneak. A step longer than 3 m in one tick is a teleport and is ignored.

### 3.5 · Suspicion (`TAC.sight.K`)

These are derived from the two tuned systems the game already ships: TAIL (v12_core.js:244-252: 55 standing / 22 crouched,
+38 too close, decay 7) and the cold-open courier (prologue.js:261-262: 62·(1 − d/20) in a 1 rad half-cone, decay 8).

| Constant | Value | Why |
|---|---|---|
| `fov` | 100° (half 50°) | plan; the courier uses 115° and TAIL 109°, so this is slightly more forgiving |
| `range` | lit 12 m, dark 6 m by default. Watchers pass their own (Obi: 9 / 4.5). | 12 m covers KC's road. The dark range is half, per the plan. Tunde (15.2 m) is outside KC's lit range, so meeting Tunde is not punished by default. |
| sight gain /s | `base × (1 − 0.75·d/R) × gait × attention × rate` | linear falloff like TAIL, but it keeps 25% at the range edge so long range isn't free |
| `base` | standing 55, crouched in the open 22 | TAIL values |
| gait multiplier | still 0.7, sneak or walk 1.0, jog 1.15, sprint 1.4 | movement draws the eye; standing still in the open is slower to notice |
| `attention()` | 0..1 from the watcher (phone down 0.35, working 0.6, up 1) | the designer's main lever |
| crowd cover | a visible, standing bystander within 1.7 m: sight × 0 when still, walking or sneaking; × 0.5 jogging; × 1 sprinting | `coConcealed` 1.7 m (prologue.js:189) |
| close | within 1.2 m and not crouched-and-still: +40/s from any angle, no sight line needed | TAIL +38. 1.2 m is below every interaction range (KC 2.5, Obi 2.7), so arm's length is reachable unseen from behind. |
| noise gain /s | `45 × (1 − d/r_gait) × hearing × rate`, halved through a tall box | market `hearing` 0.6 (crowd noise), mansion 1.0 |
| grace | after 2 s unseen, the first 0.5 s of sight gain counts at 50% | reaction time; "nothing harder for its own sake" |
| decay | 8/s on any tick with no gain; none once alarmed (the consumer resets) | courier 8 |
| levels | notice at 35 (exits below 15), alarm at 100 | 35 gives about 1 s of visible fill before the head marker appears |
| glance | at notice, facing rotates up to 35° toward your last-seen bearing at 2 rad/s, held 2 s | readable "?" without a full 180° lock-on |
| `rate()` | action pace story 0.6, standard 1, **hard 1**; × 0.65 with Grey Man | detection never gets harder than standard; preparation (Grey Man) helps. Heat is left to each encounter. |
| tick | 10 Hz fixed step, at most 3 steps per frame | deterministic in the harness |

**Time to alarm, walking and standing, full attention, R = 12:**

| Distance | 3 m | 6 m | 9 m | 12 m |
|---|---|---|---|---|
| Time to alarm | 2.5 s | 3.1 s | 4.3 s | 7.5 s |

Notice at 6 m comes in about 1.1 s. Crouched in the open at 6 m, alarm takes about 7.5 s.

**Crouch-cover geometry.** Watcher eye 1.6, crouched target 0.8, at 6 m:
- 0.5 m behind a 0.93 sofa, the line crosses it at 0.87 m, so you are hidden.
- 1.5 m behind it, the line crosses at 1.0 m, so you are seen.

So you have to hug the cover.

### 3.6 · Radio (`tac_radio.js`)

- **Call signature:** `radioLine(speaker, text, ms, opts)`, with `opts = {pri:0..3, key, ttl}`.
- **Defaults for callers that pass no `opts`:**

| Speaker | Priority | Expiry |
|---|---|---|
| `RADIO_STATION` (news) | 0 | 25 s |
| `'TEXT · …'` | 1 | none |
| `SGT. UCHE…` (v12_core.js:269, :278, :307 are all tactical) | 2 | 8 s |
| everything else (the cold-open Commander included) | 1 | none |

- **Ordering:** insert before the first queued line of lower priority. A line with the same key replaces the queued one.
  Expired lines are dropped when dequeued.
- **Preemption:** a priority-3 line cuts a showing line of priority ≤ 1 once that line has been up 1.2 s. A cut text is
  re-queued after it; cut news is dropped.
- **Queue cap:** 6. When full, the oldest line of the lowest priority goes.
- **Helpers:** `TAC.radio.say(speaker, text, {pri, key, ttl})` (default priority 2, expiry 4 s) and `TAC.radio.cancel(key)`.
- **Display unchanged:** duration `max(2600, len × 55)` and markup identical to onboarding.js:31-41.

### 3.7 · Sight API (`tac_sight.js`)

This is the API the market and mansion designers build on.

```js
const w = TAC.sight.watch({
  id: 'kc',                 // unique per scene; telemetry `who`
  enc: 'm2_kc',             // encounter id for telemetry
  mesh: ENGINE._marketKC,   // position; facing = mesh.rotation.y unless facing() is given
  he: 'He',                 // subject for the why-line ('She' for a woman)
  eyeH: 1.5, fov: 100, range: { lit: 12, dark: 6 },
  facing: () => yaw,        // optional (radians)
  attention: () => 1,       // optional 0..1
  hearing: 0.6,             // optional, default 1
  surface: 'on the street', // noise phrasing ('on the tiles' indoors)
  crowdCover: true, crowd: () => ENGINE._marketCrowd,   // default: ENGINE.npcs minus watchers and companions
  light: (x, z) => 'lit',   // optional: per-position light ('lit'|'dark'); default from TAC.sight.lights()
  active: () => true,       // false: frozen, eye hidden, nothing logged
  glance: true, marker: true, hud: true,
  onLevel: (level, st) => {},   // 'notice' | 'alarm' | 'calm' (calm after a notice: an evade)
});
// handle
w.state            // see below, updated at 10 Hz
w.reset(v = 0)     // set suspicion (e.g. after the consumer has acted on an alarm); clears the alarm latch
w.unwatch()
// module
TAC.sight.los(ax, az, ah, bx, bz, bh) → { clear, by: 'tall'|'low'|null, name }
TAC.sight.probe(id, x, z, { crouch, gait }) → the state that position would produce (no side effects; for tests and tuning grids)
TAC.sight.zones([{ name: 'the open road', rect: [x0, x1, z0, z1], open: true }, …])   // the why-line's place names; reset per scene
TAC.sight.lights({ ambient: 'lit'|'dark', lamps: [[x, z, r], …] })                  // reset per scene
TAC.sight.conceal(secs, how = 'browse')   // e.g. a JUST BROWSING stall: sight gain 0 while within 1 m of where it started
TAC.sight.top()    // the most alert active watcher's state (what the HUD shows)
TAC.sight.K        // the constants of §3.5, for tuning
```

**`state`:**
```
{ susp, level: 'calm'|'notice'|'alarm', peak, seen, heard,
  dist, angle, inCone, inRange, los: 'clear'|'low'|'tall'|'none', cover, crouch, gait, lit, crowd,
  cause: 'sight'|'noise'|'close'|null, why, place, parts: { sight, noise, close } }
```
`cover` is the name of the box the line passed over or was blocked by. `parts` is the gain from each cause over the last 3 s.

**Why-line grammar**, built from the dominant cause over the last 1 s:
- **Sight:** `${He} can see you|saw you` + an optional verb (`crossing` when the zone is `open`, `walking`, `running`,
  `creeping`) + the place (a zone name, or `N m away`) + the posture (`standing` | `crouched in the open` |
  `standing behind ${cover}`).
- **Noise:** `${He} heard you sprinting|running|walking|creeping` + `behind him|beside him` + `surface`.
- **Close:** `You were within arm's reach`.

**Cost.** Measured in Chromium in the harness: 20,000 sight tests took 52 ms on the dressed market (68 boxes, 2.6 µs each)
and 15.5 ms in the mansion (28 boxes). Assuming a phone is about 5× slower, each test costs about 13 µs. A watcher tick
costs at most 3 sight tests, about 20 distance checks against the crowd, and one noise check. Three watchers at 10 Hz come
to about 1 ms per second of play, under 0.02 ms per frame on average. DOM writes happen only on change (the eye fill when it
moves by 0.5% or more, the why text when it changes); the head marker sets one transform per frame while it is visible.

**Constraint for the market designer.** KC's default lit range (12 m) covers the m2 step-out point. Gate KC with `active()`,
`attention()` or a shorter range, or every player is seen in the first 5 s.

---

## 4 · Telemetry (via `V12.log`; v12_pt adds `dev` to every event)

| Event | When | Fields |
|---|---|---|
| `seen` | a watcher crosses notice (35) or alarm (100); at most one per watcher per level per 10 s | `who, enc, level:'notice'|'alarm', cause:'sight'|'noise'|'close', dist, ang (° off facing), los:'clear'|'low'|'tall'|'none', cover, crouch, gait:'still'|'sneak'|'walk'|'jog'|'sprint', lit:'lit'|'dark', crowd, inCone, parts:{sight,noise,close}, peak, ms (since first gain), why (the exact line shown), place, px, pz, obj` |
| `evaded` | suspicion falls below 5 after reaching notice, without an alarm | `who, enc, peak, secs, how:'cover'|'crowd'|'distance'|'cone'|'dark'|'browse'` (the dominant zero-gain reason while it drained), `crouchPct` |
| `radio` | a **keyed** line is shown, dropped (expired or queue full), replaced, cancelled or preempted | `key, pri, speaker, outcome:'shown'|'dropped'|'replaced'|'cancelled'|'preempted', waitMs` |
| `tac_mission` | `completeMission` (silent included) | `m, crouchMode, crouchSecs, crouchOn (crouch starts), missShown, missSuppressed, radio:{shown, dropped, preempted}, seen:{notice, alarm}, evaded, geo:{boxes, ghost, unknown}` |
| `geo_drift` | once per scene build when the height table doesn't match (unknown > 0, or the mansion has fewer than 39 matches) | `scene, unknown:[[x,z],…], matched, total` — this catches an art change before it reaches players |

Unchanged and still relied on: `interact_miss` (`why`, `want`) and `interact_result` from v12_pt.js:115-150. The spent rule
shows up there as more `progress` and fewer `refused` at KC's counter. No new interaction event is needed.

---

## 5 · Harness scenarios

These go in `tools/harness/scenarios/`, written in the existing style.

### 5.1 · Fixtures: `tactics_lib.cjs`

- `T.seed(h, n)`: seeded `Math.random`, set **before** `lib.start`, so the crowd built by market.js:62-109 is deterministic. My
  own chase matrix wasn't seeded at build time, so its crowd differed between runs.
- `T.deviceMarket(h, o)`: `lib.start(h,'m2',o)`, then in the page it replays dressScene's collision exactly:
  - `for (o of ART_INLINE.env_market_meta.obstacles) addObstacle(...)` (art_pass_v8.js:1134)
  - bounds from `meta.anchors.bounds` (:1141-1142)
  - `ENGINE._dress = { key:'market', meta, D:{}, t:0 }` (:1145)

  It asserts 61 obstacles (15 legacy + 46 baked) and 27 blockers.
- `T.deviceMansion(h, o)`: the art shim (`ART.ready=true`, `VEH.failed=true`, `PEOPLE.make` gives a legacy rig plus an anim
  stub, `MANSION.instantiate` gives an empty Group), then `loadMission('m3')` and `beginMission`. It asserts
  `ENGINE._mansion` and 39 obstacles, and keeps the originals.
- `T.restoreArt(h)`: undoes the shim. This is required: `h.start` resets `ART.failed` but not `ART.ready`
  (run.cjs:65-66), so a leaked `ART.ready` builds the art path in later starts.
- `T.capture(h)` and `T.events(h)`: wrap `V12.log` in the page.
- `T.walk(h, pts, {speed, crouch})`: a scripted walk using `__wf.run` (wayfind_lib.cjs:58-74), which ticks TAC through
  `updatePressure`.

### 5.2 · New scenarios

| Scenario | Setup | Asserts |
|---|---|---|
| `tac_geo_market` | `deviceMarket` | `TAC.geo.classify()`: 0 unknown; 12 legacy stalls are ghost with 12 replacement boxes 0.9 × 2.0 × 1.0; vehicles and buildings are ghost through blockers with heights 1.8/1.755/1.575/1.26/1.32; 2 person; a `blockedAt` grid at 0.25 m identical before and after classification (collision unchanged); `geo_drift` not logged |
| `tac_geo_mansion` | `deviceMansion`, then `restoreArt` | 39/39 matched; walls tall; sofa 0.93, armchair 0.96, cash table 0.57; Obi's box is `person`; `TAC.sight.los` from (4.12, −1, 1.6) to the door (0, 3.6, 1.45) is clear (the watcher is inside his own box) |
| `tac_lanes` | `deviceMarket`, seeds 1–5 | `TAC.lanes.check(MARKET_LANES, KC_PATH)`: 0 crossings, 0 nodes inside, clearance ≥ 0.35 (dead end ≥ 0.15), connected, all nodes in [7.6, 12.6] × [−20.5, 17.5], path 45.9 ± 0.1 ending at (12.6, −20.5). Then a KC chase from 4 sides × reaction 0 s and 4 s with the wayfind_catch pursuer at 4.42 m/s: KC is never inside an obstacle (today: 13 frames on the late run from the counter), and every chase is caught within 30 s (8/8, as today) |
| `tac_interact` | `lib.start('m2')` plus the counter box; `deviceMansion` | after the scan, the phone is picked at 0 cells (today 91) and KC at all 209; `tryInteract()` at (6.8, 4) sets `CHASE.active`; with KC unreachable the phone still answers "ALREADY SCANNED"; mansion after the arrest: "Move on suspect" wins 0 drawer/safe cells (today 13); the `pt_logger` "Test gate" (priority 99) still wins; miss line at (0, 0) matches `/^Nothing in reach — .+ is \d+ m away$/`; a second tap within 4 s shows nothing new; no chip during `CHASE.active` or over a teaching hint |
| `tac_crouch` | `lib.start('m2')`, fallback rig; desktop and `--touch 1` | crouch 1.25 m/s (today 3.0), crouch + Shift 1.25, walk 3.0, sprint 5.2; `#tac-stance` shows only while KeyC on desktop, never on touch; the setting row exists (auto/hold/toggle); toggle: keydown C → crouched, keyup → still crouched, keydown → standing; Shift stands you up; typing "c" in the survey textarea doesn't toggle; touch hold: touchstart/touchend on `#ctx-crouch` set and clear KeyC, and a click doesn't toggle; touch auto behaves as today (toggle) |
| `tac_radio` | real clock, short `ms` | three plain lines show first-in-first-out; bulletin, bulletin, text, then a priority-3 keyed line 1.3 s later shows as `news-1, urgent, text-1, news-2`; a 500 ms-expiry line behind a 3 s line is dropped and logs `radio{outcome:'dropped'}`; the same key twice shows once (`replaced`); `clearRadio()` empties the queue and stops the timer; an existing Uche line (`V12.say('SGT. UCHE', …)`) overtakes a queued bulletin |
| `tac_sight` | `deviceMarket` plus a test watcher at KC (eye 1.5, fov 100, R 12/6), and `deviceMansion` | (a) walking upright on the road at 6 m in the cone reaches notice in ≤ 1.3 s and alarm in ≤ 3.6 s, and logs `seen{cause:'sight', los:'clear', crouch:false, why:/standing/}`; (b) crouched 0.4 m behind a stall counter on the watcher's line gives `los:'low'` and zero gain, standing there gives gain; (c) walking within 1.7 m of a trader gives `crowd:true` and zero sight gain, sprinting there gains; (d) sprinting 6 m behind, outside the cone, gives cause `noise`; sneaking there gives 0; (e) with dark lights there is no gain at 8 m in the cone, and lit there is; (f) an overlay open for 5 s leaves `susp` unchanged; (g) notice, then crouching behind cover, drains to 0 and logs `evaded{how:'cover'}`; (h) story pace × 0.6 and Grey Man × 0.65; hard = standard; (i) mansion: Obi's watcher sees the door and the child, the east flank (3.9, 1.5) is out of the cone, and crouching west of the armchair (−1.85, −2.45) is hidden; (j) 20k sight tests in < 500 ms (reported) |
| `tac_hud` | 390×844 touch, 844×390 touch, 1280×800 desktop | eye plus `.eye-why` visible; computed styles have no gradient, box-shadow or filter and the colours are palette vars; the why-line stays inside a 16 px gutter and doesn't overlap `#radio-sub`, `#hud-mission-objs`, the minimap or `#hint-chip` (`WAY.hudRects`); the head marker is an `svg.ico`, not a text glyph; Senior shows no hint chip at notice; Recruit shows `tac_sight` once per save |

### 5.3 · Regressions that must stay green

- **Already run with the prototype layer installed** (§8; no repo change):
  - `wayfind_escape`: passed. Dead end (12.6, −20.5); KC at (8.69, −18.6) after 40 s; 45 path nodes.
  - `wayfind_catch`: passed. KC caught in 1.63 s; Ifeanyi in 5 s.
  - `wayfind_chase`: passed on a fresh page. Its `stats.built === 1` check is a per-page counter, so it fails only when
    scenarios are chained in one page.
  - `board_van`: passed.
  - `pt_logger`: passed on a fresh page.
- **Still to run once the layer exists:** the full suite.
  - `wayfind_*`: arrow, coldopen, minimap, or, resolve, tracker
  - `board_*`: difficulty, file, herrings, locks, migrate, night, shots
  - `casework_*`: docs, finale, lagos, newgame, replay, route, settings, warrant
  - every `v13_*` scenario
  - `visual_desktop` and `visual_touch`
- **Watch especially:** `casework_lagos` and `v13_port_*`. They drive Uche and Obi; if they use `tryInteract` positionally,
  the spent rule could change which target fires. `v13_a_radio` covers radio classification.

---

## 6 · What only real rendering or a real device can verify

- **Lanes**
  - The 1 m gap behind KC's stand, between his counter and the stall at (10, 5): does KC visibly clip?
  - The dead end 0.17 m from the parked okada: does he touch the bike, and is that acceptable?
  - Do the moved north nodes (11.43, 11.4) and (11.43, 17.5) read as walkable gaps?
  - Does the ribbon look right round the crates?
- **Collision**
  - The legacy stall colliders stop Kelechi 0.9 m short of the visible counter's long side (0.6 m of invisible wall plus the
    0.3 m pad). Does a player notice? This is unchanged by Phase 0, but now known.
- **Cover from the camera**
  - The third-person camera sits about 3.5 m behind at about 1.45 m plus pitch, so the player sees over a 0.93 m sofa or a 1 m
    counter that the watcher can't see through.
  - Does a crouched Kelechi *look* hidden?
  - Does the 0.8 m crouched target match the `sneak` clip's silhouette?
  - Is KC's 8 cm signboard opaque in the art, and does it read as something to hide behind?
- **HUD**
  - Are the eye, the why-line and the head marker legible at 390×844 in sunlight?
  - The why-line against the radio strip in landscape: today the radio sits at 64 px (v12.css:21) and the eye at 92 px
    (styles.css:808). Phase 0 moves the eye to 6 px in landscape, so check the result.
  - The desktop chip's discoverability.
  - The miss chip against the radio strip on touch (the chip sits at 214–272 px).
- **Touch**
  - In hold mode the right thumb holds CROUCH while the left steers, which leaves no thumb to drag the camera. Is hold usable,
    or should touch be toggle-only?
  - Is CROUCH (66 px) reachable mid-move?
- **Radio**
  - Does cutting a WAVE24 line after 1.2 s feel abrupt?
  - Can a callout be read while running?
- **Performance**
  - Two or three watchers plus HUD writes on a low-graphics phone (the auto-downgrade in `settingsTick`, settings.js:107-120, fires below 24 fps).
- **Darkness**
  - Whether the dark ranges match what looks dark (Phase 2, the baked-lit mansion).

---

## 7 · Risks, and the smallest version

### Risks

| Risk | Mitigation |
|---|---|
| A spent predicate hides a repeatable action | the table is explicit and keyed by label; a spent target still answers when alone; later phases re-register entries (the child, Uche orders) |
| The miss line becomes noise or leaks information on Senior | it is built only from what the tracker shows; rate-limited; suppressed in chases, sequences, overlays and the car; it never overwrites a teaching hint |
| The lane change alters chase difficulty | the authored path length and the opening are identical, and every measured run was caught. Per-run times differ with the unseeded crowd: 5.42 s vs 1.63 s from the counter at 0 s reaction (bumps 2 vs 0); 13.5 s vs 17.3 s late (bumps 4 vs 5). `tac_lanes` re-measures with seeded crowds |
| `MARKET_LANES` mutated from a later script | proven in the harness. When the layer becomes permanent, fold the data back into market.js:8-13 and :157 and delete the override |
| Detection players don't understand | every gain carries a cause, and the why-line names it; there is a visible fill before notice; notice glances only 35°; alarm is an event for the encounter, never a fail state; hard pace doesn't speed detection |
| "Seen through a wall" or "hidden by nothing" | every height is measured from the GLBs; 0 unknown boxes is asserted on both device layouts; `geo_drift` logs table mismatches in real play |
| The chase last-seen test (`WAY.losTest`, chase.js:57) disagrees with TAC (height-less; a 0.6 m crate blocks it) | left as is in Phase 0 because the chase tests depend on it. Phase 1 can switch it to `TAC.sight.los` at 1.5 m when the market designer re-tunes last-seen |
| Radio preemption cuts a news line mid-read | only priority 3 preempts, only after 1.2 s, and texts are re-queued |
| Toggle crouch steals C while typing | the capture listener ignores inputs, textareas and open overlays; tested with the survey textarea |
| Hold-on-touch is unusable with one thumb on the stick | auto stays toggle on touch; hold is opt-in; real-device check |
| `ART.ready` leaks in the harness | `T.restoreArt` is mandatory after `deviceMansion` |

### The smallest version that still delivers the player-visible change

Three files: `tac_core.js` (hooks plus crouch), `tac_interact.js` and `tac_lanes.js`, with the `build.py` loop. Its parts:
1. Spent targets step aside and the miss line shows. This fixes the "ALREADY SCANNED" steal at 91 of 209 counter cells and
   the post-arrest steal.
2. The lane and path data: 0 of 23 edges through props, down from 7 of 22.
3. Fallback-rig sneak speed plus the desktop CROUCHED chip, in hold mode only. The setting row can follow.

`tac_geo.js` (the tables) and `tac_sight.js` (the sight module and its HUD) should land in the same build, dormant, because
Phase 1 and 2 are blocked on them. `tac_radio.js` can slip to Phase 1, since nothing in Phase 0 sends a priority callout;
today's Uche lines are rare.

---

## 8 · Scratch work (outside the repo)

All under the design session's scratch folder (not in the repo). The repo
is unmodified (`git status` is clean).

**GLB decode and height survey:**
- `glbgeo.cjs`: decodes the inline meshopt GLBs to world triangles.
- `heights.cjs` → `heights.json`: vertical-ray tops per footprint.
- `slices.cjs` → `slices.json`: horizontal slices from 0.3 to 1.9 m.
- `extents.cjs`, `stallmap.cjs`, `kcstand.cjs`: counter and sign geometry.

**Lane check:** `lanes.cjs` (offline; reproduces "7 of 22").

**Prototypes:** `proto/tac_proto_page.js` (vision tables, 2.5-D sight test, survey, lane data and check, spent decoration) and
`proto/proto_layer.js` (the wraps).

**Harness runs** (4, all against `naceca.html`):
- `proto/probe1.cjs` → `probe1.json`: fixtures, vision surveys, lanes, spent targets, radio order, cost.
- `proto/probe2.cjs` and `proto/probe3.cjs`: wayfind_escape, catch and chase, board_van and pt_logger with the layer
  installed. They wrote no JSON because their chained runs failed on per-page state (`CHASEFX.stats`, the logger's wipe
  state); the PASS results in §5.3 are from their console output.
- `proto/probe4.cjs` → `probe4.json`: pt_logger on a fresh page, the miss line, fallback-rig speed, and the device-market chase
  matrix today vs new.
