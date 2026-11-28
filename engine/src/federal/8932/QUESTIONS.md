# Form 8932: open questions

Form 8932 figures the credit for employer differential wage payments: 20% of up to $20,000 paid to each employee on active duty for more than 30 days. The form holds its own instructions (Rev. December 2021, `irs-8932-form-2025`). No published example with numbers exists for it.

## Doubts

1. **The K-1 codes.** The line 3 instruction names "box 15 (code P)" and "box 13 (code P)" (`irs-8932-form-2025::sec::line-3::b01`). The 2025 K-1s use code AV: "Code AV. Credit for employer differential wage payments" (`irs-1065k1-inst-2025::sec::code-g-contributions-100::b05`). The 2021 text is older, so the engine reads code AV (the box tables in `federal/passThrough/`). Default: code AV. Dollars: none.
2. **A trust K-1 and Form 1099-PATR.** Line 3 also takes "Schedule K-1 (Form 1041) ... box 13 (code Q)" and "Form 1099-PATR ... box 12, or other notice of credit allocation" (`line-3::b01`). The engine reads neither document for this credit. Default: such a credit is a stated Form 3800 line 1w credit that names the entity (`passThroughEin`), and line 3 adds it, as Form 5884 line 3 does. Dollars: none.
3. **Line 2 split over two activities.** "You must reduce your deduction for salaries and wages by the amount on line 2" (`line-2::b01`). The form has one line 2 for every business and farm. Default: line 2 is split in proportion to each activity's eligible payments, and the parts add to line 2 exactly (`line2ByActivity`, `prorateDollars`). Dollars: at most $1 moves between two schedules.
4. **Stated wages below the reduction.** "If you capitalized any costs on which you figured the credit, reduce the amount capitalized" (`line-2::b01`). The engine does not hold capitalized wages or wages in cost of goods sold. Default: when an activity's stated line 26 or line 22 is less than its part of line 2, lines 1 and 2 are a gap. Dollars: none on a return the engine fills.
5. **One employee paid by two activities.** The $20,000 limit is per employee, and all persons under common control are one employer (`controlled-groups::b01`). One fact is one employee in one activity. Default: the limit applies to each fact. A person who works for two of the taxpayer's activities needs one fact, in the activity that pays most. Dollars: yes, if two facts for one person each pass $10,000.
6. **The final order.** "No credit will be allowed to a taxpayer for: Any tax year in which the taxpayer is under a final order ... and The 2 succeeding tax years" (`disallowance-for-failure-to-comply-with::b01`). Default: one yes/no answer for the return (`differential_wage_credit.under_reemployment_order`), asked once the return has an employee fact. Yes: the form does not file, and no wages are reduced. It does not touch a K-1 credit: the order is against the partnership, not the partner. Dollars: the whole own credit.
7. **The 2020 and 2021 exclusions.** What's New excludes wages also used for the employee retention credit or the sick and family leave credits in 2020 and 2021 (`what-s-new::b01`). They do not reach a 2025 payment. Default: none applied. Dollars: none.
8. **Form 6765 line 27.** Form 6765 line 27 takes "the portion of the credit from Form 8932, line 2" (`irs-6765-face-2025::sec::face-page-2::b01`). The research credit fact states it, and the engine does not check it against Form 8932 line 2, as it does for Form 8820 line 2b. Default: unchanged. Dollars: none for a correct answer.

## The statute and the instructions

For `docs/law-findings.md`:

- **Which credits go down.** The instructions: "The amount of any research credit or orphan drug credit otherwise allowable for compensation paid to any employee is reduced by the credit for differential wage payments figured for that employee" (`irs-8932-form-2025::sec::coordination-with-other-credits::b01`). The statute: "The amount of credit otherwise allowable under this chapter with respect to compensation paid to any employee shall be reduced by the credit determined under this section with respect to such employee" (`usc-26-2025::sec::s45p::c`). The statute also reaches the work opportunity credit (Form 5884) and the empowerment zone credit (Form 8844) on the same wages. Differential wage payments are not FUTA wages (`irs-w2w3-inst-2025`), so the work opportunity credit seldom overlaps. The engine follows the instructions: Forms 8820 and 6765 only.

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
