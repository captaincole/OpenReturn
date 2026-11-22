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

## 14. Line 29 for a shared distribution with no annuity

- Text: line 25 says "If line 11 is zero, skip lines 26 through 28, enter this amount on line 29" (the blank form). Step 5 says "A. Subtract line 28 from line 25 ... C. Multiply line A by line B. Enter here and on Form 4972, line 29" (`specific-instructions::b04`).
- Default: Step 5 applies with line 28 as 0, so line 29 is the box 9a share of line 25. The blind fill agrees.
- Changes dollars: yes. The other reading puts the whole line 25 on line 29 (blind case 13: 7,670 instead of 3,835).

## 15. Death Benefit Worksheet line D for a shared distribution

- Text: line D is "your share of the death benefit exclusion*"; the note says it "must be allocated among the recipients in the same proportion that they share the distribution" (`specific-instructions::b05`). Line 9 says "multiply the full allowable death benefit exclusion (don't allocate among the recipients) by the percentage on line C" (`line-9::b01`).
- Default: line D is the box 9a share of the exclusion (for line 6); line 9 uses the full exclusion. The blind fill agrees.
- Changes dollars: yes. A full exclusion on line D gives blind case 13 line 6 = 7,000 and line 7 = 1,400 instead of 7,500 and 1,500.

## 16. Line 6 for a shared distribution

- Text: "Step 1. Complete Form 4972, Parts I and II" (`specific-instructions::b02`). Steps 2 and 3 divide line 8 and line 11 by the box 9a and box 8 percentages; no step divides line 6.
- Default: line 6 is the recipient's own capital gain, not grossed up. The blind fill agrees.
- Changes dollars: yes. A line 6 divided by box 9a doubles line 7 in blind case 13 (3,000 instead of 1,500).

## 17. Estate tax with both NUA and a death benefit exclusion

- Text: reduce "line F of the Death Benefit Worksheet if you do" take the exclusion; reduce "line G of the NUA Worksheet" if you include NUA "and you didn't take the death benefit exclusion"; "the capital gain amount must be reduced by both the procedures" (`line-6::b02`).
- Default: Death Benefit Worksheet line A is NUA line G, line B is box 2a plus box 6, and the estate tax share comes off line F. The blind fill agrees.
- Changes dollars: yes. Taking the share off line G and skipping the exclusion gives blind case 11 line 6 = 5,880 instead of 5,280.

## 18. Line 21 when lines 13 to 16 are skipped

- Text: line 12 says "skip lines 13 through 16"; line 21 says "Multiply line 16 by the decimal on line 20" and has no skip.
- Default: line 21 is blank and line 22 is line 11. Pub. 575 (2024) Example 2 prints line 21 blank and line 22 as 10,000. The blind fill wrote 0.
- Changes dollars: no.

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

## Second opinions

- Blind fill (15 cases, from the blank form and instructions only): no dollar difference. The only differences are line 21 blank against 0 in cases 2 and 12 (item 18).
- PolicyEngine-US 2.152.16 (commit 794e17e675): it has no Form 4972 formula. `form_4972_lumpsum_distributions` is a bare input, and its Form 6251 line 10 subtracts it from the regular tax, as the engine's line 10 does. It has no Tax Rate Schedule, minimum distribution allowance or worksheet to compare.
- The Tax Rate Schedule constants match `irs-4972-form-2025::sec::tax-rate-schedule::b01` row for row.
- IRS Direct File: no checkout is in the repo, so it was not compared.
