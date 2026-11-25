# FTB 3800 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount. The instructions publish no example with numbers, so every rule rests on the text.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (child, parent, parent's filing status) | stated rule |
| Line 1 (Form 540 line 17 less earned income) | stated rule; earned income is own reading (item 3) |
| Lines 2, 3, 5, 8, 11, 12a, 14, 16, 18 | stated rule (the form's arithmetic) |
| Line 4, line 6, line 7, line 10 | stated rule |
| Lines 9, 15, 17 (table or schedules) | stated rule |
| Line 12b, line 13 | stated rule; the cap under 1 is own reading (item 5) |
| Lines 9 and 10 for a Form 540NR parent | stated rule; ratio rounding is own reading (item 6) |
| Every line for a child someone can claim | unsupported (item 1) |
| Every line for a part-year or nonresident child | unsupported (item 2) |
| Form 540 line 31 and its FTB 3800 box | stated rule |

## 1. A child someone can claim as a dependent

- Text: the rules apply to "certain children", with no dependent exception (ca-3800-inst-2025::sec::purpose::b01).
- The gap: Form 540 line 18 has no California Standard Deduction Worksheet for Dependents (ca-540-inst-2025::sec::california-standard-deduction-worksheet-for-dependents::b01). Line 4 reads Form 540 line 19, which then uses the full standard deduction.
- Default: the form asks `child_unearned_income.claimable_as_dependent` (the Form 8615 answer). When it is yes, every line and Form 540 line 31 are unsupported. The karede scenario answers no.
- Changes dollars: no (unsupported, not wrong). Most children with investment income are dependents, so this gap matters. See the proposal below.

## 2. A child who files Form 540NR

- Text: lines 15, 17 and 18 have Form 540NR worksheets (ca-3800-inst-2025::sec::part-iii-child-s-tax::b02, ::b03).
- The gap: the engine has no rules for Form 540NR, so lines 1 and 4 have no source either.
- Default: `decisions.scope.ca_residency` of `part_year` or `non_resident` makes every line unsupported.
- Changes dollars: no (unsupported).

## 3. Earned income on the line 1 worksheet

- Text: "Enter the child's earned income (wages, tips, and other payments received for personal services performed)" (::part-i-child-s-net-unearned-income::b02).
- Default: Form 1040 line 1z, plus Schedule 1 lines 3 and 6 (a loss as 0), each with its Schedule CA columns B and C, so the amount matches what Form 540 line 17 holds. The federal 30% limit on business profit and the Alternate Worksheet that adds back a self-employment loss (irs-8615-inst-2025::sec::alternate-worksheet-for-form-8615-line-1::b01) are not used: the FTB worksheet has neither.
- Changes dollars: yes, for a child with a business loss and wages. Example: wages $16,000, a $2,000 business loss, $14,000 of dividends. California line 1 = 28,000 − 16,000 = $12,000; the federal Alternate Worksheet would give $14,000.

## 4. Line 1 at $2,700 or less, and the itemizer's line 3

- Text: line 1 "If this amount is $2,700 or less, stop here; do not file this form"; line 3 "If zero or less, stop here; ... but attach it" (the blank form).
- Default: the form names line 3 in `filesOnlyWithAmountOn`. For a child who does not itemize, line 3 is above 0 exactly when line 1 is above $2,700. A child who itemizes, with line 1 above $2,700 and line 3 at 0 or less, should attach the form; the engine leaves it off. Form 540 line 31 is the regular tax either way.
- Changes dollars: no.

## 5. Line 12b's places

- Text: "Enter the result as a decimal (rounded to four places)" (the blank form). Line 12b is under 1 whenever line 7 has an amount.
- Default: four places. When four places would give 1.0000, the engine enters .9999, the most the four boxes hold.
- Changes dollars: at most $1 (line 11 times .0001).

## 6. The Form 540NR worksheets' ratios

- Text: line 9 worksheet lines G and M, line 10 worksheet line E: "Divide ..." with no rounding rule (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b02 to ::b04).
- Default: the ratios keep every digit; line I and the results (lines N and G) round to the dollar. Line A for a resident child is all of line 5.
- Changes dollars: by a dollar or two against a preparer who rounds the ratios.
- The worksheets are headed "Form 540NR Filers". The engine uses the line 9 and line 10 worksheets when the parent's fact names Form 540NR, because they read the parent's Form 540NR lines.

## 7. Who files: unearned income from facts

- Text: "The child had unearned income taxable by California of more than $2,700" (::purpose::b01).
- Default: the form files when 1099-INT box 1, 1099-DIV box 1a and box 2a add to more than $2,700 (box 3, U.S. obligation interest, is left out: California does not tax it), or when the parent's California return is recorded. As on Form 8615, sales, pensions and other unearned income do not turn it on alone; the explicit decision `decisions.scope.must_file_3800_ca` still does.
- Changes dollars: yes, for a child whose unearned income is only from sales or another source and no parent's return is recorded.

## 8. Form 540 line 31's other boxes

- Text: "use one or more of the following methods and check the matching box(es) on line 31" (ca-540-inst-2025::sec::line-31-tax::b01).
- Default: the FTB 3800 box is checked when line 31 holds line 18. The Tax Table or Tax Rate Schedule box stays as line 19 picks it: lines 15 and 17 use the same method.
- Changes dollars: no.

## 9. Line 1 relies on Form 540 line 17

- Text: line 1 includes "only ... income taxable by California" (::part-i-child-s-net-unearned-income::b01).
- Note: Schedule CA line 2b column B (U.S. obligation interest) has no rule yet; Form 540 line 14 then misses it and line 1 is too high by that interest. This is Schedule CA's gap, not this form's. The karede scenario has no such interest.
- Changes dollars: yes, for a child with Treasury interest, until Schedule CA line 2b has a rule.

## Proposals for a discussion

- **The dependent standard deduction (item 1).** Add the California Standard Deduction Worksheet for Dependents to Form 540 line 18 (and the federal one to Form 1040 line 12e for Form 8615). It needs the `claimable_as_dependent` answer to move from the Form 8615 facts to an identity fact that both central forms read. That is a change to Form 540 and Form 1040, so it waits for a person.
