# Form 8912: open questions

Form 8912 claims the credit for holders of tax credit bonds. Part III lists each Form 1097-BTC; Part IV figures the credit of each bond, or each pass-through credit, that no Form 1097-BTC reported. Part II limits the credit to the tax. The credit is also taxable interest.

The rule decisions (two texts that conflict, or a choice of method) are in `docs/rule-decisions.md` and in `DECISION` comments: `bonds.ts` (line 20 of a pass-through credit), `interest.ts` (which credits are interest), `credit.ts` (no current-year deduction of an unused CREB credit).

## Doubts with no conflicting text

### Column (e): the rounding of a prorated percentage

- Text: "38 days ... / 92 days ... = 0.413 x 25% (0.25) = 10%" (`irs-8912-inst-2025::sec::line-18-column-a::b03`). The 2011 instructions show ".913 x 25% = 23%" (84/92).
- No sentence states a rounding rule. Both examples round the fraction to 3 places and the percentage to a whole number.
- Default: the engine does the same (`proratedPercent` in `lines.ts`).
- Changes dollars: yes, a little. 10.33% against 10% on a $2,390 column (d) is $8.

### Example 2 leaves out December 15, 2017

- Text: the tax year is December 1, 2017 to November 30, 2018, and the table lists March 15, June 15 and September 15 for 60% (`line-18-column-a::b03`). December 15, 2017 is in that year, and the rule gives 25% "for each credit allowance date you hold" (`::b02`).
- Default: the engine follows the stated rule. The unit test checks the example's three dates.
- Changes dollars: no. The engine files calendar-year returns, where no such case arises.

### A sale on a credit allowance date

- Text: Example 1 counts "the day the bond was purchased as the first day on which the credit accrues" (`line-18-column-a::b02`).
- Default: on the day of a sale the buyer holds the bond, so the seller does not count that date.
- Changes dollars: yes, one 25% share moves between seller and buyer.

### Line 11 below zero

- Text: the "enter -0-" rule is written for estates, trusts and corporations only (`line-10b::b01`).
- Default: line 11 is never below 0 for an individual either. A negative line 11 would make line 12 a negative credit.
- Changes dollars: no; line 12 is 0 either way.

### Lines 5 and 6

- Text: they are for estates and trusts (`line-5::b01`).
- Default: blank on an individual's return.
- Changes dollars: no.

### More than 18 rows for one bond

- Part IV has 18 rows. The engine prints the first 18; line 19 adds every row. No text says how to continue a bond's rows.
- Changes dollars: no.

### Later copies print Part III even when it is empty

- A second Part IV needs a second copy; each later copy prints pages 2 and 3. Page 2 is then empty but for the name.
- Changes dollars: no.

### A bond sold between credit allowance dates

- Text: "part of the sales price is treated as accrued interest to the date of the sale and must be reported as interest income" (`line-20::b01`).
- Default: the engine adds no interest for the sale. A broker reports that interest on Form 1099-INT; a sale held directly goes on Form 8949 from its own facts.
- Changes dollars: yes, the accrued interest, when no Form 1099-INT reports it.

### The pass-through answers on a Form 1097-BTC

- The line 12 formula applies only to a CREB credit from a pass-through entity (`line-12::b03`). The Form 1097-BTC prints box 3 code 101 for a CREB and an "issuer is" checkbox, but not whether the distributor is a partnership or a broker.
- Default: for box 3 code 101, the engine asks whether the statement came from a pass-through entity, and then the taxable income of that interest. For box 3 code 199 it asks nothing.
- Changes dollars: yes, through the formula.

### Two statements from one entity

- Text: "Figure the credit limitation separately for each interest in a pass-through entity" (`line-12::b02`).
- Default: facts with the same identifying number are one interest; their credits add, and the first stated taxable income counts.
- Changes dollars: only if two facts state different taxable incomes for one entity.

### California

- The corpus has no California rule for this credit's interest. California follows the federal interest on Form 1040 line 2b, so no Schedule CA line changes.

## Proposals for a discussion

- **A K-1 credit route.** Form 1065 and Form 1120-S box 15 carry a bond credit (Form 8912), and the box tables have no route for it (`passThrough/partnershipBoxes.ts`). The engine takes such a credit only from a `tax_credit_bond` fact with `source: "pass_through"`. A route from the K-1 item to Form 8912 Part IV would read it from the K-1 itself. That is a change to the pass-through layer.
- **The unused CREB credit deduction.** A CREB or early QZAB credit that line 12 cannot use is deducted, this year or next (`line-12::b01`). The engine takes no deduction this year (rule decision). Next year's deduction needs a prior-year fact and a line on the return; the instructions do not name the line.
- **Accrued interest at purchase.** A bond bought between credit allowance dates makes part of the deemed interest a return of capital (`line-20::b02`). The engine shows that interest row as a gap. A fact field for the accrued interest paid at purchase would close it.

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
