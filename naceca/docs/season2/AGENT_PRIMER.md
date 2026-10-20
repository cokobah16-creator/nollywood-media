# NACECA Season 2: primer for case builders

ROOT = the original Season 2 workspace (its src13/v13_*.js files are src/season2/s2_*.js in this kit)

## The game
NACECA is a Nigerian anti-corruption investigation game (the National Anti-Corruption & Economic Crimes Agency; all of it fictional): a single page built on Three.js r128. Season 1 (cases m0–m8) is the original game in ROOT/game.html (~12k lines of global functions such as startDialogue, titleCard, showOverlay, showHUD, toast, showMeter/hideMeter, applyEffect, awardXP, showAftermath, collectEvidence). Season 1's dialogue (for voice) is around line 1330 of ROOT/game_code.html.

ROOT/build13.py injects two layers on top: a v12 layer (ROOT/src/*.js) and a v13 layer (ROOT/src13/*.js), one `<script>` per file. Season 2, "Operation Upstream", is cases m9–m15. ROOT/s2/CASES.md is the contract for the season: story, cast, flags, evidence ids, and the beats of every case. Read the section for your case closely.

The dialogue, the documents (PUZZLES + V12.DOCS), the aftermath texts (V13.AFTER) and the phone messages for every case are already written:
- ROOT/src13/v13_dlg_a.js: m9, m10
- ROOT/src13/v13_dlg_b.js: m11, m12
- ROOT/src13/v13_dlg_c.js: m13, m13b, m14, m15, plus assembler helpers in `V13.C` and the season epilogue

`node ROOT/probes/dlgmap.js m10_` lists a prefix's dialogue keys with speakers, choices, flags and `next` targets. **Your job is the case code** that stages the 3D scene and runs those conversations and documents in the right order with the right conditions, and makes the case fun to play.

Several builders work in ROOT/src13 at once. **Only create or edit your own deliverable files**, plus probe files you name after your case under ROOT/probes/. If a shared file (v13_core.js, v13_world.js, the dialogue files…) needs a change, don't edit it. Work around it from your own file (`V13.wrap(name, orig => function(){…})` overrides a global function), or describe the change in your hand-in. The one exception: a plain typo or broken key in your own case's dialogue, which you may fix minimally (say so in the hand-in).

## Read first
- ROOT/src13/v13_core.js: the case framework (API below).
- ROOT/src13/v13_case09.js: a finished case. Copy its patterns: defCase, reset, objectives, build, start, the flow chained through callbacks, evidence quality, finish.
- ROOT/src13/v13_world.js: per-scene lights (V13.LIGHTS) and animated scene parts (V13.world.dress / V13.world.open('gate'|'boom'|'cashdoor'|'doors', v)). Smoke, water, fire and fans are already animated.
- ROOT/art13/env/<scene>.json: the baked scene's meta:
  - anchors `{ name: { pos:[x,y,z], rot, list? } }`, where `list` holds [x, z, rot] spots for crowds and workers
  - obstacles `[x, z, w, d]`
  - bounds
  Game coordinates are y-up, metres.
- ROOT/scen13.js: test helpers.

## The v13 API (src13/v13_core.js)
**Case definition and flow**
- `V13.defCase(id, { title, region, sub, evMax, xp, ambient, objectives(){ return [{id,text}] }, reset(){}, build(){}, start(){} })`
  - loadMission(id) → reset() → the case start screen → beginMission (streams the scene's art) → build() → start() 700 ms later.
  - reset() deletes your case's flags so the case can be replayed.
- `V13.finish(id, xp)`: XP and the aftermath screen (its headline, tip and next text come from V13.AFTER[id], already written). Call `V13.recruitFromFlags()` just before it, so flags such as s2_timi:'source' become informants.

**Scene, people, movement**
- `V13.scene(key, { start:'start', player:()=>mesh })` builds the baked scene, puts the player at an anchor and sets ENGINE.sceneUpdate. `V13.plainClothes()` gives a plain-clothes player mesh.
- `V13.at(key, name)` → {x,y,z,rot}; `V13.list(key, name)` → an anchor's list.
- `V13.person(look, at, { kind, clip, solid, r, id })` → a skinned character.
  - `V13.look(castId, extraOverrides)`: cast ids are in V13.CAST.
  - `V13.crowdLook(i)`: a crowd member.
  - Uche: `V13.person({}, at, { kind:'uche' })`. For plain clothes pass overrides instead of {}, e.g. `{ torso:'#2a6a8a', armA:'#2a6a8a', armB:'#2a6a8a', armC:'#2a6a8a', gear:[] }`.
  - Clips: aim carry crouch down fix folded getup handsup hit idle interact jog kneel no open phone pickup shoot sit sit_talk sneak sprint talk walk yes.
  - Gear names: M: Gear_Beret Gear_Child Gear_Fila Gear_Glasses Gear_Kaftan Gear_Mask Gear_Tactical; F: Gear_F_Afro Gear_F_Beret Gear_F_Braids Gear_F_Bun Gear_F_Gele Gear_F_Wrapper.
- `V13.play(ch, clip)`, `V13.once(ch, clip, then)`, `V13.face(ch, x, z)`.
- `V13.walk(ch, [[x,z],…], { speed, clip, end, face })` → a Promise.
- `V13.follow(ch, { dist })` → a handle; `handle.on = false` stops it, `handle.hold(true)` parks the follower. Use it for a companion (Uche) who keeps up.
- Vehicles (VEH) are placed from scene anchors by dressScene. Check the scene's .json anchors and ROOT/game.html (search for `VEH`) for moving a vehicle.
- Camera: `TPCAM.override = { pos:THREE.Vector3, look:THREE.Vector3 }` holds a fixed shot; `null` returns to the follow cam.
- `ENGINE.movementEnabled`, `showHUD(bool)`, `titleCard(lines, ms, cb)`, `showMeter(id, label, 0..1, 'info'|'danger'|'good', text)`, `hideMeter(id)`, `isOverlayOpen()`.

**Interactions**
- `V13.talk(mesh, label, fn(it), { optional, range, verb })` puts an interactable on a character; `V13.spot(pos, label, fn, opt)` puts one on a point.
- `V13.used(it)` greys it out; `V13.drop(it)` removes it. The player presses E or taps to use. Optional ones aren't required.
- Objectives: `V13.done(id)`, `V13.objDone(id)`; `V13.obj(id, text)` adds one mid-case.

**Dialogue, documents, evidence**
- `V13.say(key, cb)` runs DIALOGUE[key] (it follows choice `next` chains) then cb.
  - Choices with a `flag` set the flag themselves; read the result in cb with `V13.mc().s2_xxx`.
  - `V13.picked(key)` → the index of the choice taken on that dialogue key (for choices without flags).
- `V13.run(name, [keys or line arrays], cb)` splices lines into a one-off conversation.
- `V13.call(/^MR\. KUTI/, key, cb)` shows a phone-call card for the matching speaker.
- `V13.doc(key, ok => …)` opens a document puzzle. Its onCorrect collects the evidence. **Always set `S.game.evQ[id]` explicitly afterwards.** The test helper `solve()` solves it.
  - Never put `←` in a document's screen text. The repo's Senior Agent casework mode (beta) deletes `←` and the rest of its line as a hint arrow. Coloured spans also lose their colour there.
- `V13.ev(id, name, q)` collects evidence with quality 'good' | 'contested' | 'weak'. Quality is what the courtroom (Case 14) and the finale test later, so make it follow from the player's choices. Also `V13.hasEv(id)` and `V13.evQ(id)`.
- `V13.toast(a, b, ms)`, `V13.radio(who, text, ms)` (radio bubble), `V13.text(who, text, ms)` (SMS bubble).
- `V13.skip(lines[], then, ms)`: a time-skip title card.

**Runtime and state**
- `V13.rt` is the per-case runtime (not saved).
  - `V13.every(fn(dt))`: return false to stop.
  - `V13.after(seconds, fn)`.
  - `V13.near(obj, r)`, `V13.dist(obj)`, `V13.looking(obj, cone)`: is the camera facing it.
- Suspicion:
  - `V13.eyes({ label, watchers:[meshes], radius, fov, rate, decay, onMade, extraFn })` runs a meter.
  - `V13.eyesBump(n)` nudges it; `V13.eyesOff()` stops it.
  - Crouch is C (ENGINE.crouch).
- `V13.chase({ runner, path:[[x,z]…], speed, label, onCaught, onEscaped })`: a foot chase with a gap meter.
- `V13.mc()` gives the moral choices (flags); `V13.setFlag(k, v)`.
- `applyEffect({ integrity, publicTrust, agencyFavour, heat, intel })`.
- `V13.s2()` is saved Season 2 state.
- Season 1's outcomes come from the snapshot helpers below (`V13.tobiAlive()`, `V13.s1fate()`, …), never from `V13.mc().asaba` or `V13.mc().finale` directly. Mr. Igbinosa runs the forensic bench, hashes and certifies in every save; a living Tobi reads records and ledger codes (…_tobi keys for that only).

## Shared contracts (the integrated layer, src/season2 — fix pass 2026-10-20)
The integrated kit lives in `naceca/src/season2/s2_*.js` (the `ROOT/src13/v13_*.js` files above). These helpers are in
`s2_core.js` and are what every Season 2 file codes against.

**Casework mode and timers**
- `V13.rec()`: true on Recruit casework (`typeof isRecruit === 'function' && isRecruit()`). On Senior Agent (the default)
  nothing tells the player the next step or the answer: such toasts, radio lines and wayfinding rows are Recruit-only.
  Explaining why something happened is fine on Senior.
- `V13.timeRate()`: `timerRate()` (systems/settings.js): 0.75 Relaxed, 1.2 Hard, ÷1.6 extended, 0 when timed sequences are
  off. Every Season 2 countdown advances by `dt * V13.timeRate()`; a rate of 0 never runs out.

**Season 1 as Season 2 reads it (the snapshot)**
- `V13.s1snap()`: `{ tobiAlive, tobiTestifies, bribe, kcFair, kcWrong, tundeWrong, musaTalked }`. It is taken once, the
  first time a Season 2 case or office loads (`V13.s1snapTake()`, from the `loadMission` wraps in `s2_core.js` and
  `s2_boot.js`), and saved as plain data in `S.game.s2.s1snap`. Before it exists the live values are returned (and no
  `S.game.s2` is created by reading). A Season 1 replay in the middle of Season 2 changes nothing Season 2 reads.
  - `tobiAlive`: `asaba === 'rescue' || (asaba === 'chase' && !S.game._asabaHostageLost)` (canon: systems/finale.js);
  - `tobiTestifies`: `asaba === 'rescue'` (only the deliberate rescue takes the stand);
  - `bribe`: `arrest === 'bribe'`; `kcFair`: `market_runner === 'caught' && choice !== 'force'`;
  - `kcWrong` / `tundeWrong`: `_cwWrong('lagos') === 'kc'` / `'tunde'` (the beta's charge sheet);
  - `musaTalked`: `V12.mem().musaTalked()`.
- `V13.tobiAlive()`, `V13.tobiTestifies()`: read the snapshot.
- `V13.s1fate()`: `S.game.s2.s1fate || moralChoices.finale || 'unproven'`. `s2_merge.js`'s `adaptS1Fate` writes
  `s2.s1fate`; Season 1's own `moralChoices.finale` is never rewritten.
- `V13.s1()`: `{ finale:V13.s1fate(), tobi:V13.tobiAlive(), bribe:<the snapshot's bribe> }` (the old shape).
- A probe that changes a Season 1 outcome after Season 2 has loaded must clear `S.game.s2.s1snap` (or `S.game.s2`) first.

**Dialogue-line fields** (any Season 2 `DIALOGUE` line; Season 1's lines carry none of them and are untouched)
- `rec:1`: the line plays only on Recruit.
- `sr:'…'` (plus `srEn:'…'` for the English of a Pidgin line): on Senior the line plays with this text. On a choice line
  only the prompt changes.
- `cond:"<JS expression over S>"`: the line plays only if the expression is true when the line is reached. It runs as
  `new Function('S', 'return (' + cond + ')')(S)`; an error counts as false. Helpers can be called in it (`V13.tobiAlive()`).
- How it works (`V13.lineFields`, in a `renderDialogueLine` wrap in `s2_core.js`, and once more outermost in
  `s2_boot.js` so the court and case hooks see the line that really plays): lines to skip are stepped over (`DLG.idx++`),
  never removed, so indexes and choice jumps keep working; running past the end ends the conversation. An `sr` line is
  swapped into a one-time shallow copy of the running script (`DIALOGUE` is never changed; the script's own marks such
  as `_pick` are kept).
- Never put `rec` or `cond` on a line with `choices`. A skipped line's `effect` and `trace` are not applied.
- Because of the copy, never compare `DLG.script === DIALOGUE.x`. `DLG.scriptKey` is the key the conversation started
  with (a choice's `next` does not change it); `V13.dlgKey()` is the key of the script or choice branch on screen now.
  `V13.picked(key)` works on both.
- A line that is radioed, texted or toasted instead of played (`V13.radio(who, l.text)`) goes through
  `V13.lineText(line)`: `''` when the line does not play (`rec`, `cond`: `V13.lineOn(line)` is false), its `sr` on
  Senior (`srEn` in English), else its `text` (`textEn` in English). Never radio `l.text` directly: on Senior that
  gives the Recruit line. Skip the radio when the result is `''`. A copied line given a new `text` (Case 11's late
  samples ask) drops the old line's `sr`, `srEn` and `textEn`.
- Phone texts and tips keep their own `cond` (evaluated the same way).

**Documents, evidence, the pause**
- `V13.docFailed(key)`: true when that document failed forward (the misses ran out). A fail-forward and a solve both
  close with `true`, so read this (or Case 12's `evQ === 'weak'`) instead of counting misses. The document's own rule is
  3 misses on Recruit casework and 2 on Senior (v12_docs.js), never the Action pace.
- `V13.ev(id, name, q, xp)` collects (and logs) an exhibit once per operation: after a document's `onCorrect` has
  collected it, it only sets the quality.
- The pause menu over a Season 2 conversation, document, minigame or phone: RESUME puts that overlay and the HUD's state
  back (`s2_core.js` `togglePause` wrap; a LOAD that works does not, and QUIT and ERASE drop the hold; a LOAD that finds
  no save keeps it, so RESUME still brings the conversation back). `V13.ovShown(id)` is true while `id` is shown or held under the
  pause menu: a case's "the document closed without an answer" watcher must use it, or it reads a pause as a back-off.
  Season 2's own screens register with `v13Modal` (v13_intel.js) instead.

**The season's flow and the log**
- `V13.s1Done()` is `S.game.seasonOneComplete` (set when Season 1's epilogue starts, after the trial has sat).
- `V13.syncCards()` makes the Season 2 cards' `playable` current; the mission select and Continue
  (`nextPlayableMission`) both call it, so Continue after a reload goes on with the season (an owed office first).
  Except: before Season 2 has begun (no `s2.started`, no Season 2 case done), while a replayed M8's trial is cut off
  mid-sitting (The Case File's `ctRunFor(finale)`), Continue offers no Season 2 card, so the trial and its epilogue
  resume first (v13_court.js `ctFinalePending`). Once Season 2 has begun, Continue goes on with Season 2.
- At the end of Season 1 with Season 2 on: the last epilogue slide → The Case File's case review (if not yet shown) →
  the `season_one` award and the OPERATION UPSTREAM card → Case 09. The award never comes while the review is open.
- `mission_start` / `mission_end` are logged by v12 (once per case, with the grade; once per office start). Season 2
  logs only an office's own `mission_end` (offices have no aftermath). New event types need a row in
  docs/tactics/DESIGN-tactics.md §4 (`source`, `seal15`, `accuse15` are there).
- Flag-only choices (a `flag`, no `effect`) set their flag in Season 2 cases, offices and the court only; Season 1's
  stay as Season 1 has them.

**Wayfinding on Senior**
- Where our wayfinding's fallback (beta/wayfind.js) would point at the answer among optional decoys, register a
  Senior-only row from the case file: `WAY.OBJ_TARGETS.m10 = Object.assign(WAY.OBJ_TARGETS.m10 || {}, { o10_t4:()=>V13.rec() ? null : { ui:true } })`.
  A null row keeps the old pointer for Recruit.

**Names** (binding; code ids such as `osagie`, `hauwa`, `mamaefe` and `san` stay): Commander Itohan Okundaye
(speaker `COMMANDER OKUNDAYE`, portrait key `OKUNDAYE`), Barrister Zainab Danladi (`BARRISTER DANLADI`), Femi
Olaniran-Cole, SAN (`OLANIRAN-COLE, SAN`, key `OLANIRAN`), Mama Tega (`MAMA TEGA`). `CAST.tobi` is Season 1's Tobi.

## Testing (required)
- **Build into your own folder:** `cd ROOT && NACECA_OUT=ROOT/out_<you> python3 -I build13.py .`
  - A file with a syntax error is SKIPPED with a message, so read the build output.
- **Run a probe:** `cd ROOT && NACECA_OUT=ROOT/out_<you> NODE_PATH=$(npm root -g) flock ROOT/.lane_<A|B> node t13.js probe:<yourprobe> desktop web`, and later `phone` instead of `desktop`.
  - `flock` puts your browser run in a queue shared with other builders. Use the lane you were given and never run browsers without it.
  - The machine has 2 CPUs.
- **Probes** live in ROOT/probes/<name>.js and export `async function (T)`.
  - `T.ev(fn, arg)` evaluates in the page; `T.until(fn, ms, arg)`; `T.wait(ms)`; `T.shot(name)` saves ROOT/shots13/<…>.png (look at it with the Read tool); `T.log(...)`.
  - Helpers from ROOT/scen13.js:
    - `s2start(T, id, prepJS)` starts a case directly, with no hub first. prepJS is code that sets earlier flags and evidence.
    - `use(T, labelRegex)` teleports beside an interactable and uses it.
    - `talk(T, [choiceRegex or index…])` clicks through the open conversation.
    - `solve(T, docKey, wrong)` solves the open document.
    - `waitCards(T)`, `state(T)`, `phone(T)`.
    - `S1DONE` is the Season 1 save.
  - The `s2m9` scenario in scen13.js is a full playthrough to copy from. Several branches can run in one browser session by calling s2start again.
- **Expected console error:** only the VO 404 (`vo/vo01.mp3`). Everything else is yours to fix.
- Look at your screenshots with the Read tool. Check framing, people standing where they should (not in walls or floating), labels readable, and the scene lit. Check the phone layout (844×390) at least once.

## Quality bar
- Play it as a player would: is it clear what to do next (objectives, labels, Uche's radio lines), and is there tension (suspicion, a chase, a timer)? Each decision should feel like it matters.
- No dead ends: every branch reaches V13.finish, and a failure (being made, losing a chase) moves the story on rather than stopping it.
- Case length: about 10–15 minutes.
- Nobody is a stereotype. Nigerian texture comes from the existing writing; don't add new dialogue unless a gap needs a line or two (put such lines in your own file under your case's key prefix + `_x_`).

## Hand-in (your final message)
- the files you wrote
- the flow, with every branch, and the flags and evidence (with quality) each branch produces
- what you could not do
- any change a shared file needs
- the probe names and the screenshot paths I should look at
