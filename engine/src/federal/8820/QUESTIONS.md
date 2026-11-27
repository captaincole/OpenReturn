# Form 8820 — open points

Form 8820 (Rev. September 2018) is the current form for 2025; its instructions are in the same PDF (`irs-8820-form-2025`). The instructions publish no example with numbers, and a web search found none. Every rule below is a stated rule or the author's reading.

## Decisions (with a `DECISION` comment and a row in `docs/rule-decisions.md`)

1. **The deduction goes down by line 2a, not line 2c.** The instructions: "reduce your otherwise allowable deduction ... by the amount of the credit on this line" (`irs-8820-form-2025::sec::line-2a::b02`, line 2a). The engine follows them (`lines.ts`). Dollars change only when line 2b holds an amount: with line 2a $50,000 and line 2b $900, the engine reduces the deduction by $50,000, and the statute's reading by $49,100. No scenario has both (jon has line 2b but elects the reduced credit). **For `docs/law-findings.md`:** section 280C(b)(1) disallows the part "equal to the amount of the credit allowable for the taxable year under section 45C" (`usc-26-2025::sec::s280c::b-1`), and section 45P(c) reduces the credit otherwise allowable by the Form 8932 credit on the same wages (`usc-26-2025::sec::s45p::c`). Read together, the statute points to line 2c.
2. **Which Schedule C lines give up the reduction** (`reduction.ts`). The instructions leave the lines to the taxpayer ("Identify the lines of your return ... on which the reductions were made", `line-2a::b02`). The engine takes it from line 26 (wages), line 22 (supplies), line 20a (computer rental) and line 11 (contract testing), in that order, each line by at most the clinical expenses of its kind. This is the order the research credit's Section F uses on branch `form-6765`.
3. **Line 3 rounds each K-1 before the add**, the rule of Form 8846 line 5 (A96), so line 4 equals Form 3800 line 1h. The blind fill (2026-11-27) took the Form 1040 rule instead: K-1s of $3,000.40 and $1,200.40 give $4,201 there and $4,200 in the engine. The engine keeps A112: one rule for every credit form that sends K-1 credits to Form 3800 (unit test in `tests/unit/federal/8820/form.test.ts`).

## Doubts with no conflicting text (no dollars change on a covered return)

