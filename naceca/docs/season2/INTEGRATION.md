# NACECA Season 2 — integration kit

Season 2, *Operation Upstream*, is eight cases plus the offices between them:

| | Case | Scene |
|---|---|---|
| m9 | 09 The Evidence Room (Benin Zonal, night) | HQ office |
| m10 | 10 The Night Market (Sapele, undercover) | sapele |
| m11 | 11 Black Rain (the Ethiope creek camp) | creek |
| m12 | 12 Paper Oil (Port Harcourt tank farm) | tankfarm |
| m13 | 13 The Ninth Floor (the DG's offer, hidden recorder) | abuja_office |
| m13b | 13½ The Gateman's Book (Maitama) | maitama |
| m14 | 14 FRN v. Edafe & 2 Ors (three-day trial, Court 5) | court |
| m15 | 15 The Barge (finale, accusation, epilogue, Season 3 stinger) | tankfarm_n |

The offices are h9–h14. Informants (sources) come in between cases, and the trial is a full Nigerian trial under ACJA 2015 and the Evidence Act 2011.

It is a **layer**. It changes nothing in the engine, v12, The Case File, beta or tactics. Every hook is a wrap of a global function. A wrap handles Season 2's own ids and passes everything else through.

This kit was tested on the repo's latest preview build: branch `claude/naceca-bundle-integration-133395`, commit `736c79d`, which includes v12.2, The Case File, beta and tactics. See **Tests** below.

## What's in the kit

```
src/season2/      the layer: 23 scripts (s2_*.js) + s2.css + s2_court.css, in LAYER order (tools/season2_inject.py)
art/season2/env/  the 7 baked scenes: <key>.glb, <key>_lm.webp (lightmap), <key>.json (anchors, obstacles, blockers)
tools/season2_inject.py   adds the layer + scenes to a built page (CLI, or inject(html, kit_root) from build.py)
tools/blender/    the bpy scripts that bake the scenes (envkit.py, kit2.py, env_<scene>.py)
tests/            t_s2.js (playwright harness), scen13.js (helpers), probes/ (one per case, the chain, the merges)
docs/             CASES.md (story/flags/evidence contract), COURT.md (trial contract), AGENT_PRIMER.md (the layer's API)
```

## Add it to the repo

1. Copy `src/season2/` → `src/season2/`, `art/season2/` → `art/season2/` (next to the other art), and `tools/season2_inject.py` → `tools/`.
2. Put the layer **last**, after beta and tactics. Either:
   - **Post-build step (simplest).** After `build.py` writes the page, run:
     `python3 -I tools/season2_inject.py <built page> <built page>`
   - **Inside `build.py`.** As the final layer:
     `from season2_inject import inject` (add `tools/` to `sys.path`), then
     `doc, scenes = inject(doc, ROOT)`, just before the page is written.
3. Optional, for phones: `--stream <dir>` also writes a streamed copy to that folder. It is a ~3.7 MB page plus 24 `a_<pack>-<hash>.js` packs that `s2_stream.js` fetches as each scene needs them; the single file is ~20.8 MB. Serve the packs next to the page. Without `--stream` the page runs from the single file: `NACECA_MANIFEST` is null, so no packs are used.
4. Recommended small change to `src/v12/v12_hub.js` (optional; without it a shim in `s2_merge.js` does the same work on the phone):
   ```js
   const PEOPLE_ON_PHONE = { … };
   V12.PHONEBOOK = PEOPLE_ON_PHONE;                // new: Season 2 adds its contacts here
   …
   const HUB_ORDER = ['h2', 'h4', 'h5', 'h6', 'h7'];
   V12.HUB_ORDER = HUB_ORDER;                      // new: Season 2's offices sort after these
   // and in openPhone's header:
   (HUBS[S.game.currentMission] || (window.V13 && V13.HUBS && V13.HUBS[S.game.currentMission]) || {}).sub || 'PHONE'
   ```

## How it sits with the rest of the game

- **Unlock.** Season 2 cards replace the four "Season 2 coming" cards. They unlock after Season 1 (`seasonOneComplete`, or m8 done), one at a time.
- **End of Season 1 → Season 2.** The flow is: the trial (The Case File's court, for a proven or contested finale), the epilogue, the case review, then the title card "SEASON 2 · OPERATION UPSTREAM · Six weeks later", then m9.
  - `s2_core.js` wraps `advanceEpilogue` at the last slide. `s2_merge.js` (`V13.reviewThenS2`) shows the review first if it hasn't been shown.
  - Once Season 2 has started, the end of the epilogue behaves as before (review, then title).
- **Adaeze's verdict carries over.** The first time Season 2 loads, `V13.adaptS1Fate()` reads `I().court`:
  - convicted on any count → `moralChoices.finale = 'proven'`, and the DG names the count ("two counts of four, her appeal pending");
  - discharged on a no-case submission → `finale = 'unproven'`, with Osagie's, the DG's, the defence's and the epilogue's lines rewritten to say she was discharged at trial;
  - the original value is kept in `S.game.s2.s1finale`.
- **Case files.** In Season 2 (m9–m15, h9–h14), TAB, the HUD's CASE FILE and EVIDENCE buttons, and J all open the **Season 2 case file**: every exhibit by case, marked sound / contested / weak, with its P-number once Court 5 admits it. The Case Desk and the operations table are Season 1's and stay as they are there.
- **Casework mode (beta).** Season 2's documents work in Recruit and Senior Agent. In Senior Agent, `V12.seniorScreen` strips hint colouring and removes `←` with the rest of its line, so Season 2's document text never uses `←` as data. Keep it that way when writing new documents.
- **Radio bulletins** play on Season 1 cases only. The repo's `radioPlay` already checks `RADIO_OPS`; `s2_merge.js` adds the same guard for older builds.
- **The Season 1 office hubs and The Case File's briefings** never see Season 2's ids, and Season 2 never sees theirs. Beta's and tactics' wraps pass Season 2's ids through; `TEST_RESULTS.md` lists each one.
- **Flag-only choices.** The base `applyEffect` drops a choice's `flag` when the choice has no `effect`. `s2_core.js` fixes this for everything, which also makes Season 1's cold-open plate question award its evidence as written.

### Global functions the layer wraps

| Wraps | Function |
|---|---|
| Case flow | `loadMission`, `beginMission`, `beginMissionCore`, `showStartMission`, `renderMissionSelect`, `musicForScene`, `generateHeadline`, `nextMissionPreview`, `computeGrade`, `advanceEpilogue` |
| Faces | `drawPortrait` (phone-call cards) |
| Streaming | `startArtLoad`, `playMusic`, `stopMusic` |
| Effects and evidence | `applyEffect`, `collectEvidence` |
| Case files | `openCaseFile`, `openEvidenceBoard`, `openDesk` |
| Radio | `radioPlay` |
| Build tag | `bindExtraMenus` |
| Scoped to one case (act only while that case or Court 5 is running) | `renderDialogueLine`, `renderChoices`, `endDialogue`, `showMeter`, `clearMeters`, `updatePlayer` |

### State (in the save)

- `S.game.s2`: the season's state, which holds:
  - hubs, sources and the source fund, tip log
  - `trial {d1,d2,d3,cred,admitted,weight,exhibits,…}` and fixes
  - `finale`, the fate adapter's keys, and the accusation
- `moralChoices.s2_*`: the decisions (listed in `docs/CASES.md`). Evidence quality is in `S.game.evQ`.

### Naming

`window.V13` is Season 2's namespace. The name is historical: Season 2 was built as "v13" in a parallel line. It has nothing to do with the repo's `src/v13/` (The Case File). Thousands of references use it, so leave it.

The layer's files are `s2_*.js`, and their headers still say "v13 …". The build tag reads `BUILD v14 · THE CASE FILE + SEASON 2` (`s2_boot.js`). Playtest events carry `V12.version`. Season 2 adds `+s2` to the base build's name rather than replacing it, so the repo's `v13+beta` becomes `v13+beta+s2`.

## Tests

Run with: `NACECA_PAGE=<folder with naceca.html> node tests/t_s2.js probe:<name> [desktop|phone]`. You need playwright with chromium and three.js r128 (`npm i three@0.128.0` or set `THREE_JS`). Screenshots go to `tests/shots/`, or to the folder in `SHOTS`.

The machine used for testing renders in software at 0.2–1 fps, so the probes teleport and fast-forward. A clean run prints exactly one console error: the voice-line 404 `vo/vo01.mp3`, because no recordings exist yet.

| Probe | What it plays |
|---|---|
| `chain` | The whole season in order: m9 → h9 → … → m15 → epilogue (each case forced to finish once built) |
| `merge_repo` | Office h4 → briefing (if one is owed) → m5; Case Desk in Season 1; trial → epilogue → review → Season 2; J in Season 2; discharged-fate text |
| `s1_base` | The Season 1 half of `merge_repo`, for the page **without** Season 2. Its log should match `merge_repo`'s up to the review. |
| `c10_careful`, `c10_clumsy`, `c10_jetty` | Case 10: careful run, made + chase, jetty branches |
| `c11careful`, `c11rough`, `c11skip`, `c11phone` | Case 11 branches |
| `c12proper`, `c12short`, `c12skip`, `c12strips` | Case 12 branches + the strip puzzle |
| `c13a`, `c13b` | Cases 13 and 13½ |
| `c15strong`, `c15career`, `c15phone`, `c15contested`, `c15clock` | The finale, accusation and epilogue |
| `court14` (`COURT_RUN=strong\|weak\|plea\|disaster`) | The trial, four ways |
| `s2m9`, `s2h9` (scenarios in `scen13.js`) | Case 09, office h9 |

Results on the repo's preview build (+ Season 2): see `TEST_RESULTS.md`.

## Known gaps

- **Portraits.** The 30 new characters are rim-lit silhouettes (`V13.CAST` → `V13.portraits()`). Painted faces go in `PORTRAIT_ART` as `<id>_neutral` (plus moods), and a painted face wins over the stand-in.
- **Voice.** Season 2 has no voice lines yet.
- **Feel.** Chase pacing and the suspicion meters were tuned by calculation and by a test bot, not by hand.
- **Performance** on real mid-range phones is unmeasured.
- **Court 5 data.** `s2_court.js` works around these at runtime:
  - The conference's first line is re-sited in the empty courtroom.
  - Witness numbers (PW2…) are renumbered from the witnesses actually called.
  - `day3.adjourn` repeats a line, so only the usher's line is used.
  - Re-examination is not offered after a lie in cross-examination.
  - Withdrawals are detected from the response text (`/withdraw|instead/`); an explicit flag in the data would be safer.

  Still open:
  - The evidence register's `custody_unsigned` objection can never fire, because Case 09 only grants the register when custody was signed.
  - The tracker certificate is offered when only the escort's phone was collected, and then protects nothing.
