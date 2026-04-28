# NACECA Cinematic Asset Manifest

This manifest organizes all production assets needed to push `/naceca-cinematic/` toward the target tactical raid reference image.

## Runtime Routes

- `/naceca/` — playable systems prototype
- `/naceca-cinematic/` — pitch-quality fixed-camera / 2.5D cinematic raid build

## Asset Root

```text
public/naceca-cinematic/assets/
```

---

## 1. Background / Key Art Plates

These are the most important assets for matching the reference image.

```text
public/naceca-cinematic/assets/backgrounds/
  lekki_mansion_raid_bg_3840x2160.png
  lekki_mansion_raid_depth_mask.png
  lekki_mansion_raid_collision_mask.png
  lekki_mansion_raid_foreground_occluders.png
  lekki_mansion_raid_lighting_notes.md
```

### Required Background Details

- Agent Kelechi composition zone on left foreground
- suspect zone on right foreground
- child/laptop zone center
- cash table zone front-center
- desk/monitors zone right
- backup officer/glass door zone rear-center
- exterior compound, palm trees, police/NACECA vehicle lights
- no HUD baked into image
- no text baked into image

---

## 2. Character Models / Sprites

For the 2.5D build, use animated sprite sheets first. GLB models can come later.

```text
public/naceca-cinematic/assets/characters/agent_kelechi/
  agent_kelechi_idle.png
  agent_kelechi_walk_sheet.png
  agent_kelechi_crouch.png
  agent_kelechi_scan.png
  agent_kelechi_cuff.png
  agent_kelechi_profile.png
  agent_kelechi_notes.md

public/naceca-cinematic/assets/characters/suspect_target/
  suspect_target_hands_up.png
  suspect_target_nervous_idle.png
  suspect_target_arrested.png
  suspect_target_reaction.png
  suspect_target_notes.md

public/naceca-cinematic/assets/characters/civilian_child/
  civilian_child_crouched.png
  civilian_child_scared_idle.png
  civilian_child_secured.png
  civilian_child_notes.md

public/naceca-cinematic/assets/characters/backup_officer/
  backup_officer_guard_idle.png
  backup_officer_scan_idle.png
  backup_officer_notes.md
```

### Character Priority

1. `agent_kelechi_idle.png`
2. `suspect_target_hands_up.png`
3. `civilian_child_crouched.png`
4. `backup_officer_guard_idle.png`
5. walk/scan/cuff sprite sheets

---

## 3. Interactable Props

```text
public/naceca-cinematic/assets/props/evidence_laptop/
  evidence_laptop_open.png
  evidence_laptop_screen_scan_01.png
  evidence_laptop_screen_scan_02.png
  evidence_laptop_collect_icon.png
  evidence_laptop_notes.md

public/naceca-cinematic/assets/props/cash_evidence/
  cash_bundles_table.png
  cash_bundle_single.png
  cash_scan_glow.png
  cash_collect_icon.png
  cash_evidence_notes.md

public/naceca-cinematic/assets/props/desk_monitors/
  monitor_fraud_chart_left.png
  monitor_wallet_flow_right.png
  monitor_glitch_overlay.png
  monitor_notes.md

public/naceca-cinematic/assets/props/raid_room_dressing/
  phone_table.png
  external_drive.png
  manila_folder_stack.png
  evidence_tag_yellow.png
  coffee_table_foreground.png
  desk_keyboard_mouse.png
```

---

## 4. Environment FX

```text
public/naceca-cinematic/assets/fx/
  rain_overlay_loop.webm
  rain_overlay_fallback.png
  police_light_red.png
  police_light_blue.png
  scan_ring.png
  evidence_glow_blue.png
  evidence_glow_gold.png
  objective_complete_flash.png
  dust_motes.png
  vignette_overlay.png
```

### FX Priority

1. police red/blue light pulses
2. scan ring
3. evidence glow
4. rain overlay
5. vignette/color grade overlay

---

## 5. HUD / UI Assets

```text
public/naceca-cinematic/assets/ui/
  naceca_badge.svg
  hud_panel_frame.svg
  hud_objective_diamond_empty.svg
  hud_objective_diamond_complete.svg
  icon_squad.svg
  icon_order.svg
  icon_scan.svg
  icon_cuff.svg
  icon_evidence_laptop.svg
  icon_evidence_cash.svg
  icon_civilian.svg
  icon_suspect.svg
  icon_xp.svg
  minimap_room_mask.svg
```

---

## 6. Audio Hooks

```text
public/naceca-cinematic/assets/audio/
  ui_start_mission.wav
  ui_objective_complete.wav
  ui_scan_start.wav
  ui_scan_complete.wav
  evidence_collect.wav
  civilian_secured.wav
  suspect_arrested.wav
  police_radio_loop.mp3
  rain_room_tone_loop.mp3
  distant_siren_loop.mp3
```

---

## 7. Future GLB Upgrade Path

When moving from 2.5D sprites to real-time 3D characters, place models here:

```text
public/naceca-cinematic/assets/models/
  agent_kelechi.glb
  suspect_target.glb
  civilian_child.glb
  backup_officer.glb
  evidence_laptop.glb
  cash_bundles.glb
  coffee_table.glb
  desk_monitors.glb
```

Animations:

```text
public/naceca-cinematic/assets/animations/
  agent_idle.glb
  agent_walk.glb
  agent_sprint.glb
  agent_crouch.glb
  agent_scan.glb
  agent_cuff.glb
  suspect_hands_up_idle.glb
  suspect_arrested.glb
  child_scared_idle.glb
  child_secured.glb
  officer_guard_idle.glb
```

---

## 8. Naming Rules

- Use lowercase filenames.
- Use underscores, not spaces.
- Keep source PSD/Blend files outside runtime folders or in `/source/`.
- Runtime files must be compressed.
- Do not bake HUD text into background art.
- Do not store huge source files directly unless Git LFS is enabled.

---

## 9. Production Order

### Sprint 1 — Visual Foundation

1. Create `lekki_mansion_raid_bg_3840x2160.png`
2. Add foreground occluder layer
3. Replace procedural canvas background with background image loader
4. Add fallback generated background if asset missing

### Sprint 2 — Character Cutouts

1. Agent Kelechi idle/walk
2. suspect hands-up/arrested
3. child crouched/secured
4. backup officer idle

### Sprint 3 — Interactables

1. evidence laptop sprite
2. cash evidence sprite
3. monitor chart sprites
4. evidence glow and scan pulse

### Sprint 4 — Polish

1. audio hooks
2. HUD icon replacement
3. objective complete animations
4. minimap art pass
5. color grading / vignette
