# Form 8611 — doubts and defaults

The current form is Rev. December 2021 (`irs-8611-form-2025`). Its instructions have no example with numbers. The Line 7 example of Rev. 1-2006 (page 3) is a unit test (`tests/unit/federal/8611/lines.test.ts`). The numbers below (1 to 18) are the doubts' first numbers, kept so earlier reports still point to them.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

- **Line 6, the number of places (row A33).** Line 6 is "a decimal amount carried out to at least 3 places" (`face-page-1::b02`), and lines 7 and 9 multiply by "the decimal amount on line 6" (`face-page-1::b02`, `line-9::b01`). The engine keeps exactly 3 places, rounded to the nearest, and multiplies by the printed value (`lines.ts`).
- **Line 9 on a K-1 recapture (row A34).** A K-1 recipient skips "lines 1–7" (`specific-instructions::b01`), but line 9 steps 3 and 4 multiply by the decimals on lines 4 and 6 (`line-9::b01`). The engine uses the entity's decimals from its statement, stated on the building fact (`copies.ts`).

## Should we do this now

- **8. Line 2 Worksheet, decimals e and h. Done.** Source: "Enter decimal amount figured in step 1 of the instructions for line 14" and "Divide line 16 by line 15. Enter the result here" (`part-i::b01`). No number of places is given, and no text conflicts. The engine keeps 3 places, the rule of row A33 for lines 4 and 6, and f and i multiply by the printed value. Changes dollars: under $1 in most cases.
- **1. Line 6, what the decrease is measured against. Done.** Source: "Enter the percentage decrease in qualified basis during the current year. For this purpose, figure qualified basis without regard to any additions to qualified basis after the first year of the credit period. Compare any decrease in qualified basis first to additions to qualified basis" (`line-6::b01`). The engine takes the first-year qualified basis lost, over the first-year qualified basis, when the basis fell this year. The Rev. 1-2006 example enters .3 for a building at 70% of its first-year basis. A decrease that the additions cover is no decrease: "Recapture applies only if the decrease in qualified basis exceeds additions" (`line-6::b01`). So a building that falls from $600,000 to $550,000 with $100,000 of additions over a $500,000 first-year basis files no Form 8611. The building fact states the 2024 and 2025 amounts as totals, with the additions included (`facts/kinds/lowIncomeHousingRecapture.ts`). An earlier comment there asked for the amounts without the additions; with that reading the example above would recapture .100, and pedron's line 6 would be .225, not .175. The comment and a unit test now say totals.
- **2. Line 7, the earlier recapture. Done.** Source: "If there was a prior recapture of accelerated credits on the building, do not recapture that amount again" (`line-7::b01`). The engine takes line 5 × line 6, less the accelerated portion recaptured earlier (a fact), never below 0. The blind fill took the earlier amount out of line 5 first: (line 5 − earlier) × line 6. For line 5 $8,991, line 6 .100 and $1,000 recaptured earlier, that gives $799; the engine gives $0. The Rev. 1-2006 example settles it: Year 4 recaptures "$9 ($27 ($270 × .333 × .3) minus $18 Year 2 recapture)", and the blind reading gives ($90 − $18) × .3 = $22 there.
- **3. Line 11, how line 10 is shared among the prior years. Done.** Source: "Figure the interest separately for each prior tax year for which a credit is being recaptured" (`line-11::b01`). Nothing says how much of line 10 belongs to each year. The engine shares it in proportion to each year's credit less its Line 2 Worksheet i (a K-1 recipient: its share of the credit each year). The blind fill shared line 10 by each year's whole credit: $1 more interest in its two cases with a worksheet ($335, not $334; $1,428, not $1,427). A third reading puts the unused credits of line 9 in the newest years (first in, first out), which adds a few dollars of interest. The text does not settle it, and the share by year changes only the interest.
- **4. Line 11, the rate. Done.** Source: "the overpayment rate determined under section 6621(a)(1)" (`line-11::b01`). The engine uses its section 6621 table for individuals (`data/underpaymentRates.ts`). From memory: since 1999 an individual's overpayment rate and underpayment rate are both the short-term rate plus 3 points. No dollars change if that is right; a check against the Code waits for the Code in the library.
- **5. Line 11, the end date. Not now.** Source: "until the earlier of (a) the due date ... of the return for the recapture year, or (b) the date the return for the recapture year is filed and any income tax due for that year has been fully paid" (`line-11::b01`). The engine uses April 15, 2026, because it does not know when the return is filed and paid. A filing-date fact would change only a return filed and paid early, by a little.
- **6. Line 11, the "Section 42(j)(5)" note. Not now.** Source: "Enter '-0-' on line 11 and write 'Section 42(j)(5)' to the left of the entry space" (`line-11::b01`). The engine enters 0; the PDF has no field for the words. Changes dollars: no.
- **7. Lines 9 and 13 for a section 42(j)(5) partnership's K-1. Not now.** The form gives no exception. From memory, section 42(j)(5) turns off the tax benefit rule for such a partnership. The engine uses the form's lines with the owner's stated unused credits (usually 0). Only an owner who states unused credits on such a K-1 reaches it.
- **9. Line 2 Worksheet, more than one. Done.** Source: "If more than one worksheet is completed, add the amounts on i from all worksheets" (`part-i::b01`). The PDF has room for one. Line 2 adds every worksheet; the printed worksheet shows only when there is exactly one. Changes dollars: no.
- **10. Line 4 outside the table. Done.** The table lists years 2 to 15 (`line-4::b01`). A recapture in year 1 or after year 15 makes line 4 and every later line unsupported; lines 1 to 3 still print.
- **11. Lines 16 and 17. Done.** "Only section 42(j)(5) partnerships complete these lines" (`lines-16-and-17::b01`). Blank on an individual return.
- **12. Item F with no CUSIP number. Done.** "If the issue does not have a CUSIP number, enter 'None.'" (`specific-instructions::b01`). The engine prints "None" when the bond facts have no CUSIP.
- **13. A K-1 recapture amount from a trust. Not now.** The trust K-1 box 13 code R is "Recapture of credits" for every credit, so the amount does not say which credit it is. It keeps no route, so the K-1 is unsupported, as before.
- **15. Line 11, the start date for each prior year. Not now.** Source: "from the due date (not including extensions) of the return for the prior year" (`line-11::b01`). The engine uses April 15 after the prior year (`federal/8621/interest.ts`, `returnDueDate`). It does not move the date to the next business day (April 18, 2022) or to the COVID-19 postponed dates of the 2019 and 2020 returns (July 15, 2020 and May 17, 2021). The function is Form 8621's too, so a change moves that form; it is a few dollars of interest for those years. The blind fill uses the same dates.
- **16. Line 11, daily compounding or the Rev. Proc. 95-17 tables. Done.** Source: "Tables of interest factors to figure daily compound interest were published in Rev. Proc. 95-17" (`line-11::b01`). The engine compounds daily, as Form 8621 does, each day at its quarter's rate over 365 or 366. The tables give the same factors to their printed places: at most $1 on line 11 from rounding. The tables are not in the corpus.
- **17. Line 2, rounding each worksheet or the total. Done.** Source: "add the amounts on i from all worksheets and enter the total on line 2" (`part-i::b01`). The engine rounds each worksheet's i, then adds ($150 + $338 = $488). The blind fill kept the cents and rounded the total ($487.50, so $488). $1 at most on line 2.
- **18. Line 9 larger than line 8. Done.** Line 10 is "Net recapture. Subtract line 9 from line 7 or line 8. If less than zero, enter -0-" (`face-page-1::b02`), and line 13 subtracts "the amount on line 9 from the total of all prior year unused credits" (`line-13::b01`). Nothing caps line 9 at line 7 or line 8, so the engine does not cap it (unused $6,000, line 9 $1,602, line 8 $300: line 15 $4,398, not $5,700). The blind fill reads it the same way.

