# FTB 5805F — open questions

The engine fills every field of FTB 5805F for a calendar-year Form 540 filer.
No FTB example with numbers exists for this form. Each item below names its
source text, what the engine does, and whether it changes dollars.

## Two texts conflict

Both are decided by the author: rows A58 and A59 of `docs/rule-decisions.md`
and the `DECISION` comments in `lines.ts`.

1. **Exception 1's last day (A58).** The FTB 5805F instructions say "by March
   2, 2026" (`ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01`); the
   FTB 5805 instructions say "by March 1, 2026"
   (`ca-5805-inst-2025::sec::g-farmers-and-fishermen::b01`). The engine takes
   March 2 (`ca_farmer_estimated_tax.filed_and_paid_by_march_2`): the form's
   own instructions decide, and March 1, 2026 is a Sunday.

2. **Line 14 with no estimate payment (A59).** Line 14 counts the days "after
   January 15, 2026, to and including the date on line 13", and the next
   sentence says "If you are a calendar year taxpayer and made no estimate
   payment, enter 90 days" (`ca-5805f-face-2025::sec::face-part-ii::b01`). The
   engine counts the days to line 13: the form's arithmetic wins, and 90 days
   is that count for April 15, 2026.

## Should we do this now

1. **Who files.** "You are a farmer or fisherman if at least two-thirds of your
   2024 or 2025 gross income is from farming or fishing"
   (`ca-5805f-inst-2025::sec::b-qualifications::b01`). Done: the taxpayer
   states both amounts for each year (`farmer_or_fisherman.gross_income_<year>`),
   as Pub. 225 lists them. When Schedule F or Form 4835 files on a Form 540
   return and FTB 5805 files (the 2024 tax is known), FTB 5805 lists each year
   not stated as a pending input until a stated year passes or both fail
   (`farmerTestWaitingKeys` in `mustFile.ts`), so a farmer is asked before the
   general penalty stands. Not now: figuring the test from the return, and
   asking a fisherman (no form shows fishing income); see the proposal below.

2. **Line 1, IRC Section 453A interest.** Line 1 adds "any IRC Section 453A
   interest from line 63" (`ca-5805f-face-2025::sec::face-part-i::b01`). The
   engine's Form 540 line 63 holds only FTB 3805P taxes, so that part is 0.
   Not now: the engine does not compute 453A interest on any form.

3. **Line 4 uses .6667, not two-thirds.** Done as the face prints it: "66 2/3%
   (.6667)". $18,000 gives $12,001, not $12,000; $1 at most.

4. **Line 7 from the 2024 answer.** Done: `prior_year.ca_tax` is the 2024 tax
   less the line 34 tax (the FTB 5805 line 5 amount). Line 7 adds the 2024
   lump-sum tax back (`prior_year.ca_lump_sum_tax`); line 8 is that tax.
   Absent means none. Changes dollars: no.

5. **No 2024 return but no 2024 tax.** Done: exception 4 ("no tax liability
   for 2024 ... or would have been if you were required to file",
   `ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01`) comes before
   line 7's "no 2024 return" rule. A resident who did not file because no tax
   was due records `prior_year.ca_tax` as 0, so line 9 stops the form.
   `prior_year.ca_no_twelve_month_return` is for a 2024 year shorter than 12
   months, or no California return. Changes dollars: the whole penalty, if
   Cade records the wrong one.

6. **Line 11, which payments count.** Done as written: "estimated tax payments
   made on or before January 15, 2026, from Form 540, line 71, line 72, and
   line 73". The engine counts the 540-ES payments made by January 15 (asked)
   and the 2024 overpayment applied to 2025. It leaves out the FTB 3519
   extension payment and 540-ES payments after January 15.

7. **Line 12 of zero or less.** Done: "If zero or less, you do not owe a
   penalty." The engine prints 0 and leaves Part II blank.

8. **Exceptions 1 and 2 on the form.** Done: the form has no line for them.
   The engine fills Part I and leaves Part II and Form 540 line 113 blank; the
   line 113 box stays checked, as section F says. Exception 2 reads the 2024
   withholding (`prior_year.ca_withholding`), asked only when the 2024 tax is
   $500 ($250) or more, and subtracts 2024 withholding as the text says.

