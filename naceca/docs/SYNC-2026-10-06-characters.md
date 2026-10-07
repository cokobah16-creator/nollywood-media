# NACECA — Phase 2, part 1: characters · 6 Oct 2026

Cumulative: also carries Mission 7 and Phase 1 if they aren't on main yet.

## New characters (`src/systems/characters.js`)
- Jointed toon rig: shoulder → elbow → hand, hip → knee → shoe, neck pivot. Old scene code
  that swings `armL/legL` now rotates from the joint instead of the limb's middle.
- Secondary animation layered on every character: knee and elbow bend, walk bob and torso
  counter-twist, idle breathing, head drift, blinking.
- Faces: eyes with pupils, brows, nose, mouth, ears; options for beard + moustache, glasses.
- Hair/headwear: crop, braided bun, braids, afro, gele, fila/kufi, beret, balaclava.
  Long garments: wrapper, robe, agbada with trim. `build:'heavy'` for Chief Obi.
- Cast: Kelechi (male officer, plate carrier, sidearm in hand; addressed as "sir"/"oga"), Cdr Adaeze (beret),
  Sgt Uche (beard, vest), Chief Obi (agbada + fila), Pa Eze (white robe, red cap),
  Mrs Ehigie (gele + wrapper), Musa (cap, robe), Inspector Chidi (red AKS beret),
  Tobi (glasses), shooters (balaclavas), a varied market crowd.
- `buildNPCMesh(skin, shirt, pants, hair, opts)` — `opts` is optional; old calls still work.

## Mechanics / fixes
- Mansion safe is now a real deduction puzzle (title-day clue, year-first) instead of a toast.
- Every mission starts with the camera behind Kelechi (several scenes spawned facing it).
- Asaba spawn moved so the camera isn't pinned against the back wall.

Playthrough: 21/21 complete, zero JS errors.

## Apply
```bash
cd /path/to/nollywood-media
unzip -o /path/to/naceca-characters-sync.zip -d .
git add naceca
git commit -m "NACECA: jointed characters + cast looks, safe puzzle, spawn camera (incl. M7 + Phase 1)"
git push origin main
```
