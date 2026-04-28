# NACECA: Operation Night Raid

A first-person tactical-stealth game built in Unity. You play as a NACECA
(Nigerian Anti-Cyber Enforcement & Counter-Action) field operator infiltrating
a syndicate compound at night to extract evidence, disable surveillance, and
exfiltrate without raising the alarm.

This folder contains the C# gameplay scripts. Drop the `Assets/Scripts`
directory into a Unity project (URP, Unity 2022.3 LTS or newer recommended)
and wire components in the editor as described below.

## Project layout

```
unity-game/
└── Assets/
    └── Scripts/
        ├── Core/        # GameManager, InputReader
        ├── Player/      # Controller, health, weapon, stealth meter
        ├── Enemy/       # AI, FOV, alarm system
        ├── Mission/     # Objectives, triggers, summary screen
        ├── Systems/     # Checkpoints, save, interactables, takedowns, noise
        ├── UI/          # HUD, pause menu
        └── Audio/       # AudioManager (mixer + SFX pool + music crossfade)
```

## Required Unity packages

- **AI Navigation** (NavMesh) - enemy pathfinding
- **TextMeshPro** - HUD and menu text
- **Universal RP** (recommended) - lighting and post-processing
- **Input System** (optional - the included `InputReader` uses the legacy Input
  Manager so it works out of the box; swap to `Input System` actions if desired)

## Scene setup checklist

1. Create an empty `_Bootstrap` scene with: `GameManager`, `InputReader`,
   `AudioManager`, `CheckpointManager`. These persist via `DontDestroyOnLoad`.
2. In each mission scene, add a `MissionManager` and configure its
   `Objectives` list (each entry needs a unique `id` and `description`).
3. Build the player prefab:
   - `CharacterController` + `PlayerController`
   - `PlayerHealth`, `StealthMeter`, `WeaponController`, `PlayerInteractor`,
     `TakedownSystem`
   - Child camera assigned to `cameraPivot` and `fpCamera` references
   - Tag the root GameObject as `Player`
4. Build the enemy prefab:
   - `NavMeshAgent`, `EnemyAI`, `EnemyFieldOfView`
   - Configure `targetMask` to the Player layer and `obstacleMask` to walls
   - Drop patrol-point transforms into the AI's patrol list
5. Bake a NavMesh for the level (`Window > AI > Navigation`).
6. Place `Checkpoint` triggers along the route and `ObjectiveTrigger`
   volumes wherever an objective should auto-complete (matching ids to those
   on `MissionManager`).
7. Add an `AlarmSystem` to the level (with optional reinforcement spawns)
   and a `HUDController` canvas wired to the player's components.

## Gameplay design

### Detection model

`EnemyFieldOfView` performs a cone + peripheral check each FixedUpdate and
exposes `CurrentTarget`, `HasLineOfSight`, and `DistanceToTarget`. Suspicion
ramps up while the player is visible and decays otherwise; once it crosses
`alertThreshold` the AI enters Combat and triggers the global `AlarmSystem`.

### Noise propagation

`NoiseEvents.Emit(position, radius)` is the single hook for any sound that
should attract enemies. Weapons, takedowns, and footsteps can all call it.
Every active `EnemyAI` listens and reacts based on distance, switching to
`Alerted` and pathing toward the noise origin.

### Stealth scoring

`StealthMeter` is a soft visibility budget the HUD can render as a vignette
or icon. Drop it to zero by sustained exposure and your cover is blown -
hook this into a future "ghost run" bonus on `MissionSummary`.

### Mission flow

`GameManager` is the single source of truth for state transitions:

```
MainMenu -> Briefing -> Playing -> { MissionComplete | MissionFailed } -> MainMenu
                          ^                         |
                          +----------- Paused <-----+
```

`MissionManager.CompleteObjective(id)` advances the objective list. When all
non-optional objectives are complete the manager auto-calls
`GameManager.CompleteMission()`.

## Acts (suggested mission structure)

1. **Lagos Rooftops** - tutorial: traversal, takedowns, hacking a junction
2. **Dock Warehouse** - infiltrate, plant tracker, exfil before sunrise
3. **Server Farm** - extract drives while a hacker companion talks you through
4. **Convoy Ambush** - mid-mission shift from stealth to firefight
5. **The Mansion** - capture the syndicate boss alive (no-kill bonus)

## Code style

- Namespaces: `NACECA.NightRaid.<Subsystem>`
- All managers follow the singleton-lite pattern (static `Instance` set in
  `Awake`, destroyed if a duplicate exists).
- Events are C# `event Action<...>` exposed on the relevant manager rather
  than UnityEvents so subscribers can be wired in code.
- Scripts have no editor-only references; everything is field-serialized so
  it can be assigned in the Inspector.

## License

Same license as the parent repository.