9. **Line 13 with more than one payment.** Done: the form takes one date, "the
   date the amount on line 12 was paid". The engine takes the day it was paid
   in full (`ca_farmer_estimated_tax.underpayment_paid_on`), else April 15,
   2026, as Form 2210 treats a balance no payment reached. A part paid earlier
   still counts to that day: a few dollars, upward.

10. **A long waiver explanation.** The form has two rows below line 16; "If
    you need more space, attach a statement"
    (`ca-5805f-inst-2025::sec::e-waiver-of-the-penalty::b01`). The engine fills
    both rows and makes row 2 a gap when the rest is longer than one row
    (about 95 characters). Not now: the engine prints no attached statement
    for this form, and a short explanation fits.

11. **Line 16's waived amount.** Done: the amount to waive goes "in
    parentheses on the dotted line next to line 16"; the PDF has no field
    there, so it does not print. Line 16 prints the penalty less that amount,
    never below 0.

12. **Line 16 box with no waiver.** Done: the engine writes `false`
    (unchecked) when a penalty is owed and no waiver is asked, so Form 540 line
    113 knows to take line 15.

13. **Line 5 of zero.** Done: with no withholding the engine prints 0 on lines
    5 and 11; lines 2 and 8 stay blank with no lump-sum tax.

14. **Fiscal-year filers, Form 540NR and Form 541.** Not now: the engine
    models a calendar-year Form 540 filer. A return with no Form 540 makes
    every line a gap when the decision files the form.

15. **Form 540 line 114 with a refund.** Done: with an amount on line 99, line
    114 holds only the part of lines 110, 112 and 113 above line 99
    (`ca-540-inst-2025::sec::line-115-refund-or-no-amount-due::b01`). Before,
    it added line 113 to a refund return. Line 111 still ignores line 99 when
    contributions are more than the refund; no scenario has contributions.

## Pattern change

1. **Figure the two-thirds test from the return.** Before: the taxpayer states
   gross income from all sources and from farming or fishing for each year.
   After: a shared worksheet adds the income (not loss) amounts of Pub. 225's
   list and the farm amounts (Schedule F line 9, Form 4835 line 7), so Cade
   asks only for 2024 and for items no form shows (fishing crew pay, K-1 farm
   income); the federal Form 2210-F would use it too.

## Confidence

| Field group | Confidence |
| --- | --- |
| Who files (two-thirds test) | Published example with numbers (Pub. 225 Examples 1 and 2) |
| Header (name, SSN) | Stated rule |
| Lines 1 to 6 | Stated rule |
| Lines 7 to 9 | Stated rule; line 7's split is own reading (item 4) |
| Lines 10 to 12 | Stated rule |
| Exceptions 1 and 2 | Stated rule; how they show on the form is own reading (item 8) |
| Line 13 | Stated rule; one date for several payments is own reading (item 9) |
| Line 14 | Published example with numbers (Form 2210 Table 2: 90 days to April 15) |
| Line 15 | Stated rule |
| Line 16 (box, amount, explanation) | Stated rule; the two rows are own reading |
| Form 540 line 113 and its FTB 5805F box | Stated rule |

## Blind fill

A preparer filled 15 cases by hand from the form and instructions only. Every
line of every case matched the engine: no dollar difference, and no blank
against 0. Each of the preparer's doubts is above or in rows A58 and A59.

## Second opinions

- **PolicyEngine-US 2.154.0** (commit 363e9fc5, 2026-11-25): it does not model
  California's estimated tax penalty or FTB 5805F, nor the federal Form 2210-F.
  Nothing to compare.
- **IRS Direct File**: federal returns only, with no Form 2210-F and no
  California forms. Nothing to compare.

## Proposals for a discussion

- **Figure the two-thirds test from the return.** The engine knows Schedule F
  line 9, Form 4835 line 7 and most income lines. A worksheet could add the
  income (not loss) amounts of Pub. 225's list and the farm amounts, so Cade
  asks only for 2024 and for items no form shows (fishing crew pay, K-1 farm
  income). The federal Form 2210-F would use the same worksheet. That is a new
  shared worksheet that reads many forms, so it waits for a discussion.
