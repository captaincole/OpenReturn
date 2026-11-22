# FTB 3803 — open questions

Each item is a place where the form and its instructions do not settle a rule. The engine applies the default shown.

## 1. California estimated tax or federal estimated tax

- Source: "Made no estimated tax payments for 2025." and "Did not have any overpayment of tax shown on his or her 2024 return applied to the 2025 estimated taxes." (ca-3803-inst-2025::sec::a-purpose::b01)
- The text does not say which tax. On a California form we read California estimated tax.
- Default: a new answer, `californiaEstimatedTaxPaid`, on the child's fact. Federal estimated tax is Form 8814's condition only.
- Changes dollars: yes, when a child paid one tax and not the other (the election is on or off).

## 2. Federal backup withholding

- Source: "Had no state income tax withheld from his or her income (backup withholding)." (::a-purpose::b01)
- Default: only California withholding (1099-INT box 17, 1099-DIV box 16, the new `stateTaxWithheld`) ends the election. Federal withholding does not.
- Changes dollars: yes, for a child with federal backup withholding only.

## 3. California tax-exempt dividends on line 2

- Source: line 1a and line 3 say "taxable by California"; line 2 says only "Enter ordinary dividends … federal Form 1099-DIV, box 1a" (::line-2::b01). The header points to the Schedule CA instructions for interest and dividends "taxable by California" (::specific-line-instructions::b01).
- Default: line 2 is the federal ordinary dividends. A fund's U.S. obligation dividends that California exempts stay on line 2.
- Changes dollars: yes, for a child with such dividends.

## 4. A child's capital gain distributions with Schedule D (540)

- Source: "you must report part or all of your child's capital gain distributions on your Schedule D instead of on form FTB 3803, line 6." (::line-6::b01)
- The text does not say how much goes to Schedule D (540).
- Default: line 6 stays the form's arithmetic. When Schedule D (540) files and a child's capital gain distributions reach line 6 (on FTB 3803 or Form 8814), Schedule CA line 8z columns B and C are unsupported.
- Changes dollars: no (an unsupported line, not a different amount).

## 5. One election for all children

- Source: "You can make the election for one or more children and not for others." (::c-how-to-make-the-election::b01)
- Default: one decision (`decisions.scope.must_file_3803`) covers every child with an investment income fact, as on Form 8814.
- Changes dollars: yes, for parents who elect for one child only.

## 6. The parent's and the child's other conditions

- Source: ::b-parents-who-qualify-to-make-the-election::b01, ::b02; "Does not file a joint return for 2025" (::a-purpose::b01).
- Default: the decision holds these. The engine does not check them.
- Changes dollars: no.

## 7. "Required to file" for the child

- Source: "Is required to file a 2025 income tax return" (::a-purpose::b01); the 540 instructions name the range: "more than $1,350 but less than $13,500" (ca-540-inst-2025::sec::line-31-tax::b01).
- Default: line 4 of $1,350 or less ends the election. The test uses line 4 with California amounts.
- Changes dollars: yes, at that edge (line 9 is $0 to $14).

## 8. Nominee amounts

- Source: ::line-1a::b01, ::line-2::b01, ::line-3::b01.
- Default: no fact holds a nominee amount; the 1099 amounts go on the lines. The "ND" note on the dotted line does not print.
- Changes dollars: yes, for a child who received amounts as a nominee.

## 9. Line 9 rounding

- Source: the form prints "$14.00" for "No" and whole-dollar boxes.
- Default: 1% of line 8, rounded to the nearest dollar (CLAUDE.md rounding rule). 1% of $1,250 is $12.50 → $13.
- Changes dollars: at most $1.

## 10. Form 8814 line 6 when its line 4 is $2,700 or less

- Source: FTB 3803 compares "the total amount on line 6 of all your federal Form(s) 8814" (::line-6::b01). Form 8814 says "If the total is $2,700 or less, skip lines 5 through 12".
- Default: a skipped federal line 6 counts as 0, so all of the FTB 3803 line 6 goes in column C, as with no Form 8814. The blind fill made the same choice (case 5).
- Changes dollars: yes, for a child whose federal line 4 is $2,700 or less and whose California line 4 is more.

## 11. Federal election only (Form 8814, no FTB 3803)

- Source: "If you elect to report your child's income on your federal income tax return, but not on your California income tax return, be sure to make an adjustment on your Schedule CA (540) ... line 8z" (ca-3800-inst-2025::sec::purpose::b02). "If the amount of your child's income you are reporting on your California income tax return is different than the amount you reported on your federal income tax return, enter the difference on line 8z, column B or column C" (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b16).
- Default: subtract the Form 8814 line 6 total in column B (California amount 0). The Form 8814 line 15 tax is not income and needs no adjustment. The blind fill made the same choice (case 15).
- Open: capital gain distributions in that amount may belong on Schedule CA line 7a instead ("Capital gain from children ... included on the parent's or child's federal tax return and reported on the California tax return by the opposite taxpayer", ca-540-sched-ca-inst-2025::sec::line-7a-capital-gain-or-loss::b02). The engine keeps them on line 8z; with Schedule D (540) they are unsupported (item 4).
- Changes dollars: yes, on the parents' California AGI if the default amount is wrong; the column split between lines 7a and 8z does not change the total.

## Blind fill (2026-11-22)

A blind preparer filled 15 cases from the blank form and instructions only. Every line of every case matched the engine, blank against 0 included. Doubts the text settles, kept for the record:

- California-only exempt interest (Treasury bills) goes in line 8z column B, not on Schedule CA line 2: "enter the difference on ... line 8z, column B" (::line-6::b01).
- Interest on another state's bonds is taxable by California and goes on line 1a (::line-1a::b01). The fact's `taxExemptInterestTaxedByCalifornia` holds the split; the rule needs no default.
- Doubts 1 (child at exactly $1,350) and 7 (capital gain distributions with Schedule D) are items 7 and 4.

## Second opinions

- PolicyEngine-US 2.152.16 (commit 794e17e6), `variables/gov/states/ca/tax/income/` and `parameters/gov/irs/deductions/standard/dependent/`. Compared on 2026-11-22.
  - It does not model FTB 3803 or Form 8814. Its out-of-state bond interest variable says "a parent election to report it is not inferred". No formula to compare.
  - Line 7 ($1,350): its dependent standard deduction floor for 2025 is 1,350, used by its California dependent worksheet too. Agrees.
  - Other-state bond interest is a California addition (R&TC 17143) and California bond interest stays exempt. Agrees with line 1a and line 1b.
- IRS Direct File: federal only, no FTB 3803. No checkout is reachable from this project (issue #140). Not compared. The repo names no other reference implementation for this form.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (names, SSNs, more-than-one box) | stated rule |
| Lines 1a, 1b (California interest split) | stated rule; the fact's split is the input |
| Line 2 | own reading (item 3) |
| Line 3 | stated rule |
| Lines 4–9 arithmetic | stated rule; checked with the federal Fred example's inputs |
| Conditions (age, income, limits) | stated rule; items 1, 2, 7 own reading |
| Schedule CA line 8z columns B, C; line 9a column C | stated rule; item 4 unsupported |
| Form 540 line 31 and its box | stated rule |
