# Form 4972: open questions

Each item is a place where the form and its instructions do not settle a rule.
It gives the text, the block, the default the engine applies, and whether the
default changes a dollar amount.

## 1. Whole dollars on lines 23 to 28

- Text: "23 Multiply line 19 by 10% (0.10) ... 24 Tax on amount on line 23 ... 25 Multiply line 24 by 10.0" (`irs-4972-form-2025::sec::omb-no-1545-0193::b04`).
- 10% of a whole-dollar line can have cents, and the schedule's tax has cents.
- Default: each line rounds to the nearest dollar (CLAUDE.md rounding rule), and line 25 is the rounded line 24 times 10.
- Changes dollars: yes, by a few dollars on line 29. The two published examples have no cents, so they do not decide it.

## 2. Decimal places on line 20 and worksheet lines C

- Text: "enter the result as a decimal (rounded to at least three places)" (`omb-no-1545-0193::b04`, `specific-instructions::b04`, `::b05`).
- Default: four places, as the filled-in Form 4972 in Pub. 575 (2024) prints line 20 (.0588).
- Changes dollars: yes, by a dollar or less on line 21 and worksheet line E.

## 3. Lines that can go below zero

- Text: lines 10, 19 and 29 say "Subtract"; none says "if zero or less, enter -0-".
- Default: 0 at the least. Only an estate tax or an exclusion larger than the amount it reduces gets there.
- Changes dollars: only for such inputs.

## 4. Part II alone: Form 1040 line 5a

- Text: "If you don't use Part III of Form 4972, but use Part II, report only the ordinary income portion of the distribution on Form 1040 ... lines 5a and 5b ... The ordinary income portion is the amount from box 2a of Form 1099-R, minus the amount from box 3" (`how-to-report-the-distribution::b02`).
- The text gives one amount for two lines. Default: line 5a is box 1 − box 3; line 5b is box 2a − box 3.
- Changes dollars: no. Line 5a is not taxed.

## 5. Part II alone with NUA included

- Text: the NUA Worksheet line F is the "Ordinary income portion of NUA" (`specific-instructions::b04`); line 8 adds it only with Part III (`line-8::b01`).
- Default: with Part II and no Part III, line F goes on Form 1040 line 5b with the ordinary income portion. Box 1 already holds the securities' value, so line 5a does not add it.
- Changes dollars: yes (line 5b).

## 6. Part II alone with a death benefit exclusion

- Text: "The remaining allowable death benefit exclusion should be entered on line 9 if you choose the 10-year tax option" (`line-6::b01`). Nothing says where it goes without Part III.
- Default: Form 1040 lines 5a and 5b are unsupported.
- Changes dollars: yes; the engine does not print the lines.

## 7. A shared distribution with federal estate tax

- Text: the multiple-recipient steps gross line 8 and line 11 up by the box 9a and box 8 percentages (`specific-instructions::b02`, `::b03`). Line 18 is "the federal estate tax attributable to the lump-sum distribution" (`line-18::b01`). Line 6 multiplies "the total federal estate tax paid on the lump-sum distribution" by the worksheet line C (`line-6::b01`).
- The text does not say whether line 18 is the whole tax or the recipient's part.
- Default: the form's lines are unsupported, and so is Form 1040 line 16.
- Changes dollars: yes; the engine does not print the lines.

## 8. An alternate payee

- Text: an alternate payee under a QDRO "can use Form 4972" (`what-is-a-qualified-lump-sum::b01`), but Part I line 3 asks about a beneficiary and line 4 about a participant.
- Default: Part I lines 3 to 5b are unsupported. The form files when the participant was born before January 2, 1936, and line 5a is No. The lines and the tax are figured.
- Changes dollars: no.

## 9. Line 30 with Part II alone

- Text: "If you also choose to use Part III, go to line 8. Otherwise, include the amount from line 7 in the total on Form 1040 ... line 16" (the blank form, Part II).
- Default: line 30 is blank; Form 1040 line 16 adds line 7.
- Changes dollars: no.

## 10. A decision to file with no fact

- `decisions.scope.must_file_4972` true with no lump-sum fact: the form's lines and Form 1040 line 16 are unsupported. Nothing names the Forms 1099-R.
- Changes dollars: no.

## 11. Box 8 percentage

- Text: "Divide the amount from Form 1099-R, box 8, by the percentage in box 8" (`specific-instructions::b02`).
- The 1099-R fact has a new field, `box8Percent`. Cade's 1099-R ingest tool does not record it yet. A shared distribution with an annuity and no box 8 percentage is unsupported.
- Changes dollars: no.

## 12. California

- California has its own form, Schedule G-1 (`ca-540-sched-g1-inst-2025::sec::a-purpose::b01`). The engine has no rules for it.
- A Form 4972 distribution leaves federal line 5b, so it leaves Schedule CA line 5b column A. Schedule CA line 5b column C and Form 540 line 34 stay unsupported, as they were.
- Changes dollars: yes, for a California return. Not changed here.

## 13. Form 1116 line 20

- Text: "the total of Form 1040 ... line 16, and Schedule 2 ... line 1z, less any tax included on line 16 from Form 4972" (`irs-1116-inst-2025::sec::line-20::b01`).
- Form 1116 has no rules, and Schedule 3 line 1 is unsupported. Nothing changes.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Lines 6, 7 (box 3 only) | published example with numbers |
| Lines 8, 10 to 12, 17, 19, 23 to 25, 29, 30 | published example with numbers |
| Lines 20, 22, 26 to 28 (annuity) | published example with numbers |
| Lines 13 to 16, 21 (minimum distribution allowance) | stated rule |
| Line 9, Death Benefit Worksheet | stated rule |
| Line 18, estate tax part of line 6 | stated rule |
| NUA Worksheet, NUA on line 8 | stated rule |
| Multiple-recipient Step 5 worksheet, shared line 8 and line 11 | stated rule |
| Line 24 and 27 rounding, decimal places | own reading |
| Header, Part I boxes | stated rule |
| Part I lines 3 to 5b for an alternate payee | unsupported |
| Shared distribution with estate tax | unsupported |
| Form 1040 lines 5a and 5b, Part II alone | own reading (5a); stated rule (5b) |
| Form 1040 line 16 and box 2 | stated rule |
| Form 6251 line 10 | stated rule |
