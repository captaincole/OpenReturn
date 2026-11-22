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