## Pattern change

These are the proposals for a discussion.

- **Form 8609 and Form 8609-A as input documents.** Before: the building fact holds what the owner's Form 8609 (items C to E), Form 8609-A (the Line 2 Worksheet amounts, the qualified basis) and Form 8586 (the credit each year) say. After: these become a new family of documents that Cade reads, with a generator for fake ones.
- **Form 8586 and Form 3800 in the engine.** Before: line 9 step 1 ("credits ... you could not use in prior years") and line 15 (the carryforward) use a stated amount. After: with those forms in the engine, the unused credits come from Form 3800's carryforward.
- **14. `roundDollars` and an exact product.** Before: `roundDollars` snaps to cents before it rounds, so a float sum such as 202,887.49999999997 does not round down by mistake, but an exact product of $17,819.496 (line 5: $53,512 × .333) becomes $17,820, where the IRS rule ("drop amounts under 50 cents") gives $17,819. After: a smaller snap (a millionth of a dollar) keeps the float fix and gives $17,819; it changes `money.ts`, which every form uses, and may move locked scenarios by $1.

## Second opinions

- **PolicyEngine-US 2.154.0** (commit 363e9fc5, sparse checkout of `variables/gov/irs` and `parameters/gov/irs`): it does not model the low-income housing credit, Form 8586 or Form 8611. A search for "low income housing", "8611", "8586" and "42(j)" finds nothing. No constant or formula to compare.
- **IRS Direct File**: not compared. It files simple returns only, and the low-income housing credit is outside its scope.
- **Form 8611 (Rev. 1-2006)**, the prior revision (https://www.stayexempt.irs.gov/pub/irs-prior/f8611--2006.pdf, not in the corpus): its Line 7 example agrees with the engine's line 6 and line 7 (doubts 1 and 2) and is a unit test.
- **The blind fill** (13 cases from the blank form and instructions only): no line differs by blank against 0. Three cases differ in dollars. Case 7 line 7 ($0 against $799) is doubt 2; the prior example decides for the engine. Cases 5 and 12 line 11 ($1) are doubt 3. Case 12 line 5 ($1) is doubt 14.
- **The second pass (2026-11-25):** every printed value of pedron's Form 8611, Schedule 2 and Form 1040 worked out again by hand; line 11 recomputed day by day in a separate script ($1,205.02). The three forms are the only ones that file, and nothing is pending.

## Confidence

| Field group | Confidence |
| --- | --- |
| Items A, B (names, number) | stated rule |
| Items C to F (building, bonds) | stated rule |
| Line 1, line 3 | stated rule |
| Line 2 and the Line 2 Worksheet | stated rule; decimals own reading (doubt 8, A33's rule) |
| Line 4 | stated rule (the table) |
| Lines 5 and 7 | published example with numbers (Rev. 1-2006) |
| Line 6 | published example with numbers (Rev. 1-2006); places decided (A33) |
| Line 8 | stated rule (the K-1 amount) |
| Line 9 | stated rule; K-1 decimals decided (A34) |
| Line 10, lines 12 to 15 | stated rule |
| Line 11 | stated rule; the share by year is own reading (doubt 3) |
| Lines 16, 17 | stated rule (blank on an individual return) |
| Schedule 2 line 16 | stated rule |
