# Form 8912: open questions

Form 8912 claims the credit for holders of tax credit bonds. Part III lists each Form 1097-BTC; Part IV figures the credit of each bond, or each pass-through credit, that no Form 1097-BTC reported. Part II limits the credit to the tax. The credit is also taxable interest.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

- **Line 20 of a pass-through credit** (row A58, `bonds.ts`). The face takes 70% of line 19 for a new CREB or a QECB; the instructions say a pass-through credit goes in column (f) as the credit. The engine takes no second 70%.
- **Which credits are interest** (row A59, `interest.ts`). The Form 8912 instructions make the whole line 4 interest; the Form 1099-INT and 1097-BTC instructions put each reported credit on a Form 1099-INT already. The engine adds only each held bond's line 20 that no Form 1099-INT reports.
- **An unused CREB credit: deduct this year or next** (row A60, `credit.ts`). The instructions allow both. The engine always takes next year, so line 12 is figured once.

## Should we do this now

### Column (e): the rounding of a prorated percentage

- Text: "38 days ... / 92 days ... = 0.413 x 25% (0.25) = 10%" (`irs-8912-inst-2025::sec::line-18-column-a::b03`). The 2011 instructions show ".913 x 25% = 23%" (84/92). No sentence states a rounding rule.
- Done: the engine rounds the fraction to 3 places and the percentage to a whole number, as both examples do (`proratedPercent` in `lines.ts`). 10.33% against 10% on a $2,390 column (d) is $8.

### Line 20: the 70% of a rounded line 19

- The instructions give no rounding rule. Column (f) 877.50 prints 878; 878 x 70% = 614.60 = 615. Keeping the cents gives 614.
- Done: the engine rounds each printed line (the Form 1040 rule) and multiplies the printed line 19. The blind fill did the same. At most $1.

### Line 10e when lines 10a to 10d are blank

- The form says "Add lines 10a through 10d". The engine prints 0; a preparer may leave it blank.
- Not now: it changes no dollars.

### Example 2 leaves out December 15, 2017

- Text: the tax year is December 1, 2017 to November 30, 2018, and the table lists only March 15, June 15 and September 15 (`line-18-column-a::b03`); the rule gives 25% "for each credit allowance date you hold" (`::b02`).
- Done: the engine follows the stated rule, and the unit test checks the example's three dates. A calendar-year return never meets the case.

### A sale on a credit allowance date

- Text: Example 1 counts "the day the bond was purchased as the first day on which the credit accrues" (`line-18-column-a::b02`).
- Done: on the day of a sale the buyer holds the bond, so the seller does not count that date. One 25% share moves between seller and buyer.

### Line 11 below zero

- Text: the "enter -0-" rule is written for estates, trusts and corporations only (`line-10b::b01`).
- Done: line 11 is never below 0 for an individual either; line 12 is 0 either way.

### Lines 5 and 6

- Text: they are for estates and trusts (`line-5::b01`).
- Done: blank on an individual's return.

### Line 17 for a bond that matured

- Text: "If the bond was redeemed, sold, or otherwise disposed of, enter the date" (`line-17::b01`). Line 16b already holds the maturity date.
- Not now: the engine prints line 17 only for a sale or a redemption the facts state, not for a maturity. It changes no dollars.

### More than 18 rows for one bond

- Part IV prints 18 rows of line 18, and no text says how to continue one bond's rows.
- Done: with more rows, line 19 is unsupported (the printed rows would not add up to it), and line 20 and Part I still add every row (unit test). A separate Part IV is for each bond, so the copies mechanism does not split one bond.

### More than 20 Forms 1097-BTC, or more than one Part IV

- Done: the copies mechanism (`copies.ts`) prints another page 2 for each 20 rows of Part III and another page 3 for each Part IV; Part I adds every copy.
- A later copy prints its Part III page even when it has no rows (name only). Not now: it changes no dollars.

### A bond's interest the engine cannot figure

- A bond bought in 2025 between credit allowance dates makes part of its deemed interest a return of capital (`line-20::b02`), so its Schedule B row is unsupported.
- Done: that gap files Schedule B by itself, so the gap shows on line 1 rather than as a blank Form 1040 line 2b (unit test).

### A bond sold between credit allowance dates

