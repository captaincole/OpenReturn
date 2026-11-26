# Form 8611 — doubts and defaults

The current form is Rev. December 2021 (`irs-8611-form-2025`). Its instructions have no example with numbers. The Line 7 example of Rev. 1-2006 (page 3) is a unit test (`tests/unit/federal/8611/lines.test.ts`). Two decisions with conflicting texts are rows A33 and A34 of `docs/rule-decisions.md`.

## Doubts

1. **Line 6, what the decrease is measured against.** Source: "Enter the percentage decrease in qualified basis during the current year. For this purpose, figure qualified basis without regard to any additions to qualified basis after the first year of the credit period. Compare any decrease in qualified basis first to additions to qualified basis" (`line-6::b01`). Default: the first-year qualified basis lost, over the first-year qualified basis, when the basis fell this year. The Rev. 1-2006 example enters .3 for a building at 70% of its first-year basis. Changes dollars: yes, when the prior year's basis was not the first-year amount. A decrease that the additions cover is no decrease: "Recapture applies only if the decrease in qualified basis exceeds additions" (`line-6::b01`), so a building that falls from $600,000 to $550,000 with $100,000 of additions over a $500,000 first-year basis files no Form 8611. The other reading, the decrease measured without the additions (10%), would recapture. The blind fill reads it as the engine does.
2. **Line 7, the earlier recapture.** Source: "If there was a prior recapture of accelerated credits on the building, do not recapture that amount again" (`line-7::b01`). Default: line 5 × line 6, less the accelerated portion recaptured earlier (a fact), never below 0, as in the Rev. 1-2006 example. Changes dollars: yes. The blind fill took the earlier amount out of line 5 first: (line 5 − earlier) × line 6. For line 5 $8,991, line 6 .100 and $1,000 recaptured earlier, that gives $799; the engine gives $0. The Rev. 1-2006 example settles it for the engine: Year 4 recaptures "$9 ($27 ($270 × .333 × .3) minus $18 Year 2 recapture)", and the blind reading gives ($90 − $18) × .3 = $22 there.
3. **Line 11, how line 10 is shared among the prior years.** Source: "Figure the interest separately for each prior tax year for which a credit is being recaptured" (`line-11::b01`). Nothing says how much of line 10 belongs to each year. Default: in proportion to each year's credit less its Line 2 Worksheet i (a K-1 recipient: its share of the credit each year). Changes dollars: yes, the interest only. The blind fill shared line 10 by each year's whole credit, with no Line 2 Worksheet i taken out: $1 more interest in its two cases with a worksheet ($335, not $334, on $685 over 2012 to 2024; $1,428, not $1,427, on $3,956 over 2016 to 2024). A third reading puts the unused credits of line 9 in the newest years (first in, first out), which moves more of line 10 to the older years and adds a few dollars of interest.
4. **Line 11, the rate.** Source: "the overpayment rate determined under section 6621(a)(1)" (`line-11::b01`). Default: the engine's section 6621 table for individuals (`data/underpaymentRates.ts`). From memory: since 1999 an individual's overpayment rate and underpayment rate are both the short-term rate plus 3 points. Changes dollars: no, if that is right.
5. **Line 11, the end date.** Source: "until the earlier of (a) the due date ... of the return for the recapture year, or (b) the date the return for the recapture year is filed and any income tax due for that year has been fully paid" (`line-11::b01`). Default: April 15, 2026. The engine does not know when the return is filed and paid. Changes dollars: a little, for a return filed and paid early.
6. **Line 11, the "Section 42(j)(5)" note.** Source: "Enter '-0-' on line 11 and write 'Section 42(j)(5)' to the left of the entry space" (`line-11::b01`). Default: 0 on line 11; the PDF has no field for the words. Changes dollars: no.
7. **Lines 9 and 13 for a section 42(j)(5) partnership's K-1.** The form gives no exception. From memory, section 42(j)(5) turns off the tax benefit rule for such a partnership. Default: the form's lines, with the owner's stated unused credits (usually 0). Changes dollars: yes, when the owner states unused credits.
8. **Line 2 Worksheet, decimals e and h.** Source: "Enter decimal amount figured in step 1 of the instructions for line 14" and "Divide line 16 by line 15. Enter the result here" (`part-i::b01`). No number of places is given. Default: 3 places, as lines 4 and 6 (row A33); f and i multiply by the printed value. Changes dollars: under $1 in most cases.
9. **Line 2 Worksheet, more than one.** Source: "If more than one worksheet is completed, add the amounts on i from all worksheets" (`part-i::b01`). The PDF has room for one. Default: line 2 adds every worksheet; the printed worksheet shows only when there is exactly one. Changes dollars: no.
10. **Line 4 outside the table.** The table lists years 2 to 15 (`line-4::b01`). Default: a recapture in year 1 or after year 15 makes line 4 and every later line unsupported; lines 1 to 3 still print. Changes dollars: no (no amount is printed).
11. **Lines 16 and 17.** "Only section 42(j)(5) partnerships complete these lines" (`lines-16-and-17::b01`). Default: blank on an individual return. Changes dollars: no.
12. **Item F with no CUSIP number.** "If the issue does not have a CUSIP number, enter 'None.'" (`specific-instructions::b01`). Default: "None" when the bond facts have no CUSIP. Changes dollars: no.
13. **A K-1 recapture amount with a code from a trust.** The trust K-1 box 13 code R is "Recapture of credits" for every credit. Default: it keeps no route, so the K-1 is unsupported, as before. Changes dollars: no.

