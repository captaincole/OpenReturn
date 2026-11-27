# Form 8862 — open questions

Form 8862 claims the EIC, the child tax credits (CTC, ACTC, ODC) or the AOTC again after the IRS reduced or disallowed one in an earlier year. It has no dollar arithmetic. Each item below is a place where the form and its instructions (`irs-8862-inst-2025`) do not settle a rule. The items keep their numbers, which the code and the notes below cite.

## How the engine learns of a denial

- EIC: `eic.denied_in_earlier_year` and `eic.barred_by_irs`, which Cade already asks of every filer the EIC may reach. The denial answer is "yes" only when the credit was not allowed again since on a return with Form 8862 (Exception 1, `general-instructions::b02`, `::b03`); the fact key's definition and Cade's question both say so.
- Child tax credits: `ctc.denied_in_earlier_year` and `ctc.barred_by_irs`. AOTC: `aotc.denied_in_earlier_year` and `aotc.barred_by_irs`. These are optional: absent means no denial was stated.
- A stated EIC denial makes Form 1040 line 27a wait for Part II's answers, and a gap when Part II disagrees with the EIC's own answers. A stated CTC or AOTC denial files the form with Part III or IV, which the dependent and student facts fill, so the credit never pays without the form.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

- **A78, the ban.** "Do not file Form 8862 for the 2 years ... or 10 years" against "if you disagree ... you should file Form 8862" (`general-instructions::b03`, `::b05`). Decided: a stated ban means no Form 8862 and no credit (`resolveInfo.ts`).
13. **Line 15 for a child released by Form 8332 (A79).** Line 15's list says "Lived with you for more than half of the year" with no exception (`line-15::b01`); line 14 allows the divorced-parents exception (`line-14::b01`). Decided: "Yes", as for line 14 (`partIII.ts`). Dollars: a "No" would deny the child's whole child tax credit. The blind fill reached the same answer (blind case 12).

## Should we do this now

Each is a default with no conflicting text. The engine applies it now; where it does not, one sentence says why.

1. **The year of the denial.** The form does not ask it. The rule is "a year after 1996" (EIC) or "after 2015" (the others) (`general-instructions::b01`). Done: the denial answers carry the year rule and Exception 1 (`::b02`, `::b03`: a later Form 8862 allowed the credit since) in their definition and in Cade's question. No dollar change.
2. **Lines 4 and 11 on a joint return.** The form asks about "you (or your spouse if filing jointly)". The 1040 EIC steps skip both questions for a joint return. Done: "No" for both spouses, by the joint return test (`line-6::b01`, item 4: a joint return "only to claim a refund" is the exception, and a return that claims the EIC is not one). No dollar change.
3. **Line 6 "No".** The form face sends a filer without a qualifying child to Section B ("If you are claiming the EIC with a qualifying child, continue to Section A. Otherwise, go to Section B"), yet line 6 has a "No" box. Done: line 6 is "Yes" in Section A and blank in Section B. No dollar change.
4. **Line 7 without a day count.** "Enter the number of days each child lived with you in the United States" (`line-7::b01`). Done: 365 for a child born or who died in 2025 (`line-7::b02`) and for a child with the filer 12 months with `livedInUs` true (the Schedule EIC line 6 reading of the months as U.S. months). Else the stated `daysLivedWithYouInUs`, which Cade records with `record-dependent`. No dollar change.
5. **Line 7 under 183 days.** "If you enter less than 183 ... you cannot claim the EIC for that child" (form face). The EIC counts a child from the months on the dependent fact. Done: a day count under 183 for a child the EIC counts makes line 27a a gap that names the disagreement; the engine does not drop the child from Schedule EIC. Dollars: the whole EIC waits for a corrected fact.
6. **Line 9 under 183 days.** Same as 5, against `eic.main_home_in_us` (more than half the year). Done: a gap. Dollars: the whole EIC.
7. **Line 10, age at the end of the year.** Done: 2025 less the birth year. A filer born January 1, 2001 prints 24 although the EIC test treats a person as 25 on the day before the birthday (`line-10::b01`). No dollar change: the EIC test reads the dates.
8. **Line 10 for a person who died in 2025.** The age test is met by the age at death (`line-10::b01`, Examples 1 and 2). No fact holds a taxpayer's or spouse's date of death. Not now: line 10b is unsupported when `identity.spouse.year_of_death` is 2025, because the date needs a new identity fact (Pattern change below). No dollar change in the engine.
9. **Line 2, the CTC box when the credit is 0.** "Check the box(es) that applies to the credit(s) you are now claiming" (`line-2::b01`). Done: the box is checked only when Schedule 8812 line 14 or line 27 is above 0; with no tax and no ACTC (an other dependent only) the box is unchecked and the form can leave the return. No dollar change.
10. **The AOTC under a ban.** "Don't claim the American opportunity credit for 2 years ... or 10 years" (`irs-8863-inst-2025::sec::american-opportunity-credit::b01`). Whether the student's expenses then go to the lifetime learning credit is not said there. Not now: Form 8863 is a gap with the reason, because no text settles the lifetime learning credit. Dollars: the whole education credit waits.
11. **More than four children, four other dependents or three students.** Each asks for an attached statement (form face, lines 12, 13, Part IV). The engine writes no statements. Not now: the last column's name (12d, 13d, 18c) is unsupported with the reason, because a statement is a new kind of output. No dollar change.
12. **Line 14, the kidnapped child exception.** `line-14::b01` names it; no fact records it. Not now: only the Form 8332 release counts as an exception, because a kidnapped child is rare and the credit reads the same fact. No dollar change.
14. **Schedule EIC line 6 for a child who died in 2025.** The form says "If the child was born or died in 2025 and your home was the child's home for more than half the time they were alive during 2025, enter “12.”" (`irs-1040seic-face-2025::sec::face-page-1::b04`). Done (2026-11-26): line 6 prints 12 for a child born or who died in 2025, so it agrees with Form 8862 line 7 (365). No dollar change.

