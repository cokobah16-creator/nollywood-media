# Season 2 on the repo's build: test results

## What was tested

- **The page.** The repo's preview deployment of branch `claude/naceca-bundle-integration-133395`, commit `736c79d` ("NACECA tactics: Build 1 integrated page"). It has v12.2, The Case File, beta and tactics.
  - It was taken from the deployment's files. The Vercel toolbar script (`vercel.live`) was removed so the page runs offline.
  - On 20 Oct 2026, 08:20 UTC, there was nothing newer on that branch or on `main`.
- **The build.** `python3 -I tools/season2_inject.py naceca.html out/naceca.html --stream out_stream/` produced two copies:
  - a single file of 20.82 MB;
  - a streamed copy: a 3.67 MB page plus 24 packs.
- **The machine.** 2 CPUs, running Chromium (Playwright) with SwiftShader software rendering at 0.2–1 fps. The probes teleport and fast-forward. Each probe loads the page fresh.
- **What counts as a pass.** The log shows the intended outcome: flags, evidence quality, objectives and the end state. The console shows no error except the voice-line 404 (`vo/vo01.mp3`). An exit code of 0 by itself means nothing; every log was read.

## Results

All probes ran on the repo page with Season 2, on desktop unless marked otherwise. Every run printed only the expected voice 404.

| Probe | Result | What the log shows |
|---|---|---|
| `merge_repo` | pass | **Season 1:** office h4 → m5, with no briefing (a jumped save owes none: the page without Season 2 does the same) → the Case Desk.<br>**End of Season 1:** the trial, then the epilogue ("Convicted on 2 of four counts"), then the review.<br>**Season 2:** finale `proven`, 2 counts carried over; J opens the Season 2 case file; the discharged text is right. |
| `merge_repo` (phone) | pass | Same as desktop. |
| `final_merge_repo` | pass | `merge_repo` again, on the kit exactly as shipped. Same results; the playtest build name is `v13+beta+s2`. |
| `c10_careful` | pass | **Exhibits, all good:** BVN link, T4 log, cash bundles, Lucky's statement.<br>**Objectives:** all six done.<br>**Sources:** KC, TUNDE, HERBS, TILL. |
| `c10_clumsy` | pass | **Run A (made, he escapes):** BVN answered wrong → contested; Ejiro arrested.<br>**Run B (made, caught after the chase):** cash contested; threat statement → weak; Ejiro sent home. |
| `c11careful` | pass | **Exhibits, all good:** fuel samples, waybill book, Felix's phone, barge track. |
| `c11careful`, through the kit's own `tests/t_s2.js` | pass | Same result. The kit's harness works from the kit's layout. |
| `c12proper` | **fail** | The Tank 3 log could not be solved (see below), and the rest of the case failed after it. The run was stopped there. |
| `c12proper` after the fix | pass | **Exhibits, all good:** loading log, gate register, Tank 3 sample, CAC record, bank trail.<br>**Objectives:** all eight done. The proof line read "T3 in from barge TEKENA 2". |
| `c13a` | pass | **Refuse, recorder on:** docket and recording, both good.<br>**Accept, no wire:** docket only. |
| `c13b` | pass | **Book quality by approach:** with the gateman as witness, good; photographing the pages, contested; photographing it cold through the glass, weak. Ereba's photo good. |
| `c15strong` | pass | **Accusation:** the DG, with the recording, the visitor book and the transfer docket.<br>**Ending:** all seven objectives, the epilogue, the Season 3 stinger; season marked done and saved. |
| `court14`, `COURT_RUN=strong` | pass | Guilty on all three defendants; credibility 83; every element proven; every no-case submission overruled. |
| `regress` (Season 1, m1–m7) | pass | Every case starts and talks. The log is identical to the page without Season 2. |
| `chain`, streamed copy | pass | **Order:** m9 → h9 → … → m15.<br>**Scenes:** each one loads from its pack.<br>**End:** all 8 cases and 6 offices done; 6 sources recruited. |

**Page versions.**

- `merge_repo`, `c10_careful`, `c11careful` and the first `c12proper` ran before the Case 12 fix. The fix only changes three lines of the Tank 3 log, so their results stand.
- `c12proper` after the fix, `c10_clumsy` and `final_merge_repo` ran on the kit exactly as shipped.
- Everything else ran with the Case 12 fix but before one last change, which only names the playtest build `v13+beta+s2`.

## Found and fixed during these runs

**Tank 3's loading log could not be solved in Senior Agent mode (Case 12).**

- **Cause.** Senior Agent is the repo's default casework mode. In it, `V12.seniorScreen` (beta) removes every `←` and the rest of its line, because it treats them as hint arrows. Season 2's USB log used `←` as data: `T3 ← barge TEKENA 2 · 180,000 L · "Ethiope"`.
- **Effect.** In Senior mode the proof text (`barge TEKENA 2`) disappeared from the document. The loading log could never be put on the record, and the rest of the case's run went wrong after it.
- **Fix.** In the kit's `s2_dlg_b.js`, the three lines now read `T1 in from MT CAPE ORIEL` and `T3 in from barge TEKENA 2`. The document is the same in both casework modes.
- **Check.** No other Season 2 text uses `←`. The re-run on the fixed page is `c12proper` after the fix, in the table above.

## Season 1 with and without Season 2

The same probes ran on the repo page **without** Season 2:

- **`s1_base`.** Its Season 1 steps matched `merge_repo` line for line: the office, no briefing owed, the Case Desk, the trial, the same epilogue text, and the review. After the review it goes back to the title screen; with Season 2, Season 2 starts.
- **`regress`.** The log is identical to the run with Season 2, apart from ports and timestamps.

## How the layers sit together (checked by reading the code)

These repo functions are wrapped by beta or tactics and are also reached by Season 2. Each is fine for the reason given:

| Repo wrap | Why it is fine |
|---|---|
| `startDialogue`, `showAftermath`, `generateHeadline`, `computeGrade` (beta casework) | Act only on Season 1's raids (`RAID[...]`), the m8 finale and m6's Asaba briefing, so they pass Season 2's ids through. |
| `beginMission` (beta casework) | Sets the casework mode's page class. Nothing in it depends on the mission. |
| `loadGame` (beta casework) | Old saves become Senior. |
| `startChase`, `updateChase`, `stopChase` (beta, tactics) | Season 2's chases are its own, so these never run in Season 2. |
| `renderObjectives`, `guideTarget`, `newScene`, `updateMinimap` (beta wayfind) | Season 2 calls `renderObjectives` after changing objectives; wayfind redraws. Exercised by every case probe. |
| `tryInteract`, `nearestInteractable`, `showHint` (tactics) | Every Season 2 interaction goes through them in the case probes. |
| `updatePlayerLegacy`, `ensureHudV8` (tactics crouch) | Crouch (C) works in Season 2 scenes too. Nothing in Season 2 depends on standing height. |
| `completeMission` (tactics) | Logs tactics data for every mission, in try/catch. |

There is no namespace clash. The repo's layers don't use `window.V13`, and Season 2 uses the `m9`–`m15` and `h9`–`h14` ids, which the repo doesn't.

## Not covered here

- **The other probes.** These were run on the Season 2 build (v14) but not on the repo page: `c10_jetty`, `c11rough`, `c11skip`, `c11phone`, `c12short`, `c12skip`, `c12strips`, `c15career`, `c15phone`, `c15contested`, `c15clock`, and `court14` weak / plea / disaster.
- **Real hardware.** Real phones and GPUs, frame rate, and audio were not tested.
- **Recruit mode** (beta casework) was not run. It shows the documents unstripped, as the Season 2 build always did.