- Text: "part of the sales price is treated as accrued interest to the date of the sale and must be reported as interest income" (`line-20::b01`).
- Not now: a broker reports that interest on Form 1099-INT, and a direct sale goes on Form 8949 from its own facts. The engine adds no interest for the sale.

### A build America bond sold during the year

- The engine gives a build America bond 100% for each row the facts list. The holder lists one row for each interest payment date held.
- Not now: the holder's rows are the dates held, so the engine needs no sale date for it.

### The pass-through answers on a Form 1097-BTC

- The line 12 formula applies only to a CREB credit from a pass-through entity (`line-12::b03`). The Form 1097-BTC prints box 3 code 101 for a CREB and the "Form 1097-BTC issuer is" boxes, but not whether a distributor is a partnership or a broker.
- Done: for box 3 code 101, a statement from the bond's issuer or its agent is not from a pass-through entity, and nothing is asked. A statement from a distributor asks whether it came from a pass-through entity, and then the taxable income of that interest. Box 3 code 199 asks nothing.

### Two statements from one entity

- Text: "Figure the credit limitation separately for each interest in a pass-through entity" (`line-12::b02`).
- Done: facts with the same identifying number are one interest; their credits add, and the first stated taxable income counts. It changes dollars only if two facts state different taxable incomes for one entity.

### California

- The corpus has no California rule for this credit's interest. California follows the federal interest on Form 1040 line 2b, so no Schedule CA line changes. Nothing to do.

## Pattern change

### Proposals for a discussion

- **A K-1 credit route.** Before: a bond credit on a Form 1065 or 1120-S K-1 (box 15) reaches Form 8912 only from a `tax_credit_bond` fact with `source: "pass_through"`, because the box tables have no route for it (`passThrough/partnershipBoxes.ts`). After: a route from the K-1 item to a Form 8912 Part IV reads the credit from the K-1 itself, a change to the pass-through layer.
- **The unused CREB credit deduction.** Before: a CREB or early QZAB credit that line 12 cannot use is not deducted this year (rule decision A60), and next year's return does not read it. After: a prior-year fact and a deduction line on the return take it in the next year; the instructions do not name the line.
- **Accrued interest at purchase.** Before: a bond bought between credit allowance dates makes its interest row a gap. After: a fact field for the accrued interest paid at purchase closes the gap (`line-20::b02`).
- **A gap on Form 1040 line 2b.** Before: the Form 1040 interest slot is a dollar amount, so an interest gap leaves line 2b blank while Schedule B shows the gap. After: the slot carries the gap, so line 2b is unsupported too; that is a change to Form 1040.

## Second opinions

- **Blind fill (2026-11-26).** A preparer filled 15 cases from the blank form and the instructions only. No line differs in dollars. Line 10e differs 11 times as blank against 0 (above). The preparer's dollar doubts (the column (e) rounding, a purchase on a credit allowance date, the 70% of a rounded line 19, the 70% on a pass-through credit, line 11 below zero) match the engine's defaults and are listed here or in the rule decisions.
- **PolicyEngine-US 2.154.1** (commit 0fbed6dd, `variables/gov/irs` and `parameters/gov/irs`): it does not model this credit. No variable or parameter names a tax credit bond, Form 8912 or Form 1097-BTC. Nothing to compare.
- **IRS Direct File** (`IRS-Public/direct-file`, searched on GitHub): it has no Form 8912 logic. It reads only the Form 1099-INT "Tax Exempt And Tax Credit Bond CUSIP No" field. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Line 18 column (e), 25% per date and prorations | published example with numbers (Examples 1 and 2, and the 2011 example) |
| Line 18 columns (b), (c), (d), (f); line 19 | stated rule (the form's arithmetic) |
| Line 20, the 70% for a new CREB or QECB | stated rule; own reading for a pass-through credit (rule decision) |
| Lines 13 and 14 (Part III) | stated rule |
| Lines 15a to 17 | stated rule |
| Lines 1 to 4 | stated rule |
| Lines 5 and 6 | stated rule (estates and trusts only; blank) |
| Lines 7 to 11 | stated rule |
| Line 12 and the pass-through formula | stated rule; own reading for grouping by entity |
| Schedule B row and Form 1040 line 2b | own reading (rule decision) |
| Schedule 3 line 6k | stated rule |
| Headers | stated rule |
