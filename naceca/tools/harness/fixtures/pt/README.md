# Playtest analyser fixtures (Team D)

Generated, never edited by hand (except `broken.json`, a deliberately truncated file). Each log is the real logger's
output from a scripted run of the build named below, exported through `V12.ptExport` (the phone one through the share
sheet, as `.txt`). Regenerate with `tools/harness/scenarios/pt_lib.cjs` (see its header).

Where Team B's market or Team C's mansion emitters were not in the build, the driver logged their DESIGN §4-shaped events
itself, only when the real emitter logged nothing ("standIns" below). After B and C merge, regenerate: the real events then
replace every stand-in, and `pt_report_core` must still pass.

- `deviceA-desk.json` / `deviceA-desk-early.json`: one desktop device, P1, exported twice (the early export is a
  subset: the dedupe case).
- `deviceB-phone.txt`: one phone, P2, shared as text.
- `deviceC-old.json`: a v1 log, from the logger without the tactics layer.
- `broken.json`: not a playtest log (the CLI skips it).

```json
{
 "A": {
  "file": "deviceA-desk.json",
  "early": "deviceA-desk-early.json",
  "exportName": "naceca-playtest-PC72-ALL-20261011-0109.json",
  "earlyName": "naceca-playtest-PC72-ALL-20261011-0109.json",
  "build": "8e1dad470b",
  "what": "desktop P1: sneaky M2 (stuck at the scan, wrong target ×3, one alarm read 2.6 s, Tunde quiet + tip, Uche posted at the corner and veered), the two questions",
  "standIns": [
   "enc m2_tunde",
   "order",
   "document solved",
   "KC alarm (a scripted reset on the kernel fallback watcher, its line shown under the eye)",
   "ally_done",
   "enc m2_kc",
   "m2_summary",
   "links inked"
  ]
 },
 "C": {
  "file": "deviceC-old.json",
  "build": "9318ecd93f",
  "what": "v1 log (no tactics layer): Tunde, a refused scan, a quit 140 s into o2_scan",
  "standIns": []
 },
 "B": {
  "file": "deviceB-phone.txt",
  "exportName": "naceca-playtest-EVYW-P2-20261011-0110.txt",
  "build": "8e1dad470b",
  "what": "phone P2: three taps just out of reach, Tunde loud, two alarms on screen under 1 s, a front confront and a tackle, the ops table, a loud M3 entry, an unfair answer about being seen, a quit right after the questions",
  "standIns": [
   "enc m2_tunde",
   "document solved",
   "KC alarm (a scripted reset on the kernel fallback watcher, its line shown under the eye)",
   "enc m2_kc",
   "m2_summary",
   "links inked",
   "enc m3_entry",
   "enc m3_obi",
   "enc m3_laptop",
   "enc m3_child",
   "m3_summary"
  ]
 }
}
```
