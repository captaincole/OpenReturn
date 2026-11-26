# Form 8611 — doubts and defaults

The current form is Rev. December 2021 (`irs-8611-form-2025`). Its instructions have no example with numbers. The Line 7 example of Rev. 1-2006 (page 3) is a unit test (`tests/unit/federal/8611/lines.test.ts`). Two decisions with conflicting texts are rows A33 and A34 of `docs/rule-decisions.md`.

## Doubts

1. **Line 6, what the decrease is measured against.** Source: "Enter the percentage decrease in qualified basis during the current year. For this purpose, figure qualified basis without regard to any additions to qualified basis after the first year of the credit period. Compare any decrease in qualified basis first to additions to qualified basis" (`line-6::b01`). Default: the first-year qualified basis lost, over the first-year qualified basis, when the basis fell this year. The Rev. 1-2006 example enters .3 for a building at 70% of its first-year basis. Changes dollars: yes, when the prior year's basis was not the first-year amount.
2. **Line 7, the earlier recapture.** Source: "If there was a prior recapture of accelerated credits on the building, do not recapture that amount again" (`line-7::b01`). Default: line 5 × line 6, less the accelerated portion recaptured earlier (a fact), never below 0, as in the Rev. 1-2006 example. Changes dollars: yes.
3. **Line 11, how line 10 is shared among the prior years.** Source: "Figure the interest separately for each prior tax year for which a credit is being recaptured" (`line-11::b01`). Nothing says how much of line 10 belongs to each year. Default: in proportion to each year's credit less its Line 2 Worksheet i (a K-1 recipient: its share of the credit each year). Changes dollars: yes, the interest only.
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

14. **A product that ends in 49.6 cents.** Lines 5, 7, 9 and the worksheet's f and i round with `roundDollars` (`money.ts`), which snaps to cents first. $53,512 × .333 = $17,819.496 becomes $17,819.50 and then $17,820; the IRS rule ("drop amounts under 50 cents") would give $17,819. Default: the engine-wide rounding. Changes dollars: $1 on such a line.

## Proposals for a discussion

- **Form 8609 and Form 8609-A as input documents.** Today the building fact holds what the owner's Form 8609 (item C to E), Form 8609-A (the Line 2 Worksheet amounts, the qualified basis) and Form 8586 (the credit each year) say. These are a new family of documents: the owner's own earlier forms and the agency's allocation. A later change could make them documents Cade reads, with a generator for fake ones. Not done here.
- **Form 8586 and Form 3800 in the engine.** Line 9 step 1 ("credits ... you could not use in prior years") and line 15 (the carryforward) belong to Form 3800's carryforward. With those forms in the engine, the unused credits could come from them instead of a stated amount.

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
