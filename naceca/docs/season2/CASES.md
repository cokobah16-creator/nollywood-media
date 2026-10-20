# NACECA Season 2 — "Operation Upstream" — case contract

This file is the contract between the writers (dialogue, documents) and the game code. Every key, flag and
evidence id named here is what the code will call. Write exactly these keys; add extra keys only for
sub-branches you need (prefix them with the case's key prefix) and say so in your hand-in.

ROOT = the original Season 2 workspace (its src13/v13_*.js files are src/season2/s2_*.js in this kit)
Season 1 code (read for voice and format): ROOT/game_code.html (DIALOGUE starts at line 1330; the Season 1
finale dialogue is around lines 1808–1995; PUZZLES at 2037) and ROOT/src/v12_*.js (v12_docs.js shows the
document rules; v12_hub.js shows phone messages; v12_street.js shows short street stories).
Design summary for the season: the "Season 2" tab of the Design Bible, reproduced in section 0 below.

## 0. The season in brief
Six weeks after Ekosodin: Season 1's day one is Tue 6 Oct 2026, Ekosodin falls about mid-October, and Case 09 is
Wed 2 Dec 2026 (the full calendar is in section 6). Commander Adaeze was the Voice; depending on the player's
Season 1 she is convicted, on remand awaiting trial, or relieved of command without charge. Season 2 reads that
verdict through `V13.s1fate()` ('proven' | 'contested' | 'unproven'), from the Season 1 snapshot (section 6); it
never writes Season 1's `moralChoices.finale`. The Season 1 stinger: in Abuja, the Director-General's office orders "close Ekosodin before Zonal
reads the rest of that drive" (Osas's flash drive, exhibit 14, held by Benin Zonal Command), and "find out who
trained that agent". Card: "SEASON 2 — Someone protected her for twenty years."

Answer (canon): Director-General Kolawole Fashina protected Adaeze; Senator Tonye Douglas-Akpan, an oil-services
magnate turned politician, paid for it. His crude-theft network — the drive's ledger calls it UPSTREAM — steals
crude in the Ethiope creeks, refines it in kpo-fire camps, ships product on the barge TEKENA 2 to a Port Harcourt
tank farm (Riverstone Marine Services Ltd, owned on paper by his driver Godwin Ereba), launders it into the
legitimate supply with forged waybills, and cashes money out through POS terminals in a Sapele night market via a
currency changer, Lucky Edafe. Payments in the ledger: a monthly "C.A." line — ₦4.8m in cash on the 10th, paid by
R.M.S. (just under the ₦5m cash limit) — and a quarterly "D.G.O." (the Director-General's Office). The C.A. cash is
Adaeze's SECOND paymaster: Season 1's money trail stands as it is (the Ugbowo Relief Foundation's ₦10M "retainer" to
C.A. Consulting on the 1st of every month), and Season 2 says so out loud (`m9_dgo`, Tobi's text after m9). The
money ends in Maitama Haven Properties Ltd, an empty mansion in Maitama, Abuja, where the DG and the Senator meet on
the second Friday of the month. Season 1's trial of Adaeze used only the drive's payroll folder, on certified
printouts; nobody imaged the whole drive or opened its hidden `_old` folder, where UPSTREAM sits, before Case 09.

Cases: 09 The Evidence Room (Benin Zonal, night) · 10 The Night Market (Sapele) · 11 Black Rain (creek camp) ·
12 Paper Oil (PH tank farm) · 13 The Ninth Floor (DG's office, Abuja) · 13½ The Gateman's Book (Maitama) ·
14 FRN v. Edafe & 2 Ors (Federal High Court, Abuja) · 15 The Barge (PH jetty, night — finale).

## 1. Writing rules (match Season 1)
- Format: entries in DIALOGUE are arrays of lines `{ speaker, portrait?, mood?, text, textEn?, choices? }`.
  `speaker` is UPPERCASE (see cast). `mood`: 'neutral' | 'angry' | 'afraid' | 'evasive' | 'relieved'.
  Kelechi's lines use `speaker:'AGENT KELECHI', portrait:'kelechi'`. Uche: `speaker:'SGT. UCHE', portrait:'sergeant'`.
  Pidgin lines carry `textEn` (a plain English version for players who choose English subtitles).
- Choices: `{ text, tag, effect, flag, next }`. `tag`: 'lawful' | 'savvy' | 'harsh' | 'kind' (tone label).
  `effect`: `{ integrity, publicTrust, agencyFavour, heat, intel }` small integers (±1..±8; ±10 only for the big ones).
  `flag`: an object merged into S.game.moralChoices and S.game.flags — use ONLY the flag keys listed in this file.
  A choice that carries a `flag` asks the player to tap twice (it's a decision), so use flags for real decisions.
  `next`: jump to another DIALOGUE key (for branches).
- Length: most conversations 4–10 lines. Lines short (under ~170 characters), spoken, specific. No speeches.
  Nigerian specificity without caricature: Pidgin where people would use it, local detail (places, prices, food),
  humour. Nobody is a stereotype. Traditional medicine is respected. No real companies or real people.
- Tone: grounded, tense, humane. The player builds a case and can be wrong. Combat is never the point.
- Kelechi is a man. Keep Season 1 canon (Tobi was a hostage Kelechi could rescue in Case 06; Osas Ehigie is
  Mrs. Ehigie's son; Uche turned down a promotion: "Slower. But it holds.").
- Season 1 conditions you can branch on (all read from the Season 1 snapshot, section 6): `V13.tobiAlive()`
  (rescued, or carried out in the chase with the hostage not lost), `V13.tobiTestifies()` (the deliberate rescue
  only), `V13.s1fate()` (Adaeze's fate), `V13.s1snap().bribe` (Kelechi took money from Chief Obi's drawer in
  Case 03), `kcFair`, `kcWrong`, `tundeWrong` (your Lagos charge sheet held KC or Tunde: `_cwWrong('lagos')`),
  `musaTalked` (flags.musa_tip or checkpoint 'flip_driver'), reputation `S.player.reputation.integrity` etc.
  When a whole conversation depends on a condition, write separate keys and the code picks. In JS, guard the
  helpers (`V13.tobiAlive ? V13.tobiAlive() : <the canon rule>`); in `cond` strings call them directly.
- Line fields (the core layer's `renderDialogueLine` wrap): `rec:1` plays a line on Recruit only; `sr:'…'` (and
  `srEn:'…'` for a Pidgin line's English) is the text on Senior; `cond:"<JS over S>"` plays the line only if true
  when it is reached. Lines are skipped, never removed, so indexes and choice jumps hold. Never put `rec` or `cond`
  on a line with choices; avoid them on lines with `effect` or `trace`.
- Senior Agent (the default casework mode) gets no answer-giving lines: a line that tells the next step, the place
  or the answer is `rec:1` or gets a neutral `sr`. Documents may wrap a Recruit-only aid in
  `<span class="cw-hint">…</span>` (stripped on Senior). No Season 2 document uses '←'.
- Documents ("tap the line that proves it"): for each doc key give a PUZZLES entry
  `{ title, screen, prompt, options:[{text, hint, correct}], onCorrect:{intel, integrity, agencyFavour, evidenceId, evidenceName, xp}, onWrong:{integrity:-1} }`
  where `screen` is pre-formatted text (use `<span class="label">`, `<span class="red">`, `<span class="green">`
  like Season 1) with one item per line, and a V12.DOCS entry `{ ask, proof:[substrings that only occur on the proof
  line(s)], look:[...], fail:{ mode:'continue', note, effect } }`. Keep screens under ~22 lines.

## 2. Cast (speaker names, exactly)
AGENT KELECHI · SGT. UCHE · TOBI (Tobi Onuoha, Season 1's accountant; a civilian payroll reader Zonal took on for
the trial; alive iff `V13.tobiAlive()`; he reads and decodes, he never certifies) · MR. IGBINOSA (Efosa Igbinosa,
Zonal forensic officer, 19 years; runs the bench, the image and every s.84 certificate in every save; PW2 at the
trial) · COMMANDER OKUNDAYE (Itohan Okundaye, Benin Zonal Commander; "— I.O.", "Cdr. I. Okundaye") · SGT. IKPE
(evidence custodian, Benin, 22 years) · MR. KUTI (A. Kuti, the DG's personal assistant) · ESCORT INSPECTOR
(Inspector Yakubu, Abuja transfer team) ·
MAMA KARO (Oghenekaro, 60s, herbal remedies, Sapele) · EJIRO (her nephew, 20s, POS kiosk T4) ·
LUCKY EDAFE (currency changer, 40s) · LEGAL AID LAWYER (Barr. Ese Omoregie) · BOATMAN · MAMA TEGA · BUKA
(the buka, MAMA TEGA KITCHEN) · Mama Ufuoma (a trader in Mama Esusu's book) ·
PA TIMI (old fisherman, Ethiope creek) · FELIX UGBEKILE (laid-off oil engineer who runs the camp) ·
CAMP ESCORT · Preye (the camp boy whose father fished with Pa Timi) · Tonbra (Pa Timi's grandson, who types his
texts) · BARRISTER DANLADI (Zainab Danladi, NACECA prosecutor) · CPL. AMINA (female officer) ·
SOTONYE JUMBO (tank-farm manager) · CHAIRMAN IBINABO (woman, boat drivers' union, PH waterfront) ·
TANK FARM SECURITY · DIRECTOR-GENERAL FASHINA (Kolawole Fashina; his trainee file names Inspector (rtd.)
Effiong Asuquo, Kelechi's Academy trainer; his driver Daniel Gbenga Olayemi signs "D.G.O.") · BABA SHAYI (tea
seller, Maitama) · GATEMAN (other gatemen; Garba among them) ·
SGT. (RTD.) BITRUS (Bitrus Gyang, retired soldier, gateman of the empty mansion) · GODWIN EREBA (the Senator's
driver; nominee owner of Riverstone; 11B Harbour Close (BQ)) · SENATOR DOUGLAS-AKPAN (Senator Tonye
Douglas-Akpan, 11 Harbour Close, Old GRA) · TASK FORCE COMMANDER (ACP Lawal) · defence counsel Femi Olaniran-Cole,
SAN ·
IFE ADEBAYO (investigative reporter, THE LAGOS LEDGER — optional ally) · COMMANDER ADAEZE (in custody) ·
MUSA (phone, Kano) · NACECA SYSTEM (narration/system lines).

## 3. Season 2 flags (moralChoices / flags), evidence ids
Flags (set by choices or by code):
- s2_custody: 'signed' | 'unsigned'           (09: how the drive left the evidence cage)
- s2_method: 'image' | 'direct' | 'photo'      (09: how the drive was examined)
- s2_abuja_call: 'truth' | 'lie' | 'deflect'  (09)
- s2_original: 'handed' | 'kept'               (09: the original drive)
- s2_karo: 'trust' | 'neutral' | 'cold'        (10)
- s2_ejiro: 'source' | 'arrested' | 'left'     (10)
- s2_jetty: 'lucky' | 'both' | 'follow'        (10: arrest Lucky / arrest Lucky and the boatman / let both go and follow)
- s2_statement: 'proper' | 'car' | 'threat'    (10: how Lucky's statement was taken)
- s2_timi: 'source' | 'cold'                   (11)
- s2_samples: 'sealed' | 'grabbed'             (11)
- s2_felix: 'cooperating' | 'arrested' | 'threatened' (11)
- s2_camp: 'navy' | 'felix_only' | 'mass'      (11)
- s2_barge: 'tagged' | 'seized'                (11)
- s2_warrant: 'waited' | 'went_in'             (12)
- s2_search: 'amina' | 'self'                  (12)
- s2_inventory: 'signed' | 'skipped'           (12)
- s2_sotonye: 'witness' | 'arrested' | 'pressured' (12)
- s2_ibinabo: 'source' | 'cold'                (12)
- s2_wire: true | false                         (13, decided in the hub before)
- s2_ninth: 'bury' | 'refuse'                   (13: the DG's offer; with a wire the player still answers)
- s2_bitrus: 'witness' | 'photo' | 'cold'      (13½)
- s2_raid_entry: 'water' | 'gate'               (15)
- s2_end: 'truth' | 'career'                    (15)
Evidence ids (name in brackets; the code collects them and sets quality good/contested/weak):
09: drive_image [Forensic image of exhibit 14], upstream_ledger [The UPSTREAM ledger], evidence_register [Evidence register — exhibit 14]
10: pos_t4_log [Terminal T4 transaction log], bvn_link [Four accounts, one BVN], cash_bundles [₦9.6m in POS bundles], lucky_statement [Lucky Edafe's statement]
11: fuel_samples [Camp fuel samples], waybill_book [Forged Riverstone waybills], felix_phone [The escort's phone], barge_track [TEKENA 2 tracker log]
12: loading_log [The real loading log], tank3_sample [Tank 3 diesel sample], cac_record [CAC record — Riverstone Marine], bank_trail [Riverstone → Maitama Haven transfers], gate_register [Gate register — tankers out]
13: transfer_docket [Exhibit 14 transfer docket], dg_recording [Recording — the ninth floor]
13½: visitor_book [The Maitama visitor book] (or visitor_book_photo [Photos of the visitor book]), ereba_photo [Godwin Ereba at the gate]
15: barge_cash [Cash on the barge], senator_words [The Senator on the jetty]

## 4. Cases — beats and the keys to write

### Case 09 · The Evidence Room — EDO · BENIN ZONAL COMMAND, 21:40 (prefix m9_)
Kelechi and Uche arrive at Benin Zonal at night. Abuja has ordered exhibit 14 flown to headquarters on the 06:00
flight. Commander Okundaye gives Kelechi the night.
- m9_intro (radio/arrival, 2–3 lines; Uche + Kelechi; mood of the night; the order from Abuja).
- m9_osagie — briefing with Commander Okundaye. She has read Kelechi's report on Ekosodin (the sealed report of
  Season 1 is optional, so the line never assumes it). Adaeze's trial took what it needed from the drive — the payroll
  folder, on certified printouts — and the drive came back from the registry to Sgt. Ikpe's cage. The order was
  signed "for the Director-General" by Mr. Kuti. "Do it by the book, or don't do it in my building." Two or three
  choices of tone only (no flags). m9_osagie_unproven is the whole conversation when `V13.s1fate() === 'unproven'`
  (Adaeze was never charged; Okundaye is angry about it). The key names stay (code ids).
- m9_ikpe — the evidence custodian Sgt. Ikpe and the register. Decision:
  A "Sign it out — time, name, seal number." flag {s2_custody:'signed'} effect {integrity:+2}
  B "Sergeant, tonight this never left the cage." flag {s2_custody:'unsigned'} effect {integrity:-3, agencyFavour:-1}
  Ikpe reacts in character either way (he's an old hand; B makes him uneasy).
- m9_tobi_bench (when `V13.tobiAlive()`: three TOBI lines — Zonal took him on to read the payroll for the trial;
  "Mr. Igbinosa does the machine. I read what comes off it."; eleven days on the payroll folder and he never opened
  `_old`), then m9_forensic_igbinosa — at the forensic bench Mr. Igbinosa (every save) says the bench took three
  weeks to unlock the payroll folder for the case against her and nobody has imaged the whole drive; he explains
  three ways to examine the drive and Kelechi picks:
  A write-blocker, forensic image, hash both, sign a section 84 certificate (40 minutes) flag {s2_method:'image'}
  B plug it straight into the laptop ("every file's access date will say tonight") flag {s2_method:'direct'}
  C photograph the screens with a phone flag {s2_method:'photo'}
  Igbinosa is dry and slow. (m9_forensic_tobi* and m9_cert_tobi are retired: in the file, unused.)
- m9_hash (DOCUMENT): the two hash readouts (original drive, image) and a few decoys; the player picks the matching
  pair and taps it. Correct = drive image verified. Use SHA-256 style hex (64 chars, you may shorten with … in the
  middle but keep the distinguishing characters visible). evidenceId 'drive_image'.
- m9_cert_igbinosa (2–4 lines): Mr. Igbinosa signs the s.84 certificate ("the computer was operating properly;
  the image is a true copy"). Only after method 'image'.
- m9_ledger (DOCUMENT): the UPSTREAM ledger (hidden folder `_old`, last saved 12 Sep 2026, Jun–Sep). Lines with
  dates, codes and amounts: monthly "C.A." ₦4,800,000 in cash on the 10th; quarterly "D.G.O." ₦24m on a second Friday;
  "R.M.S." as the payer; barge "TEKENA 2 — sailed (Ethiope)" about 171,000–180,000 L a sailing (a barge carries about
  twenty times what Sapele cashes out); 48 hours later "SPL-WSM-T4 — cash-out" entries. Ask: where does Upstream's money come from? Options: ransom calls / crude sold off TEKENA 2 and
  cashed out in Sapele (correct) / diverted agency salaries. Proof: a "TEKENA 2 — sailed" line and its "SPL-WSM-T4" line.
  evidenceId 'upstream_ledger'.
- m9_dgo (3–5 lines): Kelechi reads "C.A." as Adaeze's second paymaster (cash on the 10th, not the Foundation's
  retainer on the 1st); he and Uche wonder who "D.G.O." is ("'Daily Gold Oil' — my cousin in Onitsha has a shop
  called that"). Nobody says it out loud. Leave it open.
- m9_call_kuti — 02:30, Okundaye's desk phone; Mr. Kuti asks whether exhibit 14 has been accessed since it was sealed:
  A truth ("It has. By me. It's in the register.") flag {s2_abuja_call:'truth'} effect {integrity:+3, agencyFavour:-2}
  B lie ("Sealed, sir. Untouched.") flag {s2_abuja_call:'lie'} effect {integrity:-4}
  C deflect ("You'll want Commander Okundaye, sir.") flag {s2_abuja_call:'deflect'}
  Write m9_call_kuti so it works whether the register was signed or not (if B is chosen after signing, Kuti's last line
  can be a quiet "The register says otherwise, Agent." — put that in a separate 1–2 line key m9_call_kuti_caught).
- m9_transfer — 05:10, the Abuja escort arrives early. Decision:
  A hand over the original as ordered flag {s2_original:'handed'} effect {agencyFavour:+3}
  B keep it under a Zonal retention order — only offered if Okundaye backs him; the code shows a different key:
    m9_transfer_backed (Okundaye signs a retention order: "an exhibit in an active Zonal investigation stays in Benin")
    with the same two choices, B = flag {s2_original:'kept'} effect {agencyFavour:-4, integrity:+2}
  The code uses m9_transfer when Okundaye will not back him (low standing) and m9_transfer_backed when she will. The
  escort is Inspector Yakubu.
- m9_end (dawn, Uche and Kelechi on the steps; 4–6 lines; next: Sapele).
Aftermath text for the case (see section 5).

### Case 10 · The Night Market — DELTA · SAPELE WATERSIDE NIGHT MARKET, 20:30 (prefix m10_)
Plain clothes. The terminal in the ledger, SPL-WSM-T4, is in this market. Lucky Edafe comes on Thursdays with sacks
of cash and withdraws through POS kiosks under the ₦1.2m daily cap per agent, using many cards.
- m10_intro (arrival; Uche: plain clothes, buy something, don't stare; a text from Zonal forensics, Tobi or Igbinosa
  with the terminal ID). On Senior (`sr`) the text gives the permit only, never the kiosk's place.
- m10_karo — Mama Karo's herbal stall. Her opening line invites a greeting. Three openers:
  A "Migwo, Mama." (Urhobo greeting; she answers "Vrendo, my son" — pleased) → the trust branch m10_karo_trust
  B "Good evening, madam. NACECA." → m10_karo_cold (she goes cold: this is a market, not a police station)
  C "How much for the bitter leaf?" → m10_karo_customer (neutral; she sells, sizes him up)
  Each branch ends with a choice that sets flag {s2_karo:'trust'|'neutral'|'cold'}. In the trust branch she tells him
  her nephew Ejiro runs T4 and "a changer with sacks every Thursday" uses it; in neutral she only says T4 is "the one
  by my stall"; in cold she says nothing useful. She is NOT part of the crime; her stall is honest; she is proud of it.
- m10_karo_source (trust only): she offers to be his eyes: "If you need me, come and buy bitter leaf. Only bitter leaf."
  Kelechi can accept (code makes her source HERBS) or decline. One choice, no flag needed (the code reads which
  choice index; make choice 0 = accept, choice 1 = decline).
- m10_sticker_t1/t2/t3 (1 line each, system: the sticker reads terminal ID … not T4) and m10_sticker_t4 (2 lines:
  SPL-WSM-T4, Ejiro's kiosk).
- m10_esusu (2–4 lines) the thrift collector counting traders' contributions (innocent, a decoy).
- m10_fuel (2–4 lines) the jerrycan seller with big bundles (innocent, a decoy).
- m10_buka (2–3 lines) buying food at MAMA TEGA's buka (lowers suspicion; banter).
- m10_lucky_arrives (radio, 1–2 lines: Uche spots a man with two sacks; on Senior he never says which kiosk).
- Observation captions (one line each, system): m10_obs_cashouts ("Four withdrawals back to back, each just under the
  limit"), m10_obs_cards ("A different card every time — and a different name on each"), m10_obs_boat ("He hands two
  bags to a boatman at the jetty").
- m10_who (DOCUMENT): the forensic desk's message: the four accounts paid out at T4 tonight share one BVN; the name
  it resolves to (EDAFE, LUCKY O.) is a Recruit aid in a `cw-hint` span; plus the observation notes and the decoys'
  facts (Mama Esusu's daily contributions book; the fuel seller's receipts). Ask: who is the changer? Proof: the
  ₦1,195,000 pay-out lines and the "just under" pattern (and the name, on Recruit). evidenceId 'bvn_link'.
- m10_ejiro — Ejiro at T4, frightened, gets a cut to let Lucky use his terminal. Decision:
  A protect and turn him ("Keep your terminal open and tell me when he comes") flag {s2_ejiro:'source'}
  B arrest him flag {s2_ejiro:'arrested'} effect {publicTrust:-1}
  C leave him ("Close early tonight. Go home.") flag {s2_ejiro:'left'}
  If A, he hands over his terminal's transaction log (code collects 'pos_t4_log').
- m10_jetty — at the jetty Lucky passes bags to a boatman. Decision:
  A "Take Lucky. Let the boat go." flag {s2_jetty:'lucky'}
  B "Take them both." flag {s2_jetty:'both'} effect {heat:+6}
  C "Let them go. We follow the money." flag {s2_jetty:'follow'} effect {intel:+1}
- m10_arrest (Lucky arrested: 4–6 lines, he blusters in Pidgin; cash bundles seized; Kelechi gives him his rights —
  reason for arrest, right to silence and a lawyer (ACJA s.6)).
- m10_boatman (only after B: 3–5 lines, the boatman gives up the creek fork "past the second bend, Ekre side" and
  that the camp "will hear before morning").
- m10_statement_choice — Uche asks how Kelechi wants Lucky's statement taken. Decision:
  A "Area Command. Camera on, and get him a lawyer." flag {s2_statement:'proper'} effect {integrity:+3}
  B "Here, in the car, while he's scared." flag {s2_statement:'car'} effect {integrity:-2}
  C "Uche — show him what happens to people who lie to us." flag {s2_statement:'threat'} effect {integrity:-6, heat:+3}
- m10_statement_proper (with LEGAL AID LAWYER present, on video; Lucky admits the withdrawals but claims it is his
  "fuel business"; says nothing else).
- m10_statement_car (Lucky talks: "Oga Felix for the creek. Ekre side. Riverstone people pay." — a great lead that
  will not stand up in court).
- m10_statement_threat (he talks, frightened; Uche doesn't like it; Kelechi knows this one will be thrown out).
- m10_follow (after C: 3–4 lines; the boat's engine fades upriver; Uche: "Ekre side, or Oko side." — the player will
  have to work it out in Case 11. Lucky is picked up two days later in Warri, off-screen.)
- m10_made (2–3 lines: the market has made them; Lucky bolts — starts a chase) and m10_caught (after the chase).
- m10_end (4–6 lines; Mama Karo's lamp; the boat engine on the river; next: the creeks).

### Case 11 · Black Rain — DELTA · ETHIOPE CREEKS, 01:20 (prefix m11_)
- m11_timi — Pa Timi the fisherman at the landing at dusk before they go in; his nets come up black. If treated with
  respect he becomes source NETS and guides the boat. Choice A respectful (flag {s2_timi:'source'}), B transactional
  ("How much to take us?") (flag {s2_timi:'cold'}) — he still takes them, but tells them less.
- m11_route (DOCUMENT): which creek fork hides the camp. Three forks with invented names (Ogho channel, Ekre creek,
  Oko waters). Clues: soot on laundry in a village on the north bank; the night wind from the south-west; the boatman's
  forty-minute run from Sapele; the tide falling at 01:00; Pa Timi: nets black "below the second bend". Ekre creek is
  correct. (The code skips this document if Lucky's car statement or the boatman already named Ekre.)
- m11_arrive (radio, 2–3 lines; engine off, paddles; the smell; the glow; forty-odd drums, three of them on the fire).
- m11_samples — at the cooling drums. Decision:
  A seal, label, photograph, sign across the seal flag {s2_samples:'sealed'} (code adds suspicion)
  B grab a bottle and go flag {s2_samples:'grabbed'}
- m11_waybills (DOCUMENT): a book of Riverstone Marine waybills: "Loaded at Delta Bay Depot, Jetty 2, … Product AGO,
  Vessel TEKENA 2". A depot notice pinned in the book (or a dated stamp) shows Jetty 2 out of service for repairs since
  3 March; the waybills are dated after that. Ask: what makes these waybills false? Proof: the out-of-service line and a
  post-March Jetty 2 loading line. evidenceId 'waybill_book'. (Delta Bay Depot is fictional.)
- m11_felix — Felix Ugbekile at the shelter. He was a production engineer laid off years ago; he is not a monster; he
  knows exactly what the smoke does. Decision:
  A persuade ("Help me catch the people who buy from you") flag {s2_felix:'cooperating'} → he gives the barge
    schedule: TEKENA 2 to the Riverstone tank farm, Port Harcourt, Thursday; and that "the money comes back through Sapele"
  B arrest flag {s2_felix:'arrested'}
  C threaten flag {s2_felix:'threatened'} effect {integrity:-4} (he talks, bitterly; worth less later)
- m11_escort_runs (2 lines; the camp escort bolts for the boardwalk — the chase), m11_chase_caught (3–4 lines; his phone:
  a contact saved "GODWIN — R.M.S." ) and m11_chase_lost (2 lines).
- m11_camp_decide — Decision about the camp (Uche and Pa Timi present):
  A call the Navy to burn it flag {s2_camp:'navy'} effect {agencyFavour:+4, publicTrust:-3, integrity:-1}
  B Felix comes; the boys go home as witnesses flag {s2_camp:'felix_only'} effect {publicTrust:+4, integrity:+2}
  C everyone under arrest flag {s2_camp:'mass'} effect {publicTrust:-4, heat:+8} — nine arrests (eight boys and
    the escort), one later charged. The boy Pa Timi speaks for is Preye.
- m11_barge — TEKENA 2. Decision:
  A plant the tracker, let her sail flag {s2_barge:'tagged'}
  B seize her now flag {s2_barge:'seized'} effect {agencyFavour:+2} — a court later releases her to Riverstone on a
    bond, and Case 15 says so (Uche at h14; Barrister Danladi in the m15 brief).
- m11_end (dawn on the water; black smoke; Pa Timi's line about his father's creek; 4–6 lines).

### Case 12 · Paper Oil — RIVERS · PORT HARCOURT WATERFRONT, RIVERSTONE TANK FARM, 17:40 (prefix m12_)
- m12_hauwa (key name stays) — Barrister Zainab Danladi meets them outside the gate. She explains: a search warrant (ACJA s.146,
  signed by a magistrate) or go in now. Decision:
  A "Get the warrant." flag {s2_warrant:'waited'} (code fades 50 minutes; some papers get shredded)
  B "We go in now." flag {s2_warrant:'went_in'} effect {integrity:-2} (she: "Then I didn't hear this.")
- m12_warrant_back (after A: she returns with the warrant and CPL. AMINA; 2–4 lines).
- m12_gate (security at the gate; with or without warrant — write m12_gate_warrant and m12_gate_nowarrant).
- m12_shred (2–3 lines, after A: the shredder is warm; strips in the bin) — the code runs a strip-sorting minigame.
- m12_search — Sotonye's handbag and person must be searched. Decision:
  A "Corporal Amina, please." flag {s2_search:'amina'} (only if Amina is there, i.e. warrant branch; otherwise write
    m12_search_noamina where the only lawful choice is to wait for a female officer or skip the search)
  B "I'll do it myself." flag {s2_search:'self'} effect {integrity:-3}
- m12_inventory — Decision: sign the seizure inventory with her and give her a copy (flag {s2_inventory:'signed'}) or
  skip it (flag {s2_inventory:'skipped'}).
- m12_log (DOCUMENT): the official intake log vs the waybills vs the gate register: Tank 3 received "imported AGO" on
  dates that match TEKENA 2's runs; the real loading log (from Sotonye's USB) names TEKENA 2. Ask: where did Tank 3's
  diesel come from? Proof: the matching TEKENA 2 line(s). evidenceId 'loading_log'.
- m12_sample (DOCUMENT or short scene — write it as a DOCUMENT): the lab bench test of Tank 3's diesel: colour much
  blacker, foams when shaken, sediment after ten minutes, a flash point reading off-spec. Ask: what does the test show?
  Proof: foaming + sediment lines. evidenceId 'tank3_sample'.
- m12_sotonye — the manager; she kept the real loading log on a USB in her car as insurance. Decision:
  A offer protection and a fair word with the prosecutor flag {s2_sotonye:'witness'} effect {integrity:+2}
  B arrest her flag {s2_sotonye:'arrested'}
  C pressure her ("Think about your children") flag {s2_sotonye:'pressured'} effect {integrity:-4}
- m12_tobi_cac / m12_igbinosa_cac (phone, 3–5 lines; Tobi if `V13.tobiAlive()`): Riverstone Marine Services Ltd is
  95% owned by Godwin Ereba; his BVN-linked salary is ₦180,000 a month from the Douglas-Akpan Foundation. On Senior
  the call only says the records are pulled ("Records sent, Agent. Read them yourself."); the reading of them is the
  document's job (`rec:1` on the "driver" lines). Tobi's thank-you line depends on `V13.tobiTestifies()`: "You came
  back for me in Asaba…" (rescue) or "Sergeant Uche carried me out of Asaba because you sent him in…" (chase).
  Sotonye's car is the red Kia by the generator house.
- m12_cac (DOCUMENT): CAC record + salary slip + director's address (same street as the Senator's Port Harcourt
  residence). Ask: who really owns Riverstone? Proof: salary line + address line. evidenceId 'cac_record'.
- m12_ibinabo — Chairman Ibinabo at the union shed by the jetty. She knows the night barges and that "the Big Man's
  boat from Bonny" comes on Thursdays; the Senator's people collect illegal "levies" from her drivers. Decision:
  A promise results: the levies stop and her drivers are left alone flag {s2_ibinabo:'source'}
  B lean on her flag {s2_ibinabo:'cold'}
- m12_bank (Barrister Danladi, 3–5 lines): Riverstone's account pays Maitama Haven Properties Ltd; the property is a mansion in
  Maitama, Abuja. evidence 'bank_trail' (code).
- m12_summons (phone, Mr. Kuti: "The Director-General will see you in Abuja. Tomorrow. Ten o'clock.") and m12_end.

### Case 13 · The Ninth Floor — ABUJA · NACECA HEADQUARTERS, 09:50 (prefix m13_)
- m13_wire_offer (in the Port Harcourt hub before the case, 22:10: on the video call from Benin, Commander Okundaye
  offers a recorder in a pen her driver brought; every save — `V13.C.wireOffer()` always returns this key, and
  m13_wire_offer_tobi is retired). Choice 0 = wear it (flag {s2_wire:true}), 1 = don't (flag {s2_wire:false}).
  Mr. Igbinosa pulls, hashes and certifies the audio.
- m13_kuti (reception; Mr. Kuti, smooth: "The DG is in a meeting. Sit.").
- m13_docket (DOCUMENT): the transfer docket on Kuti's desk: "Exhibit 14 — from Zonal Benin — received 06:40 —
  placed in the DG's safe on the DG's instruction — signed: A.K." (Mr. A. Kuti) Ask: where is exhibit 14? Proof:
  the safe line. evidenceId 'transfer_docket'. Also write m13_docket_kept (DOCUMENT variant when
  s2_original==='kept': the docket shows exhibit 14 "NOT RECEIVED — Zonal retention order", and a transfer order for
  Commander Okundaye to Maiduguri).
- m13_kuti_caught (Kuti catches him at the desk; 3 lines; cold).
- m13_dg — the meeting (Fri 11 Dec 2026). The DG is warm, cultured, terrifying. He knows Kelechi's file, names his
  old trainer (Inspector (rtd.) Effiong Asuquo, retired in Calabar, "his pension is processed by this office"),
  mentions Adaeze (by `V13.s1fate()`), calls the Senator "a friend of this agency — he funds our forensic lab". He
  offers a Superintendent's badge and command of Lagos Cyber & Financial Crimes (Kelechi's old unit), if the
  Upstream file "comes home to headquarters". The promotion letter is dated the day before the meeting. Write the
  conversation with 3–5
  exchanges and these keys:
  - m13_dg (opening up to the offer; ends on the offer line with choices that `next` to the answer keys)
  - m13_dg_accept: "I accept, sir." flag {s2_ninth:'bury'} effect {integrity:-12, agencyFavour:+10}
  - m13_dg_refuse: "The file stays with Zonal, sir." flag {s2_ninth:'refuse'} effect {integrity:+6, agencyFavour:-15}
    (before noon the DG suspends him pending an inquiry into Ekosodin — "a commander relieved of command without
    this office's authority"; "Leave your ID card at the desk.")
  - m13_dg_wire: a separate version of the middle of the conversation for when Kelechi wears the wire: lines with
    `trace` values (like Season 1's call trace: each line's `trace` adds to a RECORDING meter, 0–100) where Kelechi's
    choices either draw the DG out (trace +15..+25) or spook him (trace −10 via a choice with trace:-10). It must end by
    going `next` to m13_dg_offer_wire, which contains the same accept/refuse choices as above.
  - m13_dg_register (2 lines the code inserts if any source was registered: the DG mentions the source's codename
    — write versions for HERBS, TILL, NETS, TIDE: m13_dg_register_herbs, _till, _nets, _tide).
- m13_end (Uche downstairs; 4–5 lines).

### Case 13½ · The Gateman's Book — ABUJA · MAITAMA, 22:15 (prefix m13b_)
- m13b_shayi — tea at Baba Shayi's kiosk with gatemen; gossip: the empty house's lights burn every night; "only Friday
  people come". Respectful, warm, funny. One choice of how Kelechi joins in.
- m13b_bitrus — Sgt. (rtd.) Bitrus Gyang at the gatehouse. Three approaches:
  A lie (pretend to be a delivery man) → m13b_bitrus_lie (he sees through it; cold) flag {s2_bitrus:'cold'}
  B the truth ("I'm NACECA. I need to know who comes here.") → m13b_bitrus_truth (he respects it; asks why; the
    player must give a real reason) — this branch ends on two choices: ask him to keep the book safe and testify
    (flag {s2_bitrus:'witness'}) or just photograph the pages (flag {s2_bitrus:'photo'})
  C money → m13b_bitrus_money (insulted; cold) flag {s2_bitrus:'cold'}
- m13b_book (DOCUMENT): visitor book pages, eleven rows: the black Prado ABJ-260XR "CHAIRMAN" (drv. EREBA) and
  "Hon. K.F. (NACECA)" on the second Fridays 11/09, 09/10 and 13/11; decoys 30/09 (generator service), 23/11
  (electrician), 27/11 (a Rep at the wrong house), 04/12 (the cleaner), 09/12 (a delivery). Ask: what does the book
  prove? Proof: a 2nd-Friday Hon. K.F. line and a "CHAIRMAN" line on the same night. evidenceId 'visitor_book'.
  Baba Shayi keeps his character on Senior ("he writes everything down"); his advice on how to approach Bitrus is
  Recruit-only. The DG drives himself in a small green Peugeot.
- m13b_suv (2–3 lines: the black SUV arrives; Godwin Ereba gets out; tonight is the second Friday) and m13b_end.

### Case 15 · The Barge — RIVERS · BONNY RIVER, RIVERSTONE JETTY, 23:30 (prefix m15_)
- m15_brief (a Friday in Feb 2027; Danladi/Okundaye/Uche; the trial result and what the sources say; the Senator will
  be on the jetty in person to move the last of the cash before the forfeiture order is heard at two on Monday
  afternoon; when `s2_barge==='seized'` Danladi explains the bond that released TEKENA 2). Variants are chosen by code from flags; write a core brief
  plus short insert keys: m15_brief_ibinabo (her boats can carry the team in by water), m15_brief_bitrus (the Senator
  left Abuja at noon), m15_brief_karo (Lucky's boys moving cash), m15_brief_felix (barge layout: cash room aft).
- m15_taskforce — at the gate, ACP Lawal's "special task force" (sent by the DG) orders the team out. Write versions
  m15_taskforce (gate entry) and m15_taskforce_water (they come by water and the task force is left at the gate).
- m15_cashroom (2–4 lines; the cash room on the barge).
- m15_senator — the Senator on the jetty: charm, contempt, the foundation, schools he built; he expects immunity;
  Kelechi (or Barrister Danladi) answers: section 308 covers four offices, and a Senator's isn't one. 6–10 lines.
- m15_dg_call — the DG calls Kelechi's phone: stand down and you'll be Zonal Commander by Monday. Decision:
  A truth: arrest the Senator flag {s2_end:'truth'} effect {integrity:+8, agencyFavour:-6, publicTrust:+6}
  B career: stand down flag {s2_end:'career'} effect {integrity:-10, agencyFavour:+8}
- m15_end_truth / m15_end_career (6–8 lines each).
- m15_accuse_lead (2–3 lines leading into the accusation screen) and m15_reveal_* (the DG confronted, written for
  outcomes: m15_reveal_proven, m15_reveal_contested, m15_reveal_unproven, 4–6 lines each).
- Epilogue slides (array): for Lucky, Ejiro, Mama Karo, Felix, Pa Timi, Sotonye, Chairman Ibinabo, Bitrus,
  Barrister Zainab Danladi, Commander Itohan Okundaye, Tobi (only if `V13.tobiAlive()`: a rescue slide, or the
  chase-alive slide "Sgt. Uche carried Tobi out of Asaba…"; a dead Tobi gets none), Uche, the DG, the Senator,
  Adaeze (by `V13.s1fate()`), Kelechi — each with variants keyed to flags (write as a JS function
  `V13.epilogueS2 = function(){ ... return [{art, name, text}, ...]; }` using S.game.moralChoices / S.game.s2).
- Season 3 stinger (`V13.STINGER_S2`, a getter read at render time): KANO · 05:40 — the cooperative truck; a
  stranger's cargo; one line that the money did not stop with the Senator. Musa drives it only if he talked in
  Season 1 (`musaTalked`); otherwise "the cooperative's newest driver" does. Card: "SEASON 3" + a one-line tagline.

## 5. Aftermath, hub phone, sources (prefix per case)
- For each case write `V13.AFTER[<missionId>] = { headline:(state)=>({pub, head, ded}), tip:'one real-world scam/fraud
  safety tip', next:'one sentence teaser for the next case' }` (missionIds: m9, m10, m11, m12, m13, m13b, m14, m15).
  pub = an invented masthead (THE LAGOS LEDGER, THE DAILY GONG, NATIONAL DISPATCH, WAVE24 NEWS, THE ISLAND HERALD,
  DELTA CHRONICLE, THE WATERFRONT HERALD).
- Hub phone messages between cases: `V13.PHONE = { after_m9:[...], after_m10:[...], ... }` where each message is
  `{ who:<thread id>, text, cond?:'js expression string' }`. The thread ids are code ids (see section 6); the
  phone book gives the display names. 3–6 messages per hub, some conditional on flags; texture and humour; Musa
  texts from Kano once (Season 3 seed) only if he talked in Season 1. Tunde never texts when your Lagos charge sheet
  held him or at Heat 70+; KC never does when it held him, and KC, back in Ikeja, hears Benin through "my guy for
  Benin phone market".
- Source tips: `V13.TIPS = { HERBS:[...], TILL:[...], NETS:[...], TIDE:[...], GATE:[...], KC:[...], TUNDE:[...] }`, each
  tip `{ after:'m10'|'m11'|..., text, true:true|false }` — some tips are planted (false) once the source is exposed.

## 6. Canon decisions of the Season 2 fix pass (binding, 20 Oct 2026)
These settle where Season 2 met Season 1 canon (docs/STORY-CANON.md, "Season 2"). They override anything above.

**The Season 1 snapshot.** The first time a Season 2 case or office loads, the core layer saves the Season 1
outcomes Season 2 reads as plain data in `S.game.s2.s1snap`: `{ tobiAlive, tobiTestifies, bribe, kcFair, kcWrong,
tundeWrong, musaTalked }` (`V13.s1snap()`; before it exists, the live Season 1 values are used). `V13.tobiAlive()`
and `V13.tobiTestifies()` read it. Adaeze's fate is `V13.s1fate()` = `S.game.s2.s1fate`, else
`moralChoices.finale`, else 'unproven'; Season 2 never writes `moralChoices.finale` or `flags.finale`, so Season 1's
epilogue, case review and trial keep telling her verdict as Season 1 left it, and the layer stays removable.

**Tobi.** Alive iff `asaba==='rescue' || (asaba==='chase' && !S.game._asabaHostageLost)`; he testifies iff
`asaba==='rescue'`. He is Season 1's accountant, now a civilian Zonal took on to read the payroll: he reads and
decodes ledger codes and company records. Mr. Igbinosa runs the bench, the image, the hashes, the tracker and every
section 84 certificate in every save, and is PW2 at the trial. Retired keys stay in the files, unused:
`m9_forensic_tobi*`, `m9_cert_tobi`, `m13_wire_offer_tobi`, `pw_tobi*`, and the Tobi `lines` of `cert_tracker`.

**The drive.** Season 1's trial of Adaeze used only the payroll folder, on certified printouts (Tobi read it for
eleven days). The drive came back from the registry sealed; nobody imaged the whole of it or opened `_old` until
Case 09. Season 2's case against Lucky uses "the same drive", not "the same ledger".

**C.A.** The UPSTREAM ledger's "C.A." line (₦4.8m in cash on the 10th, paid by R.M.S.) is Adaeze's second paymaster,
beside Season 1's Foundation retainer (₦10M to C.A. Consulting on the 1st). The texts say so.

**The calendar.** Every Season 2 date after 12 Sep 2026 moves +63 days (nine weeks; weekdays unchanged). "Six weeks
later" stays. The UPSTREAM ledger (Jun–Sep, last saved 12 Sep 2026) stays.

| Case | Date |
|---|---|
| 09 The Evidence Room | Wed 2 Dec 2026 |
| 10 The Night Market / 11 Black Rain | Thu 3 / Fri 4 Dec 2026 (TEKENA 2 sailed Tue 1 Dec) |
| 12 Paper Oil | Thu 10 Dec 2026 |
| 13 The Ninth Floor / 13½ The Gateman's Book | Fri 11 Dec 2026 (the second Friday) |
| Pre-trial conference | Fri 8 Jan 2027 |
| 14 FRN v. Edafe & 2 Ors | opens Mon 11 Jan 2027, 9 a.m., Court 5 (after the court's Christmas vacation) |
| 15 The Barge | a Friday in February 2027; the forfeiture is heard at two on Monday afternoon |

The counts run "between March and December, 2026"; the T4 log is "March to December, sixty-two pages", "nine months of
transactions". The DG on the jetty says "before Easter" and "before the rains"; the epilogue's hamper comes at
Easter and Adaeze's contested trial is "listed again for May".

<!-- lint:renames -->
The date moves, old to new: 17 SEP → 19 NOV; 22 / 29 SEP → 24 NOV / 01 DEC; 24 SEP → 26 NOV; 25 SEP, "25 September" →
27 NOV, "27 November"; 26 SEP → 28 NOV; 01 OCT → 03 DEC; 02 OCT → 04 DEC; "SEP / OCT" → "NOV / DEC";
"TANK STOCK 08/10" → "TANK STOCK 10/12"; "OCTOBER 2026" → "DECEMBER 2026"; "a Friday in October" → "a Friday in
December". The visitor book: CHAIRMAN and K.F. pairs on 11/09, 09/10 and 13/11 (FRI); decoys 30/09 WED, 23/11 MON,
27/11 FRI (the Rep), 04/12 FRI (the cleaner), 09/12 WED (the delivery).
<!-- /lint:renames -->

**Names** (Season 2's own people, renamed so none echoes a Season 1 character or a real person; code ids stay):

<!-- lint:renames -->
| was | is |
|---|---|
| Commander Grace Osagie, "— G.O.", "Cdr. G. Osagie", speaker COMMANDER OSAGIE | Commander Itohan Okundaye, "— I.O.", "Cdr. I. Okundaye", speaker COMMANDER OKUNDAYE |
| Inspector (rtd.) Bassey Okon | Inspector (rtd.) Effiong Asuquo |
| Barrister Hauwa Danladi, "HD", "H. Danladi Esq." | Barrister Zainab Danladi, "ZD", "Z. Danladi Esq." (speaker BARRISTER DANLADI unchanged) |
| Inspector Danjuma (HQ escort) / Danjuma (gateman) | Inspector Yakubu / Garba |
| Daniel Gbenga Oke (D.G.O.) / Mama Oke | Daniel Gbenga Olayemi / Mama Ufuoma |
| Femi Coker-Odusote, SAN | Femi Olaniran-Cole, SAN |
| MAMA EFE · BUKA, MAMA EFE KITCHEN | MAMA TEGA · BUKA, MAMA TEGA KITCHEN |
| Tari (camp boy) / Ebi (grandson) | Preye / Tonbra |
| Sen. Tamuno Douglas-Akpan | Senator Tonye Douglas-Akpan |
| "Divine Grace Oil" | "Daily Gold Oil" |
| 4B Harbour Close (BQ) / 4 Harbour Close | 11B Harbour Close (BQ) / 11 Harbour Close |
| PORT HARCOURT TIDE (newspaper) | THE WATERFRONT HERALD (the source codename TIDE stays) |
| "FRN v Akaeze" | no case name: "the Supreme Court has held…" |
| "Lagos Cybercrime" | "Lagos Cyber & Financial Crimes" |
| "the anti-fraud agency", "NATIONAL ANTI-CYBERCRIME & …" | "the anti-corruption agency", "NATIONAL ANTI-CORRUPTION & ECONOMIC CRIMES AGENCY" |
| Kuti on the docket: "Mr. K. Kuti", "signed: K." | "Mr. A. Kuti", "signed for the DG: A.K.", "signed: A.K.", "— A.K." |

Code ids that stay: the phone threads `who:'OSAGIE'` and `who:'HAUWA'`, the cast and art ids `osagie`, `hauwa`,
`mamaefe` (`osagie_neutral`, `hauwa_neutral`), the candidate ids, and DIALOGUE keys such as `m9_osagie*`, `m12_hauwa*`.
<!-- /lint:renames -->

**Vehicles.** No Season 2 car echoes Season 1's plate cars (the government saloon at Lekki and Zuma Court, the
Engineer's jeep): the DG drives himself in a small green Peugeot; a silver Camry watches the Abuja hotel; Sotonye
drives a red Kia; the Senator's black Prado is ABJ-260XR, and the tips call it "a black Prado".

**Branches Season 2 respects.** Musa drives the cooperative truck and texts from Kano only if he talked in Season 1;
otherwise the stinger's driver is "the cooperative's newest driver". Tunde never texts if your Lagos charge sheet
held him or at Heat 70+; KC never does if it held him, and his Benin news comes through a contact. A barge seized in
Case 11 is released to Riverstone on a bond, and Case 15 says so. Count One charges the theft of crude oil only
(the kidnapping was about silencing evidence, not ransom).

**Continuity.** Sgt. Ikpe 22 years in the cage; Igbinosa 19 years in forensics; Uche 22 years in uniform; nine
arrests at the camp; forty-odd drums, three on the fire; TEKENA 2 about 171,000–180,000 L a sailing; Sotonye a mother
of two; the promotion letter dated the day before the meeting; the suspension before noon; Okundaye offers the pen on
a video call from Benin.
