# Form 8932: open questions

Form 8932 figures the credit for employer differential wage payments: 20% of up to $20,000 paid to each employee on active duty for more than 30 days. The form holds its own instructions (Rev. December 2021, `irs-8932-form-2025`). No published example with numbers exists for it.

## Two texts conflict

1. **K-1 credits with cents.** Line 3 adds the K-1s. The Form 1040 rule adds with cents and rounds the total; Form 3800 takes one whole-dollar amount for each K-1 (`irs-3800-inst-2025::sec::part-v-3::b01`). Default: each K-1 rounds before the add, so line 4 equals Form 3800 line 1w (DECISION, `docs/rule-decisions.md` A122, as A96). The blind fill rounded the total. Dollars: at most $1 for each K-1 with cents ($960, not $961, in blind case 9).
2. **The final order and a K-1 credit.** "No credit will be allowed to a taxpayer for: Any tax year in which the taxpayer is under a final order ... and The 2 succeeding tax years" (`disallowance-for-failure-to-comply-with::b01`). Default: one yes/no answer for the return (`differential_wage_credit.under_reemployment_order`), asked once the return has an employee fact. Yes: the form does not file, and no wages are reduced. It does not touch a K-1 credit: the order is against the taxpayer, and the partnership that paid the wages is not under it (DECISION, `docs/rule-decisions.md` A123). The other reading takes away every credit "to a taxpayer", the K-1 credit too; the blind fill chose it. The statute does not settle it for a partner: "No credit shall be allowed under subsection (a) to a taxpayer" (`usc-26-2025::sec::s45p::d`), and subsection (a) figures the credit on "the qualified employees of the taxpayer" (`usc-26-2025::sec::s45p::a`). Dollars: the whole own credit, and the whole K-1 credit under the other reading ($700 in blind case 10).
3. **The K-1 codes.** The line 3 instruction names "box 15 (code P)" and "box 13 (code P)" (`irs-8932-form-2025::sec::line-3::b01`). The 2025 K-1s use code AV: "Code AV. Credit for employer differential wage payments. Report this amount on Form 8932; or Form 3800, Part III, line 1w" (`irs-1065k1-inst-2025::sec::box-15-credits::b11`; the 1120-S list in `irs-1120sk1-inst-2025::sec::box-13-credits-2::b03`). The K-1's own instructions define its codes, and the 2021 form text is older, so the engine reads code AV (the box tables in `federal/passThrough/`). Dollars: none. Settled for the record in `docs/rule-decisions.md`, no DECISION comment.

## Should we do this now

4. **A trust K-1 and Form 1099-PATR.** Line 3 also takes "Schedule K-1 (Form 1041) ... box 13 (code Q)" and "Form 1099-PATR ... box 12, or other notice of credit allocation" (`line-3::b01`). Done as a stated answer: such a credit is a stated Form 3800 line 1w credit that names the entity (`passThroughEin`), and line 3 adds it, as Form 5884 line 3 does. A reader for those boxes waits for a scenario that has one.
5. **Line 2 split over two activities.** "You must reduce your deduction for salaries and wages by the amount on line 2" (`line-2::b01`). The form has one line 2 for every business and farm. Done: line 2 is split in proportion to each activity's eligible payments, and the parts add to line 2 exactly (`line2ByActivity`, `prorateDollars`). At most $1 moves between two schedules.
6. **Stated wages below the reduction.** "If you capitalized any costs on which you figured the credit, reduce the amount capitalized" (`line-2::b01`). Not now: the engine does not hold capitalized wages or wages in cost of goods sold. When an activity's stated line 26 or line 22 is less than its part of line 2, lines 1 and 2 are a named gap. No dollars on a return the engine fills.
7. **One employee paid by two activities.** The $20,000 limit is per employee, and all persons under common control are one employer (`controlled-groups::b01`). Not now: one fact is one employee in one activity, and the limit applies to each fact. A person who works for two of the taxpayer's activities needs one fact, in the activity that pays most. Dollars only if two facts for one person each pass $10,000.
8. **The order year.** The answer's fact asks whether the taxpayer was under such an order in 2025, 2024 or 2023 (`facts/kinds/differentialWage.ts`). Done: an order year of 2023 still disallows 2025, its second succeeding year; the blind fill read it the same way. No dollars for a correct answer.
9. **The 2020 and 2021 exclusions.** What's New excludes wages also used for the employee retention credit or the sick and family leave credits in 2020 and 2021 (`what-s-new::b01`). Not needed: they do not reach a 2025 payment.
10. **Form 6765 line 27.** Form 6765 line 27 takes "the portion of the credit from Form 8932, line 2" (`irs-6765-face-2025::sec::face-page-2::b01`). Not now: the research credit fact states it, and the check against Form 8932 line 2 (as Form 8820 line 2b has) waits for a scenario with both credits. No dollars for a correct answer.
11. **A stated own credit under a final order.** With employee facts and the order answer yes (or not yet answered), a stated Form 8932 credit of the taxpayer's own (no `passThroughEin`) still reaches Form 3800 line 1w and lowers no wages. Not now: the two answers contradict each other, and only an unusual input reaches it. While the answer is missing, the return waits on it anyway.

## Pattern change

None. The employee fact (`differential_wage_employee.<slug>`) follows the Form 5884 employee fact, and the figured credit takes the place of the stated one as Forms 5884 and 8586 do: no repository pattern changes.

## The statute and the instructions

For `docs/law-findings.md`:

- **Which credits go down.** The instructions: "The amount of any research credit or orphan drug credit otherwise allowable for compensation paid to any employee is reduced by the credit for differential wage payments figured for that employee" (`irs-8932-form-2025::sec::coordination-with-other-credits::b01`). The statute: "The amount of credit otherwise allowable under this chapter with respect to compensation paid to any employee shall be reduced by the credit determined under this section with respect to such employee" (`usc-26-2025::sec::s45p::c`). The statute also reaches the work opportunity credit (Form 5884) and the empowerment zone credit (Form 8844) on the same wages. Differential wage payments are not FUTA wages (`irs-w2w3-inst-2025`), so the work opportunity credit seldom overlaps. The engine follows the instructions: Forms 8820 and 6765 only.

## Second opinions

- **PolicyEngine-US 2.154.2** (commit `c1fea42a38`): it does not model this credit. No variable or parameter under `gov/irs` names differential wage payments or section 45P, so there is nothing to compare.
- **IRS Direct File**: it files no Schedule C business with employees and no general business credit, so it has no Form 8932 logic to compare.
- **Blind fill** (15 cases, from the form and its instructions only): every line matched except two. Case 9 rounded the K-1 total once (item 1, A122). Case 10 took away the K-1 credit under a final order (item 2, A123). The engine keeps both defaults.
- **California** (second pass): section 280C does not apply for California (`ca-rtc-2025::sec::s17270::b`), so Schedule CA gives the reduction back: line 3 column B for a business, line 6 column B for a farm (unit test in `tests/unit/federal/8932/form.test.ts`).

## Proposals for a discussion

None.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, identifying number) | stated rule |
| Line 1 (the $20,000 limit, the 91-day test) | stated rule |
| Line 2 (20%) and the wage reduction | stated rule |
| Line 2 split over activities | own reading |
| Line 3 (K-1 code AV, other notices) | stated rule, with the 2025 K-1 code |
| Line 4 and Form 3800 line 1w | stated rule |
| Lines 5 and 6 (cooperatives, estates, trusts: blank) | stated rule |
