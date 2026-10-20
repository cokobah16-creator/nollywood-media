# NACECA Season 2 — Case 14 courtroom content contract

ROOT = the original Season 2 workspace (its src13/v13_*.js files are src/season2/s2_*.js in this kit)
Read first: ROOT/s2/CASES.md (the season, cast, flags, evidence ids), ROOT/scratchpad/brief/final.md one level up
(i.e. /tmp/claude-0/-home-claude/7b51e83a-5808-56a0-9efa-878214b5d6ed/scratchpad/brief/final.md — the legal research
brief with sections and cases), and samples of the game's dialogue voice in ROOT/game_code.html (DIALOGUE, from line 1330).
The project owner is a Nigerian lawyer: procedure, terms and section numbers must be right, and the drama must be good.

You write ONE file: ROOT/src13/v13_court_data.js, which defines `V13.COURT_DATA` (schema below). Plain data and
small text-returning functions only; no DOM, no game logic. The engine (written separately) decides conditions and
calls your text. Begin the file with `(function(){ const V13 = window.V13 = window.V13 || {}; V13.COURT_DATA = {...}; })();`

## The case
FRN v. Lucky Edafe & 2 Ors · Charge No. FHC/ABJ/CR/214/2026 · Federal High Court, Abuja Division, Court 5 ·
Hon. Justice T. O. Bakare. Prosecution: Hauwa Danladi (NACECA Legal; "H. Danladi Esq. with A. Okoro Esq.").
Defence: Femi Coker-Odusote SAN (for the 1st defendant; elegant, devastating, lawful — never a cartoon) and a Legal
Aid counsel for the others where needed.
Defendants: D1 Lucky Edafe (currency changer), D2 Felix Ugbekile (camp manager), D3 Sotonye Jumbo (tank-farm manager).
Counts:
- Count 1 (D1): money laundering — Money Laundering (Prevention and Prohibition) Act 2022, s.18 — dealing with
  (withdrawing, converting, transferring) funds he knew or reasonably ought to have known were proceeds of unlawful
  activity (crude-oil theft; ransom).
  Elements: E1a he dealt with the funds; E1b the funds were proceeds of unlawful activity; E1c he knew or ought
  reasonably to have known.
- Count 2 (D2): dealing in crude oil / petroleum products without lawful authority — Miscellaneous Offences Act s.1(17).
  Elements: E2a dealing (refining, storing, selling); E2b no licence or lawful authority.
- Count 3 (D3): receiving and dealing in petroleum products without lawful authority, and making false entries
  (Miscellaneous Offences Act s.1(17); keep the false-entry part as a description in the charge, no extra section).
  Elements: E3a she received/stored/sold the product; E3b no lawful authority; E3c she knew its origin.
Kidnapping is not charged here (state offence; note it in a line if useful). The DG and the Senator are not defendants;
this trial matters because what is admitted and who testifies (Sotonye, Felix, Ejiro) ties Riverstone to the Senator.