4. **Capitalized expenses.** "In a case in which qualified clinical testing expenses are capitalized ... reduce the amount chargeable to capital account" (`line-2a::b02`; section 280C(b)(2)). The fact holds only deducted Schedule C expenses. A reduction the lines cannot take is a gap; the engine never reduces a capital account.
5. **Two credits on the same wages.** The placement caps each line at its stated amount, not at the amount left after the work opportunity or empowerment zone credit. `withCredits` in `facts/kinds/activitiesOnReturn.ts` then clips the line at 0. With both credits large on small wages, a dollar of reduction could go unused. Qualified wages already exclude wages used for the work opportunity credit (section 41(b)(2)(D)), so this needs wrong facts. Default: no change.
6. **Controlled group or common control.** "Your credit is determined on a proportionate basis to your share of the aggregate clinical testing expenses" (`member-of-controlled-group::b01`). The credit is a flat 25%, so the share gives the same dollars as the member's own expenses. The attached statement and "See Attached" are not printed.
7. **The attached statements.** Line 2a asks for a statement with "No" (the reduced deduction lines) and for a group member. The engine prints no statements.
8. **One fact per return, one business.** The fact names the one Schedule C business that deducts the expenses. A taxpayer with two testing businesses cannot state both yet.
9. **Ineligible testing and funded amounts.** Testing outside the United States (`testing-not-eligible-for-the::b01`) and amounts funded by a grant or another person (`purpose-of-form::b01`) are left out by the taxpayer: the fact holds qualified amounts only.
10. **Line 2b is asked only for the return's own Form 8932 credit** (a stated Form 3800 line 1w credit with no pass-through EIN) when line 1 holds wages. A K-1 differential wage credit is the entity's wages, not the taxpayer's. A stated line 2b with no such credit, or more than it, is a gap.
11. **Lines 5 and 6** are for estates and trusts. An individual stops at line 4, so they stay blank.
12. **Part II holds 26 drugs.** "Attach as many Part II pages as needed" (`part-ii::b01`). With more than 26, every Part II cell is a gap; Part I still computes.
13. **The decision `decisions.scope.must_file_8820` = false with a claimed credit.** The Schedule C reduction reads the fact, not the decision, so Form 3800 line 1h is a gap until the two agree (as Form 8846 does). With the election, nothing is reduced and there is no gap.
14. **A passive Schedule C business** (line G "No"): the credit is a passive activity credit, and the engine does not figure a passive Schedule C business. Form 3800 line 1h is a gap. Form 8820's own lines still compute.
15. **Computer rental** (from the blind fill). The Form 8820 instructions count "amounts ... that would be described as qualified research expenses under section 41" (`irs-8820-form-2025::sec::purpose-of-form::b01`). Form 6765 adds conditions for computer rental: "The computers must be located off your premises, and you must not be the operator or primary user of the computers" (`irs-6765-inst-2025::sec::section-g-columns-50-56::b03`). The fact holds qualified amounts only, so the taxpayer (and Cade) apply the conditions. A rental that fails them changes line 1 by its full amount. Default: no change; Cade's skill should ask about the conditions.
16. **Contract testing paid to a university** (from the blind fill). Form 6765 takes 100% only for energy research by a university and 65% for other contract research (`irs-6765-inst-2025::sec::section-g-columns-50-56::b04`). Form 8820 says "100% (instead of 65% or 75%) of contract research expenses are treated as clinical testing expenses" (`purpose-of-form::b01`), with no exception for the payee. The engine and the blind fill both take 100%; the Form 8820 text settles it.
17. **California.** FTB Pub. 1001: "Enter the amount of the federal Orphan Drug Credit that reduced the federal deduction for qualified clinical testing expenses on Schedule CA (540), Part I ... line 3 ... column B" (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b08`). The engine adds the reduction on every Schedule C line it lowered to the column B amount of the work opportunity credit (`wageCreditReduction`). Schedule CA (540NR) runs the same rule. California's own orphan drug credit is repealed; its carryover (FTB 3801-CR code 185, `ca-3801cr-inst-2025::sec::c-who-must-file::b01`) is a separate fact that this form does not touch.

## How Form 8820 must connect to Form 6765 (branch `form-6765`, not on this branch)

- **The same expenses cannot count twice.** "Qualified clinical testing expenses used to figure the orphan drug credit cannot also be used to figure the credit for increasing research activities" (`irs-8820-form-2025::sec::coordination-with-the::b01`; section 45C(c)(1), `usc-26-2025::sec::s45c::c`). When both facts exist, Form 6765's Section F lines 42 to 45 (`irs-6765-inst-2025::sec::line-20::b01` takes line 48) must exclude the amounts in `orphan_drug_credit.expenses`. The engine cannot check it: both are stated totals. Proposed check after the merge: a gap on Form 6765 line 48 when its QREs for a kind are less than the orphan drug fact's amount of the same kind for the same business, and a note in Cade's skill.
- **Base period.** "Any of these expenses that are also qualified research expenses must be included in base period research expenses when figuring the credit ... in a later tax year" (`coordination-with-the::b01`; section 45C(c)(2)). Form 6765's prior-year QREs (`irs-6765-inst-2025::sec::line-21::b01`) are stated answers; Cade must include the orphan drug expenses in them. No engine change.
- **Both reductions on the same Schedule C lines.** On main, Form 8820's reduction is in `BUSINESS_CREDIT_REDUCTIONS` (four entries, one per line). The `form-6765` branch reduces the same four lines in the same order in its own `withResearchCredit`, after the work opportunity wages. The merge must place one credit's reduction on what the other left (for example, Form 6765 placing on the lines after Form 8820's entries), so no line gives a dollar twice. Schedule CA line 3 column B on the branch adds the research reduction by its own rule (California conforms but uses its own credit), so `wageCreditReduction` must not add the research reduction again.

## Proposals for a discussion

- **One placement module for both research credits.** `federal/8820/reduction.ts` and the branch's `federal/6765/reduction.ts` have the same order and the same rule. After the merge, one shared function (for example `federal/researchReductions.ts`) can place both credits, Form 8820 first, on the stated lines, and give each its gap. This changes how two forms reduce Schedule C, so a person decides.

## Blind fill (2026-11-27)

A blind preparer filled 14 cases from the form and its instructions only. Every line matched the engine except case 9 (two K-1s with cents, no own testing): line 3 and line 4 were $4,201 against the engine's $4,200 (decision 3 above), and line 2c was 0 against the engine's blank (blank against 0 only; "Figure any orphan drug credit from your own trade or business on lines 1 and 2a", `specific-instructions::b01`).

## Second opinions

- **PolicyEngine-US 2.154.1** (commit 0fbed6ddb1): it does not model the orphan drug credit. No variable or parameter names section 45C, section 280C(b) or clinical testing, and `general_business_credit` is a bare input with no formula. Nothing to compare.
- **IRS Direct File**: no checkout is available here, and it does not cover business credits. Not compared.

## Confidence by field group

| Field group                                  | Confidence                                                         |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Header (name, SSN)                           | stated rule                                                        |
| Line 1 (expenses, contract testing at 100%)  | stated rule                                                        |
| Line 2a boxes and amount (25% / 19.75%)      | stated rule (form arithmetic)                                      |
| Line 2b (Form 8932 portion)                  | stated rule; asked only with an own Form 8932 credit (own reading) |
| Line 2c, line 4                              | stated rule (form arithmetic)                                      |
| Line 3 (K-1 code Z)                          | stated rule; rounding by DECISION                                  |
| Lines 5 and 6 (estates and trusts)           | stated rule: blank for an individual                               |
| Part II (26 rows × name, number, date)       | stated rule; more than 26 unsupported                              |
| Schedule C reduction (lines 11, 20a, 22, 26) | stated rule; which lines by DECISION                               |
| Form 3800 line 1h                            | stated rule                                                        |
| Schedule CA line 3 column B                  | stated rule (FTB Pub. 1001)                                        |
