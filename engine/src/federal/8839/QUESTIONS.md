# Form 8839 (2025) — open questions

Each item is a place where the form and the instructions do not settle a rule.
It names the source text, the default the engine applies, and whether the
choice changes a dollar amount.

## 1. Line 9 and line 27: how many decimal places

- Source: "Enter the result as a decimal (rounded to at least three places)" (the blank form, lines 9 and 27).
- Block: the blank form; irs-8839-inst-2025::sec::general-instructions::b04 gives the income table.
- Default: three places, nearest. So MAGI from $259,191 to $259,209 gives 0.000, and MAGI from $299,170 to $299,189 gives 1.000. The table says those incomes "reduce" the credit, not leave it or remove it.
- Changes dollars: yes, at any income in the phase-out range, by up to $8.64 per child (0.0005 × $17,280). The blind fill chose three places too. With the exact ratio, its cases move: MAGI $270,000 (ratio 0.27025) line 10 4,666 → 4,670; MAGI $285,000 (0.64525) 11,146 → 11,150; MAGI $264,207 with line 6 $12,346 (0.125425) 1,543 → 1,548.

## 2. Lines 3 and 20: one Yes/No pair for three children

- Source: "Did you file Form 8839 for a prior year for the same child? No. Enter -0-. Yes. See instructions" (blank form, line 3; line 20 the same for benefits).
- Block: irs-8839-inst-2025::sec::line-3::b01, line-20::b01.
- Default: Yes when any child has a prior form (a recorded `priorYearCredit` or `priorYearBenefits`); else No. Each child's column holds its own amount, 0 when none.
- Changes dollars: no.

## 3. Which children get a Part II or Part III column

- Source: "fill in lines 2 through 6, 10, 11a and 11b for each child" (more-than-three-eligible-children::b01). Part III: "If you received employer-provided adoption benefits, complete Part III" (blank form, Caution under line 1).
- Default: when a part applies, every child on line 1 gets a column. A child with no expenses shows 0 on line 5; a child with no benefits shows 0 on line 22. A part with nothing in it (no line 5 amount and no carryforward; no benefits and no special needs child under a program) stays blank.
- Changes dollars: no.

## 4. Lines 4, 14 and 17 below zero

- Source: line 4 "Subtract line 3 from line 2"; Credit Limit Worksheet line 4 "Subtract line 3 from line 2" (credit-limit-worksheet-line-17::b01).
- Default: not less than zero. Line 14 says so itself. A negative line 4 or worksheet line 4 would make a negative credit.
- Changes dollars: no, for a return the form can describe.

## 5. Special needs and line 5 when line 2 is a share

- Source: "enter on line 5: $17,280, minus any qualified adoption expenses you used to figure any adoption credit you claimed for the same child in a prior year" (line-5::b01).
- Default: line 5 = $17,280 − line 3, even when line 2 is a smaller share. Line 6 then takes the smaller of lines 4 and 5.
- Changes dollars: no; line 6 is the same either way.

## 6. Who has the employer program for line 24

- Source: "enter the amount from line 21 only if your employer has a qualified adoption assistance program" (line-24::b01).
- Default: W-2 box 12 code T means a program: code T reports "amounts paid … under an adoption assistance program" (irs-w2w3-inst-2025::sec::special-reporting-situations-for-form::b01). Without code T, the engine asks `adoption.employer_has_qualified_program`.
- Changes dollars: yes, when the answer is wrong.

## 7. Line 22 with more than one child

- Source: "Employer-provided adoption benefits you received in 2025. This amount should be shown in box 12 of your 2025 Form(s) W-2 with code T" (blank form, line 22).
- Default: one child takes the whole code T total. With more children, each child fact must carry its amount, and the amounts must add up to code T; otherwise Part III is unsupported.
- Changes dollars: no (a gap, not a guess).

## 8. Line 25 worksheet line 1