## How the engine runs it (what text it needs)
Day 1 — call, appearances, arraignment and pleas, prosecution opens, PW1 Kelechi sworn, examination-in-chief with
exhibits tendered (objections ruled on the spot). Adjourned.
Between days the player may complete fixes (certificates etc.).
Day 2 — cross-examination of PW1 by the SAN (attacks chosen by the engine from the player's history), re-examination,
other prosecution witnesses (short), trial-within-trial if Lucky's statement is challenged, prosecution closes,
no-case submission and ruling. Adjourned.
Day 3 — defence case (Lucky testifies; the player suggests one question to Danladi), final addresses (summarised),
judgment and allocutus/sentence.

Before Day 1: a pre-trial conference in the NACECA legal office: Danladi consults Kelechi (ACJA s.270(5)) about
plea bargains for D3 (offered if s2_sotonye is 'witness' or 'pressured') and D2 (offered if s2_felix is 'cooperating').
A plea bargain means that defendant pleads guilty at arraignment to the agreed (reduced) count and becomes a
prosecution witness (accomplice: s.198 warning).

## Conditions vocabulary (the engine evaluates these; you key text to them)
Player history: bribe (took money from Chief Obi in Season 1), custody_unsigned, method_direct, method_photo,
original_handed (original drive went to Abuja and is "missing"), original_kept, statement_car, statement_threat,
statement_proper, samples_grabbed, no_warrant, searched_woman_self, inventory_skipped, sotonye_pressured,
felix_threatened, ejiro_source (Ejiro is an accomplice who turned), source_unregistered (any source never
registered), sources_registered, ninth_bury (Kelechi accepted the DG's offer — the SAN knows Kelechi was promoted),
ninth_refuse (Kelechi is suspended — the SAN uses that), adaeze_proven / adaeze_contested / adaeze_unproven,
camp_navy (Kelechi had the camp burned), camp_mass (mass arrests), lucky_followed (Lucky was arrested later, not at
the jetty).
Fixes (done between hearings): cert_pos (s.84 certificate from the POS provider's compliance officer for the T4 log),
bank_cert (a bank officer certifies the account statements and BVN records — banker's books + s.84),
ctc_cac (certified true copy of the CAC record), search_record (written record of the search for the missing original
drive, letters to HQ and their replies), cert_tracker (s.84 certificate for the tracker log, from Tobi/Igbinosa).

## Schema of V13.COURT_DATA
All `lines` arrays are `[{ who, text }]`, `who` one of: 'REGISTRAR', 'JUDGE', 'DANLADI', 'SAN', 'LEGAL AID',
'KELECHI', 'LUCKY', 'FELIX', 'SOTONYE', 'EJIRO', 'TOBI', 'IGBINOSA', 'IKPE', 'USHER', 'NACECA SYSTEM' (narration).
Keep each line under ~200 characters. Use real courtroom register ("My Lord", "I most humbly apply", "Objection,
my Lord", "Overruled", "Sustained", "The document is admitted and marked Exhibit P5", "tendered and rejected",
"This matter is adjourned to …"). Number prosecution exhibits P1, P2… in the order the engine admits them — so in text
use the token `{EXH}` where the exhibit number goes; the engine fills it.

```
V13.COURT_DATA = {
  meta: { number, title, court, judge, prosecution, defence },
  charge: { count1, count2, count3 },               // the counts as the registrar reads them (one paragraph each)
  conference: {
    open: lines,                                     // Danladi + Kelechi; what the trial is; how exhibits will be attacked
    sotonye: { ask: lines, yes: lines, no: lines },  // recommend a plea bargain for D3 or not
    felix:   { ask: lines, yes: lines, no: lines },
    close: lines
  },
  day1: {
    call: lines,              // registrar calls the case; appearances
    arraign: { d1: lines, d2_notguilty: lines, d2_plea: lines, d3_notguilty: lines, d3_plea: lines },
    open: lines,              // Danladi's short opening; PW1 sworn (on the Bible or the Qur'an — let Kelechi choose? no: he takes the oath, keep it neutral)
    exam: [                   // examination-in-chief: 8–10 questions in order
      { id, ask: lines,       // Danladi's question
        answers: [            // exactly 3: one good (personal knowledge, precise), and two flawed (hearsay / speculation / overclaiming)
          { text, kind: 'good'|'hearsay'|'speculate'|'overclaim', reply: lines, cred: n }   // reply = what follows (objection + ruling for flawed ones); cred = credibility change (-8..+3)
        ],
        tender: 'evidence_id' | null   // if set, after this question Danladi applies to tender that exhibit
      }, …],
    adjourn: lines
  },
  exhibits: {                 // one entry per tenderable evidence id (see list below)
    <evidence_id>: {
      name,                   // as it would be described in court ("the forensic image of exhibit 14 on a sealed drive")
      apply: lines,           // Danladi applies to tender it through PW1
      clean: lines,           // no objection; admitted ({EXH})
      objections: [           // checked in this order; the first whose `when` matches fires (the engine evaluates `when`)
        { when: 'condition or condition && condition', san: lines,
          responses: [ { text, ok: true|false, needs: 'fix id' | null, reply: lines } ],   // 2–3 options for Danladi/Kelechi; ok=true means the foundation is good if `needs` is done
          admitted: lines,    // ruling when the response holds ("admitted and marked {EXH}"; may add "the weight is a matter for final address")
          rejected: lines,    // ruling when it fails ("tendered and rejected")
          weight: 'full'|'reduced' }  // if admitted after this objection, does it carry full or reduced weight
      ]
    }
  },
  cross: [                    // the SAN's attacks; the engine picks those whose `when` is true, in this order, max 6
    { id, when, q: lines,     // the SAN's question(s)
      answers: [ { text, kind: 'truth'|'lie'|'combative'|'evasive', reply: lines, cred: n, exposed: lines|null } ] }  // exposed = what happens if a lie is caught (the SAN produces the document)
  ],
  reexam: [ { id, fixes: ['cross id', …], ask: lines, answer: lines, cred: n } ],   // the player picks one to repair
  witnesses: {                // short testimony scenes (exam + 1–2 cross questions, 6–10 lines each)
    pw_tobi, pw_igbinosa,     // forensic analyst: the s.84 certificate, the image, the hash
    pw_ikpe,                  // the custodian: the register (if signed) — or the gap (if unsigned): write pw_ikpe and pw_ikpe_gap
    pw_ejiro,                 // accomplice (only if ejiro_source)
    pw_sotonye,               // only if her plea bargain was taken: she names TEKENA 2, Riverstone, Godwin Ereba, and who Ereba drives for
    pw_felix                  // only if his plea bargain was taken
  },
  twt: {                      // trial-within-trial on Lucky's statement (only if the defence challenges it)
    proper: lines,            // challenged but recorded on video with his lawyer present → admitted (Omoha: a mere denial goes to weight)
    car: lines,               // no video, no lawyer → rejected (FRN v Akaeze)
    threat: lines             // oppression alleged; Uche/Kelechi testify; the court finds oppression not disproved → excluded (s.29)
  },
  nocase: {                   // SAN's no-case submission and the ruling, per defendant still on trial
    submit: lines,
    d1_overruled: lines, d1_upheld: lines,     // (ACJA s.302–303: whether an essential element lacks any evidence)
    d2_overruled: lines, d2_upheld: lines,
    d3_overruled: lines, d3_upheld: lines
  },
  defence: {
    lucky: lines,             // Lucky's evidence-in-chief (fuel business; he says he never knew)
    suggest: [ { text, good: true|false, lines } ],   // 3 questions Kelechi can pass to Danladi for cross-examining Lucky; one is devastating
    addresses: lines          // final written addresses, summarised in 3–4 lines
  },
  judgment: {
    open: lines,
    element: { e1a_yes, e1a_no, e1b_yes, e1b_no, e1c_yes, e1c_no, e2a_yes, e2a_no, e2b_yes, e2b_no, e3a_yes, e3a_no, e3b_yes, e3b_no, e3c_yes, e3c_no },
                              // each a function (ev) => string, where ev is { admitted: ['evidence_id', …], weight: { id: 'full'|'reduced' }, witnesses: ['sotonye', …], cred: 0..100 } — the judge's reasoning on that element in one or two sentences naming the exhibits/witnesses that carry it (or are missing)
    guilty: { d1, d2, d3 }, notguilty: { d1, d2, d3 },   // lines
    allocutus: { d1, d2, d3 }, sentence: { d1, d2, d3 },  // lines (sentences within the statutes: MLPPA s.18: 4–14 years; Misc Offences Act s.1(17): realistic terms; plea-bargained defendants get the agreed sentence)
    close: lines              // the courtroom after; Danladi to Kelechi; what this means for the Senator
  },
  fixes: {                    // between-hearing tasks shown in the hub (title, who, 2–5 lines each)
    cert_pos, bank_cert, ctc_cac, search_record, cert_tracker
  },
  hub: { after_day1: lines, after_day2: lines }   // short scenes in the Abuja hub between hearing days
}
```

Exhibits to cover (evidence ids from CASES.md): drive_image, upstream_ledger, evidence_register, pos_t4_log, bvn_link,
cash_bundles, lucky_statement, fuel_samples, waybill_book, felix_phone, barge_track, loading_log, tank3_sample,
cac_record, bank_trail, gate_register.
Rules to encode (from the brief): s.84 certificate or oral foundation (Kubor v Dickson; Dickson v Sylva) for computer
output (drive image, ledger printout, POS log, tracker log, phone extraction, loading log USB); public documents only
by certified true copy (CAC record: ss.89(e), 90(1)(c), 104); banker's books (statements, BVN records: ss.89(h), 90(1)(e));
secondary evidence of a lost original after all possible search (s.89(c)); confessions (ACJA ss.15(4), 17(2);
FRN v Akaeze; Evidence Act s.29); evidence from a search without a warrant or with ACJA breaches (ss.9(3), 10) weighed
under Evidence Act ss.14–15 (deliberate shortcut → likely excluded; inadvertent → admitted with reduced weight);
broken chain of custody → doubt to the defendant; accomplice evidence → s.198 warning; source identity protected
(s.189) but their information is hearsay (ss.37–38).
Cross-examination attacks to include (with `when`): bribe; custody_unsigned; method_direct; method_photo;
original_handed; statement_car; statement_threat; no_warrant; searched_woman_self; inventory_skipped; samples_grabbed;
source_unregistered (paid informants); ninth_bury (promoted after the DG's meeting — "a reward?"); ninth_refuse
("suspended officer with a grudge against the agency"); adaeze_* (personal vendetta: built a career on his
commander's downfall); camp_navy (burned the evidence); plus one always-on attack about hearsay ("you did not see
the crude stolen, did you?"). In each, the truthful answer must be the best long-term choice but should cost something
in the moment; lies must be catchable by documents the SAN plausibly holds.

Hand-in: the file, and a short note listing anything the engine must know (e.g. a `when` you introduced).
Write with craft: tension, dry wit from the bench, a SAN who is a joy to watch, Kelechi under pressure. Nigerian
courtroom texture (the registrar's cadence, counsel announcing appearances, "My Lord, we are ready to proceed").
