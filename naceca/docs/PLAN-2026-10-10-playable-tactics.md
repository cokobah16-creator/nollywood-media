# Next build: Playable Tactics (market + mansion) · plan, 10 Oct 2026

Direction from the product owner: no bigger map, multiplayer, more vehicles, skill-tree expansion or new
engine. Make the existing systems meet on screen in two places: the Ikeja market (M2) and the Lekki
mansion (M3). **Cover works, interception is rewarding, Uche is physically useful, preparation changes
what happens.** Investigation stays the core; nothing here is "harder combat for its own sake".
Starts after the v13 integration lands on main.

## What a read-only scout found today (harness runs against the shipped page)
- **M2 has no stealth.** KC never notices Kelechi: standing next to him, sprinting round him and
  crouching behind him all change nothing. Tunde's "quick and quiet" is flavour.
- **The KC chase is caught by every sprinting player** (32/32, median 1.9 s). Cutting across the road
  already pays (≈ 6.9 s, 0.5 bystanders hit, −1.6 Public Trust) against following him down the lanes
  (≈ 12.3 s, 2.8 bystanders, −8.4 trust), but nothing tells the player, and the route ribbon leads them
  down the lanes behind him.
- **Uche isn't in the market at all**, and in the mansion he stands at the porch for the whole raid.
- **The raid plan changes numbers, not the house.** Four different plans produced identical spawns,
  people, objects and bounds. Obi puts his hands up the moment you enter, whatever the entry.
  Nobody can see you; there is no cover, no guard, no escape. The wipe clock pauses for any dialogue.
- **False outcomes:** telling the child to "stay put" still completes "Secure the child"; knowing about
  civilians adds a rescue at extraction.
- **Interaction bugs:** after the scan, ACTION anywhere at KC's counter picks the spent phone
  ("ALREADY SCANNED") instead of confronting him. 7 of 22 chase-lane edges in the dressed market pass
  through props the player can't (KC runs through crates).
- **Prototype numbers that shape the design:** letting KC dodge from the first corner made the chase
  far too hard (1/10 caught) — keep the authored opening and react only to an officer 4 m ahead. With
  that, Uche posted at the east-lane corner cut average catch time 10.1 → 5.9 s; at the back exit, late
  chases turned into surrenders (3/5); at the wrong gap he barely helped — so *where you post Uche* is
  the preparation hook. In the mansion, Obi faces the living room; the east wall is a blind flank into
  arrest range; his run to the back corridor is 10.2 m (3.4 s) against your 14.4 m from the porch.

## Plan (in order)
### Phase 0 · foundations (small)
1. **Interaction resolution:** spent targets step aside (the scanned phone, a decided KC, an arrested
   Obi); a tap on nothing shows a short "Nothing in reach — <objective> is 3 m away", rate-limited.
2. **Chase lanes that match the baked market** (no running through crates).
3. **Collision data the vision can trust:** heights and "ghost" tags on the invisible legacy boxes.
4. **Crouch that works everywhere and shows on screen** (desktop chip; hold or toggle setting).
5. **Radio priority and expiry**, so Uche's callouts arrive when they matter.
6. **Harness fixtures for the real (art-pass) market and mansion layouts.**

### Phase 1 · the market
7. **KC looks up.** One shared sight-and-noise module (cone ≈ 100°, shorter in the dark; crouching
   behind something lower than you breaks sight; standing beside a bystander hides you; running is heard)
   with the existing eye HUD saying *why* ("he saw you crossing the open road, standing").
   How you approach decides how the confrontation starts (cold grab, or a chase with a head start).
8. **Interception the game notices, rewards and teaches:** a cut-off is called out ("CUT HIM OFF"),
   costs fewer bystanders, keeps Public Trust, and the route ribbon shows the cut, not the tail.
9. **Uche on the ground:** post him before you move (east-lane corner, back exit, the van). KC avoids
   him; if KC passes him, Uche tackles him on screen.
10. **Tunde buys KC's route** depending on where you meet him and what you choose; preparation text
    becomes true in the market.

### Phase 2 · the mansion
11. **Remove the false outcomes** (the child, civilians, the wipe prediction, refusal wording).
12. **The entry decides where you start and when the wipe starts:** knock / loud (Obi stunned ≈ 2.5 s)
    / quiet front / quiet via KC's side gate (start in the back corridor — the reward for treating KC
    fairly) / power cut (house dims, his sight halves, remote trigger late).
13. **Cover works on the quiet entry:** Obi at the laptop facing the living room; sofa, armchairs and
    cash table hide you if you crouch; the east wall is a blind flank; a NOTICED meter by his head; at
    100% a toast names the cause. Reach him unseen and there's no wipe at all.
14. **Obi runs for the back door — intercept him** before the corridor end (no force on the record,
    better options in the arrest dialogue); if he gets out, the perimeter team takes him in the yard
    (canon holds: Obi is always arrested at Lekki) at a cost.
15. **Uche does physical work:** follows you in; COVER HIM (Obi won't run), TAKE HER OUT (carries the
    child out — the real rescue), or holds the back door and tackles Obi in front of you.
16. **Preparation shows up on the ground:** t_sims lights Obi and the laptop from the start; KC fair
    unlocks the side gate; Street Sources calms the child; a leaked warrant means Obi starts alerted.
17. **The recovered laptop is worth something:** which of Obi's files survived depends on how fast you
    stopped the wipe, and feeds the next briefing.

## Measuring it (the existing playtest log, no second system)
Already shipped on the session branch (v12_pt.js): per-objective time/walked/efficiency/arrow use,
stuck, away, hints, interaction outcomes (progress / opened / refused / noop), misses with distance,
refusals, chase_end, wipe_end, choices, device on every event, build stamp, and the two post-slice
questions ("What was your most satisfying decision?" / "What happened that felt unfair?") after the
mansion aftermath. This build adds: **seen** (who, distance, angle, line of sight, crouch, gait, light,
crowd, cause, the exact line shown), **evaded** (how the suspicion drained: cover / crowd / distance /
dark), **order** / **ally_done** for Uche, **enc** per encounter (approach, outcome, prep used) and an
**m2_summary**.

## What only real rendering and real devices can tell
The harness stubs three.js, so it can't show whether cover *looks* like cover, whether the dimmed
mansion reads as dark (it's baked-lit), whether canopies hide KC from the camera, how the chase feels on
a phone, or whether chase lanes clear the baked geometry visually. Needs: cdnjs.cloudflare.com,
fonts.googleapis.com and fonts.gstatic.com allowed in the environment for headless real-render checks,
and the observed playtest with a mixed desktop/phone group.

Scout data: scratchpad tactics/SCOPE.md (full findings with file:line, harness scenarios and numbers).
