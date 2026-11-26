# FTB 5805F — open questions

The engine fills every field of FTB 5805F for a calendar-year Form 540 filer.
No FTB example with numbers exists for this form. Each doubt below names its
source text, the default the engine applies, and whether it changes dollars.
The two decisions with conflicting texts are rows A58 and A59 of
`docs/rule-decisions.md` and `DECISION` comments in `lines.ts`.

## Doubts

1. **Who files.** "You are a farmer or fisherman if at least two-thirds of your
   2024 or 2025 gross income is from farming or fishing"
   (`ca-5805f-inst-2025::sec::b-qualifications::b01`). The engine does not
   figure gross income from all sources from the return. The taxpayer states
   both amounts for each year (`farmer_or_fisherman.gross_income_<year>`), as
   Pub. 225 lists them. Default: no fact, no FTB 5805F. Changes dollars: yes,
   when a farmer states nothing (FTB 5805 files instead).

2. **Line 1, IRC Section 453A interest.** Line 1 adds "any IRC Section 453A
   interest from line 63" (`ca-5805f-face-2025::sec::face-part-i::b01`). The
   engine's Form 540 line 63 holds only FTB 3805P taxes, so that part is 0.
   Changes dollars: only for an installment sale with 453A interest, which the
   engine does not compute.

3. **Line 4 uses .6667, not two-thirds.** The face prints "66 2/3% (.6667)".
   The engine multiplies by .6667 and rounds: $18,000 gives $12,001, not
   $12,000. Changes dollars: $1 at most.

4. **Line 7 from the 2024 answer.** `prior_year.ca_tax` is the 2024 tax less
   the line 34 tax (the FTB 5805 line 5 amount). Line 7 adds the 2024 lump-sum
   tax back (`prior_year.ca_lump_sum_tax`); line 8 is that tax. Absent means
   none. Changes dollars: no.

5. **No 2024 return but no 2024 tax.** Line 7 says: with no 2024 return, use
   line 4 on line 10. Exception 4 says: no penalty with no 2024 tax liability
   and a 12-month year "or would have been if you were required to file"
   (`ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01`). Default: a
   resident who did not file because no tax was due records `prior_year.ca_tax`
   as 0, so line 9 stops the form. `prior_year.ca_no_twelve_month_return` is for
   a 2024 year shorter than 12 months, or no California return. Changes
   dollars: yes, the whole penalty, if Cade records the wrong one.

6. **Line 11, which payments count.** "estimated tax payments made on or
   before January 15, 2026, from Form 540, line 71, line 72, and line 73". The
   engine counts the 540-ES payments made by January 15 (asked) and the 2024
   overpayment applied to 2025. It leaves out the FTB 3519 extension payment
   and 540-ES payments after January 15. Changes dollars: no; it is the
   sentence as written.

7. **Line 12 of zero or less.** "If zero or less, you do not owe a penalty."
   The engine prints 0 and leaves Part II blank. Changes dollars: no.

8. **Exceptions 1 and 2 on the form.** The instructions list them, and the
   form has no line for them. The engine fills Part I and leaves Part II and
   Form 540 line 113 blank; the line 113 box stays checked, as section F says.
   Exception 2 reads the 2024 withholding (`prior_year.ca_withholding`), asked
   only when the 2024 tax is $500 ($250) or more. Exception 2 subtracts 2024
   withholding, not 2025 withholding; the engine follows the text. Changes
   dollars: yes, the whole penalty, in the rare case where only 2024
   withholding brings the 2024 tax under $500.

9. **Line 13 with more than one payment.** The form takes one date: "the date
   the amount on line 12 was paid". The engine takes the day it was paid in
   full (`ca_farmer_estimated_tax.underpayment_paid_on`), else April 15, 2026,
   as Form 2210 treats a balance no payment reached. A part paid earlier
   still counts to that day. Changes dollars: a few dollars, upward.

10. **Line 16's waived amount.** The amount to waive goes "in parentheses on
    the dotted line next to line 16"; the PDF has no field there, so it does
    not print. Line 16 prints the penalty less that amount, never below 0.
    Changes dollars: no.

11. **Line 16 box with no waiver.** The engine writes `false` (unchecked) when
    a penalty is owed and no waiver is asked, so Form 540 line 113 knows to
    take line 15. Changes dollars: no.

12. **Line 5 of zero.** With no withholding the engine prints 0 on lines 5
    and 11; lines 2 and 8 stay blank with no lump-sum tax. Changes dollars: no.

13. **Fiscal-year filers, Form 540NR and Form 541.** The engine models a
    calendar-year Form 540 filer. A return with no Form 540 makes every line a
    gap when the decision files the form. Changes dollars: not for the
    modeled case.

## Confidence

| Field group | Confidence |
| --- | --- |
| Who files (two-thirds test) | Published example with numbers (Pub. 225 Examples 1 and 2) |
| Header (name, SSN) | Stated rule |
| Lines 1 to 6 | Stated rule |
| Lines 7 to 9 | Stated rule; line 7's split is own reading (doubt 4) |
| Lines 10 to 12 | Stated rule |
| Exceptions 1 and 2 | Stated rule; how they show on the form is own reading (doubt 8) |
| Line 13 | Stated rule; one date for several payments is own reading (doubt 9) |
| Line 14 | Published example with numbers (Form 2210 Table 2: 90 days to April 15) |
| Line 15 | Stated rule |
| Line 16 (box, amount, explanation) | Stated rule; the two rows are own reading |
| Form 540 line 113 and its FTB 5805F box | Stated rule |

## Proposals for a discussion

- **Figure the two-thirds test from the return.** The engine knows Schedule F
  line 9, Form 4835 line 7 and most income lines. A worksheet could add the
  income (not loss) amounts of Pub. 225's list and the farm amounts, so Cade
  asks only for 2024 and for items no form shows (fishing crew pay, K-1 farm
  income). The federal Form 2210-F would use the same worksheet. That is a new
  shared worksheet that reads many forms, so it waits for a discussion.
