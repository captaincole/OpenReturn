# FTB 3800 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount. The instructions publish no example with numbers, so every rule rests on the text. The items are sorted under three headings: two texts that conflict (decided, with a `DECISION` comment and a row in `docs/rule-decisions.md`), work that could be done now, and pattern changes.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (child, parent, parent's filing status) | stated rule |
| Line 1 (Form 540 line 17 less earned income) | stated rule; earned income is a decision (item 2) |
| Lines 2, 3, 5, 8, 11, 12a, 14, 16, 18 | stated rule (the form's arithmetic) |
| Line 4, line 6, line 7, line 10 | stated rule |
| Lines 9, 15, 17 (table or schedules) | stated rule |
| Line 12b, line 13 | stated rule; the cap under 1 is own reading (item 8) |
| Lines 9 and 10 for a Form 540NR parent | stated rule; ratio rounding is a decision (item 3) |
| Every line for a child someone can claim | unsupported (item 4) |
| Every line for a part-year or nonresident child | unsupported (item 5) |
| Form 540 line 31 and its FTB 3800 box | stated rule |

## Two texts conflict

### 1. The support test for a full-time student

- Text A: the purpose list gives the support test only for a child "age 18 at the end of 2025" (ca-3800-inst-2025::sec::purpose::b01).
- Text B: California "conforms to the provision of the federal Small Business and Work Opportunity Act of 2007 which increased the age of children to 18 and under or a full-time student under age 24" (::general-information::b01); that provision holds the student to the test (irs-8615-inst-2025::sec::who-must-file::b01, condition 3c).
- Decided: Text B, the same test as Form 8615 (`DECISION` in `resolveInfo.ts`; row A1).
- Changes dollars: yes. A student whose earned income is over half of support pays the regular tax.

### 2. Earned income on the line 1 worksheet

- Text A: "Enter the child's earned income (wages, tips, and other payments received for personal services performed)" (::part-i-child-s-net-unearned-income::b02).
- Text B: line 1 "In most cases, this will be the same as the amount entered on federal Form 8615" (::b01). The federal Alternate Worksheet adds back a self-employment loss and the federal line 1 limits a business's earned income to 30% of profit (irs-8615-inst-2025::sec::alternate-worksheet-for-form-8615-line-1::b01, ::line-1::b01).
- Decided: Text A (`DECISION` in `form.ts`; row A2). Earned income is Form 1040 line 1z, plus Schedule 1 lines 3 and 6 (a loss as 0), each with its Schedule CA columns B and C, so the amount matches what Form 540 line 17 holds.
- Changes dollars: yes, for a child with a business loss and wages. Example: wages $16,000, a $2,000 business loss, $14,000 of dividends. California line 1 = 28,000 − 16,000 = $12,000; the federal Alternate Worksheet would give $14,000.

### 3. The Form 540NR worksheets' ratios

- Text A: line 9 worksheet lines G and M, line 10 worksheet line E: "Divide ..." with no rounding rule (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b02 to ::b04).
- Text B: the Form 540NR booklet rounds a rate of the same kind on its own line 36: "the FTB rounds the tax rate to four digits after the decimal" (ca-540nr-booklet-2025::sec::line-36-ca-tax-rate::b01).
- Decided: Text A, every digit kept (`DECISION` in `lines.ts`; row A3). Line I and the results (lines N and G) round to the dollar. Line A for a resident child is all of line 5.
- Changes dollars: yes. Example (blind case 11): parent's Form 540NR line 31 $16,064 with $68 of FTB 3803 tax, line 19 $248,588, line 35 $124,294. Line 10 worksheet E unrounded gives line 10 = $7,998; E rounded to .0643 gives $7,992, so lines 11, 13, 16 and 18 are $6 higher. Line 9 worksheet M rounded to four places moves line 9 by about $2 (blind case 10: $9,352 against $9,350).
- Note: with no FTB 3803 tax, line 10 is Form 540NR line 37 itself, which the FTB figures with the rounded line 36 rate. The two paths for line 10 can then differ by a few dollars for the same parent.
- The worksheets are headed "Form 540NR Filers". The engine uses the line 9 and line 10 worksheets when the parent's fact names Form 540NR, because they read the parent's Form 540NR lines.

## Should we do this now

### 4. A child someone can claim as a dependent

- Text: the rules apply to "certain children", with no dependent exception (ca-3800-inst-2025::sec::purpose::b01).
- The gap: Form 540 line 18 has no California Standard Deduction Worksheet for Dependents (ca-540-inst-2025::sec::california-standard-deduction-worksheet-for-dependents::b01). Line 4 reads Form 540 line 19, which then uses the full standard deduction.
- Default: the form asks `child_unearned_income.claimable_as_dependent` (the Form 8615 answer). When it is yes, every line and Form 540 line 31 are unsupported. The karede scenario answers no.
- Changes dollars: no (unsupported, not wrong). Most children with investment income are dependents, so this gap matters.
- Not now: the worksheet is a change to Form 540 and Form 1040 (see the proposal below).

### 5. A child who files Form 540NR

- Text: lines 15, 17 and 18 have Form 540NR worksheets (ca-3800-inst-2025::sec::part-iii-child-s-tax::b02, ::b03).
- Default: `decisions.scope.ca_residency` of `part_year` or `non_resident` makes every line unsupported.
- Changes dollars: no (unsupported).
- Not now: the engine has no rules for Form 540NR, so lines 1 and 4 have no source.

### 6. Who files: unearned income from facts

- Text: "The child had unearned income taxable by California of more than $2,700" (::purpose::b01); line 1 includes "taxable interest, dividends, capital gains, rents, royalties, ..." (::part-i-child-s-net-unearned-income::b01).
- Default: the form files when 1099-INT box 1, 1099-DIV box 1a and box 2a add to more than $2,700 (box 3, U.S. obligation interest, is left out: California does not tax it), or when the parent's California return is recorded. The net gain of the 1099-B sales counts too when the age condition surely holds (a child under 18, or an older child who answered the support and student questions). The explicit decision `decisions.scope.must_file_3800_ca` still wins. Form 8615 uses the same rule (federal QUESTIONS.md item 1).
- Done (2026-11-25): sales. Before, a child under 18 whose unearned income was mostly stock gains got the regular tax on Form 540 line 31, and nothing asked for the parent's California return (unit test "a gain from a sale alone").
- Not now: 1099-G, 1099-R and rents, and sales for an 18-to-23-year-old who has not answered. Counting a sale for every age files Form 8615 on the alejandro scenario (a CPA answer key, age 22), which then waits on two answers; that choice is open with a person on Form 8615 item 1.
- Changes dollars: yes, for those children when no parent's return is recorded.

### 7. Line 1 at $2,700 or less, and the itemizer's line 3

- Text: line 1 "If this amount is $2,700 or less, stop here; do not file this form"; line 3 "If zero or less, stop here; ... but attach it" (the blank form).
- Default: the form names line 3 in `filesOnlyWithAmountOn`. For a child who does not itemize, line 3 is above 0 exactly when line 1 is above $2,700. A child who itemizes, with line 1 above $2,700 and line 3 at 0 or less, should attach the form; the engine leaves it off. Form 540 line 31 is the regular tax either way.
- Changes dollars: no.
- Not now: a second stop line needs a change to how `filesOnlyWithAmountOn` works for every form, for a form that changes no amount.

### 8. Line 12b's places

- Text: "Enter the result as a decimal (rounded to four places)" (the blank form). Line 12b is under 1 whenever line 7 has an amount.
- Default (done): four places. When four places would give 1.0000, the engine enters .9999, the most the four boxes hold.
- Changes dollars: at most $1 (line 11 times .0001).

### 9. Form 540 line 31's other boxes

- Text: "use one or more of the following methods and check the matching box(es) on line 31" (ca-540-inst-2025::sec::line-31-tax::b01).
- Default (done): the FTB 3800 box is checked when line 31 holds line 18. The Tax Table or Tax Rate Schedule box stays as line 19 picks it: lines 15 and 17 use the same method.
- Changes dollars: no.

### 10. Line 1 relies on Form 540 line 17

- Text: line 1 includes "only ... income taxable by California" (::part-i-child-s-net-unearned-income::b01).
- Note: Schedule CA line 2b column B (U.S. obligation interest) has no rule yet; Form 540 line 14 then misses it and line 1 is too high by that interest. The karede scenario has no such interest.
- Changes dollars: yes, for a child with Treasury interest, until Schedule CA line 2b has a rule.
- Not now: it is Schedule CA's gap, not this form's.

### 11. Line 14 when lines 4 and 5 are the same

- Text: Part III heading on the blank form: "If the amounts on line 4 and line 5 above are the same, enter -0- on line 15 and go to line 16." The instructions add nothing (::part-iii-child-s-tax::b01).
- Default (done): line 14 prints 0 (line 4 less line 5) and line 15 prints 0. The text names only line 15, so a preparer may leave line 14 blank. Federal Form 8615 has the same sentence, and the engine prints its line 14 as 0 too; one rule for both forms.
- Changes dollars: no.

## Pattern change

None. Form 540 line 31 takes FTB 3800 line 18 the way it already adds FTB 3803 line 9, and the resolver reuses Form 8615's age groups and answers.

## Second opinions

- **Blind fill (2026-11-25).** A preparer filled 15 cases by hand from the blank form and the instructions. Every dollar amount matched the engine on every line. The only differences were line 14 in cases 2, 4, 5 and 6: blank against the engine's 0 (item 11). The preparer's rounding doubts for the Form 540NR worksheets are item 3.
- **PolicyEngine-US 2.153.8 (commit b3edc04).** It does not model FTB 3800 or federal Form 8615: its California tax (`ca_income_tax_before_credits`) applies the rate schedule to the filer's own taxable income, with no tax at the parent's rate. Its 2025 California rate schedule (`parameters/gov/states/ca/tax/income/rates/`, single, separate, joint, head of household) has the same bracket thresholds and rates as `data/caRateSchedule.ts`, which lines 9, 15 and 17 use above $100,000. No disagreement.
- **IRS Direct File.** Federal only; it has no California logic. Not compared.

## Proposals for a discussion

- **The dependent standard deduction (item 4).** Add the California Standard Deduction Worksheet for Dependents to Form 540 line 18 (and the federal one to Form 1040 line 12e for Form 8615). It needs the `claimable_as_dependent` answer to move from the Form 8615 facts to an identity fact that both central forms read. That is a change to Form 540 and Form 1040, so it waits for a person.
