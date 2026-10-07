# NACECA — Phase 2, part 2: one real mechanic per mission · 7 Oct 2026

Cumulative: also carries M7, Phase 1 and the character rig if they aren't on main yet.

## New systems (`src/systems/pressure.js`)
- **HUD meters** — countdowns and gaps shown above the prompt; pulse when urgent.
- **Obstacles** — axis-aligned blockers with wall-sliding (market stalls use them).
- **Foot chase** — a runner follows a path; close the gap to catch him or he's gone.
- **Crowd knock-downs** — sprint into a bystander and they fall (−3 Public Trust; −1 walking);
  runners barging through the crowd stumble too.
- All timers pause while any screen is open. Dialogues that arrive while another
  conversation or puzzle is open now queue instead of replacing it.

## Per mission
- **M2 Market** — KC shoves a tray at you and bolts through the stalls. Traders with
  head-loads stand in the shortcut lanes. Caught → the existing choice; escaped → new
  outcome (`market_runner_escaped`), −4 Agency, −5 Intel.
- **M3 Mansion** — remote-wipe clock starts when the squad commits: quiet 80 s,
  knock-and-announce 55 s, loud 40 s. Stopping it early recovers more intel; letting it
  finish blanks the drive (−10 Intel, −4 Agency).
- **M4 Checkpoint** — new "Confront Musa with the papers": find the claim the documents
  actually break (licence and logbook vs "five years on this road"). He flips and names
  the Bypass pickup ("Engineer", filling station before Ugbowo) — 4th evidence item.
- **M6 Asaba** — Ifeanyi physically runs a loop to the van; Tobi's 35 s smoke clock is on
  screen from the breach. Hesitate and lose both → new `asaba_resolve_failed` + headline.

Playthrough: 21/21 complete, zero JS errors. Failure paths (KC escapes, drive wiped,
Asaba hesitation) verified separately.

## Apply
```bash
cd /path/to/nollywood-media
unzip -o /path/to/naceca-mechanics-sync.zip -d .
git add naceca
git commit -m "NACECA: chase/wipe/interrogation/smoke-clock mechanics (incl. M7, Phase 1, characters)"
git push origin main
```
