# NACECA — Operation Night Raid (Static Three.js Slice)

This is a standalone static 3D vertical slice located in `public/naceca/`.

## Run

1. Start the existing Vite app:
   ```bash
   npm run dev
   ```
2. Open:
   - `http://localhost:5173/naceca/`

## Notes

- Uses plain JavaScript and Three.js from CDN (`r134`).
- Does **not** depend on `@react-three/fiber`, `@react-three/drei`, `zustand`, or new npm packages.
- Is isolated from the existing Nollywood React app routes and source tree.

## Controls

- `WASD` move
- Mouse drag / pointer lock look
- `Shift` sprint
- `C` crouch
- `E` interact
- `F` scan
