# NACECA Cinematic Mansion Raid

This is the pitch-quality 2.5D cinematic version of **NACECA: Operation Night Raid**.

## Routes

- `/naceca/` — playable systems prototype
- `/naceca-cinematic/` — cinematic 2.5D pitch version

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:5173/naceca-cinematic/
```

If Vite uses another port, use that port, for example:

```text
http://localhost:5174/naceca-cinematic/
```

## Controls

- WASD: move Agent Kelechi within the fixed cinematic scene
- Shift: sprint
- C: crouch toggle
- F: scan evidence laptop, cash, or monitors
- E: secure civilian, collect evidence, arrest suspect

## Mission Flow

1. Secure the child civilian.
2. Scan the evidence laptop.
3. Collect the evidence laptop.
4. Scan the cash evidence.
5. Collect the cash evidence.
6. Arrest the suspect non-lethally.

## Notes

This version uses a cinematic fixed-camera / 2.5D composition. It is intentionally different from the free-camera prototype. The goal is to get closer to the reference image’s composition, lighting, HUD feel, and staged raid fantasy without requiring full AAA real-time assets.