14. **A product that ends in 49.6 cents.** Lines 5, 7, 9 and the worksheet's f and i round with `roundDollars` (`money.ts`), which snaps to cents first. $53,512 × .333 = $17,819.496 becomes $17,819.50 and then $17,820; the IRS rule ("drop amounts under 50 cents") would give $17,819. Default: the engine-wide rounding. Changes dollars: $1 on such a line. The blind fill found it on line 5 of its case 12 ($17,819 against the engine's $17,820); it does not change line 7 there. The proposal below would settle it for every form.
15. **Line 11, the start date for each prior year.** Source: "from the due date (not including extensions) of the return for the prior year" (`line-11::b01`). Default: April 15 after the prior year (`federal/8621/interest.ts`, `returnDueDate`). The engine does not move it to the next business day (April 18, 2022) or to the COVID-19 postponed dates of the 2019 and 2020 returns (July 15, 2020 and May 17, 2021). Changes dollars: a few dollars of interest for those years. The blind fill uses the same dates.
16. **Line 11, daily compounding or the Rev. Proc. 95-17 tables.** Source: "Tables of interest factors to figure daily compound interest were published in Rev. Proc. 95-17" (`line-11::b01`). Default: the daily compounding of Form 8621's interest, each day at its quarter's rate over 365 or 366. The tables give the same factors to their printed places. Changes dollars: at most $1 on line 11 from rounding. The tables are not in the corpus.
17. **Line 2, rounding each worksheet or the total.** Source: "add the amounts on i from all worksheets and enter the total on line 2" (`part-i::b01`). Default: each worksheet's i in whole dollars, then the sum ($150 + $338 = $488). The blind fill kept the cents and rounded the total ($150 + $337.50 = $487.50, so $488). Changes dollars: $1 on line 2 when two worksheets each end in 50 cents.
18. **Line 9 larger than line 8.** Source: line 10 is "Net recapture. Subtract line 9 from line 7 or line 8. If less than zero, enter -0-" (`face-page-1::b02`), and line 13 subtracts "the amount on line 9 from the total of all prior year unused credits" (`line-13::b01`). Nothing caps line 9 at line 7 or line 8. Default: no cap; line 13 takes off all of line 9 (unused $6,000, line 9 $1,602, line 8 $300: line 15 $4,398, not $5,700). The blind fill reads it the same way. Changes dollars: yes, the carryforward on line 15.

## Proposals for a discussion

- **Form 8609 and Form 8609-A as input documents.** Today the building fact holds what the owner's Form 8609 (item C to E), Form 8609-A (the Line 2 Worksheet amounts, the qualified basis) and Form 8586 (the credit each year) say. These are a new family of documents: the owner's own earlier forms and the agency's allocation. A later change could make them documents Cade reads, with a generator for fake ones. Not done here.
- **Form 8586 and Form 3800 in the engine.** Line 9 step 1 ("credits ... you could not use in prior years") and line 15 (the carryforward) belong to Form 3800's carryforward. With those forms in the engine, the unused credits could come from them instead of a stated amount.
- **`roundDollars` and an exact product (doubt 14).** `roundDollars` snaps to cents before it rounds, so a float sum such as 202,887.49999999997 does not round down by mistake. The same snap turns an exact product of $17,819.496 into $17,820. A smaller snap (a millionth of a dollar, not a cent) would keep the float fix and give $17,819, as the IRS rule reads. It changes `money.ts`, which every form uses, so a person decides; it may move locked scenarios by $1.

## Second opinions

- **PolicyEngine-US 2.154.0** (commit 363e9fc5, sparse checkout of `variables/gov/irs` and `parameters/gov/irs`): it does not model the low-income housing credit, Form 8586 or Form 8611. A search for "low income housing", "8611", "8586" and "42(j)" finds nothing. No constant or formula to compare.
- **IRS Direct File**: not compared. It files simple returns only, and the low-income housing credit is outside its scope.
- **Form 8611 (Rev. 1-2006)**, the prior revision (https://www.stayexempt.irs.gov/pub/irs-prior/f8611--2006.pdf, not in the corpus): its Line 7 example agrees with the engine's line 6 and line 7 (doubts 1 and 2) and is a unit test.
- **The blind fill** (13 cases from the blank form and instructions only): no line differs by blank against 0. Three cases differ in dollars. Case 7 line 7 ($0 against $799) is doubt 2; the prior example decides for the engine. Cases 5 and 12 line 11 ($1) are doubt 3. Case 12 line 5 ($1) is doubt 14.

## Confidence

| Field group | Confidence |
| --- | --- |
| Items A, B (names, number) | stated rule |
| Items C to F (building, bonds) | stated rule |
| Line 1, line 3 | stated rule |
| Line 2 and the Line 2 Worksheet | stated rule; decimals own reading (doubt 8) |
| Line 4 | stated rule (the table) |
| Lines 5 and 7 | published example with numbers (Rev. 1-2006) |
| Line 6 | published example with numbers (Rev. 1-2006); places decided (A33) |
| Line 8 | stated rule (the K-1 amount) |
| Line 9 | stated rule; K-1 decimals decided (A34) |
| Line 10, lines 12 to 15 | stated rule |
| Line 11 | stated rule; the share by year is own reading (doubt 3) |
| Lines 16, 17 | stated rule (blank on an individual return) |
| Schedule 2 line 16 | stated rule |
