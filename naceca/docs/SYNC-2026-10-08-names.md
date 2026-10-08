# NACECA names — agency name and the Anti-Kidnapping Squad · 8 Oct 2026

Rules (also in STORY-CANON.md → Names):
- NACECA = **National Anti-Corruption & Economic Crimes Agency** (was "Anti-Cybercrime" on the
  HQ crest line and the unused van livery in `systems/art_pass_v8.js`).
- **Anti-Kidnapping Squad**, never "AKS", in anything a player sees.

## What changed
| File | Change |
|---|---|
| `src/config/dialogue.js` | Adaeze's "send word to the Anti-Kidnapping Squad"; Chidi's speaker name is now `ANTI-KIDNAPPING SQUAD LIAISON — INSP. CHIDI` (4 lines; his portrait still matches on CHIDI); "The Anti-Kidnapping Squad picked up signal". "Two AKs" (rifles) unchanged. |
| `src/scenes/checkpoint.js` | Interaction label `Brief with Anti-Kidnapping Squad Inspector Chidi`; toast title `ANTI-KIDNAPPING SQUAD`; two PROTOCOL toasts. |
| `src/systems/art_pass_v8.js` | `byLabel('Brief with Anti-Kidnapping Squad Inspector Chidi')` (must match the label above); checkpoint board repainted as ANTI-KIDNAPPING SQUAD / CHECKPOINT (fitted to the board); agency name on the crest and livery. |
| `src/systems/mission_flow.js` | M4 objective text (id `o1_brief_aks` unchanged). |
| `src/systems/aftermath.js` | Headline "Joint NACECA–Anti-Kidnapping Squad Bust: Ransom Ledger Seized On Benin Bypass". |
| `src/v12/v12_hub.js`, `v12_night.js`, `v12_ops.js`, `v12_street.js` | Chidi's speaker name, hub file line, Edo news line, Uche's night line, ops-table node/dossier/role, the levy street story. |

## For the next drop
The four `src/v12/` files above come from the v12 zips; a new v12 drop must carry these edits
(or the next sync will put "AKS" back). Any new text follows the Names rules.
