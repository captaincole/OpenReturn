# FTB 3809 open questions

Source: `ca-3809-booklet-2025`. Two choices with conflicting texts are decisions A78 (Section B2 order, `creditUsed.ts`) and A79 (Schedule P column (a), `lines.ts`) in `docs/rule-decisions.md`. The doubts below have no conflicting text.

## Doubts

1. **Precision of Worksheet I, Section A.** The booklet gives no rounding rule. Its example prints "66.66%" for $800,000 of $1,200,000 and gets $183,325 from $250,000 at 73.33% (`ca-3809-booklet-2025::sec::corporations-filing-a-combined-report::b03`). Default: each factor and the average keep four decimal places; the rest is dropped. Changes dollars: a few dollars on line 1.

2. **Worksheet I, Section B, column (c).** No rounding rule for one row. Default: each row is rounded to whole dollars, then line 14 adds the rows (the Anderson example has whole dollars only, `::corporations-and-s-corporations::b02`). Changes dollars: at most $1 a row.

3. **Who files with no TTA income this year.** "To claim any TTA NOL carryover deduction or credit carryover, attach a completed form FTB 3809" (`::how-to-claim-deductions-and-credit-carryovers::b01`). Default: the form files with any carryover above 0, also when nothing can be used, so the carryover is carried on. Changes no dollars.

4. **Expired carryovers.** A TTA credit carries "only to the succeeding 10 taxable years" from 2014 (`::targeted-tax-area-tta-credits-carryover-period::b01`), and a TTA NOL 15 or 20 years, extended by each suspension (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b03` to `::b05`). The form has no line for the year a credit arose. Default: the engine takes last year's carryover as stated and does not check whether part of it expired. Changes dollars if a stated carryover has expired.

5. **The NOL suspension test.** The booklet says taxpayers with "net business income or modified adjusted gross income (individuals) of less than $1,000,000" are not affected (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b01`). Default: the engine reads it as FTB 3805V does (`3805v/lines.ts`, `nolSuspended`: suspended only when both are $1,000,000 or more). Changes dollars for a taxpayer with one above and one below.

6. **Line 6a for an individual.** "Compute the tax as if the former TTA taxable income represented all of your taxable income" with "the tax table or tax rate schedule" (`::part-i-computation-of-credit-limitations::b02`, `::individuals::b01`). Default: the Form 540 line 31 tax on line 5, with no exemption credits, no Schedule G-1 tax and no behavioral health tax. Changes dollars: line 7 is up to the exemption credits higher than a reading that subtracts them.

7. **Hiring before sales or use tax.** Line 9A column (e) is "line 8A, column (e)" less "line 8B, column (e)" (`::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b03`), so the hiring credit uses the limit first. When the tax left is below line 7, the engine also gives the tax left to the hiring credit first. Changes which carryover is left, not the total.

8. **Items E to H for an operator.** The engine prints them as stated in the business fact (the PBA code, employees, gross receipts, asset value); it does not take them from Schedule C. Changes no tax.

9. **Line 1d.** Below $5,000,000 of net tax nothing is "disallowed due to the $5,000,000 credit limitation" (`::line-1d-credit-amount-to-be-elected-as-refundable-in-future-years::b01`), so the line is blank. Above it the credit lines are a gap (item 2 of the proposals). Changes no dollars below the limit.

10. **Section B order with the other zone forms.** FTB 3805Z (enterprise zone, also Section B2) and FTB 3807 (Section A2) have no rules yet. When they do, decision A78's general rule decides where code 176 goes next to code 210.

## Proposals for a discussion

1. **More than one TTA business.** "Attach a separate form FTB 3809 for each business you operate or invest in" (`::how-to-claim-deductions-and-credit-carryovers::b01`). The engine holds one business: the facts are single keys. A second business needs repeating copies of the form (issue #174) and one credit line that adds the copies.

2. **The $5,000,000 business credit limit.** It applies to all business credits together, after the order of Schedule P. The engine makes the TTA credit a gap when Form 540 line 35 is above $5,000,000. A shared limit for every business credit would be one function in `540/creditBalance.ts` that each credit form reads.

3. **FTB 3805V and FTB 3809 on one return.** The two NOL deductions share California income, and FTB 3805V's modified taxable income does not subtract the TTA deduction (`schedule-ca/line10.ts`). The engine makes line 3b a gap when FTB 3805V files. A fix needs an order of the two deductions and FTB 3805V reading line 9b3.

4. **Form 540NR and entity returns.** A nonresident claims on Form 540NR lines 58 to 60 and Schedule CA (540NR) line 9b3; the engine makes the lines a gap.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header, items A to D | stated rule |
| Items E to H | stated rule (own reading: from the fact, item 8) |
| Line 2 (Worksheet I, Section A) | published example with numbers (`::corporations-filing-a-combined-report::b03`) |
| Schedule Z line 1, 3 (Worksheet I, Section B) | published example with numbers (`::corporations-and-s-corporations::b02`, `::part-ii-pass-through-income-or-loss::b02`) |
| Schedule Z line 2, column (c) of lines 8B and 9B | stated rule (blank for an individual) |
| Schedule Z line 4, lines 3a to 3c (Worksheet II) | published example with numbers (`::example-2::b01`) |
| Schedule Z lines 5 to 7 | stated rule; line 6a own reading (item 6) |
| Schedule Z Part II, lines 1a to 1c | published example with numbers (`::example-part-ii::b01`) |
| Line 1d | stated rule; unsupported above $5,000,000 of net tax |
| Schedule Z Parts III and IV | stated rule (blank for an individual) |
| Schedule P (540) code 210 line, Form 540 lines 43 to 45 | own reading (decisions A78, A79) |
| Schedule CA (540) line 9b3 | stated rule |