## Pattern change

- **Ask every CTC and AOTC filer about an earlier denial.** Before: the EIC asks `eic.denied_in_earlier_year` of every filer it may reach, but the child tax credits and the AOTC read their denial answers only when Cade records them. After: Cade asks both of every return with children or students, which adds two questions and changes the pending inputs (and `readyToFile`) of every such scenario and the e2e runs; a person decides.
- **A date of death for the taxpayer and the spouse.** Before: only `identity.spouse.year_of_death` exists, so Form 1040's deceased boxes and Form 8862 line 10 for a 2025 death are unsupported. After: a new identity fact holds each filer's date of death, and several forms read it.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header, line 1 | stated rule |
| Line 2 boxes | own reading (doubt 9) of a stated rule |
| Line 3 | stated rule (an answer) |
| Line 4 | stated rule; own reading on a joint return (doubt 2) |
| Lines 5, 6 | stated rule; line 6 "No" own reading (doubt 3) |
| Line 7 | published example (`line-7::b02`, 365); own reading for 12 months (doubt 4) |
| Line 8 | stated rule |
| Lines 9a, 9b | stated rule (an answer) |
| Lines 10a, 10b | stated rule; unsupported for a 2025 death (doubt 8) |
| Lines 11a, 11b | stated rule; own reading on a joint return (doubt 2) |
| Lines 12, 13 | stated rule; the fifth person unsupported (doubt 11) |
| Lines 14–17 | stated rule (`line-14::b01`, `line-15::b01`, `line-16::b01`); line 15 for a released child is rule A79 (doubt 13) |
| Line 18 | stated rule; the fourth student unsupported (doubt 11) |
| Lines 19a, 19b | published example (Sharon, Wilbert, `irs-8863-inst-2025::sec::american-opportunity-credit::b02`, `::b03`) |

## Second opinions

- **Blind fill (2026-11-26).** 15 cases filled by hand from the blank form and `irs-8862-inst-2025`. Every line matches the engine. The blind doubts are items 1–4 and 13 above and row A78.
- **PolicyEngine-US 2.154.1 (commit 0fbed6ddb1).** It has no Form 8862. It models only the AOTC ban (`is_barred_from_american_opportunity_credit_due_to_improper_claims`), and then counts the student's expenses for the lifetime learning credit. The engine makes Form 8863 a gap instead (item 10). The IRS text does not settle it: the ban is a caution above the seven AOTC requirements (`irs-8863-inst-2025::sec::american-opportunity-credit::b01`), and the lifetime learning tip covers only a student who fails those requirements (`::b06`). The engine keeps the gap. The EIC age limits (25 to 64) and the AOTC 4-year count agree with lines 10 and 19b.
- **IRS Direct File (tax year 2024, commit e365f9f).** It fills Parts I to III; Part IV is out of its scope.
  - Line 6: Direct File checks "No" for a filer with no qualifying child; the engine leaves it blank (item 3). No dollar change; the engine keeps its reading.
  - Line 7: Direct File turns months into days (6 → 183, 9 → 273, 12 → 365); the engine prints 365 for 12 months and else asks for the days, as the line asks (item 4). No dollar change from 7 months up.
  - Lines 14 to 17: Direct File always answers "Yes" for a child counted for the credit, the same as the engine and rule A79.
  - A ban with no appeal claims no credit, and a later Form 8862 that allowed the credit ends the need for one: both agree with the engine (A78, item 1).

## Proposals for a discussion

The two items under "Pattern change" above.