- Source: "Enter the amount you would enter on line 1z … if you could exclude the total amount on Form 8839, line 23" (modified-adjusted-gross-income-magi-worksheet-line-25::b01).
- Default: Form 1040 lines 1a–1e, 1g and 1h, without line 1f. Code T is not in W-2 box 1, so this is line 1z with no adoption benefits in it.
- Changes dollars: no.

## 9. Part II needs Part III first

- Source: "you must complete Form 8839, Part III, before you can figure the credit" (general-instructions::b03).
- Default: the child fact holds qualified expenses, already net of the employer's reimbursement (qualified-adoption-expenses::b01). The engine does not subtract code T from expenses.
- Changes dollars: yes, if Cade records gross expenses.

## 10. Cases the engine leaves unsupported

| Case | Source | Why |
| --- | --- | --- |
| Married filing separately without the lived-apart test | married-persons-not-filing-jointly::b01 | No credit or exclusion; the instructions do not say how to fill the form. |
| A foreign child not final at the end of 2025 | more-than-three-eligible-children::b09; the-hague-convention…::b01 | The benefits go on 1040 line 1f outside the form. |
| Benefits before 2025 for a foreign child final in 2025 | exclusion-of-prior-year-benefits-worksheet::b01–b03 | The worksheet's line 9 goes on no line the instructions name. |
| Schedule 8812 Credit Limit Worksheet B | credit-limit-worksheet-line-17::b01; irs-1040s8-inst-2025::sec::line-13::b01 | Line 17 reads Worksheet B line 14, which is not modeled. Schedule 3 line 6c and Schedule 8812 line 13 (Worksheet B line 15 → Worksheet A line 4) are then unsupported too. |
| Form 2555, Form 4563, Puerto Rico income | line-7::b01 | Those forms have no rules; Puerto Rico income has no fact. |
| Social security benefits with Part III | irs-1040-inst-2025::sec::use-the-social-security-benefits::b01 | 1040 line 6b needs the Pub. 915 worksheet. |
| More than three children | more-than-three-eligible-children::b01 | The columns of a second form are not printed; the totals count every child. |

The Puerto Rico exclusion has no fact: a filer with it gets a line 7 that is too low. Cade should not record an adoption for such a filer yet.

## 11. Line 5 with cents: round the line or keep cents to line 11a

- Source: "If you have to add two or more amounts to figure the amount to enter on a line, include cents when adding the amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
- Default: line 5 adds the expenses with cents and rounds the total ($12,345.67 → $12,346). Lines 6, 10 and 11a then use the rounded lines. The text settles it; the blind fill made the same choice.
- Changes dollars: yes, by $1 at most. Keeping cents to line 11a ($12,345.67 − $1,543.21 = $10,802.46) gives $10,802 instead of $10,803.

## Second opinions

- **PolicyEngine-US 2.152.15** (commit b274cacc, 2026-11-21): it does not model the adoption credit or the exclusion. `parameters/gov/irs/credits/non_refundable.yaml` has only a comment "Adoption expense credit" in its list, and `credits/ctc_tax_liability_limit/subsequent_credits.yaml` says the adoption credit belongs on Schedule 8812 Credit Limit Worksheet B but "is not modeled". That matches item 10 (Worksheet B unsupported). No constant or formula to compare.
- **IRS Direct File**: the repo names no checkout of its tax logic, so no comparison.
- **Blind fill** (14 cases, 178 lines): no difference from the engine, in dollars or in blank against 0.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, line 1 columns (a)–(g) | stated rule |
| Lines 2–6 (per child) | published example with numbers (employer Examples 1–4, Riley and Parker, line 5 examples) |
| Lines 7–10 (phase-out) | stated rule (the form); three places is own reading (item 1) |
| Lines 11a–14 (refundable part) | published example with numbers (credit limit worksheet example) |
| Lines 15–18 (carryforward, limit) | published example with numbers; Worksheet B unsupported |
| Lines 19–24 (per child) | stated rule; line 24's program test is own reading (item 6) |
| Line 25 (MAGI worksheet) | stated rule |
| Lines 26–31 | stated rule (the form) |
| 1040 line 1f, line 30; Schedule 3 line 6c | stated rule (the form's "enter here and on") |
