# FTB 3809 open questions

Source: `ca-3809-booklet-2025`. Block ids below are in that document unless they name another.

## Two texts conflict

1. **The order of the TTA credit in Schedule P (540) Section B2 (A85).** Section B2 says to apply "credits with limited carryovers before credits with no limitation on carryover" but allows the other order (`ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01`); the low-income housing credit comes "after any business credits" (`::how-to-compute-the-limitation::b01`). Decided: after FTB 3541's film credits, before FTB 3801-CR's passive credits, one order for every return. The `DECISION` comment is in `creditUsed.ts`; the row is A85 in `docs/rule-decisions.md`.
2. **Schedule P (540) column (a) holds the limited credit (A86).** Schedule P column (a) is "the amount of credit available to offset tax" (`ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01`); FTB 3809 keeps the whole carryover on lines 8B and 9B column (g) (`::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01`). Decided: column (a) is the part Schedule Z line 7 allows. The comment is in `lines.ts`; the row is A86.
3. **The TTA credit next to the enterprise zone credit (A87).** Both carry over "only to the succeeding 10 taxable years" from 2014 (`::targeted-tax-area-tta-credits-carryover-period::b01`; `ca-3805z-booklet-2025::sec::ez-credits-carryover-period::b01`), so Section B2's rule does not pick one. Decided: the enterprise zone credit (176) first, then the TTA credit (210) on the next line, the order of the Credit Table. The `DECISION` comment is in `creditUsed.ts`; the row is A87.

## Should we do this now

