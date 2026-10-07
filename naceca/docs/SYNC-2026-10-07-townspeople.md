# NACECA v8.1 — townspeople · 7 Oct 2026

Cumulative: carries v8 (Season 1 finale) if it isn't on main yet.

Eleven designed townspeople, built from the 14 reference renders (two were duplicates,
two were group shots). All procedural, so they add almost nothing to the file size.

| Look | Where |
|---|---|
| Fila man (blue shirt, yellow cap, goatee) | Ikeja market · Akintola Close |
| Purple gele, red blouse, spotted wrapper | Ikeja market |
| Fruit seller (tray on head, plastic bag) | Ikeja market · Benin Bypass checkpoint |
| Cap guy (blue cap, yellow shirt) | Ikeja market |
| Tank-top guy (sunglasses, sling bag, cargo pants, sneakers) | Ikeja market · Akintola Close |
| Orange gele, green blouse, sun-print wrapper, handbag | Ikeja market · Akintola Close |
| Student (cream shirt, backpack) | Ikeja market · Akintola Close |
| Mechanic (navy coveralls, cap, tool belt) | Benin Bypass checkpoint |
| Office analyst (lanyard, tablet, pencil skirt) | Lagos HQ |
| Security guard (beret with badge, khaki, epaulettes) | Lagos HQ door |
| Bread seller (tray held out, red-and-yellow wrapper) | Ikeja market · Akintola Close |

New rig features: ankara fabric textures (painted at load), baseball caps, short twists,
high bun, head-tie, puffed gele, pencil skirt, tank top, goatee, held poses
(tray in both hands, tablet against the chest). Module: `src/systems/npc_cast.js`.

Townspeople are ambient: not interactable, never block movement. Tests: M1–M7 21/21, M8 routes pass.
