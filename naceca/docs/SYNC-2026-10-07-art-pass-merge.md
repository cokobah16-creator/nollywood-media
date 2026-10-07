# NACECA v8.1 — art pass recovered + townspeople · 7 Oct 2026

Cumulative against main @ 3735449 (v7.4): carries v8 (Season 1 finale), the v8 art pass, and the townspeople.

## Why this drop exists
A "v8 art pass" was published straight to the live game without its source reaching GitHub:
skinned, animated Kelechi and mansion cast on Quaternius' CC0 base character and animation library,
a Blender-modelled, light-baked Lekki mansion, and a redesigned HUD (one active objective,
contextual action button, world-anchored prompts, reputation in the Case File).

Its source was recovered from the published page. Rebuilding this tree reproduces that page exactly,
except two module header labels, because the original combined several files under one label:
- `src/systems/people_art_pass.js` — was "systems/people.js + systems/art_pass.js (v8)"
- `src/systems/art_pass_v8.js` — was "systems/camera_tp.js · systems/mansion_art.js · scenes/mansion_v8.js · systems/hud_v8.js · systems/art_pass_flow.js"
- `src/vendor/gltfloader.js`, `src/vendor/meshopt_decoder.js`, `src/assets/_art_inline.js` (1.5 MB of models/textures)
- `build.py` now also inlines local `<script src="src/vendor/…">` / `src/assets/…` tags.

If the original art-pass source files exist elsewhere, prefer them over this reconstruction.

## Townspeople merged on top
See SYNC-2026-10-07-townspeople.md. The only file both sides changed (characters.js) merged cleanly.

## Tests on the merged build
M1–M7 and the finale (routes A, B, C, epilogue) complete. Note for testers: the art pass plays
animated interaction sequences, so `tools/playthrough.py` (which teleports between interactables)
under-counts Mission 3 evidence. Played with waits, M3 collects 3/3 and stops the wipe.
