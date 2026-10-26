# NACECA · Playable Tactics, Build 1 · sync notes · 11 Oct 2026

The product owner's direction: no bigger map, multiplayer, vehicles, skill tree or engine — make the market and the
mansion play. **Cover works, interception is rewarding, Uche is physically useful, preparation changes what happens.**
Investigation stays the core; being seen is never worse than today's flow. Design: `docs/tactics/DESIGN-tactics.md`
(binding; §13 has the integration decisions), with the four area specs and their critiques beside it.

## The layer
- `src/tactics/` (11 scripts, 4 stylesheets) loads after the beta. The only existing file edited is `build.py` (one
  block). Delete `src/tactics/` and that block and the game is the v13 build again.
- Every behaviour change is a `V12.wrap`, a property wrap or an in-layer data change; story canon, characters and
  models are untouched (Obi is always arrested at Lekki).
- `TAC` (src/tactics/tac_api.js) is the shared API: lifecycle, player state, sight and noise, geometry, lanes,
  radio, interaction, HUD hooks. Its event contract (DESIGN §4) is what the playtest log records.

## What the player sees
**Everywhere (Phase 0)**
- Spent targets step aside: after the scan, ACTION at KC's counter confronts KC instead of re-picking the phone.
- A press on nothing says why: "Nothing in reach — <objective> is N m away" (Senior names only the tracker's target).
- KC's chase lanes match the dressed market (he no longer runs through crates).
- Crouch: Settings › GAMEPLAY › Crouch (Auto / Hold / Toggle); a desktop chip shows while crouched; crouched speed is
  1.25 m/s.
- Radio priority: Uche's callouts jump the queue and stale lines expire.
- The eye (paper palette) shows how much a watcher has noticed, with a line saying **why** ("He can see you walking
  on the open road, standing", "He can hear you sprinting behind him"). It explains; it never says what to do.

**The market (M2)**
- After Tunde, KC alternates head-down on his phone and short look-ups. Reach him unseen: **CAUGHT COLD**, a quiet
  arrest with no chase. Half-noticed: he runs without the tray shove. Seen: today's chase, word for word.
- Lifting his phone while he's looking up is seen ("He saw you lift his phone"); while his head is down it isn't.
- Meeting Tunde in KC's view (the road side) makes KC wary; from the stall side you learn his habit instead.
  Choosing "quiet" gets KC's route and the back gate on the minimap.
- Sgt. Uche stands by the van. Talk to him to post him at the back-lane corner (KC veers off; Uche tackles him if he
  passes), the back gate (crouched, hidden — KC runs into him) or the van (he radios where KC is). He jogs there.
- **CUT HIM OFF:** get in front of the running KC and he stops with his hands up — nobody tackled, +2 Public Trust.
  Measured: the corner post halves the median catch time (11.1 → 5.6 s); no chase cell is worse than today.

**The mansion (M3)**
- The plan tells the truth (no "find the laptop", wipe lines say when it starts). The entry decides where you start
  and when the wipe starts: knock (Obi runs at 2.5 s), loud (he cowers 2.5 s, the wipe starts at once), quiet front,
  or quiet via **KC's side gate** (only if you treated KC fairly) into the back corridor.
- On a quiet entry Obi is at his desk facing the living room: doors, walls, the armchair (crouched) and the east
  wall hide you. Reach him unseen and he never starts the wipe — all 7 files survive.
- Once alarmed he runs for the kitchen door. Stop him in the house: four arrest choices, nothing on the force record.
  If he gets out, the perimeter team holds him in the yard: worse headline, two choices, grade −5, never force.
- Uche follows you in; one job at a time: **COVER HIM** (he won't run) or **TAKE HER OUT** (the real rescue). With the
  side gate or Squad Trust he starts at the kitchen door and tackles a runner.
- False outcomes are gone: "stay put" no longer completes "Secure the child" (she needs walking out), knowing about
  civilians no longer adds a rescue, and there's no fake "LAPTOP WIPE RUNNING" before a wipe exists.
- Power cut: the house dims, Obi sees 4.5 m instead of 9, the wipe gets +12 s.
- The recovered laptop's files depend on how fast you stopped the wipe ("Imaged by forensics: N of 7 files") and
  feed the drives lead.

## Playtest kit
- The playtest log (no second system) now records `seen` (who, distance, angle, line of sight, crouch, gait, light,
  crowd, cause and the exact line shown), `evaded` (how it drained), `seen_read` (how long the reason was on screen),
  `order` / `ally_done` for Uche, `enc` per encounter (approach, outcome, preparation), `m2_summary`, `m3_summary`,
  `ov_dwell`, with caps per event type and a size guard.
- Settings › PLAYTEST: NEW PLAYER (a label and a device id), START AT M2 (short sessions), a Summary sheet that answers
  the four questions (where they got lost, which interactions failed, whether they understood why they were seen,
  whether they used more than one approach), SEND LOG (share sheet on phones, a file on desktop). The Player and
  Summary rows appear only with a label or `?pt=1`.
- `node tools/pt_report.cjs <folder of exports> [--player B7QX·P3] [--md report.md]` prints the same answers per
  player and across players, offline.
- **Facilitator protocol:** `docs/PLAYTEST-PROTOCOL.md` (the slice, what to watch, the two questions verbatim, export
  and CLEAR).

## Tests
`node tools/harness/run.cjs tools/harness/scenarios/<name>.cjs [--html <abs>] [--w --h --touch 1]`.
New: `tac_*` (foundations, market `tac_m2_*`, mansion `tac_m3_*`), `pt_*` (the kit; `pt_slice_m2` / `pt_slice_m3`
check the real market and mansion events against the contract — run them with `PT_SLICE_STRICT=1`).
`tac_m2_matrix` is the market balance gate (20 seeds × 27 cells, paired with today's behaviour: no cell may be worse).
The whole existing suite (wayfind, board, casework, v13, pt_logger, visual) runs unchanged on top.

## Needs a real device or real rendering (DESIGN §9)
The harness stubs three.js, so these are open: whether crouched cover *looks* like cover; whether the dimmed mansion
reads as dark on a phone; KC's look-up at 10–14 m; whether "in front of him" is readable on a phone for CUT HIM OFF;
the UCHE button's reach; frame time with two watchers on a low-end phone; the share sheet on iOS and Android. Real
render checks need cdnjs.cloudflare.com, fonts.googleapis.com and fonts.gstatic.com allowed in the environment.

## For the product owner
- **"Hints when stuck"** defaults to On even on Senior Agent; its 60 s "Try this next" toast names the next objective.
  Should Senior default it Off? (Outside this layer; one settings default.) Decided 24 Oct: a Senior Agent start sets it
  Off, a Recruit start On (DESIGN-tactics.md §11.8).
- Defaults taken: the warrant leak stays off (v13 removed leak timers); the sofa and cash table don't hide a crouched
  player (measured), so the armchair, doors, walls and east flank are the cover; +2 Public Trust per clean catch; the
  cut ribbon ships off until it passes the balance gate; hold-to-crouch on touch is opt-in.
- Copy to confirm: Tunde's bridging line when KC sees you ("He's looking this way, sir! He's seen us. He can't hear
  what we're saying, though." / pidgin), Pursuit Lines and Grey Man descriptions.