1. **Precision of Worksheet I, Section A.** The booklet gives no rounding rule. Its example prints "66.66%" for $800,000 of $1,200,000 and gets $183,325 from $250,000 at 73.33% (`::corporations-filing-a-combined-report::b03`). Default: each factor and the average keep four decimal places; the rest is dropped. Done; it changes a few dollars on line 1.
2. **Worksheet I, Section B, column (c).** No rounding rule for one row. Default: each row is rounded to whole dollars, then line 14 adds the rows (the Anderson example has whole dollars only, `::corporations-and-s-corporations::b02`). Done; at most $1 a row.
3. **Who files with no TTA income this year.** "To claim any TTA NOL carryover deduction or credit carryover, attach a completed form FTB 3809" (`::how-to-claim-deductions-and-credit-carryovers::b01`). Default: the form files with any carryover above 0, also when nothing can be used, so the carryover is carried on. Done; no dollars.
4. **Expired carryovers.** A TTA credit carries "only to the succeeding 10 taxable years" from 2014 (`::targeted-tax-area-tta-credits-carryover-period::b01`), and a TTA NOL 15 or 20 years, extended by each suspension (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b03` to `::b05`). The form has no line for the year a credit arose.
   - The sales or use tax credit arose only for property placed in service by 2012 (`::line-1b-sales-or-use-tax-credit-carryover::b01`), so its 10 years ended before 2025; only an earlier year's $5,000,000 limitation could extend it (`::general-information::b03`). Done (tax review, 2026-11-26): a stated sales or use tax carryover above 0 is unsupported on lines 1a to 1c, Schedule Z Part II and the credit on Form 540, as FTB 3541 does for a carryover past its period (`3541/QUESTIONS.md` item 10). `toveine` now carries a hiring credit only.
   - A hiring credit could arise until 2017 (60 months of wages for an employee hired by 2012) and carries 10 years from then, so part of a stated hiring carryover may still be good. Not now: the engine takes it as stated, because the form does not record the year each part arose and a part left from before 2014 has run out only if the taxpayer kept it on the form.
   - A TTA NOL: the rows carry their loss year, but the engine does not drop a row past its period. Not now: the period depends on the suspension years of each row, and a stated carryover from last year's form already leaves out an expired row.
5. **The NOL suspension test.** The booklet says taxpayers with "net business income or modified adjusted gross income (individuals) of less than $1,000,000" are not affected (`::part-iii-net-operating-loss-nol-carryover-and-deduction::b01`). Default: the engine reads it as FTB 3805V does (`3805v/lines.ts`, `nolSuspended`: suspended only when both are $1,000,000 or more). Done; one rule for both NOL forms.
6. **Line 6a for an individual.** "Compute the tax as if the former TTA taxable income represented all of your taxable income" with "the tax table or tax rate schedule" (`::part-i-computation-of-credit-limitations::b02`, `::individuals::b01`). Default: the Form 540 line 31 tax on line 5, with no exemption credits, no Schedule G-1 tax and no behavioral health tax. Done; line 7 is up to the exemption credits higher than a reading that subtracts them.
7. **Hiring before sales or use tax.** Line 9A column (e) is "line 8A, column (e)" less "line 8B, column (e)" (`::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b03`), so the hiring credit uses the limit first. When the tax left is below line 7, the engine also gives the tax left to the hiring credit first. Done; it changes which carryover is left, not the total. With item 4, no 2025 return uses both.
8. **Items E to H for an operator.** The engine prints them as stated in the business fact (the PBA code, employees, gross receipts, asset value); it does not take them from Schedule C. Done; no tax.
9. **Line 1d.** Below $5,000,000 of net tax nothing is "disallowed due to the $5,000,000 credit limitation" (`::line-1d-credit-amount-to-be-elected-as-refundable-in-future-years::b01`), so the line is blank. Above it the credit lines are a gap (pattern change 2). Done.
10. **Section B order with the other zone forms.** FTB 3805Z (enterprise zone, also Section B2) and FTB 3807 (Section A2) were written at the same time on other branches. Done at the merge: the LAMBRA credit is in Section A2, before every Section B2 credit, and the TTA credit takes the Section B2 line after the enterprise zone credit (item 3 above, decision A87).
11. **Employee business expenses on Worksheet I, Section B, line 2.** The line says only "Employee business expenses". The Anderson example applies the time share to the Schedule A amount with no 2% floor (`::corporations-and-s-corporations::b02`). Default: the fact holds the amount as stated, and the engine applies the share to it. Done; dollars change if the amount should be the part above the floor.
12. **Tax table or rate schedule on Schedule Z line 6a.** "Use the tax table or tax rate schedule in your tax booklet" (`::individuals::b01`). Default: the Form 540 rule, the tax table up to $100,000 and the rate schedule above (`caTaxOnTaxableIncome`). Done; up to a few dollars below $100,000.
13. **A negative Worksheet I, Section B, line 14.** The amount goes to Schedule Z only when it "is a positive amount", and "If the amount is negative, you do not have any business income attributable to the former TTA" (`::located-within-and-outside-the-former-tta-and-california::b02`). Done: Schedule Z lines 1, 3 and 5 are 0, as Worksheet II line 7 is (found by the blind fill, case 9).
14. **The AMT NOL on Schedule P (540) line 20.** "Taxpayers claiming a TTA NOL carryover deduction determine their NOL for alternative minimum tax purposes" on Schedule P (`::alternative-minimum-tax::b01`), with another FTB 3809 "using your AMT income and expense amounts" (`ca-540-sched-p-inst-2025::sec::step-1-amt-nol-for-prior-year::b01`). Line 16 adds back Schedule CA line 9b3, and line 20 has no facts. Done (tax review, 2026-11-26): with an amount on line 16, Schedule P line 21 is unsupported, so lines 22 to 26 and Form 540 lines 61 and 64 stay blank instead of printing an AMT on the whole NOL. The rule covers lines 9b1 and 9b2 (FTB 3805V) too; no scenario has Schedule P with an NOL. Narrowed at the merge with FTB 3805Z and FTB 3807: when line 19 is at most its own line 22 exemption, line 24 is 0, because line 20 only lowers AMTI and a lower AMTI never has a smaller exemption; lines 21 to 23 stay a gap. The zone credits test (`zoneCreditsTogether.test.ts`) has that case. Figuring the AMT NOL is pattern change 5.

## Pattern change

1. **More than one TTA business.** Before: "Attach a separate form FTB 3809 for each business you operate or invest in" (`::how-to-claim-deductions-and-credit-carryovers::b01`), but the facts are single keys, so the engine holds one business. After: repeating copies of the form (issue #174) and one credit line that adds the copies.
2. **The $5,000,000 business credit limit.** Before: the engine makes the TTA credit a gap when Form 540 line 35 is above $5,000,000, as each credit form checks its own credits. After: one function in `540/creditBalance.ts` applies the shared limit, after the order of Schedule P, for every business credit, and fills line 1d.
3. **FTB 3805V and FTB 3809 on one return.** Before: line 3b is a gap when FTB 3805V files, because the two NOL deductions share California income and FTB 3805V's modified taxable income does not subtract the TTA deduction (`schedule-ca/line10.ts`). After: an order of the two deductions, and FTB 3805V reads line 9b3.
4. **Form 540NR and entity returns.** Before: a nonresident's claim on Form 540NR lines 58 to 60 and Schedule CA (540NR) line 9b3 is a gap. After: the 540NR credit and NOL lines read this form as Form 540 does.
5. **AMT NOL carryovers.** Before: Schedule P line 20 has no facts, so any NOL on line 16 makes AMTI a gap (item 14). After: a fact holds each AMT NOL carryover (FTB 3805V's and FTB 3809's, refigured with AMT amounts), and line 20 takes the smaller of the carryover and 90% of line 19 (`ca-540-sched-p-inst-2025::sec::step-3-amt-nol-deduction-for-the-current-year::b01`).

## Rows past the form's limit

- One business per form; a second business is pattern change 1. The facts cannot hold a second one, so nothing is dropped.
- Worksheet II takes any number of NOL rows (one per loss year); the form prints only the totals on lines 3a to 3c.
- Schedule P (540) Section B2: the engine fills lines 16 to 18. With FTB 3541's, FTB 3805Z's and FTB 3801-CR's credits, a fourth Section B2 credit is unsupported (`TOO_MANY_B2_CREDITS`; `form.test.ts`).

## Second opinions

- **PolicyEngine-US 2.154.1** (commit 0fbed6ddb1, 2026-11-26), `variables/gov/states/ca` and `parameters/gov/states/ca`: no variable or parameter for the Targeted Tax Area, FTB 3809 or the zone credits. Nothing to compare.
- **IRS Direct File**: federal only; it has no California form. Nothing to compare.
- **Blind fill** (14 cases, from the blank form and the booklet): one dollar difference (item 13, fixed). Every other difference is blank against 0 on a line with no carryover.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header, items A to D | stated rule |
| Items E to H | stated rule (own reading: from the fact, item 8) |
| Line 2 (Worksheet I, Section A) | published example with numbers (`::corporations-filing-a-combined-report::b03`) |
| Schedule Z line 1, 3 (Worksheet I, Section B) | published example with numbers (`::corporations-and-s-corporations::b02`, `::part-ii-pass-through-income-or-loss::b02`); never below 0 (item 13) |
| Schedule Z line 2, column (c) of lines 8B and 9B | stated rule (blank for an individual) |
| Schedule Z line 4, lines 3a to 3c (Worksheet II) | published example with numbers (`::example-2::b01`) |
| Schedule Z lines 5 to 7 | stated rule; line 6a own reading (item 6) |
| Schedule Z Part II, lines 1a to 1c | published example with numbers (`::example-part-ii::b01`); a sales or use tax carryover is a gap (item 4) |
| Line 1d | stated rule; unsupported above $5,000,000 of net tax |
| Schedule Z Parts III and IV | stated rule (blank for an individual) |
| Schedule P (540) code 210 line, Form 540 lines 43 to 45 | own reading (decisions A85, A86, A87) |
| Schedule CA (540) line 9b3 | stated rule; Schedule P line 21 is a gap with it (item 14) |
